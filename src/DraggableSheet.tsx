import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useContext,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ScrollViewProps } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, space } from './theme';

const OVERDRAG = 0.35;
const VELOCITY_PROJECTION = 140;
const FULL_ZONE = 0.15;
const CLOSE_ZONE = 0.75;
const FLICK = 0.45;

// A sheet that moves like the ones people are used to on iOS: it springs up
// from fully off-screen while the backdrop fades in, and springs back down
// before it is removed. Springs (not fixed-duration tweens) are what make the
// motion feel physical rather than abrupt.
const OPEN_SPRING = { damping: 22, stiffness: 210, mass: 0.9 };
const CLOSE_SPRING = { damping: 26, stiffness: 240, mass: 0.9 };
const BACKDROP_OPACITY = 0.4;
// Comfortably below the bottom edge on any device (values are dp).
const OFFSCREEN = 2000;

export function calculateDestination(
  position: number,
  velocity: number,
  height: number
): number {
  'worklet';
  // Normalize velocity: RNGH Gesture.Pan provides velocity in px/s (e.g. 500 px/s),
  // while legacy flick calculation expects px/ms (e.g. 0.5 px/ms).
  // If magnitude is > 10, normalize from px/s to px/ms.
  const v = Math.abs(velocity) > 10 ? velocity / 1000 : velocity;
  const projected = position + v * VELOCITY_PROJECTION;
  const flickUp = v < -FLICK;
  const flickDown = v > FLICK;

  if (flickUp || projected <= height * FULL_ZONE) {
    return 0;
  } else if (flickDown || projected >= height * CLOSE_ZONE) {
    return height;
  } else {
    return Math.max(0, Math.min(height, position));
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  children: React.ReactNode;
  dragEnabled?: boolean;
  fullScreen?: boolean;
};

export const SheetContext = React.createContext<{
  scrollViewRef: React.RefObject<any>;
  scrollOffset: Animated.SharedValue<number>;
} | null>(null);

export const SheetScrollView = React.forwardRef<any, ScrollViewProps>(
  (props, ref) => {
    const ctx = useContext(SheetContext);

    const setScrollViewRef = (node: any) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        ref.current = node;
      }

      if (ctx?.scrollViewRef) {
        ctx.scrollViewRef.current = node;
      }
    };

    const handleScroll = (event: any) => {
      if (ctx) {
        ctx.scrollOffset.value = event.nativeEvent.contentOffset.y;
      }

      if (props.onScroll) {
        props.onScroll(event);
      }
    };

    if (!ctx) {
      return React.createElement(RNGHScrollView, { ...props, ref });
    }

    return React.createElement(RNGHScrollView, {
      ...props,
      ref: setScrollViewRef,
      onScroll: handleScroll,
      scrollEventThrottle: 16,
      bounces: false,
    });
  }
);

export function DraggableSheet({
  visible,
  onClose,
  onSave,
  title,
  children,
  dragEnabled = true,
  fullScreen = false,
}: Props) {
  const [containerHeight, setContainerHeight] = useState(0);
  const translateY = useSharedValue(OFFSCREEN);
  const scrollOffset = useSharedValue(0);
  const isDraggingSheet = useSharedValue(false);
  const scrollViewRef = useRef<any>(null);
  const closingRef = useRef(false);
  const openedRef = useRef(false);

  // Where the sheet rests when open: a peek of the screen for normal sheets,
  // the very top for full-screen ones.
  const restPosition = useCallback(
    (h: number) => (fullScreen ? 0 : Math.round(h * 0.28)),
    [fullScreen]
  );

  // Spring down, then hand control back to the caller (close, or close after
  // saving) so the exit is animated instead of the sheet vanishing.
  const animateOut = useCallback(
    (after: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      const h = containerHeight || 1;
      translateY.value = withSpring(h, CLOSE_SPRING, finished => {
        if (finished) {
          runOnJS(after)();
        }
      });
    },
    [containerHeight, translateY]
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    onSave();
  }, [onSave]);

  // Open: place the sheet just off the bottom edge, then spring it into place.
  // This must run exactly ONCE per open. `containerHeight` is re-measured when
  // the keyboard resizes the window, and the old version re-ran this effect on
  // every change - which slammed the sheet back down and made it "snap".
  useEffect(() => {
    if (!visible) {
      openedRef.current = false;
      closingRef.current = false;
      translateY.value = OFFSCREEN;
      return;
    }
    if (openedRef.current || containerHeight <= 0) return;
    openedRef.current = true;
    closingRef.current = false;
    translateY.value = OFFSCREEN;
    translateY.value = withSpring(restPosition(containerHeight), OPEN_SPRING);
  }, [visible, containerHeight, restPosition, translateY]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const panGesture = Gesture.Pan()
    .enabled(dragEnabled)
    .simultaneousWithExternalGesture(scrollViewRef)
    .onStart(() => {
      isDraggingSheet.value = false;
      runOnJS(dismissKeyboard)();
    })
    .onChange(event => {
      const h = containerHeight || 1;
      const atTop = scrollOffset.value <= 0;
      const pullingDown = event.changeY > 0;
      const notFull = translateY.value > 0;

      if (notFull || (atTop && pullingDown) || isDraggingSheet.value) {
        isDraggingSheet.value = true;
        let next = translateY.value + event.changeY;

        if (next < 0 || next > h) {
          next = translateY.value + event.changeY * OVERDRAG;
        }

        translateY.value = next;
      }
    })
    .onEnd(event => {
      const h = containerHeight || 1;
      if (isDraggingSheet.value) {
        const dest = calculateDestination(
          translateY.value,
          event.velocityY / 1000,
          h
        );
        if (dest === h) {
          translateY.value = withSpring(h, CLOSE_SPRING, finished => {
            if (finished) runOnJS(handleClose)();
          });
        } else {
          translateY.value = withSpring(dest, OPEN_SPRING);
        }
      } else if (translateY.value < 0) {
        translateY.value = withSpring(0, OPEN_SPRING);
      } else if (translateY.value > h) {
        translateY.value = withSpring(h, OPEN_SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // The backdrop fades with the sheet, so the two move as one object.
  const backdropStyle = useAnimatedStyle(() => {
    const h = containerHeight || 1;
    const rest = fullScreen ? 0 : h * 0.28;
    const opacity = interpolate(
      translateY.value,
      [h, rest],
      [0, BACKDROP_OPACITY],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return React.createElement(
    Modal,
    {
      visible,
      animationType: 'none',
      transparent: true,
      statusBarTranslucent: true,
      onRequestClose: () => animateOut(handleClose),
    },
    React.createElement(
      GestureHandlerRootView,
      { style: styles.modalRoot },
      React.createElement(
        View,
        {
          style: styles.overlay,
          onLayout: event => {
            const h = event.nativeEvent.layout.height;
            if (h > 0 && h !== containerHeight) setContainerHeight(h);
          },
        },
        React.createElement(
          Animated.View,
          { style: [styles.backdrop, backdropStyle] },
          React.createElement(Pressable, {
            style: styles.backdropPress,
            onPress: () => animateOut(handleClose),
          })
        ),
        React.createElement(
          KeyboardAvoidingView,
          {
            behavior: Platform.OS === 'ios' ? 'padding' : undefined,
            style: styles.keyboardView,
            pointerEvents: 'box-none',
          },
          React.createElement(
            GestureDetector,
            { gesture: panGesture },
            React.createElement(
              Animated.View,
              {
                style: [
                  styles.sheet,
                  sheetStyle,
                  { height: containerHeight || undefined },
                ],
              },
              React.createElement(
                View,
                { style: styles.handleArea },
                React.createElement(View, { style: styles.handle }),
                React.createElement(
                  View,
                  { style: styles.header },
                  React.createElement(
                    TouchableOpacity,
                    {
                      onPress: () => animateOut(handleClose),
                      style: styles.headerButton,
                      hitSlop: 8,
                    },
                    React.createElement(Text, { style: styles.headerButtonText }, 'Cancel')
                  ),
                  React.createElement(Text, { style: styles.title }, title),
                  React.createElement(
                    TouchableOpacity,
                    {
                      onPress: () => animateOut(handleSave),
                      style: styles.headerButton,
                      hitSlop: 8,
                    },
                    React.createElement(
                      Text,
                      { style: [styles.headerButtonText, styles.headerButtonStrong] },
                      'Save'
                    )
                  )
                )
              )
            ),
            React.createElement(
              SheetContext.Provider,
              { value: { scrollViewRef, scrollOffset } },
              children
            )
          )
        )
      )
    )
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropPress: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleArea: {
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.dim2,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sep,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: colors.blue,
  },
  headerButtonStrong: {
    fontWeight: '600',
  },
});

import React, { useCallback, useEffect, useState, useRef, useContext } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ScrollViewProps } from 'react-native';
import {
  Gesture,
  GestureDetector,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { colors, space } from './theme';

const OVERDRAG = 0.35;
const VELOCITY_PROJECTION = 140;
const FULL_ZONE = 0.15;
const CLOSE_ZONE = 0.75;
const FLICK = 0.45;
const SNAP_MS = 240;

export function calculateDestination(position: number, velocity: number, height: number): number {
  'worklet';
  const projected = position + velocity * VELOCITY_PROJECTION;
  const flickUp = velocity < -FLICK;
  const flickDown = velocity > FLICK;

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

const AnimatedScrollView = Animated.createAnimatedComponent(RNGHScrollView);

export const SheetScrollView = React.forwardRef<any, ScrollViewProps>((props, ref) => {
  const ctx = useContext(SheetContext);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (ctx && ctx.scrollOffset) {
        ctx.scrollOffset.value = e.contentOffset.y;
      }
    },
  });

  if (!ctx) {
    return <RNGHScrollView ref={ref} {...props} />;
  }

  return (
    <AnimatedScrollView
      ref={(node: any) => {
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;

        if (ctx.scrollViewRef) ctx.scrollViewRef.current = node;
      }}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      bounces={false}
      {...props}
    />
  );
});

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
  const translateY = useSharedValue(9999);

  // Track state to handle drag correctly
  const scrollOffset = useSharedValue(0);
  const isDraggingSheet = useSharedValue(false);
  const scrollViewRef = useRef<any>(null);

  const settle = useCallback((toValue: number, callback?: () => void) => {
    translateY.value = withTiming(
      toValue,
      {
        duration: SNAP_MS,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          if (callback) {
            runOnJS(callback)();
          }
        }
      }
    );
  }, [translateY]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible && containerHeight > 0) {
      translateY.value = containerHeight;
      const rest = fullScreen ? 0 : Math.round(containerHeight * 0.28);
      settle(rest);
    }
  }, [visible, containerHeight, settle, translateY, fullScreen]);

  const panGesture = Gesture.Pan()
    .enabled(dragEnabled)
    .simultaneousWithExternalGesture(scrollViewRef)
    .onStart(() => {
      isDraggingSheet.value = false;
    })
    .onChange((event) => {
      const h = containerHeight || 1;

      // Determine if we should drag the sheet
      // We drag the sheet if:
      // 1. The sheet is not fully open (translateY.value > 0)
      // 2. We are already dragging the sheet this gesture
      // 3. The scroll view is at the top (or bounced past) and pulling DOWN
      const atTop = scrollOffset.value <= 0;
      const pullingDown = event.changeY > 0;
      const notFull = translateY.value > 0;

      if (notFull || (atTop && pullingDown) || isDraggingSheet.value) {
        isDraggingSheet.value = true;
        let next = translateY.value + event.changeY;

        if (next < 0) {
          // overdrag top
          next = translateY.value + event.changeY * OVERDRAG;
        } else if (next > h) {
          // overdrag bottom
          next = translateY.value + event.changeY * OVERDRAG;
        }

        translateY.value = next;
      }
    })
    .onEnd((event) => {
      if (isDraggingSheet.value) {
        const h = containerHeight || 1;
        const dest = calculateDestination(translateY.value, event.velocityY, h);

        if (dest === h) {
          runOnJS(settle)(h, handleClose);
        } else {
          runOnJS(settle)(dest);
        }
      } else {
        // If we just clicked/tapped or scrolled normally without dragging the sheet,
        // snap back to bounds if we somehow went out.
        const h = containerHeight || 1;
        if (translateY.value < 0) {
          runOnJS(settle)(0);
        } else if (translateY.value > h) {
          runOnJS(settle)(h);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={styles.overlay}
        onLayout={event => {
          const h = event.nativeEvent.layout.height;
          setContainerHeight(h);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheet,
                animatedStyle,
                { height: containerHeight || undefined },
              ]}
            >
              <View style={styles.handleArea}>
                <View style={styles.handle} />
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.headerButton}
                    hitSlop={8}
                  >
                    <Text style={styles.headerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity
                    onPress={onSave}
                    style={styles.headerButton}
                    hitSlop={8}
                  >
                    <Text
                      style={[styles.headerButtonText, styles.headerButtonStrong]}
                    >
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <SheetContext.Provider value={{ scrollViewRef, scrollOffset }}>
                {children}
              </SheetContext.Provider>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
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

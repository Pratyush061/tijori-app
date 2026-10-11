import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, space } from './theme';

/**
 * A draggable bottom sheet.
 *
 * The sheet is a full-height panel slid down with a transform (a transform is
 * far cheaper to animate than a height, which forces a layout pass every frame).
 *
 * The drag follows the finger 1:1, with resistance past the ends so it never
 * feels like it has hit a wall. On release the position is projected forward
 * using the finger's velocity - the same approach native sheets use - and then
 * it either fills the screen, closes, or stays where it was let go.
 */

const OVERDRAG = 0.35; // how much of an over-drag actually moves
const VELOCITY_PROJECTION = 140; // ms of "flick" carried into the release
const FULL_ZONE = 0.15; // released within 15% of the top -> full screen
const CLOSE_ZONE = 0.75; // released within 25% of the bottom -> close
const FLICK = 0.45; // px/ms that counts as a flick
const SNAP_MS = 240;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  children: React.ReactNode;
};

export function DraggableSheet({
  visible,
  onClose,
  onSave,
  title,
  children,
}: Props) {
  // Measured from the modal's own layout, so "full screen" really is the whole
  // screen - not the window minus the system bars.
  const [containerHeight, setContainerHeight] = useState(
    Dimensions.get('window').height,
  );
  const heightRef = useRef(Dimensions.get('window').height);

  const translateY = useRef(new Animated.Value(0)).current;
  const currentY = useRef(0);
  const dragStartY = useRef(0);

  const restY = useCallback(() => Math.round(heightRef.current * 0.28), []);

  const settle = useCallback(
    (toValue: number, after?: () => void) => {
      currentY.current = toValue;
      Animated.timing(translateY, {
        toValue,
        duration: SNAP_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && after) {
          after();
        }
      });
    },
    [translateY],
  );

  const settleRef = useRef(settle);
  settleRef.current = settle;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const panResponder = useRef(
    PanResponder.create({
      // Capture the gesture only once it is clearly a vertical drag, so taps on
      // Cancel / Save still reach their buttons but dragging anywhere on the
      // handle or header moves the sheet.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        translateY.stopAnimation(value => {
          dragStartY.current = value;
          currentY.current = value;
        });
      },
      onPanResponderMove: (_e, g) => {
        const h = heightRef.current || 1;
        let next = dragStartY.current + g.dy;
        if (next < 0) {
          next = next * OVERDRAG;
        } else if (next > h) {
          next = h + (next - h) * OVERDRAG;
        }
        currentY.current = next;
        translateY.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const h = heightRef.current || 1;
        // Project the release forward using the finger's velocity.
        const projected = currentY.current + g.vy * VELOCITY_PROJECTION;

        const flickUp = g.vy < -FLICK;
        const flickDown = g.vy > FLICK;

        if (flickUp || projected <= h * FULL_ZONE) {
          settleRef.current(0);
        } else if (flickDown || projected >= h * CLOSE_ZONE) {
          settleRef.current(h, () => onCloseRef.current());
        } else {
          // Keep it where it was let go.
          settleRef.current(Math.max(0, Math.min(h, currentY.current)));
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible && heightRef.current > 0) {
      const rest = restY();
      translateY.setValue(heightRef.current);
      currentY.current = heightRef.current;
      dragStartY.current = rest;
      settle(rest);
    }
  }, [visible, heightRef, restY, settle, translateY]);

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
          heightRef.current = h;
          setContainerHeight(h);
          if (visible) {
            const rest = Math.round(h * 0.28);
            translateY.setValue(h);
            currentY.current = h;
            dragStartY.current = rest;
            settle(rest);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                height: containerHeight || undefined,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.handleArea} {...panResponder.panHandlers}>
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

            {children}
          </Animated.View>
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

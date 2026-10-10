import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
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

const SCREEN_HEIGHT = Dimensions.get('window').height;
const FULL_AT = SCREEN_HEIGHT * 0.06;
const REST_TRANSLATE = SCREEN_HEIGHT * 0.28;
const DISMISS_AT = SCREEN_HEIGHT * 0.75;

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
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const currentY = useRef(SCREEN_HEIGHT);
  const dragStart = useRef(SCREEN_HEIGHT);

  const settle = React.useCallback(
    (toValue: number, cb?: () => void) => {
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start(() => {
        currentY.current = toValue;
        if (cb) {
          cb();
        }
      });
    },
    [translateY]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        translateY.stopAnimation(value => {
          dragStart.current = value;
          currentY.current = value;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(
          SCREEN_HEIGHT,
          Math.max(0, dragStart.current + g.dy),
        );
        currentY.current = next;
        translateY.setValue(next);
      },
      onPanResponderRelease: () => {
        const y = currentY.current;
        if (y <= FULL_AT) {
          settle(0);
        } else if (y >= DISMISS_AT) {
          settle(SCREEN_HEIGHT, onClose);
        } else {
          settle(y);
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      settle(REST_TRANSLATE);
    }
  }, [visible, translateY, settle]);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.sheet,
              { height: SCREEN_HEIGHT, transform: [{ translateY }] },
            ]}
          >
            <View style={styles.grabberArea} {...panResponder.panHandlers}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onSave} style={styles.headerButton}>
                <Text
                  style={[styles.headerButtonText, styles.headerButtonStrong]}
                >
                  Save
                </Text>
              </TouchableOpacity>
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
  grabberArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.dim2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.lg,
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

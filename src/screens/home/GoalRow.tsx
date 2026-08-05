import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import type { WellnessGoal } from '@/state/useWellnessStore';

interface GoalRowProps {
  goal: WellnessGoal;
  onToggle: (id: string) => void;
  isLast: boolean;
}

export function GoalRow({ goal, onToggle, isLast }: GoalRowProps) {
  const checkScale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const wasDone = useRef(goal.done);

  useEffect(() => {
    // bounce the checkbox whenever done-state flips
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();

    // float the "+XP" text up only when transitioning false -> true
    if (!wasDone.current && goal.done) {
      floatAnim.setValue(0);
      Animated.timing(floatAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    }
    wasDone.current = goal.done;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.done]);

  return (
    <Pressable
      onPress={() => onToggle(goal.id)}
      style={[styles.row, !isLast && styles.divider]}
    >
      <Animated.View
        style={[
          styles.checkbox,
          goal.done && styles.checkboxDone,
          { transform: [{ scale: checkScale }] },
        ]}
      >
        {goal.done && <Text style={styles.checkmark}>✓</Text>}
      </Animated.View>

      <Text style={[styles.label, goal.done && styles.labelDone]}>{goal.label}</Text>

      <View>
        <Text style={styles.xp}>+{goal.xp}</Text>
        <Animated.Text
          style={[
            styles.floatXp,
            {
              opacity: floatAnim.interpolate({
                inputRange: [0, 0.15, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -32],
                  }),
                },
              ],
            },
          ]}
        >
          +{goal.xp} XP
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const CHECK_SIZE = 23;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: 11,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  checkbox: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    borderWidth: 2.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  labelDone: {
    color: colors.inkFaint,
    textDecorationLine: 'line-through',
  },
  xp: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.sage,
  },
  floatXp: {
    position: 'absolute',
    right: 0,
    top: 0,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.sage,
  },
});

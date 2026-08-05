import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import type { Recommendation } from '@/utils/recommendationEngine';

interface RecommendationCardProps {
  recommendation: Recommendation;
  /** Resolves recommendation.action.route/params to a real navigation.navigate() call - that
   * resolution belongs to HomeScreen (which has the typed navigation prop), not this component. */
  onAction: () => void;
}

const ACTION_LABELS: Record<Recommendation['action']['type'], string> = {
  CHECK_IN: 'Check in',
  BREATHING: 'Start breathing',
  JOURNAL: 'Write it down',
  HABIT: 'Open habits',
  SLEEP: 'Log sleep',
  GRATITUDE: 'Add gratitude',
  COMMUNITY: 'Open community',
  COUNSELLOR: 'Find support',
  WELLNESS_TREE: 'View tree',
};

export function RecommendationCard({ recommendation, onAction }: RecommendationCardProps) {
  return (
    <Card tint="sage" style={styles.card}>
      <Text style={styles.eyebrow}>Today's Focus</Text>
      <Text style={styles.title}>{recommendation.title}</Text>
      <Text style={styles.message}>{recommendation.message}</Text>
      <View style={styles.buttonWrap}>
        <Button label={ACTION_LABELS[recommendation.action.type]} variant="primary" onPress={onAction} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  buttonWrap: {
    alignSelf: 'flex-start',
  },
});

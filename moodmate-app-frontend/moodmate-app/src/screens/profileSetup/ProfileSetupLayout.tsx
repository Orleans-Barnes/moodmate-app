import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, fonts, fontSizes, calm } from '@/theme/tokens';
import { ProgressBar } from '@/components/ProgressBar';
import { BackButton } from '@/components/BackButton';

interface ProfileSetupLayoutProps {
  children: ReactNode;
  /** 0–100. Animates via ProgressBar's own Animated.timing — pass the server's
   * profileCompletion (or a locally-estimated interim value) after every successful save,
   * never a client-maintained independent counter. */
  progress: number;
  stepLabel: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Rendered pinned to the bottom, outside the scroll area (e.g. a primary CTA button). */
  footer?: ReactNode;
}

/**
 * Shared chrome for every ProfileSetup screen: back button + step label, progress bar,
 * title/subtitle, scrollable body, optional pinned footer — Calm Forest styling (Figma
 * "11 Stress Baseline" header pattern applied to every step, not just that one screen).
 */
export function ProfileSetupLayout({
  children,
  progress,
  stepLabel,
  title,
  subtitle,
  onBack,
  footer,
}: ProfileSetupLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        {onBack ? <BackButton onPress={onBack} /> : <View style={styles.backSpacer} />}
        <Text style={styles.stepLabel}>{stepLabel}</Text>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} fillColor={calm.primary} trackColor={calm.track} height={8} />
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.body}>{children}</View>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>{footer}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: calm.bg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backSpacer: { width: 44, height: 44 },
  stepLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.muted,
  },
  progressWrap: {
    marginTop: spacing.lg,
  },
  titleWrap: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.xxl + 4,
    lineHeight: 36,
    color: calm.forest,
    letterSpacing: -0.42,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 1,
    color: calm.muted,
    lineHeight: 22,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingTop: spacing.md,
  },
});

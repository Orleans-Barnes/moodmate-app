import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fonts, fontSizes } from '@/theme/tokens';
import { ProgressBar } from '@/components/ProgressBar';

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
 * Shared chrome for every ProfileSetup screen: progress bar + step label at top, back button,
 * title/subtitle, scrollable body, optional pinned footer. Screens themselves only supply their
 * chip grid / content — this owns the "guided journey, not a form" framing (progress always
 * visible, consistent back affordance, room to breathe) called for in the Phase 1C-iii UX
 * direction.
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
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Text style={styles.backTxt}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.stepLabel}>{stepLabel}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} fillColor={colors.sage} />
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
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: {
    fontSize: 24,
    color: colors.ink,
    fontFamily: fonts.bodyBold,
  },
  stepLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkFaint,
  },
  progressWrap: {
    marginTop: spacing.md,
  },
  titleWrap: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingTop: spacing.md,
  },
});

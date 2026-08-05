import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calm, fonts, fontSizes, spacing, headerCurve } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';

interface CurvedForestHeaderProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Background of the screen below the scoop curve */
  contentBg?: string;
  /** Extra padding inside the green block, above the curve */
  bottomPadding?: number;
  /** Optional title row — back + centred title + right slot */
  title?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  /** Subtitle under title (wallet balance label, etc.) */
  subtitle?: string;
}

/**
 * WhatsApp-inspired forest header with a straight bottom edge into content.
 * Used on auth screens, wallet/purchase history, and any inner screen that needs
 * the branded green tab look instead of a flat straight edge.
 */
export function CurvedForestHeader({
  children,
  style,
  contentBg = calm.bg,
  bottomPadding = spacing.xl,
  title,
  onBack,
  rightSlot,
  subtitle,
}: CurvedForestHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { backgroundColor: contentBg }, style]}>
      <LinearGradient
        colors={[calm.forest, calm.forestPanel]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />

        {(title || onBack) && (
          <View style={styles.navRow}>
            {onBack ? <BackButton onPress={onBack} inverted /> : <View style={styles.navSpacer} />}
            <View style={styles.titleBlock}>
              {title ? (
                <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
                  {title}
                </Text>
              ) : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {rightSlot ?? <View style={styles.navSpacer} />}
          </View>
        )}

        {children}
      </LinearGradient>
    </View>
  );
}

const NAV_SIZE = 44;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  gradient: {
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  orbLarge: {
    position: 'absolute',
    top: -36,
    right: -48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  orbSmall: {
    position: 'absolute',
    bottom: 48,
    left: -36,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(37,211,102,0.14)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  navSpacer: {
    width: NAV_SIZE,
    height: NAV_SIZE,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: calm.mutedOnDark,
    marginTop: 2,
  },
});

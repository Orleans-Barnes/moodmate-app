/**
 * JournalVoiceScreen - demo-safe placeholder while transcription is disabled.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { calm, colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'JournalVoice'>;

export function JournalVoiceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={s.closeBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close voice journal"
        >
          <Ionicons name="close" size={23} color={calm.forest} />
        </Pressable>
        <Text style={s.headerTitle}>Voice journal</Text>
        <View style={s.headerSpacer} />
      </View>

      <View style={s.card}>
        <View style={s.iconWrap}>
          <Ionicons name="mic-outline" size={30} color={calm.primary} />
        </View>
        <Text style={s.title}>Voice transcription coming soon</Text>
        <Text style={s.body}>
          Text journaling is ready for today. Voice notes are being polished and will be switched on after the demo.
        </Text>
      </View>

      <Pressable
        style={s.primaryBtn}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Return to text journal"
      >
        <Text style={s.primaryText}>Return to text journal</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: calm.bg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  closeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: calm.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displaySemibold,
    fontSize: fontSizes.md,
    color: calm.ink,
  },
  headerSpacer: {
    width: 52,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: calm.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: calm.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: fontSizes.lg,
    lineHeight: 26,
    color: calm.forest,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: calm.muted,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: spacing.lg,
    minHeight: 54,
    borderRadius: radii.pill,
    backgroundColor: calm.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },
});

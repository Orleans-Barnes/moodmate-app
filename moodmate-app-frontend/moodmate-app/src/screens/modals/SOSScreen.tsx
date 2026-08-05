import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { listSosResources } from '@/api/sos';
import type { SosResourceView } from '@/api/types';
import { useToast } from '@/state/useToast';
import { fonts, fontSizes, spacing, radii, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SOS'>;

// Hardcoded international fallbacks — always shown even if backend/network is offline.
// A crisis screen must NEVER be blank.
const FALLBACK_RESOURCES: SosResourceView[] = [
  { id: -1, name: 'Befrienders Worldwide', description: 'Find your local crisis helpline', phone: null, url: 'https://www.befrienders.org/find-a-helpline', country: 'Global' },
  { id: -2, name: 'Crisis Text Line', description: 'Text-based crisis support', phone: null, url: 'https://www.crisistextline.org/', country: 'Global' },
  { id: -3, name: 'International Emergency', description: 'Emergency services', phone: '112', url: null, country: 'Global' },
];

export function SOSScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [resources, setResources] = useState<SosResourceView[]>([]);

  useEffect(() => {
    listSosResources()
      .then((live) => setResources(live.length > 0 ? live : FALLBACK_RESOURCES))
      .catch(() => setResources(FALLBACK_RESOURCES));
  }, []);

  const openResource = (resource: SosResourceView) => {
    if (resource.phone) {
      Linking.openURL(`tel:${resource.phone.replace(/\s+/g, '')}`).catch(() => toast(`Couldn't open the dialer. Call ${resource.phone} directly.`));
    } else if (resource.url) {
      Linking.openURL(resource.url).catch(() => toast("Couldn't open that link."));
    }
  };

  const primaryResource = resources[0];
  const clinicResource = resources.find((r) => r.phone && r !== primaryResource);

  const OPTIONS = [
    {
      key: 'breathe', icon: 'radio-button-on-outline' as const, color: calm.primary,
      title: 'Breathe with me', sub: '60 seconds, guided',
      onPress: () => { navigation.goBack(); setTimeout(() => navigation.navigate('BreathingSession', { session: 'Breathe with me', duration: 60 }), 300); },
    },
    {
      key: 'ground', icon: 'aperture-outline' as const, color: calm.dustyBlue,
      title: 'Grounding: 5-4-3-2-1', sub: 'Come back to the room',
      onPress: () => { navigation.goBack(); setTimeout(() => navigation.navigate('Grounding'), 300); },
    },
    {
      key: 'message', icon: 'mail-outline' as const, color: calm.amber,
      title: 'Message a counsellor', sub: 'Usually replies in minutes',
      onPress: () => { navigation.goBack(); setTimeout(() => (navigation as any).navigate('Main', { screen: 'Support' }), 300); },
    },
    ...(clinicResource ? [{
      key: 'clinic', icon: 'call-outline' as const, color: calm.terracotta,
      title: clinicResource.name, sub: clinicResource.description,
      onPress: () => openResource(clinicResource),
    }] : []),
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={s.header}>
        <View style={{ width: 24 }} />
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={s.close}>✕</Text>
        </Pressable>
      </View>

      <Text style={s.title}>You're not alone{'\n'}right now</Text>
      <Text style={s.sub}>Pick one thing. It only has to help a little.</Text>

      <View style={s.list}>
        {OPTIONS.map((opt) => (
          <Pressable key={opt.key} style={s.row} onPress={opt.onPress}>
            <View style={[s.iconBadge, { backgroundColor: opt.color }]}>
              <Ionicons name={opt.icon} size={20} color={calm.emergencyBg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{opt.title}</Text>
              <Text style={s.rowSub}>{opt.sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {primaryResource && (
        <View style={s.dangerCard}>
          <Text style={s.dangerTitle}>If you are in danger right now</Text>
          <Text style={s.dangerBody}>
            {primaryResource.name}{primaryResource.phone ? ` · ${primaryResource.phone}` : ''}
            {primaryResource.description ? ` (${primaryResource.description})` : ''}
          </Text>
          <Pressable style={s.callBtn} onPress={() => openResource(primaryResource)}>
            <Ionicons name="call" size={14} color={calm.rust} />
            <Text style={s.callBtnText}>Call now</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: calm.emergencyBg, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  close: { fontFamily: fonts.bodyBold, fontSize: 22, color: '#FFFFFF' },

  title: { fontFamily: fonts.displayExtraBold, fontSize: fontSizes.xxl + 8, lineHeight: 40, color: '#FFFFFF', letterSpacing: -0.48 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.md - 1, color: calm.emergencyMuted, marginTop: spacing.md, marginBottom: spacing.xl },

  list: { gap: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: calm.emergencyCard, borderRadius: radii.card - 2,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  iconBadge: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FFFFFF' },
  rowSub: { fontFamily: fonts.body, fontSize: fontSizes.sm - 1, color: calm.emergencyMuted, marginTop: 2 },

  dangerCard: { backgroundColor: calm.rust, borderRadius: radii.card, padding: spacing.lg, marginTop: spacing.xl, gap: spacing.sm },
  dangerTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 1, color: '#FFFFFF' },
  dangerBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: '#FFEDE6', lineHeight: 20 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FFFFFF', borderRadius: radii.pill,
    paddingHorizontal: spacing.lg, paddingVertical: 13, alignSelf: 'flex-start', marginTop: spacing.xs,
  },
  callBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base - 2, color: calm.rust },
});

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Button } from '@/components/Button';
import { listSosResources } from '@/api/sos';
import type { SosResourceView } from '@/api/types';
import { useToast } from '@/state/useToast';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SOS'>;

export function SOSScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;
  const toast = useToast();
  const [resources, setResources] = useState<SosResourceView[]>([]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  // Hardcoded international fallbacks — always shown even if backend/network is offline.
  // A crisis screen must NEVER be blank.
  const FALLBACK_RESOURCES: SosResourceView[] = [
    { id: -1, name: 'Befrienders Worldwide',    description: 'Find your local crisis helpline', phone: null,  url: 'https://www.befrienders.org/find-a-helpline', country: 'Global' },
    { id: -2, name: 'Crisis Text Line',          description: 'Text-based crisis support',       phone: null,  url: 'https://www.crisistextline.org/',             country: 'Global' },
    { id: -3, name: 'International Emergency',   description: 'Emergency services',              phone: '112', url: null,                                         country: 'Global' },
  ];

  useEffect(() => {
    // Merge live resources from backend with hardcoded fallbacks.
    // Live resources appear first (lower displayOrder); fallbacks fill the gap offline.
    listSosResources()
      .then((live) => setResources(live.length > 0 ? live : FALLBACK_RESOURCES))
      .catch(() => setResources(FALLBACK_RESOURCES));
  }, []);

  const openResource = (resource: SosResourceView) => {
    if (resource.phone) {
      Linking.openURL(`tel:${resource.phone.replace(/\s+/g, '')}`).catch(() =>
        toast(`Couldn't open the dialer. Call ${resource.phone} directly.`)
      );
    } else if (resource.url) {
      Linking.openURL(resource.url).catch(() => toast("Couldn't open that link."));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      {/* close sits on the right here, deliberately — leaving feels calm, not like an escape */}
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={styles.title}>You&apos;re safe</Text>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]}>
          <Text style={styles.ringText}>Breathe with{'\n'}the circle</Text>
        </Animated.View>
        <Text style={styles.subtext}>
          Nothing else is needed right now. Just follow the rhythm for a moment.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="🌍  5-4-3-2-1 grounding"
          fullWidth
          onPress={() => { navigation.goBack(); setTimeout(() => navigation.navigate('Grounding'), 300); }}
        />
        <Button
          label="💬  Talk to a counsellor"
          fullWidth
          onPress={() => { navigation.goBack(); setTimeout(() => (navigation as any).navigate('Support'), 300); }}
        />
        {resources.map((resource, i) => (
          <Button
            key={resource.id}
            label={`📞  ${resource.name}`}
            variant={i === 0 ? 'primary' : 'ghost'}
            fullWidth
            onPress={() => openResource(resource)}
          />
        ))}
        {resources.length === 0 && (
          <Button
            label="📞  International Crisis Lines"
            variant="primary"
            fullWidth
            onPress={() => Linking.openURL('https://www.befrienders.org/find-a-helpline').catch(() => {})}
          />
        )}
      </View>
    </View>
  );
}

const RING_SIZE = 128;
const CLOSE_SIZE = 34;

const styles = StyleSheet.create({
  // paddingTop/paddingBottom are set inline (insets.top/insets.bottom + spacing.lg) - this is a
  // crisis screen with no <Screen> wrapper and no header bar, so it must account for the real
  // device inset itself rather than a fixed guess (this app's SOS/crisis resources must always be
  // fully reachable, per this project's standing rule - a padding bug here is not acceptable).
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { width: CLOSE_SIZE },
  title: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: colors.coralDeep },
  closeBtn: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: fontSizes.base, color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.coralSoft,
    borderWidth: 2.5,
    borderColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  ringText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.coralDeep,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    maxWidth: 230,
    lineHeight: 19,
  },
  actions: { gap: spacing.sm + 1, marginTop: spacing.md },
});

/**
 * BadgeShelf — horizontal scrollable row of badges.
 * Locked badges appear greyed-out with a lock icon.
 */
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { BADGE_DEFS, type BadgeId } from '@/state/useGamificationStore';
import { fonts, fontSizes } from '@/theme/tokens';

interface Props {
  unlockedBadges: BadgeId[];
}

export function BadgeShelf({ unlockedBadges }: Props) {
  const unlockedSet = new Set(unlockedBadges);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {BADGE_DEFS.map((def) => {
        const unlocked = unlockedSet.has(def.id);
        return (
          <View key={def.id} style={[s.badge, !unlocked && s.locked]}>
            <Text style={[s.emoji, !unlocked && s.lockedEmoji]}>
              {unlocked ? def.emoji : '🔒'}
            </Text>
            <Text style={[s.name, !unlocked && s.lockedName]} numberOfLines={2}>
              {def.name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row:        { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 4 },
  badge:      {
    width: 72, alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  locked:     { backgroundColor: '#F0EFEE', shadowOpacity: 0 },
  emoji:      { fontSize: 26 },
  lockedEmoji:{ opacity: 0.4 },
  name:       { fontFamily: fonts.bodyBold, fontSize: 9, color: '#2B2530', textAlign: 'center' },
  lockedName: { color: '#A7A1AC' },
});

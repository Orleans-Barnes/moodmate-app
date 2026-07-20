/**
 * InstitutionPicker — Phase 1C-ii searchable institution picker.
 *
 * Replaces the old flat 7-item Modal dropdown that lived inline in SignupScreen.tsx. Pulls from
 * the local offline catalogue (src/data/institutions) — no network calls. Renders an initials
 * badge per institution today (no real logo assets available yet); once real crest images are
 * added to the catalogue's `logo` field, this component picks them up automatically via the
 * `logo ? <Image .../> : <InitialsBadge .../>` branch below — no other change needed.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal, FlatList,
  Animated, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';
import { searchInstitutions, OTHER_INSTITUTION_ID, type Institution } from '@/data/institutions';

interface Props {
  visible: boolean;
  selectedId: string | null;
  onSelect: (institution: Institution) => void;
  onClose: () => void;
}

// Deterministic badge color per institution, cycling through MoodMate's palette so the list
// doesn't look monotone but never needs per-institution color authoring.
const BADGE_COLORS = [colors.sage, colors.blue, colors.lavender, colors.coral, colors.sun];
function badgeColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return BADGE_COLORS[hash % BADGE_COLORS.length];
}

function initialsFor(shortName: string): string {
  // "KNUST" -> "KNU", "UG" -> "UG", "UCC" -> "UCC" (already <=3, shown whole)
  if (shortName.length <= 3) return shortName.toUpperCase();
  return shortName.slice(0, 3).toUpperCase();
}

function InstitutionRow({ item, selected, onPress }: {
  item: Institution; selected: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const isOther = item.id === OTHER_INSTITUTION_ID;
  const badgeColor = badgeColorFor(item.id);

  const pressIn = () => Animated.spring(scale, { toValue: 0.98, speed: 60, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 6, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          isOther
            ? `Select: ${item.name}`
            : `Select ${item.name} (${item.shortName})${item.city ? `, ${item.city}, ${item.country}` : ''}`
        }
        accessibilityState={{ selected }}
      >
        <View style={[s.row, selected && s.rowSelected]}>
          {item.logo ? (
            <Image source={item.logo} style={s.logoImg} resizeMode="contain" />
          ) : isOther ? (
            <View style={[s.badge, { backgroundColor: colors.inkFaint + '22' }]}>
              <Ionicons name="add" size={20} color={colors.inkSoft} />
            </View>
          ) : (
            <View style={[s.badge, { backgroundColor: badgeColor + '22' }]}>
              <Text style={[s.badgeTxt, { color: badgeColor }]}>{initialsFor(item.shortName)}</Text>
            </View>
          )}

          <View style={s.rowText}>
            <Text style={s.rowName}>{item.name}</Text>
            {!isOther && (
              <Text style={s.rowMeta}>
                {item.shortName}{item.city ? ` • ${item.city}, ${item.country}` : ''}
              </Text>
            )}
          </View>

          {selected && (
            <View style={s.checkCircle}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function InstitutionPicker({ visible, selectedId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  // Institution Management (Milestone) - `visible` is in the dependency list (not just `query`) so
  // that re-opening the sheet always re-reads the module-level INSTITUTIONS array, picking up a
  // loadInstitutions() swap (live/cached/bundled) that may have completed since the sheet was last
  // opened. Without this, a sheet opened before the live fetch resolved would keep showing its
  // first memoized (bundled) result forever, even after INSTITUTIONS was updated in place.
  const results = useMemo(() => searchInstitutions(query), [query, visible]);
  const hasRealMatches = results.some((i) => i.id !== OTHER_INSTITUTION_ID);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={[s.sheet, { paddingBottom: insets.bottom + spacing.lg }]} onPress={(e) => e.stopPropagation()}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Select your institution</Text>

          <View style={s.searchWrap}>
            <Ionicons name="search" size={16} color={colors.inkFaint} />
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, acronym, or city"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search institutions"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={16} color={colors.inkFaint} />
              </Pressable>
            )}
          </View>

          {!hasRealMatches && query.length > 0 && (
            <View style={s.emptyState}>
              <Ionicons name="school-outline" size={22} color={colors.inkFaint} />
              <Text style={s.emptyTitle}>No institution found</Text>
              <Text style={s.emptyBody}>Can't find yours? Select "My institution isn't listed" below, or contact us to add it.</Text>
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={s.list}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <InstitutionRow
                item={item}
                selected={selectedId === item.id}
                onPress={() => { onSelect(item); handleClose(); }}
              />
            )}
          />
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.line, alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.ink, marginBottom: spacing.md },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bg, borderRadius: radii.md,
    borderWidth: 1.5, borderColor: colors.line,
    paddingHorizontal: spacing.md, paddingVertical: 11,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.ink, padding: 0 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.lg, gap: 4 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.inkSoft, marginTop: 4 },
  emptyBody: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkFaint, textAlign: 'center', paddingHorizontal: spacing.lg, lineHeight: 17 },

  list: { flexGrow: 0 },
  listContent: { paddingBottom: spacing.md },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5, borderColor: 'transparent',
    marginBottom: 4,
  },
  rowSelected: {
    borderColor: colors.sage,
    backgroundColor: colors.sageSoft,
  },
  badge: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  badgeTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },
  logoImg: { width: 44, height: 44, borderRadius: 14, flexShrink: 0 },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.ink, lineHeight: 18 },
  rowMeta: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.inkSoft },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    ...shadow.sm,
  },
});

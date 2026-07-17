import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@/state/useToast';

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#F0EBFF';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;
const CARD_SH = { shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 };

interface Activity { id: string; label: string; category: string; done: boolean; mood?: number; }

const DEFAULTS: Activity[] = [
  { id: '1', label: 'Morning walk outside', category: 'Movement', done: false },
  { id: '2', label: 'Call a friend', category: 'Social', done: false },
  { id: '3', label: 'Cook a meal I enjoy', category: 'Pleasure', done: false },
  { id: '4', label: 'Read for 20 minutes', category: 'Achievement', done: false },
  { id: '5', label: 'Attend one class', category: 'Achievement', done: false },
];

const CATEGORIES = ['Movement', 'Social', 'Pleasure', 'Achievement', 'Routine'];
const CAT_COLORS: Record<string, string> = {
  Movement: '#2563EB', Social: '#D97706', Pleasure: '#DC2626', Achievement: '#059669', Routine: '#7C3AED',
};

export function ActivationPlannerScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const toast  = useToast();

  const [activities, setActivities] = useState<Activity[]>(DEFAULTS);
  const [newLabel, setNewLabel]     = useState('');
  const [newCat, setNewCat]         = useState('Movement');
  const [adding, setAdding]         = useState(false);

  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    AsyncStorage.getItem('@activation_activities').then(v => v && setActivities(JSON.parse(v)));
  }, []);

  const save = async (next: Activity[]) => {
    setActivities(next);
    await AsyncStorage.setItem('@activation_activities', JSON.stringify(next));
  };

  const toggleDone = (id: string) => {
    const next = activities.map(a => a.id === id ? { ...a, done: !a.done } : a);
    save(next);
    const act = activities.find(a => a.id === id);
    if (act && !act.done) toast.show({ type: 'success', message: '+10 XP — great job!' });
  };

  const addActivity = async () => {
    if (!newLabel.trim()) return;
    const next = [...activities, { id: Date.now().toString(), label: newLabel.trim(), category: newCat, done: false }];
    await save(next);
    setNewLabel('');
    setAdding(false);
  };

  const removeActivity = (id: string) => save(activities.filter(a => a.id !== id));

  const doneCount = activities.filter(a => a.done).length;
  const pct = activities.length ? Math.round(doneCount / activities.length * 100) : 0;

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: headerOp }}>
          <View style={s.topRow}>
            <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={WHITE} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Activation Planner</Text>
              <Text style={s.headerSub}>Behavioural activation for better mood</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={s.progressWrap}>
            <View style={s.progressHeader}>
              <Text style={s.progressLbl}>{doneCount}/{activities.length} activities complete</Text>
              <Text style={s.progressPct}>{pct}%</Text>
            </View>
            <View style={s.progressBar}>
              <Animated.View style={[s.progressFill, { width: `${pct}%` as any }]} />
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* About card */}
        <View style={[s.infoCard, CARD_SH]}>
          <Ionicons name="flash-outline" size={20} color={PURPLE} />
          <Text style={s.infoTxt}>Doing activities — even when you don't feel like it — gradually lifts your mood. Check them off as you go!</Text>
        </View>

        {/* Activities grouped by category */}
        {CATEGORIES.filter(cat => activities.some(a => a.category === cat)).map(cat => (
          <View key={cat} style={{ marginBottom: 8 }}>
            <View style={s.catHeader}>
              <View style={[s.catDot, { backgroundColor: CAT_COLORS[cat] }]} />
              <Text style={s.catLabel}>{cat}</Text>
            </View>
            {activities.filter(a => a.category === cat).map(act => (
              <View key={act.id} style={[s.actRow, CARD_SH, act.done && s.actDone]}>
                <TouchableOpacity onPress={() => toggleDone(act.id)} style={[s.checkbox, act.done && s.checkboxDone]}>
                  {act.done && <Ionicons name="checkmark" size={14} color={WHITE} />}
                </TouchableOpacity>
                <Text style={[s.actLabel, act.done && s.actLabelDone]}>{act.label}</Text>
                <View style={[s.catBadge, { backgroundColor: CAT_COLORS[cat] + '18' }]}>
                  <Text style={[s.catBadgeTxt, { color: CAT_COLORS[cat] }]}>{act.category}</Text>
                </View>
                <TouchableOpacity onPress={() => removeActivity(act.id)} style={s.removeBtn}>
                  <Ionicons name="trash-outline" size={15} color={PM} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        {/* Add activity */}
        {adding ? (
          <View style={[s.card, CARD_SH]}>
            <Text style={s.cardTitle}>New Activity</Text>
            <TextInput
              style={s.input}
              placeholder="What would you like to do?"
              placeholderTextColor={PM}
              value={newLabel}
              onChangeText={setNewLabel}
              autoFocus
            />
            <Text style={s.categoryLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catPill, newCat === cat && { backgroundColor: PURPLE }]}
                  onPress={() => setNewCat(cat)}
                >
                  <Text style={[s.catPillTxt, newCat === cat && { color: WHITE }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.addActions}>
              <TouchableOpacity onPress={() => setAdding(false)} style={s.cancelBtn}>
                <Text style={s.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addActivity} style={{ flex: 1 }}>
                <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.addBtn}>
                  <Text style={s.addBtnTxt}>Add Activity</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setAdding(true)} style={[s.newBtn, CARD_SH]}>
            <Ionicons name="add-circle-outline" size={20} color={PURPLE} />
            <Text style={s.newBtnTxt}>Add New Activity</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)' },
  progressWrap:  { gap: 8 },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between' },
  progressLbl:   { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.8)' },
  progressPct:   { fontFamily: fonts.displaySemibold, fontSize: fontSizes.sm, color: WHITE },
  progressBar:   { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: WHITE, borderRadius: 4 },

  scroll: { padding: 16 },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16 },
  infoTxt:  { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, flex: 1, lineHeight: 21 },

  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catDot:    { width: 8, height: 8, borderRadius: 4 },
  catLabel:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.sm, color: DARK },

  actRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: PL },
  actDone:    { backgroundColor: '#F0FFF4', borderColor: '#86EFAC' },
  checkbox:   { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: PM, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxDone:{ backgroundColor: '#059669', borderColor: '#059669' },
  actLabel:   { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, flex: 1 },
  actLabelDone:{ textDecorationLine: 'line-through', color: MUTED },
  catBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catBadgeTxt:{ fontFamily: fonts.body, fontSize: 10 },
  removeBtn:  { padding: 4 },

  card:          { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitle:     { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK, marginBottom: 12 },
  input:         { backgroundColor: BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, borderWidth: 1, borderColor: PL, marginBottom: 14 },
  categoryLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: MUTED, marginBottom: 8 },
  catRow:        { gap: 8, paddingBottom: 12 },
  catPill:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: PL },
  catPillTxt:    { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: PURPLE },
  addActions:    { flexDirection: 'row', gap: 10 },
  cancelBtn:     { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48, borderWidth: 1, borderColor: PL, borderRadius: 14 },
  cancelTxt:     { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: MUTED },
  addBtn:        { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt:     { fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: WHITE },

  newBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', backgroundColor: WHITE, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: PL, borderStyle: 'dashed' },
  newBtnTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: PURPLE },
});

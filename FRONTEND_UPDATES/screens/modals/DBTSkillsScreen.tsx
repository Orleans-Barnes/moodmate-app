import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar,
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

const MODULES = [
  {
    id: 'mindfulness', label: 'Mindfulness', icon: 'eye-outline' as const, color: '#7C3AED',
    desc: 'Observe your thoughts without judgment',
    skills: [
      { id: 'wise-mind', title: 'Wise Mind', sub: 'Balance emotion and logic', xp: 20 },
      { id: 'observe', title: 'Observe & Describe', sub: 'Notice without labelling', xp: 15 },
      { id: 'participate', title: 'Participate', sub: 'Be fully present', xp: 15 },
    ],
  },
  {
    id: 'distress', label: 'Distress Tolerance', icon: 'shield-outline' as const, color: '#2563EB',
    desc: 'Survive crisis moments without making things worse',
    skills: [
      { id: 'tipp', title: 'TIPP', sub: 'Temperature, Intense exercise, Paced breathing, Paired muscle relaxation', xp: 25 },
      { id: 'accepts', title: 'ACCEPTS', sub: 'Distract with activities and thoughts', xp: 20 },
      { id: 'self-soothe', title: 'Self-Soothe', sub: 'Comfort with the five senses', xp: 20 },
    ],
  },
  {
    id: 'emotion', label: 'Emotion Regulation', icon: 'pulse-outline' as const, color: '#059669',
    desc: 'Understand and manage your emotions',
    skills: [
      { id: 'check-facts', title: 'Check the Facts', sub: 'Evaluate whether emotions fit reality', xp: 20 },
      { id: 'opposite-action', title: 'Opposite Action', sub: 'Act opposite to urges that don\'t fit', xp: 25 },
      { id: 'please', title: 'PLEASE Skills', sub: 'Reduce emotional vulnerability', xp: 20 },
    ],
  },
  {
    id: 'interpersonal', label: 'Interpersonal', icon: 'people-outline' as const, color: '#D97706',
    desc: 'Build and maintain healthy relationships',
    skills: [
      { id: 'dear-man', title: 'DEAR MAN', sub: 'Get what you need assertively', xp: 25 },
      { id: 'give', title: 'GIVE', sub: 'Keep and improve relationships', xp: 20 },
      { id: 'fast', title: 'FAST', sub: 'Maintain your self-respect', xp: 20 },
    ],
  },
];

export function DBTSkillsScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const toast  = useToast();

  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    AsyncStorage.getItem('@dbt_completed').then(v => v && setCompleted(new Set(JSON.parse(v))));
  }, []);

  const module = MODULES.find(m => m.id === activeModule)!;

  const completeSkill = async (skillId: string, xp: number) => {
    if (completed.has(skillId)) return;
    const next = new Set([...completed, skillId]);
    setCompleted(next);
    await AsyncStorage.setItem('@dbt_completed', JSON.stringify([...next]));
    const totalXP = parseInt((await AsyncStorage.getItem('@dbt_xp')) ?? '0') + xp;
    await AsyncStorage.setItem('@dbt_xp', totalXP.toString());
    toast.show({ type: 'success', message: `+${xp} XP earned!` });
  };

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
              <Text style={s.headerTitle}>DBT Skills</Text>
              <Text style={s.headerSub}>Dialectical Behaviour Therapy</Text>
            </View>
            <View style={s.xpPill}>
              <Ionicons name="trophy-outline" size={13} color="#FCD34D" />
              <Text style={s.xpTxt}>{completed.size * 20} XP</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Module tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.moduleTabs}>
        {MODULES.map(m => {
          const active = m.id === activeModule;
          return (
            <TouchableOpacity key={m.id} onPress={() => setActiveModule(m.id)}>
              {active
                ? <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.moduleTab}>
                    <Ionicons name={m.icon} size={14} color={WHITE} />
                    <Text style={[s.moduleTabTxt, { color: WHITE }]}>{m.label}</Text>
                  </LinearGradient>
                : <View style={[s.moduleTab, { backgroundColor: WHITE, borderWidth: 1, borderColor: PL }]}>
                    <Ionicons name={m.icon} size={14} color={MUTED} />
                    <Text style={[s.moduleTabTxt, { color: MUTED }]}>{m.label}</Text>
                  </View>
              }
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>
        {/* Module header */}
        <View style={[s.moduleHero, CARD_SH, { borderTopWidth: 4, borderTopColor: module.color }]}>
          <View style={[s.moduleHeroIcon, { backgroundColor: module.color + '15' }]}>
            <Ionicons name={module.icon} size={28} color={module.color} />
          </View>
          <Text style={s.moduleTitle}>{module.label}</Text>
          <Text style={s.moduleDesc}>{module.desc}</Text>
          <View style={s.progressRow}>
            <Text style={s.progressTxt}>
              {module.skills.filter(sk => completed.has(sk.id)).length}/{module.skills.length} skills completed
            </Text>
            <View style={s.progressBar}>
              <View style={[s.progressFill, {
                width: `${(module.skills.filter(sk => completed.has(sk.id)).length / module.skills.length) * 100}%` as any,
                backgroundColor: module.color,
              }]} />
            </View>
          </View>
        </View>

        {/* Skills */}
        {module.skills.map(skill => {
          const done = completed.has(skill.id);
          return (
            <View key={skill.id} style={[s.skillCard, CARD_SH, done && s.skillDone]}>
              <View style={[s.skillIcon, { backgroundColor: done ? '#ECFDF5' : PL }]}>
                <Ionicons name={done ? 'checkmark-circle' : 'book-outline'} size={22} color={done ? '#059669' : PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.skillTitle}>{skill.title}</Text>
                <Text style={s.skillSub}>{skill.sub}</Text>
                <Text style={s.xpBadge}>+{skill.xp} XP</Text>
              </View>
              <TouchableOpacity
                style={[s.practiceBtn, done && { backgroundColor: '#ECFDF5' }]}
                onPress={() => completeSkill(skill.id, skill.xp)}
              >
                <Text style={[s.practiceTxt, done && { color: '#059669' }]}>
                  {done ? 'Done' : 'Practice'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)' },
  xpPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  xpTxt:       { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: WHITE },

  moduleTabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  moduleTab:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  moduleTabTxt:{ fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm },

  scroll: { padding: 16 },

  moduleHero:     { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 16, alignItems: 'center' },
  moduleHeroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduleTitle:    { fontFamily: fonts.display, fontSize: fontSizes.xl, color: DARK, marginBottom: 4 },
  moduleDesc:     { fontFamily: fonts.body, fontSize: fontSizes.base, color: MUTED, textAlign: 'center', marginBottom: 16 },
  progressRow:    { width: '100%', gap: 6 },
  progressTxt:    { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
  progressBar:    { height: 6, backgroundColor: PL, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },

  skillCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: PL },
  skillDone: { borderColor: '#86EFAC', backgroundColor: '#F0FFF4' },
  skillIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  skillTitle:{ fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: DARK, marginBottom: 2 },
  skillSub:  { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED, marginBottom: 6 },
  xpBadge:   { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: PURPLE },
  practiceBtn:{ backgroundColor: PL, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  practiceTxt:{ fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: PURPLE },
});

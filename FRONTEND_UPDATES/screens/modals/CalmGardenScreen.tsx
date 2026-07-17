import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@/state/useToast';

const { width: W } = Dimensions.get('window');

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

// Plant stages: icon + color + name
const STAGES = [
  { stage: 0, icon: 'ellipse-outline' as const,    color: '#9CA3AF', label: 'Bare soil' },
  { stage: 1, icon: 'leaf-outline' as const,        color: '#86EFAC', label: 'Seedling' },
  { stage: 2, icon: 'leaf' as const,                color: '#4ADE80', label: 'Sprout' },
  { stage: 3, icon: 'flower-outline' as const,      color: '#34D399', label: 'Bud' },
  { stage: 4, icon: 'rose-outline' as const,        color: '#059669', label: 'Flower' },
  { stage: 5, icon: 'nutrition-outline' as const,   color: '#047857', label: 'Full Bloom' },
] as const;

const PLOT_COUNT = 6;
const ACTIONS = [
  { id: 'water',   label: 'Water',    icon: 'water-outline' as const,   color: '#2563EB', cost: 0, tip: 'Water daily for steady growth' },
  { id: 'sun',     label: 'Sunshine', icon: 'sunny-outline' as const,    color: '#F59E0B', cost: 1, tip: 'Sunlight boosts growth faster' },
  { id: 'compost', label: 'Compost',  icon: 'layers-outline' as const,   color: '#059669', cost: 2, tip: 'Compost gives a big growth jump' },
  { id: 'prune',   label: 'Prune',    icon: 'cut-outline' as const,      color: '#DC2626', cost: 0, tip: 'Pruning keeps your plant healthy' },
];

interface Plot { id: number; stage: number; wateredToday: boolean; }

const defaultPlots = (): Plot[] => Array.from({ length: PLOT_COUNT }, (_, i) => ({ id: i, stage: 0, wateredToday: false }));

export function CalmGardenScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const toast  = useToast();

  const [plots, setPlots]         = useState<Plot[]>(defaultPlots());
  const [selected, setSelected]   = useState<number | null>(null);
  const [xp, setXP]               = useState(0);
  const [tokens, setTokens]       = useState(5);

  const headerOp  = useRef(new Animated.Value(0)).current;
  const plantAnims = useRef(plots.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    AsyncStorage.getItem('@garden_state').then(v => {
      if (v) {
        const { plots: saved, xp: savedXP, tokens: savedTokens } = JSON.parse(v);
        setPlots(saved);
        setXP(savedXP ?? 0);
        setTokens(savedTokens ?? 5);
      }
    });
  }, []);

  const saveState = async (nextPlots: Plot[], nextXP: number, nextTokens: number) => {
    await AsyncStorage.setItem('@garden_state', JSON.stringify({ plots: nextPlots, xp: nextXP, tokens: nextTokens }));
  };

  const applyAction = useCallback((actionId: string) => {
    if (selected === null) {
      toast.show({ type: 'info', message: 'Tap a plot to select it first' });
      return;
    }
    const action = ACTIONS.find(a => a.id === actionId)!;
    if (tokens < action.cost) {
      toast.show({ type: 'error', message: 'Not enough garden tokens' });
      return;
    }
    const plot = plots[selected];
    if (plot.stage >= 5) {
      toast.show({ type: 'info', message: 'This plant is in full bloom!' });
      return;
    }
    if (actionId === 'water' && plot.wateredToday) {
      toast.show({ type: 'info', message: 'Already watered today. Come back tomorrow!' });
      return;
    }

    // Animate the plant
    Animated.sequence([
      Animated.timing(plantAnims[selected], { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.spring(plantAnims[selected], { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    const growthAmount = actionId === 'compost' ? 2 : 1;
    const xpEarned = actionId === 'water' ? 5 : actionId === 'sun' ? 8 : actionId === 'compost' ? 15 : 5;

    const nextPlots = plots.map((p, i) => {
      if (i !== selected) return p;
      const newStage = Math.min(5, p.stage + growthAmount);
      if (newStage > p.stage) toast.show({ type: 'success', message: `Plant grew to ${STAGES[newStage].label}! +${xpEarned} XP` });
      else toast.show({ type: 'success', message: `+${xpEarned} XP` });
      return { ...p, stage: newStage, wateredToday: actionId === 'water' ? true : p.wateredToday };
    });

    const nextXP     = xp + xpEarned;
    const nextTokens = tokens - action.cost;
    setPlots(nextPlots);
    setXP(nextXP);
    setTokens(nextTokens);
    saveState(nextPlots, nextXP, nextTokens);
  }, [selected, plots, xp, tokens]);

  const selectedPlot = selected !== null ? plots[selected] : null;
  const stage = selectedPlot ? STAGES[selectedPlot.stage] : null;

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
              <Text style={s.headerTitle}>Calm Garden</Text>
              <Text style={s.headerSub}>Nurture your plants, nurture your mind</Text>
            </View>
            <View style={s.headerStats}>
              <View style={s.statChip}>
                <Ionicons name="trophy-outline" size={12} color="#FCD34D" />
                <Text style={s.statTxt}>{xp} XP</Text>
              </View>
              <View style={s.statChip}>
                <Ionicons name="diamond-outline" size={12} color="#93C5FD" />
                <Text style={s.statTxt}>{tokens}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Garden grid */}
        <View style={[s.gardenCard, CARD_SH]}>
          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={s.gardenBg}>
            <Text style={s.gardenTitle}>Your Garden</Text>
            <View style={s.plotGrid}>
              {plots.map((plot, i) => {
                const st = STAGES[plot.stage];
                const isSelected = selected === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.plot, isSelected && s.plotSelected]}
                    onPress={() => setSelected(i === selected ? null : i)}
                  >
                    <Animated.View style={{ transform: [{ scale: plantAnims[i] }] }}>
                      <View style={[s.plantCircle, { backgroundColor: st.color + '25', borderColor: isSelected ? PURPLE : st.color + '50' }]}>
                        <Ionicons name={st.icon} size={28} color={st.color} />
                      </View>
                    </Animated.View>
                    <Text style={s.plotLabel}>{st.label}</Text>
                    {plot.wateredToday && (
                      <View style={s.wateredBadge}>
                        <Ionicons name="water" size={10} color="#2563EB" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </LinearGradient>
        </View>

        {/* Selected plant info */}
        {selectedPlot && stage && (
          <View style={[s.card, CARD_SH]}>
            <View style={s.selectedHeader}>
              <View style={[s.selectedIcon, { backgroundColor: stage.color + '20' }]}>
                <Ionicons name={stage.icon} size={24} color={stage.color} />
              </View>
              <View>
                <Text style={s.selectedTitle}>Plot {selected! + 1} — {stage.label}</Text>
                <Text style={s.selectedSub}>Stage {selectedPlot.stage + 1} of {STAGES.length}</Text>
              </View>
            </View>
            {/* Stage progress */}
            <View style={s.stageBar}>
              <View style={[s.stageFill, { width: `${(selectedPlot.stage / 5) * 100}%` as any, backgroundColor: stage.color }]} />
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>Garden Actions</Text>
          <View style={s.actionsGrid}>
            {ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[s.actionBtn, { borderColor: action.color + '40' }]}
                onPress={() => applyAction(action.id)}
              >
                <View style={[s.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={s.actionLabel}>{action.label}</Text>
                {action.cost > 0 && (
                  <View style={s.costBadge}>
                    <Ionicons name="diamond-outline" size={10} color="#93C5FD" />
                    <Text style={s.costTxt}>{action.cost}</Text>
                  </View>
                )}
                <Text style={s.actionTip}>{action.tip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={[s.card, CARD_SH]}>
          <Text style={s.cardTitle}>How to Play</Text>
          {[
            { icon: 'hand-left-outline' as const, text: 'Tap a plot to select it' },
            { icon: 'water-outline' as const, text: 'Water daily to keep your plant growing' },
            { icon: 'leaf-outline' as const, text: 'Each action grows your plant toward Full Bloom' },
            { icon: 'trophy-outline' as const, text: 'Earn XP for every garden action' },
          ].map(tip => (
            <View key={tip.text} style={s.tipRow}>
              <Ionicons name={tip.icon} size={16} color={PURPLE} />
              <Text style={s.tipTxt}>{tip.text}</Text>
            </View>
          ))}
        </View>
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
  headerStats: { flexDirection: 'row', gap: 6 },
  statChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  statTxt:     { fontFamily: fonts.bodyMedium, fontSize: 11, color: WHITE },

  scroll: { padding: 16 },

  gardenCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  gardenBg:   { padding: 20 },
  gardenTitle:{ fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: '#047857', marginBottom: 16, textAlign: 'center' },
  plotGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },

  plot:         { width: (W - 96) / 3, alignItems: 'center', gap: 6 },
  plotSelected: { },
  plantCircle:  { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  plotLabel:    { fontFamily: fonts.body, fontSize: 10, color: DARK },
  wateredBadge: { position: 'absolute', top: -2, right: 8, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 2 },

  card:      { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: DARK, marginBottom: 14 },

  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  selectedIcon:   { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  selectedTitle:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.base, color: DARK },
  selectedSub:    { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },
  stageBar:       { height: 8, backgroundColor: PL, borderRadius: 4, overflow: 'hidden' },
  stageFill:      { height: '100%', borderRadius: 4 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn:   { width: (W - 84) / 2, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1.5, backgroundColor: BG },
  actionIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: DARK },
  costBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  costTxt:     { fontFamily: fonts.body, fontSize: 10, color: '#2563EB' },
  actionTip:   { fontFamily: fonts.body, fontSize: 10, color: MUTED, textAlign: 'center' },

  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: PL },
  tipTxt: { fontFamily: fonts.body, fontSize: fontSizes.base, color: DARK, flex: 1 },
});

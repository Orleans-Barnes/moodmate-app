import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  PanResponder, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, fontSizes } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@/state/useToast';

const { width: W, height: H } = Dimensions.get('window');

// ─── Design system ─────────────────────────────────────────────────────────
const BG     = '#0F0A2E';
const PURPLE = '#7C3AED';
const PL     = '#EDE9FE';
const PM     = '#C4B5FD';
const DARK   = '#1A0D40';
const MUTED  = '#8B6FC8';
const WHITE  = '#FFFFFF';
const GRAD_H = ['#1A0A3C', '#3B1275', '#7C3AED'] as const;

const THOUGHTS = [
  { id: 't1', text: "I failed one test, I'm going to fail everything.", distortion: 'Catastrophising' },
  { id: 't2', text: "She didn't reply — she must hate me.", distortion: 'Mind Reading' },
  { id: 't3', text: "I should always be productive.", distortion: 'Should Statements' },
  { id: 't4', text: "I made one mistake, so I'm completely useless.", distortion: 'All-or-Nothing' },
  { id: 't5', text: "I know this will go badly.", distortion: 'Fortune Telling' },
  { id: 't6', text: "Everyone else has it together except me.", distortion: 'Comparison' },
  { id: 't7', text: "I felt nervous so I must be in danger.", distortion: 'Emotional Reasoning' },
  { id: 't8', text: "That compliment doesn't count — they were just being nice.", distortion: 'Discounting Positives' },
];

export function ThoughtSorterScreen() {
  const nav    = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const toast  = useToast();

  const [idx, setIdx]         = useState(0);
  const [score, setScore]     = useState(0);
  const [done, setDone]       = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const cardAnim = useRef(new Animated.ValueXY()).current;
  const cardRot  = useRef(new Animated.Value(0)).current;
  const cardOp   = useRef(new Animated.Value(1)).current;
  const headerOp = useRef(new Animated.Value(0)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const thought = THOUGHTS[idx];

  const swipe = (direction: 'helpful' | 'unhelpful') => {
    const toX = direction === 'helpful' ? W + 100 : -W - 100;
    Animated.parallel([
      Animated.timing(cardAnim.x, { toValue: toX, duration: 300, useNativeDriver: false }),
      Animated.timing(cardOp, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      // All THOUGHTS in our deck are distortions (unhelpful)
      const isCorrect = direction === 'unhelpful';
      if (isCorrect) {
        setScore(s => s + 1);
        setFeedback('correct');
      } else {
        setFeedback('wrong');
      }

      setTimeout(() => {
        setFeedback(null);
        cardAnim.setValue({ x: 0, y: 0 });
        cardRot.setValue(0);
        cardOp.setValue(1);
        if (idx + 1 >= THOUGHTS.length) {
          setDone(true);
          AsyncStorage.getItem('@thought_sorter_xp').then(v => {
            const earned = (score + (isCorrect ? 1 : 0)) * 10;
            AsyncStorage.setItem('@thought_sorter_xp', ((parseInt(v ?? '0')) + earned).toString());
          });
        } else {
          setIdx(i => i + 1);
        }
      }, 800);
    });
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderMove: (_, g) => {
      cardAnim.setValue({ x: g.dx, y: g.dy * 0.2 });
      cardRot.setValue(g.dx / 20);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx > 80) swipe('helpful');
      else if (g.dx < -80) swipe('unhelpful');
      else {
        Animated.spring(cardAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        Animated.spring(cardRot, { toValue: 0, useNativeDriver: false }).start();
      }
    },
  })).current;

  const cardStyle = {
    transform: [
      ...cardAnim.getTranslateTransform(),
      { rotate: cardRot.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) },
    ],
    opacity: cardOp,
  };

  if (done) {
    const pct = Math.round(score / THOUGHTS.length * 100);
    return (
      <View style={[s.root, { backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.resultIcon}>
          <Ionicons name="trophy" size={48} color={WHITE} />
        </LinearGradient>
        <Text style={s.resultTitle}>Round Complete!</Text>
        <Text style={s.resultScore}>{score}/{THOUGHTS.length} correct</Text>
        <Text style={s.resultXP}>+{score * 10} XP earned</Text>
        <Text style={[s.resultMsg, { color: MUTED }]}>
          {pct >= 80 ? "Excellent! You're getting great at spotting cognitive distortions." : pct >= 60 ? "Good work! Keep practising to sharpen your CBT skills." : "Keep going — recognising distortions takes practice!"}
        </Text>
        <View style={s.resultActions}>
          <TouchableOpacity onPress={() => { setIdx(0); setScore(0); setDone(false); }} style={{ flex: 1 }}>
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={s.playAgainBtn}>
              <Text style={s.playAgainTxt}>Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.exitBtn}>
            <Text style={s.exitTxt}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRAD_H} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={{ opacity: headerOp, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Thought Sorter</Text>
            <Text style={s.headerSub}>Is this thought helpful or unhelpful?</Text>
          </View>
          <View style={s.scorePill}>
            <Ionicons name="trophy-outline" size={13} color="#FCD34D" />
            <Text style={s.scoreTxt}>{score} / {THOUGHTS.length}</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${(idx / THOUGHTS.length) * 100}%` as any }]} />
      </View>

      {/* Labels */}
      <View style={s.swipeLabels}>
        <View style={s.leftLabel}>
          <Ionicons name="arrow-back-circle" size={20} color="#F87171" />
          <Text style={s.leftLabelTxt}>Unhelpful</Text>
        </View>
        <View style={s.rightLabel}>
          <Text style={s.rightLabelTxt}>Helpful</Text>
          <Ionicons name="arrow-forward-circle" size={20} color="#52B788" />
        </View>
      </View>

      {/* Card */}
      <View style={s.cardArea}>
        {feedback && (
          <View style={[s.feedbackBadge, feedback === 'correct' ? s.feedbackCorrect : s.feedbackWrong]}>
            <Ionicons name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'} size={28} color={WHITE} />
            <Text style={s.feedbackTxt}>{feedback === 'correct' ? 'Correct!' : 'Not quite!'}</Text>
          </View>
        )}

        <Animated.View style={[s.card, cardStyle]} {...panResponder.panHandlers}>
          <View style={s.cardInner}>
            <View style={s.cardTopRow}>
              <View style={s.cardIconBox}>
                <Ionicons name="chatbubble-outline" size={20} color={PURPLE} />
              </View>
              <Text style={s.cardCounter}>{idx + 1} of {THOUGHTS.length}</Text>
            </View>
            <Text style={s.thoughtText}>"{thought.text}"</Text>
            <View style={s.hintRow}>
              <Ionicons name="information-circle-outline" size={14} color={PM} />
              <Text style={s.hintTxt}>Swipe left = unhelpful, right = helpful</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Action buttons */}
      <View style={[s.actionRow, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[s.actionBtn, s.actionLeft]} onPress={() => swipe('unhelpful')}>
          <Ionicons name="close" size={28} color="#F87171" />
          <Text style={s.actionLeftTxt}>Unhelpful</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.actionRight]} onPress={() => swipe('helpful')}>
          <Ionicons name="checkmark" size={28} color="#52B788" />
          <Text style={s.actionRightTxt}>Helpful</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSizes.xl, color: WHITE },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.65)' },
  scorePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  scoreTxt:    { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: WHITE },

  progressBar:  { height: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill: { height: '100%', backgroundColor: PURPLE },

  swipeLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16 },
  leftLabel:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightLabel:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leftLabelTxt:{ fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#F87171' },
  rightLabelTxt:{ fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#52B788' },

  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  card:     { width: W - 48, shadowColor: PURPLE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  cardInner:{ backgroundColor: WHITE, borderRadius: 24, padding: 28, gap: 20 },
  cardTopRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIconBox:{ width: 40, height: 40, borderRadius: 12, backgroundColor: PL, alignItems: 'center', justifyContent: 'center' },
  cardCounter:{ fontFamily: fonts.body, fontSize: fontSizes.sm, color: MUTED },
  thoughtText:{ fontFamily: fonts.displaySemibold, fontSize: fontSizes.lg, color: DARK, lineHeight: 28, textAlign: 'center' },
  hintRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintTxt:   { fontFamily: fonts.body, fontSize: fontSizes.xs, color: MUTED },

  feedbackBadge:   { position: 'absolute', top: -10, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  feedbackCorrect: { backgroundColor: '#059669' },
  feedbackWrong:   { backgroundColor: '#DC2626' },
  feedbackTxt:     { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: WHITE },

  actionRow:  { flexDirection: 'row', paddingHorizontal: 24, gap: 16, paddingTop: 12 },
  actionBtn:  { flex: 1, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionLeft: { backgroundColor: 'rgba(248,113,113,0.15)', borderWidth: 2, borderColor: '#F87171' },
  actionRight:{ backgroundColor: 'rgba(82,183,136,0.15)', borderWidth: 2, borderColor: '#52B788' },
  actionLeftTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#F87171' },
  actionRightTxt:{ fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: '#52B788' },

  resultIcon:    { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resultTitle:   { fontFamily: fonts.display, fontSize: 28, color: WHITE, marginBottom: 8 },
  resultScore:   { fontFamily: fonts.displaySemibold, fontSize: fontSizes.xl, color: PM, marginBottom: 4 },
  resultXP:      { fontFamily: fonts.bodyBold, fontSize: fontSizes.base, color: '#FCD34D', marginBottom: 16 },
  resultMsg:     { fontFamily: fonts.body, fontSize: fontSizes.base, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  resultActions: { width: '100%', gap: 12 },
  playAgainBtn:  { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  playAgainTxt:  { fontFamily: fonts.displaySemibold, fontSize: fontSizes.md, color: WHITE },
  exitBtn:       { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: MUTED },
  exitTxt:       { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: MUTED },
});

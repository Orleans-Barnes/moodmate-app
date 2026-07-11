import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/state/useAuthStore';
import { fetchInsights, type InsightsResponse } from '@/api/insights';
import { ApiRequestError } from '@/api/client';
import { colors, fonts, fontSizes, glass, glow, radii, shadow, spacing } from '@/theme/tokens';

// ── Helpers ────────────────────────────────────────────────────────────────

function sentimentLabel(score: number): string {
  if (score >= 70)  return 'Very Positive';
  if (score >= 40)  return 'Positive';
  if (score >= 10)  return 'Mildly Positive';
  if (score >= -10) return 'Neutral';
  if (score >= -40) return 'Mildly Low';
  if (score >= -70) return 'Low';
  return 'Very Low';
}

function wellnessLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 25) return 'Low';
  return 'Needs Care';
}

function sentimentColor(score: number): string {
  if (score >= 40)  return colors.sage;
  if (score >= 10)  return '#7BC47F';
  if (score >= -10) return colors.sun;
  if (score >= -40) return '#FF9A3C';
  return '#FF4F4F';
}

function wellnessColor(score: number): string {
  if (score >= 70) return colors.sage;
  if (score >= 45) return colors.sun;
  return '#FF6B6B';
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ── Score Ring ─────────────────────────────────────────────────────────────

interface RingProps {
  score: number;       // -100 to 100
  color: string;
  size?: number;
  animProgress: Animated.Value;
}

function SentimentRing({ score, color, size = 110, animProgress }: RingProps) {
  const borderWidth = 7;
  const displayScore = score >= 0 ? `+${score}` : `${score}`;

  const scale = animProgress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const opacity = animProgress.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1] });

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }, styles.ringWrap]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 8,
          },
        ]}
      >
        <Text style={[styles.ringScore, { color }]}>{displayScore}</Text>
        <Text style={styles.ringOf}>/ 100</Text>
      </View>
    </Animated.View>
  );
}

// ── Wellness Bar ────────────────────────────────────────────────────────────

interface BarProps {
  score: number;
  color: string;
  animProgress: Animated.Value;
}

function WellnessBar({ score, color, animProgress }: BarProps) {
  const width = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${score}%`],
  });

  return (
    <View style={styles.wellnessBarTrack}>
      <Animated.View
        style={[
          styles.wellnessBarFill,
          {
            width,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
          },
        ]}
      />
    </View>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonBlock({ w, h, r = 10 }: { w: number | string; h: number; r?: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);
  return (
    <Animated.View
      style={{ width: w as any, height: h, borderRadius: r, backgroundColor: 'rgba(0,0,0,0.08)', opacity: anim, marginVertical: 4 }}
    />
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────

export function InsightsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuthStore();

  const [data, setData]         = useState<InsightsResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  // Animation drivers
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scoreAnim  = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(30)).current;

  const load = useCallback(async (isRefresh = false) => {
    if (!token || token === 'guest') {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefresh(true); else setLoading(true);
    setError(null);
    setLimitHit(false);

    // Reset animations
    fadeAnim.setValue(0);
    scoreAnim.setValue(0);
    cardSlide.setValue(30);

    try {
      const result = await fetchInsights(token);
      setData(result);

      // Play entry animation
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(scoreAnim, { toValue: 1, duration: 900, delay: 300, useNativeDriver: false }),
      ]).start();
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 429) {
        setLimitHit(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      } else {
        setError('Could not load insights. Check your connection.');
      }
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);


  // ── Guest wall ───────────────────────────────────────────────────────────
  if (!token || token === 'guest') {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={['#4B2D8A', '#7B3CC9', '#C84895']} style={StyleSheet.absoluteFill} />
        <View style={styles.guestCard}>
          <Ionicons name="sparkles" size={48} color={colors.lavender} />
          <Text style={styles.guestTitle}>AI Insights</Text>
          <Text style={styles.guestBody}>
            Create an account to unlock personalised AI insights based on your mood check-ins and journal entries.
          </Text>
        </View>
      </View>
    );
  }

  const sColor = data ? sentimentColor(data.sentimentScore) : colors.sage;
  const wColor = data ? wellnessColor(data.wellnessScore)   : colors.sage;

  return (
    <View style={styles.container}>
      {/* ── Gradient header ── */}
      <LinearGradient
        colors={['#3B1F7A', '#6B2FA0', '#C84895']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        {/* Title row */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.9)" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>AI Insights</Text>
            </View>
            <Text style={styles.headerSub}>
              {data
                ? `Generated at ${formatTime(data.generatedAt)}`
                : 'Analysing your wellbeing…'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => load(true)}
            disabled={refreshing || loading}
            style={styles.refreshBtn}
            activeOpacity={0.75}
          >
            <Ionicons
              name="refresh"
              size={18}
              color="rgba(255,255,255,0.9)"
            />
          </TouchableOpacity>
        </View>

        {/* ── Narrative card (floating on gradient) ── */}
        <View style={styles.narrativeCard}>
          {loading ? (
            <View style={{ padding: spacing.lg }}>
              <SkeletonBlock w="60%" h={14} />
              <SkeletonBlock w="100%" h={12} />
              <SkeletonBlock w="90%" h={12} />
              <SkeletonBlock w="75%" h={12} />
            </View>
          ) : error ? (
            <View style={styles.narrativePad}>
              <Ionicons name="cloud-offline-outline" size={28} color={colors.inkFaint} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : limitHit && !data ? (
            <View style={styles.narrativePad}>
              <Ionicons name="time-outline" size={28} color={colors.sun} />
              <Text style={styles.limitTitle}>Daily limit reached</Text>
              <Text style={styles.limitBody}>
                Free accounts get 5 AI insight requests per day. Upgrade to Premium for unlimited access.
              </Text>
            </View>
          ) : data ? (
            <Animated.View style={[styles.narrativePad, { opacity: fadeAnim, transform: [{ translateY: cardSlide }] }]}>
              <View style={styles.narrativeIconRow}>
                <View style={styles.aiBadge}>
                  <Ionicons name="pulse" size={13} color="#FFFFFF" />
                  <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Text style={styles.aiBadgeText}>MoodMate AI</Text>
                    <Text style={styles.aiBadgePowered}>powered by Groq</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.narrativeText}>{data.narrativeSummary}</Text>
            </Animated.View>
          ) : null}
        </View>
      </LinearGradient>

      {/* ── Score section ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.lavender}
          />
        }
      >
        {limitHit && (
          <View style={styles.limitBanner}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.sunText} />
            <Text style={styles.limitBannerText}>
              Daily limit reached · Resets at midnight
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {data && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Score cards row */}
            <View style={styles.scoreRow}>
              {/* Sentiment card */}
              <View style={[styles.scoreCard, shadow.md]}>
                <Text style={styles.scoreCardLabel}>Sentiment</Text>
                <SentimentRing
                  score={data.sentimentScore}
                  color={sColor}
                  animProgress={scoreAnim}
                />
                <Text style={[styles.scoreCardTag, { color: sColor }]}>
                  {sentimentLabel(data.sentimentScore)}
                </Text>
                <Text style={styles.scoreCardHint}>Based on your mood & journals</Text>
              </View>

              {/* Wellness card */}
              <View style={[styles.scoreCard, shadow.md]}>
                <Text style={styles.scoreCardLabel}>Wellness</Text>
                <View style={styles.wellnessNumWrap}>
                  <Text style={[styles.wellnessNum, { color: wColor }]}>
                    {data.wellnessScore}
                  </Text>
                  <Text style={styles.wellnessOf}>/100</Text>
                </View>
                <WellnessBar score={data.wellnessScore} color={wColor} animProgress={scoreAnim} />
                <Text style={[styles.scoreCardTag, { color: wColor }]}>
                  {wellnessLabel(data.wellnessScore)}
                </Text>
                <Text style={styles.scoreCardHint}>Overall wellbeing score</Text>
              </View>
            </View>

            {/* Forecast alert */}
            {data.forecastAlert && (
              <View style={styles.alertCard}>
                <View style={styles.alertIconWrap}>
                  <Ionicons name="warning-outline" size={22} color="#C86B00" />
                </View>
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>Heads Up</Text>
                  <Text style={styles.alertText}>{data.forecastAlert}</Text>
                </View>
              </View>
            )}

            {/* Chat with AI ── */}
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate("AiChat" as never)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#7B3CC9", "#C84895"]}
                style={styles.chatBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.chatBtnText}>Chat with AI</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>

            {/* How it works info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={18} color={colors.lavender} style={{ marginRight: 10 }} />
              <Text style={styles.infoText}>
                Insights are generated from your last 10 mood check-ins and 5 journal entries. The more you log, the more accurate your insights become.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Loading skeleton for scores */}
        {loading && (
          <View style={styles.scoreRow}>
            {[0, 1].map(i => (
              <View key={i} style={[styles.scoreCard, { alignItems: 'flex-start', padding: spacing.lg }]}>
                <SkeletonBlock w="50%" h={14} />
                <SkeletonBlock w={110} h={110} r={55} />
                <SkeletonBlock w="60%" h={12} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered:  { justifyContent: 'center', alignItems: 'center' },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:   'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize:   fontSizes.xxl,
    color:      '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.sm,
    color:      'rgba(255,255,255,0.65)',
    marginTop:  2,
    marginLeft: 28,
  },
  refreshBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },

  // ── Narrative card ──────────────────────────────────────────────────────
  narrativeCard: {
    backgroundColor: glass.lightFill,
    borderRadius:    radii.lg,
    borderWidth:     1,
    borderColor:     glass.lightBorder,
    marginBottom:    -20,  // overlap into scroll area
    overflow:        'hidden',
    ...shadow.md,
  },
  narrativePad: {
    padding: spacing.xl,
  },
  narrativeIconRow: {
    flexDirection: 'row',
    alignItems:   'center',
    marginBottom: spacing.sm,
  },
  aiBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.lavender,
    borderRadius:    radii.pill,
    paddingHorizontal: 10,
    paddingVertical:   5,
    gap:             4,
  },
  aiBadgeText: {
    fontFamily:    fonts.bodyBold,
    fontSize:      fontSizes.xs,
    color:         '#FFFFFF',
    letterSpacing: 0.5,
  },
  aiBadgePowered: {
    fontFamily:    fonts.body,
    fontSize:      8.5,
    color:         'rgba(255,255,255,0.72)',
    letterSpacing: 0.3,
  },
  narrativeText: {
    fontFamily:  fonts.bodyMedium,
    fontSize:    fontSizes.md,
    color:       colors.ink,
    lineHeight:  22,
    marginTop:   spacing.sm,
  },

  // ── Error / limit states ────────────────────────────────────────────────
  errorText: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.base,
    color:      colors.inkSoft,
    textAlign:  'center',
    marginTop:  spacing.md,
  },
  limitTitle: {
    fontFamily: fonts.display,
    fontSize:   fontSizes.lg,
    color:      colors.ink,
    marginTop:  spacing.sm,
    textAlign:  'center',
  },
  limitBody: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.base,
    color:      colors.inkSoft,
    textAlign:  'center',
    marginTop:  spacing.sm,
    lineHeight: 20,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop:        36,   // accounts for narrativeCard overlap
    paddingHorizontal: spacing.lg,
    gap:               spacing.lg,
  },

  // ── Limit banner ────────────────────────────────────────────────────────
  limitBanner: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: colors.sunSoft,
    borderRadius:   radii.md,
    padding:        spacing.md,
    gap:            spacing.sm,
    borderWidth:    1,
    borderColor:    colors.sun,
    marginTop:      spacing.xl,
  },
  limitBannerText: {
    flex:       1,
    fontFamily: fonts.bodyMedium,
    fontSize:   fontSizes.sm,
    color:      colors.sunText,
  },
  upgradeBtn: {
    backgroundColor: colors.sun,
    borderRadius:    radii.pill,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  upgradeBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize:   fontSizes.sm,
    color:      colors.sunText,
  },

  // ── Score row ───────────────────────────────────────────────────────────
  scoreRow: {
    flexDirection: 'row',
    gap:           spacing.md,
    marginTop:     spacing.xl,
  },
  scoreCard: {
    flex:            1,
    backgroundColor: colors.surface,
    borderRadius:    radii.lg,
    padding:         spacing.lg,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'rgba(0,0,0,0.06)',
  },
  scoreCardLabel: {
    fontFamily: fonts.bodyBold,
    fontSize:   fontSizes.sm,
    color:      colors.inkSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  spacing.md,
    alignSelf:     'flex-start',
  },
  scoreCardTag: {
    fontFamily: fonts.displaySemibold,
    fontSize:   fontSizes.base,
    marginTop:  spacing.md,
  },
  scoreCardHint: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.xs,
    color:      colors.inkFaint,
    textAlign:  'center',
    marginTop:  spacing.xs,
  },

  // ── Ring ────────────────────────────────────────────────────────────────
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ringScore: {
    fontFamily: fonts.display,
    fontSize:   28,
    lineHeight: 34,
  },
  ringOf: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.xs,
    color:      colors.inkFaint,
  },

  // ── Wellness bar ────────────────────────────────────────────────────────
  wellnessNumWrap: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    marginBottom:  spacing.md,
  },
  wellnessNum: {
    fontFamily: fonts.display,
    fontSize:   38,
    lineHeight: 42,
  },
  wellnessOf: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.sm,
    color:      colors.inkFaint,
    marginBottom: 6,
    marginLeft:   2,
  },
  wellnessBarTrack: {
    width:           '100%',
    height:          10,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius:    radii.pill,
    overflow:        'hidden',
  },
  wellnessBarFill: {
    height:       10,
    borderRadius: radii.pill,
  },

  // ── Forecast alert ──────────────────────────────────────────────────────
  alertCard: {
    flexDirection:   'row',
    backgroundColor: '#FFF8EC',
    borderRadius:    radii.lg,
    padding:         spacing.lg,
    borderWidth:     1,
    borderColor:     '#FFD080',
    gap:             spacing.md,
    alignItems:      'flex-start',
  },
  alertIconWrap: {
    width:          40,
    height:         40,
    borderRadius:   radii.md,
    backgroundColor: '#FFE9B8',
    alignItems:      'center',
    justifyContent:  'center',
  },
  alertBody:  { flex: 1 },
  alertTitle: {
    fontFamily: fonts.displaySemibold,
    fontSize:   fontSizes.md,
    color:      '#7A4600',
    marginBottom: 4,
  },
  alertText: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.base,
    color:      '#9A6000',
    lineHeight: 20,
  },

  // ── Info card ───────────────────────────────────────────────────────────
  infoCard: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: colors.lavenderSoft,
    borderRadius:    radii.md,
    padding:         spacing.lg,
    borderWidth:     1,
    borderColor:     'rgba(142,123,192,0.20)',
  },
  infoText: {
    flex:       1,
    fontFamily: fonts.body,
    fontSize:   fontSizes.sm,
    color:      colors.lavenderDeep,
    lineHeight: 19,
  },

  // ── Chat CTA button ───────────────────────────────────────────
  chatBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: 'rgba(123,60,201,0.45)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  chatBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  chatBtnText: {
    flex: 1,
    fontFamily: 'Baloo2-SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.2,
  },

  // ── Guest wall ──────────────────────────────────────────────────────────
  guestCard: {
    margin:          spacing.xl,
    padding:         spacing.xxl,
    backgroundColor: glass.darkFill,
    borderRadius:    radii.xl,
    borderWidth:     1,
    borderColor:     glass.darkBorder,
    alignItems:      'center',
    gap:             spacing.md,
  },
  guestTitle: {
    fontFamily: fonts.display,
    fontSize:   fontSizes.xxl,
    color:      '#FFFFFF',
  },
  guestBody: {
    fontFamily: fonts.body,
    fontSize:   fontSizes.base,
    color:      'rgba(255,255,255,0.7)',
    textAlign:  'center',
    lineHeight: 22,
  },
});

/**
 * XPBar — Level badge + gradient progress bar with glow tip + XP chip
 *
 * Upgrades:
 *  • Bar fill uses coral→gold gradient (LinearGradient overlay)
 *  • Glowing dot at leading edge of bar that slides with fill
 *  • XP chip uses on-brand rgba (was rgba(0,0,0,0.07))
 *  • Spring animation instead of timing (faster, more physical)
 */
import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, fontSizes, colors } from '@/theme/tokens';

interface Props {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  totalXp: number;
  barColor?: string;
}

export function XPBar({ level, xpInLevel, xpForNextLevel, totalXp, barColor = '#FBBF24' }: Props) {
  const pct     = xpForNextLevel > 0 ? Math.min(xpInLevel / xpForNextLevel, 1) : 1;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: pct,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [pct]); // eslint-disable-line react-hooks/exhaustive-deps

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={s.row}>
      {/* Level badge */}
      <LinearGradient
        colors={['#FBBF24', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.badge}
      >
        <Text style={s.badgeTxt}>Lv{level}</Text>
      </LinearGradient>

      {/* Bar + label */}
      <View style={s.barWrap}>
        <View style={s.track}>
          {/* Gradient fill */}
          <Animated.View style={[s.fillWrap, { width: barWidth }]}>
            <LinearGradient
              colors={['#FF6F4D', '#FBBF24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Glow tip at leading edge */}
            <View style={s.glowTip} />
          </Animated.View>
        </View>
        <Text style={s.xpLabel}>{xpInLevel} / {xpForNextLevel} XP</Text>
      </View>

      {/* Total XP chip */}
      <View style={s.totalChip}>
        <View style={{flexDirection:'row',alignItems:'center',gap:3}}><Ionicons name="star" size={12} color="#F59E0B" /><Text style={s.totalTxt}>{totalXp}</Text></View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10 },

  badge: {
    borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 38, alignItems: 'center',
    shadowColor: 'rgba(251,191,36,0.5)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeTxt: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: '#FFFFFF' },

  barWrap: { flex: 1, gap: 3 },
  track: {
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'visible',
  },
  fillWrap: {
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Glow dot at leading edge
  glowTip: {
    position: 'absolute',
    right: -4,
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  xpLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },

  // Chip — on-brand
  totalChip: {
    backgroundColor: 'rgba(251,191,36,0.22)',
    borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  totalTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.sunText,
  },
});

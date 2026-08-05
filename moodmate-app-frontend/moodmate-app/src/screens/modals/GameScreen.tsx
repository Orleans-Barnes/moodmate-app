import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useGamificationStore } from '@/state/useGamificationStore';
import { useToast } from '@/state/useToast';
import { colors, fonts, fontSizes, spacing, radii, shadow, calm } from '@/theme/tokens';
import { GAME_SYMBOLS, GAME_HIDDEN, type IonName } from '@/theme/iconMap';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

interface Tile {
  id: number;
  symbol: IonName;
  flipped: boolean;
  matched: boolean;
}

function shuffledDeck(): Tile[] {
  const deck = [...GAME_SYMBOLS, ...GAME_SYMBOLS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((symbol, id) => ({ id, symbol, flipped: false, matched: false }));
}

function GameTile({
  tile,
  disabled,
  shaking,
  onPress,
}: {
  tile: Tile;
  disabled: boolean;
  shaking: boolean;
  onPress: () => void;
}) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (shaking) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [shaking, shakeAnim]);

  return (
    <Animated.View
      style={[
        styles.tileWrap,
        { transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] }) }] },
      ]}
    >
      <Pressable
        disabled={disabled || tile.flipped || tile.matched}
        onPress={onPress}
        style={[styles.tile, tile.flipped && styles.tileFlipped, tile.matched && styles.tileMatched]}
      >
        <Ionicons
          name={tile.flipped || tile.matched ? tile.symbol : GAME_HIDDEN}
          size={26}
          color={tile.matched ? '#FFFFFF' : calm.forest}
        />
      </Pressable>
    </Animated.View>
  );
}

const MAX_MOVES = 30;
const TIME_LIMIT_S = 90;

export function GameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tiles, setTiles] = useState<Tile[]>(shuffledDeck);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [locked, setLocked] = useState(false);
  const [shakingIds, setShakingIds] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_S);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const flippedRef = useRef<Tile[]>([]);
  const awardXp = useGamificationStore((s) => s.awardXp);
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);

  // Countdown timer
  useEffect(() => {
    if (gameOver || gameWon) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      setLocked(true);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, gameOver, gameWon]);

  const newGame = useCallback(() => {
    setTiles(shuffledDeck());
    setMoves(0);
    setMatchedPairs(0);
    setLocked(false);
    setShakingIds([]);
    setTimeLeft(TIME_LIMIT_S);
    setGameOver(false);
    setGameWon(false);
    flippedRef.current = [];
  }, []);

  const handleFlip = (tile: Tile) => {
    if (locked || tile.flipped || tile.matched) return;

    const nextTiles = tiles.map((t) => (t.id === tile.id ? { ...t, flipped: true } : t));
    setTiles(nextTiles);
    const nowFlipped = [...flippedRef.current, tile];
    flippedRef.current = nowFlipped;

    if (nowFlipped.length === 2) {
      setLocked(true);
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      // Move limit reached — trigger game over
      if (nextMoves >= MAX_MOVES && matchedPairs + (nowFlipped[0].symbol === nowFlipped[1].symbol ? 1 : 0) < GAME_SYMBOLS.length) {
        setTimeout(() => { setGameOver(true); setLocked(true); }, 750);
      }
      const [a, b] = nowFlipped;

      if (a.symbol === b.symbol) {
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t) => (t.id === a.id || t.id === b.id ? { ...t, matched: true } : t)),
          );
          const next = matchedPairs + 1;
          setMatchedPairs(next);
          confettiRef.current?.fire();
          if (next === GAME_SYMBOLS.length) {
            awardXp(20);
            setGameWon(true);
            setLocked(true);
            setTimeout(() => toast(`All matched in ${nextMoves} moves! +20 XP`), 150);
          }
          flippedRef.current = [];
          setLocked(false);
        }, 350);
      } else {
        setShakingIds([a.id, b.id]);
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t) => (t.id === a.id || t.id === b.id ? { ...t, flipped: false } : t)),
          );
          setShakingIds([]);
          flippedRef.current = [];
          setLocked(false);
        }, 700);
      }
    }
  };

  return (
    <View style={styles.flex}>
      <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ScreenHeader title="Calm Match" onClose={() => navigation.goBack()} />

        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            Moves: <Text style={[styles.statValue, moves >= MAX_MOVES - 5 ? { color: colors.error } : {}]}>{moves}/{MAX_MOVES}</Text>
          </Text>
          <Text style={styles.statText}>
            Pairs: <Text style={[styles.statValue, { color: calm.primary }]}>{matchedPairs}</Text>/{GAME_SYMBOLS.length}
          </Text>
          <Text style={styles.statText}>
            <Ionicons name="time-outline" size={13} color={calm.muted} /> <Text style={[styles.statValue, timeLeft <= 10 ? { color: colors.error } : {}]}>{timeLeft}s</Text>
          </Text>
        </View>

        <View style={styles.grid}>
          {tiles.map((tile) => (
            <GameTile
              key={tile.id}
              tile={tile}
              disabled={locked}
              shaking={shakingIds.includes(tile.id)}
              onPress={() => handleFlip(tile)}
            />
          ))}
        </View>

        <Button label="New game" fullWidth onPress={newGame} style={styles.newGameBtn} />
      </View>
      <ConfettiBurst ref={confettiRef} />
      {(gameOver || gameWon) && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Ionicons name={gameWon ? 'trophy' : 'time-outline'} size={48} color={gameWon ? colors.premiumGold : colors.inkFaint} />
            <Text style={styles.overlayTitle}>{gameWon ? 'You Won!' : 'Game Over'}</Text>
            <Text style={styles.overlaySub}>
              {gameWon
                ? `${matchedPairs}/${GAME_SYMBOLS.length} pairs in ${moves} moves`
                : `${matchedPairs}/${GAME_SYMBOLS.length} pairs matched — ${timeLeft <= 0 ? "Time's up!" : `${MAX_MOVES} moves used`}`}
            </Text>
            <Pressable style={styles.overlayBtn} onPress={newGame}>
              <Text style={styles.overlayBtnTxt}>Play Again</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: calm.bg, padding: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  statText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: calm.muted },
  statValue: { color: calm.forest },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tileWrap: { width: '31%', aspectRatio: 1 },
  tile: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: calm.mintBg,
    borderWidth: 1.5,
    borderColor: calm.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFlipped: { backgroundColor: colors.surface, borderColor: calm.primary },
  tileMatched: { backgroundColor: calm.primary, borderColor: calm.primary, opacity: 0.85 },
  newGameBtn: { marginTop: spacing.lg },

  // Game Over overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 32,
    ...shadow.lg,
  },
  overlayEmoji: { fontSize: 52 },
  overlayTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.ink,
  },
  overlaySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  overlayBtn: {
    marginTop: 8,
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  overlayBtnTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
});

import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Shadow } from "../../constants/moodTheme";

const SESSIONS = [
  {
    id: "1",
    icon: "🧘",
    title: "Body scan",
    meta: "8 min",
    bg: Colors.lavenderSoft,
  },
  {
    id: "2",
    icon: "😮‍💨",
    title: "Anxiety release",
    meta: "6 min",
    bg: Colors.blueSoft,
  },
  {
    id: "3",
    icon: "🌅",
    title: "Morning intention",
    meta: "5 min",
    bg: Colors.sunSoft,
  },
];

const SOUNDS = [
  { id: "1", icon: "🌧", name: "Rain" },
  { id: "2", icon: "🌊", name: "Ocean" },
  { id: "3", icon: "🔥", name: "Fireplace" },
  { id: "4", icon: "🍃", name: "Forest" },
  { id: "5", icon: "☕", name: "Café" },
  { id: "6", icon: "🎵", name: "Lo-fi" },
];

function SessionRow({
  icon,
  title,
  meta,
  bg,
}: {
  icon: string;
  title: string;
  meta: string;
  bg: string;
}) {
  return (
    <TouchableOpacity style={styles.sessionRow} activeOpacity={0.7}>
      <View style={[styles.sessionIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.sessionTitle}>{title}</Text>
        <Text style={styles.sessionMeta}>{meta}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SoundTile({
  icon,
  name,
  active,
  onPress,
}: {
  icon: string;
  name: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.soundTile, active && styles.soundTileOn]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.soundIcon}>{icon}</Text>
      <Text style={styles.soundName}>{name}</Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const [activeSound, setActiveSound] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Explore</Text>

        <TouchableOpacity
          style={[styles.card, styles.tintBlue]}
          activeOpacity={0.85}
        >
          <View style={styles.heroRow}>
            <View style={styles.heroRing}>
              <Text style={{ fontSize: 22 }}>🫁</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>2-min Breathing Reset</Text>
              <Text style={styles.heroSub}>
                Calm your nervous system before class
              </Text>
            </View>
          </View>
          <View style={styles.beginBtn}>
            <Text style={styles.beginBtnLabel}>Begin session</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.h2}>Daily calm</Text>
        <View style={styles.card}>
          {SESSIONS.map((s) => (
            <SessionRow key={s.id} {...s} />
          ))}
        </View>

        <Text style={styles.h2}>Soundscapes</Text>
        <View style={styles.soundGrid}>
          {SOUNDS.map((s) => (
            <SoundTile
              key={s.id}
              icon={s.icon}
              name={s.name}
              active={activeSound === s.id}
              onPress={() => setActiveSound(activeSound === s.id ? null : s.id)}
            />
          ))}
        </View>

        <View style={styles.sectionHeadRow}>
          <Text style={styles.h2}>Wellness Hub</Text>
          <Text style={styles.freeTag}>always free</Text>
        </View>
        <TouchableOpacity
          style={[styles.card, styles.tintSage]}
          activeOpacity={0.85}
        >
          <View style={styles.heroRow}>
            <View style={styles.heroRing}>
              <Text style={{ fontSize: 22 }}>📚</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Blogs & campus events</Text>
              <Text style={styles.heroSub}>
                What every student should know — plus what's happening on campus
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.h2}>Play</Text>
        <TouchableOpacity
          style={[styles.card, styles.tintBlue]}
          activeOpacity={0.85}
        >
          <View style={[styles.heroRow, { marginBottom: 0 }]}>
            <View style={styles.heroRing}>
              <Text style={{ fontSize: 22 }}>🎮</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Calm Match</Text>
              <Text style={styles.heroSub}>
                A quick memory game to reset your mind — free for everyone
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.lockedCard]}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 20 }}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.lockedTitle}>3 more calming games</Text>
            <Text style={styles.lockedSub}>
              Garden Builder · Breath Bubble · Word Garden
            </Text>
          </View>
          <View style={styles.proChip}>
            <Text style={styles.proChipText}>PRO</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.h2}>Challenges</Text>
        <TouchableOpacity style={styles.card} activeOpacity={0.85}>
          <View style={styles.teaserRow}>
            <Text style={styles.teaserLabel}>🧘 7-Day Calm Challenge</Text>
            <Text style={styles.teaserMeta}>4 days left</Text>
          </View>
          <View style={styles.teaserBarBg}>
            <View
              style={[
                styles.teaserBarFill,
                { width: "57%", backgroundColor: Colors.sun },
              ]}
            />
          </View>
          <Text style={styles.teaserSub}>
            Tap to see all wellness challenges
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.85}>
          <View style={styles.teaserRow}>
            <Text style={styles.teaserLabel}>📚 Exam Survival Hub</Text>
            <Text style={styles.teaserMeta}>9 days left</Text>
          </View>
          <View style={styles.teaserBarBg}>
            <View
              style={[
                styles.teaserBarFill,
                { width: "45%", backgroundColor: Colors.coral },
              ]}
            />
          </View>
          <Text style={styles.teaserSub}>5-day stress-free study plan</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingTop: 56 },

  h1: { fontSize: 22, fontWeight: "700", color: Colors.ink, marginBottom: 16 },
  h2: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.ink,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 18,
  },
  freeTag: { fontSize: 11, color: Colors.sage, fontWeight: "700" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    ...Shadow.sm,
  },
  tintBlue: { backgroundColor: Colors.blueSoft },
  tintSage: { backgroundColor: Colors.sageSoft },

  heroRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 13,
  },
  heroRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  heroSub: {
    fontSize: 11,
    color: Colors.inkSoft,
    fontWeight: "500",
    marginTop: 3,
    lineHeight: 16,
  },

  beginBtn: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
  },
  beginBtnLabel: { fontSize: 13, fontWeight: "700", color: Colors.white },

  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sessionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionTitle: { fontSize: 12.5, fontWeight: "700", color: Colors.ink },
  sessionMeta: { fontSize: 10, color: Colors.inkFaint, fontWeight: "600" },

  soundGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  soundTile: {
    width: "31%",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  soundTileOn: { backgroundColor: Colors.blueSoft, borderColor: Colors.blue },
  soundIcon: { fontSize: 18, marginBottom: 5 },
  soundName: { fontSize: 10, fontWeight: "700", color: Colors.ink },

  lockedCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  lockedTitle: { fontSize: 12.5, fontWeight: "700", color: Colors.ink },
  lockedSub: {
    fontSize: 10.5,
    color: Colors.inkSoft,
    fontWeight: "600",
    marginTop: 2,
  },
  proChip: {
    backgroundColor: Colors.sun,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  proChipText: { fontSize: 9, fontWeight: "800", color: "#5A4300" },

  teaserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  teaserLabel: { fontSize: 12.5, fontWeight: "700", color: Colors.ink },
  teaserMeta: { fontSize: 12.5, fontWeight: "700", color: Colors.inkSoft },
  teaserBarBg: {
    height: 5,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },
  teaserBarFill: { height: "100%", borderRadius: 3 },
  teaserSub: { fontSize: 10.5, color: Colors.inkSoft, fontWeight: "500" },
});

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Shadow } from "../../constants/moodTheme";

const INITIAL_GOALS = [
  { id: "1", label: "Morning mood check-in", xp: 10, done: false },
  { id: "2", label: "Write one gratitude", xp: 10, done: false },
  { id: "3", label: "2-min breathing", xp: 15, done: false },
];

function WellnessTreeCard({
  xp,
  onPress,
}: {
  xp: number;
  onPress: () => void;
}) {
  const progress = Math.min((xp / 700) * 100, 100);
  return (
    <TouchableOpacity
      style={[styles.card, styles.tintSage]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.treeRow}>
        <Text style={styles.treeIcon}>🌳</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.treeLevel}>Level 3 · "Sprout"</Text>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.treeSub}>Tap to visit your tree</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StreakBadge({ count }: { count: number }) {
  return (
    <View style={styles.streak}>
      <Text style={styles.flame}>🔥</Text>
      <View>
        <Text style={styles.streakNum}>{count}-day streak</Text>
        <Text style={styles.streakSub}>Don't break the chain!</Text>
      </View>
    </View>
  );
}

function GoalRow({
  goal,
  onToggle,
}: {
  goal: (typeof INITIAL_GOALS)[0];
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.goalRow}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.goalCheck, goal.done && styles.goalCheckDone]}>
        {goal.done && <Text style={styles.goalCheckMark}>✓</Text>}
      </View>
      <Text style={[styles.goalText, goal.done && styles.goalTextDone]}>
        {goal.label}
      </Text>
      <Text style={styles.goalXp}>+{goal.xp}</Text>
    </TouchableOpacity>
  );
}

function QuickItem({
  emoji,
  label,
  bg,
  onPress,
}: {
  emoji: string;
  label: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.qIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 19 }}>{emoji}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [xp, setXp] = useState(420);

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newDone = !g.done;
        setXp((x) => x + (newDone ? g.xp : -g.xp));
        return { ...g, done: newDone };
      }),
    );
  };

  const doneCount = goals.filter((g) => g.done).length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rowTop}>
          <View>
            <Text style={styles.hi}>Hi Ama 👋</Text>
            <Text style={styles.sub}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <Text style={{ fontSize: 17 }}>👤</Text>
          </TouchableOpacity>
        </View>

        <WellnessTreeCard xp={xp} onPress={() => {}} />

        <StreakBadge count={7} />

        <View style={styles.sectionHead}>
          <Text style={styles.h2}>Today's goals</Text>
          <Text style={styles.meta}>
            {doneCount}/{goals.length} done
          </Text>
        </View>
        <View style={[styles.card, { paddingVertical: 4 }]}>
          {goals.map((g) => (
            <GoalRow key={g.id} goal={g} onToggle={() => toggleGoal(g.id)} />
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.h2}>Jump back in</Text>
        </View>
        <View style={styles.quickGrid}>
          <QuickItem
            emoji="🫁"
            label="Breathe"
            bg={Colors.blueSoft}
            onPress={() => router.push("/(tabs)/explore")}
          />
          <QuickItem
            emoji="📓"
            label="Journal"
            bg={Colors.sageSoft}
            onPress={() => router.push("/(tabs)/journal")}
          />
          <QuickItem
            emoji="🔍"
            label="Explore"
            bg={Colors.lavenderSoft}
            onPress={() => router.push("/(tabs)/explore")}
          />
          <QuickItem
            emoji="💗"
            label="Check in"
            bg={Colors.coralSoft}
            onPress={() => router.push("/checkin-modal")}
          />
        </View>

        <TouchableOpacity
          style={[styles.card, styles.tintLav]}
          activeOpacity={0.85}
        >
          <View style={styles.insightTop}>
            <Text style={styles.insightLabel}>✨ AI Insight</Text>
            <View style={styles.proChip}>
              <Text style={styles.proChipText}>PRO</Text>
            </View>
          </View>
          <Text style={styles.insightText}>
            Your stress dips every Wednesday afternoon — want a 5-minute reset
            reminder then?
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingTop: 56 },

  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  hi: { fontSize: 20, fontWeight: "700", color: Colors.ink },
  sub: {
    fontSize: 12,
    color: Colors.inkFaint,
    fontWeight: "600",
    marginTop: 2,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lavenderSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 14,
    ...Shadow.sm,
  },
  tintSage: { backgroundColor: Colors.sageSoft },
  tintLav: { backgroundColor: Colors.lavenderSoft },

  treeRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  treeIcon: { fontSize: 36 },
  treeLevel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 6,
  },
  xpBarBg: {
    height: 7,
    backgroundColor: "rgba(95,158,124,0.22)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", backgroundColor: Colors.sage, borderRadius: 4 },
  treeSub: {
    fontSize: 11,
    color: Colors.inkSoft,
    marginTop: 6,
    fontWeight: "600",
  },

  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Colors.sunSoft,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 8,
  },
  flame: { fontSize: 22 },
  streakNum: { fontSize: 13, fontWeight: "700", color: Colors.ink },
  streakSub: { fontSize: 11, color: Colors.inkSoft, fontWeight: "600" },

  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 18,
    marginBottom: 8,
  },
  h2: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  meta: { fontSize: 11, color: Colors.inkFaint, fontWeight: "700" },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  goalCheck: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: Colors.inkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  goalCheckDone: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  goalCheckMark: { color: Colors.white, fontSize: 12, fontWeight: "800" },
  goalText: { flex: 1, fontSize: 13, fontWeight: "600", color: Colors.ink },
  goalTextDone: { textDecorationLine: "line-through", color: Colors.inkFaint },
  goalXp: { fontSize: 11, fontWeight: "800", color: Colors.sage },

  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  quickItem: { alignItems: "center", gap: 6 },
  qIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 10, fontWeight: "700", color: Colors.inkSoft },

  insightTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  insightLabel: { fontSize: 13, fontWeight: "700", color: Colors.ink },
  proChip: {
    backgroundColor: Colors.sun,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  proChipText: { fontSize: 9, fontWeight: "800", color: "#5A4300" },
  insightText: {
    fontSize: 12,
    color: Colors.inkSoft,
    lineHeight: 18,
    fontWeight: "500",
  },
});

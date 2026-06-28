import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors, Radius, Shadow } from "../../constants/moodTheme";

const TOPICS = [
  "#exam-season",
  "#anxiety",
  "#first-year",
  "#relationships",
  "#wins",
  "#sleep",
];

const POSTS = [
  {
    id: "1",
    author: "Anonymous Owl",
    time: "2h",
    text: "Anyone else feel behind on everything 3 days before finals? Lowkey panicking.",
    reactions: [
      { emoji: "❤️", count: 41, on: true },
      { emoji: "🙏", count: 18, on: false },
      { emoji: "💪", count: 9, on: false },
    ],
  },
  {
    id: "2",
    author: "Anonymous Fox",
    time: "5h",
    text: "Small win: finally talked to a counsellor today. Genuinely felt lighter after.",
    reactions: [
      { emoji: "❤️", count: 62, on: false },
      { emoji: "🎉", count: 14, on: false },
    ],
  },
];

function TopicChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipOn]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PostCard({ post }: { post: (typeof POSTS)[0] }) {
  const [reactions, setReactions] = useState(post.reactions);

  const toggleReaction = (idx: number) => {
    setReactions((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, on: !r.on, count: r.on ? r.count - 1 : r.count + 1 }
          : r,
      ),
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.postMeta}>
        <Text style={styles.postAuthor}>{post.author}</Text>
        <Text style={styles.postTime}>· {post.time}</Text>
      </View>
      <Text style={styles.postText}>"{post.text}"</Text>
      <View style={styles.reactRow}>
        {reactions.map((r, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.reactBtn, r.on && styles.reactBtnOn]}
            onPress={() => toggleReaction(idx)}
            activeOpacity={0.7}
          >
            <Text style={styles.reactText}>
              {r.emoji} {r.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const [mode, setMode] = useState<"voices" | "peer">("voices");
  const [activeTopic, setActiveTopic] = useState("#exam-season");

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Community</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleOpt, mode === "voices" && styles.toggleOptSel]}
            onPress={() => setMode("voices")}
            activeOpacity={0.8}
          >
            <Text style={styles.toggleIcon}>🗣️</Text>
            <Text style={styles.toggleName}>Campus Voices</Text>
            <Text style={styles.toggleSub}>anonymous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOpt, mode === "peer" && styles.toggleOptSel]}
            onPress={() => setMode("peer")}
            activeOpacity={0.8}
          >
            <Text style={styles.toggleIcon}>🤝</Text>
            <Text style={styles.toggleName}>PeerConnect</Text>
            <Text style={styles.toggleSub}>1:1 mentors</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topicsRow}>
          {TOPICS.map((t) => (
            <TopicChip
              key={t}
              label={t}
              active={activeTopic === t}
              onPress={() => setActiveTopic(t)}
            />
          ))}
        </View>

        {POSTS.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}

        <View style={styles.sectionHeadRow}>
          <Text style={styles.h2}>Mentor spotlight</Text>
          <Text style={styles.onlineTag}>online now</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.mentorRow}>
            <Text style={styles.mentorAvatar}>🧑🏽</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.mentorName}>Kwame · Peer Mentor</Text>
              <View style={styles.mentorMetaRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.mentorMeta}>Stress · Time mgmt</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.chatBtn}>
              <Text style={styles.chatBtnLabel}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingTop: 56 },

  h1: { fontSize: 22, fontWeight: "700", color: Colors.ink, marginBottom: 16 },
  h2: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  sectionHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 18,
    marginBottom: 10,
  },
  onlineTag: { fontSize: 11, color: Colors.sage, fontWeight: "700" },

  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  toggleOpt: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: 15,
    alignItems: "center",
  },
  toggleOptSel: {
    borderColor: Colors.coral,
    backgroundColor: Colors.coralSoft,
  },
  toggleIcon: { fontSize: 22, marginBottom: 6 },
  toggleName: { fontSize: 12.5, fontWeight: "700", color: Colors.ink },
  toggleSub: {
    fontSize: 10,
    color: Colors.inkFaint,
    fontWeight: "600",
    marginTop: 2,
  },

  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
  },
  chipOn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipText: { fontSize: 11.5, fontWeight: "700", color: Colors.inkSoft },
  chipTextOn: { color: Colors.white },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    ...Shadow.sm,
  },
  postMeta: { flexDirection: "row", gap: 6, marginBottom: 7 },
  postAuthor: { fontSize: 10.5, color: Colors.inkFaint, fontWeight: "700" },
  postTime: { fontSize: 10.5, color: Colors.inkFaint, fontWeight: "600" },
  postText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: Colors.ink,
    marginBottom: 11,
  },

  reactRow: { flexDirection: "row", gap: 6 },
  reactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.line,
  },
  reactBtnOn: { backgroundColor: Colors.coralSoft, borderColor: Colors.coral },
  reactText: { fontSize: 11.5, fontWeight: "700", color: Colors.inkSoft },

  mentorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mentorAvatar: {
    fontSize: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sageSoft,
    textAlign: "center",
    lineHeight: 42,
  },
  mentorName: { fontSize: 12.5, fontWeight: "700", color: Colors.ink },
  mentorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4CAF7D",
  },
  mentorMeta: { fontSize: 10.5, color: Colors.inkFaint, fontWeight: "600" },
  chatBtn: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  chatBtnLabel: { fontSize: 12, fontWeight: "700", color: Colors.white },
});

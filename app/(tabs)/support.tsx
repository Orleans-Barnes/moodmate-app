import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors, Radius, Shadow } from "../../constants/moodTheme";

const MENTORS = [
  { id: "1", emoji: "🧑🏽", name: "Kwame", online: true },
  { id: "2", emoji: "👩🏽", name: "Adwoa", online: true },
  { id: "3", emoji: "🧑🏿", name: "Yaw", online: false },
];

const MESSAGES = [
  {
    id: "1",
    emoji: "👩🏽‍⚕️",
    name: "Dr. Mensah",
    preview: '"See you Thursday…"',
    unread: true,
  },
  {
    id: "2",
    emoji: "🧑🏽",
    name: "Kwame · mentor",
    preview: '"How did the exam go?"',
    unread: false,
  },
];

function MentorTile({
  emoji,
  name,
  online,
}: {
  emoji: string;
  name: string;
  online: boolean;
}) {
  return (
    <TouchableOpacity style={styles.mentorTile} activeOpacity={0.8}>
      <Text style={styles.mentorTileAvatar}>{emoji}</Text>
      <Text style={styles.mentorTileName}>{name}</Text>
      {online && <View style={styles.onlineDot} />}
    </TouchableOpacity>
  );
}

function MessageRow({
  emoji,
  name,
  preview,
  unread,
}: {
  emoji: string;
  name: string;
  preview: string;
  unread: boolean;
}) {
  return (
    <TouchableOpacity style={styles.msgRow} activeOpacity={0.7}>
      <Text style={styles.msgAvatar}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.msgName}>{name}</Text>
        <Text style={styles.msgPreview}>{preview}</Text>
      </View>
      {unread && <Text style={styles.unreadDot}>●</Text>}
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Support</Text>

        <View style={[styles.card, styles.tintCoral]}>
          <Text style={styles.apptTop}>Upcoming appointment</Text>
          <View style={styles.apptRow}>
            <Text style={styles.apptName}>Dr. Mensah</Text>
            <Text style={styles.apptTime}>Thu · 2:00pm</Text>
          </View>
          <View style={styles.apptActions}>
            <TouchableOpacity style={styles.apptBtnPrimary}>
              <Text style={styles.apptBtnPrimaryLabel}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.apptBtn}>
              <Text style={styles.apptBtnLabel}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.apptBtn}>
              <Text style={styles.apptBtnLabel}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85}>
          <Text style={styles.bookBtnLabel}>＋ Book a session</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeadRow}>
          <Text style={styles.h2}>Peer mentors</Text>
          <Text style={styles.seeAll}>see all</Text>
        </View>
        <View style={styles.mentorGrid}>
          {MENTORS.map((m) => (
            <MentorTile key={m.id} {...m} />
          ))}
        </View>

        <View style={styles.sectionHeadRow}>
          <Text style={styles.h2}>Messages</Text>
          <Text style={styles.unreadMeta}>2 unread</Text>
        </View>
        {MESSAGES.map((m) => (
          <MessageRow key={m.id} {...m} />
        ))}

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
  seeAll: { fontSize: 11, color: Colors.inkFaint, fontWeight: "700" },
  unreadMeta: { fontSize: 11, color: Colors.inkFaint, fontWeight: "700" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 14,
    ...Shadow.sm,
  },
  tintCoral: { backgroundColor: Colors.coralSoft },

  apptTop: {
    fontSize: 11,
    color: Colors.inkSoft,
    fontWeight: "700",
    marginBottom: 5,
  },
  apptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },
  apptName: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  apptTime: { fontSize: 11.5, color: Colors.inkSoft, fontWeight: "600" },
  apptActions: { flexDirection: "row", gap: 7 },
  apptBtnPrimary: {
    flex: 1,
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  apptBtnPrimaryLabel: { fontSize: 11, fontWeight: "700", color: Colors.white },
  apptBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.line,
  },
  apptBtnLabel: { fontSize: 11, fontWeight: "700", color: Colors.ink },

  bookBtn: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 6,
  },
  bookBtnLabel: { fontSize: 15, fontWeight: "700", color: Colors.white },

  mentorGrid: { flexDirection: "row", gap: 8 },
  mentorTile: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  mentorTileAvatar: {
    fontSize: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sageSoft,
    textAlign: "center",
    lineHeight: 42,
    marginBottom: 7,
  },
  mentorTileName: { fontSize: 11, fontWeight: "700", color: Colors.ink },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4CAF7D",
    marginTop: 4,
  },

  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  msgAvatar: {
    fontSize: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sageSoft,
    textAlign: "center",
    lineHeight: 42,
  },
  msgName: { fontSize: 12, fontWeight: "700", color: Colors.ink },
  msgPreview: { fontSize: 10.5, color: Colors.inkFaint, fontWeight: "500" },
  unreadDot: { color: Colors.coral, fontSize: 9 },
});

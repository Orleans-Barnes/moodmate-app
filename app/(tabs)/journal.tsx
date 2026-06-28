import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Shadow } from "../../constants/moodTheme";

const CAL_DAYS = [
  { day: "8", active: false },
  { day: "9", active: false },
  { day: "10", active: true },
  { day: "11", active: false },
  { day: "12", active: false },
];

const TEMPLATES = [
  { id: "1", icon: "📋", name: "Daily reflection" },
  { id: "2", icon: "📚", name: "Exam stress" },
  { id: "3", icon: "🙏", name: "Gratitude jar" },
  { id: "4", icon: "🎯", name: "Goals & wins" },
];

const ENTRIES = [
  { id: "1", title: "Exam stress journal", date: "Jun 9", progress: 70 },
  { id: "2", title: "Gratitude log", date: "Jun 7", progress: 50 },
  { id: "3", title: "Mindful morning", date: "Jun 5", progress: 80 },
];

function CalendarRow() {
  return (
    <View style={styles.calRow}>
      <Text style={styles.calMonth}>June ‹ ›</Text>
      <View style={styles.calDays}>
        {CAL_DAYS.map((d) => (
          <View
            key={d.day}
            style={[styles.calDay, d.active && styles.calDayOn]}
          >
            <Text style={[styles.calDayText, d.active && styles.calDayTextOn]}>
              {d.day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TemplateCard({ icon, name }: { icon: string; name: string }) {
  return (
    <TouchableOpacity style={styles.tplCard} activeOpacity={0.8}>
      <Text style={styles.tplIcon}>{icon}</Text>
      <Text style={styles.tplName}>{name}</Text>
    </TouchableOpacity>
  );
}

function EntryCard({
  title,
  date,
  progress,
}: {
  title: string;
  date: string;
  progress: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.entryTop}>
        <Text style={styles.entryTitle}>{title}</Text>
        <Text style={styles.entryDate}>{date}</Text>
      </View>
      <View style={styles.entryBarBg}>
        <View style={[styles.entryBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

export default function JournalScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Journal</Text>

        <CalendarRow />

        <Text style={styles.h2}>Templates</Text>
        <View style={styles.tplGrid}>
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} icon={t.icon} name={t.name} />
          ))}
        </View>

        <Text style={styles.h2}>Notebook</Text>
        {ENTRIES.map((e) => (
          <EntryCard
            key={e.id}
            title={e.title}
            date={e.date}
            progress={e.progress}
          />
        ))}

        <TouchableOpacity style={styles.newEntryBtn} activeOpacity={0.85}>
          <Text style={styles.newEntryLabel}>＋ New entry</Text>
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

  calRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calMonth: { fontSize: 12, fontWeight: "700", color: Colors.inkSoft },
  calDays: { flexDirection: "row", gap: 5 },
  calDay: {
    width: 27,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
  },
  calDayOn: { backgroundColor: Colors.coral, borderColor: "transparent" },
  calDayText: { fontSize: 11, fontWeight: "700", color: Colors.inkSoft },
  calDayTextOn: { color: Colors.white },

  tplGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tplCard: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  tplIcon: { fontSize: 21, marginBottom: 7 },
  tplName: { fontSize: 11.5, fontWeight: "700", color: Colors.ink },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    ...Shadow.sm,
  },
  entryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  entryTitle: { fontSize: 12.5, fontWeight: "700", color: Colors.ink },
  entryDate: { fontSize: 12.5, color: Colors.inkFaint, fontWeight: "600" },
  entryBarBg: {
    height: 5,
    backgroundColor: Colors.line,
    borderRadius: 3,
    overflow: "hidden",
  },
  entryBarFill: {
    height: "100%",
    backgroundColor: Colors.sage,
    borderRadius: 3,
  },

  newEntryBtn: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  newEntryLabel: { fontSize: 15, fontWeight: "700", color: Colors.white },
});

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Shadow } from "../constants/moodTheme";

const CATEGORIES = [
  {
    id: "student",
    label: "Student",
    desc: "Managing academic pressure & campus life",
    emoji: "📚",
    color: Colors.blue,
    bg: Colors.blueSoft,
  },
  {
    id: "worker",
    label: "Worker / Employee",
    desc: "Navigating workplace stress & burnout",
    emoji: "💼",
    color: Colors.sage,
    bg: Colors.sageSoft,
  },
  {
    id: "patient",
    label: "Patient",
    desc: "Supporting your emotional wellbeing alongside recovery",
    emoji: "🌿",
    color: Colors.coral,
    bg: Colors.coralSoft,
  },
];

export default function CategoryScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!selected) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.stepRow}>
          <View style={styles.stepDone}>
            <Text style={styles.stepCheck}>✓</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>

        <Text style={styles.headerTitle}>Who are you?</Text>
        <Text style={styles.headerSub}>
          MoodMate tailors your experience to your life.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pickLabel}>PICK THE ONE THAT FITS BEST</Text>

        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelected(cat.id)}
              activeOpacity={0.85}
              style={[
                styles.card,
                isSelected && { borderColor: cat.color, borderWidth: 2 },
              ]}
            >
              <View style={[styles.cardIcon, { backgroundColor: cat.bg }]}>
                <Text style={styles.cardEmoji}>{cat.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{cat.label}</Text>
                <Text style={styles.cardDesc}>{cat.desc}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  isSelected && {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
              >
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.changeNote}>
          You can change this later in Settings.
        </Text>

        <TouchableOpacity
          style={[styles.cta, !selected && styles.ctaDisabled]}
          disabled={!selected}
          onPress={handleFinish}
        >
          <Text style={styles.ctaLabel}>
            {loading
              ? "Setting up..."
              : selected
                ? `Join as ${CATEGORIES.find((c) => c.id === selected)?.label} →`
                : "Select who you are"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { marginBottom: 20 },
  backArrow: { fontSize: 22, color: Colors.ink },

  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stepDone: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCheck: { fontSize: 12, color: Colors.white, fontWeight: "800" },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.line,
    marginHorizontal: 8,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  stepDotActive: {
    borderColor: Colors.coral,
    backgroundColor: Colors.coralSoft,
  },

  headerTitle: { fontSize: 26, fontWeight: "800", color: Colors.ink },
  headerSub: {
    fontSize: 13,
    color: Colors.inkSoft,
    marginTop: 6,
    lineHeight: 19,
    fontWeight: "600",
  },

  scroll: { padding: 20, paddingTop: 8 },
  pickLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.inkFaint,
    letterSpacing: 1,
    marginBottom: 14,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.line,
    ...Shadow.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 22 },
  cardLabel: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  cardDesc: {
    fontSize: 12,
    color: Colors.inkSoft,
    marginTop: 2,
    lineHeight: 16,
    fontWeight: "500",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },

  changeNote: {
    fontSize: 12,
    color: Colors.inkFaint,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 4,
    fontWeight: "600",
  },

  cta: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    ...Shadow.sm,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaLabel: { fontSize: 15, fontWeight: "700", color: Colors.white },
});

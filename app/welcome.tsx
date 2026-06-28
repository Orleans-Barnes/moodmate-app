import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Shadow } from "../constants/moodTheme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌿</Text>
        </View>

        <Text style={styles.appName}>MoodMate</Text>
        <Text style={styles.tagline}>breathe · track · grow</Text>

        <View style={styles.pillsRow}>
          {["Track moods", "Journal freely", "Talk to a pro"].map((t) => (
            <View key={t} style={styles.pill}>
              <Text style={styles.pillText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push("/register")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryLabel}>Get started — it's free</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => router.push("/login")}
          activeOpacity={0.7}
        >
          <Text style={styles.btnGhostLabel}>I already have an account</Text>
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          🔒 Your data stays private. Always.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.sageSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    ...Shadow.sm,
  },
  logoEmoji: { fontSize: 44 },

  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: Colors.inkSoft,
    fontWeight: "600",
    marginBottom: 24,
  },

  pillsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
  },
  pillText: { fontSize: 12, color: Colors.inkSoft, fontWeight: "700" },

  actions: {
    paddingHorizontal: 28,
    paddingBottom: 44,
    alignItems: "center",
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    ...Shadow.sm,
  },
  btnPrimaryLabel: { fontSize: 16, fontWeight: "700", color: Colors.white },
  btnGhost: { paddingVertical: 12, width: "100%", alignItems: "center" },
  btnGhostLabel: { fontSize: 14, color: Colors.inkSoft, fontWeight: "700" },
  privacyNote: { fontSize: 11, color: Colors.inkFaint, marginTop: 6 },
});

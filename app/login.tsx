import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Shadow } from "../constants/moodTheme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const e: Record<string, string> = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (!password) e.password = "Enter your password";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.logoCircle}>
          <Text style={{ fontSize: 28 }}>🌿</Text>
        </View>
        <Text style={styles.title}>Welcome back 👋</Text>
        <Text style={styles.subtitle}>
          Sign in to continue your wellness journey
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email or Student ID</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="ama.boateng@knust.edu.gh"
            placeholderTextColor={Colors.inkFaint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="••••••••"
            placeholderTextColor={Colors.inkFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotLabel}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cta}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.ctaLabel}>
            {loading ? "Signing in..." : "Log in"}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>New to MoodMate? </Text>
          <TouchableOpacity onPress={() => router.replace("/register")}>
            <Text style={styles.registerLink}>Create account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.skipBtn}
        >
          <Text style={styles.skipLabel}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingTop: 56, alignItems: "center" },

  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  backArrow: { fontSize: 22, color: Colors.ink },

  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.sageSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.inkSoft,
    marginBottom: 22,
    textAlign: "center",
  },

  form: { width: "100%", marginBottom: 6 },
  label: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Colors.inkSoft,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.ink,
  },
  inputError: { borderColor: Colors.coral },
  errorText: {
    fontSize: 11.5,
    color: Colors.coral,
    marginTop: 4,
    fontWeight: "600",
  },

  forgotBtn: { alignSelf: "flex-end", marginBottom: 20 },
  forgotLabel: { fontSize: 12.5, color: Colors.coral, fontWeight: "700" },

  cta: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
    width: "100%",
    ...Shadow.sm,
  },
  ctaLabel: { fontSize: 15, fontWeight: "700", color: Colors.white },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 14,
  },
  registerPrompt: { fontSize: 13, color: Colors.inkSoft, fontWeight: "600" },
  registerLink: { fontSize: 13, color: Colors.coral, fontWeight: "700" },

  skipBtn: { paddingVertical: 8 },
  skipLabel: { fontSize: 12.5, color: Colors.inkFaint, fontWeight: "600" },
});

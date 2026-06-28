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

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your name";
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    router.push({ pathname: "/category", params: { name, email } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoCircle}>
          <Text style={{ fontSize: 28 }}>🌱</Text>
        </View>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start your wellness journey today</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Ama Boateng"
            placeholderTextColor={Colors.inkFaint}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <Text style={styles.label}>Email address</Text>
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
            placeholder="At least 8 characters"
            placeholderTextColor={Colors.inkFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={[styles.input, errors.confirm && styles.inputError]}
            placeholder="Repeat your password"
            placeholderTextColor={Colors.inkFaint}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          {errors.confirm && (
            <Text style={styles.errorText}>{errors.confirm}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleNext}>
          <Text style={styles.ctaLabel}>Continue →</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 4,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: Colors.ink },
  stepRow: { flexDirection: "row", gap: 6 },
  stepDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.line,
  },
  stepDotActive: { backgroundColor: Colors.coral },

  scroll: { padding: 20, paddingTop: 8, alignItems: "center" },

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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.inkSoft,
    marginBottom: 22,
    textAlign: "center",
  },

  form: { width: "100%", marginBottom: 12 },
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

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginPrompt: { fontSize: 13, color: Colors.inkSoft, fontWeight: "600" },
  loginLink: { fontSize: 13, color: Colors.coral, fontWeight: "700" },
});

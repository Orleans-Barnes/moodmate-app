import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors, Radius } from "../constants/moodTheme";

const EMOTIONS = [
  { emoji: "😊", label: "Happy", color: Colors.sun, angle: -90 },
  { emoji: "😌", label: "Calm", color: Colors.sage, angle: -45 },
  { emoji: "😟", label: "Anxious", color: Colors.blue, angle: 0 },
  { emoji: "😢", label: "Sad", color: Colors.lavender, angle: 45 },
  { emoji: "😡", label: "Angry", color: Colors.coral, angle: 90 },
  { emoji: "😴", label: "Tired", color: Colors.inkSoft, angle: 135 },
  { emoji: "😍", label: "Grateful", color: Colors.coralDeep, angle: 180 },
  { emoji: "😐", label: "Numb", color: Colors.inkFaint, angle: -135 },
];

const STRESS_LABELS = ["Low", "Mild", "Moderate", "High", "Severe"];
const ENERGY_LABELS = ["Low", "Mild", "Moderate", "High", "Buzzing"];

function polarToCartesian(angleDeg: number, radius: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: radius * Math.cos(angleRad),
    y: radius * Math.sin(angleRad),
  };
}

export default function CheckinModal() {
  const router = useRouter();
  const [selected, setSelected] = useState<(typeof EMOTIONS)[0] | null>(null);
  const [stress, setStress] = useState(2);
  const [energy, setEnergy] = useState(1);
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (!selected) return;
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>How are you feeling?</Text>

        <View style={styles.wheelWrap}>
          <View style={styles.wheelRing} />
          {EMOTIONS.map((e) => {
            const { x, y } = polarToCartesian(e.angle, 95);
            const isSel = selected?.label === e.label;
            return (
              <TouchableOpacity
                key={e.label}
                onPress={() => setSelected(e)}
                style={[
                  styles.emoNode,
                  { left: 115 + x - 28, top: 115 + y - 28 },
                  isSel && {
                    backgroundColor: Colors.white,
                    shadowColor: e.color,
                    elevation: 4,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.emoEmoji, isSel && { fontSize: 26 }]}>
                  {e.emoji}
                </Text>
                <Text style={styles.emoLabel}>{e.label}</Text>
              </TouchableOpacity>
            );
          })}
          <View
            style={[
              styles.emoCenter,
              selected && { borderColor: selected.color },
            ]}
          >
            {selected ? (
              <Text style={{ fontSize: 26 }}>{selected.emoji}</Text>
            ) : (
              <Text style={styles.emoCenterText}>tap an{"\n"}emotion</Text>
            )}
          </View>
        </View>

        <View style={styles.sliderRow}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabel}>Stress level</Text>
            <Text style={styles.sliderVal}>{STRESS_LABELS[stress - 1]}</Text>
          </View>
          <View style={styles.sliderTrack}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={styles.sliderStepTouch}
                onPress={() => setStress(n)}
              >
                <View
                  style={[
                    styles.sliderDot,
                    n <= stress && { backgroundColor: Colors.coral },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sliderRow}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabel}>Energy level</Text>
            <Text style={styles.sliderVal}>{ENERGY_LABELS[energy - 1]}</Text>
          </View>
          <View style={styles.sliderTrack}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={styles.sliderStepTouch}
                onPress={() => setEnergy(n)}
              >
                <View
                  style={[
                    styles.sliderDot,
                    n <= energy && { backgroundColor: Colors.coral },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TextInput
          style={styles.noteBox}
          placeholder="Add a note (optional)"
          placeholderTextColor={Colors.inkFaint}
          value={note}
          onChangeText={setNote}
          multiline
        />

        <TouchableOpacity
          style={[styles.saveBtn, !selected && styles.saveBtnDisabled]}
          disabled={!selected}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnLabel}>Save check-in →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    paddingBottom: 8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { fontSize: 13, color: Colors.ink },
  headerTitle: { fontSize: 13.5, fontWeight: "700", color: Colors.ink },

  scroll: { padding: 20, paddingTop: 8 },
  question: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 8,
  },

  wheelWrap: {
    width: 230,
    height: 230,
    alignSelf: "center",
    marginVertical: 14,
    position: "relative",
  },
  wheelRing: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 2,
    borderColor: Colors.line,
    borderStyle: "dashed",
  },
  emoNode: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emoEmoji: { fontSize: 21 },
  emoLabel: { fontSize: 8, fontWeight: "700", color: Colors.inkSoft },
  emoCenter: {
    position: "absolute",
    left: 115 - 31,
    top: 115 - 31,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.white,
    borderWidth: 2.5,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  emoCenterText: {
    fontSize: 10.5,
    color: Colors.inkFaint,
    fontWeight: "700",
    textAlign: "center",
  },

  sliderRow: { marginBottom: 16 },
  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sliderLabel: { fontSize: 12.5, fontWeight: "700", color: Colors.ink },
  sliderVal: { color: Colors.coral, fontWeight: "800", fontSize: 12.5 },
  sliderTrack: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  sliderStepTouch: { flex: 1, alignItems: "center", paddingVertical: 6 },
  sliderDot: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.line,
  },

  noteBox: {
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: 14,
    fontSize: 12.5,
    backgroundColor: Colors.surface,
    marginBottom: 16,
    minHeight: 70,
    color: Colors.ink,
  },

  saveBtn: {
    backgroundColor: Colors.coral,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnLabel: { fontSize: 15, fontWeight: "700", color: Colors.white },
});

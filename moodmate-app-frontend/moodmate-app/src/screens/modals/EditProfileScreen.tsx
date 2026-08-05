import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Alert, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { deleteAvatar, updateMyProfile, uploadAvatar } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { BACKEND_BASE_URL } from '@/config';
import { hapticSuccess, hapticSelection } from '@/utils/haptics';
import { AVATAR_ICONS, DEFAULT_AVATAR_ICON } from '@/theme/iconMap';
import { AppIcon } from '@/components/AppIcon';
import { colors, fonts, fontSizes, radii, spacing, shadow, calm } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const AVATAR_OPTIONS = AVATAR_ICONS;

const INSTITUTION_SUGGESTIONS = [
  'University of Ghana',
  'KNUST',
  'University of Cape Coast',
  'Ashesi University',
  'Ghana Institute of Management and Public Administration',
  'Other',
];

// Student-view polish pass - a small reusable section header (icon + label, optional muted
// sub-label) so every field on this screen shares one visual language instead of the previous
// plain bold-text labels. Mirrors the section-header pattern already used on the redesigned
// ShopScreen ("Tree skins" / "Boosts" / "Get more leaves").
function SectionLabel({
  icon,
  text,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  sub?: string;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionLabelIcon}>
        <Ionicons name={icon} size={13} color={colors.blue} />
      </View>
      <Text style={styles.label}>
        {text} {sub ? <Text style={styles.labelSub}>{sub}</Text> : null}
      </Text>
    </View>
  );
}

export function EditProfileScreen({ navigation }: Props) {
  const user     = useAuthStore((s) => s.user);
  const token    = useAuthStore((s) => s.token);
  const setUser  = useAuthStore((s) => s.setUser);
  const toast    = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);

  const [fullName, setFullName]         = useState(user?.fullName ?? '');
  const [institution, setInstitution]   = useState(user?.institution ?? '');
  const [avatarEmoji, setAvatarEmoji]   = useState(user?.avatarEmoji ?? DEFAULT_AVATAR_ICON);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Student-view polish pass - the whole screen used to appear instantly with no motion, which
  // read as flat next to the rest of the redesigned student flow (Shop, Profile). A single fade
  // + gentle rise on mount is enough to make opening the screen feel intentional without being
  // showy on a form the student will use often.
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentRise = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(contentRise, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [contentFade, contentRise]);

  // Suggestions dropdown fade - was an instant show/hide, now eases in/out with the field.
  const suggestFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(suggestFade, {
      toValue: showSuggestions ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [showSuggestions, suggestFade]);

  // The URL to display — local pick preview takes priority, then server URL, then nothing
  const displayPhotoUri = localPhotoUri
    ?? (user?.avatarUrl ? `${BACKEND_BASE_URL}${user.avatarUrl}` : null);

  const hasChanges =
    fullName.trim() !== (user?.fullName ?? '') ||
    institution.trim() !== (user?.institution ?? '') ||
    avatarEmoji !== (user?.avatarEmoji ?? DEFAULT_AVATAR_ICON) ||
    localPhotoUri !== null;

  const canSave = fullName.trim().length > 0 && !saving && !uploading && hasChanges;

  // ── Photo picker ──────────────────────────────────────────────────────────
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  };

  const handlePhotoPress = () => {
    Alert.alert('Profile Photo', 'Choose how to add your photo', [
      { text: 'Choose from gallery', onPress: pickFromGallery },
      { text: 'Take a photo',        onPress: takePhoto },
      displayPhotoUri
        ? { text: 'Remove photo', style: 'destructive', onPress: handleRemovePhoto }
        : { text: 'Cancel', style: 'cancel' },
      ...(displayPhotoUri ? [{ text: 'Cancel', style: 'cancel' as const }] : []),
    ]);
  };

  // If there's an unsaved local pick, clearing it is purely local state - nothing to call.
  // If the photo shown is the user's actual saved server avatar, DELETE /api/users/me/avatar
  // (Feature 13, already built backend-side) actually removes it and falls back to avatarEmoji.
  const handleRemovePhoto = async () => {
    if (localPhotoUri) {
      setLocalPhotoUri(null);
      return;
    }
    if (!token || !user?.avatarUrl) return;
    setRemovingPhoto(true);
    try {
      const updated = await deleteAvatar(token);
      setUser(updated);
      hapticSuccess();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not remove photo.');
    } finally {
      setRemovingPhoto(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSave || !token) return;
    setSaving(true);
    try {
      // Step 1: upload photo if a new one was picked
      if (localPhotoUri) {
        setUploading(true);
        const updated = await uploadAvatar(token, localPhotoUri);
        setUser(updated);
        setLocalPhotoUri(null);
        setUploading(false);
      }

      // Step 2: save name / institution / emoji
      const updated = await updateMyProfile(token, {
        fullName: fullName.trim(),
        institution: institution.trim() || undefined,
        avatarEmoji,
      });
      setUser(updated);

      hapticSuccess();
      confettiRef.current?.fire();
      toast('Profile updated');
      navigation.goBack();
    } catch (err) {
      setUploading(false);
      toast(err instanceof ApiRequestError ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Edit Profile" onClose={() => navigation.goBack()} />

        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentRise }] }}>
          {/* ── Photo avatar ── */}
          <View style={styles.photoSection}>
            <Pressable style={styles.photoWrap} onPress={handlePhotoPress} disabled={removingPhoto || uploading}>
              {displayPhotoUri ? (
                <Image source={{ uri: displayPhotoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <AppIcon name={avatarEmoji} size={36} color={colors.blue} fallback={DEFAULT_AVATAR_ICON} />
                </View>
              )}
              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
              {(saving && uploading) || removingPhoto ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </Pressable>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* ── Emoji avatar (fallback) ── */}
          <View style={styles.card}>
            <SectionLabel icon="happy-outline" text="Avatar icon" sub="(shown when no photo)" />
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((iconKey) => {
                const active = avatarEmoji === iconKey;
                return (
                  <Pressable
                    key={iconKey}
                    style={[styles.avatarOption, active && styles.avatarOptionActive]}
                    onPress={() => { setAvatarEmoji(iconKey); hapticSelection(); }}
                  >
                    <AppIcon name={iconKey} size={22} color={active ? colors.blue : colors.inkSoft} />
                    {active && (
                      <View style={styles.avatarCheckBadge}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Name ── */}
          <View style={styles.card}>
            <SectionLabel icon="person-outline" text="Full name" />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="words"
            />
          </View>

          {/* ── Institution ── */}
          <View style={styles.card}>
            <SectionLabel icon="school-outline" text="Institution" sub="(optional)" />
            <TextInput
              style={styles.input}
              value={institution}
              onChangeText={(t) => { setInstitution(t); setShowSuggestions(t.length > 0); }}
              onFocus={() => setShowSuggestions(institution.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Your university or college"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="words"
            />
            {showSuggestions && (
              <Animated.View style={[styles.suggestions, { opacity: suggestFade }]}>
                {INSTITUTION_SUGGESTIONS
                  .filter((s) => s.toLowerCase().includes(institution.toLowerCase()))
                  .slice(0, 4)
                  .map((s) => (
                    <Pressable
                      key={s}
                      style={styles.suggestionRow}
                      onPress={() => { setInstitution(s); setShowSuggestions(false); }}
                    >
                      <Ionicons name="location-outline" size={14} color={colors.inkFaint} />
                      <Text style={styles.suggestionText}>{s}</Text>
                    </Pressable>
                  ))}
              </Animated.View>
            )}
          </View>

          <Button
            label={saving ? (uploading ? 'Uploading photo…' : 'Saving…') : 'Save changes'}
            variant="primary"
            fullWidth
            disabled={!canSave}
            onPress={handleSave}
            style={styles.saveBtn}
          />
        </Animated.View>
      </ScrollView>
      <ConfettiBurst ref={confettiRef} />
    </View>
  );
}

const PHOTO_SIZE = 96;

const styles = StyleSheet.create({
  flex:      { flex: 1 },
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },

  // ── Photo section ─────────────────────────────────────────────
  photoSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: 'visible',
    ...shadow.md,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: colors.line,
  },
  photoPlaceholder: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 40 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  uploadingOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    marginTop: spacing.sm,
  },

  // ── Section cards ─────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionLabelIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Fields ────────────────────────────────────────────────────
  label:       { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft },
  labelSub:    { fontFamily: fonts.bodyMedium, color: colors.inkFaint },
  avatarGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  avatarOption: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarOptionActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  avatarEmoji: { fontSize: 20 },
  avatarCheckBadge: {
    position: 'absolute', top: -3, right: -3,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  suggestions: {
    backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  suggestionRow:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 11, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  suggestionText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  saveBtn:        { marginTop: spacing.sm },
});

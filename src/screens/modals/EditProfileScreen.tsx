import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Alert, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { ConfettiBurst, ConfettiHandle } from '@/components/Confetti';
import { useAuthStore } from '@/state/useAuthStore';
import { useToast } from '@/state/useToast';
import { updateMyProfile, uploadAvatar } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { BACKEND_BASE_URL } from '@/config';
import { hapticSuccess } from '@/utils/haptics';
import { colors, fonts, fontSizes, radii, spacing, shadow } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const AVATAR_OPTIONS = [
  '😊','😎','🌸','🌿','⭐','🎯','🌙','☀️','🦋','🐻',
  '🌊','🎵','🍀','🔥','💙','🌈','🦊','🐼','🌻','🎨',
];

const INSTITUTION_SUGGESTIONS = [
  'University of Ghana',
  'KNUST',
  'University of Cape Coast',
  'Ashesi University',
  'Ghana Institute of Management and Public Administration',
  'Other',
];

export function EditProfileScreen({ navigation }: Props) {
  const user     = useAuthStore((s) => s.user);
  const token    = useAuthStore((s) => s.token);
  const setUser  = useAuthStore((s) => s.setUser);
  const toast    = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);

  const [fullName, setFullName]         = useState(user?.fullName ?? '');
  const [institution, setInstitution]   = useState(user?.institution ?? '');
  const [avatarEmoji, setAvatarEmoji]   = useState(user?.avatarEmoji ?? '😊');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // The URL to display — local pick preview takes priority, then server URL, then nothing
  const displayPhotoUri = localPhotoUri
    ?? (user?.avatarUrl ? `${BACKEND_BASE_URL}${user.avatarUrl}` : null);

  const hasChanges =
    fullName.trim() !== (user?.fullName ?? '') ||
    institution.trim() !== (user?.institution ?? '') ||
    avatarEmoji !== (user?.avatarEmoji ?? '😊') ||
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

  const handleRemovePhoto = () => {
    setLocalPhotoUri(null);
    // Clear the server URL optimistically — the PUT /api/users/me with avatarUrl=null
    // isn't wired yet, so we just clear the preview locally for now.
    // TODO: add a DELETE/clear avatar endpoint when needed.
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
      toast('Profile updated ✨');
      navigation.goBack();
    } catch (err) {
      setUploading(false);
      toast(err instanceof ApiRequestError ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Edit Profile" onClose={() => navigation.goBack()} />

        {/* ── Photo avatar ── */}
        <View style={styles.photoSection}>
          <Pressable style={styles.photoWrap} onPress={handlePhotoPress}>
            {displayPhotoUri ? (
              <Image source={{ uri: displayPhotoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoEmoji}>{avatarEmoji}</Text>
              </View>
            )}
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeIcon}>📷</Text>
            </View>
            {(saving && uploading) && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </Pressable>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        {/* ── Emoji avatar (fallback) ── */}
        <Text style={styles.label}>Emoji avatar <Text style={styles.labelSub}>(shown when no photo)</Text></Text>
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              style={[styles.avatarOption, avatarEmoji === emoji && styles.avatarOptionActive]}
              onPress={() => setAvatarEmoji(emoji)}
            >
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Name ── */}
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="words"
        />

        {/* ── Institution ── */}
        <Text style={styles.label}>
          Institution <Text style={styles.labelSub}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={institution}
          onChangeText={(t) => { setInstitution(t); setShowSuggestions(t.length > 0); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Your university or college"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="words"
        />
        {showSuggestions && (
          <View style={styles.suggestions}>
            {INSTITUTION_SUGGESTIONS
              .filter((s) => s.toLowerCase().includes(institution.toLowerCase()))
              .slice(0, 4)
              .map((s) => (
                <Pressable
                  key={s}
                  style={styles.suggestionRow}
                  onPress={() => { setInstitution(s); setShowSuggestions(false); }}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
          </View>
        )}

        <Button
          label={saving ? (uploading ? 'Uploading photo…' : 'Saving…') : 'Save changes'}
          variant="primary"
          fullWidth
          disabled={!canSave}
          onPress={handleSave}
          style={styles.saveBtn}
        />
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
  cameraBadgeIcon: { fontSize: 14 },
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

  // ── Fields ────────────────────────────────────────────────────
  label:       { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.inkSoft, marginBottom: spacing.xs, marginTop: spacing.md },
  labelSub:    { fontFamily: fonts.bodyMedium, color: colors.inkFaint },
  avatarGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  avatarOption: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarOptionActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  avatarEmoji: { fontSize: 20 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radii.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionRow:  { paddingVertical: 11, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  suggestionText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.ink },
  saveBtn:        { marginTop: spacing.lg },
});

/**
 * roleAssets — the single swap point for Role Select illustrations (Phase 1B decision).
 *
 * Student-view polish pass - swapped from the code-composed placeholder shapes (gradients +
 * silhouettes, see src/components/illustrations/) to real photos, per this file's own documented
 * plan: replace an entry with a small wrapper that renders <Image source={require(...)} />.
 * Every call site (RoleSelectScreen, CounsellorOrMentorScreen, etc.) just renders whatever
 * component this map hands back — it never knows or cares whether the art is code or a photo.
 * No screen file should ever import an illustration component directly; always go through
 * ROLE_ILLUSTRATIONS so this guarantee holds.
 *
 * assets/images/role-student.jpg and assets/images/role-counsellor.jpg are currently placeholder
 * images generated to keep the app buildable. Drop the real photos in under those exact
 * filenames to replace them — no code change needed, Metro picks up the new file contents as-is.
 */
import React from 'react';
import { Image, StyleSheet } from 'react-native';

export type RoleIllustrationKey = 'student' | 'counsellor';

export interface RoleIllustrationProps {
  size?: number;
}

function StudentPhoto({ size = 64 }: RoleIllustrationProps) {
  return (
    <Image
      source={require('../../assets/images/role-student.jpg')}
      style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]}
      resizeMode="cover"
    />
  );
}

function CounsellorPhoto({ size = 64 }: RoleIllustrationProps) {
  return (
    <Image
      source={require('../../assets/images/role-counsellor.jpg')}
      style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  photo: { overflow: 'hidden' },
});

export const ROLE_ILLUSTRATIONS: Record<RoleIllustrationKey, React.ComponentType<RoleIllustrationProps>> = {
  student: StudentPhoto,
  counsellor: CounsellorPhoto,
};

export const ROLE_CAPTIONS: Record<RoleIllustrationKey, string> = {
  student: 'Track your wellbeing, build healthy habits, and connect with support.',
  counsellor: 'Provide guidance, support students, and help build a healthier campus community.',
};

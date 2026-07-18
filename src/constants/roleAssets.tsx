/**
 * roleAssets — the single swap point for Role Select illustrations (Phase 1B decision).
 *
 * Today every entry points at a code-composed placeholder component (gradients + shapes,
 * see src/components/illustrations/). When real artwork is ready, this is the ONLY file that
 * changes: replace an entry with a small wrapper that renders <Image source={require(...)} />
 * instead. Every call site (RoleSelectScreen, CounsellorOrMentorScreen, etc.) just renders
 * whatever component this map hands back — it never knows or cares whether the art is code or
 * a PNG. No screen file should ever import an illustration component directly; always go
 * through ROLE_ILLUSTRATIONS so this guarantee holds.
 */
import React from 'react';
import { StudentIllustration } from '@/components/illustrations/StudentIllustration';
import { CounsellorIllustration } from '@/components/illustrations/CounsellorIllustration';

export type RoleIllustrationKey = 'student' | 'counsellor';

export interface RoleIllustrationProps {
  size?: number;
}

export const ROLE_ILLUSTRATIONS: Record<RoleIllustrationKey, React.ComponentType<RoleIllustrationProps>> = {
  student: StudentIllustration,
  counsellor: CounsellorIllustration,
};

export const ROLE_CAPTIONS: Record<RoleIllustrationKey, string> = {
  student: 'Track your wellbeing, build healthy habits, and connect with support.',
  counsellor: 'Provide guidance, support students, and help build a healthier campus community.',
};

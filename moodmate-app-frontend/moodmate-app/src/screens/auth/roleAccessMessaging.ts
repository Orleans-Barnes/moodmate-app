import type { Role } from '@/api/types';
import type { UserRole } from '@/navigation/types';

export type RoleAccessResolution =
  | { kind: 'allowed' }
  | {
      kind: 'pendingCounsellor';
      title: string;
      message: string;
      primaryLabel: string;
      secondaryLabel: string;
    }
  | {
      kind: 'continueMentorAcademy';
      title: string;
      message: string;
      primaryLabel: string;
      secondaryLabel: string;
    }
  | {
      kind: 'wrongPortal';
      title: string;
      message: string;
      targetRole: Exclude<Role, 'STUDENT'>;
      targetLabel: string;
    }
  | {
      kind: 'adminMismatch';
      title: string;
      message: string;
    };

const ROLE_LABEL: Record<Exclude<Role, 'STUDENT'>, string> = {
  COUNSELLOR: 'Counsellor',
  MENTOR: 'Peer Mentor',
  ADMIN: 'Admin',
};

export function resolveRoleAccess(requestedRole: UserRole, actualRole: Role): RoleAccessResolution {
  if (requestedRole === 'STUDENT' || requestedRole === actualRole) {
    return { kind: 'allowed' };
  }

  if (requestedRole === 'COUNSELLOR' && actualRole === 'STUDENT') {
    return {
      kind: 'pendingCounsellor',
      title: 'Counsellor access is not active yet',
      message:
        'These credentials are valid for a MoodMate student account. Counsellor access starts after your application is approved by an admin.',
      primaryLabel: 'Apply to join',
      secondaryLabel: 'Continue as student',
    };
  }

  if (requestedRole === 'MENTOR' && actualRole === 'STUDENT') {
    return {
      kind: 'continueMentorAcademy',
      title: 'Peer Mentor access needs certification',
      message:
        'These credentials are valid for a MoodMate student account. Peer Mentor access activates after you complete the MoodMate Academy certification.',
      primaryLabel: 'Continue Academy',
      secondaryLabel: 'Continue as student',
    };
  }

  if (requestedRole === 'ADMIN') {
    return {
      kind: 'adminMismatch',
      title: 'Admin access is not active',
      message: 'This account does not have admin permissions. Use an admin account or set one up first.',
    };
  }

  if (actualRole !== 'STUDENT') {
    return {
      kind: 'wrongPortal',
      title: `Use the ${ROLE_LABEL[actualRole]} sign-in`,
      message: `This account already has ${ROLE_LABEL[actualRole]} access. Open the ${ROLE_LABEL[actualRole]} portal to continue.`,
      targetRole: actualRole,
      targetLabel: ROLE_LABEL[actualRole],
    };
  }

  return {
    kind: 'adminMismatch',
    title: 'Access is not active',
    message: 'This account is not active for the portal you selected. Choose the correct role and try again.',
  };
}

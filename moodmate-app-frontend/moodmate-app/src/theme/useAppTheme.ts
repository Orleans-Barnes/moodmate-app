import { calm, darkPalette } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

function makePalette(isDark: boolean) {
  if (isDark) {
    return {
      scheme: 'dark' as const,
      colors: {
        bg: darkPalette.bg,
        surface: darkPalette.surface,
        card: darkPalette.surfaceRaised,
        cardElevated: darkPalette.surfaceRaised,
        ink: darkPalette.text,
        inkSoft: darkPalette.textSoft,
        inkFaint: darkPalette.textFaint,
        line: darkPalette.border,
        lineSoft: darkPalette.divider,
        primary: darkPalette.primary,
        primaryDeep: darkPalette.primaryDeep,
        primarySoft: darkPalette.primarySoft,
        accentBlue: calm.dustyBlue,
        accentBlueDeep: '#8FD0EE',
        accentBlueSoft: 'rgba(111,168,199,0.20)',
        accentGreen: calm.mint,
        accentGreenDeep: calm.primary,
        accentGreenSoft: darkPalette.primarySoft,
        accentPurple: calm.dustyPurple,
        accentPurpleDeep: '#D0BDE8',
        accentPurpleSoft: 'rgba(142,134,191,0.22)',
        warning: darkPalette.warning,
        danger: darkPalette.danger,
        onPrimary: '#FFFFFF',
      },
      glass: {
        fill: 'rgba(255,255,255,0.09)',
        border: darkPalette.border,
      },
    };
  }

  return {
    scheme: 'light' as const,
    colors: {
      bg: calm.bg,
      surface: '#FFFFFF',
      card: '#FFFFFF',
      cardElevated: '#FFFFFF',
      ink: calm.ink,
      inkSoft: calm.muted,
      inkFaint: calm.faint,
      line: calm.border,
      lineSoft: 'rgba(27,27,27,0.07)',
      primary: calm.primary,
      primaryDeep: calm.primaryDeep,
      primarySoft: calm.mintBg,
      accentBlue: calm.dustyBlue,
      accentBlueDeep: '#4F8AAD',
      accentBlueSoft: '#E9F3F8',
      accentGreen: calm.primary,
      accentGreenDeep: calm.primaryDeep,
      accentGreenSoft: calm.mintBg,
      accentPurple: calm.dustyPurple,
      accentPurpleDeep: '#746BAA',
      accentPurpleSoft: '#ECEAF7',
      warning: calm.amber,
      danger: calm.rust,
      onPrimary: '#FFFFFF',
    },
    glass: {
      fill: 'rgba(255,255,255,0.62)',
      border: 'rgba(255,255,255,0.42)',
    },
  };
}

export function useAppTheme() {
  const { mode, effective, isDark, setMode } = useResolvedAppearance();
  const palette = makePalette(isDark);

  return { mode, scheme: effective, isDark, palette, setMode };
}

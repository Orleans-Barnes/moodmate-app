import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import {
  applyNativeAppearanceMode,
  useAppearanceStore,
  type AppearanceMode,
} from '@/state/useAppearanceStore';

type EffectiveAppearance = 'light' | 'dark';

function normalizeScheme(scheme: ColorSchemeName): EffectiveAppearance {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useResolvedAppearance(): {
  mode: AppearanceMode;
  effective: EffectiveAppearance;
  isDark: boolean;
  setMode: (mode: AppearanceMode) => void;
} {
  const mode = useAppearanceStore((s) => s.mode);
  const setMode = useAppearanceStore((s) => s.setMode);
  const [systemScheme, setSystemScheme] = useState<EffectiveAppearance>(() =>
    normalizeScheme(Appearance.getColorScheme()),
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(normalizeScheme(colorScheme));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    applyNativeAppearanceMode(mode);
    if (mode === 'system') {
      setSystemScheme(normalizeScheme(Appearance.getColorScheme()));
    }
  }, [mode]);

  const effective = mode === 'system' ? systemScheme : mode;

  return { mode, effective, isDark: effective === 'dark', setMode };
}

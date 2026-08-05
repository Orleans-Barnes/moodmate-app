import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import { hapticLight } from '@/utils/haptics';

export type ProUpgradeSource =
  | 'home'
  | 'profile'
  | 'music-track'
  | 'insights'
  | 'bubble-pop'
  | 'shop-skin'
  | 'story-pack';

export function openProUpgrade(
  navigation: NavigationProp<RootStackParamList> | { navigate: (screen: 'Pro') => void },
  _source?: ProUpgradeSource,
) {
  hapticLight();
  navigation.navigate('Pro');
}

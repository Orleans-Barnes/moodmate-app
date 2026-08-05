/**
 * Local image assets (legacy).
 * Home / badge surfaces now use Expo Ionicons + TreeBlob illustrations —
 * these requires remain only if something still imports them.
 */
import type { BadgeId } from '@/state/useGamificationStore';
import type { ImageSourcePropType } from 'react-native';

/** @deprecated Prefer BADGE_DEFS[].ionIcon in BadgeShelf */
export const BADGE_IMAGES: Record<BadgeId, ImageSourcePropType> = {
  first_checkin:   require('../../assets/images/badges/first-step.png'),
  streak_3:        require('../../assets/images/badges/streak-3.png'),
  streak_7:        require('../../assets/images/badges/streak-7.png'),
  streak_30:       require('../../assets/images/badges/streak-30.png'),
  journaller:      require('../../assets/images/badges/journaller.png'),
  deep_breather:   require('../../assets/images/badges/breather.png'),
  community_voice: require('../../assets/images/badges/community.png'),
  grateful_heart:  require('../../assets/images/badges/grateful.png'),
  xp_100:          require('../../assets/images/badges/rising-star.png'),
  xp_500:          require('../../assets/images/badges/wellness-pro.png'),
};

/** @deprecated Prefer Ionicons / TreeBlob on Home */
export const HOME_IMAGES = {
  missionHero:  require('../../assets/images/home/mission-hero.jpg'),
  moodbird:     require('../../assets/images/home/moodbird.png'),
  wellnessTree: require('../../assets/images/home/wellness-tree.png'),
} as const;

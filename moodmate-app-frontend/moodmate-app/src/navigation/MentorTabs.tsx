import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MentorTabParamList } from './types';
import { PeerMentorDashboardScreen } from '@/screens/mentor/PeerMentorDashboardScreen';
import { MentorConversationsScreen } from '@/screens/mentor/MentorConversationsScreen';
import { MentorProfileScreen } from '@/screens/mentor/MentorProfileScreen';
import { AnimatedTabIcon } from '@/components/AnimatedTabIcon';
import { hapticSelection } from '@/utils/haptics';
import { fonts, calm, darkPalette } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

const Tab = createBottomTabNavigator<MentorTabParamList>();

type IconPair = { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap };

const ICONS: Record<keyof MentorTabParamList, IconPair> = {
  Dashboard:          { active: 'grid',         inactive: 'grid-outline' },
  Conversations:      { active: 'chatbubbles',  inactive: 'chatbubbles-outline' },
  CounsellorProfile:  { active: 'person',       inactive: 'person-outline' },
};

const LABELS: Record<keyof MentorTabParamList, string> = {
  Dashboard:         'Home',
  Conversations:     'Messages',
  CounsellorProfile: 'Profile',
};

/** Phase 1G - mirrors CounsellorTabs.tsx, trimmed to 3 tabs (no Appointments - mentors don't book
 * sessions). Uses a dedicated MentorProfileScreen rather than reusing CounsellorProfileScreen -
 * see that screen's own doc comment for why. */
export function MentorTabs() {
  const { isDark } = useResolvedAppearance();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isDark ? darkPalette.primary : calm.primary,
        tabBarInactiveTintColor: isDark ? darkPalette.textMuted : calm.faint,
        tabBarStyle: {
          borderTopColor: isDark ? darkPalette.border : calm.border,
          backgroundColor: isDark ? darkPalette.surface : '#FFFFFF',
          height: 70,
          paddingBottom: 12,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 10 },
        tabBarLabel: LABELS[route.name as keyof MentorTabParamList],
        tabBarIcon: ({ color, focused }) => {
          const icon = ICONS[route.name as keyof MentorTabParamList];
          return (
            <AnimatedTabIcon
              name={focused ? icon.active : icon.inactive}
              color={color}
              focused={focused}
            />
          );
        },
      })}
      screenListeners={{
        tabPress: () => hapticSelection(),
      }}
    >
      <Tab.Screen name="Dashboard"         component={PeerMentorDashboardScreen} />
      <Tab.Screen name="Conversations"     component={MentorConversationsScreen} />
      <Tab.Screen name="CounsellorProfile" component={MentorProfileScreen} />
    </Tab.Navigator>
  );
}

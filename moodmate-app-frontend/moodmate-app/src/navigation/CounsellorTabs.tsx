import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { CounsellorTabParamList } from './types';
import { CounsellorDashboardScreen } from '@/screens/counsellor/CounsellorDashboardScreen';
import { CounsellorAppointmentsScreen } from '@/screens/counsellor/CounsellorAppointmentsScreen';
import { CounsellorConversationsScreen } from '@/screens/counsellor/CounsellorConversationsScreen';
import { CounsellorProfileScreen } from '@/screens/counsellor/CounsellorProfileScreen';
import { AnimatedTabIcon } from '@/components/AnimatedTabIcon';
import { hapticSelection } from '@/utils/haptics';
import { fonts, calm, darkPalette } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

const Tab = createBottomTabNavigator<CounsellorTabParamList>();

type IconPair = { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap };

const ICONS: Record<keyof CounsellorTabParamList, IconPair> = {
  Dashboard:          { active: 'grid',         inactive: 'grid-outline' },
  Appointments:       { active: 'calendar',     inactive: 'calendar-outline' },
  Conversations:      { active: 'chatbubbles',  inactive: 'chatbubbles-outline' },
  CounsellorProfile:  { active: 'person',       inactive: 'person-outline' },
};

const LABELS: Record<keyof CounsellorTabParamList, string> = {
  Dashboard:         'Home',
  Appointments:      'Schedule',
  Conversations:     'Messages',
  CounsellorProfile: 'Profile',
};

export function CounsellorTabs() {
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
        tabBarLabel: LABELS[route.name as keyof CounsellorTabParamList],
        tabBarIcon: ({ color, focused }) => {
          const icon = ICONS[route.name as keyof CounsellorTabParamList];
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
      <Tab.Screen name="Dashboard"         component={CounsellorDashboardScreen} />
      <Tab.Screen name="Appointments"      component={CounsellorAppointmentsScreen} />
      <Tab.Screen name="Conversations"     component={CounsellorConversationsScreen} />
      <Tab.Screen name="CounsellorProfile" component={CounsellorProfileScreen} />
    </Tab.Navigator>
  );
}

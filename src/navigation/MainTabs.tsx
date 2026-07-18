import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { HomeScreen }      from '@/screens/home/HomeScreen';
import { JournalScreen }   from '@/screens/journal/JournalScreen';
import { ExploreScreen }   from '@/screens/explore/ExploreScreen';
import { InsightsScreen }  from '@/screens/insights/InsightsScreen';
import { CommunityScreen } from '@/screens/community/CommunityScreen';
import { SupportScreen }   from '@/screens/support/SupportScreen';
import { MusicPlayerBar }  from '@/components/MusicPlayerBar';
import { DynamicTabBar }   from './DynamicTabBar';
import { useTabLayoutStore } from '@/state/useTabLayoutStore';
import type { TabLayoutMode } from '@/state/useTabLayoutStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { mode, setMode } = useTabLayoutStore();

  // ── Mode picker shown on long-press of the expand/settings button ──────────
  const handleModeChange = useCallback(() => {
    Alert.alert(
      'Tab Bar Style',
      'Choose how the Insights tab appears.',
      [
        {
          text: '✦ Dynamic  (slide-in Insights)',
          onPress: () => setMode('dynamic'),
          style: mode === 'dynamic' ? 'default' : 'default',
        },
        {
          text: '⊞ Standard  (all tabs visible)',
          onPress: () => setMode('standard'),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [mode, setMode]);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <DynamicTabBar
            {...props}
            layoutMode={mode}
            onRequestModeChange={handleModeChange}
          />
        )}
      >
        <Tab.Screen name="Home"      component={HomeScreen} />
        <Tab.Screen name="Journal"   component={JournalScreen} />
        <Tab.Screen name="Explore"   component={ExploreScreen} />
        <Tab.Screen name="Insights"  component={InsightsScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Support"   component={SupportScreen} />
      </Tab.Navigator>

      <MusicPlayerBar />
    </View>
  );
}

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';
import { hapticMedium } from '@/utils/haptics';
import { MENTAL_HEALTH_QUESTIONNAIRE, QuestionnaireMark } from './MentalHealthQuestionnaireScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'MentalHealthQuestionnaireIntro'>;

export const QUESTIONNAIRE_INTRO_LAYOUT = {
  copyTextAlign: 'center',
  copyWidth: '100%',
  beginNavigationAction: 'replace',
} as const;

export function MentalHealthQuestionnaireIntroScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  const begin = () => {
    hapticMedium();
    navigation.replace('MentalHealthQuestionnaire');
  };

  return (
    <View style={[s.root, { backgroundColor: palette.colors.bg }]}>
      <View
        style={[
          s.panel,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: palette.colors.surface,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={[
            s.closeButton,
            {
              backgroundColor: palette.glass.fill,
              borderColor: palette.glass.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close questionnaire introduction"
          hitSlop={8}
        >
          <Ionicons name="close" size={27} color={palette.colors.ink} />
        </Pressable>

        <ScrollView
          style={s.scroll}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
        >
          <QuestionnaireMark size={84} />
          <View style={s.copyBlock}>
            <Text style={[s.title, { color: palette.colors.ink }]}>{MENTAL_HEALTH_QUESTIONNAIRE.title}</Text>
            <Text style={[s.body, { color: palette.colors.inkSoft }]}>{MENTAL_HEALTH_QUESTIONNAIRE.intro}</Text>
          </View>
        </ScrollView>

        <Pressable
          onPress={begin}
          style={s.beginButton}
          accessibilityRole="button"
          accessibilityLabel="Begin mental health questionnaire"
        >
          <LinearGradient
            colors={['#149DFF', '#0A84FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.beginGradient}
          >
            <Text style={s.beginText}>Begin</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  panel: {
    flex: 1,
    marginTop: spacing.sm,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  copyBlock: {
    width: QUESTIONNAIRE_INTRO_LAYOUT.copyWidth,
    maxWidth: 520,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 21,
    lineHeight: 27,
    textAlign: QUESTIONNAIRE_INTRO_LAYOUT.copyTextAlign,
  },
  body: {
    fontFamily: fonts.bodyMedium,
    fontSize: 23,
    lineHeight: 32,
    textAlign: QUESTIONNAIRE_INTRO_LAYOUT.copyTextAlign,
  },
  beginButton: {
    minHeight: 56,
    borderRadius: radii.button,
    overflow: 'hidden',
    backgroundColor: '#0A84FF',
  },
  beginGradient: {
    minHeight: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: '#FFFFFF',
  },
});

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';
import { hapticLight } from '@/utils/haptics';
import { MENTAL_HEALTH_QUESTIONNAIRE, QuestionnaireMark } from './MentalHealthQuestionnaireScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'MentalHealthArticle'>;

export const MENTAL_HEALTH_ARTICLE_CONTENT = {
  title: 'Mental Health Article',
  heroTitle: 'Mental Health Questionnaires',
  sections: [
    {
      heading: 'What Is a Mental Health Questionnaire?',
      body: [
        "Mental health questionnaires can be used to provide information about an individual's mental health, family history, risk factors, or conditions. A mental health condition can impact your feelings, thoughts, and behaviors. Early identification of a condition can help you address it and minimize its impact. Taking a mental health questionnaire regularly is one way to better understand your mental health and how it changes over time.",
      ],
    },
    {
      heading: 'Screening for Anxiety and Depression',
      body: [
        'Mental health conditions are common and can affect anyone. There are a variety of mental health questionnaires, some help screen for the signs and symptoms of common conditions. Two of the most prevalent conditions are anxiety and depression. The Generalized Anxiety Disorder (GAD-7) questionnaire is used to screen for anxiety and the Patient Health Questionnaire (PHQ-9) screens for depression. You can take a combined mental health questionnaire in Health to get a sense of your current risk for anxiety and depression.',
      ],
    },
    {
      heading: 'What Do The Results Mean?',
      body: [
        'The results can provide a sense of your current risk for different mental health conditions, such as anxiety or depression. A questionnaire cannot provide a diagnosis of any condition - only a doctor can do that. It is important to remember that mental health conditions can affect each individual differently. Depression, for example, may also include feelings of irritability in addition to feeling down or hopeless. A questionnaire will provide you with more information about possible next steps, such as paying more attention to your symptoms or following up with a doctor.',
      ],
    },
    {
      heading: 'When to Talk to a Doctor',
      body: [
        'Depending on your results from the questionnaire, you may want to discuss your risk level with your care team. It is important to discuss any symptoms, questions, or concerns you have with them as well.',
        'It can be stressful to talk with someone about your mental health, but there are ways to make the conversation easier.',
      ],
      list: [
        'Keep a list of your symptoms, including changes to mood, sleep, or appetite, and how long you have had them.',
        'Mention any significant changes in your life such as changing jobs, the loss of a pet, or getting married.',
        'Mention any previous health diagnosis.',
        'Make a list of current medications, supplements, and vitamins, along with each dose.',
      ],
      footer: 'Your doctor may ask you questions to get a better sense of your symptoms and how they are impacting you. Answering honestly can help your care team gain a better understanding for your overall health and how to address your concerns.',
    },
  ],
} as const;

export const MENTAL_HEALTH_ARTICLE_VISUAL = {
  heroKind: 'cloudscape',
} as const;

function CloudCluster({
  variant,
}: {
  variant: 'main' | 'left' | 'right';
}) {
  const isMain = variant === 'main';
  return (
    <View style={[
      isMain ? s.mainCloud : s.smallCloud,
      variant === 'left' && s.leftCloud,
      variant === 'right' && s.rightCloud,
    ]}>
      <View style={[s.cloudBase, isMain ? s.mainCloudBase : s.smallCloudBase]} />
      <View style={[s.cloudPuff, isMain ? s.mainPuffOne : s.smallPuffOne]} />
      <View style={[s.cloudPuff, isMain ? s.mainPuffTwo : s.smallPuffTwo]} />
      <View style={[s.cloudPuff, isMain ? s.mainPuffThree : s.smallPuffThree]} />
      <View style={[s.cloudShadow, isMain ? s.mainCloudShadow : s.smallCloudShadow]} />
    </View>
  );
}

export function MentalHealthArticleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { palette } = useAppTheme();
  const compactQuestionnaireCard = width < 430;
  const openQuestionnaire = () => {
    hapticLight();
    navigation.navigate('MentalHealthQuestionnaireIntro');
  };

  return (
    <View style={[s.root, { backgroundColor: palette.colors.bg }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: palette.colors.surface,
            borderBottomColor: palette.colors.line,
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
          accessibilityLabel="Close mental health article"
          hitSlop={8}
        >
          <Ionicons name="close" size={27} color={palette.colors.ink} />
        </Pressable>
        <Text style={[s.headerTitle, { color: palette.colors.ink }]}>{MENTAL_HEALTH_ARTICLE_CONTENT.title}</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        style={s.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          {
            paddingBottom: insets.bottom + spacing.xxl,
            backgroundColor: palette.colors.bg,
          },
        ]}
      >
        <View style={s.calloutWrap}>
          <View
            style={[
              s.questionnaireCallout,
              {
                backgroundColor: palette.colors.cardElevated,
                borderColor: palette.colors.line,
              },
              compactQuestionnaireCard && s.questionnaireCalloutCompact,
            ]}
          >
            <QuestionnaireMark size={compactQuestionnaireCard ? 78 : 96} />
            <View style={s.questionnaireCopy}>
              <Text style={[s.questionnaireTitle, { color: palette.colors.ink }]}>{MENTAL_HEALTH_QUESTIONNAIRE.title}</Text>
              <Text style={[s.questionnaireDescription, { color: palette.colors.inkSoft }]}>{MENTAL_HEALTH_QUESTIONNAIRE.articleSummary}</Text>
              <Pressable
                onPress={openQuestionnaire}
                style={[s.takeButton, compactQuestionnaireCard && s.takeButtonFull]}
                accessibilityRole="button"
                accessibilityLabel="Take mental health questionnaire"
              >
                <LinearGradient
                  colors={['#149DFF', '#0A84FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.takeButtonGradient}
                >
                  <Text style={s.takeButtonText}>Take Questionnaire</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={['#EAF8FF', '#DDF3F3', '#FFF6E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroArt}
        >
          <View style={s.mistBandTop} />
          <View style={s.mistBandBottom} />
          <CloudCluster variant="left" />
          <CloudCluster variant="right" />
          <CloudCluster variant="main" />
          <View style={[s.breezeLine, s.breezeLineOne]} />
          <View style={[s.breezeLine, s.breezeLineTwo]} />
          <View style={[s.breezeLine, s.breezeLineThree]} />
        </LinearGradient>

        <View style={s.articleBody}>
          {MENTAL_HEALTH_ARTICLE_CONTENT.sections.map((section) => (
            <View key={section.heading} style={s.section}>
              <Text style={[s.sectionHeading, { color: palette.colors.ink }]}>{section.heading}</Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={[s.paragraph, { color: palette.colors.inkSoft }]}>{paragraph}</Text>
              ))}
              {'list' in section && (
                <View style={s.list}>
                  {section.list.map((item, index) => (
                    <View key={item} style={s.listItem}>
                      <Text style={[s.listNumber, { color: palette.colors.primaryDeep }]}>{index + 1}.</Text>
                      <Text style={[s.listText, { color: palette.colors.inkSoft }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
              {'footer' in section && (
                <Text style={[s.paragraph, { color: palette.colors.inkSoft }]}>{section.footer}</Text>
              )}
            </View>
          ))}

        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 96,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 58,
  },
  scroll: {
    flex: 1,
  },
  content: {},
  calloutWrap: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  questionnaireCallout: {
    borderRadius: radii.button,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  questionnaireCalloutCompact: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  questionnaireCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  questionnaireTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 21,
    lineHeight: 27,
  },
  questionnaireDescription: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 24,
  },
  takeButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: radii.button,
    overflow: 'hidden',
    backgroundColor: '#0A84FF',
    marginTop: spacing.sm,
  },
  takeButtonFull: {
    alignSelf: 'stretch',
  },
  takeButtonGradient: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
  },
  heroArt: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mistBandTop: {
    position: 'absolute',
    top: 54,
    left: -26,
    width: 250,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.34)',
    transform: [{ rotate: '-6deg' }],
  },
  mistBandBottom: {
    position: 'absolute',
    right: -34,
    bottom: 50,
    width: 280,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.42)',
    transform: [{ rotate: '5deg' }],
  },
  mainCloud: {
    position: 'absolute',
    width: 286,
    height: 142,
    bottom: 42,
  },
  smallCloud: {
    position: 'absolute',
    width: 156,
    height: 78,
    opacity: 0.78,
  },
  leftCloud: {
    left: 34,
    top: 52,
    transform: [{ scale: 0.82 }],
  },
  rightCloud: {
    right: 28,
    top: 72,
    transform: [{ scale: 0.72 }],
  },
  cloudBase: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(126,159,181,0.18)',
  },
  mainCloudBase: {
    left: 34,
    right: 28,
    bottom: 8,
    height: 64,
    borderRadius: 34,
  },
  smallCloudBase: {
    left: 16,
    right: 16,
    bottom: 6,
    height: 34,
    borderRadius: 20,
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(126,159,181,0.16)',
  },
  mainPuffOne: {
    left: 54,
    bottom: 40,
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  mainPuffTwo: {
    left: 118,
    bottom: 54,
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  mainPuffThree: {
    right: 42,
    bottom: 36,
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  smallPuffOne: {
    left: 30,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  smallPuffTwo: {
    left: 62,
    bottom: 34,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  smallPuffThree: {
    right: 26,
    bottom: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  cloudShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(85,120,145,0.16)',
  },
  mainCloudShadow: {
    left: 62,
    right: 60,
    bottom: 0,
    height: 20,
    borderRadius: 10,
  },
  smallCloudShadow: {
    left: 30,
    right: 28,
    bottom: 0,
    height: 10,
    borderRadius: 5,
  },
  breezeLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(82,142,169,0.2)',
  },
  breezeLineOne: {
    width: 88,
    left: 74,
    bottom: 48,
  },
  breezeLineTwo: {
    width: 126,
    right: 54,
    bottom: 34,
  },
  breezeLineThree: {
    width: 58,
    right: 116,
    top: 62,
  },
  articleBody: {
    padding: spacing.lg,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeading: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    lineHeight: 31,
  },
  paragraph: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 26,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  listNumber: {
    width: 24,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 26,
  },
  listText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 26,
  },
});

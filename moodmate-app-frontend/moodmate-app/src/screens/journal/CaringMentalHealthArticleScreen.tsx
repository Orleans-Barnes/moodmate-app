import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';
import { hapticLight } from '@/utils/haptics';
import { MENTAL_HEALTH_QUESTIONNAIRE, QuestionnaireMark } from './MentalHealthQuestionnaireScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CaringMentalHealthArticle'>;

export const CARING_MENTAL_HEALTH_ARTICLE = {
  headerTitle: 'Mental Health Article',
  title: 'Caring For Your Mental Health',
  questionnaireLinkLabel: 'Mental Health Questionnaire',
  sections: [
    {
      heading: 'Caring For Your Mental Health',
      body: [
        'Your mental health is essential to your overall health. It can affect your thoughts, feelings, and behaviors. There are simple steps you can take to support your mental health.',
        "Incorporating some of these tips can help you cope with life's ups and downs, improve your mood, and help you manage your emotions.",
      ],
    },
    {
      heading: 'Log Your Emotions and Moods',
      body: [
        'When you keep a log of your emotions and mood, it may be easier to recognize the factors contributing to your state of mind. You can log your emotions and daily mood in MoodMate. When doing so, it can be useful to think about what emotion or mood you are feeling the most along with what things may be contributing to them.',
        "When you look at emotions and moods you've logged over a period of time, you may notice patterns. For example, if you see that you've logged an unpleasant mood for a persistent length of time, you may benefit from taking a mental health questionnaire. A mental health questionnaire can provide more information about your risk for common conditions and help you identify next steps.",
      ],
      showQuestionnaireLink: true,
    },
    {
      heading: 'Connect With Others',
      body: [
        'Social connection is one of the most important ways to care for your mental health. Social connection is when you feel close to and have a sense of belonging with others.',
        'These connections can come from many places such as school, work, family, or friends. There are numerous health benefits to close relationships including higher self-esteem, decreased chronic conditions, and reduced feelings of depression. Even something as simple as saying hello to someone walking by can have a positive impact on your wellbeing.',
        'When people have too few social interactions, it can lead to feelings of loneliness. Feeling alone can be associated with difficulty with sleep, increased blood pressure, or struggling to manage your emotions and mood.',
      ],
      bulletsTitle: 'How to improve your connections to others:',
      bullets: [
        'Volunteer in your community.',
        'Reach out to friends on a regular basis.',
        'Join a group focused on a hobby you like.',
        'Visit public spaces you enjoy.',
      ],
    },
    {
      heading: 'Spend Time Outside',
      body: [
        'Nature, such as parks or forest preserves, can have a significant and positive impact on your health. Spending 15-30 minutes outdoors each day can reduce stress levels and increase positive feelings. It may also help your focus and attention. Being out in nature gives your body and mind a chance to reset and relax.',
      ],
      bulletsTitle: 'Benefits of spending time outdoors:',
      bullets: [
        'Improves sleep.',
        'Reduces anxiety.',
        'Promotes creativity.',
        'Lowers stress.',
        'Improves physical health.',
      ],
    },
    {
      heading: 'Stay Active',
      body: [
        'The mind and body rely on each other to function their best. Exercise is important for everyone to support their mental health.',
        "Maintaining a regular exercise routine throughout the week can help you deal with stress, improve your cardiovascular health, and sleep better at night.",
        "You don't have to exercise vigorously every day to receive the physical and mental health benefits. Just doing 30 minutes or more of exercise three times a week can improve your mood and emotional wellbeing. Any activity you choose, from gardening to going for a run, can have a positive impact.",
      ],
      bulletsTitle: 'How to become more active:',
      bullets: [
        'Walk with friends or a loved one.',
        'Play outside with kids, family, or friends.',
        'Try new physical activities.',
        'Take small breaks for activity throughout your day.',
      ],
    },
    {
      heading: 'Eat Nutritious Foods and Stay Hydrated',
      body: [
        "You likely know that eating nutritious foods and drinking plenty of water is good for your body, but it's also essential to keep your mind healthy. When your body's needs aren't met, you may be more distracted, stressed, or fatigued. A diet balanced with complex carbohydrates, lean protein, and fatty acids can increase your energy, improve your mood, and support attention.",
      ],
      bulletsTitle: 'Some examples of a diverse diet:',
      bullets: [
        'Complex carbohydrates: rice, sweet potatoes, beets, quinoa.',
        'Lean protein: nuts, seeds, chicken, eggs, soybeans.',
        'Fatty acids: fish, eggs, nuts, dark leafy greens.',
      ],
      footer:
        "When you don't get the right amount of food or water, it can make regulating emotions and moods more difficult. Thirst and hunger can also slow down many of the body's functions which can lead to feelings of confusion or tiredness. By eating regularly and staying hydrated, you help your body deliver the nutrients it needs to manage your emotions and care for your body each day.",
    },
    {
      heading: 'Get Enough Sleep',
      body: [
        "Consistently sleeping at least seven hours is critical to caring for your mental health. When you are asleep your brain stores memories and processes events from your day. When you don't get enough rest, it can make it difficult to deal with emotions you experience each day. By getting the right amount of rest, you can reduce feelings of anxiety, improve focus, and increase positive feelings.",
      ],
      bulletsTitle: "How to get a good night's rest:",
      bullets: [
        'Avoid eating large meals two-three hours before bed.',
        'Keep your room cool and dark.',
        'Try to keep electronics and other distractions out of your bedroom.',
        "Don't go to bed unless you are tired.",
      ],
    },
    {
      heading: 'Give Mindfulness a Try',
      body: [
        "Mindfulness is the practice of connecting to the present moment and noticing what thoughts and feelings come to you without judging them. When life gets busy, it can be hard to take time to reflect and focus on how you're feeling. Ignoring or avoiding thoughts and feelings can make it easier to become overwhelmed by them.",
        "Over time, the practice of mindfulness can reduce anxiety and stress, increase self-compassion, and help you understand your thoughts and feelings.",
      ],
      bulletsTitle: "There are many ways to practice mindfulness. Here's a few you can try:",
      bullets: [
        'Breathing: Take deep breaths while focusing on the air moving in and out of your body. Bringing awareness to your breath can help your mind focus on the present moment.',
        'Grounding: Try naming an object you notice with any one of your senses. After a moment, move your attention to another object and name that one. You can do this with each of your senses until you feel more rooted to the present.',
        'Movement: Moving mindfully involves thinking about each movement your body makes while noticing the sights, sounds, or body sensations.',
      ],
    },
  ],
} as const;

export function CaringMentalHealthArticleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

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
        <Text style={[s.headerTitle, { color: palette.colors.ink }]}>{CARING_MENTAL_HEALTH_ARTICLE.headerTitle}</Text>
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
        <LinearGradient
          colors={['#FFF7EC', '#F4D1C5', '#EFA995']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroArt}
        >
          <View style={s.heroHalo} />
          <Ionicons name="flower-outline" size={118} color="#EF6341" />
          <View style={s.heroDot} />
        </LinearGradient>

        <View style={s.articleBody}>
          {CARING_MENTAL_HEALTH_ARTICLE.sections.map((section) => (
            <View key={section.heading} style={s.section}>
              <Text style={[s.sectionHeading, { color: palette.colors.ink }]}>{section.heading}</Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={[s.paragraph, { color: palette.colors.inkSoft }]}>
                  {paragraph}
                </Text>
              ))}

              {'showQuestionnaireLink' in section && section.showQuestionnaireLink && (
                <Pressable
                  onPress={openQuestionnaire}
                  style={[
                    s.questionnaireLink,
                    {
                      backgroundColor: palette.colors.accentBlueSoft,
                      borderColor: palette.colors.accentBlueDeep,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Open mental health questionnaire"
                >
                  <QuestionnaireMark size={58} />
                  <View style={s.questionnaireCopy}>
                    <Text style={s.questionnaireTitle}>
                      {CARING_MENTAL_HEALTH_ARTICLE.questionnaireLinkLabel}
                    </Text>
                    <Text style={[s.questionnaireText, { color: palette.colors.inkSoft }]}>
                      {MENTAL_HEALTH_QUESTIONNAIRE.intro}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#0A84FF" />
                </Pressable>
              )}

              {'bulletsTitle' in section && (
                <View style={s.bulletBlock}>
                  <Text style={[s.bulletsTitle, { color: palette.colors.ink }]}>{section.bulletsTitle}</Text>
                  {section.bullets.map((bullet) => (
                    <View key={bullet} style={s.bulletRow}>
                      <Text style={s.bulletDot}>{'\u2022'}</Text>
                      <Text style={[s.bulletText, { color: palette.colors.inkSoft }]}>{bullet}</Text>
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
  heroArt: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroHalo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 26,
    borderColor: 'rgba(239,99,65,0.17)',
  },
  heroDot: {
    position: 'absolute',
    right: 80,
    top: 62,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F36F55',
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
    fontSize: 25,
    lineHeight: 32,
  },
  paragraph: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 27,
  },
  questionnaireLink: {
    marginTop: spacing.md,
    borderRadius: radii.button,
    padding: spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  questionnaireCopy: {
    flex: 1,
    gap: 2,
  },
  questionnaireTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: '#35A7FF',
  },
  questionnaireText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  bulletBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bulletsTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    lineHeight: 25,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 18,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: '#EF9A89',
    lineHeight: 27,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 27,
  },
});

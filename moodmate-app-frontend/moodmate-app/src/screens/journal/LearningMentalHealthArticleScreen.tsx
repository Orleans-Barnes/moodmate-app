import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'LearningMentalHealthArticle'>;

export const LEARNING_MENTAL_HEALTH_ARTICLE = {
  headerTitle: 'Mental Health Article',
  title: 'Why Your Mental Health Matters',
  sections: [
    {
      heading: 'Why Your Mental Health Matters',
      body: [
        'Your mental health is essential to how you think, feel, and act. It can impact everything from how you relate to other people to your self-esteem and even how well your immune system works.',
        'When thinking about how to live a long, healthy life, many people focus on their fitness or physical health. It is just as important to give your mental health the same care and consideration.',
      ],
    },
    {
      heading: 'The Connection Between Mental and Physical Health',
      body: [
        'Your body and mind support one another, which means the actions you take to support your physical health can also benefit your mental health.',
        'Caring for your mental and physical health together can have a long-lasting impact on your quality of life, reduce your risk for chronic illness, and increase your longevity.',
      ],
    },
    {
      heading: 'What Are Emotions and Moods?',
      body: [
        'The way you experience your mental health is often through your emotions and moods. The main difference between an emotion and a mood is how long they last. Emotions are automatic responses that only last for a moment. Moods are more stable, they can last for days or even weeks.',
        'Emotions can be caused by a personally meaningful experience. The experience can be internal or external, such as when you recall a vacation or watch a scary film. The emotions you feel in those moments occur automatically.',
        'Emotions help provide you with valuable information about your experiences and surroundings, such as something you are scared of or should avoid. They do this by releasing hormones and redirecting blood supply so that you can respond appropriately.',
        'While emotions typically last a moment, moods tend to be more stable, lasting for days or longer. It may be difficult to know where a mood comes from because they can come from several experiences or may have no identifiable cause. Your moods can be influenced by your personality, the time of year, hormones, and your surroundings. While moods are less intense than emotions, they can still affect how you think about things and your reactions.',
        "Paying attention to the differences between your emotions and moods can give you more insights into your thoughts, feelings, and behaviors. In MoodMate, you can log both momentary emotions and daily moods to help you get a better sense of what is impacting your state of mind. When you log, it's also helpful to identify the emotion or mood you're feeling most along with the things contributing to it. This can help you identify patterns.",
      ],
    },
    {
      heading: 'What Contributes to Your Mental Health?',
      body: [
        'Your mental health is the result of a number of factors including your life experiences, physical environment, family history, and biology. These factors can contribute positively or negatively to your mental health.',
        "Experiences such as neglect or trauma can place an individual at a greater risk for developing a mental health condition. A mental health condition impacts an individual's behaviors, thoughts, and moods. Some of the most common conditions include anxiety and depression.",
        "If left untreated, mental health conditions can interfere with your quality of life. That's why it's a good idea to mention any concerns you might have about your mental health with your doctor or care team.",
        'While there are some factors you may not have control over, there are things you can do to support your mental health.',
      ],
      numberedItems: [
        'Spend time outdoors in nature.',
        'Do something physically active.',
        'Maintain a consistent sleep schedule.',
        'Eat nutritious meals regularly and stay hydrated.',
        'Stay socially connected to others.',
      ],
    },
    {
      heading: 'Why You Should Pay Attention to Your Mental Health',
      body: [
        "In the same way it's a good idea to exercise regularly, paying attention to your emotions and moods can help you care for your mental health. You can do this by logging your state of mind and doing daily reflections. These techniques can help you understand and name your emotions and moods. Over time, this can help you gain more awareness about how you respond to your emotions and moods.",
        'Daily reflections can help you identify what experiences may be contributing to your emotions or mood. Reflecting on your day can also help you accept and acknowledge your feelings. While you may not be able to change when you experience an emotion, you can control how you respond to that emotion.',
        "Resilience and emotional regulation are two skills that can come from daily reflections and mood logging. Resilience is how well you are able to adapt to life's challenges or stressful situations. Emotional regulation is how well you can manage and respond to your emotions. You can build these skills by practicing mindfulness, engaging in self-compassion, and seeking support from others.",
      ],
    },
    {
      heading: 'How to Talk About Mental Health',
      body: [
        "Conversations about mental health can be hard because it's been so stigmatized. This can make it especially difficult to bring up your own concerns. One way to combat stigma and support your mental wellbeing is through open and honest conversations. There is no right way to talk about mental health.",
      ],
      numberedTitle: "If you want to start a conversation about mental health but aren't sure how, here are some tips:",
      numberedItems: [
        'Talk to someone you trust.',
        'Write down your feelings and what you want to discuss.',
        'Be honest about how you are feeling.',
        'Let people know how they can support you. You may want them to listen, give feedback, or help you do research.',
      ],
      secondaryNumberedTitle: "If you want to talk directly to your doctor, here's a list of things to pay attention to and mention:",
      secondaryNumberedItems: [
        'Significant and persistent changes to your thoughts, behaviors, or moods.',
        'A loss of interest or pleasure in doing activities you once enjoyed.',
        'Feelings of guilt, hopelessness, worry, or worthlessness.',
        'Excessive worries or anxiety.',
        'Changes in your lifestyle, such as eating too much or too little or sleeping too much or not enough.',
        'Increased use or reliance on substances, such as alcohol or drugs.',
        'Body aches, pain, or digestive issues with no clear cause.',
      ],
      footer: [
        'It is a good idea to mention any symptoms related to your health that are concerning to you. Your care team can help answer questions, direct you to additional resources, or provide you with next steps.',
      ],
    },
  ],
} as const;

export function LearningMentalHealthArticleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

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
        <Text style={[s.headerTitle, { color: palette.colors.ink }]}>{LEARNING_MENTAL_HEALTH_ARTICLE.headerTitle}</Text>
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
          colors={['#F7FFF7', '#C7E6CA', '#E7F7D8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroArt}
        >
          <View style={s.heroHalo} />
          <Ionicons name="chatbubbles-outline" size={116} color="#6FA178" />
          <View style={s.heroDot} />
        </LinearGradient>

        <View style={s.articleBody}>
          {LEARNING_MENTAL_HEALTH_ARTICLE.sections.map((section) => (
            <View key={section.heading} style={s.section}>
              <Text style={[s.sectionHeading, { color: palette.colors.ink }]}>{section.heading}</Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={[s.paragraph, { color: palette.colors.inkSoft }]}>
                  {paragraph}
                </Text>
              ))}

              {'numberedTitle' in section && (
                <Text style={[s.numberedTitle, { color: palette.colors.ink }]}>{section.numberedTitle}</Text>
              )}

              {'numberedItems' in section && (
                <View style={s.numberedBlock}>
                  {section.numberedItems.map((item, index) => (
                    <View key={item} style={s.numberedRow}>
                      <Text style={s.numberedIndex}>{index + 1}.</Text>
                      <Text style={[s.numberedText, { color: palette.colors.inkSoft }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {'secondaryNumberedItems' in section && (
                <View style={s.numberedBlock}>
                  <Text style={[s.numberedTitle, { color: palette.colors.ink }]}>{section.secondaryNumberedTitle}</Text>
                  {section.secondaryNumberedItems.map((item, index) => (
                    <View key={item} style={s.numberedRow}>
                      <Text style={s.numberedIndex}>{index + 1}.</Text>
                      <Text style={[s.numberedText, { color: palette.colors.inkSoft }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {'footer' in section && section.footer.map((paragraph) => (
                <Text key={paragraph} style={[s.paragraph, { color: palette.colors.inkSoft }]}>
                  {paragraph}
                </Text>
              ))}
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
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 26,
    borderColor: 'rgba(111,161,120,0.22)',
  },
  heroDot: {
    position: 'absolute',
    right: 84,
    top: 60,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6FA178',
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
  numberedBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  numberedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    lineHeight: 25,
    marginTop: spacing.sm,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  numberedIndex: {
    width: 28,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: '#A6D7A9',
    lineHeight: 27,
  },
  numberedText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 27,
  },
});

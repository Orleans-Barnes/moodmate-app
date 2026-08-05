import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmotionMoodArticle'>;

export const EMOTION_MOOD_ARTICLE = {
  headerTitle: 'Mental Health Article',
  title: 'The Difference Between Emotion and Mood',
  sections: [
    {
      heading: 'The Difference Between Emotion and Mood',
      body: [
        "While it's easy to use the terms emotions and mood interchangeably, there are key differences. An emotion lasts for a moment and is a reaction to a specific experience. A mood lasts for a longer period of time, can arise from multiple experiences, and may not have a clear cause. Becoming familiar with these differences can help you understand more about how you think, feel, and act.",
      ],
    },
    {
      heading: 'What Makes Up an Emotion?',
      body: [
        'Emotions happen automatically as a response to a personally meaningful experience. They can be caused by an internal or external experience, such as recalling a happy memory or watching a scary film.',
        'There are three components that make up an emotion. The first is the experience that causes the emotion, the second is your reaction, and the third is how you respond.',
        'One of the ways emotions work is by helping you make decisions quickly, moving you closer to a goal, or away from danger. When you experience an emotion, the body redirects your blood supply and releases hormones. If you think about the last time you were afraid, you may have felt a rush of blood to your face or a tingling sensation somewhere in your body. These feelings and sensations were likely caused by adrenaline, a hormone released by your body when you experience fear.',
        'How you experience and express your emotions is unique. It depends on factors such as your life experiences, family history, cultural beliefs, and values. As a child, you learn how to express emotions from those around you. Where and how you grew up can also contribute to whether or not you have any emotional reaction at all. For example, eating a piece of apple pie might bring you joy because of a fond childhood memory, but someone else may have no emotional response at all.',
      ],
    },
    {
      heading: 'Emotions Are Not Good or Bad',
      body: [
        'The beliefs you have about emotions can contribute to the overall impact they have on you. Believing an emotion is bad can sometimes cause people to ignore or avoid feeling that emotion. This can make it more difficult to accept and work through the emotion. This can make the thoughts, feelings, or body sensations brought on by certain emotions last longer.',
        'Emotions are not inherently good or bad, even though some feel more pleasant than others to experience. For instance, happiness tends to be pleasant, whereas frustration tends to be unpleasant. Emotions, both pleasant and unpleasant, help give you important information about your environment. Understanding that unpleasant and pleasant emotions are part of everyday life can also help them feel less overwhelming.',
      ],
    },
    {
      heading: 'What Is Emotional Regulation?',
      body: [
        "Emotion regulation is the process for managing your emotions and body's responses. Regulating your emotions can involve changing the way you think, act, or respond to experiences to reduce the intensity of certain emotions.",
        'You probably use emotion regulation skills in your life already. Telling yourself "it is just a movie" after screaming during a scary film is an example of a tool to regulate your emotions.',
        'One way to develop effective emotion regulation is to notice and name your emotions. This can be something as simple as taking a few seconds after an experience to acknowledge what you are feeling in the moment. Naming an emotion can decrease its intensity because it creates distance between you and the emotion you are feeling. That distance can put you in a better position to make more informed choices about how you respond.',
        'As an example, you may hear someone say, "I am angry!" In that moment, they are identifying as the emotion. To create distance from the emotion, you could say, "I am feeling angry because I am stuck in traffic and that is frustrating." The key difference is allowing yourself the space to see emotions as something you have instead of being something you are. This can make it easier to remember that emotions are temporary and help you react in a more thoughtful way.',
      ],
    },
    {
      heading: 'What Makes Up a Mood',
      body: [
        'Moods are feelings that last for a period of time and are not a reaction to a specific event. They tend to be less intense than emotions. Unlike an emotion, it is not always possible to know the exact cause of a mood. For example, having a few difficult days at work can negatively impact your mood. This can last even while you are away from work.',
      ],
      numberedTitle: 'Here are some factors that can contribute to your mood:',
      numberedItems: [
        'Biology: Hormonal changes caused by puberty, menstruation, or aging.',
        'Physical Health: Sleep, hydration, nutrition, activity, or time spent outdoors.',
        'Relationships: Family, friends, loved ones, colleagues, or classmates.',
        'Physical Environment: Noise, the weather, air quality, or your community.',
        'Psychology: Learned responses to stress, coping mechanisms, personality traits, or your thoughts about something that has happened.',
      ],
      footer: [
        "The practice of logging your emotions and moods can help you recognize the factors in your life that may be contributing to your state of mind. When logging, it can be helpful to think about which emotion or mood you're feeling most at that moment and what's contributing to it. This can help you identify patterns over time.",
        "Through logging, you may also notice how your mood changes depending on what else is going on in your life. It's possible that your moods and emotions don't always match up. For instance, you may be in a good mood and still feel unpleasant emotions. It's natural to feel a variety of emotions, even while your mood remains relatively the same.",
        'When you pay more attention to your emotions and moods, you can also discover things you can do to manage them. As an example, you may notice that you log pleasant feelings after you spend time outside. There are many ways to improve your mood, such as by doing something you enjoy, making plans to see a friend, or talking to someone you care about.',
      ],
    },
    {
      heading: 'Mood Disorders',
      body: [
        "While moods do fluctuate, it's worth paying attention to any time they begin to interfere with your work, daily activities, or quality of life. If this happens, it's a good idea to check in with your doctor or care team as these may be signs of a mood disorder or other mental health concern.",
        'A mood disorder can occur when your moods are negatively impacted over two or more weeks. The moods experienced tend to be extreme and persistent, and may not match up with what else is going on in your life.',
        "There are many different types of mood disorders, including depression and bipolar disorder. Each disorder has a unique set of symptoms, so it's important to bring any questions or concerns to your doctor or care team. Mood disorders can affect anyone, but are treatable when diagnosed by a healthcare professional.",
      ],
    },
  ],
} as const;

export function EmotionMoodArticleScreen({ navigation }: Props) {
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
        <Text style={[s.headerTitle, { color: palette.colors.ink }]}>{EMOTION_MOOD_ARTICLE.headerTitle}</Text>
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
          colors={['#EEF9FC', '#D5F2F7', '#F3FFF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroArt}
        >
          <View style={s.heroHalo} />
          <View style={s.heroCore}>
            <View style={s.heroHalf} />
          </View>
          <View style={s.heroDot} />
        </LinearGradient>

        <View style={s.articleBody}>
          {EMOTION_MOOD_ARTICLE.sections.map((section) => (
            <View key={section.heading} style={s.section}>
              <Text style={[s.sectionHeading, { color: palette.colors.ink }]}>{section.heading}</Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={[s.paragraph, { color: palette.colors.inkSoft }]}>
                  {paragraph}
                </Text>
              ))}

              {'numberedTitle' in section && (
                <View style={s.numberedBlock}>
                  <Text style={[s.numberedTitle, { color: palette.colors.ink }]}>{section.numberedTitle}</Text>
                  {section.numberedItems.map((item, index) => (
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
    borderColor: 'rgba(92,163,184,0.2)',
  },
  heroCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: '#5E97AA',
    backgroundColor: 'rgba(94,151,170,0.2)',
    overflow: 'hidden',
  },
  heroHalf: {
    width: 38,
    height: 76,
    backgroundColor: '#5E97AA',
  },
  heroDot: {
    position: 'absolute',
    right: 84,
    top: 60,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6AA6B8',
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
    color: '#82C5D3',
    lineHeight: 27,
  },
  numberedText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 27,
  },
});

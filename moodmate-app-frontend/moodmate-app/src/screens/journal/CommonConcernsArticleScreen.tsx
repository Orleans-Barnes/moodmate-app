import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'CommonConcernsArticle'>;

export const COMMON_CONCERNS_ARTICLE = {
  headerTitle: 'Mental Health Article',
  title: 'Common Concerns About Mental Health',
  sections: [
    {
      heading: 'Common Concerns About Mental Health',
      body: [
        'Mental health involves factors like how you think, feel, and behave. Mental health is a spectrum and where you are on that spectrum is unique to each individual. This is because the factors that contribute to your mental health, such as your experiences, family history, and biology, differ from person-to-person.',
        'Building awareness about common mental health concerns can help you learn what to pay attention to and support your overall health.',
      ],
    },
    {
      heading: 'What Is a Mental Health Condition?',
      body: [
        "A mental health condition is a disorder that can impact someone's thoughts, behaviors, feelings, and moods. These conditions can make it difficult to maintain daily activities and take away from someone's quality of life.",
        'The most common mental health conditions are anxiety, depression, and post-traumatic stress disorder (PTSD). Mental health conditions are common and can affect people of all ages.',
        'A mental health condition can only be diagnosed by a healthcare professional who can also tailor treatments to individual needs.',
      ],
    },
    {
      heading: 'Can Mental Health Conditions Be Prevented?',
      body: [
        "While there isn't a way to prevent every mental health condition, there are things you can do to minimize your risk and support your mental health.",
        "Increasing positive behaviors such as being physically active, hanging out with friends, or getting a good night's sleep consistently can have a positive impact on your mental health.",
      ],
    },
    {
      heading: 'What Should I Pay Attention to?',
      body: [
        'The way a mental health condition appears may be different from person-to-person. There are common signs to look for and mention to your doctor or care team.',
      ],
      numberedItems: [
        'Difficulty coping with everyday stress.',
        'Withdrawing from friends, family, and activities.',
        'Experiencing extreme changes to your feelings or moods.',
        'Confusion or difficulty concentrating.',
        'Changes such as eating or sleeping too much or too little.',
        'Feeling sad or down most of the time.',
        'Feeling detached from reality.',
      ],
      footer: [
        'As your mental and physical health are deeply connected, it is also worth paying attention to changes in your physical health. You may notice more headaches, stomach aches, or pain elsewhere in your body.',
      ],
    },
    {
      heading: 'Am I to Blame for a Mental Health Condition?',
      body: [
        "You are not to blame. Mental health conditions are no one's fault. Everyone will likely face challenges with their mental health at some point.",
        'Needing support with your mental health does not mean you have done anything wrong or that there is anything wrong with you. While it can be hard, asking for help is one of the best ways to get the support you need to start addressing your concerns.',
      ],
    },
    {
      heading: 'Can I Get Better?',
      body: [
        "Yes. Many people with mental health conditions recover or learn the skills to help them manage and thrive with their condition. As you recover you may experience ups and downs, and that's OK. Getting better looks different for everyone.",
        "There are many techniques and approaches to mental healthcare. You may try something new if one technique or method isn't working for you. As with all aspects of your health, you play an important role in the conversation with your doctor about what works best.",
      ],
    },
    {
      heading: 'When and How to Ask For Help?',
      body: [
        'Any time you have questions or concerns about your mental health, mention them to your care team. They can help you find resources or provide you with ways to support your health.',
        'Talking about your mental health with friends or family can feel intimidating, but there are ways you can make it easier.',
      ],
      numberedTitle: 'Ways to make the conversation easier:',
      numberedItems: [
        'Start with someone you trust.',
        "Write down the things you'd like to talk about.",
        'Ask for the kind of support you need.',
      ],
      secondaryNumberedTitle: 'What to do if you have concerns about a friend or loved one:',
      secondaryNumberedItems: [
        'Ask how they are doing and if they would like to talk.',
        'Listen to what they are saying and only offer feedback or suggestions if asked.',
        'It is okay to not know an answer to a question. You can offer to help research or find other resources with them.',
        'While you can suggest reaching out for support from a doctor or therapy, the decision to get help is up to the individual.',
        "Be patient and offer support when you can. These conversations can be difficult, but knowing you're there to support them can have a positive impact.",
      ],
    },
  ],
} as const;

export function CommonConcernsArticleScreen({ navigation }: Props) {
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
        <Text style={[s.headerTitle, { color: palette.colors.ink }]}>{COMMON_CONCERNS_ARTICLE.headerTitle}</Text>
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
          colors={['#FFF2EE', '#F4C9C0', '#F0D8ED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroArt}
        >
          <View style={s.heroHalo} />
          <Ionicons name="people-outline" size={112} color="#D8897A" />
          <View style={s.heroDot} />
        </LinearGradient>

        <View style={s.articleBody}>
          {COMMON_CONCERNS_ARTICLE.sections.map((section) => (
            <View key={section.heading} style={s.section}>
              <Text style={[s.sectionHeading, { color: palette.colors.ink }]}>{section.heading}</Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={[s.paragraph, { color: palette.colors.inkSoft }]}>
                  {paragraph}
                </Text>
              ))}

              {'numberedItems' in section && (
                <View style={s.numberedBlock}>
                  {'numberedTitle' in section && (
                    <Text style={[s.numberedTitle, { color: palette.colors.ink }]}>{section.numberedTitle}</Text>
                  )}
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
    borderColor: 'rgba(216,137,122,0.22)',
  },
  heroDot: {
    position: 'absolute',
    right: 84,
    top: 60,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D8897A',
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
    color: '#E9A79A',
    lineHeight: 27,
  },
  numberedText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: 27,
  },
});

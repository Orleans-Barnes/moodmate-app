import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';
import { hapticLight, hapticMedium } from '@/utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'MentalHealthQuestionnaire'>;
type AnswerMap = Partial<Record<number, number>>;

export const QUESTIONNAIRE_COMPACT_POLISH = {
  scale: 0.85,
  doneButtonHeight: 58,
} as const;

export const QUESTIONNAIRE_FLOW_POLISH = {
  closeUsesBackWhenPossible: true,
} as const;

export const QUESTIONNAIRE_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
] as const;

export const ANXIETY_SEVERITY_THRESHOLDS = [
  { min: 0, max: 4, label: 'Minimal', detail: 'Minimal anxiety symptoms' },
  { min: 5, max: 9, label: 'Mild', detail: 'Mild anxiety symptoms' },
  { min: 10, max: 14, label: 'Moderate', detail: 'Moderate anxiety symptoms' },
  { min: 15, max: 21, label: 'Severe', detail: 'Severe anxiety symptoms' },
] as const;

export const DEPRESSION_SEVERITY_THRESHOLDS = [
  { min: 0, max: 4, label: 'Minimal', detail: 'Minimal depression symptoms' },
  { min: 5, max: 9, label: 'Mild', detail: 'Mild depression symptoms' },
  { min: 10, max: 14, label: 'Moderate', detail: 'Moderate depression symptoms' },
  { min: 15, max: 19, label: 'Moderately severe', detail: 'Moderately severe depression symptoms' },
  { min: 20, max: 27, label: 'Severe', detail: 'Severe depression symptoms' },
] as const;

export const MENTAL_HEALTH_QUESTIONNAIRE = {
  title: 'Mental Health Questionnaire',
  intro:
    'This assessment uses standardized questions to give you a sense of your risk for two very common and treatable conditions - anxiety and depression.',
  articleSummary:
    'Along with regular reflection, assessing your current risk for common conditions can be an important part of caring for your mental health.',
  prompt: 'Over the last two weeks, how often have you been bothered by the following problems?',
  questions: [
    { text: 'Feeling nervous, anxious or on edge' },
    { text: 'Not being able to stop or control worrying' },
    { text: 'Worrying too much about different things' },
    { text: 'Trouble relaxing' },
    { text: 'Being so restless that it is hard to sit still' },
    { text: 'Becoming easily annoyed or irritable' },
    { text: 'Feeling afraid as if something awful might happen' },
    { text: 'Little interest or pleasure in doing things' },
    { text: 'Feeling down, depressed, or hopeless' },
    { text: 'Trouble falling or staying asleep, or sleeping too much' },
    { text: 'Feeling tired or having little energy' },
    { text: 'Poor appetite or overeating' },
    { text: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down' },
    { text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
    {
      text:
        'Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
    },
    { text: 'Thoughts that you would be better off dead or of hurting yourself in some way', optional: true },
  ],
} as const;

type QuestionnaireQuestion = typeof MENTAL_HEALTH_QUESTIONNAIRE.questions[number];
type SeverityThreshold = typeof ANXIETY_SEVERITY_THRESHOLDS[number] | typeof DEPRESSION_SEVERITY_THRESHOLDS[number];

function isOptionalQuestion(question: QuestionnaireQuestion) {
  return 'optional' in question && question.optional === true;
}

function sumAnswers(answers: AnswerMap, start: number, end: number) {
  let total = 0;
  for (let index = start; index <= end; index += 1) {
    total += answers[index] ?? 0;
  }
  return total;
}

function classifyScore<T extends readonly SeverityThreshold[]>(score: number, thresholds: T): T[number] {
  return thresholds.find((threshold) => score >= threshold.min && score <= threshold.max) ?? thresholds[0];
}

export function getQuestionnaireVerdict(answers: AnswerMap) {
  const anxietyScore = sumAnswers(answers, 0, 6);
  const depressionScore = sumAnswers(answers, 7, 15);
  const anxiety = classifyScore(anxietyScore, ANXIETY_SEVERITY_THRESHOLDS);
  const depression = classifyScore(depressionScore, DEPRESSION_SEVERITY_THRESHOLDS);
  const safetyResponse = answers[15];
  const safetyFlag = typeof safetyResponse === 'number' && safetyResponse > 0;
  const depressionComplete = typeof safetyResponse === 'number';
  const needsFollowUp = safetyFlag || anxietyScore >= 10 || depressionScore >= 10;
  const hasMildSymptoms = anxietyScore >= 5 || depressionScore >= 5;

  if (safetyFlag) {
    return {
      title: 'Urgent support is recommended',
      description:
        'You marked thoughts of self-harm. Please reach out to emergency services, a trusted person, or your care team now. You can also use MoodMate SOS for immediate grounding and support options.',
      anxietyScore,
      depressionScore,
      anxiety,
      depression,
      safetyFlag,
      depressionComplete,
    };
  }

  if (needsFollowUp) {
    return {
      title: 'Follow-up is recommended',
      description:
        'Your answers suggest symptoms that may benefit from a conversation with a doctor, counsellor, or care team. This is a screening result, not a diagnosis.',
      anxietyScore,
      depressionScore,
      anxiety,
      depression,
      safetyFlag,
      depressionComplete,
    };
  }

  if (hasMildSymptoms) {
    return {
      title: 'Keep monitoring',
      description:
        'Your answers suggest mild symptoms. Keep tracking how you feel and consider talking with someone if symptoms continue or start affecting daily life.',
      anxietyScore,
      depressionScore,
      anxiety,
      depression,
      safetyFlag,
      depressionComplete,
    };
  }

  return {
    title: 'Low current risk',
    description:
      'Your answers suggest minimal symptoms right now. Keep checking in over time, especially if your mood, sleep, appetite, or worry changes.',
    anxietyScore,
    depressionScore,
    anxiety,
    depression,
    safetyFlag,
    depressionComplete,
  };
}

export function QuestionnaireMark({ size = 96 }: { size?: number }) {
  return (
    <View style={[markS.frame, { width: size, height: size * 1.26, borderRadius: size * 0.16 }]}>
      <Ionicons name="clipboard-outline" size={size * 0.94} color="#4D9295" />
      <View style={[markS.badge, { width: size * 0.54, height: size * 0.54, borderRadius: size * 0.27 }]}>
        <Ionicons name="fitness-outline" size={size * 0.34} color="#6EF3EE" />
      </View>
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        s.iconButton,
        {
          backgroundColor: palette.glass.fill,
          borderColor: palette.glass.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
    >
      <Ionicons name={icon} size={26} color={palette.colors.ink} />
    </Pressable>
  );
}

function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: QuestionnaireQuestion;
  index: number;
  answer: number | undefined;
  onAnswer: (value: number) => void;
}) {
  const { palette } = useAppTheme();

  return (
    <View
      style={[
        s.questionCard,
        {
          backgroundColor: palette.colors.cardElevated,
          borderColor: palette.colors.line,
        },
      ]}
    >
      <View style={s.questionCopy}>
        <Text style={[s.questionMeta, { color: palette.colors.inkFaint }]}>
          Question {index + 1} of {MENTAL_HEALTH_QUESTIONNAIRE.questions.length}
          {isOptionalQuestion(question) ? ' (Optional)' : ''}
        </Text>
        <Text style={[s.questionText, { color: palette.colors.ink }]}>{question.text}</Text>
      </View>

      {QUESTIONNAIRE_OPTIONS.map((option) => {
        const selected = answer === option.value;
        return (
          <Pressable
            key={option.label}
            onPress={() => onAnswer(option.value)}
            style={[s.optionRow, { borderTopColor: palette.colors.lineSoft }]}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${question.text}, ${option.label}`}
          >
            <Text style={[s.optionText, { color: palette.colors.ink }]}>{option.label}</Text>
            <View
              style={[
                s.radio,
                { borderColor: palette.colors.inkFaint },
                selected && { borderColor: '#0A84FF' },
              ]}
            >
              {selected && <View style={[s.radioDot, { backgroundColor: '#0A84FF' }]} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ScoreCard({
  label,
  score,
  max,
  detail,
}: {
  label: string;
  score: number;
  max: number;
  detail: string;
}) {
  const { palette } = useAppTheme();

  return (
    <View
      style={[
        s.scoreCard,
        {
          backgroundColor: palette.colors.cardElevated,
          borderColor: palette.colors.line,
        },
      ]}
    >
      <Text style={[s.scoreLabel, { color: palette.colors.inkFaint }]}>{label}</Text>
      <Text style={[s.scoreNumber, { color: palette.colors.ink }]}>{score}/{max}</Text>
      <Text style={[s.scoreDetail, { color: palette.colors.inkSoft }]}>{detail}</Text>
    </View>
  );
}

export function MentalHealthQuestionnaireScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [showResults, setShowResults] = useState(false);

  const answeredRequired = MENTAL_HEALTH_QUESTIONNAIRE.questions.reduce((count, question, index) => {
    if (isOptionalQuestion(question)) {
      return count;
    }
    return typeof answers[index] === 'number' ? count + 1 : count;
  }, 0);
  const requiredTotal = MENTAL_HEALTH_QUESTIONNAIRE.questions.filter((question) => !isOptionalQuestion(question)).length;
  const canSubmit = answeredRequired === requiredTotal;
  const verdict = useMemo(() => getQuestionnaireVerdict(answers), [answers]);

  const handleAnswer = (index: number, value: number) => {
    hapticLight();
    setAnswers((current) => ({ ...current, [index]: value }));
  };

  const closeToArticle = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.replace('MentalHealthArticle');
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
    navigation.goBack();
  };

  const handleDone = () => {
    if (!canSubmit) {
      return;
    }
    hapticMedium();
    setShowResults(true);
  };

  return (
    <View style={[s.root, { backgroundColor: palette.colors.bg }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + spacing.md,
            backgroundColor: palette.colors.surface,
            borderBottomColor: palette.colors.line,
          },
        ]}
      >
        <View style={s.headerRow}>
          <IconButton icon="chevron-back" label={showResults ? 'Back to questionnaire' : 'Back'} onPress={handleBack} />
          <IconButton icon="close" label="Close questionnaire" onPress={closeToArticle} />
        </View>
        <Text style={[s.prompt, { color: palette.colors.ink }]}>
          {showResults ? 'Your questionnaire summary' : MENTAL_HEALTH_QUESTIONNAIRE.prompt}
        </Text>
      </View>

      {showResults ? (
        <ScrollView
          style={s.scroll}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.resultsContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        >
          <View
            style={[
              s.verdictCard,
              {
                backgroundColor: palette.colors.cardElevated,
                borderColor: verdict.safetyFlag ? 'rgba(255,110,110,0.34)' : 'rgba(49,168,255,0.24)',
              },
              verdict.safetyFlag && s.safetyCard,
            ]}
          >
            <Text style={s.verdictEyebrow}>Screening verdict</Text>
            <Text style={[s.verdictTitle, { color: palette.colors.ink }]}>{verdict.title}</Text>
            <Text style={[s.verdictDescription, { color: palette.colors.inkSoft }]}>{verdict.description}</Text>
          </View>

          <View style={s.scoreGrid}>
            <ScoreCard label="Anxiety" score={verdict.anxietyScore} max={21} detail={verdict.anxiety.detail} />
            <ScoreCard label="Depression" score={verdict.depressionScore} max={27} detail={verdict.depression.detail} />
          </View>

          {!verdict.depressionComplete && (
            <View style={[s.noteCard, { backgroundColor: palette.colors.cardElevated, borderColor: palette.colors.line }]}>
              <Text style={[s.noteTitle, { color: palette.colors.ink }]}>Partial depression score</Text>
              <Text style={[s.noteText, { color: palette.colors.inkSoft }]}>
                The optional safety question was skipped, so the depression score is based on the answered items and may be incomplete.
              </Text>
            </View>
          )}

          <View style={[s.noteCard, { backgroundColor: palette.colors.cardElevated, borderColor: palette.colors.line }]}>
            <Text style={[s.noteTitle, { color: palette.colors.ink }]}>Important</Text>
            <Text style={[s.noteText, { color: palette.colors.inkSoft }]}>
              This questionnaire can help you reflect on symptoms, but it cannot diagnose any condition. A doctor,
              counsellor, or qualified care team can help interpret your results.
            </Text>
          </View>

          {verdict.safetyFlag && (
            <Pressable
              onPress={() => navigation.navigate('SOS')}
              style={s.sosButton}
              accessibilityRole="button"
              accessibilityLabel="Open SOS support"
            >
              <Text style={s.sosButtonText}>Open SOS Support</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          )}

          <Pressable
            onPress={closeToArticle}
            style={[s.closeResultButton, { backgroundColor: palette.glass.fill, borderColor: palette.glass.border }]}
            accessibilityRole="button"
            accessibilityLabel="Close questionnaire results"
          >
            <Text style={[s.closeResultText, { color: palette.colors.ink }]}>Close</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            style={s.scroll}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator
            contentContainerStyle={[s.questionContent, { paddingBottom: insets.bottom + 124 }]}
          >
            {MENTAL_HEALTH_QUESTIONNAIRE.questions.map((question, index) => (
              <QuestionCard
                key={question.text}
                question={question}
                index={index}
                answer={answers[index]}
                onAnswer={(value) => handleAnswer(index, value)}
              />
            ))}
          </ScrollView>

          <View
            style={[
              s.doneBar,
              {
                paddingBottom: insets.bottom + spacing.md,
                backgroundColor: palette.colors.surface,
                borderTopColor: palette.colors.line,
              },
            ]}
          >
            <Pressable
              onPress={handleDone}
              disabled={!canSubmit}
              style={[
                s.doneButton,
                {
                  backgroundColor: palette.glass.fill,
                  borderColor: palette.glass.border,
                },
                canSubmit && s.doneButtonReady,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              accessibilityLabel="Finish questionnaire"
            >
              <Text style={[s.doneText, { color: palette.colors.inkFaint }, canSubmit && s.doneTextReady]}>Done</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const markS = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6EF3EE',
    backgroundColor: '#202226',
  },
});

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    fontFamily: fonts.bodyBold,
    fontSize: 26,
    lineHeight: 33,
  },
  scroll: {
    flex: 1,
  },
  questionContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  questionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  questionCopy: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  questionMeta: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.48)',
  },
  questionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    lineHeight: 22,
  },
  optionRow: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
  radio: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
  },
  doneBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  doneButton: {
    height: QUESTIONNAIRE_COMPACT_POLISH.doneButtonHeight,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  doneButtonReady: {
    backgroundColor: '#0A84FF',
    borderColor: '#31A8FF',
  },
  doneText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
  },
  doneTextReady: {
    color: '#FFFFFF',
  },
  resultsContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  verdictCard: {
    borderRadius: radii.button,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  safetyCard: {
    backgroundColor: 'rgba(255,110,110,0.16)',
  },
  verdictEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#65C7FF',
    textTransform: 'uppercase',
  },
  verdictTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 23,
    lineHeight: 29,
  },
  verdictDescription: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    lineHeight: 23,
  },
  scoreGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scoreCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: radii.button,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  scoreLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
  },
  scoreNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 23,
  },
  scoreDetail: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  noteCard: {
    borderRadius: radii.button,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  noteTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
  },
  noteText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    lineHeight: 23,
  },
  sosButton: {
    minHeight: 52,
    borderRadius: radii.button,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#0A84FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sosButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
  },
  closeResultButton: {
    minHeight: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeResultText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
  },
});

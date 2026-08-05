const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const files = [
  'src/screens/journal/MentalHealthArticleScreen.tsx',
  'src/screens/journal/MentalHealthQuestionnaireIntroScreen.tsx',
  'src/screens/journal/MentalHealthQuestionnaireScreen.tsx',
  'src/screens/journal/CaringMentalHealthArticleScreen.tsx',
  'src/screens/journal/CommonConcernsArticleScreen.tsx',
  'src/screens/journal/LearningMentalHealthArticleScreen.tsx',
  'src/screens/journal/EmotionMoodArticleScreen.tsx',
  'src/theme/useAppTheme.ts',
];

for (const file of files) {
  if (!exists(file)) throw new Error(`Missing migrated file: ${file}`);
}

const routes = [
  'MentalHealthArticle',
  'MentalHealthQuestionnaireIntro',
  'MentalHealthQuestionnaire',
  'CaringMentalHealthArticle',
  'CommonConcernsArticle',
  'LearningMentalHealthArticle',
  'EmotionMoodArticle',
];

const navigator = read('src/navigation/RootNavigator.tsx');
const types = read('src/navigation/types.ts');
for (const route of routes) {
  if (!navigator.includes(`name="${route}"`)) throw new Error(`Navigator missing route ${route}`);
  if (!types.includes(`${route}: undefined`)) throw new Error(`RootStackParamList missing ${route}`);
}

const journal = read('src/screens/journal/JournalScreen.tsx');
for (const title of [
  'Mental Health Questionnaires',
  'Caring For Your Mental Health',
  'Common Concerns About Mental Health',
  'Learning About Mental Health',
  'The Difference Between Emotion and Mood',
]) {
  if (!journal.includes(title)) throw new Error(`Journal guide card missing: ${title}`);
}

const questionnaireArticle = read('src/screens/journal/MentalHealthArticleScreen.tsx');
if (!questionnaireArticle.includes('Take Questionnaire')) {
  throw new Error('Mental health article is missing the questionnaire CTA');
}
if (!questionnaireArticle.includes('CloudCluster') || questionnaireArticle.toLowerCase().includes('rainbow')) {
  throw new Error('Mental health article should use the cloud artwork, not the rainbow artwork');
}

const questionnaire = read('src/screens/journal/MentalHealthQuestionnaireScreen.tsx');
for (const marker of [
  'MENTAL_HEALTH_QUESTIONNAIRE',
  'getQuestionnaireVerdict',
  'Thoughts that you would be better off dead or of hurting yourself in some way',
]) {
  if (!questionnaire.includes(marker)) throw new Error(`Questionnaire missing marker: ${marker}`);
}

for (const [file, heading] of [
  ['src/screens/journal/CaringMentalHealthArticleScreen.tsx', 'Caring For Your Mental Health'],
  ['src/screens/journal/CommonConcernsArticleScreen.tsx', 'Common Concerns About Mental Health'],
  ['src/screens/journal/LearningMentalHealthArticleScreen.tsx', 'Why Your Mental Health Matters'],
  ['src/screens/journal/EmotionMoodArticleScreen.tsx', 'The Difference Between Emotion and Mood'],
]) {
  if (!read(file).includes(heading)) throw new Error(`${file} missing heading: ${heading}`);
}

console.log('Selected journal guide migration checks passed.');

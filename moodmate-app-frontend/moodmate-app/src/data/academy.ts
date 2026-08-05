export interface AcademyLesson {
  id: string;
  title: string;
  body: string;
  quiz: string;
  answer: string;
}

export interface AcademyCourse {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  lessons: AcademyLesson[];
}

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: 'mental-wellness',
    title: 'Mental Wellness Foundations',
    subtitle: 'Understand student wellbeing and common challenges.',
    icon: 'leaf-outline',
    lessons: [
      { id: 'mw-1', title: 'What wellness means', body: 'Mental wellness is the ongoing practice of noticing our needs, using healthy support, and staying connected to meaning and community.', quiz: 'What is a healthy view of mental wellness?', answer: 'It changes over time and can be supported.' },
      { id: 'mw-2', title: 'Student life and stress', body: 'Academic pressure, finances, relationships, identity, and transitions can all affect a student. Listen without assuming that one explanation fits everyone.', quiz: 'What should you do first when a student shares a problem?', answer: 'Listen and understand their experience.' },
    ],
  },
  {
    id: 'active-listening',
    title: 'Active Listening',
    subtitle: 'Build trust through empathy, presence, and open questions.',
    icon: 'ear-outline',
    lessons: [
      { id: 'al-1', title: 'Listen to understand', body: 'Give the person your attention, reflect what you heard, and allow pauses. You do not need to solve the moment immediately.', quiz: 'Which response shows reflection?', answer: 'It sounds like this has been exhausting for you.' },
      { id: 'al-2', title: 'Questions that open space', body: 'Use gentle questions such as “What has this been like for you?” Avoid interrogation, judgement, and rushing to advice.', quiz: 'Which question opens space?', answer: 'What would feel most helpful right now?' },
    ],
  },
  {
    id: 'ethics-boundaries',
    title: 'Ethics and Boundaries',
    subtitle: 'Protect privacy, dignity, and the limits of peer support.',
    icon: 'shield-checkmark-outline',
    lessons: [
      { id: 'eb-1', title: 'Confidentiality', body: 'Treat a student’s story with care. Explain its limits clearly: immediate safety risks must be escalated to qualified help.', quiz: 'When must confidentiality be broken?', answer: 'When there is an immediate safety concern.' },
      { id: 'eb-2', title: 'Stay in your role', body: 'A peer mentor is a supportive bridge, not a therapist. Do not diagnose, promise secrecy, or become someone’s only support.', quiz: 'What is a healthy boundary?', answer: 'Connect the student to professional care when needed.' },
    ],
  },
  {
    id: 'warning-signs',
    title: 'Recognising Warning Signs',
    subtitle: 'Notice changes that may call for extra support.',
    icon: 'alert-circle-outline',
    lessons: [
      { id: 'ws-1', title: 'Changes worth noticing', body: 'Withdrawal, hopelessness, sudden risk-taking, disrupted sleep, missed classes, or giving away valued things can signal that a student needs more support.', quiz: 'What is the safest response to several warning signs?', answer: 'Ask with care and connect them to qualified support.' },
      { id: 'ws-2', title: 'Ask directly and calmly', body: 'A clear, caring question about self-harm does not plant the idea. It creates an opening for honesty and safety planning.', quiz: 'How should you ask about safety?', answer: 'Directly, calmly, and without judgement.' },
    ],
  },
  {
    id: 'crisis-escalation',
    title: 'Crisis Escalation',
    subtitle: 'Know when to pause peer support and activate help.',
    icon: 'megaphone-outline',
    lessons: [
      { id: 'ce-1', title: 'When not to help alone', body: 'Urgent risk, a plan to self-harm, violence, abuse, or inability to stay safe requires immediate counsellor, crisis-team, or emergency support.', quiz: 'What is the priority during urgent risk?', answer: 'Stay present and activate emergency support.' },
      { id: 'ce-2', title: 'Make the handoff', body: 'Tell the student what you are doing, share only necessary information through approved channels, and remain supportive while qualified help takes over.', quiz: 'What makes a good handoff?', answer: 'Clear facts, consent where possible, and timely escalation.' },
    ],
  },
  {
    id: 'working-with-counsellors',
    title: 'Working With Counsellors',
    subtitle: 'Write useful reports and collaborate without carrying cases alone.',
    icon: 'people-circle-outline',
    lessons: [
      { id: 'wc-1', title: 'A useful case note', body: 'Record observable facts, the student’s own words where relevant, actions taken, and the support requested. Avoid labels and speculation.', quiz: 'What belongs in a case note?', answer: 'Observable facts and actions taken.' },
      { id: 'wc-2', title: 'Feedback and follow-up', body: 'Use the counsellor collaboration channel for difficult cases, agree on next steps, and follow up without promising an outcome you cannot control.', quiz: 'What should a mentor do with a difficult case?', answer: 'Request counsellor assistance promptly.' },
    ],
  },
];

export const ACADEMY_PASS_MARK = 80;

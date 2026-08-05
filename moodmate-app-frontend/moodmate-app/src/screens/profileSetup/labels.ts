import type { Programme, YearOfStudy, WellnessGoal, Challenge, PreferredSupport } from '@/api/types';

// Display labels are a frontend-only concern (see PHASE_1C_I_API_CONTRACT.md "API version
// stability" — the backend only validates enum membership, wording/grouping lives here). Keeping
// every enum's label map in one file means adding a new backend enum value only ever requires
// touching this file plus the one screen that renders it — not five different chip arrays.

export const PROGRAMME_LABELS: Record<Programme, string> = {
  COMPUTER_SCIENCE: 'Computer Science',
  INFORMATION_TECHNOLOGY: 'Information Technology',
  COMPUTER_ENGINEERING: 'Computer Engineering',
  ELECTRICAL_ENGINEERING: 'Electrical Engineering',
  MECHANICAL_ENGINEERING: 'Mechanical Engineering',
  CIVIL_ENGINEERING: 'Civil Engineering',
  BUSINESS_ADMINISTRATION: 'Business Administration',
  ACCOUNTING: 'Accounting',
  MEDICINE: 'Medicine',
  NURSING: 'Nursing',
  PHARMACY: 'Pharmacy',
  LAW: 'Law',
  PSYCHOLOGY: 'Psychology',
  ECONOMICS: 'Economics',
  AGRICULTURE: 'Agriculture',
  ARCHITECTURE: 'Architecture',
  OTHER: 'Other',
};

export const YEAR_OF_STUDY_LABELS: Record<YearOfStudy, string> = {
  FIRST_YEAR: '1st Year',
  SECOND_YEAR: '2nd Year',
  THIRD_YEAR: '3rd Year',
  FOURTH_YEAR: '4th Year',
  FIFTH_YEAR: '5th Year',
  POSTGRADUATE: 'Postgraduate',
};

export const WELLNESS_GOAL_LABELS: Record<WellnessGoal, string> = {
  LESS_STRESS: 'Feel less stressed',
  BETTER_SLEEP: 'Sleep better',
  MORE_CONFIDENT: 'Feel more confident',
  BETTER_FOCUS: 'Improve focus',
  BETTER_GRADES: 'Do better academically',
  TRACK_EMOTIONS: 'Understand my emotions',
  BUILD_HEALTHY_HABITS: 'Build healthy habits',
  CONNECT_WITH_SUPPORT: 'Connect with support',
  MORE_MOTIVATION: 'Find more motivation',
};

export const CHALLENGE_LABELS: Record<Challenge, string> = {
  ACADEMIC_PRESSURE: 'Academic pressure',
  LONELINESS: 'Loneliness',
  ANXIETY: 'Anxiety',
  BURNOUT: 'Burnout',
  FINANCIAL_STRESS: 'Financial stress',
  RELATIONSHIPS: 'Relationships',
  TIME_MANAGEMENT: 'Time management',
  CAREER_CONCERNS: 'Career concerns',
};

export const PREFERRED_SUPPORT_LABELS: Record<PreferredSupport, string> = {
  AI_COACH: 'AI Coach',
  COUNSELLOR: 'Counsellor',
  PEER_MENTOR: 'Peer Mentor',
  JOURNALING: 'Journaling',
  BREATHING: 'Breathing exercises',
  COMMUNITY: 'Community',
  SELF_GUIDED: 'Self-guided',
};

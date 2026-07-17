/**
 * CBT Thought library for Thought Sorter game
 *
 * Thoughts labelled:
 *  helpful  = balanced, realistic, growth-oriented
 *  unhelpful = cognitive distortions (catastrophising, all-or-nothing, mind-reading, etc.)
 */

export interface Thought {
  id: number;
  text: string;
  type: 'helpful' | 'unhelpful';
  distortion?: string;  // only for unhelpful thoughts
  reframe?: string;     // shown after sorting unhelpful thought correctly
}

export const THOUGHTS: Thought[] = [
  // ── Unhelpful (cognitive distortions) ─────────────────────────────────
  { id: 1, text: "I failed one exam — I'm going to fail everything.", type: 'unhelpful', distortion: 'Catastrophising', reframe: "One setback doesn't define my entire academic journey." },
  { id: 2, text: "Everyone in the lecture was judging me.", type: 'unhelpful', distortion: 'Mind reading', reframe: "I don't actually know what others were thinking. Most people focus on themselves." },
  { id: 3, text: "I'm either successful or a complete failure. Nothing in between.", type: 'unhelpful', distortion: 'All-or-nothing thinking', reframe: "Success exists on a spectrum. Progress counts, even if it's imperfect." },
  { id: 4, text: "I should be over this by now.", type: 'unhelpful', distortion: 'Should statements', reframe: "Healing and growth take time. There's no fixed schedule for emotions." },
  { id: 5, text: "This always happens to me.", type: 'unhelpful', distortion: 'Overgeneralisation', reframe: "This happened today — it's not a permanent pattern about my life." },
  { id: 6, text: "I feel anxious, so something bad must be about to happen.", type: 'unhelpful', distortion: 'Emotional reasoning', reframe: "Feeling anxious is uncomfortable, but feelings aren't always facts." },
  { id: 7, text: "My friend didn't reply — they must be angry at me.", type: 'unhelpful', distortion: 'Mind reading', reframe: "People have busy days. The most likely reason isn't anything about me." },
  { id: 8, text: "I'm too stupid to pass this course.", type: 'unhelpful', distortion: 'Labelling', reframe: "I'm someone who finds this course challenging right now — and challenges can be overcome." },
  { id: 9, text: "Nothing will ever get better.", type: 'unhelpful', distortion: 'Fortune telling', reframe: "The future is unknown. Many difficult situations have improved before — this one might too." },
  { id: 10, text: "I must do everything perfectly or it's not worth doing.", type: 'unhelpful', distortion: 'Perfectionism', reframe: "Done is better than perfect. Progress matters more than flawlessness." },
  { id: 11, text: "It's my fault my friends are upset.", type: 'unhelpful', distortion: 'Personalisation', reframe: "I can care about my friends' feelings without assuming everything is my fault." },
  { id: 12, text: "The good things that happened were just luck.", type: 'unhelpful', distortion: 'Disqualifying the positive', reframe: "My efforts contributed to those outcomes too." },
  { id: 13, text: "I can't cope with this stress.", type: 'unhelpful', distortion: 'Magnification', reframe: "I've managed difficult moments before. I can cope — even if it's hard." },
  { id: 14, text: "I ruined the whole evening by being quiet.", type: 'unhelpful', distortion: 'All-or-nothing', reframe: "One quiet moment doesn't ruin an entire evening for others." },
  { id: 15, text: "I should never feel sad or angry.", type: 'unhelpful', distortion: 'Should statements', reframe: "All emotions are valid. Feeling difficult emotions is part of being human." },
  { id: 16, text: "People who are competent don't struggle like this.", type: 'unhelpful', distortion: 'Comparison', reframe: "Everyone struggles — they just don't always show it. Struggling doesn't mean incompetence." },
  { id: 17, text: "I'm a burden to everyone around me.", type: 'unhelpful', distortion: 'Mind reading / Personalisation', reframe: "The people who care about me do so because they value me, not because I'm a burden." },
  { id: 18, text: "If I ask for help, people will think I'm weak.", type: 'unhelpful', distortion: 'Mind reading', reframe: "Asking for help is a sign of self-awareness and courage, not weakness." },
  { id: 19, text: "I slept poorly — the whole day is ruined.", type: 'unhelpful', distortion: 'Catastrophising', reframe: "A bad night's sleep is hard. The day can still have good moments." },
  { id: 20, text: "No one at university really likes me.", type: 'unhelpful', distortion: 'Overgeneralisation', reframe: "I may not have connected with everyone — but that doesn't mean no one values me." },

  // ── Helpful (balanced, growth-oriented) ────────────────────────────────
  { id: 21, text: "This is hard, but I've handled hard things before.", type: 'helpful' },
  { id: 22, text: "I don't have to solve everything today.", type: 'helpful' },
  { id: 23, text: "It's okay to ask for help — that's strength, not weakness.", type: 'helpful' },
  { id: 24, text: "My feelings are valid, even if others don't understand.", type: 'helpful' },
  { id: 25, text: "Progress, not perfection.", type: 'helpful' },
  { id: 26, text: "One bad day doesn't cancel all my efforts.", type: 'helpful' },
  { id: 27, text: "I am allowed to rest.", type: 'helpful' },
  { id: 28, text: "What can I control right now?", type: 'helpful' },
  { id: 29, text: "I've got through 100% of my bad days so far.", type: 'helpful' },
  { id: 30, text: "This feeling is temporary — it will pass.", type: 'helpful' },
  { id: 31, text: "I can take it one step at a time.", type: 'helpful' },
  { id: 32, text: "Setbacks are part of growth — they don't define me.", type: 'helpful' },
  { id: 33, text: "I don't need to have everything figured out right now.", type: 'helpful' },
  { id: 34, text: "I am more than my grades or productivity.", type: 'helpful' },
  { id: 35, text: "Other people have overcome similar challenges.", type: 'helpful' },
  { id: 36, text: "Being kind to myself helps me recover faster.", type: 'helpful' },
  { id: 37, text: "I can feel scared and still move forward.", type: 'helpful' },
  { id: 38, text: "What would I say to a friend in my situation?", type: 'helpful' },
  { id: 39, text: "Uncertainty is uncomfortable, but not dangerous.", type: 'helpful' },
  { id: 40, text: "My worth is not determined by how productive I am today.", type: 'helpful' },
];

// Return N random thoughts, balanced helpful/unhelpful
export function getRandomThoughts(n: number): Thought[] {
  const helpful   = THOUGHTS.filter(t => t.type === 'helpful');
  const unhelpful = THOUGHTS.filter(t => t.type === 'unhelpful');
  const half = Math.floor(n / 2);
  const pickRandom = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };
  return [...pickRandom(helpful, half), ...pickRandom(unhelpful, n - half)]
    .sort(() => Math.random() - 0.5);
}

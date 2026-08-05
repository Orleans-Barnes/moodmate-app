import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type JournalToolbarActionId = 'voice' | 'photo' | 'prompt' | 'privacy' | 'more';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface JournalToolbarAction {
  id: JournalToolbarActionId;
  icon: IoniconName;
  activeIcon?: IoniconName;
  accessibilityLabel: string;
}

export const JOURNAL_TOOLBAR_ACTIONS: JournalToolbarAction[] = [
  { id: 'voice', icon: 'mic-outline', accessibilityLabel: 'Voice transcription coming soon' },
  { id: 'photo', icon: 'camera-outline', accessibilityLabel: 'Attach photo' },
  { id: 'prompt', icon: 'sparkles-outline', accessibilityLabel: 'Try another prompt' },
  {
    id: 'privacy',
    icon: 'lock-closed-outline',
    activeIcon: 'lock-closed',
    accessibilityLabel: 'Hide journal on this screen',
  },
  { id: 'more', icon: 'ellipsis-horizontal', accessibilityLabel: 'More journal options' },
];

export function nextPrompt(currentPrompt: string, promptPool: string[]): string {
  if (promptPool.length === 0) return currentPrompt;
  const currentIndex = promptPool.indexOf(currentPrompt);
  return promptPool[(currentIndex + 1) % promptPool.length];
}

export function appendJournalText(currentText: string, insertion: string): string {
  const trimmed = currentText.trimEnd();
  return trimmed ? `${trimmed}\n\n${insertion}` : `${insertion}\n\n`;
}

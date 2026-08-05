export function optimisticVoiceContent(): string {
  return 'Voice note';
}

export function textPromptFromVoiceTranscript(transcript: string): string {
  const body = transcript.trim();
  if (!body) {
    throw new Error('The recording did not contain words we could transcribe. Please try again.');
  }
  return body;
}

export function voiceTranscriptContent(transcript: string): string {
  return `Voice: "${textPromptFromVoiceTranscript(transcript)}"`;
}

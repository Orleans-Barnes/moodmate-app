type RecordingFetchResponse = {
  ok?: boolean;
  status?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let output = '';
  let index = 0;

  for (; index + 2 < bytes.length; index += 3) {
    output += BASE64_ALPHABET[bytes[index] >> 2];
    output += BASE64_ALPHABET[((bytes[index] & 3) << 4) | (bytes[index + 1] >> 4)];
    output += BASE64_ALPHABET[((bytes[index + 1] & 15) << 2) | (bytes[index + 2] >> 6)];
    output += BASE64_ALPHABET[bytes[index + 2] & 63];
  }

  if (index < bytes.length) {
    output += BASE64_ALPHABET[bytes[index] >> 2];
    if (index + 1 < bytes.length) {
      output += BASE64_ALPHABET[((bytes[index] & 3) << 4) | (bytes[index + 1] >> 4)];
      output += BASE64_ALPHABET[(bytes[index + 1] & 15) << 2];
      output += '=';
    } else {
      output += BASE64_ALPHABET[(bytes[index] & 3) << 4];
      output += '==';
    }
  }

  return output;
}

export async function readRecordingUriAsBase64(
  uri: string,
  fetchRecording: (recordingUri: string) => Promise<RecordingFetchResponse> = fetch,
): Promise<string> {
  const response = await fetchRecording(uri);
  if (response.ok === false && response.status && response.status >= 400) {
    throw new Error('Could not read the recording.');
  }
  return arrayBufferToBase64(await response.arrayBuffer());
}

export function voiceRecordingFilename(uri: string): string {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const filename = withoutQuery.split('/').filter(Boolean).pop();
  return filename || 'voice-note.m4a';
}

export function voiceJournalBodyFromTranscript(transcript: string): string {
  const body = transcript.trim();
  if (!body) {
    throw new Error('The recording did not contain words we could transcribe. Please try again.');
  }
  return body;
}

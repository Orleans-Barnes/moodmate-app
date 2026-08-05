import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

function loadTs(relativePath) {
  const sourcePath = new URL(relativePath, import.meta.url);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const require = createRequire(import.meta.url);
  const sandbox = { exports: {}, module: { exports: {} }, require };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(compiled, sandbox, { filename: relativePath });
  return sandbox.module.exports;
}

const voice = loadTs('../src/screens/journal/journalVoiceUtils.ts');
const toolbar = loadTs('../src/screens/journal/journalToolbar.ts');
const aiVoice = loadTs('../src/screens/insights/aiChatVoiceUtils.ts');

const audioBytes = new TextEncoder().encode('audio');
assert.equal(voice.arrayBufferToBase64(audioBytes.buffer), 'YXVkaW8=');
assert.equal(voice.voiceRecordingFilename('file:///cache/recordings/moodmate-voice.m4a?cache=1'), 'moodmate-voice.m4a');
assert.equal(voice.voiceJournalBodyFromTranscript('  I feel calmer now.  '), 'I feel calmer now.');
assert.throws(
  () => voice.voiceJournalBodyFromTranscript('   '),
  /did not contain words/i,
);

assert.equal(toolbar.JOURNAL_TOOLBAR_ACTIONS.map((item) => item.id).join(','), 'voice,photo,prompt,privacy,more');
assert.equal(toolbar.nextPrompt('B', ['A', 'B', 'C']), 'C');
assert.equal(toolbar.nextPrompt('Missing', ['A', 'B', 'C']), 'A');
assert.equal(toolbar.appendJournalText('Existing', 'Prompt'), 'Existing\n\nPrompt');
assert.equal(toolbar.appendJournalText('   ', 'Prompt'), 'Prompt\n\n');

assert.equal(aiVoice.optimisticVoiceContent(), 'Voice note');
assert.equal(aiVoice.voiceTranscriptContent(' I feel calmer now. '), 'Voice: "I feel calmer now."');
assert.equal(aiVoice.textPromptFromVoiceTranscript(' I feel calmer now. '), 'I feel calmer now.');
assert.throws(
  () => aiVoice.textPromptFromVoiceTranscript('   '),
  /did not contain words/i,
);

console.log('journal voice and toolbar helpers: ok');

import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  '../src/screens/counsellor/CounsellorSignupScreen.tsx',
  '../src/screens/counsellor/PeerMentorSignupScreen.tsx',
  '../src/screens/auth/LoginScreen.tsx',
];

const source = files
  .map((file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8'))
  .join('\n');

const ambiguousProviderCopy = [
  'Tell students a bit about your background.',
  'Tell students a bit about yourself.',
  'student wellbeing specialist',
  'why you want to support other students',
];

for (const phrase of ambiguousProviderCopy) {
  assert.equal(source.includes(phrase), false, `provider signup copy should not use ambiguous phrase: ${phrase}`);
}

assert.match(source, /Counsellor email/);
assert.match(source, /Peer Mentor email/);

console.log('role copy consistency: ok');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const sourcePath = new URL('../src/screens/auth/roleAccessMessaging.ts', import.meta.url);
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
vm.runInNewContext(compiled, sandbox, { filename: 'roleAccessMessaging.ts' });

const { resolveRoleAccess } = sandbox.module.exports;

const counsellorPending = resolveRoleAccess('COUNSELLOR', 'STUDENT');
assert.equal(counsellorPending.kind, 'pendingCounsellor');
assert.match(counsellorPending.message, /admin/i);
assert.equal(counsellorPending.primaryLabel, 'Apply to join');
assert.equal(counsellorPending.secondaryLabel, 'Continue as student');

const mentorAcademy = resolveRoleAccess('MENTOR', 'STUDENT');
assert.equal(mentorAcademy.kind, 'continueMentorAcademy');
assert.match(mentorAcademy.message, /Academy/i);
assert.equal(mentorAcademy.primaryLabel, 'Continue Academy');
assert.equal(mentorAcademy.secondaryLabel, 'Continue as student');

const wrongPortal = resolveRoleAccess('COUNSELLOR', 'MENTOR');
assert.equal(wrongPortal.kind, 'wrongPortal');
assert.equal(wrongPortal.targetRole, 'MENTOR');
assert.equal(wrongPortal.targetLabel, 'Peer Mentor');

assert.equal(resolveRoleAccess('MENTOR', 'MENTOR').kind, 'allowed');
assert.equal(resolveRoleAccess('STUDENT', 'COUNSELLOR').kind, 'allowed');
assert.equal(resolveRoleAccess('ADMIN', 'STUDENT').kind, 'adminMismatch');

console.log('role access messaging helpers: ok');

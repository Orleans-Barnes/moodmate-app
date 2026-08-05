import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const sourcePath = new URL('../src/screens/support/supportScheduling.ts', import.meta.url);
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
vm.runInNewContext(compiled, sandbox, { filename: 'supportScheduling.ts' });

const {
  disabledSlotsForDay,
  formatTimeLabel,
  isSameDay,
  isSlotUnavailable,
  slotDateTime,
} = sandbox.module.exports;

const day = new Date('2026-08-04T00:00:00.000Z');
const now = new Date('2026-08-04T08:00:00.000Z').getTime();
const bookedSlots = [
  {
    scheduledAt: '2026-08-04T11:00:00.000Z',
    windowEndsAt: '2026-08-04T11:50:00.000Z',
  },
];

assert.equal(formatTimeLabel('09:00'), '9:00 AM');
assert.equal(formatTimeLabel('13:00'), '1:00 PM');
assert.equal(isSameDay(day, new Date('2026-08-04T23:59:00.000Z')), true);
assert.equal(slotDateTime(day, '09:00').getHours(), 9);
assert.equal(isSlotUnavailable(day, '07:00', bookedSlots, now), true, 'past slots should close');
assert.equal(isSlotUnavailable(day, '11:00', bookedSlots, now), true, 'overlapping slots should close');
assert.equal(isSlotUnavailable(day, '13:00', bookedSlots, now), false, 'open future slots should remain available');

const disabled = disabledSlotsForDay(day, bookedSlots, now);
assert.equal(disabled.has('11:00'), true);
assert.equal(disabled.has('13:00'), false);

console.log('support scheduling helpers: ok');

import type { BookedSlotView } from '@/api/types';

export const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];
export const SESSION_MS = 50 * 60 * 1000;

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function slotDateTime(day: Date, slot: string): Date {
  const scheduledAt = new Date(day);
  const [hh, mm] = slot.split(':').map(Number);
  scheduledAt.setHours(hh, mm, 0, 0);
  return scheduledAt;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatTimeLabel(slot: string): string {
  const [hh, mm] = slot.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${mm.toString().padStart(2, '0')} ${period}`;
}

export function formatApptWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} · ${d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function isSlotUnavailable(
  day: Date,
  slot: string,
  bookedSlots: BookedSlotView[],
  nowMs = Date.now(),
): boolean {
  const candidateStart = slotDateTime(day, slot).getTime();
  const candidateEnd = candidateStart + SESSION_MS;
  if (candidateStart <= nowMs) return true;

  return bookedSlots.some((booked) => {
    const bookedStart = new Date(booked.scheduledAt).getTime();
    const bookedEnd = new Date(booked.windowEndsAt).getTime();
    return candidateStart < bookedEnd && bookedStart < candidateEnd;
  });
}

export function disabledSlotsForDay(day: Date, bookedSlots: BookedSlotView[], nowMs = Date.now()): Set<string> {
  return new Set(TIME_SLOTS.filter((slot) => isSlotUnavailable(day, slot, bookedSlots, nowMs)));
}

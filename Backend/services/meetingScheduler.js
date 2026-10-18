/**
 * meetingScheduler.js
 *
 * Internal meeting slot allocator for the AI Retention Agent.
 *
 * Strategy:
 *  - Look at the next N_DAYS_AHEAD days (default 7).
 *  - For each day, generate 30-minute slots within HR_START – HR_END (24h).
 *  - Skip weekends (Saturday = 6, Sunday = 0).
 *  - A slot is "taken" if a RetentionAction already exists for the same
 *    companyCode + meetingDate + meetingTime with status NOT in [Cancelled].
 *  - Return the first free slot, or null if none found.
 *  - The "reserve" step uses findOneAndUpdate with $setOnInsert to be
 *    concurrency-safe: only one writer wins if two requests race.
 */

import RetentionAction from "../models/RetentionAction.js";

// ─── Configuration (override via .env) ──────────────────────────────────────
const HR_START = process.env.HR_MEETING_START || "09:00"; // 24h HH:MM
const HR_END   = process.env.HR_MEETING_END   || "17:00";
const SLOT_MINS = Number(process.env.HR_SLOT_MINUTES ?? 30);
const N_DAYS_AHEAD = Number(process.env.SCHEDULER_DAYS_AHEAD ?? 7);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** YYYY-MM-DD for a Date object */
function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/** Returns true if date falls on Saturday or Sunday */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Generate all 30-min slot strings between HR_START and HR_END.
 * e.g. ["09:00","09:30","10:00",...,"16:30"]
 */
function generateDaySlots() {
  const slots = [];
  const start = toMinutes(HR_START);
  const end   = toMinutes(HR_END);
  for (let m = start; m + SLOT_MINS <= end; m += SLOT_MINS) {
    slots.push(fromMinutes(m));
  }
  return slots;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Find the next available meeting slot for a company.
 * Returns { meetingDate: "YYYY-MM-DD", meetingTime: "HH:MM" } or null.
 */
export async function findAvailableSlot(companyCode) {
  const sanitized = companyCode.toUpperCase().trim();
  const daySlots = generateDaySlots();
  const today = new Date();

  for (let d = 0; d < N_DAYS_AHEAD; d++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + d);

    if (isWeekend(candidate)) continue;

    const dateStr = toISODate(candidate);

    // Fetch all taken slots for this company on this date
    const taken = await RetentionAction.find({
      companyCode: sanitized,
      meetingDate: dateStr,
      meetingTime: { $nin: ["", null] },
      status: { $nin: ["Cancelled"] },
    })
      .select("meetingTime")
      .lean();

    const takenSet = new Set(taken.map((r) => r.meetingTime));

    for (const slot of daySlots) {
      if (!takenSet.has(slot)) {
        return { meetingDate: dateStr, meetingTime: slot };
      }
    }
  }

  return null; // No free slot in the look-ahead window
}

/**
 * Atomically reserve a slot for a specific employee.
 * Uses a unique compound query to prevent double-booking.
 *
 * Returns the updated RetentionAction document, or null on conflict.
 */
export async function reserveSlot({ employeeId, companyCode, meetingDate, meetingTime, hrUser }) {
  const sanitized = companyCode.toUpperCase().trim();

  // Ensure no other booking already holds this slot (race-safe check)
  const conflicting = await RetentionAction.findOne({
    companyCode: sanitized,
    meetingDate,
    meetingTime,
    status: { $nin: ["Cancelled"] },
    employeeId: { $ne: employeeId },
  }).lean();

  if (conflicting) {
    return null; // Slot taken by another employee
  }

  // Upsert the employee's RetentionAction with the slot details
  const updated = await RetentionAction.findOneAndUpdate(
    {
      employeeId,
      companyCode: sanitized,
    },
    {
      $set: {
        meetingDate,
        meetingTime,
        status: "In Progress",
        assignedHR: hrUser?.fullName || "HR Representative",
        assignedHRId: hrUser?._id || null,
        contactMethod: "Email",
        autoScheduled: true,
        autoScheduledAt: new Date(),
      },
      $push: {
        contactHistory: {
          contactMethod: "Email",
          contactedAt: new Date(),
          contactedBy: hrUser?.fullName || "HR Representative",
          status: "SCHEDULED",
          note: `Auto-scheduled meeting on ${meetingDate} at ${meetingTime} by Retention Agent.`,
        },
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return updated;
}

/**
 * Get all available slots for the next N_DAYS_AHEAD business days for a company.
 * Returns an array of { meetingDate, meetingTime } objects.
 * Useful for the employee "request reschedule" picker.
 */
export async function getAvailableSlots(companyCode, limit = 20) {
  const sanitized = companyCode.toUpperCase().trim();
  const daySlots = generateDaySlots();
  const today = new Date();
  const available = [];

  for (let d = 0; d < N_DAYS_AHEAD && available.length < limit; d++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + d);

    if (isWeekend(candidate)) continue;

    const dateStr = toISODate(candidate);

    const taken = await RetentionAction.find({
      companyCode: sanitized,
      meetingDate: dateStr,
      meetingTime: { $nin: ["", null] },
      status: { $nin: ["Cancelled"] },
    })
      .select("meetingTime")
      .lean();

    const takenSet = new Set(taken.map((r) => r.meetingTime));

    for (const slot of daySlots) {
      if (!takenSet.has(slot) && available.length < limit) {
        available.push({ meetingDate: dateStr, meetingTime: slot });
      }
    }
  }

  return available;
}

export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DEFAULT_SCHEDULE = {
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
};

export const STATIC_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const parseMinutes = (value) => {
  if (!timePattern.test(value || '')) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

export const formatMinutes = (minutes) => {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export const toAmPm = (value) => {
  const minutes = parseMinutes(value);
  if (minutes === null) {
    return value;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;

  return `${String(twelveHour).padStart(2, '0')}:${String(remainder).padStart(2, '0')} ${meridiem}`;
};

export const normalizeSchedule = (schedule = {}) => {
  const workingDays = Array.isArray(schedule.workingDays)
    ? schedule.workingDays.map((item) => String(item).toLowerCase()).filter((item) => WEEK_DAYS.includes(item))
    : DEFAULT_SCHEDULE.workingDays;

  return {
    workingDays: workingDays.length ? Array.from(new Set(workingDays)) : DEFAULT_SCHEDULE.workingDays,
    startTime: schedule.startTime || DEFAULT_SCHEDULE.startTime,
    endTime: schedule.endTime || DEFAULT_SCHEDULE.endTime,
    slotDuration: Number(schedule.slotDuration) || DEFAULT_SCHEDULE.slotDuration,
  };
};

export const getDayName = (date) => {
  const jsDay = new Date(date).getDay();
  const mapped = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return mapped[jsDay];
};

export const isScheduleValid = (schedule) => {
  const normalized = normalizeSchedule(schedule);
  const startMinutes = parseMinutes(normalized.startTime);
  const endMinutes = parseMinutes(normalized.endTime);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  if (normalized.slotDuration < 5) {
    return false;
  }

  return endMinutes > startMinutes;
};

export const buildScheduleSummary = (schedule) => {
  const normalized = normalizeSchedule(schedule);
  const labels = normalized.workingDays.map((day) => day.slice(0, 3).toUpperCase());
  return `${labels.join(', ')} | ${toAmPm(normalized.startTime)} - ${toAmPm(normalized.endTime)} | ${normalized.slotDuration} min`;
};

export const generateSlotsForDate = ({ schedule, date, bookedSlots = [] }) => {
  // Simple-only build: fixed slots (no schedule math) for easy explanation.
  const booked = new Set(bookedSlots);
  return STATIC_SLOTS.filter((slot) => !booked.has(slot));

  const normalized = normalizeSchedule(schedule);
  const dayName = getDayName(date);

  if (!normalized.workingDays.includes(dayName)) {
    return [];
  }

  const startMinutes = parseMinutes(normalized.startTime);
  const endMinutes = parseMinutes(normalized.endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return [];
  }

  const booked = new Set(bookedSlots);
  const slots = [];

  for (let cursor = startMinutes; cursor + normalized.slotDuration <= endMinutes; cursor += normalized.slotDuration) {
    const slot = toAmPm(formatMinutes(cursor));
    if (!booked.has(slot)) {
      slots.push(slot);
    }
  }

  return slots;
};

import mongoose from 'mongoose';

const DEFAULT_SCHEDULE = {
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
};

const timePattern = /^([01]\\d|2[0-3]):([0-5]\\d)$/;

const parseMinutes = (value) => {
  if (!timePattern.test(value || '')) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

const toAmPm = (value) => {
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

const buildScheduleSummary = (schedule) => {
  const workingDays = Array.isArray(schedule?.workingDays) ? schedule.workingDays : DEFAULT_SCHEDULE.workingDays;
  const labels = workingDays.map((day) => String(day).slice(0, 3).toUpperCase());
  const startTime = schedule?.startTime || DEFAULT_SCHEDULE.startTime;
  const endTime = schedule?.endTime || DEFAULT_SCHEDULE.endTime;
  const slotDuration = schedule?.slotDuration || DEFAULT_SCHEDULE.slotDuration;
  return `${labels.join(', ')} | ${toAmPm(startTime)} - ${toAmPm(endTime)} | ${slotDuration} min`;
};

const doctorScheduleSchema = new mongoose.Schema(
  {
    workingDays: {
      type: [String],
      default: DEFAULT_SCHEDULE.workingDays,
    },
    startTime: {
      type: String,
      default: DEFAULT_SCHEDULE.startTime,
    },
    endTime: {
      type: String,
      default: DEFAULT_SCHEDULE.endTime,
    },
    slotDuration: {
      type: Number,
      default: DEFAULT_SCHEDULE.slotDuration,
    },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      default: 0,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      trim: true,
    },
    schedule: {
      type: doctorScheduleSchema,
      default: () => DEFAULT_SCHEDULE,
    },
    image: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

doctorSchema.virtual('scheduleSummary').get(function scheduleSummaryGetter() {
  return buildScheduleSummary(this.schedule);
});

doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;

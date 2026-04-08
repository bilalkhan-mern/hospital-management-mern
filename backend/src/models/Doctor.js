import mongoose from 'mongoose';
import { DEFAULT_SCHEDULE, buildScheduleSummary } from '../utils/schedule.utils.js';

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

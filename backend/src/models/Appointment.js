import mongoose from 'mongoose';

const rescheduleHistorySchema = new mongoose.Schema(
  {
    changedByRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    changedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    fromTimeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    toTimeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    symptoms: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', ''],
      default: '',
    },
    paidAt: {
      type: Date,
    },
    rescheduleHistory: {
      type: [rescheduleHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

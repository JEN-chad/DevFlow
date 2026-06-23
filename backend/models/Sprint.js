import mongoose from 'mongoose';

const SprintSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'COMPLETED'],
      default: 'PLANNED',
      index: true,
    },
    velocity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize performance for analytics and sprint lookups
SprintSchema.index({ projectId: 1, status: 1 });

export const Sprint = mongoose.model('Sprint', SprintSchema);
export default Sprint;

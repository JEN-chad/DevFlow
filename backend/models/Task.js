import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
      default: 'BACKLOG',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    githubIssueNumber: {
      type: Number,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    completedHours: {
      type: Number,
      default: 0,
    },
    storyPoints: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize performance for analytics and Kanban board operations
TaskSchema.index({ projectId: 1, sprintId: 1, status: 1, assignee: 1 });

export const Task = mongoose.model('Task', TaskSchema);
export default Task;

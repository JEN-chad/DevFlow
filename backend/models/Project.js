import mongoose from 'mongoose';

const ProjectMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'VIEWER'],
      default: 'DEVELOPER',
    },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [ProjectMemberSchema],
    repositories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to search projects by members
ProjectSchema.index({ 'members.userId': 1 });

export const Project = mongoose.model('Project', ProjectSchema);
export default Project;

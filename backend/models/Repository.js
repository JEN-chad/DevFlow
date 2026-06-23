import mongoose from 'mongoose';

const RepositorySchema = new mongoose.Schema(
  {
    githubRepoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    starsCount: {
      type: Number,
      default: 0,
    },
    forksCount: {
      type: Number,
      default: 0,
    },
    openIssuesCount: {
      type: Number,
      default: 0,
    },
    contributorsCount: {
      type: Number,
      default: 0,
    },
    contributors: [
      {
        username: { type: String, required: true },
        avatar: { type: String, default: '' },
        contributions: { type: Number, default: 0 },
      },
    ],
    latestCommit: {
      sha: { type: String, default: '' },
      message: { type: String, default: '' },
      authorName: { type: String, default: '' },
      authorAvatar: { type: String, default: '' },
      date: { type: Date },
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Repository = mongoose.model('Repository', RepositorySchema);
export default Repository;

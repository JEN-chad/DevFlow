import mongoose from 'mongoose';

const GitHubIntegrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
});

export const GitHubIntegration = mongoose.model('GitHubIntegration', GitHubIntegrationSchema);
export default GitHubIntegration;

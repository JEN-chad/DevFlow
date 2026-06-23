import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'VIEWER'],
      default: 'DEVELOPER',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', UserSchema);
export default User;

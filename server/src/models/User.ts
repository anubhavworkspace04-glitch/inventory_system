import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);

import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'owner' | 'founder' | 'admin';

export interface IUser extends Document {
  firebaseUid: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}


const userSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['owner', 'founder', 'admin'],
      default: 'owner',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);

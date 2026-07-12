import mongoose, { Schema, Document } from 'mongoose';
import { Role } from '@shared/types';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"], required: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
}, { timestamps: true });

// pre-save hook placeholder for password hashing (implemented in step 3, not here)

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
  }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

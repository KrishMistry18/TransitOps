import mongoose, { Schema, Document } from 'mongoose';
import { DriverStatus } from '@shared/types';

export interface IDriver extends Document {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema({
  name: { type: String },
  licenseNumber: { type: String, required: true, unique: true },
  licenseCategory: { type: String },
  licenseExpiryDate: { type: Date, required: true },
  contactNumber: { type: String },
  safetyScore: { type: Number, min: 0, max: 100, default: 100 },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"], default: "AVAILABLE" },
}, { timestamps: true });

DriverSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const DriverModel = mongoose.model<IDriver>('Driver', DriverSchema);

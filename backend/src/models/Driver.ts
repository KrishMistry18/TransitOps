import mongoose, { Schema } from 'mongoose';
import { Driver } from '@shared/types';

const DriverSchema = new Schema({
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  licenseCategory: { type: String, required: true },
  licenseExpiryDate: { type: Date, required: true },
  contactNumber: { type: String, required: true },
  safetyScore: { type: Number, required: true, default: 100 },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"], required: true },
}, { timestamps: true });

DriverSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const DriverModel = mongoose.model('Driver', DriverSchema);

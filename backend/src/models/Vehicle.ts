import mongoose, { Schema, Document } from 'mongoose';
import { VehicleStatus } from '@shared/types';

export interface IVehicle extends Omit<Document, 'model'> {
  registrationNumber: string;
  name: string;
  model?: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema({
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String },
  model: { type: String },
  type: { type: String },
  maxLoadCapacity: { type: Number, required: true, min: 0 },
  odometer: { type: Number, default: 0, min: 0 },
  acquisitionCost: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"], default: "AVAILABLE" },
  region: { type: String },
}, { timestamps: true });

// Enforce uniqueness via a real database unique index
VehicleSchema.index({ registrationNumber: 1 }, { unique: true });

VehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const VehicleModel = mongoose.model<IVehicle>('Vehicle', VehicleSchema);

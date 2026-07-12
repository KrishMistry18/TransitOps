import mongoose, { Schema, Document } from 'mongoose';
import { TripStatus } from '@shared/types';

export interface ITrip extends Document {
  source: string;
  destination: string;
  vehicle?: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  revenue?: number;
  status: TripStatus;
  dispatchedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema({
  source: { type: String },
  destination: { type: String },
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  driver: { type: Schema.Types.ObjectId, ref: 'Driver', default: null },
  cargoWeight: { type: Number, required: true, min: 0 },
  plannedDistance: { type: Number, required: true, min: 0 },
  actualDistance: { type: Number },
  fuelConsumed: { type: Number },
  revenue: { type: Number, default: 0 },
  status: { type: String, enum: ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"], default: "DRAFT" },
  dispatchedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Partial-style safeguards to prevent double-booking
// at most one DISPATCHED trip per vehicle
TripSchema.index(
  { vehicle: 1 },
  { unique: true, partialFilterExpression: { status: "DISPATCHED" } }
);

// at most one DISPATCHED trip per driver
TripSchema.index(
  { driver: 1 },
  { unique: true, partialFilterExpression: { status: "DISPATCHED" } }
);

TripSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const TripModel = mongoose.model<ITrip>('Trip', TripSchema);

import mongoose, { Schema, Document } from 'mongoose';
import { MaintenanceStatus } from '@shared/types';

export interface IMaintenanceLog extends Document {
  vehicle: mongoose.Types.ObjectId;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceLogSchema = new Schema({
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  description: { type: String },
  cost: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["ACTIVE", "CLOSED"], default: "ACTIVE" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
}, { timestamps: true });

// "at most one ACTIVE MaintenanceLog per vehicle" and "at most one DISPATCHED trip per vehicle/driver" cannot
// be expressed as a native Mongoose unique index (Mongo doesn't support partial filtered uniqueness the way 
// Postgres does without a partial index defined directly via createIndex) — so add real MongoDB partial indexes 
// via schema.index() with a partialFilterExpression

// at most one ACTIVE MaintenanceLog per vehicle
MaintenanceLogSchema.index(
  { vehicle: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);

MaintenanceLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const MaintenanceLogModel = mongoose.model<IMaintenanceLog>('MaintenanceLog', MaintenanceLogSchema);

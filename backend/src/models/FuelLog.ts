import mongoose, { Schema, Document } from 'mongoose';

export interface IFuelLog extends Document {
  vehicle: mongoose.Types.ObjectId;
  trip?: mongoose.Types.ObjectId;
  liters: number;
  cost: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FuelLogSchema = new Schema({
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  trip: { type: Schema.Types.ObjectId, ref: 'Trip' },
  liters: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

FuelLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const FuelLogModel = mongoose.model<IFuelLog>('FuelLog', FuelLogSchema);

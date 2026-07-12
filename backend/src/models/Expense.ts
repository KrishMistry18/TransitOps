import mongoose, { Schema } from 'mongoose';
import { Expense } from '@shared/types';

const ExpenseSchema = new Schema({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: { type: String, enum: ["TOLL", "MAINTENANCE", "OTHER"], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

ExpenseSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const ExpenseModel = mongoose.model('Expense', ExpenseSchema);

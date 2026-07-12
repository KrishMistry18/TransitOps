import mongoose, { Schema, Document } from 'mongoose';
import { ExpenseType } from '@shared/types';

export interface IExpense extends Document {
  vehicle: mongoose.Types.ObjectId;
  type: ExpenseType;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema({
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: { type: String, enum: ["TOLL", "MAINTENANCE", "OTHER"] },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

ExpenseSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema);

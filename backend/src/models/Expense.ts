import mongoose, { Document, Schema } from 'mongoose';
import { localStore } from '../storage/localStore';

export interface IExpense extends Document {
  description: string;
  category: string;
  amount: number;
  date: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  reference?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  description: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'card', 'cheque', 'other'],
    required: true,
  },
  reference: { type: String, trim: true, maxlength: 120 },
  notes: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

expenseSchema.index({ date: -1 });

const ExpenseModel = mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema);

const ExpenseProxy = new Proxy(ExpenseModel, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    const local = (localStore.expenses as any)[prop as string];
    if (local !== undefined) {
      return typeof local === 'function' ? local.bind(localStore.expenses) : local;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default ExpenseProxy as unknown as typeof ExpenseModel;

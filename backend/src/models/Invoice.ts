import mongoose, { Document, Schema } from 'mongoose';
import { localStore } from '../storage/localStore';

export interface IInvoiceItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoicePayment {
  amount: number;
  date: Date;
  method: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  reference?: string;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  client: mongoose.Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  payments: IInvoicePayment[];
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  shippingCompany?: mongoose.Types.ObjectId;
  shippingStatus?: 'pending' | 'shipped' | 'delivered' | 'returned';
  deliveredAt?: Date;
  dueDate?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true },
});

const invoicePaymentSchema = new Schema<IInvoicePayment>({
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true },
  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'card', 'cheque', 'other'],
    required: true,
  },
  reference: { type: String, trim: true },
  notes: { type: String, trim: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0, min: 0 },
    payments: { type: [invoicePaymentSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'cancelled'],
      default: 'draft',
    },
    shippingCompany: { type: Schema.Types.ObjectId, ref: 'ShippingCompany' },
    shippingStatus: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'returned'],
    },
    deliveredAt: { type: Date },
    dueDate: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ 'payments.date': 1 });

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const InvoiceModel = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema);

const InvoiceProxy = new Proxy(InvoiceModel, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    const local = (localStore.invoices as any)[prop as string];
    if (local !== undefined) {
      return typeof local === 'function' ? local.bind(localStore.invoices) : local;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default InvoiceProxy as unknown as typeof InvoiceModel;

import mongoose, { Document, Schema } from 'mongoose';
import { localStore } from '../storage/localStore';

export interface IPurchaseOrderItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IPurchaseOrder extends Document {
  orderNumber: string;
  supplier: string;
  supplierContact?: string;
  items: IPurchaseOrderItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'received';
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true },
});

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    orderNumber: { type: String, unique: true },
    supplier: { type: String, required: true, trim: true },
    supplierContact: { type: String },
    items: [purchaseOrderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'received'],
      default: 'pending',
    },
    notes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.orderNumber = `PO-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const PurchaseOrderModel =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);

const PurchaseOrderProxy = new Proxy(PurchaseOrderModel, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    const local = (localStore.purchaseOrders as any)[prop as string];
    if (local !== undefined) {
      return typeof local === 'function' ? local.bind(localStore.purchaseOrders) : local;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default PurchaseOrderProxy as unknown as typeof PurchaseOrderModel;

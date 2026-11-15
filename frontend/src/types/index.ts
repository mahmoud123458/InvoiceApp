export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  token: string;
}

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  quantity: number;
  price: number;
  lowStockAlert: number;
  category?: string;
  isLowStock?: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  product: string | Product;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: string | Client;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  payments: InvoicePayment[];
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  shippingCompany?: string | ShippingCompany;
  shippingStatus?: 'pending' | 'shipped' | 'delivered' | 'returned';
  deliveredAt?: string;
  dueDate?: string;
  notes?: string;
  createdBy: string | User;
  createdAt: string;
}

export interface InvoicePayment {
  _id: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  reference?: string;
  notes?: string;
  recordedBy: string | User;
}

export interface Expense {
  _id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  reference?: string;
  notes?: string;
  createdBy: string | User;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
}

export interface FinancialSummary {
  from: string;
  to: string;
  totalInvoiced: number;
  collected: number;
  outstanding: number;
  expenses: number;
  netCashFlow: number;
  outstandingInvoices: {
    _id: string;
    invoiceNumber: string;
    clientName: string;
    amountDue: number;
    dueDate: string | null;
  }[];
  cashFlow: { month: string; income: number; expenses: number; net: number }[];
  expenseCategories: { category: string; amount: number }[];
  recentTransactions: FinancialTransaction[];
}

export interface ShippingCompany {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  avgDeliveryDays: number;
  pricePerKg?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ShippingStats {
  company: ShippingCompany;
  stats: {
    totalInvoices: number;
    deliveredInvoices: number;
    deliveryRate: number;
    avgDeliveryDays: number;
  };
}

export interface PurchaseOrderItem {
  product: string | Product;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier: string;
  supplierContact?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'received';
  notes?: string;
  approvedBy?: string | User;
  approvedAt?: string;
  createdBy: string | User;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface DashboardStats {
  byStatus: { _id: string; count: number; total: number }[];
  totalRevenue: number;
}

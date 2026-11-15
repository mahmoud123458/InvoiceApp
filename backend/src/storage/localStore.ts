import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const isVercel = process.env.VERCEL === '1';

export interface LocalDbData {
  users: any[];
  clients: any[];
  products: any[];
  invoices: any[];
  shippingCompanies: any[];
  purchaseOrders: any[];
  expenses: any[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function loadData(): LocalDbData {
  if (isVercel) {
    return getInitialData();
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      const { customerOrders: _customerOrders, notifications: _notifications, ...cleanData } = data;
      return {
        ...cleanData,
        users: cleanData.users || [],
        clients: cleanData.clients || [],
        products: cleanData.products || [],
        invoices: cleanData.invoices || [],
        shippingCompanies: cleanData.shippingCompanies || [],
        purchaseOrders: cleanData.purchaseOrders || [],
        expenses: cleanData.expenses || [],
      };
    } catch {
      // fallback
    }
  }

  const initialData: LocalDbData = getInitialData();
  saveData(initialData);
  return initialData;
}

function saveData(data: LocalDbData): void {
  if (isVercel) return;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getInitialData(): LocalDbData {
  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync('admin123', salt);
  const userPassword = bcrypt.hashSync('user123', salt);

  const adminId = 'usr_admin_01';
  const staffId = 'usr_staff_02';

  const client1Id = 'cli_01';
  const client2Id = 'cli_02';
  const client3Id = 'cli_03';

  const prod1Id = 'prd_01';
  const prod2Id = 'prd_02';
  const prod3Id = 'prd_03';
  const prod4Id = 'prd_04';

  const ship1Id = 'shp_01';
  const ship2Id = 'shp_02';
  const ship3Id = 'shp_03';

  return {
    users: [
      {
        _id: adminId,
        name: 'Admin User',
        email: 'admin@invoices.com',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        _id: staffId,
        name: 'Sales Staff',
        email: 'user@invoices.com',
        password: userPassword,
        role: 'user',
        createdAt: new Date().toISOString(),
      },
    ],
    clients: [
      {
        _id: client1Id,
        name: 'Ahmed Mansour',
        company: 'Mansour Trading Co.',
        email: 'ahmed@mansour.com',
        phone: '+20 100 555 1234',
        address: '45 Nasr City, Cairo, Egypt',
        notes: 'VIP customer, preferred payment net-30.',
        createdAt: new Date().toISOString(),
      },
      {
        _id: client2Id,
        name: 'Sarah Khaled',
        company: 'Nile Creative Agency',
        email: 'sarah@nilecreative.com',
        phone: '+20 111 888 7766',
        address: '12 Zamalek, Cairo, Egypt',
        notes: '',
        createdAt: new Date().toISOString(),
      },
      {
        _id: client3Id,
        name: 'Modern Tech Solutions',
        company: 'MTS Enterprise',
        email: 'procurement@mts.org',
        phone: '+20 122 333 4455',
        address: 'New Cairo Technology Park',
        notes: 'Enterprise account',
        createdAt: new Date().toISOString(),
      },
    ],
    products: [
      {
        _id: prod1Id,
        name: 'Dell XPS 15 Laptop',
        sku: 'DELL-XPS-15',
        description: '15.6 inch 4K OLED, 32GB RAM, 1TB SSD',
        quantity: 15,
        price: 1850.0,
        lowStockAlert: 5,
        category: 'Electronics',
        createdAt: new Date().toISOString(),
      },
      {
        _id: prod2Id,
        name: 'Logitech MX Master 3S',
        sku: 'LOGI-MX3S',
        description: 'Ergonomic wireless productivity mouse',
        quantity: 45,
        price: 99.0,
        lowStockAlert: 10,
        category: 'Accessories',
        createdAt: new Date().toISOString(),
      },
      {
        _id: prod3Id,
        name: 'Keychron Q1 Pro Mechanical Keyboard',
        sku: 'KEY-Q1-PRO',
        description: 'Custom wireless mechanical keyboard',
        quantity: 4,
        price: 199.0,
        lowStockAlert: 8,
        category: 'Accessories',
        createdAt: new Date().toISOString(),
      },
      {
        _id: prod4Id,
        name: 'LG UltraFine 27" 4K Monitor',
        sku: 'LG-27-4K',
        description: 'IPS display with USB-C 90W PD',
        quantity: 12,
        price: 499.0,
        lowStockAlert: 5,
        category: 'Monitors',
        createdAt: new Date().toISOString(),
      },
    ],
    shippingCompanies: [
      {
        _id: ship1Id,
        name: 'Aramex Express',
        phone: '+20 2 3338 9700',
        email: 'support@aramex.com',
        address: 'Cairo Logistics Hub, Egypt',
        avgDeliveryDays: 2,
        pricePerKg: 3.5,
        notes: 'Next-day delivery inside major metropolitan zones.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: ship2Id,
        name: 'DHL Global Express',
        phone: '+20 2 16345',
        email: 'express@dhl.com',
        address: 'Cairo Airport Cargo Village',
        avgDeliveryDays: 1,
        pricePerKg: 6.0,
        notes: 'Priority express international & domestic shipping.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: ship3Id,
        name: 'Bosta Delivery',
        phone: '+20 109 999 8888',
        email: 'hello@bosta.co',
        address: 'Smart Village, Giza',
        avgDeliveryDays: 3,
        pricePerKg: 2.5,
        notes: 'E-commerce and cash-on-delivery specialist.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ],
    invoices: [
      {
        _id: 'inv_01',
        invoiceNumber: 'INV-00001',
        client: client1Id,
        items: [
          {
            product: prod1Id,
            productName: 'Dell XPS 15 Laptop',
            quantity: 2,
            unitPrice: 1850,
            total: 3700,
          },
          {
            product: prod2Id,
            productName: 'Logitech MX Master 3S',
            quantity: 2,
            unitPrice: 99,
            total: 198,
          },
        ],
        subtotal: 3898,
        tax: 14,
        discount: 100,
        total: 3898 + (3898 * 14) / 100 - 100,
        status: 'paid',
        shippingCompany: ship1Id,
        shippingStatus: 'delivered',
        deliveredAt: new Date().toISOString(),
        createdBy: adminId,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        _id: 'inv_02',
        invoiceNumber: 'INV-00002',
        client: client2Id,
        items: [
          {
            product: prod4Id,
            productName: 'LG UltraFine 27" 4K Monitor',
            quantity: 1,
            unitPrice: 499,
            total: 499,
          },
          {
            product: prod3Id,
            productName: 'Keychron Q1 Pro Mechanical Keyboard',
            quantity: 1,
            unitPrice: 199,
            total: 199,
          },
        ],
        subtotal: 698,
        tax: 14,
        discount: 0,
        total: 698 + (698 * 14) / 100,
        status: 'sent',
        shippingCompany: ship2Id,
        shippingStatus: 'shipped',
        createdBy: staffId,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    purchaseOrders: [
      {
        _id: 'po_01',
        orderNumber: 'PO-00001',
        supplier: 'TechSource Global Ltd.',
        supplierContact: 'sales@techsource.com / +1 800 555 0199',
        items: [
          {
            product: prod3Id,
            productName: 'Keychron Q1 Pro Mechanical Keyboard',
            quantity: 20,
            unitPrice: 130,
            total: 2600,
          },
          {
            product: prod2Id,
            productName: 'Logitech MX Master 3S',
            quantity: 30,
            unitPrice: 65,
            total: 1950,
          },
        ],
        subtotal: 4550,
        total: 4550,
        status: 'pending',
        notes: 'Urgent restocking order for upcoming month.',
        createdBy: staffId,
        createdAt: new Date().toISOString(),
      },
    ],
    expenses: [],
  };
}

let currentDb = loadData();
let migratedFinanceData = false;
for (const invoice of currentDb.invoices) {
  if (!Array.isArray(invoice.payments)) {
    invoice.payments = [];
    migratedFinanceData = true;
  }
  if (!Number.isFinite(invoice.paidAmount)) {
    invoice.paidAmount = invoice.status === 'paid'
      ? Number(invoice.total) || 0
      : invoice.payments.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);
    migratedFinanceData = true;
  }
}
if (migratedFinanceData) saveData(currentDb);

export const localStore = {
  getDb(): LocalDbData {
    return currentDb;
  },
  removeClientPortalData(): void {
    currentDb.users = currentDb.users
      .filter((user) => user.role !== 'client')
      .map(({ clientId: _clientId, ...user }) => user);
    saveData(currentDb);
  },
  save(): void {
    saveData(currentDb);
  },

  // USERS
  users: {
    async findOne(filter: { email?: string; _id?: string }) {
      const user = currentDb.users.find((u) => {
        if (filter.email && u.email.toLowerCase() === filter.email.toLowerCase()) return true;
        if (filter._id && u._id === filter._id) return true;
        return false;
      });
      if (!user) return null;
      return {
        ...user,
        async comparePassword(pass: string) {
          return bcrypt.compare(pass, user.password);
        },
      };
    },
    find(filter: { role?: string } = {}) {
      let list = [...currentDb.users];
      if (filter.role) list = list.filter((user) => user.role === filter.role);
      const queryObj = {
        select() {
          return queryObj;
        },
        sort() {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          const safeUsers = list.map(({ password, ...user }) => user);
          return Promise.resolve(safeUsers).then(resolve, reject);
        },
      };
      return queryObj;
    },
    findById(id: string) {
      const user = currentDb.users.find((u) => u._id === id);
      const userObj = user
        ? {
            ...user,
            select(exclude: string) {
              if (exclude === '-password') {
                const { password, ...rest } = user;
                return rest;
              }
              return user;
            },
          }
        : null;

      return {
        select(exclude: string) {
          if (!user) return Promise.resolve(null);
          if (exclude === '-password') {
            const { password, ...rest } = user;
            return Promise.resolve(rest);
          }
          return Promise.resolve(user);
        },
        then(resolve: any, reject?: any) {
          return Promise.resolve(userObj).then(resolve, reject);
        },
      };
    },
    async create(data: any) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(data.password, salt);
      const newUser = {
        _id: generateId(),
        ...data,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      currentDb.users.push(newUser);
      saveData(currentDb);
      return newUser;
    },
    async countDocuments(filter: { role?: string } = {}) {
      return filter.role
        ? currentDb.users.filter((user) => user.role === filter.role).length
        : currentDb.users.length;
    },
    async findByIdAndUpdate(id: string, data: any) {
      const user = currentDb.users.find((item) => item._id === id);
      if (!user) return null;
      Object.assign(user, data.$set || data);
      if (data.$unset) {
        for (const key of Object.keys(data.$unset)) delete user[key];
      }
      saveData(currentDb);
      return user;
    },
    async findByIdAndDelete(id: string) {
      const index = currentDb.users.findIndex((user) => user._id === id);
      if (index === -1) return null;
      const [removed] = currentDb.users.splice(index, 1);
      saveData(currentDb);
      return removed;
    },
  },

  // CLIENTS
  clients: {
    async findOne(filter: { email?: string; _id?: string }) {
      return currentDb.clients.find((client) => {
        if (filter.email && client.email?.toLowerCase() === filter.email.toLowerCase()) return true;
        if (filter._id && client._id === filter._id) return true;
        return false;
      }) || null;
    },
    find(query: any = {}) {
      let list = [...currentDb.clients];
      if (query.$or && query.$or.length > 0) {
        const regexVal = query.$or[0]?.name?.$regex || '';
        const term = (typeof regexVal === 'string' ? regexVal : '').toLowerCase();
        if (term) {
          list = list.filter(
            (c) =>
              (c.name && c.name.toLowerCase().includes(term)) ||
              (c.email && c.email.toLowerCase().includes(term)) ||
              (c.phone && c.phone.includes(term))
          );
        }
      }

      const queryObj = {
        sort(_opts: any) {
          list.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          return Promise.resolve(list).then(resolve, reject);
        },
      };
      return queryObj;
    },
    async findById(id: string) {
      return currentDb.clients.find((c) => c._id === id) || null;
    },
    async create(data: any) {
      const newClient = {
        _id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      currentDb.clients.push(newClient);
      saveData(currentDb);
      return newClient;
    },
    async findByIdAndUpdate(id: string, data: any) {
      const idx = currentDb.clients.findIndex((c) => c._id === id);
      if (idx === -1) return null;
      currentDb.clients[idx] = { ...currentDb.clients[idx], ...data };
      saveData(currentDb);
      return currentDb.clients[idx];
    },
    async findByIdAndDelete(id: string) {
      const idx = currentDb.clients.findIndex((c) => c._id === id);
      if (idx === -1) return null;
      const removed = currentDb.clients.splice(idx, 1)[0];
      saveData(currentDb);
      return removed;
    },
  },

  // PRODUCTS
  products: {
    find(query: any = {}) {
      let list = [...currentDb.products];
      if (query.$or && query.$or.length > 0) {
        const regexVal = query.$or[0]?.name?.$regex || '';
        const term = (typeof regexVal === 'string' ? regexVal : '').toLowerCase();
        if (term) {
          list = list.filter(
            (p) =>
              (p.name && p.name.toLowerCase().includes(term)) ||
              (p.sku && p.sku.toLowerCase().includes(term))
          );
        }
      }

      const wrapList = list.map((p) => ({
        ...p,
        toObject() {
          return { ...p };
        },
      }));

      const queryObj = {
        sort(_opts: any) {
          wrapList.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          return Promise.resolve(wrapList).then(resolve, reject);
        },
      };
      return queryObj;
    },
    async findById(id: string) {
      return currentDb.products.find((p) => p._id === id) || null;
    },
    async create(data: any) {
      const newProduct = {
        _id: generateId(),
        ...data,
        quantity: Number(data.quantity) || 0,
        price: Number(data.price) || 0,
        lowStockAlert: Number(data.lowStockAlert) || 10,
        createdAt: new Date().toISOString(),
      };
      currentDb.products.push(newProduct);
      saveData(currentDb);
      return newProduct;
    },
    async findByIdAndUpdate(id: string, data: any) {
      const idx = currentDb.products.findIndex((p) => p._id === id);
      if (idx === -1) return null;

      let updated = { ...currentDb.products[idx] };
      if (data.$inc) {
        for (const [key, val] of Object.entries(data.$inc)) {
          updated[key] = (Number(updated[key]) || 0) + Number(val);
        }
      }
      for (const [key, val] of Object.entries(data)) {
        if (key !== '$inc') updated[key] = val;
      }

      currentDb.products[idx] = updated;
      saveData(currentDb);
      return updated;
    },
    async findOneAndUpdate(filter: any, data: any) {
      const product = currentDb.products.find((item) =>
        item._id === String(filter._id) && item.quantity >= Number(filter.quantity?.$gte ?? 0)
      );
      if (!product) return null;
      for (const [key, value] of Object.entries(data.$inc || {})) {
        product[key] = (Number(product[key]) || 0) + Number(value);
      }
      saveData(currentDb);
      return product;
    },
    async findByIdAndDelete(id: string) {
      const idx = currentDb.products.findIndex((p) => p._id === id);
      if (idx === -1) return null;
      const removed = currentDb.products.splice(idx, 1)[0];
      saveData(currentDb);
      return removed;
    },
  },

  // SHIPPING COMPANIES
  shippingCompanies: {
    find(query: any = {}) {
      let list = [...currentDb.shippingCompanies];
      if (query.isActive !== undefined) {
        list = list.filter((s) => s.isActive === query.isActive);
      }
      const queryObj = {
        sort(_opts: any) {
          list.sort((a, b) => a.name.localeCompare(b.name));
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          return Promise.resolve(list).then(resolve, reject);
        },
      };
      return queryObj;
    },
    async findById(id: string) {
      return currentDb.shippingCompanies.find((s) => s._id === id) || null;
    },
    async create(data: any) {
      const newCompany = {
        _id: generateId(),
        ...data,
        avgDeliveryDays: Number(data.avgDeliveryDays) || 3,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      currentDb.shippingCompanies.push(newCompany);
      saveData(currentDb);
      return newCompany;
    },
    async findByIdAndUpdate(id: string, data: any) {
      const idx = currentDb.shippingCompanies.findIndex((s) => s._id === id);
      if (idx === -1) return null;
      currentDb.shippingCompanies[idx] = { ...currentDb.shippingCompanies[idx], ...data };
      saveData(currentDb);
      return currentDb.shippingCompanies[idx];
    },
  },

  // INVOICES
  invoices: {
    find(query: any = {}) {
      let list = [...currentDb.invoices];
      if (query.status) list = list.filter((i) => i.status === query.status);
      if (query.client) list = list.filter((i) => i.client === query.client);
      if (Array.isArray(query.$or)) {
        list = list.filter((invoice) => query.$or.some((clause: any) => {
          if (clause.status === 'sent' && invoice.status !== 'sent') return false;
          if (clause.status?.$ne && invoice.status === clause.status.$ne) return false;
          if (clause.createdAt) {
            const createdAt = new Date(invoice.createdAt).getTime();
            if (createdAt < new Date(clause.createdAt.$gte).getTime()
              || createdAt > new Date(clause.createdAt.$lte).getTime()) return false;
          }
          if (clause['payments.date']) {
            const from = new Date(clause['payments.date'].$gte).getTime();
            const to = new Date(clause['payments.date'].$lte).getTime();
            const hasPaymentInRange = (invoice.payments || []).some((payment: any) => {
              const date = new Date(payment.date).getTime();
              return date >= from && date <= to;
            });
            if (!hasPaymentInRange) return false;
          }
          return true;
        }));
      }

      const queryObj = {
        populate(_f: string, _s?: string) {
          return queryObj;
        },
        select(_fields: string) {
          return queryObj;
        },
        lean() {
          return queryObj;
        },
        sort(_opts: any) {
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          const populated = list
            .map((inv) => populateInvoice(inv))
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          return Promise.resolve(populated).then(resolve, reject);
        },
      };
      return queryObj;
    },
    findById(id: string) {
      const inv = currentDb.invoices.find((i) => i._id === id);
      const populated = inv ? populateInvoice(inv) : null;

      const queryObj = {
        populate(_f: any, _s?: any) {
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          return Promise.resolve(populated).then(resolve, reject);
        },
      };
      return queryObj;
    },
    async create(data: any) {
      const count = currentDb.invoices.length + 1;
      const invoiceNumber = `INV-${String(count).padStart(5, '0')}`;
      const newInvoice = {
        _id: generateId(),
        invoiceNumber,
        ...data,
        createdAt: new Date().toISOString(),
      };
      currentDb.invoices.push(newInvoice);
      saveData(currentDb);
      const populated = populateInvoice(newInvoice);
      return {
        ...populated,
        populate(_opts: any) {
          return Promise.resolve(populated);
        },
      };
    },
    async findByIdAndUpdate(id: string, data: any) {
      const idx = currentDb.invoices.findIndex((i) => i._id === id);
      if (idx === -1) return null;
      currentDb.invoices[idx] = { ...currentDb.invoices[idx], ...data };
      saveData(currentDb);
      const populated = populateInvoice(currentDb.invoices[idx]);
      return {
        ...populated,
        populate(_opts: any) {
          return Promise.resolve(populated);
        },
      };
    },
    async findOneAndUpdate(filter: any, update: any) {
      const invoice = currentDb.invoices.find((item) => item._id === String(filter._id));
      if (!invoice) return null;
      if (update.$set && !update.$inc) {
        Object.assign(invoice, update.$set);
        saveData(currentDb);
        const populated = populateInvoice(invoice);
        return {
          ...populated,
          populate(_opts: any) {
            return Promise.resolve(populated);
          },
        };
      }
      if (invoice.status === 'cancelled' || invoice.status === 'draft') return null;
      const amount = Number(update.$inc?.paidAmount);
      if (!Number.isFinite(amount) || amount <= 0 || (Number(invoice.paidAmount) || 0) + amount > Number(invoice.total)) {
        return null;
      }
      invoice.paidAmount = (Number(invoice.paidAmount) || 0) + amount;
      invoice.payments = [...(invoice.payments || []), ...(update.$push?.payments ? [update.$push.payments] : [])];
      invoice.status = invoice.paidAmount >= Number(invoice.total) ? 'paid' : 'sent';
      saveData(currentDb);
      const populated = populateInvoice(invoice);
      return {
        ...populated,
        populate(_opts: any) {
          return Promise.resolve(populated);
        },
      };
    },
    async findByIdAndDelete(id: string) {
      const idx = currentDb.invoices.findIndex((i) => i._id === id);
      if (idx === -1) return null;
      const removed = currentDb.invoices.splice(idx, 1)[0];
      saveData(currentDb);
      return removed;
    },
    async countDocuments(query: any = {}) {
      let list = currentDb.invoices;
      if (query.shippingCompany) {
        list = list.filter((i) => i.shippingCompany === query.shippingCompany);
      }
      if (query.shippingStatus) {
        list = list.filter((i) => i.shippingStatus === query.shippingStatus);
      }
      return list.length;
    },
    async aggregate(pipeline: any[]) {
      const matchStage = pipeline.find((p) => p.$match);
      let list = currentDb.invoices;
      if (matchStage) {
        if (matchStage.$match.status) {
          list = list.filter((i) => i.status === matchStage.$match.status);
        }
      }

      const groupStage = pipeline.find((p) => p.$group);
      if (groupStage) {
        if (groupStage.$group._id === '$status') {
          const map: Record<string, { count: number; total: number }> = {};
          for (const inv of list) {
            if (!map[inv.status]) map[inv.status] = { count: 0, total: 0 };
            map[inv.status].count += 1;
            map[inv.status].total += inv.total || 0;
          }
          return Object.entries(map).map(([_id, val]) => ({
            _id,
            count: val.count,
            total: val.total,
          }));
        }
        if (groupStage.$group._id === null) {
          const total = list.reduce((s, it) => s + (it.total || 0), 0);
          return [{ _id: null, total }];
        }
      }
      return [];
    },
  },

  // PURCHASE ORDERS
  purchaseOrders: {
    find(query: any = {}) {
      let list = [...currentDb.purchaseOrders];
      if (query.status) list = list.filter((p) => p.status === query.status);

      const queryObj = {
        populate(_f: string, _s?: string) {
          return queryObj;
        },
        sort(_opts: any) {
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          const populated = list
            .map((po) => populatePurchaseOrder(po))
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          return Promise.resolve(populated).then(resolve, reject);
        },
      };
      return queryObj;
    },
    findById(id: string) {
      const po = currentDb.purchaseOrders.find((p) => p._id === id);
      const populated = po ? populatePurchaseOrder(po) : null;

      const queryObj = {
        populate(_f: any) {
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          if (!populated) return Promise.resolve(null).then(resolve, reject);
          return Promise.resolve({
            ...populated,
            async save() {
              const idx = currentDb.purchaseOrders.findIndex((p) => p._id === id);
              if (idx !== -1) {
                currentDb.purchaseOrders[idx] = { ...currentDb.purchaseOrders[idx], ...po };
                saveData(currentDb);
              }
            },
          }).then(resolve, reject);
        },
      };
      return queryObj;
    },
    async create(data: any) {
      const count = currentDb.purchaseOrders.length + 1;
      const orderNumber = `PO-${String(count).padStart(5, '0')}`;
      const newPo = {
        _id: generateId(),
        orderNumber,
        ...data,
        createdAt: new Date().toISOString(),
      };
      currentDb.purchaseOrders.push(newPo);
      saveData(currentDb);
      return newPo;
    },
    async findByIdAndUpdate(id: string, data: any) {
      const idx = currentDb.purchaseOrders.findIndex((p) => p._id === id);
      if (idx === -1) return null;
      currentDb.purchaseOrders[idx] = { ...currentDb.purchaseOrders[idx], ...data };
      saveData(currentDb);
      return currentDb.purchaseOrders[idx];
    },
  },

  // EXPENSES
  expenses: {
    find(query: any = {}) {
      let list = [...currentDb.expenses];
      if (query.category) list = list.filter((expense) => expense.category === query.category);
      if (query.date?.$gte) list = list.filter((expense) => new Date(expense.date) >= new Date(query.date.$gte));
      if (query.date?.$lte) list = list.filter((expense) => new Date(expense.date) <= new Date(query.date.$lte));

      const queryObj = {
        populate(_field: string, _selection?: string) {
          return queryObj;
        },
        select(_fields: string) {
          return queryObj;
        },
        lean() {
          return queryObj;
        },
        sort(_options: any) {
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return queryObj;
        },
        then(resolve: any, reject?: any) {
          return Promise.resolve(list.map(populateExpense)).then(resolve, reject);
        },
      };
      return queryObj;
    },
    async create(data: any) {
      const expense = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
      currentDb.expenses.push(expense);
      saveData(currentDb);
      return expense;
    },
    async findByIdAndUpdate(id: string, data: any) {
      const index = currentDb.expenses.findIndex((expense) => expense._id === id);
      if (index === -1) return null;
      currentDb.expenses[index] = { ...currentDb.expenses[index], ...data };
      saveData(currentDb);
      return populateExpense(currentDb.expenses[index]);
    },
    async findByIdAndDelete(id: string) {
      const index = currentDb.expenses.findIndex((expense) => expense._id === id);
      if (index === -1) return null;
      const [expense] = currentDb.expenses.splice(index, 1);
      saveData(currentDb);
      return expense;
    },
  },

};

function populateInvoice(inv: any) {
  const client = currentDb.clients.find((c) => c._id === inv.client);
  const shippingCompany = currentDb.shippingCompanies.find(
    (s) => s._id === inv.shippingCompany
  );
  const createdBy = currentDb.users.find((u) => u._id === inv.createdBy);

  const populatedItems = (inv.items || []).map((it: any) => {
    const product = currentDb.products.find((p) => p._id === it.product);
    return {
      ...it,
      product: product || it.product,
    };
  });

  return {
    ...inv,
    client: client || inv.client,
    shippingCompany: shippingCompany || inv.shippingCompany,
    createdBy: createdBy ? { _id: createdBy._id, name: createdBy.name } : inv.createdBy,
    items: populatedItems,
  };
}

function populatePurchaseOrder(po: any) {
  const createdBy = currentDb.users.find((u) => u._id === po.createdBy);
  const approvedBy = currentDb.users.find((u) => u._id === po.approvedBy);
  const items = (po.items || []).map((it: any) => {
    const product = currentDb.products.find((p) => p._id === it.product);
    return { ...it, product: product || it.product };
  });

  return {
    ...po,
    createdBy: createdBy ? { _id: createdBy._id, name: createdBy.name } : po.createdBy,
    approvedBy: approvedBy ? { _id: approvedBy._id, name: approvedBy.name } : po.approvedBy,
    items,
  };
}

function populateExpense(expense: any) {
  const creator = currentDb.users.find((user) => user._id === expense.createdBy);
  return {
    ...expense,
    createdBy: creator ? { _id: creator._id, name: creator.name } : expense.createdBy,
  };
}

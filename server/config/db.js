import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DB_PATH = path.join(__dirname, '../data/local_db.json');
const SEED_DATA_PATH = path.join(__dirname, '../data/seedData.json');

// Mongoose Schemas (used if MongoDB connects successfully)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'shopkeeper', 'delivery', 'admin'], default: 'customer' },
  phone: String,
  storeId: mongoose.Schema.Types.ObjectId, // for shopkeepers
  createdAt: { type: Date, default: Date.now }
});

const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address: String,
  location: { lat: Number, lng: Number },
  rating: { type: Number, default: 4.5 },
  image: String,
  deliveryFee: { type: Number, default: 40 }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: Number, // base price
  category: String,
  image: String,
  unit: { type: String, default: 'piece' }
});

const InventorySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  price: Number, // store specific price
  stock: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true }
});

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    status: { type: String, default: 'pending' } // pending, prepared, out_for_delivery
  }],
  subtotal: Number,
  deliveryFee: Number,
  taxes: Number,
  total: Number,
  status: { type: String, enum: ['pending', 'accepted', 'prepared', 'picked_up', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, default: 'cod' },
  paymentStatus: { type: String, default: 'pending' },
  shippingAddress: String,
  isOptimized: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, default: 0 },
  escrowBalance: { type: Number, default: 0 },
  transactions: [{
    amount: Number,
    type: { type: String, enum: ['deposit', 'withdrawal', 'earning', 'escrow_hold', 'escrow_release'] },
    description: String,
    date: { type: Date, default: Date.now }
  }]
});

// Compile Models
let Models = {};
let useMongoDB = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log("⚠️ MONGODB_URI not found in environment. Initializing local JSON fallback database...");
    setupLocalDB();
    return false;
  }
  
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected Successfully!");
    Models = {
      User: mongoose.model('User', UserSchema),
      Store: mongoose.model('Store', StoreSchema),
      Product: mongoose.model('Product', ProductSchema),
      Inventory: mongoose.model('Inventory', InventorySchema),
      Order: mongoose.model('Order', OrderSchema),
      Wallet: mongoose.model('Wallet', WalletSchema)
    };
    useMongoDB = true;
    return true;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.log("⚠️ Falling back to local JSON database...");
    setupLocalDB();
    return false;
  }
};

// Local JSON DB Engine
let localData = {
  users: [],
  stores: [],
  products: [],
  inventory: [],
  orders: [],
  wallets: []
};

const setupLocalDB = () => {
  useMongoDB = false;
  
  // Make sure directories exist
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load Seed data or Local Database
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      localData = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
      console.log("📂 Local Database loaded from disk.");
      return;
    } catch (e) {
      console.error("Error reading local db file, re-initializing:", e);
    }
  }

  // Fallback to seed data
  if (fs.existsSync(SEED_DATA_PATH)) {
    try {
      localData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf8'));
      console.log("📂 Local Database initialized from seedData.json.");
      saveLocalData();
      return;
    } catch (e) {
      console.error("Error parsing seed data:", e);
    }
  }

  console.log("📂 Local Database created with empty structure.");
  saveLocalData();
};

const saveLocalData = () => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localData, null, 2), 'utf8');
  } catch (e) {
    console.error("Error writing to local database file:", e);
  }
};

// Helper to generate custom MongoDB-like ObjectIDs
export const generateId = () => {
  return new mongoose.Types.ObjectId().toString();
};

// Unified Database CRUD API Interface
export const db = {
  users: {
    find: async (query = {}) => {
      if (useMongoDB) return Models.User.find(query).lean();
      return localData.users.filter(u => matchQuery(u, query));
    },
    findOne: async (query = {}) => {
      if (useMongoDB) return Models.User.findOne(query).lean();
      return localData.users.find(u => matchQuery(u, query)) || null;
    },
    findById: async (id) => {
      if (useMongoDB) return Models.User.findById(id).lean();
      return localData.users.find(u => u._id === id.toString()) || null;
    },
    create: async (data) => {
      if (useMongoDB) {
        const u = await Models.User.create(data);
        return u.toObject();
      }
      const newUser = { _id: generateId(), createdAt: new Date(), ...data };
      localData.users.push(newUser);
      saveLocalData();
      return newUser;
    },
    updateOne: async (query, update) => {
      if (useMongoDB) return Models.User.updateOne(query, update);
      const user = localData.users.find(u => matchQuery(u, query));
      if (user) {
        Object.assign(user, update.$set || update);
        saveLocalData();
        return { nModified: 1 };
      }
      return { nModified: 0 };
    }
  },
  stores: {
    find: async (query = {}) => {
      if (useMongoDB) return Models.Store.find(query).lean();
      return localData.stores.filter(s => matchQuery(s, query));
    },
    findById: async (id) => {
      if (useMongoDB) return Models.Store.findById(id).lean();
      return localData.stores.find(s => s._id === id.toString()) || null;
    },
    create: async (data) => {
      if (useMongoDB) {
        const s = await Models.Store.create(data);
        return s.toObject();
      }
      const newStore = { _id: generateId(), ...data };
      localData.stores.push(newStore);
      saveLocalData();
      return newStore;
    }
  },
  products: {
    find: async (query = {}) => {
      if (useMongoDB) return Models.Product.find(query).lean();
      return localData.products.filter(p => matchQuery(p, query));
    },
    findById: async (id) => {
      if (useMongoDB) return Models.Product.findById(id).lean();
      return localData.products.find(p => p._id === id.toString()) || null;
    },
    create: async (data) => {
      if (useMongoDB) {
        const p = await Models.Product.create(data);
        return p.toObject();
      }
      const newProduct = { _id: generateId(), ...data };
      localData.products.push(newProduct);
      saveLocalData();
      return newProduct;
    }
  },
  inventory: {
    find: async (query = {}) => {
      if (useMongoDB) return Models.Inventory.find(query).populate('productId').lean();
      const results = localData.inventory.filter(i => matchQuery(i, query));
      // Populate productId
      return results.map(item => {
        const prod = localData.products.find(p => p._id === item.productId);
        return { ...item, productId: prod || item.productId };
      });
    },
    findOne: async (query = {}) => {
      if (useMongoDB) return Models.Inventory.findOne(query).populate('productId').lean();
      const item = localData.inventory.find(i => matchQuery(i, query));
      if (!item) return null;
      const prod = localData.products.find(p => p._id === item.productId);
      return { ...item, productId: prod || item.productId };
    },
    create: async (data) => {
      if (useMongoDB) {
        const i = await Models.Inventory.create(data);
        return i.toObject();
      }
      const newItem = { _id: generateId(), ...data };
      localData.inventory.push(newItem);
      saveLocalData();
      return newItem;
    },
    updateOne: async (query, update) => {
      if (useMongoDB) return Models.Inventory.updateOne(query, update);
      const item = localData.inventory.find(i => matchQuery(i, query));
      if (item) {
        Object.assign(item, update.$set || update);
        saveLocalData();
        return { nModified: 1 };
      }
      return { nModified: 0 };
    }
  },
  orders: {
    find: async (query = {}) => {
      if (useMongoDB) return Models.Order.find(query).sort({ createdAt: -1 }).lean();
      // sort local orders by createdAt desc
      const results = localData.orders.filter(o => matchQuery(o, query));
      return results.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    findById: async (id) => {
      if (useMongoDB) return Models.Order.findById(id).lean();
      return localData.orders.find(o => o._id === id.toString()) || null;
    },
    create: async (data) => {
      if (useMongoDB) {
        const o = await Models.Order.create(data);
        return o.toObject();
      }
      const newOrder = { _id: generateId(), createdAt: new Date().toISOString(), status: 'pending', ...data };
      localData.orders.push(newOrder);
      saveLocalData();
      return newOrder;
    },
    updateOne: async (query, update) => {
      if (useMongoDB) return Models.Order.updateOne(query, update);
      const order = localData.orders.find(o => matchQuery(o, query));
      if (order) {
        Object.assign(order, update.$set || update);
        saveLocalData();
        return { nModified: 1, order };
      }
      return { nModified: 0 };
    }
  },
  wallets: {
    findOne: async (query = {}) => {
      if (useMongoDB) return Models.Wallet.findOne(query).lean();
      return localData.wallets.find(w => matchQuery(w, query)) || null;
    },
    create: async (data) => {
      if (useMongoDB) {
        const w = await Models.Wallet.create(data);
        return w.toObject();
      }
      const newWallet = { _id: generateId(), balance: 0, escrowBalance: 0, transactions: [], ...data };
      localData.wallets.push(newWallet);
      saveLocalData();
      return newWallet;
    },
    updateOne: async (query, update) => {
      if (useMongoDB) return Models.Wallet.updateOne(query, update);
      const wallet = localData.wallets.find(w => matchQuery(w, query));
      if (wallet) {
        Object.assign(wallet, update.$set || update);
        saveLocalData();
        return { nModified: 1 };
      }
      return { nModified: 0 };
    }
  }
};

// Internal query matcher to emulate basic MongoDB queries
function matchQuery(doc, query) {
  for (const key in query) {
    let queryVal = query[key];
    let docVal = doc[key];
    
    // convert mongoose objects ids to strings for comparison
    if (queryVal && typeof queryVal === 'object' && queryVal._bsontype === 'ObjectID') {
      queryVal = queryVal.toString();
    }
    if (docVal && typeof docVal === 'object' && docVal._bsontype === 'ObjectID') {
      docVal = docVal.toString();
    }

    if (queryVal && typeof queryVal === 'object' && ('$ne' in queryVal || '$in' in queryVal)) {
      if ('$ne' in queryVal) {
        if (docVal === queryVal.$ne) return false;
      }
      if ('$in' in queryVal) {
        if (!queryVal.$in.includes(docVal)) return false;
      }
    } else {
      if (docVal !== queryVal) return false;
    }
  }
  return true;
}

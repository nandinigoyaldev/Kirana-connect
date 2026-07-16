import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase Client Initialized Successfully!");
} else {
  console.warn("⚠️ SUPABASE_URL or SUPABASE_ANON_KEY not found in environment. Supabase requests will fail!");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_DATA_PATH = path.join(__dirname, '../data/seedData.json');

export const connectDB = async () => {
  if (!supabase) {
    console.error("❌ Supabase is not configured!");
    return false;
  }

  try {
    // Test query to verify connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log("✅ Connected to Supabase PostgreSQL Database!");

    // Seed if empty
    await seedDatabaseIfNeeded();
    return true;
  } catch (err) {
    console.error(`❌ Supabase connection check failed: ${err.message}`);
    return false;
  }
};

const seedDatabaseIfNeeded = async () => {
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;

    if (count === 0) {
      console.log("📂 Seeding Supabase database from seedData.json...");
      if (fs.existsSync(SEED_DATA_PATH)) {
        const seedData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf8'));

        // Seed Users
        if (seedData.users && seedData.users.length > 0) {
          const formattedUsers = seedData.users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            phone: u.phone || '',
            store_id: u.storeId || null,
            is_approved: u.isApproved !== false,
            created_at: u.createdAt || new Date().toISOString()
          }));

          const { error: uErr } = await supabase.from('users').insert(formattedUsers);
          if (uErr) console.error("Error seeding users:", uErr);
        }

        // Seed Stores
        if (seedData.stores && seedData.stores.length > 0) {
          const formattedStores = seedData.stores.map(s => ({
            id: s._id,
            name: s.name,
            owner_id: s.owner || null,
            address: s.address || '',
            lat: s.location?.lat || 0,
            lng: s.location?.lng || 0,
            rating: s.rating || 4.5,
            image: s.image || '',
            delivery_fee: s.deliveryFee || 40
          }));
          const { error: sErr } = await supabase.from('stores').insert(formattedStores);
          if (sErr) console.error("Error seeding stores:", sErr);
        }

        // Seed Products
        if (seedData.products && seedData.products.length > 0) {
          const formattedProducts = seedData.products.map(p => ({
            id: p._id,
            name: p.name,
            description: p.description || '',
            price: p.price || 0,
            category: p.category || '',
            image: p.image || '',
            unit: p.unit || 'piece'
          }));
          const { error: pErr } = await supabase.from('products').insert(formattedProducts);
          if (pErr) console.error("Error seeding products:", pErr);
        }

        // Seed Inventory
        if (seedData.inventory && seedData.inventory.length > 0) {
          const formattedInventory = seedData.inventory.map(i => ({
            id: i._id,
            store_id: i.storeId,
            product_id: i.productId,
            price: i.price,
            stock: i.stock || 0,
            is_available: i.isAvailable !== false
          }));
          const { error: iErr } = await supabase.from('inventory').insert(formattedInventory);
          if (iErr) console.error("Error seeding inventory:", iErr);
        }

        console.log("✅ Supabase Seeding Completed successfully!");
      }
    } else {
      console.log("📂 Supabase database already contains records.");
    }
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  }
};


// Unique ID Generator using native Crypto UUID
export const generateId = () => {
  return crypto.randomUUID();
};

// --- LOCAL JSON FALLBACK SYSTEM ---
const LOCAL_DB_PATH = path.join(__dirname, '../data/local_db.json');

const readLocalDB = () => {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    if (fs.existsSync(SEED_DATA_PATH)) {
      fs.copyFileSync(SEED_DATA_PATH, LOCAL_DB_PATH);
    } else {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({
        users: [], stores: [], products: [], inventory: [], orders: [], wallets: [], suppliers: [], purchaseOrders: [], purchaseItems: []
      }, null, 2));
    }
  }
  try {
    const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
    if (!data.suppliers) data.suppliers = [];
    if (!data.purchaseOrders) data.purchaseOrders = [];
    if (!data.coopRequests) data.coopRequests = [];
    return data;

  } catch (e) {
    console.error("Error reading local DB", e);
    return {
      users: [], stores: [], products: [], inventory: [], orders: [], wallets: [], suppliers: [], purchaseOrders: []
    };
  }
};

const writeLocalDB = (data) => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing local DB", e);
  }
};

const filterLocal = (items, query) => {
  return items.filter(item => {
    for (const key in query) {
      const val = query[key];
      let itemVal = item[key];
      if (key === '_id' || key === 'id') {
        itemVal = item._id || item.id;
      }
      
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && val !== null) {
          if ('$ne' in val) {
            if (String(itemVal) === String(val.$ne)) return false;
          } else if ('$in' in val) {
            const strIn = val.$in.map(v => String(v));
            if (!strIn.includes(String(itemVal))) return false;
          }
        } else {
          if (String(itemVal) !== String(val)) return false;
        }
      }
    }
    return true;
  });
};

// Query Translator: maps MongoDB camelCase queries to PostgreSQL columns
const translateQuery = (supabaseQuery, queryObj) => {
  let sq = supabaseQuery;
  for (const key in queryObj) {
    let dbKey = key;
    if (key === '_id' || key === 'id') dbKey = 'id';
    else if (key === 'storeId') dbKey = 'store_id';
    else if (key === 'productId') dbKey = 'product_id';
    else if (key === 'customerId') dbKey = 'customer_id';
    else if (key === 'userId') dbKey = 'user_id';
    else if (key === 'deliveryPartnerId') dbKey = 'delivery_partner_id';
    else if (key === 'isAvailable') dbKey = 'is_available';
    else if (key === 'isOptimized') dbKey = 'is_optimized';
    else if (key === 'supplierId') dbKey = 'supplier_id';
    else if (key === 'orderNumber') dbKey = 'order_number';
    else if (key === 'expectedDeliveryDate') dbKey = 'expected_delivery_date';
    else if (key === 'paymentStatus') dbKey = 'payment_status';
    else if (key === 'deliveryOtp') dbKey = 'delivery_otp';
    else if (key === 'isApproved') dbKey = 'is_approved';
    else if (key === 'storeName') dbKey = 'store_name';


    else if (key === 'productName') dbKey = 'product_name';
    else if (key === 'targetStoreId') dbKey = 'target_store_id';
    else if (key === 'targetStoreName') dbKey = 'target_store_name';


    let val = queryObj[key];
    if (val !== undefined && val !== null) {
      if (val.toString() === '[object Object]') {
        // Handle basic $ne / $in filters
        if ('$ne' in val) {
          sq = sq.neq(dbKey, val.$ne);
        } else if ('$in' in val) {
          sq = sq.in(dbKey, val.$in);
        }
      } else {
        sq = sq.eq(dbKey, val.toString());
      }
    }
  }
  return sq;
};

// Formatter to map snake_case columns back to backend model camelCase format
const formatUser = (u) => {
  if (!u) return null;
  return {
    _id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    phone: u.phone,
    storeId: u.store_id,
    isApproved: u.is_approved === undefined || u.is_approved === null ? true : u.is_approved,
    createdAt: u.created_at
  };
};


const formatStore = (s) => {
  if (!s) return null;
  return {
    _id: s.id,
    name: s.name,
    owner: s.owner_id,
    address: s.address,
    location: { lat: s.lat, lng: s.lng },
    rating: s.rating,
    image: s.image,
    deliveryFee: s.delivery_fee
  };
};

const formatProduct = (p) => {
  if (!p) return null;
  return {
    _id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    image: p.image,
    unit: p.unit
  };
};

const formatInventory = (i, prodObj = null) => {
  if (!i) return null;
  return {
    _id: i.id,
    storeId: i.store_id,
    productId: prodObj || i.product_id,
    price: i.price,
    stock: i.stock,
    isAvailable: i.is_available
  };
};

const formatOrder = (o) => {
  if (!o) return null;
  return {
    _id: o.id,
    customerId: o.customer_id,
    deliveryPartnerId: o.delivery_partner_id,
    items: o.items,
    subtotal: o.subtotal,
    deliveryFee: o.delivery_fee,
    taxes: o.taxes,
    total: o.total,
    status: o.status,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    shippingAddress: o.shipping_address,
    isOptimized: o.is_optimized,
    deliveryOtp: o.delivery_otp || o.deliveryOtp,
    createdAt: o.created_at
  };
};


const formatWallet = (w) => {
  if (!w) return null;
  return {
    _id: w.id,
    userId: w.user_id,
    balance: w.balance,
    escrowBalance: w.escrow_balance,
    transactions: w.transactions || []
  };
};

const formatSupplier = (s) => {
  if (!s) return null;
  return {
    _id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    GSTIN: s.gstin,
    address: s.address,
    category: s.category,
    notes: s.notes,
    active: s.active,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };
};

const formatPurchaseOrder = (po) => {
  if (!po) return null;
  return {
    _id: po.id,
    storeId: po.store_id,
    supplierId: po.supplier_id,
    orderNumber: po.order_number,
    status: po.status,
    expectedDeliveryDate: po.expected_delivery_date,
    subtotal: po.subtotal,
    tax: po.tax,
    total: po.total,
    paymentStatus: po.payment_status,
    notes: po.notes,
    items: po.items || [],
    createdAt: po.created_at,
    updatedAt: po.updated_at
  };
};

const formatCoopRequest = (cr) => {
  if (!cr) return null;
  return {
    _id: cr.id || cr._id,
    storeId: cr.store_id || cr.storeId,
    storeName: cr.store_name || cr.storeName,
    productId: cr.product_id || cr.productId,
    productName: cr.product_name || cr.productName,
    quantity: cr.quantity,
    status: cr.status || 'pending',
    targetStoreId: cr.target_store_id || cr.targetStoreId,
    targetStoreName: cr.target_store_name || cr.targetStoreName,
    createdAt: cr.created_at || cr.createdAt
  };
};


// Extracts updates and maps them to database column names
const extractUpdateFields = (update) => {
  const data = update.$set || update;
  const res = {};
  for (const key in data) {
    let dbKey = key;
    if (key === 'storeId') dbKey = 'store_id';
    else if (key === 'owner') dbKey = 'owner_id';
    else if (key === 'deliveryFee') dbKey = 'delivery_fee';
    else if (key === 'productId') dbKey = 'product_id';
    else if (key === 'isAvailable') dbKey = 'is_available';
    else if (key === 'customerId') dbKey = 'customer_id';
    else if (key === 'deliveryPartnerId') dbKey = 'delivery_partner_id';
    else if (key === 'paymentMethod') dbKey = 'payment_method';
    else if (key === 'paymentStatus') dbKey = 'payment_status';
    else if (key === 'shippingAddress') dbKey = 'shipping_address';
    else if (key === 'isOptimized') dbKey = 'is_optimized';
    else if (key === 'escrowBalance') dbKey = 'escrow_balance';
    else if (key === 'supplierId') dbKey = 'supplier_id';
    else if (key === 'orderNumber') dbKey = 'order_number';
    else if (key === 'expectedDeliveryDate') dbKey = 'expected_delivery_date';
    else if (key === 'deliveryOtp') dbKey = 'delivery_otp';
    else if (key === 'isApproved') dbKey = 'is_approved';
    else if (key === 'storeName') dbKey = 'store_name';

    else if (key === 'productName') dbKey = 'product_name';
    else if (key === 'targetStoreId') dbKey = 'target_store_id';
    else if (key === 'targetStoreName') dbKey = 'target_store_name';
    else if (key === 'location' && typeof data[key] === 'object') {

      res['lat'] = data[key].lat;
      res['lng'] = data[key].lng;
      continue;
    }
    
    if (key !== '_id' && key !== 'id') {
      res[dbKey] = data[key];
    }
  }
  return res;
};

// Expose identical MongoDB/Mongoose CRUD interface
export const db = {
  users: {
    find: async (query = {}) => {
      let q = supabase.from('users').select('*');
      q = translateQuery(q, query);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(formatUser);
    },
    findOne: async (query = {}) => {
      let q = supabase.from('users').select('*');
      q = translateQuery(q, query);
      const { data, error } = await q.limit(1);
      if (error) throw error;
      return data && data.length > 0 ? formatUser(data[0]) : null;
    },
    findById: async (id) => {
      const { data, error } = await supabase.from('users').select('*').eq('id', id.toString()).limit(1);
      if (error) throw error;
      return data && data.length > 0 ? formatUser(data[0]) : null;
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'customer',
        phone: data.phone || '',
        store_id: data.storeId || null
      };
      const { error } = await supabase.from('users').insert(dbData);
      if (error) throw error;
      return formatUser(dbData);
    },
    updateOne: async (query, update) => {
      const fields = extractUpdateFields(update);
      let q = supabase.from('users').update(fields);
      q = translateQuery(q, query);
      const { error } = await q;
      if (error) throw error;
      return { nModified: 1 };
    }
  },
  stores: {
    find: async (query = {}) => {
      let q = supabase.from('stores').select('*');
      q = translateQuery(q, query);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(formatStore);
    },
    findById: async (id) => {
      const { data, error } = await supabase.from('stores').select('*').eq('id', id.toString()).limit(1);
      if (error) throw error;
      return data && data.length > 0 ? formatStore(data[0]) : null;
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        name: data.name,
        owner_id: data.owner || null,
        address: data.address || '',
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
        rating: data.rating || 4.5,
        image: data.image || '',
        delivery_fee: data.deliveryFee || 40
      };
      const { error } = await supabase.from('stores').insert(dbData);
      if (error) throw error;
      return formatStore(dbData);
    }
  },
  products: {
    find: async (query = {}) => {
      let q = supabase.from('products').select('*');
      q = translateQuery(q, query);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(formatProduct);
    },
    findById: async (id) => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id.toString()).limit(1);
      if (error) throw error;
      return data && data.length > 0 ? formatProduct(data[0]) : null;
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        name: data.name,
        description: data.description || '',
        price: data.price || 0,
        category: data.category || '',
        image: data.image || '',
        unit: data.unit || 'piece'
      };
      const { error } = await supabase.from('products').insert(dbData);
      if (error) throw error;
      return formatProduct(dbData);
    }
  },
  inventory: {
    find: async (query = {}) => {
      let q = supabase.from('inventory').select('*, products(*)');
      q = translateQuery(q, query);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(item => formatInventory(item, formatProduct(item.products)));
    },
    findOne: async (query = {}) => {
      let q = supabase.from('inventory').select('*, products(*)');
      q = translateQuery(q, query);
      const { data, error } = await q.limit(1);
      if (error) throw error;
      return data && data.length > 0 ? formatInventory(data[0], formatProduct(data[0].products)) : null;
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        store_id: data.storeId,
        product_id: data.productId,
        price: data.price,
        stock: data.stock || 0,
        is_available: data.isAvailable !== false
      };
      const { error } = await supabase.from('inventory').insert(dbData);
      if (error) throw error;
      return formatInventory(dbData);
    },
    updateOne: async (query, update) => {
      const fields = extractUpdateFields(update);
      let q = supabase.from('inventory').update(fields);
      q = translateQuery(q, query);
      const { error } = await q;
      if (error) throw error;
      return { nModified: 1 };
    }
  },
  orders: {
    find: async (query = {}) => {
      let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
      q = translateQuery(q, query);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(formatOrder);
    },
    findById: async (id) => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id.toString()).limit(1);
      if (error) throw error;
      return data && data.length > 0 ? formatOrder(data[0]) : null;
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        customer_id: data.customerId,
        delivery_partner_id: data.deliveryPartnerId || null,
        items: data.items,
        subtotal: data.subtotal,
        delivery_fee: data.deliveryFee,
        taxes: data.taxes,
        total: data.total,
        status: data.status || 'pending',
        payment_method: data.paymentMethod || 'cod',
        payment_status: data.paymentStatus || 'pending',
        shipping_address: data.shippingAddress || '',
        is_optimized: data.isOptimized || false
      };
      const { error } = await supabase.from('orders').insert(dbData);
      if (error) throw error;
      return formatOrder(dbData);
    },
    updateOne: async (query, update) => {
      const fields = extractUpdateFields(update);
      let q = supabase.from('orders').update(fields);
      q = translateQuery(q, query);
      const { error } = await q;
      if (error) throw error;
      return { nModified: 1 };
    }
  },
  wallets: {
    findOne: async (query = {}) => {
      let q = supabase.from('wallets').select('*');
      q = translateQuery(q, query);
      const { data, error } = await q.limit(1);
      if (error) throw error;
      return data && data.length > 0 ? formatWallet(data[0]) : null;
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        user_id: data.userId,
        balance: data.balance || 0,
        escrow_balance: data.escrowBalance || 0,
        transactions: data.transactions || []
      };
      const { error } = await supabase.from('wallets').insert(dbData);
      if (error) throw error;
      return formatWallet(dbData);
    },
    updateOne: async (query, update) => {
      const fields = extractUpdateFields(update);
      let q = supabase.from('wallets').update(fields);
      q = translateQuery(q, query);
      const { error } = await q;
      if (error) throw error;
      return { nModified: 1 };
    }
  },
  suppliers: {
    find: async (query = {}) => {
      try {
        let q = supabase.from('suppliers').select('*');
        q = translateQuery(q, query);
        const { data, error } = await q;
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return (data || []).map(formatSupplier);
      } catch (err) {
        console.warn("⚠️ Using local fallback for suppliers.find:", err.message);
        const local = readLocalDB();
        return filterLocal(local.suppliers, query);
      }
    },
    findOne: async (query = {}) => {
      try {
        let q = supabase.from('suppliers').select('*');
        q = translateQuery(q, query);
        const { data, error } = await q.limit(1);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return data && data.length > 0 ? formatSupplier(data[0]) : null;
      } catch (err) {
        console.warn("⚠️ Using local fallback for suppliers.findOne:", err.message);
        const local = readLocalDB();
        const filtered = filterLocal(local.suppliers, query);
        return filtered.length > 0 ? filtered[0] : null;
      }
    },
    findById: async (id) => {
      try {
        const { data, error } = await supabase.from('suppliers').select('*').eq('id', id.toString()).limit(1);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return data && data.length > 0 ? formatSupplier(data[0]) : null;
      } catch (err) {
        console.warn("⚠️ Using local fallback for suppliers.findById:", err.message);
        const local = readLocalDB();
        return local.suppliers.find(s => String(s._id) === String(id) || String(s.id) === String(id)) || null;
      }
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        gstin: data.GSTIN || '',
        address: data.address || '',
        category: data.category || '',
        notes: data.notes || '',
        active: data.active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try {
        const { error } = await supabase.from('suppliers').insert(dbData);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return formatSupplier(dbData);
      } catch (err) {
        console.warn("⚠️ Using local fallback for suppliers.create:", err.message);
        const local = readLocalDB();
        const newSupplier = {
          _id: id,
          id,
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          GSTIN: data.GSTIN || '',
          address: data.address || '',
          category: data.category || '',
          notes: data.notes || '',
          active: data.active !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        local.suppliers.push(newSupplier);
        writeLocalDB(local);
        return newSupplier;
      }
    },
    updateOne: async (query, update) => {
      const fields = extractUpdateFields(update);
      fields.updated_at = new Date().toISOString();
      try {
        let q = supabase.from('suppliers').update(fields);
        q = translateQuery(q, query);
        const { error } = await q;
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return { nModified: 1 };
      } catch (err) {
        console.warn("⚠️ Using local fallback for suppliers.updateOne:", err.message);
        const local = readLocalDB();
        const filtered = filterLocal(local.suppliers, query);
        const setFields = update.$set || update;
        filtered.forEach(s => {
          Object.assign(s, setFields);
          if (setFields.GSTIN !== undefined) s.GSTIN = setFields.GSTIN;
          s.updatedAt = new Date().toISOString();
        });
        writeLocalDB(local);
        return { nModified: filtered.length };
      }
    }
  },
  purchaseOrders: {
    find: async (query = {}) => {
      try {
        let q = supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
        q = translateQuery(q, query);
        const { data, error } = await q;
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return (data || []).map(formatPurchaseOrder);
      } catch (err) {
        console.warn("⚠️ Using local fallback for purchaseOrders.find:", err.message);
        const local = readLocalDB();
        const filtered = filterLocal(local.purchaseOrders, query);
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },
    findOne: async (query = {}) => {
      try {
        let q = supabase.from('purchase_orders').select('*');
        q = translateQuery(q, query);
        const { data, error } = await q.limit(1);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return data && data.length > 0 ? formatPurchaseOrder(data[0]) : null;
      } catch (err) {
        console.warn("⚠️ Using local fallback for purchaseOrders.findOne:", err.message);
        const local = readLocalDB();
        const filtered = filterLocal(local.purchaseOrders, query);
        return filtered.length > 0 ? filtered[0] : null;
      }
    },
    findById: async (id) => {
      try {
        const { data, error } = await supabase.from('purchase_orders').select('*').eq('id', id.toString()).limit(1);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return data && data.length > 0 ? formatPurchaseOrder(data[0]) : null;
      } catch (err) {
        console.warn("⚠️ Using local fallback for purchaseOrders.findById:", err.message);
        const local = readLocalDB();
        return local.purchaseOrders.find(po => String(po._id) === String(id) || String(po.id) === String(id)) || null;
      }
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        store_id: data.storeId,
        supplier_id: data.supplierId,
        order_number: data.orderNumber,
        status: data.status || 'draft',
        expected_delivery_date: data.expectedDeliveryDate,
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        total: data.total || 0,
        payment_status: data.paymentStatus || 'pending',
        notes: data.notes || '',
        items: data.items || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try {
        const { error } = await supabase.from('purchase_orders').insert(dbData);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return formatPurchaseOrder(dbData);
      } catch (err) {
        console.warn("⚠️ Using local fallback for purchaseOrders.create:", err.message);
        const local = readLocalDB();
        const newPO = {
          _id: id,
          id,
          storeId: data.storeId,
          supplierId: data.supplierId,
          orderNumber: data.orderNumber,
          status: data.status || 'draft',
          expectedDeliveryDate: data.expectedDeliveryDate,
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          total: data.total || 0,
          paymentStatus: data.paymentStatus || 'pending',
          notes: data.notes || '',
          items: data.items || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        local.purchaseOrders.push(newPO);
        writeLocalDB(local);
        return newPO;
      }
    },
    updateOne: async (query, update) => {
      const fields = extractUpdateFields(update);
      fields.updated_at = new Date().toISOString();
      try {
        let q = supabase.from('purchase_orders').update(fields);
        q = translateQuery(q, query);
        const { error } = await q;
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return { nModified: 1 };
      } catch (err) {
        console.warn("⚠️ Using local fallback for purchaseOrders.updateOne:", err.message);
        const local = readLocalDB();
        const filtered = filterLocal(local.purchaseOrders, query);
        const setFields = update.$set || update;
        filtered.forEach(po => {
          Object.assign(po, setFields);
          po.updatedAt = new Date().toISOString();
        });
        writeLocalDB(local);
        return { nModified: filtered.length };
      }
    }
  },
  coopRequests: {
    find: async (query = {}) => {
      try {
        let q = supabase.from('coop_requests').select('*').order('created_at', { ascending: false });
        q = translateQuery(q, query);
        const { data, error } = await q;
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return (data || []).map(formatCoopRequest);
      } catch (err) {
        console.warn("⚠️ Using local fallback for coopRequests.find:", err.message);
        const local = readLocalDB();
        if (!local.coopRequests || local.coopRequests.length === 0) {
          local.coopRequests = [
            {
              _id: 'coop-1',
              storeId: '60d5ec49867c293444747b12',
              storeName: 'Gupta Provision Store',
              productId: '60d5ec49867c293444747b21',
              productName: 'Amul Gold Milk (1L)',
              quantity: 15,
              status: 'pending',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              _id: 'coop-2',
              storeId: '60d5ec49867c293444747b13',
              storeName: 'Daily Needs Super Store',
              productId: '60d5ec49867c293444747b22',
              productName: 'Britannia Premium Bread',
              quantity: 8,
              status: 'pending',
              createdAt: new Date(Date.now() - 7200000).toISOString()
            }
          ];
          writeLocalDB(local);
        }
        return filterLocal(local.coopRequests, query);
      }
    },
    findOne: async (query = {}) => {
      try {
        let q = supabase.from('coop_requests').select('*');
        q = translateQuery(q, query);
        const { data, error } = await q.limit(1);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return data && data.length > 0 ? formatCoopRequest(data[0]) : null;
      } catch (err) {
        console.warn("⚠️ Using local fallback for coopRequests.findOne:", err.message);
        const local = readLocalDB();
        const filtered = filterLocal(local.coopRequests, query);
        return filtered.length > 0 ? filtered[0] : null;
      }
    },
    findById: async (id) => {
      try {
        const { data, error } = await supabase.from('coop_requests').select('*').eq('id', id.toString()).limit(1);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return data && data.length > 0 ? formatCoopRequest(data[0]) : null;
      } catch (err) {
        console.warn("⚠️ Using local fallback for coopRequests.findById:", err.message);
        const local = readLocalDB();
        return local.coopRequests.find(cr => String(cr._id) === String(id) || String(cr.id) === String(id)) || null;
      }
    },
    create: async (data) => {
      const id = generateId();
      const dbData = {
        id,
        store_id: data.storeId,
        store_name: data.storeName,
        product_id: data.productId,
        product_name: data.productName,
        quantity: data.quantity,
        status: data.status || 'pending',
        target_store_id: data.targetStoreId || null,
        target_store_name: data.targetStoreName || null,
        created_at: new Date().toISOString()
      };
      try {
        const { error } = await supabase.from('coop_requests').insert(dbData);
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return formatCoopRequest(dbData);
      } catch (err) {
        console.warn("⚠️ Using local fallback for coopRequests.create:", err.message);
        const local = readLocalDB();
        const newReq = {
          _id: id,
          id,
          storeId: data.storeId,
          storeName: data.storeName,
          productId: data.productId,
          productName: data.productName,
          quantity: data.quantity,
          status: data.status || 'pending',
          targetStoreId: data.targetStoreId || null,
          targetStoreName: data.targetStoreName || null,
          createdAt: new Date().toISOString()
        };
        if (!local.coopRequests) local.coopRequests = [];
        local.coopRequests.push(newReq);
        writeLocalDB(local);
        return newReq;
      }
    },
    updateOne: async (query, update) => {
      const fields = extractUpdateFields(update);
      try {
        let q = supabase.from('coop_requests').update(fields);
        q = translateQuery(q, query);
        const { error } = await q;
        if (error) {
          if (error.code === 'PGRST205') throw new Error('Table not found');
          throw error;
        }
        return { nModified: 1 };
      } catch (err) {
        console.warn("⚠️ Using local fallback for coopRequests.updateOne:", err.message);
        const local = readLocalDB();
        const filtered = filterLocal(local.coopRequests, query);
        const setFields = update.$set || update;
        filtered.forEach(cr => {
          Object.assign(cr, setFields);
        });
        writeLocalDB(local);
        return { nModified: filtered.length };
      }
    }
  }
};



const mongoose = require('mongoose');

const isIndexNotFoundError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 27 || error?.codeName === 'IndexNotFound' || message.includes('index not found');
};

const dropIndexIfExists = async (collection, indexName) => {
  try {
    await collection.dropIndex(indexName);
    console.log(`Dropped legacy index ${collection.collectionName}.${indexName}`);
  } catch (error) {
    if (!isIndexNotFoundError(error)) {
      throw error;
    }
  }
};

const normalizeInvoiceValue = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const backfillPurchaseInvoices = async (purchaseCollection) => {
  const filter = {
    $or: [
      { invoiceNo: { $exists: false } },
      { invoiceNo: null },
      { invoiceNo: '' },
      { invoiceNumber: { $exists: false } },
      { invoiceNumber: null },
      { invoiceNumber: '' }
    ]
  };

  const cursor = purchaseCollection.find(filter, {
    projection: { _id: 1, invoiceNo: 1, invoiceNumber: 1 }
  });

  const ops = [];
  let updated = 0;

  for await (const doc of cursor) {
    const invoiceNo = normalizeInvoiceValue(doc.invoiceNo);
    const invoiceNumber = normalizeInvoiceValue(doc.invoiceNumber);
    const resolvedInvoice = invoiceNo || invoiceNumber || `PUR-LEGACY-${String(doc._id).slice(-8).toUpperCase()}`;

    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            invoiceNo: resolvedInvoice,
            invoiceNumber: resolvedInvoice
          }
        }
      }
    });

    if (ops.length >= 500) {
      const result = await purchaseCollection.bulkWrite(ops, { ordered: false });
      updated += result.modifiedCount || 0;
      ops.length = 0;
    }
  }

  if (ops.length > 0) {
    const result = await purchaseCollection.bulkWrite(ops, { ordered: false });
    updated += result.modifiedCount || 0;
  }

  if (updated > 0) {
    console.log(`Backfilled invoice fields for ${updated} purchase record(s)`);
  }
};

const ensureCollectionIndexes = async (db, collectionName, ensureFn) => {
  const exists = await db.listCollections({ name: collectionName }).hasNext();
  if (!exists) return;
  await ensureFn(db.collection(collectionName));
};

const runMigrations = async () => {
  const db = mongoose.connection.db;
  if (!db) return;

  await ensureCollectionIndexes(db, 'purchases', async (collection) => {
    await backfillPurchaseInvoices(collection);
    await dropIndexIfExists(collection, 'invoiceNumber_1');
    await collection.createIndex(
      { userId: 1, invoiceNumber: 1 },
      { unique: true, name: 'userId_1_invoiceNumber_1' }
    );
  });

  await ensureCollectionIndexes(db, 'sales', async (collection) => {
    await dropIndexIfExists(collection, 'invoiceNumber_1');
    await collection.createIndex(
      { userId: 1, invoiceNumber: 1 },
      { unique: true, name: 'userId_1_invoiceNumber_1' }
    );
  });

  await ensureCollectionIndexes(db, 'stockgroups', async (collection) => {
    await dropIndexIfExists(collection, 'name_1');
    await collection.createIndex(
      { userId: 1, name: 1 },
      { unique: true, name: 'userId_1_name_1' }
    );
  });
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    await runMigrations();
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

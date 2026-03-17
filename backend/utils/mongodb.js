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

const buildSaleInvoiceNumber = (year, sequence) => `INV-${year}-${String(sequence).padStart(3, '0')}`;

const backfillPurchaseInvoices = async (purchaseCollection) => {
  const filter = {
    $and: [
      {
        $or: [
          { supplierInvoice: { $exists: false } },
          { supplierInvoice: null },
          { supplierInvoice: '' }
        ]
      },
      {
        $or: [
          { invoiceNo: { $exists: true, $type: 'string', $ne: '' } },
          { invoiceNumber: { $exists: true, $type: 'string', $ne: '' } }
        ]
      }
    ]
  };

  const cursor = purchaseCollection.find(filter, {
    projection: { _id: 1, supplierInvoice: 1, invoiceNo: 1, invoiceNumber: 1 }
  });

  const ops = [];
  let updated = 0;

  for await (const doc of cursor) {
    const supplierInvoice = normalizeInvoiceValue(doc.supplierInvoice);
    const invoiceNo = normalizeInvoiceValue(doc.invoiceNo);
    const invoiceNumber = normalizeInvoiceValue(doc.invoiceNumber);
    const resolvedInvoice = supplierInvoice || invoiceNo || invoiceNumber;

    if (!resolvedInvoice) {
      continue;
    }

    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            supplierInvoice: resolvedInvoice
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

const backfillSaleInvoices = async (saleCollection) => {
  const cursor = saleCollection.find(
    {},
    {
      projection: {
        _id: 1,
        userId: 1,
        invoiceNumber: 1,
        saleDate: 1,
        createdAt: 1
      },
      sort: { userId: 1, saleDate: 1, createdAt: 1, _id: 1 }
    }
  );

  const sequenceMap = new Map();
  const ops = [];
  let updated = 0;

  for await (const doc of cursor) {
    const invoiceDate = doc.saleDate || doc.createdAt || new Date();
    const parsedDate = new Date(invoiceDate);
    const year = Number.isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
    const key = `${String(doc.userId)}-${year}`;
    const nextSequence = (sequenceMap.get(key) || 0) + 1;
    sequenceMap.set(key, nextSequence);

    const nextInvoiceNumber = buildSaleInvoiceNumber(year, nextSequence);
    if (normalizeInvoiceValue(doc.invoiceNumber) === nextInvoiceNumber) {
      continue;
    }

    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            invoiceNumber: nextInvoiceNumber
          }
        }
      }
    });

    if (ops.length >= 500) {
      const result = await saleCollection.bulkWrite(ops, { ordered: false });
      updated += result.modifiedCount || 0;
      ops.length = 0;
    }
  }

  if (ops.length > 0) {
    const result = await saleCollection.bulkWrite(ops, { ordered: false });
    updated += result.modifiedCount || 0;
  }

  if (updated > 0) {
    console.log(`Backfilled invoice numbers for ${updated} sale record(s)`);
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
    await dropIndexIfExists(collection, 'userId_1_invoiceNumber_1');
    await dropIndexIfExists(collection, 'invoiceNo_1');
    await dropIndexIfExists(collection, 'userId_1_invoiceNo_1');
  });

  await ensureCollectionIndexes(db, 'sales', async (collection) => {
    await backfillSaleInvoices(collection);
    await dropIndexIfExists(collection, 'invoiceNumber_1');
    await dropIndexIfExists(collection, 'userId_1_invoiceNumber_1');
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

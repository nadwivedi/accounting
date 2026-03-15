const toPositiveInteger = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parsePrefixedNumberSearch = (value, prefix) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;

  const normalizedPrefix = String(prefix || '').trim().toLowerCase();
  const strippedValue = normalized.startsWith(`${normalizedPrefix}-`)
    ? normalized.slice(normalizedPrefix.length + 1)
    : normalized;

  return toPositiveInteger(strippedValue);
};

const ensureSequentialNumbersForUser = async ({ Model, userId, fieldName }) => {
  const entries = await Model.find({ userId })
    .select(`_id ${fieldName} createdAt`)
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  let nextNumber = entries.reduce((max, entry) => {
    return Math.max(max, toPositiveInteger(entry[fieldName]) || 0);
  }, 0) + 1;

  const updates = entries
    .filter((entry) => toPositiveInteger(entry[fieldName]) === null)
    .map((entry) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { [fieldName]: nextNumber++ } }
      }
    }));

  if (updates.length > 0) {
    await Model.bulkWrite(updates);
  }

  return nextNumber;
};

module.exports = {
  toPositiveInteger,
  parsePrefixedNumberSearch,
  ensureSequentialNumbersForUser
};

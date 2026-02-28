const mongoose = require('mongoose');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createVoucherHandlers = ({
  Model,
  entryName,
  fields,
  dateField = 'voucherDate',
  includeParty = true,
  requireAmount = true,
  includeMethod = true,
  includeReferenceNo = true,
  staticPayload = {}
}) => {
  const fieldNames = fields.map((field) => field.name);

  const createEntry = async (req, res) => {
    try {
      const userId = req.userId;
      const payload = {
        userId,
        notes: String(req.body.notes || '').trim(),
        [dateField]: req.body[dateField] || new Date(),
        ...staticPayload
      };

      if (includeParty) {
        const party = req.body.party || null;
        if (party && !mongoose.isValidObjectId(party)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid party id'
          });
        }
        payload.party = party;
      }

      if (requireAmount) {
        const amountNumber = toNumber(req.body.amount, NaN);
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Valid amount is required'
          });
        }
        payload.amount = amountNumber;
      }

      if (includeMethod) {
        payload.method = req.body.method || 'cash';
      }

      if (includeReferenceNo) {
        payload.referenceNo = String(req.body.referenceNo || '').trim();
      }

      for (const field of fields) {
        const value = String(req.body[field.name] || '').trim();
        if (field.required && !value) {
          return res.status(400).json({
            success: false,
            message: `${field.label} is required`
          });
        }
        payload[field.name] = value;
      }

      const entry = await Model.create(payload);

      return res.status(201).json({
        success: true,
        message: `${entryName} created successfully`,
        data: entry
      });
    } catch (error) {
      console.error(`Create ${entryName} error:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || `Error creating ${entryName}`
      });
    }
  };

  const getAllEntries = async (req, res) => {
    try {
      const userId = req.userId;
      const { party, search, fromDate, toDate } = req.query;
      const filter = { userId };

      if (includeParty && party && mongoose.isValidObjectId(party)) {
        filter.party = party;
      }

      if (fromDate || toDate) {
        filter[dateField] = {};

        if (fromDate) {
          const from = new Date(fromDate);
          if (!Number.isNaN(from.getTime())) {
            filter[dateField].$gte = from;
          }
        }

        if (toDate) {
          const to = new Date(toDate);
          if (!Number.isNaN(to.getTime())) {
            to.setHours(23, 59, 59, 999);
            filter[dateField].$lte = to;
          }
        }

        if (Object.keys(filter[dateField]).length === 0) {
          delete filter[dateField];
        }
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        const searchConditions = [
          { voucherNumber: searchRegex },
          { notes: searchRegex },
          ...fieldNames.map((name) => ({ [name]: searchRegex }))
        ];
        if (includeReferenceNo) {
          searchConditions.splice(1, 0, { referenceNo: searchRegex });
        }
        filter.$or = searchConditions;
      }

      const entries = await Model.find(filter)
        .sort({ [dateField]: -1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: entries.length,
        data: entries
      });
    } catch (error) {
      console.error(`Get ${entryName} list error:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || `Error fetching ${entryName} list`
      });
    }
  };

  return { createEntry, getAllEntries };
};

module.exports = {
  createVoucherHandlers
};

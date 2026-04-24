const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * GET /api/audit-logs
 * Query params:
 *   module, action, employeeId, fromDate, toDate, search, page, limit
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      module: moduleFilter,
      action: actionFilter,
      employeeId,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = { userId };

    if (moduleFilter) filter.module = moduleFilter;
    if (actionFilter) filter.action = actionFilter;
    if (employeeId) {
      if (employeeId === 'owner') {
        filter['performedBy.role'] = 'owner';
      } else if (mongoose.Types.ObjectId.isValid(employeeId)) {
        filter['performedBy.employeeId'] = new mongoose.Types.ObjectId(employeeId);
      }
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    if (search) {
      filter.$or = [
        { refLabel: { $regex: search, $options: 'i' } },
        { 'performedBy.employeeName': { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching audit logs' });
  }
};

/**
 * GET /api/audit-logs/:id
 * View full before/after detail of one log entry
 */
exports.getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const log = await AuditLog.findOne({ _id: id, userId }).lean();
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    console.error('Get audit log by id error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching audit log' });
  }
};

const AuditLog = require('../models/AuditLog');

/**
 * createAuditLog - saves one audit log entry.
 *
 * @param {object} opts
 * @param {string}  opts.userId      - Owner's user ID
 * @param {object}  [opts.employee]  - req.employee (populated by auth middleware, or null for owner)
 * @param {'CREATE'|'UPDATE'|'DELETE'} opts.action
 * @param {string}  opts.module      - e.g. 'Purchase', 'Sale'
 * @param {*}       [opts.refId]     - The _id of the affected document
 * @param {string}  [opts.refLabel]  - Human label, e.g. 'Pur-21', 'INV-05'
 * @param {object}  [opts.before]    - Snapshot before the change (for UPDATE/DELETE)
 * @param {object}  [opts.after]     - Snapshot after the change  (for CREATE/UPDATE)
 * @param {string}  [opts.note]      - Optional free-text note
 */
const createAuditLog = async ({
  userId,
  employee = null,
  action,
  module,
  refId = null,
  refLabel = '',
  before = null,
  after = null,
  note = ''
}) => {
  try {
    const performedBy = employee
      ? {
          role: 'employee',
          employeeId: employee._id,
          employeeName: employee.name || '',
          employeeCode: employee.employeeCode || employee.code || ''
        }
      : { role: 'owner', employeeId: null, employeeName: null, employeeCode: null };

    await AuditLog.create({
      userId,
      performedBy,
      action,
      module,
      refId: refId || null,
      refLabel: String(refLabel || ''),
      before,
      after,
      note: String(note || '')
    });
  } catch (err) {
    // Never crash the main request because of a logging failure
    console.error('[AuditLog] Failed to write log:', err.message);
  }
};

module.exports = { createAuditLog };

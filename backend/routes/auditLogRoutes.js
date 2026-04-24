const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLogById } = require('../controllers/auditLogController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

module.exports = router;

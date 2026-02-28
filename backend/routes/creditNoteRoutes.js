const express = require('express');
const router = express.Router();
const { createCreditNote, getAllCreditNotes } = require('../controllers/creditNoteController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createCreditNote);
router.get('/', getAllCreditNotes);

module.exports = router;

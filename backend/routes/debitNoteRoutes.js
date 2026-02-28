const express = require('express');
const router = express.Router();
const { createDebitNote, getAllDebitNotes } = require('../controllers/debitNoteController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createDebitNote);
router.get('/', getAllDebitNotes);

module.exports = router;

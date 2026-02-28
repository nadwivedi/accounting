const express = require('express');
const router = express.Router();
const { createJournal, getAllJournals } = require('../controllers/journalController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createJournal);
router.get('/', getAllJournals);

module.exports = router;

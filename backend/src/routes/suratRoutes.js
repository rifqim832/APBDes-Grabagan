const express = require('express');
const router = express.Router();
const suratController = require('../controllers/suratController');
const { verifyOperator } = require('../middleware/auth');

// Utility routes (must be before parameterized routes)
router.get('/last-number', suratController.getLastLetterNumber);
router.get('/stats', suratController.getStats);

// Outgoing letters
router.get('/keluar', suratController.getAllOutgoing);
router.get('/keluar/:id', suratController.getOutgoingById);
router.delete('/keluar/:id', verifyOperator, suratController.deleteOutgoing);

// Incoming letters
router.get('/masuk', suratController.getAllIncoming);

// Create (both incoming + outgoing in one transaction)
router.post('/create', suratController.createLetters);

module.exports = router;

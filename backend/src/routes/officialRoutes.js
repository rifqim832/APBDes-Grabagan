const express = require('express');
const router = express.Router();
const officialController = require('../controllers/officialController');

router.get('/', officialController.getOfficial);
router.put('/:id', officialController.updateOfficial);

module.exports = router;

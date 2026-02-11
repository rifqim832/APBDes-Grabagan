const express = require('express');
const router = express.Router();
const desaController = require('../controllers/desaController');

router.get('/', desaController.getAllVillages);
router.get('/:id', desaController.getVillageById);
router.put('/:id', desaController.updateVillage);

module.exports = router;

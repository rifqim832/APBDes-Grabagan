const express = require('express');
const router = express.Router();
const desaController = require('../controllers/desaController');

router.get('/', desaController.getAllDesa);
router.get('/:id', desaController.getDesaById);

module.exports = router;

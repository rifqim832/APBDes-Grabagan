const express = require('express');
const router = express.Router();
const suratController = require('../controllers/suratController');

router.get('/', suratController.getAllSurat);
router.post('/', suratController.createSurat);
router.get('/desa/:desaId', suratController.getSuratByDesa);

module.exports = router;

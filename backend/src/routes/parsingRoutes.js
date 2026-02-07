const express = require('express');
const router = express.Router();
const multer = require('multer');
const parsingController = require('../controllers/parsingController');

const upload = multer({ dest: 'uploads/' });

router.post('/parse-excel', upload.single('file'), parsingController.parseExcel);

module.exports = router;

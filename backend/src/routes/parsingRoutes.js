const express = require('express');
const router = express.Router();
const multer = require('multer');
const parsingController = require('../controllers/parsingController');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/parse-excel', upload.single('file'), parsingController.parseExcel);
router.post('/parse-image', upload.single('file'), parsingController.parseImage);

module.exports = router;


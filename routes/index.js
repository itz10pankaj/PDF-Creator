// routes/pdf.routes.js
const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/pdf.controller');

router.post('/generate-pdf', PdfController.generateHtmlDocPdf);

module.exports = router;

const express = require('express');
const { upload } = require('../middleware/upload');
const auth = require('../middleware/auth');
const { uploadBill, getBills, getBillById, downloadBill, getStats } = require('../controllers/billController');

const router = express.Router();

// POST /upload route - protected with auth and file upload middleware
router.post('/upload', auth, upload.single('file'), uploadBill);

// GET /bills route - protected with auth
router.get('/', auth, getBills);

// GET /bills/:billId route - protected with auth
router.get('/:billId', auth, getBillById);

// GET /bills/:billId/download route - protected with auth
router.get('/:billId/download', auth, downloadBill);

// GET /bills/stats/:userId route - protected with auth
router.get('/stats/:userId', auth, getStats);

module.exports = router;
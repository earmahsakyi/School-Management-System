const express = require('express');
const {
  createTvetPayment, 
  getAllTvetPayments,
  getTvetPaymentById,
  updateTvetPayment,
  deleteTvetPayment,
  getTvetPaymentStats,
  generateBatchTvetReceipts, 
  regenerateTvetReceipt
} = require('../controllers/tvetController');

const router = express.Router();

// Create TVET payment (no immediate receipt generation)
router.post('/', createTvetPayment); 

// Generate batch TVET receipts
router.get('/batch-receipts', generateBatchTvetReceipts); 

// Get all TVET payments with filtering and pagination
router.get('/', getAllTvetPayments);


// Get TVET payment statistics
router.get('/stats', getTvetPaymentStats);

// Get specific TVET payment by ID
router.get('/:id', getTvetPaymentById);

// Regenerate receipt for existing TVET payment
router.get('/:id/regenerate-receipt', regenerateTvetReceipt);

// Update TVET payment
router.put('/:id', updateTvetPayment);

// Delete TVET payment
router.delete('/:id', deleteTvetPayment);

module.exports = router;
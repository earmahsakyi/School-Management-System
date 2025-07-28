const express = require('express');
const { 
  createPaymentAndGenerateReceipt,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentStats
} = require('../controllers/otherPaymentController');

const router = express.Router();

// Create payment and generate receipt
router.post('/generate-receipt', createPaymentAndGenerateReceipt);

// Get all payments with filtering and pagination
router.get('/', getAllPayments);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Get specific payment by ID
router.get('/:id', getPaymentById);

// Update payment
router.put('/:id', updatePayment);

// Delete payment
router.delete('/:id', deletePayment);

module.exports = router;
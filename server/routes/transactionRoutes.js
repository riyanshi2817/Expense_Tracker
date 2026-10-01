const express = require('express');
const multer = require('multer');

const verifyToken = require('../middleware/verifyToken');
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  importTransactions,
} = require('../controllers/transactionController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Every transaction endpoint requires a valid JWT.
router.use(verifyToken);

router.post('/import', upload.single('file'), importTransactions);
router.post('/', createTransaction);
router.get('/', getTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;


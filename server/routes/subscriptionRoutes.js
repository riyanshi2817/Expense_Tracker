const express = require('express');

const verifyToken = require('../middleware/verifyToken');
const {
  createSubscription,
  getSubscriptions,
  getSubscriptionsDueSoon,
  updateSubscription,
  deleteSubscription,
  getSubscriptionWaste,
} = require('../controllers/subscriptionController');

const router = express.Router();

// Every subscription endpoint requires a valid JWT.
router.use(verifyToken);

router.get('/waste', getSubscriptionWaste);
router.get('/due-soon', getSubscriptionsDueSoon);
router.post('/', createSubscription);
router.get('/', getSubscriptions);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

module.exports = router;


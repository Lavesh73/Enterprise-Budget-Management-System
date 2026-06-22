const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const featureController = require('../controllers/featureController');

const router = express.Router();

router.route('/reminders')
  .post(protect, featureController.addReminder)
  .get(protect, featureController.getReminders);

router.route('/reminders/:id')
  .delete(protect, featureController.deleteReminder);

router.route('/notifications')
  .post(protect, featureController.addNotification)
  .get(protect, featureController.getNotifications);

router.route('/notifications/:id')
  .delete(protect, featureController.deleteNotification);

router.route('/tickets')
  .post(protect, featureController.addTicket)
  .get(protect, featureController.getTickets);

router.route('/tickets/:id')
  .delete(protect, featureController.deleteTicket);

module.exports = router;

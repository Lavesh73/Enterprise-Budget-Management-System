const express = require('express');
const router = express.Router();
const { getEmployees, promoteToDivisionHead, getUsers, getGroups } = require('../controllers/adminController');
const { getPendingApprovals, resolveApproval } = require('../controllers/approvalController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

router.get('/employees', protect, adminOnly, getEmployees);
router.put('/promote-division-head/:id', protect, adminOnly, promoteToDivisionHead);
router.get('/users', protect, getUsers);
router.get('/groups', protect, getGroups);
router.get('/approvals', protect, adminOnly, getPendingApprovals);
router.put('/approvals/:id', protect, adminOnly, resolveApproval);

module.exports = router;

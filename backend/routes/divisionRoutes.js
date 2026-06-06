const express = require('express');
const router = express.Router();
const { createGroup, getMyGroups, assignToGroup, promoteToGroupHead, getUnassignedEmployees } = require('../controllers/divisionController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is division head
const divisionHeadOnly = (req, res, next) => {
  if (req.user && req.user.role === 'division_head') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a division head' });
  }
};

router.post('/groups', protect, divisionHeadOnly, createGroup);
router.get('/groups', protect, divisionHeadOnly, getMyGroups);
router.get('/unassigned', protect, divisionHeadOnly, getUnassignedEmployees);
router.put('/assign-group/:userId', protect, divisionHeadOnly, assignToGroup);
router.put('/promote-group-head/:userId', protect, divisionHeadOnly, promoteToGroupHead);

module.exports = router;

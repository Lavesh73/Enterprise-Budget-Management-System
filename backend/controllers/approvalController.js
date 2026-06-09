const ApprovalRequest = require('../models/approvalRequestModel');
const Group = require('../models/groupModel');
const User = require('../models/userModel');
const db = require('../config/db');

const getPendingApprovals = async (req, res) => {
  try {
    const requests = await ApprovalRequest.findPending();
    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resolveApproval = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'

  try {
    const request = await ApprovalRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already resolved' });

    if (action === 'reject') {
      await ApprovalRequest.updateStatus(id, 'rejected');
      // Create notification
      await db.query(`INSERT INTO notifications (user_id, name, description, icon, color) VALUES (?, 'Admin', ?, 'x-circle', 'red')`, 
        [request.requester_id, `Your request to ${request.type} was rejected by Admin.`]);
      return res.json({ message: 'Request rejected' });
    }

    if (action === 'approve') {
      let details = request.details;
      if (typeof details === 'string') {
        try {
          details = JSON.parse(details);
        } catch (e) {
          console.error("Failed to parse details:", e);
        }
      }
      
      if (request.type === 'CREATE_GROUP') {
        await Group.create({ name: details.name, division_head_id: request.requester_id });
      } 
      else if (request.type === 'ASSIGN_EMPLOYEE') {
        await User.updateGroupId(details.userId, details.groupId);
      }
      else if (request.type === 'PROMOTE_GROUP_HEAD') {
        await User.updateRole(details.userId, 'group_head');
      }

      await ApprovalRequest.updateStatus(id, 'approved');
      
      // Create notification
      await db.query(`INSERT INTO notifications (user_id, name, description, icon, color) VALUES (?, 'Admin', ?, 'check-circle', 'green')`, 
        [request.requester_id, `Your request to ${request.type} was approved by Admin.`]);

      return res.json({ message: 'Request approved successfully' });
    }

    res.status(400).json({ message: 'Invalid action' });
  } catch (error) {
    console.error('Error resolving approval:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPendingApprovals, resolveApproval };

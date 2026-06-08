const Group = require('../models/groupModel');
const User = require('../models/userModel');
const ApprovalRequest = require('../models/approvalRequestModel');

const createGroup = async (req, res) => {
  const { name } = req.body;
  try {
    await ApprovalRequest.create(req.user.id, 'CREATE_GROUP', { name });
    res.status(202).json({ message: 'Request to create group sent to admin for approval' });
  } catch (error) {
    console.error('Error requesting group creation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.findByDivisionHead(req.user.id);
    
    // Also fetch members for each group
    const groupsWithMembers = await Promise.all(groups.map(async (g) => {
      const members = await User.findByGroupId(g.id);
      return { ...g, members };
    }));

    res.json(groupsWithMembers);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const assignToGroup = async (req, res) => {
  const { userId } = req.params;
  const { groupId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.division_head_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this group' });
    }

    await ApprovalRequest.create(req.user.id, 'ASSIGN_EMPLOYEE', { userId, groupId, userName: user.name, groupName: group.name });
    res.status(202).json({ message: 'Request to assign user sent to admin for approval' });
  } catch (error) {
    console.error('Error requesting user assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const promoteToGroupHead = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.group_id) {
      return res.status(400).json({ message: 'User must be assigned to a group first' });
    }

    const group = await Group.findById(user.group_id);
    if (group.division_head_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this group' });
    }

    await ApprovalRequest.create(req.user.id, 'PROMOTE_GROUP_HEAD', { userId, userName: user.name, groupName: group.name });
    res.status(202).json({ message: 'Request to promote user sent to admin for approval' });
  } catch (error) {
    console.error('Error requesting promotion:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unassigned employees so the division head can select them
const getUnassignedEmployees = async (req, res) => {
  try {
    const allEmployees = await User.findAllEmployees();
    const unassigned = allEmployees.filter(e => !e.group_id && e.role === 'employee');
    res.json(unassigned);
  } catch (error) {
    console.error('Error fetching unassigned employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending requests for the division head
const getMyRequests = async (req, res) => {
  try {
    const requests = await ApprovalRequest.findByRequester(req.user.id);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { createGroup, getMyGroups, assignToGroup, promoteToGroupHead, getUnassignedEmployees, getMyRequests };

const User = require('../models/userModel');

const db = require('../config/db');

const getEmployees = async (req, res) => {
  try {
    const employees = await User.findAllEmployees();
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const promoteToDivisionHead = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only promote if they are not already admin
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot change admin role' });
    }

    await User.updateRole(id, 'division_head');
    res.json({ message: 'User promoted to Division Head successfully' });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, group_id FROM users ORDER BY name ASC');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getGroups = async (req, res) => {
  try {
    const [groups] = await db.query('SELECT * FROM groups ORDER BY name ASC');
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getEmployees, promoteToDivisionHead, getUsers, getGroups };

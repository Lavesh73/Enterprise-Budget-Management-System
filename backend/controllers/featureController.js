const featureModel = require('../models/featureModel');

const featureController = {
  // Reminders
  addReminder: async (req, res) => {
    try {
      const { date, title, description } = req.body;
      const user_id = req.user.id;
      
      if (!date || !title) {
        return res.status(400).json({ message: 'Date and title are required' });
      }

      await featureModel.createReminder(user_id, date, title, description);
      res.status(201).json({ message: 'Reminder created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getReminders: async (req, res) => {
    try {
      const user_id = req.user.id;
      const reminders = await featureModel.getReminders(user_id);
      res.status(200).json(reminders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      await featureModel.deleteReminder(user_id, id);
      res.status(200).json({ message: 'Reminder deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Notifications
  addNotification: async (req, res) => {
    try {
      const { name, description, icon, color, time } = req.body;
      const user_id = req.user.id;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      await featureModel.createNotification(user_id, name, description, icon || '🔔', color || '#1E86FF', time || 'Just now');
      res.status(201).json({ message: 'Notification created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getNotifications: async (req, res) => {
    try {
      const user_id = req.user.id;
      const notifications = await featureModel.getNotifications(user_id);
      res.status(200).json(notifications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      await featureModel.deleteNotification(user_id, id);
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Support Tickets
  addTicket: async (req, res) => {
    try {
      const { subject, description, priority } = req.body;
      const user_id = req.user.id;
      if (!subject || !description) return res.status(400).json({ message: 'Subject and description are required' });
      
      const db = require('../config/db');
      await db.query(`INSERT INTO support_tickets (user_id, subject, description, priority) VALUES (?, ?, ?, ?)`, 
        [user_id, subject, description, priority || 'medium']);
      res.status(201).json({ message: 'Ticket created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getTickets: async (req, res) => {
    try {
      const user_id = req.user.id;
      const db = require('../config/db');
      const [tickets] = await db.query(`SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`, [user_id]);
      res.status(200).json(tickets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteTicket: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      const db = require('../config/db');
      await db.query(`DELETE FROM support_tickets WHERE id = ? AND user_id = ?`, [id, user_id]);
      res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = featureController;

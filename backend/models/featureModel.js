const db = require('../config/db');

const featureModel = {
  // Reminders
  createReminder: async (user_id, date, title, description) => {
    const [result] = await db.query(
      'INSERT INTO reminders (user_id, date, title, description) VALUES (?, ?, ?, ?)',
      [user_id, date, title, description]
    );
    return result;
  },

  getReminders: async (user_id) => {
    const [rows] = await db.query(
      'SELECT * FROM reminders WHERE user_id = ? ORDER BY date ASC',
      [user_id]
    );
    return rows;
  },

  deleteReminder: async (user_id, id) => {
    const [result] = await db.query(
      'DELETE FROM reminders WHERE user_id = ? AND id = ?',
      [user_id, id]
    );
    return result;
  },

  // Notifications
  createNotification: async (user_id, name, description, icon, color, time) => {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, name, description, icon, color, time) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, name, description, icon, color, time]
    );
    return result;
  },

  getNotifications: async (user_id) => {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  },

  deleteNotification: async (user_id, id) => {
    const [result] = await db.query(
      'DELETE FROM notifications WHERE user_id = ? AND id = ?',
      [user_id, id]
    );
    return result;
  }
};

module.exports = featureModel;

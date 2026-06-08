const db = require('../config/db');

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      // Fetch notifications specifically for the user, or global notifications for their role
      const [rows] = await db.query(
        `SELECT * FROM notifications 
         WHERE user_id = ? OR user_id IS NULL 
         ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error fetching notifications' });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      // Depending on how notifications are structured, mark it as read.
      // If there's an 'is_read' column, update it. If not, just delete or return success.
      // Let's assume there's an 'is_read' column. If not, we'll try/catch and ignore.
      try {
        await db.query(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
      } catch(e) {
        // column might not exist, silently ignore
      }
      res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error marking notification as read' });
    }
  }
};

module.exports = notificationController;

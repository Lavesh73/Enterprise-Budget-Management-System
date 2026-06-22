const db = require('../config/db');

const allowedTables = ['parkings', 'applicants', 'leaves', 'attendance', 'performance'];

const modulesController = {
  getAll: async (req, res) => {
    try {
      const { module } = req.params;
      if (!allowedTables.includes(module)) return res.status(400).json({ message: 'Invalid module' });

      // Join users table to get the user name and role
      let query = `
        SELECT m.*, u.name as user_name, u.role as user_role
        FROM ${module} m 
        LEFT JOIN users u ON m.user_id = u.id
      `;
      let params = [];

      if (['parkings', 'leaves', 'attendance', 'performance'].includes(module)) {
        if (req.user.role !== 'admin' && req.user.role !== 'division_head') {
          query += ` WHERE m.user_id = ?`;
          params.push(req.user.id);
        }
      }

      query += ' ORDER BY m.created_at DESC';
      
      const [rows] = await db.query(query, params);
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { module } = req.params;
      if (!allowedTables.includes(module)) return res.status(400).json({ message: 'Invalid module' });

      const data = { ...req.body };
      
      if (['parkings', 'leaves', 'attendance', 'performance'].includes(module)) {
        if (req.user.role !== 'admin' && req.user.role !== 'division_head') {
          data.user_id = req.user.id;
        } else if (!data.user_id) {
          data.user_id = req.user.id; // fallback if admin submits for themselves
        }
      }

      const keys = Object.keys(data);
      // Validate all keys to prevent SQL injection
      for (let key of keys) {
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
          return res.status(400).json({ message: 'Invalid field name' });
        }
      }

      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');

      const query = `INSERT INTO ${module} (${keys.map(k => '`' + k + '`').join(', ')}) VALUES (${placeholders})`;
      await db.query(query, values);

      res.status(201).json({ message: 'Record created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { module, id } = req.params;
      if (!allowedTables.includes(module)) return res.status(400).json({ message: 'Invalid module' });

      const data = { ...req.body };
      if (Object.keys(data).length === 0) return res.status(400).json({ message: 'No data provided to update' });

      const keys = Object.keys(data);
      for (let key of keys) {
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
          return res.status(400).json({ message: 'Invalid field name' });
        }
      }

      const updates = keys.map(key => '`' + key + '` = ?').join(', ');
      const values = Object.values(data);
      values.push(id); // for the WHERE clause

      const query = `UPDATE ${module} SET ${updates} WHERE id = ?`;
      await db.query(query, values);

      res.status(200).json({ message: 'Record updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  delete: async (req, res) => {
    try {
      const { module, id } = req.params;
      if (!allowedTables.includes(module)) return res.status(400).json({ message: 'Invalid module' });

      const query = `DELETE FROM ${module} WHERE id = ?`;
      await db.query(query, [id]);

      res.status(200).json({ message: 'Record deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = modulesController;

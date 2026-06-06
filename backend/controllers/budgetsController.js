const db = require('../config/db');

const budgetsController = {
  getAll: async (req, res) => {
    try {
      const query = `
        SELECT 
          b.id, 
          b.project_id,
          b.expense_type, 
          b.amount, 
          b.status, 
          b.created_at,
          p.project_name AS project_name
        FROM budgets b
        LEFT JOIN projects p ON b.project_id = p.id
        ORDER BY b.created_at DESC
      `;
      const [rows] = await db.query(query);
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { project_id, expense_type, amount } = req.body;
      const query = `INSERT INTO budgets (project_id, expense_type, amount) VALUES (?, ?, ?)`;
      await db.query(query, [project_id, expense_type, amount]);
      res.status(201).json({ message: 'Budget expense created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { project_id, expense_type, amount } = req.body;
      const query = `UPDATE budgets SET project_id = ?, expense_type = ?, amount = ? WHERE id = ?`;
      await db.query(query, [project_id, expense_type, amount, id]);
      res.status(200).json({ message: 'Budget expense updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `DELETE FROM budgets WHERE id = ?`;
      await db.query(query, [id]);
      res.status(200).json({ message: 'Budget expense deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = budgetsController;

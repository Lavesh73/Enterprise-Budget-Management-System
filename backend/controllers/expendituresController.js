const db = require('../config/db');

const expendituresController = {
  addExpenditure: async (req, res) => {
    try {
      const { project_id, major_head, minor_head, amount_spent, date, details } = req.body;
      const query = `
        INSERT INTO expenditures (project_id, major_head, minor_head, amount_spent, date, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [project_id, major_head, minor_head, amount_spent, date, details]);
      res.status(201).json({ message: 'Expenditure added successfully', id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getExpendituresByProject: async (req, res) => {
    try {
      const { projectId } = req.params;
      const [rows] = await db.query(`SELECT * FROM expenditures WHERE project_id = ? ORDER BY date DESC`, [projectId]);
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteExpenditure: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await db.query(`DELETE FROM expenditures WHERE id = ?`, [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Expenditure not found' });
      }
      res.json({ message: 'Expenditure deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = expendituresController;

const db = require('../config/db');

const projectsController = {
  getAll: async (req, res) => {
    try {
      const { role, id } = req.user;
      let query = `
        SELECT 
          p.id, 
          p.project_name, 
          p.project_number, 
          p.year_of_sanction, 
          p.start_date, 
          p.probable_completion_date, 
          p.sanctioned_amount, 
          p.status, 
          p.created_at,
          u.name AS division_head_name,
          g.name AS group_name,
          (SELECT GROUP_CONCAT(u2.name SEPARATOR ', ') FROM users u2 WHERE u2.group_id = g.id AND u2.role = 'group_head') AS group_leaders
        FROM projects p
        LEFT JOIN users u ON p.division_head_id = u.id
        LEFT JOIN groups g ON p.group_id = g.id
      `;
      const queryParams = [];

      // If user is division_head, only show their projects
      if (role === 'division_head') {
        query += ` WHERE p.division_head_id = ? `;
        queryParams.push(id);
      }
      query += ` ORDER BY p.created_at DESC`;

      const [rows] = await db.query(query, queryParams);
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { project_name, project_number, year_of_sanction, start_date, probable_completion_date, sanctioned_amount, division_head_id } = req.body;
      const query = `
        INSERT INTO projects 
        (project_name, project_number, year_of_sanction, start_date, probable_completion_date, sanctioned_amount, division_head_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await db.query(query, [project_name, project_number, year_of_sanction, start_date, probable_completion_date, sanctioned_amount, division_head_id || null]);
      
      if (division_head_id) {
        // Automatically promote the assigned user to division_head if they are an employee or group_head
        await db.query(`UPDATE users SET role = 'division_head' WHERE id = ? AND role NOT IN ('admin', 'division_head')`, [division_head_id]);
      }

      res.status(201).json({ message: 'Project created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  assignGroup: async (req, res) => {
    try {
      const { id } = req.params; // project id
      const { group_id } = req.body;
      await db.query(`UPDATE projects SET group_id = ? WHERE id = ?`, [group_id, id]);
      res.status(200).json({ message: 'Group assigned to project successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = projectsController;

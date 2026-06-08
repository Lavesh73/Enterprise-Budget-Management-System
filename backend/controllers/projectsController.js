const db = require('../config/db');

const projectsController = {
  getAll: async (req, res) => {
    try {
      const { role, id } = req.user;
      let query = `
        SELECT 
          p.id, 
          p.project_name, 
          p.description,
          p.project_number, 
          p.year_of_sanction, 
          p.start_date, 
          p.probable_completion_date, 
          p.sanctioned_amount, 
          p.status, 
          p.created_at,
          p.project_head_id,
          u.name AS division_head_name,
          g.name AS group_name,
          u3.name AS project_head_name,
          (SELECT GROUP_CONCAT(u2.name SEPARATOR ', ') FROM users u2 WHERE u2.group_id = g.id AND u2.role = 'group_head') AS group_leaders,
          (SELECT COALESCE(SUM(amount_spent), 0) FROM expenditures WHERE project_id = p.id) AS total_spent
        FROM projects p
        LEFT JOIN users u ON p.division_head_id = u.id
        LEFT JOIN groups g ON p.group_id = g.id
        LEFT JOIN users u3 ON p.project_head_id = u3.id
      `;
      const queryParams = [];

      if (role === 'division_head') {
        query += ` WHERE p.division_head_id = ? `;
        queryParams.push(id);
      } else if (role === 'employee' || role === 'group_head') {
        query += ` WHERE p.project_head_id = ? OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ?) `;
        queryParams.push(id, id);
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
  },

  setProjectHead: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      await db.query(`UPDATE projects SET project_head_id = ? WHERE id = ?`, [userId, id]);
      res.status(200).json({ message: 'Project Head assigned successfully' });
    } catch (err) {
      console.error('Error assigning project head:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  createDivisionProject: async (req, res) => {
    try {
      const { project_name, description, project_number, year_of_sanction, start_date, probable_completion_date, sanctioned_amount, memberIds } = req.body;
      const divisionHeadId = req.user.id;
      
      if (memberIds && memberIds.length > 15) {
        return res.status(400).json({ message: 'A project can have a maximum of 15 members' });
      }

      // 1. Create Group for Project
      const groupName = `Project: ${project_name}`;
      const [groupResult] = await db.query('INSERT INTO groups (name, division_head_id) VALUES (?, ?)', [groupName, divisionHeadId]);
      const groupId = groupResult.insertId;

      // 2. Create Project
      const [projectRes] = await db.query(
        `INSERT INTO projects (project_name, description, project_number, year_of_sanction, start_date, probable_completion_date, sanctioned_amount, division_head_id, group_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning')`,
        [project_name, description || null, project_number, year_of_sanction, start_date, probable_completion_date, sanctioned_amount, divisionHeadId, groupId]
      );
      const projectId = projectRes.insertId;

      // 3. Insert Members into project_members
      if (memberIds && memberIds.length > 0) {
        const values = memberIds.map(userId => [projectId, userId]);
        await db.query(`INSERT INTO project_members (project_id, user_id) VALUES ?`, [values]);
      }

      // 4. Notify Admins
      const [admins] = await db.query(`SELECT id FROM users WHERE role = 'admin'`);
      for (let admin of admins) {
        await db.query(`INSERT INTO notifications (user_id, name, description, icon, color) VALUES (?, 'System', ?, 'folder-plus', 'blue')`, 
          [admin.id, `Division Head created a new project: ${project_name}`]);
      }

      res.status(201).json({ message: 'Project created successfully', projectId });
    } catch (err) {
      console.error('Error creating division project:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getProjectDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const [projects] = await db.query(`
        SELECT p.*, g.name as group_name, u.name as division_head_name, u3.name as project_head_name
        FROM projects p
        LEFT JOIN groups g ON p.group_id = g.id
        LEFT JOIN users u ON p.division_head_id = u.id
        LEFT JOIN users u3 ON p.project_head_id = u3.id
        WHERE p.id = ?
      `, [id]);
      
      if (projects.length === 0) return res.status(404).json({ message: 'Project not found' });
      
      const project = projects[0];
      
      let members = [];
      const [m] = await db.query(`
        SELECT u.id, u.name, u.email, u.role, u.designation, u.phone_number 
        FROM users u 
        JOIN project_members pm ON u.id = pm.user_id 
        WHERE pm.project_id = ?
      `, [id]);
      members = m;
      
      let expenditures = [];
      const [ex] = await db.query(`SELECT * FROM expenditures WHERE project_id = ? ORDER BY date DESC`, [id]);
      expenditures = ex;
      
      res.json({ ...project, members, expenditures });
    } catch (err) {
      console.error('Error fetching project details:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getProjectForecast: async (req, res) => {
    try {
      const { id } = req.params;
      const [projData] = await db.query('SELECT start_date, probable_completion_date, sanctioned_amount FROM projects WHERE id = ?', [id]);
      if (!projData || projData.length === 0) return res.status(404).json({ message: 'Project not found' });
      const project = projData[0];
      
      const [expenditures] = await db.query('SELECT date, amount_spent FROM expenditures WHERE project_id = ? ORDER BY date ASC', [id]);
      
      const startDate = new Date(project.start_date);
      const completionDate = new Date(project.probable_completion_date);
      const budget = Number(project.sanctioned_amount);
      
      if (expenditures.length < 2) {
        return res.json({ message: 'Not enough data for forecasting', data: null });
      }
      
      // Calculate daily cumulative spend
      let cumulativeSpend = 0;
      let historicalData = [];
      const spendMap = new Map();
      
      expenditures.forEach(ex => {
        const d = new Date(ex.date).toISOString().split('T')[0];
        spendMap.set(d, (spendMap.get(d) || 0) + Number(ex.amount_spent));
      });
      
      // Linear Regression Variables
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      let n = 0;
      
      const msPerDay = 1000 * 60 * 60 * 24;
      let lastDate = startDate;
      
      // Build historical chart data
      const sortedDates = Array.from(spendMap.keys()).sort();
      for (const d of sortedDates) {
        const current = new Date(d);
        const daysSinceStart = Math.floor((current - startDate) / msPerDay);
        cumulativeSpend += spendMap.get(d);
        
        historicalData.push({
          date: d,
          actual: cumulativeSpend,
          daysSinceStart
        });
        
        sumX += daysSinceStart;
        sumY += cumulativeSpend;
        sumXY += daysSinceStart * cumulativeSpend;
        sumXX += daysSinceStart * daysSinceStart;
        n++;
        lastDate = current;
      }
      
      // Prevent division by zero if all dates are the same
      const denominator = (n * sumXX - sumX * sumX);
      const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
      const intercept = denominator === 0 ? cumulativeSpend : (sumY - slope * sumX) / n;
      
      // Predict future
      const predictedData = [];
      let currentDate = new Date(lastDate);
      let predictedSpend = cumulativeSpend;
      
      // Add the last historical point as the start of the prediction
      predictedData.push({
        date: lastDate.toISOString().split('T')[0],
        predicted: predictedSpend
      });
      
      let depletionDate = null;
      let daysCount = Math.floor((lastDate - startDate) / msPerDay);
      
      // Prevent infinite loops if slope is negative or 0
      if (slope > 0) {
        while (predictedSpend < budget && daysCount < 3650) { // Max 10 years
          currentDate.setDate(currentDate.getDate() + 5); // Step by 5 days for chart performance
          daysCount += 5;
          predictedSpend = (slope * daysCount) + intercept;
          
          if (predictedSpend >= budget) {
            predictedSpend = budget;
            depletionDate = new Date(currentDate);
          }
          
          predictedData.push({
            date: currentDate.toISOString().split('T')[0],
            predicted: Math.min(predictedSpend, budget)
          });
          
          if (predictedSpend >= budget) break;
        }
      }
      
      let status = "On Track";
      if (depletionDate && depletionDate < completionDate) {
        status = "At Risk";
      } else if (slope <= 0) {
        status = "Underutilized";
      }
      
      res.json({
        data: {
          historical: historicalData,
          predicted: predictedData
        },
        insights: {
          burnRatePerDay: slope > 0 ? slope : 0,
          depletionDate: depletionDate ? depletionDate.toISOString().split('T')[0] : null,
          status,
          budget
        }
      });
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Forecast error' });
    }
  },

  startProject: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Update status to active
      await db.query(`UPDATE projects SET status = 'active' WHERE id = ?`, [id]);
      
      // Get project details for the notification
      const [projects] = await db.query('SELECT project_name FROM projects WHERE id = ?', [id]);
      if (projects.length === 0) return res.status(404).json({ message: 'Project not found' });
      const projName = projects[0].project_name;
      
      // Get all members of the project
      const [members] = await db.query(`SELECT user_id FROM project_members WHERE project_id = ?`, [id]);
      
      // Send notification to each member
      for (const member of members) {
        await db.query(
          `INSERT INTO notifications (user_id, name, description, icon, color) VALUES (?, 'System', ?, 'play-circle', 'green')`, 
          [member.user_id, `Project "${projName}" has officially started!`]
        );
      }
      
      res.json({ message: 'Project started successfully' });
    } catch (err) {
      console.error('Error starting project:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = projectsController;

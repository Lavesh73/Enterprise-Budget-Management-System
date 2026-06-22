const db = require('../config/db');

class User {
  static async create({ name, email, password = null, role = 'employee', google_id = null }) {
    const query = `
      INSERT INTO users (name, email, password, role, google_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [name, email, password, role, google_id]);
    return result.insertId;
  }

  static async findByEmail(email) {
    const query = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = `SELECT id, name, email, role, group_id, email_notifications, theme_preference, created_at FROM users WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async findAllEmployees() {
    const query = `SELECT id, name, email, role, group_id, created_at FROM users WHERE role != 'admin'`;
    const [rows] = await db.execute(query);
    return rows;
  }

  static async updateRole(id, role) {
    const query = `UPDATE users SET role = ? WHERE id = ?`;
    await db.execute(query, [role, id]);
  }

  static async updateGroupId(id, groupId) {
    const query = `UPDATE users SET group_id = ? WHERE id = ?`;
    await db.execute(query, [groupId, id]);
  }

  static async findByGroupId(groupId) {
    const query = `SELECT id, name, email, role, group_id, created_at FROM users WHERE group_id = ?`;
    const [rows] = await db.execute(query, [groupId]);
    return rows;
  }
}

module.exports = User;

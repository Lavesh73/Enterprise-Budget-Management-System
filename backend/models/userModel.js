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
    const query = `SELECT id, name, email, role, created_at FROM users WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }
}

module.exports = User;

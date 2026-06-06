const db = require('../config/db');

class Group {
  static async create({ name, division_head_id }) {
    const query = `
      INSERT INTO groups (name, division_head_id)
      VALUES (?, ?)
    `;
    const [result] = await db.execute(query, [name, division_head_id]);
    return result.insertId;
  }

  static async findById(id) {
    const query = `SELECT * FROM groups WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async findByDivisionHead(division_head_id) {
    const query = `SELECT * FROM groups WHERE division_head_id = ?`;
    const [rows] = await db.execute(query, [division_head_id]);
    return rows;
  }
}

module.exports = Group;

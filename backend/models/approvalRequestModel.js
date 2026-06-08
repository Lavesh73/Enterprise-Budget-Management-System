const db = require('../config/db');

class ApprovalRequest {
  static async create(requesterId, type, details) {
    const [result] = await db.query(
      `INSERT INTO approval_requests (requester_id, type, details) VALUES (?, ?, ?)`,
      [requesterId, type, JSON.stringify(details)]
    );
    return result.insertId;
  }

  static async findPending() {
    const [rows] = await db.query(
      `SELECT a.*, u.name as requester_name 
       FROM approval_requests a 
       JOIN users u ON a.requester_id = u.id 
       WHERE a.status = 'pending' 
       ORDER BY a.created_at DESC`
    );
    return rows;
  }

  static async findByRequester(requesterId) {
    const [rows] = await db.query(
      `SELECT * FROM approval_requests WHERE requester_id = ? ORDER BY created_at DESC`,
      [requesterId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`SELECT * FROM approval_requests WHERE id = ?`, [id]);
    return rows[0];
  }

  static async updateStatus(id, status) {
    await db.query(`UPDATE approval_requests SET status = ? WHERE id = ?`, [status, id]);
  }
}

module.exports = ApprovalRequest;

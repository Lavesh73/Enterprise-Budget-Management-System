const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to MySQL server.');

    // 1. Add fields to `users`
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN gender VARCHAR(50) NULL;`);
      await connection.query(`ALTER TABLE users ADD COLUMN designation VARCHAR(255) NULL;`);
      await connection.query(`ALTER TABLE users ADD COLUMN address TEXT NULL;`);
      await connection.query(`ALTER TABLE users ADD COLUMN phone_number VARCHAR(50) NULL;`);
      console.log('Added gender, designation, address, phone_number to users.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Users columns already exist.');
      } else {
        throw e;
      }
    }

    // 2. Create `project_members` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY project_user_unique (project_id, user_id)
      );
    `);
    console.log('Created project_members table.');

    // 3. Create `expenditures` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenditures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        major_head VARCHAR(255) NOT NULL,
        minor_head VARCHAR(255) NOT NULL,
        amount_spent DECIMAL(15,2) NOT NULL,
        date DATE NOT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);
    console.log('Created expenditures table.');

    await connection.end();
    console.log('Database schema update completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database schema:', error);
    process.exit(1);
  }
}

updateSchema();

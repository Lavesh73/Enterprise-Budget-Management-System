const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function alterDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to MySQL server.');

    // Make password nullable
    await connection.query(`ALTER TABLE users MODIFY password VARCHAR(255) NULL;`);
    console.log('Modified password column to allow NULL.');

    // Add google_id column if not exists
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE;`);
      console.log('Added google_id column.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('google_id column already exists.');
      } else {
        throw e;
      }
    }

    await connection.end();
    console.log('Database alteration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error altering database:', error);
    process.exit(1);
  }
}

alterDb();

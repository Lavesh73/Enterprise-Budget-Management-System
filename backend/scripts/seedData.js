const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ADMIN_EMAIL = 'jangidlavesh733@gmail.com';
const DUMMY_PASSWORD = 'password-123456'; // Using requested 'password-123456' OR wait, the user said 'password-123456' but let me re-read... Ah, "keep all of the passwords same(password-123456)".

async function seedDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to MySQL server.');

    // 1. Ensure Admin exists
    const [adminRows] = await connection.query(`SELECT id FROM users WHERE email = ?`, [ADMIN_EMAIL]);
    const hashedAdminPassword = await bcrypt.hash('admin-123456', 10);
    
    if (adminRows.length === 0) {
      console.log('Admin user not found. Creating admin...');
      await connection.query(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
        ['Admin Lavesh', ADMIN_EMAIL, hashedAdminPassword]
      );
    } else {
      console.log('Admin user found. Updating role to admin...');
      await connection.query(`UPDATE users SET role = 'admin' WHERE email = ?`, [ADMIN_EMAIL]);
    }

    // 2. Create Dummy Employees
    const dummyEmployees = [
      { name: 'John Doe', email: 'john.employee@example.com' },
      { name: 'Jane Smith', email: 'jane.employee@example.com' },
      { name: 'Alice Johnson', email: 'alice.employee@example.com' },
      { name: 'Bob Brown', email: 'bob.employee@example.com' },
      { name: 'Charlie Davis', email: 'charlie.employee@example.com' },
      { name: 'Diana Prince', email: 'diana.employee@example.com' }
    ];

    const hashedDummyPassword = await bcrypt.hash(DUMMY_PASSWORD, 10);

    console.log('Seeding dummy employees...');
    for (const emp of dummyEmployees) {
      const [rows] = await connection.query(`SELECT id FROM users WHERE email = ?`, [emp.email]);
      if (rows.length === 0) {
        await connection.query(
          `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'employee')`,
          [emp.name, emp.email, hashedDummyPassword]
        );
        console.log(`Created employee: ${emp.email}`);
      } else {
        console.log(`Employee ${emp.email} already exists.`);
      }
    }

    await connection.end();
    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDb();

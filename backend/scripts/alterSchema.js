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

    // 1. Modify the users table to expand the role ENUM
    console.log('Modifying users table role enum...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'division_head', 'group_head', 'employee') DEFAULT 'employee';
    `);

    // 2. Create the groups table
    console.log('Creating groups table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        division_head_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_head_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // 3. Add group_id to users
    console.log('Adding group_id to users...');
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN group_id INT DEFAULT NULL,
        ADD FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
      `);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
         console.log('group_id column already exists.');
      } else {
         throw err;
      }
    }

    // 4. Create reminders table
    console.log('Creating reminders table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        date DATE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 5. Create notifications table
    console.log('Creating notifications table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(50),
        time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 6. Create parkings table
    console.log('Creating parkings table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parkings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        vehicle_number VARCHAR(100) NOT NULL,
        spot_number VARCHAR(50) NOT NULL,
        status ENUM('assigned', 'pending', 'revoked') DEFAULT 'assigned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 7. Create applicants table (Recruit)
    console.log('Creating applicants table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applicants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        status ENUM('review', 'interview', 'offer', 'rejected') DEFAULT 'review',
        applied_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Create leaves table
    console.log('Creating leaves table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 9. Create attendance table
    console.log('Creating attendance table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'late') DEFAULT 'present',
        check_in_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 10. Create performance table
    console.log('Creating performance table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS performance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        review_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 11. Create projects table
    console.log('Creating projects table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        division_head_id INT,
        group_id INT,
        status ENUM('planning', 'active', 'completed') DEFAULT 'planning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_head_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
      );
    `);

    // 12. Create budgets table
    console.log('Creating budgets table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        expense_type VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    await connection.end();
    console.log('Database schema alteration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error altering database schema:', error);
    process.exit(1);
  }
}

alterDb();

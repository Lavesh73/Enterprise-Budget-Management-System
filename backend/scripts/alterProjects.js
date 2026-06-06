const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const alterProjectsSchema = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to MySQL server.');

    console.log('Dropping budgets table to remove foreign key constraint...');
    await connection.query(`DROP TABLE IF EXISTS budgets;`);

    console.log('Dropping existing projects table...');
    await connection.query(`DROP TABLE IF EXISTS projects;`);

    console.log('Creating new projects table with DRDO standards...');
    await connection.query(`
      CREATE TABLE projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_name VARCHAR(255) NOT NULL,
        project_number VARCHAR(100) NOT NULL,
        year_of_sanction INT NOT NULL,
        start_date DATE NOT NULL,
        probable_completion_date DATE NOT NULL,
        sanctioned_amount DECIMAL(15, 2) NOT NULL,
        division_head_id INT,
        group_id INT,
        status ENUM('planning', 'active', 'completed') DEFAULT 'planning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_head_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
      );
    `);

    console.log('Re-creating budgets table...');
    await connection.query(`
      CREATE TABLE budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        expense_type VARCHAR(100) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    await connection.end();
    console.log('Project schema alteration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error altering project schema:', error);
    process.exit(1);
  }
};

alterProjectsSchema();

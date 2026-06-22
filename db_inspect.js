require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/config/db');

async function test() {
  const [users] = await db.query('SELECT id, name, group_id, role FROM users');
  const [groups] = await db.query('SELECT id, name FROM groups');
  const [requests] = await db.query('SELECT * FROM approval_requests');
  
  console.log('users:', users);
  console.log('groups:', groups);
  console.log('requests:', requests);
  process.exit(0);
}
test();

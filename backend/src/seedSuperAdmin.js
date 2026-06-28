const bcrypt = require('bcrypt');
const pool = require('./db');
require('dotenv').config();

async function seed() {
  const hash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE email = $2`,
    [hash, process.env.SUPER_ADMIN_EMAIL]
  );
  console.log('Super admin password updated.');
  process.exit(0);
}

seed().catch(console.error);
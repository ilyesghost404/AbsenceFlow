const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'absenceflow', user: 'postgres', password: '1289' });
const bcrypt = require('bcrypt');

async function run() {
  await pool.query("DELETE FROM users WHERE username IN ('testadmin', 'testuser')");

  const adminPass = await bcrypt.hash('password123', 10);
  const { rows: admins } = await pool.query(
    "INSERT INTO users (username, email, password_hash, role, is_verified) VALUES ('testadmin', 'testadmin@test.local', $1, 'admin', true) RETURNING id",
    [adminPass]
  );

  const loginRes = await fetch('http://127.0.0.1:5000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testadmin', password: 'password123' })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
      console.log('Login failed:', loginData);
      process.exit(1);
  }
  const token = loginData.data.token;
  
  const createRes = await fetch('http://127.0.0.1:5000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ username: 'testuser', email: 'testuser@example.com', role: 'employee' })
  });
  
  const createData = await createRes.json();
  console.log('Create user success?', createData.success);

  const { rows } = await pool.query("SELECT activation_token, account_status FROM users WHERE username = 'testuser'");
  const activationToken = rows[0].activation_token;
  console.log('Account Status (Before):', rows[0].account_status);
  
  const activateVerifyRes = await fetch(`http://127.0.0.1:5000/api/users/activate-account/verify?token=${activationToken}`);
  const activateVerifyData = await activateVerifyRes.json();
  console.log('Verify token success?', activateVerifyData.success);

  const activateRes = await fetch('http://127.0.0.1:5000/api/users/activate-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: activationToken, password: 'SecurePassword123' })
  });
  
  const activateData = await activateRes.json();
  console.log('Activate account success?', activateData.success);

  const { rows: afterRows } = await pool.query("SELECT account_status FROM users WHERE username = 'testuser'");
  console.log('Account Status (After):', afterRows[0].account_status);

  const newLoginRes = await fetch('http://127.0.0.1:5000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'SecurePassword123' })
  });
  const newLoginData = await newLoginRes.json();
  console.log('Login new user success?', newLoginData.success);

  // Cleanup
  await pool.query("DELETE FROM users WHERE username IN ('testadmin', 'testuser')");
  process.exit(0);
}
run();

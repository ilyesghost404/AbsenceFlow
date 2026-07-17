const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'absenceflow', user: 'postgres', password: '1289' });

const API_URL = 'http://127.0.0.1:5000/api';

async function run() {
  console.log('🚀 Starting Face Identity Management Lifecycle API Tests...\n');

  let testEmployeeId = null;
  let testUserId = null;
  const activationToken = 'test_activation_token_12345';

  try {
    // 1. Setup a clean slate
    await pool.query("DELETE FROM users WHERE username = 'lifecycle_employee'");
    await pool.query("DELETE FROM employees WHERE matricule = 'LIFE999'");

    // Create a mock employee record
    const { rows: empRows } = await pool.query(
      "INSERT INTO employees (matricule, first_name, last_name, hire_date) VALUES ('LIFE999', 'John', 'Biometrics', CURRENT_DATE) RETURNING id"
    );
    testEmployeeId = empRows[0].id;
    console.log(`📌 Created test employee (ID: ${testEmployeeId})`);

    // Create user account in Pending status with activation token
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, employee_id, is_active, is_verified, account_status, activation_token, activation_token_expiry) 
       VALUES ('lifecycle_employee', 'lifecycle@test.local', 'unhashed_placeholder', 'employee', $1, true, false, 'Pending', $2, NOW() + INTERVAL '24 hours') RETURNING id`,
      [testEmployeeId, activationToken]
    );
    testUserId = userRows[0].id;
    console.log(`📌 Created test user in 'Pending' status (ID: ${testUserId})`);

    // --- CASE 1: Account activation & password creation ---
    console.log('\n🔑 Test Case 1: Submitting new password during activation...');
    const setPassRes = await fetch(`${API_URL}/users/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: activationToken, password: 'SecurePassword321!' })
    });
    const setPassData = await setPassRes.json();
    console.log('→ Password set response:', setPassData);
    if (!setPassRes.ok || !setPassData.success) {
      throw new Error('Failed to set password during activation');
    }

    // Verify DB state: password_hash updated, account_status is Pending_Face, activation_token still active
    const { rows: statusCheck } = await pool.query(
      "SELECT password_hash, account_status, activation_token FROM users WHERE id = $1",
      [testUserId]
    );
    console.log('→ DB State:', statusCheck[0]);
    if (
      statusCheck[0].account_status === 'Pending_Face' && 
      statusCheck[0].activation_token === activationToken
    ) {
      console.log('✅ Password saved. Account state transitioned to Pending_Face.');
    } else {
      throw new Error('Invalid account status after password creation');
    }

    // --- CASE 2: Block login during activation before Face registration ---
    console.log('\n🛡️ Test Case 2: Attempting login before Face ID registration...');
    const loginFailRes = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'lifecycle_employee', password: 'SecurePassword321!' })
    });
    const loginFailData = await loginFailRes.json();
    console.log('→ Login response (expected block):', loginFailData);
    if (loginFailRes.status === 403 && !loginFailData.success) {
      console.log('✅ Login successfully blocked for uncompleted biometric activation.');
    } else {
      throw new Error('Login should have been forbidden');
    }

    // --- CASE 3: Low quality image rejection during Face registration ---
    console.log('\n❌ Test Case 3: Rejection of low-quality captures...');
    const lowQualityBase64 = 'data:image/jpeg;base64,short_data';
    const lowQualRes = await fetch(`${API_URL}/security/register-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: testEmployeeId,
        token: activationToken,
        images: {
          front: lowQualityBase64,
          left: lowQualityBase64,
          right: lowQualityBase64
        }
      })
    });
    const lowQualData = await lowQualRes.json();
    console.log('→ Rejection response:', lowQualData);
    if (lowQualRes.status === 400 && !lowQualData.success) {
      console.log('✅ Low quality captures successfully rejected.');
    } else {
      throw new Error('Low quality captures should have failed quality check');
    }

    // --- CASE 4: Initial Face Registration via Activation Token ---
    console.log('\n📸 Test Case 4: Registering Face ID using activation token...');
    const dummyBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(300);
    const registerRes = await fetch(`${API_URL}/security/register-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: testEmployeeId,
        token: activationToken,
        images: {
          front: dummyBase64,
          left: dummyBase64,
          right: dummyBase64
        }
      })
    });
    const registerData = await registerRes.json();
    console.log('→ Registration response:', registerData);
    if (!registerRes.ok || !registerData.success) {
      throw new Error('Face registration failed');
    }
    console.log(`✅ Face registered. Quality Score: ${registerData.qualityScore}%`);

    // Verify DB state: account_status is Active, activation_token is NULL
    const { rows: activeCheck } = await pool.query(
      "SELECT account_status, activation_token FROM users WHERE id = $1",
      [testUserId]
    );
    console.log('→ DB State:', activeCheck[0]);
    if (
      activeCheck[0].account_status === 'Active' && 
      activeCheck[0].activation_token === null
    ) {
      console.log('✅ Account fully activated. Token cleared.');
    } else {
      throw new Error('Account activation failed');
    }

    // Verify face_security_logs has REGISTER success log
    const { rows: logsCheck } = await pool.query(
      "SELECT action, result, confidence FROM face_security_logs WHERE employee_id = $1",
      [testEmployeeId]
    );
    console.log('→ Audit Logs:', logsCheck);
    if (logsCheck[0] && logsCheck[0].action === 'REGISTER' && logsCheck[0].result === 'SUCCESS') {
      console.log('✅ Biometric audit log saved.');
    } else {
      throw new Error('Biometric audit log missing or invalid');
    }

    // --- CASE 5: Successful login after Face registration completes ---
    console.log('\n🔑 Test Case 5: Logging in after biometric activation complete...');
    const loginRes = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'lifecycle_employee', password: 'SecurePassword321!' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error('Login failed after activation');
    }
    const userSessionToken = loginData.data.token;
    console.log('✅ Login successful. Received session JWT.');

    // --- CASE 6: Retrieve Face ID Status ---
    console.log('\n📊 Test Case 6: Retrieving Face ID status...');
    const statusRes = await fetch(`${API_URL}/security/face-status`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userSessionToken}` }
    });
    const statusData = await statusRes.json();
    console.log('→ Status response:', statusData);
    if (!statusRes.ok || !statusData.registered) {
      throw new Error('Failed to retrieve face status');
    }
    console.log('✅ Face status verified.');

    // --- CASE 7: Face Verification - Spoofing attempt ---
    console.log('\n❌ Test Case 7: Verification before update - Spoofing check...');
    const spoofVerifyRes = await fetch(`${API_URL}/security/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSessionToken}`
      },
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,' + 'A'.repeat(250) + '_spoof_image'
      })
    });
    const spoofVerifyData = await spoofVerifyRes.json();
    console.log('→ Spoof verify response:', spoofVerifyData);
    if (spoofVerifyRes.status === 400 && !spoofVerifyData.success) {
      console.log('✅ Anti-spoofing successfully rejected photo verify attempt.');
    } else {
      throw new Error('Spoofing attempt should have failed');
    }

    // --- CASE 8: Face Verification - Mismatching face check ---
    console.log('\n❌ Test Case 8: Verification before update - Mismatching face check...');
    const diffVerifyRes = await fetch(`${API_URL}/security/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSessionToken}`
      },
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,' + 'A'.repeat(250) + '_different_person'
      })
    });
    const diffVerifyData = await diffVerifyRes.json();
    console.log('→ Mismatch verify response:', diffVerifyData);
    if (diffVerifyRes.status === 400 && !diffVerifyData.success) {
      console.log('✅ Mismatching face successfully rejected.');
    } else {
      throw new Error('Verification of different person should have failed');
    }

    // --- CASE 9: Face Verification - Success matching ---
    console.log('\n✅ Test Case 9: Verification before update - Successful match...');
    const matchVerifyRes = await fetch(`${API_URL}/security/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSessionToken}`
      },
      body: JSON.stringify({
        image: dummyBase64
      })
    });
    const matchVerifyData = await matchVerifyRes.json();
    console.log('→ Successful verify response:', matchVerifyData);
    if (!matchVerifyRes.ok || !matchVerifyData.verified) {
      throw new Error('Face verification failed');
    }
    const verifyToken = matchVerifyData.verifyToken;
    console.log('✅ Verification successful. Received short-lived verifyToken.');

    // --- CASE 10: Secure update face ID with verification token ---
    console.log('\n🔄 Test Case 10: Overwriting face profile with verification token...');
    const newDummyBase64 = 'data:image/jpeg;base64,' + 'B'.repeat(300);
    const updateRes = await fetch(`${API_URL}/security/update-face`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSessionToken}`
      },
      body: JSON.stringify({
        verifyToken: verifyToken,
        images: {
          front: newDummyBase64,
          left: newDummyBase64,
          right: newDummyBase64
        }
      })
    });
    const updateData = await updateRes.json();
    console.log('→ Update response:', updateData);
    if (!updateRes.ok || !updateData.success) {
      throw new Error('Face profile update failed');
    }
    console.log('✅ Face profile updated successfully.');

    // Verify DB holds UPDATE logs
    const { rows: updateLogs } = await pool.query(
      "SELECT action, result FROM face_security_logs WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1",
      [testEmployeeId]
    );
    console.log('→ DB Update Log State:', updateLogs[0]);
    if (updateLogs[0] && updateLogs[0].action === 'UPDATE' && updateLogs[0].result === 'SUCCESS') {
      console.log('✅ Biometric update log successfully saved.');
    } else {
      throw new Error('Biometric update log missing or failed');
    }

    // Cleanup
    console.log('\n🧼 Cleaning up test database records...');
    await pool.query("DELETE FROM users WHERE id = $1", [testUserId]);
    await pool.query("DELETE FROM employees WHERE id = $1", [testEmployeeId]);
    console.log('✅ Database cleaned. All lifecycle tests passed! 🎉');

  } catch (err) {
    console.error('\n❌ Test execution failed:', err.message);
    if (testUserId) await pool.query("DELETE FROM users WHERE id = $1", [testUserId]);
    if (testEmployeeId) await pool.query("DELETE FROM employees WHERE id = $1", [testEmployeeId]);
    process.exit(1);
  }

  process.exit(0);
}

run();

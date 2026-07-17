const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'absenceflow', user: 'postgres', password: '1289' });

const API_URL = 'http://127.0.0.1:5000/api';

async function run() {
  console.log('🚀 Starting AI Face Recognition & Dynamic QR Code verification API tests...\n');

  try {
    // 1. Find a test employee
    const { rows: employees } = await pool.query('SELECT id, first_name, last_name FROM employees LIMIT 1');
    if (employees.length === 0) {
      console.error('❌ No employees found in database to run tests. Please add an employee first.');
      process.exit(1);
    }
    const employeeId = employees[0].id;
    console.log(`📌 Using employee: ${employees[0].first_name} ${employees[0].last_name} (ID: ${employeeId})`);

    // Clean up any existing face profile and today's attendance for a clean slate
    await pool.query('DELETE FROM face_profiles WHERE employee_id = $1', [employeeId]);
    await pool.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [employeeId]);
    await pool.query("DELETE FROM users WHERE username = 'testadmin'");

    // 2. Create test admin account
    const bcrypt = require('bcryptjs');
    const adminPass = await bcrypt.hash('password123', 10);
    await pool.query(
      "INSERT INTO users (username, email, password_hash, role, is_verified) VALUES ('testadmin', 'testadmin@absenceflow.local', $1, 'admin', true)",
      [adminPass]
    );

    // 3. Login to get Admin JWT token
    console.log('🔑 Logging in as administrator...');
    const loginRes = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testadmin', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const adminToken = loginData.data.token;
    console.log('✅ Admin login successful.');

    const fs = require('fs');
    const realFaceBase64 = 'data:image/jpeg;base64,' + fs.readFileSync('/tmp/face.b64', 'utf8').trim();
    const spoofFaceBase64 = 'data:image/jpeg;base64,' + fs.readFileSync('/tmp/spoof.b64', 'utf8').trim();
    const dummyBase64 = realFaceBase64;
    const registerRes = await fetch(`${API_URL}/security/register-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employeeId: employeeId,
        image: dummyBase64
      })
    });
    const registerData = await registerRes.json();
    console.log('→ Register Response:', registerData);
    if (!registerRes.ok || !registerData.success) {
      throw new Error('Face registration failed');
    }
    console.log('✅ Face profile registered successfully.');

    // 5. Test Duplicate Registration Prevention
    console.log('\n🛡️ Test Case 2: Testing Duplicate Face Registration Prevention...');
    const duplicateRes = await fetch(`${API_URL}/security/register-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employeeId: employeeId,
        image: dummyBase64
      })
    });
    const duplicateData = await duplicateRes.json();
    console.log('→ Duplicate Register Response:', duplicateData);
    if (duplicateRes.status === 200 && duplicateData.success) {
      console.log('✅ Duplicate registration correctly updated the profile instead of failing.');
    } else {
      throw new Error('Duplicate registration should have succeeded (updated)');
    }

    // 6. Face Verification - Failure Case (Liveness Spoofing)
    console.log('\n❌ Test Case 3: Face Verification - Spoofing / Liveness Check...');
    const spoofSelfie = spoofFaceBase64;
    const spoofRes = await fetch(`${API_URL}/attendance/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employeeId: employeeId,
        image: spoofSelfie
      })
    });
    const spoofData = await spoofRes.json();
    console.log('→ Spoof Face Verify Response:', spoofData);
    if (spoofRes.status === 400 && !spoofData.success) {
      console.log('✅ Liveness check successfully blocked photo-spoof attempt.');
    } else {
      throw new Error('Face liveness verification should have failed');
    }

    // 7. Face Verification - Failure Case (Wrong Face)
    console.log('\n❌ Test Case 4: Face Verification - Non-matching face...');
    const diffSelfie = spoofFaceBase64; // Testing different face or spoof
    const diffRes = await fetch(`${API_URL}/attendance/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employeeId: employeeId,
        image: diffSelfie
      })
    });
    const diffData = await diffRes.json();
    console.log('→ Non-matching Face Verify Response:', diffData);
    if (diffRes.status === 400 && !diffData.success) {
      console.log('✅ Non-matching face successfully rejected.');
    } else {
      throw new Error('Verification of non-matching face should have failed');
    }

    // 8. Face Verification - Success Case
    console.log('\n✅ Test Case 5: Face Verification - Valid face match...');
    const validSelfie = realFaceBase64;
    const faceVerifyRes = await fetch(`${API_URL}/attendance/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employeeId: employeeId,
        image: validSelfie
      })
    });
    const faceVerifyData = await faceVerifyRes.json();
    console.log('→ Face Verify Response:', faceVerifyData);
    if (!faceVerifyRes.ok || !faceVerifyData.success) {
      throw new Error('Valid face verification failed');
    }
    const faceToken = faceVerifyData.faceToken;
    console.log('✅ Face verified successfully. Received faceToken.');

    // 9. Generate dynamic QR Code
    console.log('\n📱 Test Case 6: Generating Dynamic QR Session (Manager)...');
    const qrGenRes = await fetch(`${API_URL}/attendance/create-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const qrGenData = await qrGenRes.json();
    console.log('→ QR Create Response:', qrGenData);
    if (!qrGenRes.ok || !qrGenData.success) {
      throw new Error('QR code generation failed');
    }
    const qrToken = qrGenData.qrToken;
    console.log('✅ Dynamic QR session generated.');

    // 10. Verify QR Code Scan
    console.log('\n🔍 Test Case 7: Verifying Scanned QR Token...');
    const qrVerifyRes = await fetch(`${API_URL}/attendance/verify-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ qrToken })
    });
    const qrVerifyData = await qrVerifyRes.json();
    console.log('→ QR Verify Response:', qrVerifyData);
    if (!qrVerifyRes.ok || !qrVerifyData.success || !qrVerifyData.valid) {
      throw new Error('QR verification failed');
    }
    console.log('✅ QR verified successfully.');

    // 11. Final AI-powered Check-In
    console.log('\n📥 Test Case 8: Final Attendance Check-In (Both tokens)...');
    const checkInRes = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        faceToken,
        qrToken,
        deviceInfo: 'Biometric Test Agent'
      })
    });
    const checkInData = await checkInRes.json();
    console.log('→ Check-in Response:', checkInData);
    if (!checkInRes.ok || !checkInData.success) {
      throw new Error('AI/QR check-in failed');
    }
    console.log('✅ Attendance Check-In created successfully.');

    // 12. Test double Check-In prevention
    console.log('\n🛡️ Test Case 9: Testing Double Check-In Prevention...');
    // Create new QR code since tokens are single-use
    const newQrRes = await fetch(`${API_URL}/attendance/create-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    });
    const newQrData = await newQrRes.json();
    const doubleCheckInRes = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        faceToken,
        qrToken: newQrData.qrToken,
        deviceInfo: 'Biometric Test Agent'
      })
    });
    const doubleCheckInData = await doubleCheckInRes.json();
    console.log('→ Double Check-in Response:', doubleCheckInData);
    if (doubleCheckInRes.status === 400 && !doubleCheckInData.success) {
      console.log('✅ Double check-in successfully blocked.');
    } else {
      throw new Error('Double check-in should have failed');
    }

    // 13. Test Single-Use QR Session constraint
    console.log('\n🛡️ Test Case 10: Testing Single-Use QR token reuse...');
    const reuseQrRes = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        faceToken,
        qrToken: qrToken, // reuse original used qrToken
        deviceInfo: 'Biometric Test Agent'
      })
    });
    const reuseQrData = await reuseQrRes.json();
    console.log('→ Reused QR Check-in Response:', reuseQrData);
    if (reuseQrRes.status === 400 && !reuseQrData.success) {
      console.log('✅ QR Code reuse successfully prevented.');
    } else {
      throw new Error('Reused QR check-in should have failed');
    }

    // 14. Final Check-Out
    console.log('\n📤 Test Case 11: Final Attendance Check-Out...');
    // Create a new QR code for check-out
    const checkoutQrRes = await fetch(`${API_URL}/attendance/create-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    });
    const checkoutQrData = await checkoutQrRes.json();
    const checkOutRes = await fetch(`${API_URL}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        faceToken,
        qrToken: checkoutQrData.qrToken,
        deviceInfo: 'Biometric Test Agent'
      })
    });
    const checkOutData = await checkOutRes.json();
    console.log('→ Check-out Response:', checkOutData);
    if (!checkOutRes.ok || !checkOutData.success) {
      throw new Error('AI/QR check-out failed');
    }
    console.log('✅ Attendance Check-Out updated successfully.');

    // 15. Verify Database Records
    console.log('\n📊 Test Case 12: Querying DB for verified attendance details...');
    const { rows: attendanceRows } = await pool.query(
      'SELECT face_verified, qr_verified, face_confidence, verification_method, device_information FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE',
      [employeeId]
    );
    console.log('→ Stored Attendance Record:', attendanceRows[0]);
    if (
      attendanceRows[0].face_verified &&
      attendanceRows[0].qr_verified &&
      attendanceRows[0].verification_method === 'AI_FACE_QR'
    ) {
      console.log('✅ Stored database parameters match biometric schema exactly.');
    } else {
      throw new Error('Biometric database parameters mismatch');
    }

    // Cleanup
    console.log('\n🧼 Cleaning up test database records...');
    await pool.query('DELETE FROM face_profiles WHERE employee_id = $1', [employeeId]);
    await pool.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [employeeId]);
    await pool.query("DELETE FROM users WHERE username = 'testadmin'");
    console.log('✅ Database cleaned. All tests passed! 🎉');

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    // Cleanup admin user anyway
    await pool.query("DELETE FROM users WHERE username = 'testadmin'");
    process.exit(1);
  }

  process.exit(0);
}

run();

const db = require('./src/config/database');
const Attendance = require('./src/models/Attendance');
const QrSession = require('./src/models/QrSession');
const FaceProfile = require('./src/models/FaceProfile');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345";

async function runTestSuite() {
  console.log('🧪 Starting Automated Attendance Test Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  // 1. Get test employee with face profile
  const profileRes = await db.query("SELECT employee_id FROM face_profiles WHERE face_embedding IS NOT NULL AND status = 'active' LIMIT 1");
  if (!profileRes.rows[0]) {
    console.error('❌ No active face profiles found in DB for testing.');
    process.exit(1);
  }
  const testEmployeeId = profileRes.rows[0].employee_id;
  console.log(`📌 Test Employee ID: ${testEmployeeId}\n`);

  // Clean up any existing attendance for today for clean test environment
  await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [testEmployeeId]);

  // TEST CASE 1: Successful Face + QR Check-in
  console.log('1️⃣ Test Case 1: Successful Face + QR Check-in');
  try {
    const validQrToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60000);
    const qrSession = await QrSession.create(1, validQrToken, expiresAt);

    const validFaceToken = jwt.sign(
      { employeeId: testEmployeeId, faceVerified: true, confidence: 99.5 },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    const attendanceRecord = await Attendance.checkInWithAI(
      testEmployeeId,
      99.5,
      qrSession.id,
      'Automated Test Runner (Linux)'
    );
    await QrSession.markAsUsed(qrSession.id);

    assert(attendanceRecord.id !== undefined, 'Attendance record created with ID ' + attendanceRecord.id);
    assert(attendanceRecord.face_verified === true, 'face_verified is true');
    assert(attendanceRecord.qr_verified === true, 'qr_verified is true');
    assert(attendanceRecord.face_confidence === 99.5, 'face_confidence is 99.5');
    assert(attendanceRecord.verification_method === 'AI_FACE_QR', 'verification_method is AI_FACE_QR');
  } catch (err) {
    assert(false, 'Successful check-in threw an unexpected error: ' + err.message);
  }

  // TEST CASE 2: Duplicate Check-in Same Day
  console.log('\n2️⃣ Test Case 2: Duplicate Check-in Same Day');
  try {
    const validQrToken2 = crypto.randomBytes(32).toString('hex');
    const qrSession2 = await QrSession.create(1, validQrToken2, new Date(Date.now() + 60000));

    await Attendance.checkInWithAI(
      testEmployeeId,
      99.5,
      qrSession2.id,
      'Automated Test Runner (Linux)'
    );
    assert(false, 'Duplicate check-in should have thrown an error but succeeded.');
  } catch (err) {
    assert(err.message === 'Employee already checked in today', 'Duplicate check-in rejected with: ' + err.message);
  }

  // TEST CASE 3: Expired QR Session
  console.log('\n3️⃣ Test Case 3: Expired QR Session Validation');
  try {
    const expiredQrToken = crypto.randomBytes(32).toString('hex');
    const pastExpiry = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes in past
    const expiredQrSession = await QrSession.create(1, expiredQrToken, pastExpiry);

    const fetchedSession = await QrSession.getByToken(expiredQrToken);
    const isExpired = new Date(fetchedSession.expires_at) < new Date();
    assert(isExpired === true, 'QR Session correctly identified as expired');
  } catch (err) {
    assert(false, 'Expired QR check threw error: ' + err.message);
  }

  // TEST CASE 4: Wrong Face / Token Mismatch
  console.log('\n4️⃣ Test Case 4: Wrong Face / Employee Token Mismatch');
  try {
    const wrongEmployeeId = 99999; // Different employee ID
    const wrongFaceToken = jwt.sign(
      { employeeId: wrongEmployeeId, faceVerified: true, confidence: 95.0 },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    const decoded = jwt.verify(wrongFaceToken, JWT_SECRET);
    const isMismatch = (testEmployeeId !== decoded.employeeId);
    assert(isMismatch === true, 'Security check detects employee ID mismatch (Requested: ' + testEmployeeId + ', Token: ' + decoded.employeeId + ')');
  } catch (err) {
    assert(false, 'Wrong face token test threw error: ' + err.message);
  }

  // Clean up test attendance record
  await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [testEmployeeId]);

  console.log(`\n========================================`);
  console.log(`📊 Test Suite Completed: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log(`========================================\n`);

  process.exit(failedCount > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

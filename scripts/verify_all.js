async function testAll() {
  const base = 'http://localhost:5000/api';
  const results = [];

  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const mark = passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${testName}: ${details}`);
  }

  try {
    // 1. Authentication
    console.log('\n--- 1. Testing Authentication & Role Tokens ---');
    const s1Res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@example.com', password: 'password123' })
    });
    const s1 = await s1Res.json();
    record('Student 1 Login', s1Res.status === 200 && s1.user.name === 'imran hashmi' && s1.user.role === 'STUDENT', `Name: ${s1.user?.name}, Role: ${s1.user?.role}`);

    const s2Res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student2@example.com', password: 'password123' })
    });
    const s2 = await s2Res.json();
    record('Student 2 Login', s2Res.status === 200 && s2.user.name === 'Adolf Hitler' && s2.user.role === 'STUDENT', `Name: ${s2.user?.name}, Role: ${s2.user?.role}`);

    const m1Res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor1@example.com', password: 'password123' })
    });
    const m1 = await m1Res.json();
    record('Mentor 1 Login', m1Res.status === 200 && m1.user.name === 'Alexander thegreat' && m1.user.role === 'MENTOR', `Name: ${m1.user?.name}, Role: ${m1.user?.role}`);

    const m2Res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor2@example.com', password: 'password123' })
    });
    const m2 = await m2Res.json();
    record('Mentor 2 Login', m2Res.status === 200 && m2.user.name === 'goodboy Vedant' && m2.user.role === 'MENTOR', `Name: ${m2.user?.name}, Role: ${m2.user?.role}`);

    // Invalid Password
    const badLoginRes = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@example.com', password: 'wrongpassword' })
    });
    record('Invalid Password Rejection', badLoginRes.status === 401, `Status: ${badLoginRes.status}`);

    // Missing Token
    const unauthRes = await fetch(base + '/dashboard/summary');
    record('Unauthenticated Access Rejection', unauthRes.status === 401, `Status: ${unauthRes.status}`);

    // 2. Student Dashboard Summary Metrics
    console.log('\n--- 2. Testing Student Dashboard Summary Numbers ---');
    const sumRes = await fetch(base + '/dashboard/summary', {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    const sum = await sumRes.json();
    record('Summary Metrics API', sumRes.status === 200 && sum.lessonsCompleted > 0 && sum.totalLessons > 0 && sum.totalTimeFormatted && sum.overallProgress > 0,
      `Completed: ${sum.lessonsCompleted}/${sum.totalLessons}, Time: ${sum.totalTimeFormatted}, Progress: ${sum.overallProgress}%`);

    const courseSummary = sum.coursesProgress.map(c => `${c.title}: ${c.progressPercentage}%`).join(' | ');
    record('Course Progress Percentage Calculation', Array.isArray(sum.coursesProgress) && sum.coursesProgress.length === 3, courseSummary);

    // 3. Charts APIs
    console.log('\n--- 3. Testing Charts APIs ---');
    const tsRes = await fetch(base + '/dashboard/time-series', {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    const ts = await tsRes.json();
    const has30Days = Array.isArray(ts) && ts.length === 30;
    const totalMinutes = ts.reduce((a, b) => a + (b.minutes || 0), 0);
    record('30-Day Time-Series Line Chart Data', has30Days && totalMinutes > 0, `Days: ${ts.length}, Total Minutes: ${totalMinutes}`);

    const lsRes = await fetch(base + '/dashboard/lesson-status', {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    const ls = await lsRes.json();
    const donutSum = (ls.completed || 0) + (ls.inProgress || 0) + (ls.notStarted || 0);
    record('Lesson Status Donut Chart Data', lsRes.status === 200 && donutSum === sum.totalLessons,
      `Completed: ${ls.completed}, In Progress: ${ls.inProgress}, Not Started: ${ls.notStarted} (Sum: ${donutSum}/${sum.totalLessons})`);

    // 4. Lesson List & Detail
    console.log('\n--- 4. Testing Lesson List & Detail ---');
    const lessonsRes = await fetch(base + '/lessons', {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    const lessons = await lessonsRes.json();
    record('Curriculum Lesson List', lessonsRes.status === 200 && lessons.length === sum.totalLessons, `Returned ${lessons.length} lessons with status & courseName`);

    const firstLesson = lessons[0];
    const detailRes = await fetch(base + '/lessons/' + firstLesson.id, {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    const detail = await detailRes.json();
    record('Lesson Detail Modal API', detailRes.status === 200 && detail.id === firstLesson.id && detail.title && detail.description && Array.isArray(detail.recentActivities),
      `Title: ${detail.title}, Activities logged: ${detail.recentActivities?.length}`);

    // 5. Activity Event Tracking
    console.log('\n--- 5. Testing Activity Event Tracking ---');
    const targetLesson = lessons.find(l => l.status === 'NOT_STARTED') || lessons[lessons.length - 1];
    
    // A. Open lesson
    const openRes = await fetch(base + '/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s1.token },
      body: JSON.stringify({ lessonId: targetLesson.id, type: 'LESSON_OPENED', durationMinutes: 10 })
    });
    record('Record Activity: LESSON_OPENED', openRes.status === 201, `Status: ${openRes.status}`);

    // Verify status updated to IN_PROGRESS
    const targetDetailRes = await fetch(base + '/lessons/' + targetLesson.id, {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    const targetDetail = await targetDetailRes.json();
    record('Lesson Progress Updated to IN_PROGRESS', targetDetail.status === 'IN_PROGRESS' || targetDetail.status === 'COMPLETED', `Status: ${targetDetail.status}`);

    // B. Complete lesson
    const completeRes = await fetch(base + '/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s1.token },
      body: JSON.stringify({ lessonId: targetLesson.id, type: 'LESSON_COMPLETED', durationMinutes: 35 })
    });
    record('Record Activity: LESSON_COMPLETED', completeRes.status === 201, `Status: ${completeRes.status}`);

    const completedDetailRes = await fetch(base + '/lessons/' + targetLesson.id, {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    const completedDetail = await completedDetailRes.json();
    record('Lesson Progress Updated to COMPLETED', completedDetail.status === 'COMPLETED', `Status: ${completedDetail.status}, CompletedAt: ${completedDetail.completedAt}`);

    // 6. Mentor Cohort & Role Security Isolation
    console.log('\n--- 6. Testing Mentor Cohort & Role Isolation ---');
    const m1StudentsRes = await fetch(base + '/mentor/students', {
      headers: { 'Authorization': 'Bearer ' + m1.token }
    });
    const m1Students = await m1StudentsRes.json();
    const m1StudentNames = m1Students.map(s => s.name);
    record('Mentor 1 Cohort Isolation', m1Students.length === 3 && m1StudentNames.includes('imran hashmi') && m1StudentNames.includes('Adolf Hitler'),
      `Cohort: ${m1Students.length} students (${m1StudentNames.join(', ')})`);

    const m2StudentsRes = await fetch(base + '/mentor/students', {
      headers: { 'Authorization': 'Bearer ' + m2.token }
    });
    const m2Students = await m2StudentsRes.json();
    const m2StudentNames = m2Students.map(s => s.name);
    record('Mentor 2 Cohort Isolation', m2Students.length === 2 && m2StudentNames.includes('Noah Patel') && m2StudentNames.includes('Olivia Kim'),
      `Cohort: ${m2Students.length} students (${m2StudentNames.join(', ')})`);

    // Cross-mentor access restriction
    const unassignedStudentId = m2Students[0].id;
    const crossMentorRes = await fetch(base + `/mentor/students/${unassignedStudentId}/summary`, {
      headers: { 'Authorization': 'Bearer ' + m1.token }
    });
    record('Cross-Mentor Unauthorized Student Access Blocked', crossMentorRes.status === 403, `Student ID: ${unassignedStudentId}, Status: ${crossMentorRes.status} (Expected 403 Forbidden)`);

    // Mentor 1 viewing assigned student
    const assignedStudentId = m1Students[0].id;
    const legitMentorRes = await fetch(base + `/mentor/students/${assignedStudentId}/summary`, {
      headers: { 'Authorization': 'Bearer ' + m1.token }
    });
    record('Mentor Access to Assigned Student Authorized', legitMentorRes.status === 200, `Student ID: ${assignedStudentId}, Status: ${legitMentorRes.status} (Expected 200 OK)`);

    // Student trying to access mentor endpoint
    const studentToMentorRes = await fetch(base + '/mentor/students', {
      headers: { 'Authorization': 'Bearer ' + s1.token }
    });
    record('Student Access to Mentor Route Blocked', studentToMentorRes.status === 403, `Status: ${studentToMentorRes.status} (Expected 403 Forbidden)`);

    // Mentor trying to access student dashboard endpoint directly
    const mentorToStudentRes = await fetch(base + '/dashboard/summary', {
      headers: { 'Authorization': 'Bearer ' + m1.token }
    });
    record('Mentor Direct Access to Student Route Blocked', mentorToStudentRes.status === 403, `Status: ${mentorToStudentRes.status} (Expected 403 Forbidden)`);

    // 7. Frontend Proxy & Build
    console.log('\n--- 7. Testing Frontend Proxy & Live Server ---');
    const proxyLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@example.com', password: 'password123' })
    });
    record('Frontend Vite /api Proxy to Backend Port 5000', proxyLogin.status === 200, `Status: ${proxyLogin.status}`);

    // Summary
    const totalPassed = results.filter(r => r.passed).length;
    console.log(`\n===============================================`);
    console.log(`VERIFICATION COMPLETE: ${totalPassed}/${results.length} TESTS PASSED`);
    console.log(`===============================================`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

testAll();
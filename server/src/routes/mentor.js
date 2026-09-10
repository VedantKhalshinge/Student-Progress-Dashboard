const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get students assigned to this mentor
router.get('/students', authenticateToken, requireRole('MENTOR'), async (req, res) => {
  try {
    const mentorId = req.user.id;

    const students = await prisma.user.findMany({
      where: { mentorId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Compute stats for each student
    const result = await Promise.all(students.map(async (student) => {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id },
      });
      const enrolledCourseIds = enrollments.map((e) => e.courseId);

      const totalLessons = await prisma.lesson.count({
        where: { courseId: { in: enrolledCourseIds } },
      });

      const lessonsCompleted = await prisma.lessonProgress.count({
        where: { studentId: student.id, status: 'COMPLETED' },
      });

      const activities = await prisma.activity.findMany({
        where: { studentId: student.id },
      });
      const totalTimeMinutes = activities.reduce((acc, act) => acc + act.durationMinutes, 0);
      const hours = Math.floor(totalTimeMinutes / 60);
      const minutes = totalTimeMinutes % 60;
      
      const overallProgress = totalLessons === 0 ? 0 : Math.round((lessonsCompleted / totalLessons) * 100);

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        lessonsCompleted,
        totalLessons,
        overallProgress,
        totalTimeFormatted: `${hours}h ${minutes}m`
      };
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to verify student assignment
async function verifyMentorStudent(mentorId, studentId) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });
  if (!student || student.mentorId !== mentorId) {
    return null;
  }
  return student;
}

// Get a specific student's progress / summary
router.get('/students/:id/summary', authenticateToken, requireRole('MENTOR'), async (req, res) => {
  try {
    const mentorId = req.user.id;
    const studentId = parseInt(req.params.id);

    const student = await verifyMentorStudent(mentorId, studentId);
    if (!student) {
      return res.status(403).json({ error: 'Forbidden: Student not assigned to you' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const totalLessons = await prisma.lesson.count({
      where: { courseId: { in: enrolledCourseIds } },
    });

    const lessonsCompleted = await prisma.lessonProgress.count({
      where: { studentId, status: 'COMPLETED' },
    });

    const activities = await prisma.activity.findMany({
      where: { studentId },
    });
    const totalTimeMinutes = activities.reduce((acc, act) => acc + act.durationMinutes, 0);
    const hours = Math.floor(totalTimeMinutes / 60);
    const minutes = totalTimeMinutes % 60;
    const formattedTime = `${hours}h ${minutes}m`;

    const overallProgress = totalLessons === 0 ? 0 : Math.round((lessonsCompleted / totalLessons) * 100);

    const courses = await prisma.course.findMany({
      where: { id: { in: enrolledCourseIds } },
      include: { lessons: true },
    });

    const coursesProgress = await Promise.all(
      courses.map(async (course) => {
        const courseLessonIds = course.lessons.map((l) => l.id);
        const completedInCourse = await prisma.lessonProgress.count({
          where: { studentId, lessonId: { in: courseLessonIds }, status: 'COMPLETED' },
        });
        const totalInCourse = course.lessons.length;
        const progressPercentage = totalInCourse === 0 ? 0 : Math.round((completedInCourse / totalInCourse) * 100);

        return {
          id: course.id,
          title: course.title,
          lessonsCompleted: completedInCourse,
          totalLessons: totalInCourse,
          progressPercentage,
        };
      })
    );

    res.json({
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      lessonsCompleted,
      totalLessons,
      totalTimeFormatted: formattedTime,
      totalTimeMinutes,
      overallProgress,
      coursesEnrolled: enrolledCourseIds.length,
      coursesProgress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Backward compatibility alias for /progress
router.get('/students/:id/progress', authenticateToken, requireRole('MENTOR'), async (req, res) => {
  try {
    const mentorId = req.user.id;
    const studentId = parseInt(req.params.id);

    const student = await verifyMentorStudent(mentorId, studentId);
    if (!student) {
      return res.status(403).json({ error: 'Forbidden: Student not assigned to you' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const totalLessons = await prisma.lesson.count({
      where: { courseId: { in: enrolledCourseIds } },
    });

    const lessonsCompleted = await prisma.lessonProgress.count({
      where: { studentId, status: 'COMPLETED' },
    });

    const activities = await prisma.activity.findMany({
      where: { studentId },
    });
    const totalTimeMinutes = activities.reduce((acc, act) => acc + act.durationMinutes, 0);
    const hours = Math.floor(totalTimeMinutes / 60);
    const minutes = totalTimeMinutes % 60;

    const overallProgress = totalLessons === 0 ? 0 : Math.round((lessonsCompleted / totalLessons) * 100);

    const courses = await prisma.course.findMany({
      where: { id: { in: enrolledCourseIds } },
      include: { lessons: true },
    });

    const coursesProgress = await Promise.all(
      courses.map(async (course) => {
        const courseLessonIds = course.lessons.map((l) => l.id);
        const completedInCourse = await prisma.lessonProgress.count({
          where: { studentId, lessonId: { in: courseLessonIds }, status: 'COMPLETED' },
        });
        const totalInCourse = course.lessons.length;
        const progressPercentage = totalInCourse === 0 ? 0 : Math.round((completedInCourse / totalInCourse) * 100);

        return {
          id: course.id,
          title: course.title,
          lessonsCompleted: completedInCourse,
          totalLessons: totalInCourse,
          progressPercentage,
        };
      })
    );

    res.json({
      studentName: student.name,
      studentEmail: student.email,
      lessonsCompleted,
      totalLessons,
      totalTimeFormatted: `${hours}h ${minutes}m`,
      overallProgress,
      coursesProgress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Time series data for mentor's student
router.get('/students/:id/time-series', authenticateToken, requireRole('MENTOR'), async (req, res) => {
  try {
    const mentorId = req.user.id;
    const studentId = parseInt(req.params.id);

    const student = await verifyMentorStudent(mentorId, studentId);
    if (!student) {
      return res.status(403).json({ error: 'Forbidden: Student not assigned to you' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const activities = await prisma.activity.findMany({
      where: {
        studentId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const activityMap = {};
    for (const act of activities) {
      const dateStr = act.createdAt.toISOString().split('T')[0];
      if (!activityMap[dateStr]) activityMap[dateStr] = 0;
      activityMap[dateStr] += act.durationMinutes;
    }

    const timeSeries = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      timeSeries.push({
        date: dateStr,
        minutes: activityMap[dateStr] || 0,
      });
    }

    res.json(timeSeries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lesson status breakdown for mentor's student
router.get('/students/:id/lesson-status', authenticateToken, requireRole('MENTOR'), async (req, res) => {
  try {
    const mentorId = req.user.id;
    const studentId = parseInt(req.params.id);

    const student = await verifyMentorStudent(mentorId, studentId);
    if (!student) {
      return res.status(403).json({ error: 'Forbidden: Student not assigned to you' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const totalLessons = await prisma.lesson.count({
      where: { courseId: { in: enrolledCourseIds } },
    });

    const progressRecords = await prisma.lessonProgress.findMany({
      where: { studentId },
    });

    let completed = 0;
    let inProgress = 0;

    progressRecords.forEach((pr) => {
      if (pr.status === 'COMPLETED') completed++;
      if (pr.status === 'IN_PROGRESS') inProgress++;
    });

    const notStarted = Math.max(0, totalLessons - (completed + inProgress));

    res.json({
      completed,
      inProgress,
      notStarted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lessons list for mentor's student
router.get('/students/:id/lessons', authenticateToken, requireRole('MENTOR'), async (req, res) => {
  try {
    const mentorId = req.user.id;
    const studentId = parseInt(req.params.id);

    const student = await verifyMentorStudent(mentorId, studentId);
    if (!student) {
      return res.status(403).json({ error: 'Forbidden: Student not assigned to you' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const lessons = await prisma.lesson.findMany({
      where: { courseId: { in: enrolledCourseIds } },
      include: { course: true },
      orderBy: [
        { courseId: 'asc' },
        { order: 'asc' }
      ]
    });

    const progressRecords = await prisma.lessonProgress.findMany({
      where: { studentId },
    });
    const progressMap = {};
    progressRecords.forEach((pr) => {
      progressMap[pr.lessonId] = pr;
    });

    const result = lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      courseName: l.course.title,
      status: progressMap[l.id]?.status || 'NOT_STARTED',
      completedAt: progressMap[l.id]?.completedAt || null,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

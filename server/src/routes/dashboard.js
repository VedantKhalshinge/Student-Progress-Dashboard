const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get summary stats for a student
router.get('/summary', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get courses enrolled
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
    });
    const coursesEnrolled = enrollments.length;

    // Get all lessons for these courses to know total lessons
    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const totalLessons = await prisma.lesson.count({
      where: { courseId: { in: enrolledCourseIds } },
    });

    // Get lessons completed
    const lessonsCompleted = await prisma.lessonProgress.count({
      where: { studentId, status: 'COMPLETED' },
    });

    // Get total time spent (from activities)
    const activities = await prisma.activity.findMany({
      where: { studentId },
    });
    const totalTimeMinutes = activities.reduce((acc, act) => acc + act.durationMinutes, 0);
    const hours = Math.floor(totalTimeMinutes / 60);
    const minutes = totalTimeMinutes % 60;
    const formattedTime = `${hours}h ${minutes}m`;

    // Overall progress
    const overallProgress = totalLessons === 0 ? 0 : Math.round((lessonsCompleted / totalLessons) * 100);

    // Course progress details
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
      lessonsCompleted,
      totalLessons,
      totalTimeFormatted: formattedTime,
      totalTimeMinutes,
      overallProgress,
      coursesEnrolled,
      coursesProgress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Time series data
router.get('/time-series', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const activities = await prisma.activity.findMany({
      where: {
        studentId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Create a map of date string -> minutes
    const activityMap = {};
    for (const act of activities) {
      // YYYY-MM-DD
      const dateStr = act.createdAt.toISOString().split('T')[0];
      if (!activityMap[dateStr]) activityMap[dateStr] = 0;
      activityMap[dateStr] += act.durationMinutes;
    }

    // Fill in missing days with 0
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

// Lesson status for donut chart
router.get('/lesson-status', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id;

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

    // If a lesson doesn't have a progress record, it's NOT_STARTED
    const notStarted = totalLessons - (completed + inProgress);

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

module.exports = router;

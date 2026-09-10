const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all lessons for the logged-in student
router.get('/', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id;

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

    // Merge status into lessons
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

// Get details for a specific lesson
router.get('/:id', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const lessonId = parseInt(req.params.id);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Access denied: not enrolled in this course' });
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
    });

    const activities = await prisma.activity.findMany({
      where: { studentId, lessonId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      courseName: lesson.course.title,
      courseId: lesson.courseId,
      status: progress?.status || 'NOT_STARTED',
      completedAt: progress?.completedAt || null,
      recentActivities: activities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

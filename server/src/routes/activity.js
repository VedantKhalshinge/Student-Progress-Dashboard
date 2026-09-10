const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { lessonId, type, durationMinutes } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Activity type is required' });
    }

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId: lesson.courseId,
          },
        },
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Not enrolled in the course for this lesson' });
      }

      // Handle lesson completion
      if (type === 'LESSON_COMPLETED') {
        await prisma.lessonProgress.upsert({
          where: { studentId_lessonId: { studentId, lessonId } },
          update: { status: 'COMPLETED', completedAt: new Date() },
          create: { studentId, lessonId, status: 'COMPLETED', completedAt: new Date() },
        });
      } else if (type === 'LESSON_OPENED') {
        // If not started, set to IN_PROGRESS
        const progress = await prisma.lessonProgress.findUnique({
          where: { studentId_lessonId: { studentId, lessonId } }
        });
        if (!progress || progress.status === 'NOT_STARTED') {
          await prisma.lessonProgress.upsert({
            where: { studentId_lessonId: { studentId, lessonId } },
            update: { status: 'IN_PROGRESS' },
            create: { studentId, lessonId, status: 'IN_PROGRESS' },
          });
        }
      }
    }

    const activity = await prisma.activity.create({
      data: {
        studentId,
        lessonId: lessonId || null,
        type,
        durationMinutes: durationMinutes || 0,
      },
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

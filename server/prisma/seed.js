const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.activity.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  console.log('Creating mentors...');
  const mentor1 = await prisma.user.create({
    data: {
      name: 'Alexander thegreat',
      email: 'mentor1@example.com',
      password: passwordHash,
      role: 'MENTOR'
    },
  });

  const mentor2 = await prisma.user.create({
    data: {
      name: 'goodboy Vedant',
      email: 'mentor2@example.com',
      password: passwordHash,
      role: 'MENTOR'
    },
  });

  console.log('Creating students...');
  const studentData = [
    { name: 'imran hashmi', email: 'student1@example.com', mentorId: mentor1.id },
    { name: 'Adolf Hitler', email: 'student2@example.com', mentorId: mentor1.id },
    { name: 'Sophia Rodriguez', email: 'student3@example.com', mentorId: mentor1.id },
    { name: 'Noah Patel', email: 'student4@example.com', mentorId: mentor2.id },
    { name: 'Olivia Kim', email: 'student5@example.com', mentorId: mentor2.id },
  ];

  const students = [];
  for (const s of studentData) {
    const student = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: passwordHash,
        role: 'STUDENT',
        mentorId: s.mentorId,
      },
    });
    students.push(student);
  }

  console.log('Creating courses and lessons...');
  const coursesData = [
    {
      title: 'Full Stack JavaScript',
      description: 'Master modern JavaScript, ES6+, asynchronous programming, and DOM manipulation.',
      lessons: [
        { title: 'JavaScript Syntax & Primitive Types', description: 'Core primitives, operators, and basic expression evaluation in JavaScript.' },
        { title: 'Functions, Scope & Closures', description: 'Deep dive into execution context, lexical scoping, closures, and arrow functions.' },
        { title: 'Arrays, Objects & Modern ES6 Destructuring', description: 'Iterators, spread operators, object destructuring, and immutable patterns.' },
        { title: 'Asynchronous JS: Promises & Async/Await', description: 'Handling concurrency, microtasks, event loops, and error propagation.' },
        { title: 'DOM Manipulation & Event Handling', description: 'Querying DOM elements, event bubbling, delegation, and DOM mutations.' },
        { title: 'Fetch API & REST Integrations', description: 'Making HTTP GET/POST requests, parsing JSON, handling status codes.' },
        { title: 'Error Handling & Debugging Techniques', description: 'Try/catch blocks, custom errors, browser DevTools, and debugging workflows.' },
        { title: 'Node.js Basics & Module System', description: 'CommonJS vs ESM modules, file system operations, and process environment.' },
        { title: 'Express.js Fundamentals & Routing', description: 'Building RESTful APIs with Express, middleware pipeline, and route parameters.' },
        { title: 'Full Stack Project: Interactive Dashboard', description: 'Connecting a client frontend with an Express API backend end-to-end.' },
      ],
    },
    {
      title: 'Python for Data & Backend',
      description: 'Comprehensive Python programming from fundamentals to object-oriented design and API development.',
      lessons: [
        { title: 'Python Basics, Syntax & Control Flow', description: 'Indentation, conditionals, while/for loops, and list comprehensions.' },
        { title: 'Data Structures: Lists, Tuples, Dictionaries & Sets', description: 'Mastering built-in Python collections and algorithm performance.' },
        { title: 'Object-Oriented Programming in Python', description: 'Classes, encapsulation, inheritance, polymorphism, and dunder methods.' },
        { title: 'File I/O, Serialization & Working with JSON', description: 'Reading/writing files, parsing CSV, handling structured JSON data safely.' },
        { title: 'Modules, Packages & Virtual Environments', description: 'Organizing code into reusable packages and managing dependencies with pip.' },
        { title: 'Data Analysis with Pandas & NumPy', description: 'DataFrames, series, indexing, vector operations, and data cleaning.' },
        { title: 'FastAPI & RESTful Web Services', description: 'Creating high-performance APIs with Pydantic schemas and auto-generated docs.' },
        { title: 'Database Connectivity & ORM (SQLAlchemy)', description: 'Relational data modeling, migrations, queries, and connection pools.' },
      ],
    },
    {
      title: 'Modern UI Engineering with React',
      description: 'Build fast, responsive, component-driven user interfaces using modern React 19 and Vite.',
      lessons: [
        { title: 'React Core Concepts & JSX Architecture', description: 'Virtual DOM, component hierarchy, declarative rendering, and JSX syntax.' },
        { title: 'State Management with useState & useReducer', description: 'Managing local component state and predictable reducer dispatch workflows.' },
        { title: 'Side Effects & Lifecycle with useEffect', description: 'Data fetching, subscription cleanup, race condition handling in effects.' },
        { title: 'Custom Hooks & Reusable Logic Patterns', description: 'Extracting stateful business logic into reusable custom React hooks.' },
        { title: 'Context API & Global State Sharing', description: 'Avoiding prop drilling with React Context providers and consumers.' },
        { title: 'Data Visualization & Charting with Recharts', description: 'Building interactive line charts, donut charts, and responsive SVG graphs.' },
        { title: 'Performance Optimization & Memoization', description: 'useMemo, useCallback, React.memo, and preventing wasteful re-renders.' },
        { title: 'Production Deployment & Build Pipelines', description: 'Configuring Vite bundler, environment flags, and CI/CD deployment.' },
      ],
    },
  ];

  const courses = [];
  for (const cData of coursesData) {
    const course = await prisma.course.create({
      data: {
        title: cData.title,
        description: cData.description,
        lessons: {
          create: cData.lessons.map((l, index) => ({
            title: l.title,
            description: l.description,
            order: index + 1,
          })),
        },
      },
      include: { lessons: true },
    });
    courses.push(course);
  }

  console.log('Enrolling students, setting progress, and generating 30 days of activity...');

  const studentProfiles = [
    { completedRatio: 0.70, inProgressCount: 2, activityIntensity: 1.2 },
    { completedRatio: 0.50, inProgressCount: 2, activityIntensity: 1.0 },
    { completedRatio: 0.35, inProgressCount: 1, activityIntensity: 0.8 },
    { completedRatio: 0.60, inProgressCount: 2, activityIntensity: 1.1 },
    { completedRatio: 0.25, inProgressCount: 2, activityIntensity: 0.7 },
  ];

  const now = new Date();

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const profile = studentProfiles[sIdx];

    for (const course of courses) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id,
        },
      });

      const totalLessons = course.lessons.length;
      const numCompleted = Math.round(totalLessons * profile.completedRatio);
      const numInProgress = profile.inProgressCount;

      for (let i = 0; i < totalLessons; i++) {
        const lesson = course.lessons[i];
        let status = 'NOT_STARTED';
        let completedAt = null;

        if (i < numCompleted) {
          status = 'COMPLETED';
          const daysAgo = Math.floor(Math.random() * 26) + 1;
          completedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        } else if (i < numCompleted + numInProgress) {
          status = 'IN_PROGRESS';
        }

        await prisma.lessonProgress.create({
          data: {
            studentId: student.id,
            lessonId: lesson.id,
            status,
            completedAt,
          },
        });
      }
    }

    // Generate continuous activity logs for the last 30 days
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const didStudy = (dayOffset % 7 === 0 && dayOffset !== 0) ? Math.random() > 0.6 : Math.random() > 0.2;

      if (didStudy) {
        const sessionCount = Math.floor(Math.random() * 2) + 1;
        for (let sess = 0; sess < sessionCount; sess++) {
          const randomCourse = courses[Math.floor(Math.random() * courses.length)];
          const randomLesson = randomCourse.lessons[Math.floor(Math.random() * randomCourse.lessons.length)];
          
          const sessionTypes = ['STUDY_SESSION', 'LESSON_OPENED', 'LESSON_COMPLETED'];
          const type = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
          const baseDuration = type === 'STUDY_SESSION' ? 35 : (type === 'LESSON_COMPLETED' ? 45 : 15);
          const duration = Math.round((baseDuration + Math.floor(Math.random() * 25)) * profile.activityIntensity);

          const sessionTime = new Date(targetDate);
          sessionTime.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 59));

          await prisma.activity.create({
            data: {
              studentId: student.id,
              lessonId: randomLesson.id,
              type,
              durationMinutes: duration,
              createdAt: sessionTime,
            },
          });
        }
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

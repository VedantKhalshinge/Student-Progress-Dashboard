/**
 * Student Progress Dashboard API Backend
 * @author Vedant Khalshinge (https://github.com/VedantKhalshinge)
 * @license MIT
 * Copyright (c) 2026 Vedant Khalshinge. All rights reserved.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/mentor', require('./routes/mentor'));

app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Report = require('../models/Report');

const fallbackUsers = [];
const fallbackReports = [];

function seedDemoUser() {
  const demoEmail = 'demo@fpds.ai';
  const exists = fallbackUsers.some((user) => user.email === demoEmail);

  if (!exists) {
    fallbackUsers.push({
      _id: new mongoose.Types.ObjectId(),
      name: 'Demo Analyst',
      email: demoEmail,
      password: bcrypt.hashSync('Demo123!', 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

seedDemoUser();

function buildUserPayload(user) {
  return {
    id: user._id.toString ? user._id.toString() : String(user._id),
    name: user.name,
    email: user.email,
  };
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function createUser({ name, email, password }) {
  if (isMongoConnected()) {
    return User.create({ name, email, password });
  }

  const exists = fallbackUsers.find((user) => user.email === email);
  if (exists) {
    const error = new Error('User already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = {
    _id: new mongoose.Types.ObjectId(),
    name,
    email,
    password,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  fallbackUsers.push(user);
  return user;
}

async function findUserByEmail(email) {
  if (isMongoConnected()) {
    return User.findOne({ email });
  }

  return fallbackUsers.find((user) => user.email === email) || null;
}

async function saveReport(payload) {
  if (isMongoConnected()) {
    return Report.create(payload);
  }

  const report = {
    _id: new mongoose.Types.ObjectId(),
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  fallbackReports.unshift(report);
  return report;
}

async function listReports(userId) {
  if (isMongoConnected()) {
    return Report.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  }

  return fallbackReports.filter((report) => String(report.userId) === String(userId));
}

function signToken(user) {
  return jwt.sign(buildUserPayload(user), process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d',
  });
}

async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

module.exports = {
  buildUserPayload,
  createUser,
  findUserByEmail,
  hashPassword,
  saveReport,
  signToken,
  verifyPassword,
  listReports,
};

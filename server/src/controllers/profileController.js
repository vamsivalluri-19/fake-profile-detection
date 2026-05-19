const { body, validationResult } = require('express-validator');
const { predictProfile } = require('../utils/aiClient');
const { listReports, saveReport } = require('../utils/storage');

const detectValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('followersCount').isFloat({ min: 0 }).toFloat().withMessage('Followers count must be a number'),
  body('followingCount').isFloat({ min: 0 }).toFloat().withMessage('Following count must be a number'),
  body('numberOfPosts').isFloat({ min: 0 }).toFloat().withMessage('Posts count must be a number'),
  body('bio').optional().isString(),
  body('engagementRate').isFloat({ min: 0 }).toFloat().withMessage('Engagement rate must be a number'),
  body('accountAge').isFloat({ min: 0 }).toFloat().withMessage('Account age must be a number'),
  body('instagramUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('twitterUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('linkedinUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('githubUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('snapchatUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('telegramUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('contactNumber').optional({ nullable: true, checkFalsy: true }).isString(),
  body('websiteUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('tiktokUrl').optional({ nullable: true, checkFalsy: true }).isString(),
  body('verifiedStatus').isBoolean().toBoolean().withMessage('Verified status must be true or false'),
  body('profilePictureAvailability').isBoolean().toBoolean().withMessage('Profile picture availability must be true or false'),
];

async function detectProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const payload = req.body;
    const prediction = await predictProfile(payload);
    const report = await saveReport({
      userId: req.user?.id,
      input: payload,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      riskLevel: prediction.riskLevel,
      reasons: prediction.reasons,
      modelBreakdown: prediction.modelBreakdown || {},
    });

    return res.status(201).json({
      message: 'Profile analyzed successfully',
      result: prediction,
      report,
    });
  } catch (error) {
    next(error);
  }
}

async function getReports(req, res, next) {
  try {
    const reports = await listReports(req.user?.id);
    res.json({ reports });
  } catch (error) {
    next(error);
  }
}

async function getMetrics(req, res, next) {
  try {
    const reports = await listReports(req.user?.id);
    const total = reports.length || 0;
    const fakeCount = reports.filter((r) => r.prediction === 'Fake').length;
    const realCount = total - fakeCount;
    const avgConfidence = total ? Math.round(reports.reduce((s, r) => s + (r.confidence || 0), 0) / total) : 0;

    // recent fake rate based on the most recent 20 reports
    const recent = reports.slice(0, 20);
    const recentFakeRate = recent.length ? Math.round((recent.filter((r) => r.prediction === 'Fake').length / recent.length) * 100) : 0;

    // build a 7-day trend (dates descending from oldest to newest)
    const now = new Date();
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const dayReports = reports.filter((r) => {
        try {
          return String(new Date(r.createdAt).toISOString().slice(0, 10)) === dayKey;
        } catch (e) {
          return false;
        }
      });
      const dayFake = dayReports.filter((r) => r.prediction === 'Fake').length;
      const dayReal = dayReports.filter((r) => r.prediction === 'Real').length;
      trends.push({ date: dayKey, fake: dayFake, real: dayReal, total: dayReports.length });
    }

    res.json({ metrics: { total, fakeCount, realCount, avgConfidence, recentFakeRate, trends } });
  } catch (error) {
    next(error);
  }
}

module.exports = { detectValidation, detectProfile, getReports, getMetrics };

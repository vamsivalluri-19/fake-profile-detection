const axios = require('axios');

function buildFallbackResult(input) {
  const followers = Number(input.followersCount || 0);
  const following = Math.max(Number(input.followingCount || 0), 1);
  const posts = Number(input.numberOfPosts || 0);
  const engagementRate = Number(input.engagementRate || 0);
  const accountAge = Number(input.accountAge || 0);
  const verified = Boolean(input.verifiedStatus);
  const hasPicture = Boolean(input.profilePictureAvailability);
  const username = String(input.username || '').toLowerCase();

  function usernameHasSuspiciousNumber(name) {
    const numSeqs = name.match(/\d{4,}/g) || [];
    if (numSeqs.length === 0) return false;
    const currentYear = new Date().getFullYear();
    for (const seq of numSeqs) {
      const n = parseInt(seq, 10);
      if (isNaN(n)) return true;
      if (n < 1900 || n > currentYear) return true;
      // otherwise treat as year-like and ignore
    }
    return false;
  }

  let riskScore = 0;
  if (followers / following < 0.2) riskScore += 22;
  if (posts < 5) riskScore += 16;
  if (accountAge < 6) riskScore += 18;
  if (engagementRate < 1) riskScore += 18;
  if (!verified) riskScore += 8;
  if (!hasPicture) riskScore += 10;
  if (usernameHasSuspiciousNumber(username)) riskScore += 8;

  const confidence = Math.max(58, Math.min(96, riskScore + 32));
  const prediction = riskScore >= 50 ? 'Fake' : 'Real';
  const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';
  const reasons = [];

  if (followers / following < 0.2) reasons.push('Low followers-to-following ratio');
  if (posts < 5) reasons.push('Very limited post history');
  if (accountAge < 6) reasons.push('Very new account');
  if (engagementRate < 1) reasons.push('Weak engagement rate');
  if (!verified) reasons.push('Not verified');
  if (!hasPicture) reasons.push('No profile picture');
  if (usernameHasSuspiciousNumber(username)) reasons.push('Suspicious username pattern');

  return {
    prediction,
    confidence,
    riskLevel,
    reasons: reasons.length ? reasons : ['Profile metrics appear normal'],
    modelBreakdown: { fallback: true },
  };
}

async function predictProfile(input) {
  const serviceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    const response = await axios.post(
      `${serviceUrl.replace(/\/$/, '')}/predict`,
      input,
      {
        timeout: 6000,
      }
    );

    return response.data;
  } catch (error) {
    console.warn('AI service unavailable, using fallback scoring.');
    return buildFallbackResult(input);
  }
}

module.exports = { predictProfile };

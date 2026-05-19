const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    input: { type: Object, required: true },
    prediction: { type: String, required: true },
    confidence: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    reasons: [{ type: String }],
    modelBreakdown: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);

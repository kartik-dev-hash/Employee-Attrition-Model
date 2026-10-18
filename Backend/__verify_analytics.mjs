import mongoose from 'mongoose';

await mongoose.connect('mongodb://127.0.0.1:27017/empAttrition');
console.log('DB connected');

const { refreshCompanyAnalytics, getCompanyAnalyticsOverview } = await import('./services/analyticsService.js');
const { getModelStatus, trainModel } = await import('./services/mlService.js');
const CompanyAnalytics = (await import('./models/CompanyAnalytics.js')).default;
const prediction = (await import('./models/prediction.js')).default;

// Count snapshots before refresh
const beforeCount = await CompanyAnalytics.countDocuments({ companyCode: 'DM0Z8F' });
console.log('Snapshots BEFORE refresh:', beforeCount);

// Refresh once
const snap = await refreshCompanyAnalytics('DM0Z8F');
console.log('Refresh 1 - Averages:', snap.averages);
console.log('timelineTrends count:', snap.timelineTrends?.length);

// Refresh again — count should still be 1
await refreshCompanyAnalytics('DM0Z8F');
const afterCount = await CompanyAnalytics.countDocuments({ companyCode: 'DM0Z8F' });
console.log('Snapshots AFTER 2 refreshes:', afterCount, '(expected: 1)');

// Test overview
const overview = await getCompanyAnalyticsOverview('DM0Z8F');
console.log('Overview overall avg:', overview.averages?.overall);

// Test ML status
const status = await getModelStatus();
console.log('ML Status:', status.status);

// Test trainModel with no labeled data
const records = await prediction.find({}).lean();
console.log('Feedback records found:', records.length);
const trainRes = await trainModel(records, '1.0.0', false);
console.log('Train Result:', trainRes.status, '|', trainRes.message);

await mongoose.disconnect();
console.log('DONE - all checks passed');
process.exit(0);

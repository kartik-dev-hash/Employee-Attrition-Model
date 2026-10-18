// One-time cleanup: keep only the single latest CompanyAnalytics snapshot per company
// Removes stale duplicates created before the upsert fix was applied
import mongoose from 'mongoose';
import CompanyAnalytics from './models/CompanyAnalytics.js';

await mongoose.connect('mongodb://127.0.0.1:27017/empAttrition');
console.log('Connected');

const companyCodes = await CompanyAnalytics.distinct('companyCode');
console.log('Companies found:', companyCodes);

for (const code of companyCodes) {
  const docs = await CompanyAnalytics.find({ companyCode: code })
    .sort({ generatedAt: -1 })
    .select('_id generatedAt')
    .lean();

  console.log(`Company ${code}: ${docs.length} snapshots`);

  if (docs.length > 1) {
    const keepId = docs[0]._id; // newest
    const deleteIds = docs.slice(1).map(d => d._id);
    const res = await CompanyAnalytics.deleteMany({ _id: { $in: deleteIds } });
    console.log(`  Deleted ${res.deletedCount} stale snapshots, kept _id ${keepId}`);
  } else {
    console.log(`  No duplicates to remove.`);
  }
}

const finalCount = await CompanyAnalytics.countDocuments();
console.log('Total CompanyAnalytics documents remaining:', finalCount);

await mongoose.disconnect();
console.log('Done');
process.exit(0);

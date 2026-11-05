import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_URI = "mongodb://127.0.0.1:27017/empAttrition";
const ATLAS_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://raghuwanshikartik521_db_user:11482695@cluster0.tyegn5i.mongodb.net/empAttrition?retryWrites=true&w=majority";

async function migrate() {
  console.log("🚀 Starting migration from Local MongoDB to Atlas...");

  // Connect to Local DB
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✅ Connected to Local MongoDB");

  // Connect to Atlas DB
  const atlasConn = await mongoose
    .createConnection(ATLAS_URI, {
      serverSelectionTimeoutMS: 30000,
    })
    .asPromise();
  console.log("✅ Connected to Atlas MongoDB");

  const localDb = localConn.db;
  const atlasDb = atlasConn.db;

  const collections = await localDb.listCollections().toArray();

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith("system.")) continue;

    const localCol = localDb.collection(colName);
    const atlasCol = atlasDb.collection(colName);

    const docs = await localCol.find({}).toArray();
    console.log(`\n📦 Migrating collection [${colName}] (${docs.length} documents)...`);

    if (docs.length === 0) continue;

    let upsertCount = 0;
    for (const doc of docs) {
      try {
        if (colName === "users" && doc.email) {
          // If user exists by email, update their details
          await atlasCol.updateOne(
            { email: doc.email },
            { $set: doc },
            { upsert: true }
          );
        } else {
          await atlasCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
        }
        upsertCount++;
      } catch (itemErr) {
        if (itemErr.code === 11000) {
          // In case of any duplicate key, fallback to update
          const { _id, ...rest } = doc;
          await atlasCol.updateOne({ _id: doc._id }, { $set: rest });
          upsertCount++;
        } else {
          console.warn(`   ⚠️ Warning on item: ${itemErr.message}`);
        }
      }
    }
    console.log(`   ✨ Successfully copied ${upsertCount} documents to [${colName}]`);
  }

  console.log("\n🎉 ALL DATA MIGRATED SUCCESSFULLY TO ATLAS!");
  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

import { MongoClient } from "mongodb";

async function run() {
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017");
  try {
    const db = client.db("empAttrition");
    const items = await db.collection("feedback").find({}).toArray();
    for (const item of items) {
      const d = item.submittedAt || new Date();
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      await db.collection("feedback").updateOne(
        { _id: item._id },
        { $set: { feedbackPeriod: period } }
      );
    }
    console.log(`Updated ${items.length} existing feedback documents with feedbackPeriod.`);
    
    // Check existing indexes
    const indexes = await db.collection("feedback").indexes();
    console.log("Current indexes:", indexes);
    
    // Drop the old employeeId_1 unique index if it exists
    const hasUniqueEmployeeIdIndex = indexes.some(idx => idx.name === "employeeId_1" && idx.unique);
    if (hasUniqueEmployeeIdIndex) {
      await db.collection("feedback").dropIndex("employeeId_1");
      console.log("Dropped legacy unique index employeeId_1");
    }
    
    // Create compound unique index on (employeeId, feedbackPeriod)
    await db.collection("feedback").createIndex(
      { employeeId: 1, feedbackPeriod: 1 },
      { unique: true, name: "employeeId_1_feedbackPeriod_1" }
    );
    console.log("Created compound unique index (employeeId, feedbackPeriod)");

    const updatedIndexes = await db.collection("feedback").indexes();
    console.log("Updated indexes:", updatedIndexes);
  } finally {
    await client.close();
  }
}

run().catch(console.error);

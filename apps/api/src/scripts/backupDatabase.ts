import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import dotenv from "dotenv";
import mongoose from "mongoose";

const projectRoot = process.env.INIT_CWD ?? process.cwd();

dotenv.config({
  path: resolve(projectRoot, "apps/api/.env")
});

type BackupMetadata = {
  database: string;
  exportedAt: string;
  format: "mongodb-extended-json";
  version: 1;
};

type DatabaseBackup = {
  metadata: BackupMetadata;
  collections: Record<string, unknown[]>;
};

const backupDatabase = async (): Promise<void> => {
  // Import after dotenv has loaded MONGODB_URI.
  const { connectToDatabase, disconnectFromDatabase } = await import("../db");

  try {
    await connectToDatabase();

    const database = mongoose.connection.db;

    if (!database) {
      throw new Error("MongoDB connection is not available.");
    }

    const collectionInfos = await database.listCollections({}, { nameOnly: true }).toArray();

    const collections: Record<string, unknown[]> = {};

    for (const { name } of collectionInfos) {
      const documents = await database.collection(name).find({}).toArray();

      collections[name] = documents;

      console.log(
        `Exported ${documents.length} document${documents.length === 1 ? "" : "s"} from "${name}".`
      );
    }

    const backup: DatabaseBackup = {
      metadata: {
        database: database.databaseName,
        exportedAt: new Date().toISOString(),
        format: "mongodb-extended-json",
        version: 1
      },
      collections
    };

    const outputPath = resolve(projectRoot, "app_data.json");

    const serializedBackup = mongoose.mongo.BSON.EJSON.stringify(backup, null, 2, {
      relaxed: false
    });

    await writeFile(outputPath, `${serializedBackup}\n`, "utf8");

    console.log(`Database backup saved to ${outputPath}`);
  } finally {
    await disconnectFromDatabase();
  }
};

backupDatabase().catch((error: unknown) => {
  console.error("Database backup failed:", error);
  process.exitCode = 1;
});

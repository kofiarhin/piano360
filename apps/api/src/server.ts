import "dotenv/config";

import { createApp } from "./app";
import { config } from "./config";
import { connectToDatabase } from "./db";

const startServer = async () => {
  await connectToDatabase();
  const app = createApp();

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
};

startServer().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

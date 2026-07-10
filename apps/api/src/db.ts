import mongoose from "mongoose";

import { config } from "./config";

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(config.mongoUri);
  return mongoose.connection;
};

export const disconnectFromDatabase = async () => {
  await mongoose.disconnect();
};

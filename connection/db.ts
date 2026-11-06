import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "@/models/User";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};
globalForMongoose.mongooseCache = cache;

function getMongoUri() {
  const uri = process.env.mongodb_url;
  if (!uri) {
    throw new Error("mongodb_url is missing from the environment");
  }
  return uri;
}

async function ensureDefaultUser() {
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;
  if (!username || !password) return;

  const existing = await User.findOne({ username });
  if (existing) return;

  await User.create({
    username,
    password: await bcrypt.hash(password, 10),
  });
}

export async function connectDB() {
  if (cache.conn && mongoose.connection.readyState >= 1) {
    await ensureDefaultUser();
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(getMongoUri(), {
        dbName: "datastorage",
        family: 4,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  await ensureDefaultUser();
  return cache.conn;
}

export function mongoErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  if (/tls|ssl|ip|server selection|network/i.test(message)) {
    return "Could not connect to MongoDB Atlas. In Atlas, open Network Access and allow your current IP (or 0.0.0.0/0 for development), then restart the app.";
  }
  return message;
}

import { MongoClient, type Db } from "mongodb";
import bcrypt from "bcryptjs";

function getMongoUri() {
  const uri = process.env.mongodb_url;
  if (!uri) {
    throw new Error("mongodb_url is missing from the environment");
  }

  const parsed = new URL(uri);
  if (!parsed.searchParams.has("retryWrites")) {
    parsed.searchParams.set("retryWrites", "true");
  }
  if (!parsed.searchParams.has("w")) {
    parsed.searchParams.set("w", "majority");
  }
  return parsed.toString();
}

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise() {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(getMongoUri(), {
      tls: true,
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });
    globalForMongo._mongoClientPromise = client.connect().catch((error) => {
      globalForMongo._mongoClientPromise = undefined;
      throw error;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db("datastorage");
  await ensureDefaultUser(db);
  return db;
}

async function ensureDefaultUser(db: Db) {
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;
  if (!username || !password) return;

  const users = db.collection("users");
  const existing = await users.findOne({ username });
  if (existing) return;

  await users.insertOne({
    username,
    password: await bcrypt.hash(password, 10),
    createdAt: new Date(),
  });
}

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection("users");
}

export async function getCodesCollection() {
  const db = await getDb();
  return db.collection("codes");
}

export function mongoErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  if (/tls|ssl|ip|server selection|network/i.test(message)) {
    return "Could not connect to MongoDB Atlas. In Atlas, open Network Access and allow your current IP (or 0.0.0.0/0 for development), then restart the app.";
  }
  return message;
}

import { MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "video_recording_app";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

function getMongoClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  if (!global.__mongoClientPromise) {
    const client = new MongoClient(uri);
    global.__mongoClientPromise = client.connect();
  }

  return global.__mongoClientPromise;
}

export async function getDb() {
  if (!clientPromise) {
    clientPromise = getMongoClientPromise();
  }

  const client = await clientPromise;
  return client.db(dbName);
}

export default getDb;

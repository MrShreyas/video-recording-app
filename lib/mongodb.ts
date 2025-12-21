import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not set in environment');
}

const dbName = process.env.MONGODB_DB || 'video_recording_app';

declare global {
  // allow global cache across module reloads in development
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global.__mongoClientPromise) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
  global.__mongoClientPromise = clientPromise;
} else {
  clientPromise = global.__mongoClientPromise;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

export default getDb;

import mongoose from "mongoose"

type ConnectionCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalWithMongo = globalThis as typeof globalThis & {
  transcriptMongoCache?: ConnectionCache
}
const cached = globalWithMongo.transcriptMongoCache ??= { conn: null, promise: null }

export async function dbConnect() {
  if (cached.conn?.connection.readyState === 1) return cached.conn
  if (cached.conn) {
    cached.conn = null
    cached.promise = null
  }
  if (!cached.promise) {
    // Check at request time so a build can run without production credentials.
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI
    if (!uri) throw new Error("MongoDB connection is not configured")
    const dbName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || "test"
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      dbName,
      serverSelectionTimeoutMS: 10000,
    }).then((connection) => {
      cached.conn = connection
      return connection
    }).catch((error: unknown) => {
      // A transient outage must not permanently poison the cached promise.
      cached.conn = null
      cached.promise = null
      throw error
    })
  }
  return cached.promise
}

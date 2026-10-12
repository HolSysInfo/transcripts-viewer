import mongoose from "mongoose"
import { Readable } from "node:stream"
import { dbConnect } from "@/lib/mongodb"

export type TranscriptDocument = {
  _id: string
  transcript_id?: string
  [field: string]: unknown
}

export type HtmlTranscriptDocument = TranscriptDocument & {
  schema_version: 2
  storage: "gridfs"
  html_file_id: mongoose.mongo.ObjectId
}

async function getDatabase() {
  const connection = await dbConnect()
  const database = connection.connection.db
  if (!database) throw new Error("MongoDB connection is unavailable")
  return database
}

export async function getTranscript(id: string): Promise<TranscriptDocument | null> {
  const database = await getDatabase()
  // Bot transcript IDs are strings, including closed-channel snowflakes.
  // Native reads preserve the HTML schema and legacy fields without casting.
  return database.collection<TranscriptDocument>("transcripts").findOne({ _id: id })
}

export function isHtmlTranscript(
  document: TranscriptDocument | null,
): document is HtmlTranscriptDocument {
  return document !== null
    && document.schema_version === 2
    && document.storage === "gridfs"
    && document.html_file_id instanceof mongoose.mongo.ObjectId
}

export async function getLegacyChannels(): Promise<Record<string, unknown>[]> {
  const database = await getDatabase()
  return database.collection("channels").find({}).toArray()
}

function errorResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(status === 503 ? { "Retry-After": "30" } : {}),
    },
  })
}

function downloadHeader(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(
    /[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
  return `attachment; filename*=UTF-8''${encoded}`
}

function streamResponse(
  bucket: mongoose.mongo.GridFSBucket,
  file: mongoose.mongo.GridFSFile,
  headers: Record<string, string>,
): Response {
  const stream = bucket.openDownloadStream(file._id)
  // toWeb propagates backpressure and cancellation to the MongoDB stream.
  // Do not buffer full transcripts or attachment files in server memory.
  const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>
  if (Number.isSafeInteger(file.length) && file.length >= 0) {
    headers["Content-Length"] = String(file.length)
  }
  return new Response(body, { headers })
}

export async function getHtmlResponse(id: string, download = false): Promise<Response> {
  try {
    const document = await getTranscript(id)
    if (!document) return errorResponse(404, "Transcript not found.")
    if (!isHtmlTranscript(document)) {
      return errorResponse(409, "This legacy transcript has no saved exporter HTML.")
    }
    const database = await getDatabase()
    const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: "transcript_html" })
    const file = await bucket.find({ _id: document.html_file_id }).next()
    if (!file) return errorResponse(404, "Transcript HTML not found.")
    const headers: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      // Keep the exporter isolated even when its raw URL is opened directly.
      "Content-Security-Policy": "sandbox allow-scripts allow-downloads allow-popups",
    }
    if (download) {
      headers["Content-Disposition"] = downloadHeader(`transcript-${document.transcript_id || id}.html`)
    }
    return streamResponse(bucket, file, headers)
  } catch {
    // Driver exceptions can include the MongoDB URI; never return or log them.
    return errorResponse(503, "Transcript storage is temporarily unavailable. Please retry.")
  }
}

const INLINE_MEDIA_TYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/avif",
  "audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4", "audio/webm",
  "video/mp4", "video/webm", "video/ogg",
])

export async function getAssetResponse(id: string, download = false): Promise<Response> {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) return errorResponse(404, "Asset not found.")
  try {
    const assetId = new mongoose.mongo.ObjectId(id)
    const database = await getDatabase()
    const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: "transcript_assets" })
    const file = await bucket.find({ _id: assetId }).next()
    if (!file) return errorResponse(404, "Asset not found.")
    const declaredType: unknown = file.metadata?.content_type ?? file.metadata?.contentType
    const mediaType = typeof declaredType === "string"
      ? declaredType.split(";", 1)[0].trim().toLowerCase() : ""
    const inlineMedia = INLINE_MEDIA_TYPES.has(mediaType)
    const headers: Record<string, string> = {
      "Content-Type": inlineMedia ? mediaType : "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    }
    if (download || !inlineMedia) {
      headers["Content-Disposition"] = downloadHeader(file.filename || `asset-${id}`)
    }
    return streamResponse(bucket, file, headers)
  } catch {
    return errorResponse(503, "Transcript storage is temporarily unavailable. Please retry.")
  }
}

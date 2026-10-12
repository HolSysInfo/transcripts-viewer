import { NextRequest } from "next/server"
import { getAssetResponse } from "@/lib/transcripts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return getAssetResponse(id, request.nextUrl.searchParams.get("download") === "1")
}

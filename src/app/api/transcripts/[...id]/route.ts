import { NextRequest, NextResponse } from "next/server";
import { getHtmlResponse, getTranscript } from "@/lib/transcripts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string[] }> }) {
  const { id: segments } = await params;
  if (segments.length === 2 && segments[1] === "html") {
    return getHtmlResponse(segments[0], req.nextUrl.searchParams.get("download") === "1");
  }
  if (segments.length !== 1) {
    return NextResponse.json({ error: "Transcript not found" }, {
      status: 404, headers: { "Cache-Control": "no-store" },
    });
  }
  try {
    const transcript = await getTranscript(segments[0]);
    if (!transcript) {
      return NextResponse.json({ error: "Transcript not found" }, {
        status: 404, headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json(transcript, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Transcript storage is temporarily unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" },
    });
  }
}

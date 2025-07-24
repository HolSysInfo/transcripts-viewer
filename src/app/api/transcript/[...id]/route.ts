import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Transcript from "@/models/Transcript";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string[] }> }) {
  await dbConnect();
  const { id: segments } = await params
  const id = segments[segments.length - 1];
  try {
    const transcript = await Transcript.findById(id).lean();
    console.log("Transcript ID:", transcript);
    if (!transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }
    return NextResponse.json(transcript);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
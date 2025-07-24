import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Transcript from "@/models/Transcript";

import { mockChannel, mockUsers, mockMessages } from "@/lib/mock-data"; // adjust path

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string[] }> }) {
  await dbConnect();
  const { id: segments } = await params
  const id = segments[segments.length - 1];

  /*const now = new Date();

  const mockData = {
    _id: "1234567890",
    transcript_id: "1234567890",
    channel: mockChannel,
    users: mockUsers(),
    messages: mockMessages(now),
  };

  await Transcript.create(mockData); // Create mock data if needed
  */

  // get the last segment as the transcript ID

  try {
    const transcript = await Transcript.findById(id).lean();
    if (!transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }
    return NextResponse.json(transcript);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
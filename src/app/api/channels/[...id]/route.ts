import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Channels from "@/models/Channels";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string[] }> }) {
  await dbConnect();
  const { id: segments } = await params
  const id = segments[segments.length - 1];
  try {
    const channel = await Channels.findById(id).lean();
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    return NextResponse.json(channel);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
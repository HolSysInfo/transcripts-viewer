import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Channels from "@/models/Channels";

export async function GET() {
  await dbConnect();

  try {
    const channel = await Channels.find().lean();
    console.log("Fetched channels:", channel);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    return NextResponse.json(channel);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
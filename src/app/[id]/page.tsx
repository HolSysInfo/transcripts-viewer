import { ChannelHeader } from "@/components/channel-header"
import { MessageList } from "@/components/message-list"
import { MessageInput } from "@/components/message-input"

const now = new Date();

export default async function TranscriptPage({ params }: { params: Promise<{ id: string[] }> }) {
    const { id } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/transcript/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#36393f]">
        <div className="bg-[#40444b] text-white px-8 py-6 rounded-lg text-lg font-semibold">
          We didn't find your transcript ID.
        </div>
      </div>
    );
  }

  const transcript = await res.json();

  return (
    <div className="h-screen bg-[#36393f] flex flex-col">
      <ChannelHeader channel={transcript.channel} />
      <MessageList messages={transcript.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))} users={transcript.users} now={now} />
      <MessageInput />
    </div>
  );
}
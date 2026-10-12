import { notFound, redirect } from "next/navigation"
import { ChannelHeader } from "@/components/channel-header"
import { MessageList } from "@/components/message-list"
import { MessageInput } from "@/components/message-input"
import { getLegacyChannels, getTranscript, isHtmlTranscript } from "@/lib/transcripts"
import type { Transcript } from "@/types/discord"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function TranscriptStatus({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#36393f] p-6">
      <p className="bg-[#40444b] text-white px-8 py-6 rounded-lg text-lg text-center">
        {children}
      </p>
    </main>
  )
}

export default async function TranscriptPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ download?: string | string[] }>
}) {
  const { id } = await params
  let transcript
  try {
    transcript = await getTranscript(id)
  } catch {
    return (
      <TranscriptStatus>
        Transcript storage is temporarily unavailable. Please try again shortly.
      </TranscriptStatus>
    )
  }
  if (!transcript) notFound()

  if (isHtmlTranscript(transcript)) {
    const htmlUrl = `/api/transcripts/${encodeURIComponent(id)}/html`
    if ((await searchParams).download === "1") redirect(`${htmlUrl}?download=1`)
    return (
      <iframe
        title={`Ticket transcript ${id}`}
        src={htmlUrl}
        sandbox="allow-scripts allow-downloads allow-popups"
        referrerPolicy="no-referrer"
        style={{ border: 0, display: "block", height: "100dvh", width: "100%" }}
      />
    )
  }

  // Previously saved JSON records retain their original viewer.
  if (!Array.isArray(transcript.messages) || !Array.isArray(transcript.users) || !transcript.channel) {
    return <TranscriptStatus>This transcript does not contain a supported export.</TranscriptStatus>
  }
  const legacy = transcript as unknown as Transcript
  let channels: any[] = []
  try {
    channels = JSON.parse(JSON.stringify(await getLegacyChannels()))
  } catch {
    // Channel mention lookup is optional for displaying an existing transcript.
  }
  return (
    <main className="h-screen bg-[#36393f] flex flex-col">
      <ChannelHeader channel={legacy.channel} />
      <MessageList
        messages={legacy.messages.map((message) => ({ ...message, timestamp: new Date(message.timestamp) }))}
        users={legacy.users}
        now={new Date()}
        channels={channels}
      />
      <MessageInput />
    </main>
  )
}

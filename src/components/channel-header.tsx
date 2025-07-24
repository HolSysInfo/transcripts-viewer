import { Hash, Users, Pin, Inbox, HelpCircle, Search } from "lucide-react"
import type { Channel } from "@/types/discord"

interface ChannelHeaderProps {
  channel: Channel
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#202225] bg-[#36393f] shadow-sm">
      <div className="flex items-center space-x-2">
        <Hash className="w-5 h-5 text-[#8e9297]" />
        <span className="font-semibold text-white text-base">{channel.name}</span>
        {channel.topic && (
          <>
            <div className="w-px h-6 bg-[#4f545c]" />
            <span className="text-[#8e9297] text-sm truncate max-w-md">{channel.topic}</span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button className="p-1 rounded hover:bg-[#4f545c] transition-colors">
            <Pin className="w-5 h-5 text-[#b9bbbe]" />
          </button>
          <button className="p-1 rounded hover:bg-[#4f545c] transition-colors">
            <Users className="w-5 h-5 text-[#b9bbbe]" />
          </button>
        </div>

        <div className="flex items-center bg-[#202225] rounded px-2 py-1">
          <Search className="w-4 h-4 text-[#8e9297] mr-2" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent text-sm text-white placeholder-[#8e9297] outline-none w-32"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-1 rounded hover:bg-[#4f545c] transition-colors">
            <Inbox className="w-5 h-5 text-[#b9bbbe]" />
          </button>
          <button className="p-1 rounded hover:bg-[#4f545c] transition-colors">
            <HelpCircle className="w-5 h-5 text-[#b9bbbe]" />
          </button>
        </div>
      </div>
    </div>
  )
}

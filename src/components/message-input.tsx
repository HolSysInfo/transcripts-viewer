import { Plus, Gift, Sticker, Smile } from "lucide-react"

export function MessageInput() {
  return (
    <div className="px-4 pb-6">
      <div className="bg-[#40444b] rounded-lg px-4 py-3">
        <div className="flex items-center">
          <button className="p-1 rounded hover:bg-[#4f545c] transition-colors mr-3 cursor-not-allowed opacity-50">
            <Plus className="w-5 h-5 text-[#b9bbbe]" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="You don't have permission to send messages in this channel"
              className="w-full bg-transparent text-white placeholder-[#72767d] outline-none cursor-not-allowed"
              disabled
            />
          </div>

          <div className="flex items-center space-x-2 ml-3">
            <button className="p-1 rounded hover:bg-[#4f545c] transition-colors cursor-not-allowed opacity-50">
              <Gift className="w-5 h-5 text-[#b9bbbe]" />
            </button>
            <button className="p-1 rounded hover:bg-[#4f545c] transition-colors cursor-not-allowed opacity-50">
              <Sticker className="w-5 h-5 text-[#b9bbbe]" />
            </button>
            <button className="p-1 rounded hover:bg-[#4f545c] transition-colors cursor-not-allowed opacity-50">
              <Smile className="w-5 h-5 text-[#b9bbbe]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

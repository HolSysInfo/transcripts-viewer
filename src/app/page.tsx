"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const [input, setInput] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      router.push(`/${input.trim()}`)
    }
  }

  return (
    <div className="h-screen bg-[#36393f] flex flex-col">
      <div className="h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className="bg-[#40444b] rounded-lg p-8 flex flex-col items-center gap-4">
          <label className="text-white text-lg font-semibold">
            Enter Transcript ID
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Transcript ID"
            className="px-4 py-2 rounded bg-[#2f3136] text-white outline-none"
          />
          <button
            type="submit"
            className="bg-[#5865f2] text-white px-6 py-2 rounded font-semibold hover:bg-[#4752c4] transition"
          >
            View Transcript
          </button>
        </form>
      </div>
    </div>
  );
}

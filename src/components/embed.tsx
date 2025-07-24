import type { Embed as EmbedType } from "@/types/discord"
import Image from "next/image"
import ReactMarkdown from "react-markdown"

interface EmbedProps {
  embed: EmbedType
}

export function Embed({ embed }: EmbedProps) {
  return (
    <div className="max-w-lg">
      <div
        className="bg-[#2f3136] border-l-4 rounded pl-4 pt-4 pb-4 mt-2 pr-28 relative"
        style={{ borderLeftColor: embed.color || "#202225" }}
      >
        {embed.thumbnail && (
          <div className="absolute top-4 right-4">
            <img
              src={embed.thumbnail}
              alt="Embed thumbnail"
              width={80}
              height={80}
              className="rounded object-cover"
            />
          </div>
        )}

        {embed.author && (
          <div className="flex items-center mb-2">
            {embed.author.iconUrl && (
              <img
                src={embed.author.iconUrl || "/placeholder.svg"}
                alt={embed.author.name}
                width={20}
                height={20}
                className="rounded-full mr-2"
              />
            )}
            <span className="text-sm text-white font-medium">{embed.author.name}</span>
          </div>
        )}

        {embed.title && (
          <h3 className="text-white font-semibold mb-2 text-base">
            {embed.url ? (
              <a href={embed.url} className="text-[#00aff4] hover:underline">
                {embed.title}
              </a>
            ) : (
              embed.title
            )}
          </h3>
        )}

        {embed.description && (
          <div className="text-[#dcddde] text-sm mb-3 leading-relaxed">
            <ReactMarkdown>{embed.description}</ReactMarkdown>
          </div>
        )}

        {embed.fields && embed.fields.length > 0 && (
          <div className="grid gap-2 mb-3">
            {embed.fields.map((field, index) => (
              <div key={index} className={field.inline ? "inline-block mr-4" : "block"}>
                <div className="text-white font-semibold text-sm mb-1">
                  <ReactMarkdown>{field.name}</ReactMarkdown>
                </div>
                <div className="text-[#dcddde] text-sm">
                  <ReactMarkdown>{field.value}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}

        {embed.image && (
          <div className="mt-3">
            <img
              src={embed.image || "/placeholder.svg"}
              alt="Embed image"
              width={400}
              height={300}
              className="rounded max-w-full h-auto"
            />
          </div>
        )}
      </div>
    </div>
  )
}

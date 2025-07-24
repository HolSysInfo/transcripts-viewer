import type { Message as MessageType, User } from "@/types/discord"
import { Message } from "./message"

interface MessageListProps {
  messages: MessageType[]
  users: User[],
  now: Date // Optional prop to pass current time for grouping logic
}

export function MessageList({ messages, users, now }: MessageListProps) {
  const shouldGroupMessage = (current: MessageType, previous?: MessageType) => {
    if (!previous) return false

    const timeDiff = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()
    const fiveMinutes = 5 * 60 * 1000

    return current.author === previous.author && timeDiff < fiveMinutes
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="pb-4 mt-2">
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : undefined
          const isGrouped = shouldGroupMessage(message, previousMessage)

          return (
            <Message
              key={message._id}
              message={message}
              messages={messages}
              users={users}
              now={now}
              isGrouped={isGrouped}
              showAvatar={!isGrouped}
            />
          )
        })}
      </div>
    </div>
  )
}

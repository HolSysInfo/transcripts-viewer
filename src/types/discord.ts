export interface User {
  _id: string
  username: string
  avatar?: string
  bot: boolean
}

export interface Channel {
  _id: string
  name: string
  topic?: string
}

export interface Embed {
  _id: string
  title?: string
  description?: string
  thumbnail?: string
  color?: string
  image?: string
  url?: string
  author?: {
    name: string
    iconUrl?: string
  }
  fields?: {
    name: string
    value: string
    inline?: boolean
  }[]
}

export interface Button {
  _id: string
  label: string
  style: "primary" | "secondary" | "success" | "danger" | "link"
  disabled?: boolean
  emoji?: string
}

export interface Message {
  _id: string
  replyTo?: string
  content: string
  author: string // user id
  timestamp: Date
  embeds?: Embed[]
  buttons?: Button[]
  edited?: boolean
  reactions?: {
    emoji: string
    count: number
    reacted: boolean
  }[]
}

export interface Transcript {
  _id: string
  channel: Channel
  users: User[]
  messages: Message[]
}

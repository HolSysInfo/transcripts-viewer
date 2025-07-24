import type { Message, Channel, User } from "@/types/discord"

export const mockChannel: Channel = {
  id: "1234567890",
  name: "hwid-rhaymdev",
  topic: "Transcript ID: 1234567890"
}


export const mockUsers = (): User[] => {
  return [
    {
      id: "1",
      username: "ライム",
      avatar: "https://cdn.discordapp.com/avatars/702949304507170887/69eea0ec0936afeb4ceda4fe54b1c50e.png?size=128",
      bot: false,
    },
    {
      id: "2",
      username: "Feet Sniffer",
      bot: false,
      avatar: "/placeholder.svg?height=40&width=40&text=BW",
    },
    {
      id: "bot1",
      username: "Stupid Tickets bot",
      avatar: "/placeholder.svg?height=40&width=40&text=M6",
      bot: true,
    },
  ]
}

export const mockMessages = (now: Date): Message[] => {
  return [
    {
      id: "1",
      content: "",
      author: "bot1",
      timestamp: new Date(now.getTime() - 3000000),
      embeds: [
        {
          id: "embed1",
          title: "HWID Ticket",
          thumbnail: "https://media.discordapp.net/attachments/1264313690438635561/1335377926354636810/SYS-PFP-v2-2.png?ex=6882b51b&is=6881639b&hm=1474c8b16959889e61b808654918e61c3dd488e8112c87f1a7314cba46d858cc&=&format=webp&quality=lossless&width=930&height=930",
          description: "**Tell us** which **[product](https://sys-info.xyz/)** should have it's hardware lock **reset** and the **reason** why, please include your **Order ID.**\n\n**Don't ping us.** Our team will deal with your request as soon as possible, please be patient.\n\n**Click** on the 🔒\"**Close Ticket**\" button to **close** your ticket.",
          color: "#DD00FF",
          author: {
            name: "Server Bot",
            iconUrl: "/placeholder.svg?height=20&width=20&text=SB",
          },
        },
      ],
      buttons: [
        {
          id: "btn1",
          label: "Close Ticket",
          style: "danger",
          emoji: "🔒",
        },
        {
          id: "btn2",
          label: "Chat with AI",
          style: "primary",
          emoji: "🤖",
        },
        {
          id: "btn3",
          label: "Transfer Category",
          style: "secondary",
          emoji: "📁",
        }
      ],
    },
    {
      id: "2",
      content: "It's a Discord clone built with Next.js and TypeScript! 🚀",
      author: "1",
      timestamp: new Date(now.getTime() - 3300000),
      reactions: [
        { emoji: "🚀", count: 2, reacted: true },
        { emoji: "🔥", count: 1, reacted: false },
      ],
    },
    {
      id: "3",
      content: "Nice! I love the UI, it looks exactly like Discord.",
      author: "2",
      timestamp: new Date(now.getTime() - 2800000),
    },
    {
      id: "4",
      content: "sybau",
      replyTo: "3",
      author: "bot1",
      timestamp: new Date(now.getTime() - 1800000)
    }
  ]
}
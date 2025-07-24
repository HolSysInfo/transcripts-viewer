import type { Message as MessageType, User } from "@/types/discord";
import { Embed } from "./embed";
import { DiscordButton } from "./discord-button";;
import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Helper to replace mentions with tokens
function escapeMentions(text: string) {
  // Replace user mentions
  text = text.replace(/<@!?(\d+)>/g, (_, id) => `@@USER_${id}@@`);
  // Replace role mentions
  text = text.replace(/<@&(\d+)>/g, (_, id) => `@@ROLE_${id}@@`);
  return text;
}

interface MessageProps {
  message: MessageType;
  messages: MessageType[];
  users: User[];
  showAvatar?: boolean;
  isGrouped?: boolean;
  now: Date; // Optional prop to pass current time for grouping logic
}


export function Message({ message, showAvatar = true, isGrouped = false, messages, users = [], now }: MessageProps) {
  const formatTimestamp = (date: Date) => {
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (days === 1) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    }
  };

  if (!users) {
  console.error("No users array passed to Message component!");
  return null;
}
  const author = users.find((u) => u._id === message.author);
  const isBot = author?.bot || false;

  // Resolve replied message and its author
  const repliedMessage = message.replyTo && messages
    ? messages.find((m) => m._id === message.replyTo)
    : undefined;
  const repliedAuthor = repliedMessage
    ? users.find((u) => u._id === repliedMessage.author)
    : undefined;

  return (
    <div className="group hover:bg-[#32353b] px-4 py-1 relative mt-1" style={{ marginBottom: '2px' }}>
      {repliedMessage && repliedAuthor && (
        <div className='flex items-center  relative ml-[56px] before:content-[""] before:block before:absolute before:top-2/4 before:right-full before:bottom-[0] before:-left-[36px] before:mr-[4px] before:-mt-px before:-ml-px before:[border-left:2px_solid_#4F545C] before:[border-bottom:0_solid_#4F545C] before:[border-right:0_solid_#4F545C] before:[border-top:2px_solid_#4f545C] before:rounded-tl-[6px]' style={{ minHeight: 32 }}>
          <img
            src={repliedAuthor.avatar || "https://discord.com/assets/18e336a74a159cfd.png"}
            alt={repliedAuthor.username}
            className="w-4 h-4 rounded-full mr-1"
          />
          <span className="font-semibold text-white text-xs mr-1 truncate max-w-[100px]">
            {repliedAuthor.username}
          </span>
          <span className="text-[#b9bbbe] text-xs truncate max-w-[220px]">
            <MentionMarkdown content={repliedMessage.content.length > 60
              ? repliedMessage.content.slice(0, 60) + "…"
              : repliedMessage.content} users={users} />
          </span>
        </div>
      )}

      <div className="flex">
        {showAvatar && !isGrouped ? (
          <div className="flex-shrink-0 mr-4 relative">
            <img
              src={author?.avatar || "https://discord.com/assets/18e336a74a159cfd.png"}
              alt={author?.username || "Unknown"}
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
        ) : (
          <div className="w-14 flex-shrink-0 flex justify-center">
            <span className="text-xs text-[#72767d] opacity-0 group-hover:opacity-100 leading-6">
              {message.timestamp.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {(!isGrouped || showAvatar) && (
            <div className="flex items-center ">  
              <span className="font-medium text-white mr-2">{author?.username || "Unknown"}</span>
              {isBot && (
                <span className="bg-[#5865f2] text-white text-xs px-1 py-0.5 rounded font-bold mr-2 flex items-center">
                  APP
                </span>
              )}
              <span className="text-xs text-[#72767d]">{formatTimestamp(message.timestamp)}</span>
              {message.edited && <span className="text-xs text-[#72767d] ml-1">(edited)</span>}
            </div>
          )}

          {message.content && <div className="text-[#dcddde] leading-relaxed "><MentionMarkdown content={message.content} users={users} /></div>}

          {message.embeds && message.embeds.map((embed) => {
            return <Embed key={embed._id} embed={embed} />
          })}

          {message.buttons && message.buttons.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.buttons.map((button) => (
                <DiscordButton key={button._id} button={button} />
              ))}
            </div>
          )}

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  className={`flex items-center px-2 py-1 rounded text-sm transition-colors cursor-not-allowed ${reaction.reacted
                    ? "bg-[#5865f2]/20 border border-[#5865f2] text-white"
                    : "bg-[#2f3136] border border-[#4f545c] text-[#b9bbbe] hover:border-[#6a6f76]"
                    }`}
                  disabled
                >
                  <span className="mr-1">{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type MentionMarkdownProps = {
  content: string;
  users: User[];
   roles?: { id: string; name: string; color?: string }[]
};

function discordMarkdown(text: string) {
  return text
    .replace(/(\*\*")(.*?)("\*\*)/g, '<strong>"$2"</strong>') // **"text"**
    .replace(/(\*\*__)(.*?)(__\*\*)/g, '<strong><u>$2</u></strong>') // **__text__**
    .replace(/(__\*\*)(.*?)(\*\*__)/g, '<strong><u>$2</u></strong>') // __**text**__
    .replace(/__(.*?)__/g, '<u>$1</u>'); // __text__
}

export default function MentionMarkdown({ content, users, roles = [] }: MentionMarkdownProps) {
  const replaced = mentionsToHtml(escapeMentions(content), users, roles);

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        span({ node, ...props }) {
          if (props.className === "mention-user") {
            return <span className="text-blurple font-semibold hover:underline">{props.children}</span>;
          }
          if (props.className === "mention-role") {
            return <span className="text-purple-500 font-semibold hover:underline" style={props.style}>{props.children}</span>;
          }
          return <span {...props} />;
        }
      }}
    >
      {discordMarkdown(replaced)}
    </Markdown>
  );
}

function mentionsToHtml(text: string, users: User[], roles: { id: string; name: string; color?: string }[]) {
  return text
    .replace(/@@USER_(\d+)@@/g, (_, id) => {
      const user = users.find(u => u._id === id);
      return `<span class="mention-user" data-id="${id}">@${user?.username || "Unknown"}</span>`;
    })
    .replace(/@@ROLE_(\d+)@@/g, (_, id) => {
      const role = roles.find(r => r.id === id);
      const color = role?.color ? ` style="color:${role.color}"` : "";
      return `<span class="mention-role"${color} data-id="${id}">@${role?.name || "Unknown Role"}</span>`;
    });
}
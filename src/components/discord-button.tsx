import type { Button as ButtonType } from "@/types/discord"

interface DiscordButtonProps {
  button: ButtonType
}

export function DiscordButton({ button }: DiscordButtonProps) {
  const getButtonStyles = (style: ButtonType["style"]) => {
    const baseStyles = "px-4 py-2 rounded text-sm font-medium transition-colors cursor-not-allowed"

    switch (style) {
      case "primary":
        return `${baseStyles} bg-[#5865f2] text-white opacity-50`
      case "secondary":
        return `${baseStyles} bg-[#4f545c] text-white opacity-50`
      case "success":
        return `${baseStyles} bg-[#3ba55d] text-white opacity-50`
      case "danger":
        return `${baseStyles} bg-[#ed4245] text-white opacity-50`
      case "link":
        return `${baseStyles} bg-transparent text-[#00aff4] opacity-50`
      default:
        return `${baseStyles} bg-[#4f545c] text-white opacity-50`
    }
  }

  return (
    <button className={getButtonStyles(button.style)} disabled={true}>
      {button.emoji && <span className="mr-2">{button.emoji}</span>}
      {button.label}
    </button>
  )
}

import logoSrc from "@/image/todo-app-logo.jpg"
import { cn } from "@/lib/utils"

type LogoProps = {
    className?: string
    alt?: string
}

export default function Logo({ className, alt = "Todo App" }: LogoProps) {
    return (
        <img
            src={logoSrc}
            alt={alt}
            className={cn("mx-auto h-auto w-32 md:w-40 object-contain", className)}
        />
    )
}

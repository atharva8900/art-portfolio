"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="text-foreground/80 hover:text-accent transition-colors p-2 rounded-full hover:bg-foreground/5 opacity-0">
                <Sun size={20} />
            </button>
        ); // Return a placeholder with the right size to avoid layout shift, but invisible
    }

    const isLight = theme === "light" || resolvedTheme === "light";

    return (
        <button
            onClick={() => setTheme(isLight ? "dark" : "light")}
            className="text-foreground/80 hover:text-accent transition-colors p-2 rounded-full hover:bg-foreground/5 relative overflow-hidden flex items-center justify-center w-9 h-9"
            aria-label="Toggle theme"
        >
            <Sun className={`absolute transition-all duration-300 ${isLight ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'}`} size={20} />
            <Moon className={`absolute transition-all duration-300 ${!isLight ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 rotate-90'}`} size={20} />
        </button>
    );
}

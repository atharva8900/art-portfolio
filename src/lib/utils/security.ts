/**
 * Safely escapes HTML special characters to prevent XSS.
 * Converts <, >, &, ", and ' into their respective HTML entities.
 */
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Strips all HTML tags from a string in a robust way to prevent bypasses.
 * This is primarily for text logs and Discord notifications.
 */
export function stripHtmlTags(html: string): string {
    // 1. Remove style and script tags first
    // 2. Remove all other tags
    // 3. Condense whitespace
    return html
        .replace(/<(style|script|iframe)[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

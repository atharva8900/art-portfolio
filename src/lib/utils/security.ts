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
 * Uses a while loop to ensure nested tags are fully removed.
 * This is primarily for text logs and Discord notifications.
 */
export function stripHtmlTags(html: string): string {
    let previous: string;
    let current = html;

    // 1. Remove style, script, and iframe tags along with their content
    do {
        previous = current;
        current = current.replace(/<(style|script|iframe)[^>]*>[\s\S]*?<\/\1>/gi, "");
    } while (current !== previous);

    // 2. Remove all remaining tags and consolidate whitespace
    do {
        previous = current;
        current = current.replace(/<[^>]+>/g, " ");
    } while (current !== previous);

    return current.replace(/\s+/g, " ").trim();
}

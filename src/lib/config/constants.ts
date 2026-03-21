export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

export const ARTIST_EMAIL = process.env.NEXT_PUBLIC_ARTIST_EMAIL || 'atharvasherlekarart@gmail.com';
export const ARTIST_INSTAGRAM = process.env.NEXT_PUBLIC_ARTIST_INSTAGRAM || 'atharva_sherlekar_art';

import { z } from 'zod';

// Commission Submission Schema
export const commissionSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name is too long").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  phone: z.string().min(10, "Phone number is required for delivery and updates").max(20, "Phone number is too long").trim(),
  instagram_id: z.string().max(50, "Instagram ID is too long").optional().nullable(),
  size: z.enum(['A5', 'A4', 'A3', 'A2']),
  number_of_people: z.union([z.string(), z.number()]).transform(val => String(val)),
  address: z.string().min(10, "Address is too short").max(500, "Address is too long").trim(),
  detailed_background: z.boolean().optional(),
  timelapse_recording: z.boolean().optional(),
  framing: z.boolean().optional(),
  consent: z.boolean().optional(),
  notes: z.string().max(1000, "Notes are too long").optional().nullable(),
  referral_code: z.string().max(20).optional().nullable(),
  referrer_name: z.string().max(100).optional().nullable(),
  referrer_email: z.string().email().optional().nullable(),
  needed_by: z.string().optional().nullable(),
  frame_style: z.string().max(50).optional().nullable(),
  frame_size: z.string().max(20).optional().nullable(),
  frame_matting_color: z.string().max(20).optional().nullable(),
  frame_matting_size: z.union([z.string(), z.number()]).optional().nullable(),
  frame_width: z.union([z.string(), z.number()]).optional().nullable(),
  frame_image: z.string().url().optional().nullable(),
  razorpay_order_id: z.string().optional().nullable(),
  razorpay_payment_id: z.string().optional().nullable(),
  razorpay_signature: z.string().optional().nullable(),
  attachment_urls: z.array(z.string().url()).optional(),
  attachment_base64: z.array(z.object({
    name: z.string(),
    content: z.string()
  })).optional(),
  frame_image_base64: z.string().optional().nullable(),
  promo_id: z.string().optional().nullable(),
  turnstile_token: z.string().min(1, "Captcha is required"),
  referral_locked_browser: z.boolean().optional(),
  fingerprint_hash: z.string().optional().nullable(),
  submitted_at: z.string().optional().nullable(),
});

// Referral Creation Schema
export const referralSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().max(20).optional().nullable(),
  instagram: z.string().max(50).optional().nullable(),
  turnstile_token: z.string().min(1, "Captcha is required"),
  fingerprint_hash: z.string().optional().nullable(),
});

// Admin Status Update Schema
export const adminStatusUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  status: z.enum(['pending', 'accepted', 'in_progress', 'finished', 'on_delivery', 'completed', 'rejected', 'waitlist', 'cancelled']).optional(),
  admin_note: z.string().max(2000).optional(),
  payout_status: z.enum(['unpaid', 'requested', 'paid']).optional(),
  payment_status: z.enum(['pending', 'reservation_paid', 'deposit_paid', 'fully_paid']).optional(),
  submitted_at: z.string().optional(),
  client_name: z.string().optional(),
});

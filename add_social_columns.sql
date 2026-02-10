-- Add social media columns to stores table
alter table stores
add column if not exists facebook_link text,
add column if not exists instagram_link text,
add column if not exists tiktok_link text,
add column if not exists whatsapp_number text;

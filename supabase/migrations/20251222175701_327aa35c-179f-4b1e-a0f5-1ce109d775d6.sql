-- Create storage bucket for city images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'city-images',
  'city-images',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to city images
CREATE POLICY "Public read access for city images"
ON storage.objects FOR SELECT
USING (bucket_id = 'city-images');

-- Allow service role to upload city images (edge functions use service role)
CREATE POLICY "Service role can upload city images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'city-images');

-- Allow service role to update/upsert city images
CREATE POLICY "Service role can update city images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'city-images');
-- Create storage bucket for role images
INSERT INTO storage.buckets (id, name, public)
VALUES ('role-images', 'role-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for role-images bucket
CREATE POLICY "Public read access for role images"
ON storage.objects FOR SELECT
USING (bucket_id = 'role-images');

CREATE POLICY "Authenticated users can upload role images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'role-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update role images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'role-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete role images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'role-images' 
  AND auth.role() = 'authenticated'
);

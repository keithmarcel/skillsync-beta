-- Create storage bucket for company assets (logos and featured images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for company assets
CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their company assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their company assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
);

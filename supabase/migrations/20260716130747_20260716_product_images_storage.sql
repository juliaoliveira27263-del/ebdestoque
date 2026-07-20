/*
# Product Images Storage Bucket

1. Purpose
   Creates a public Supabase Storage bucket called "product-images" for storing
   product/material photos uploaded by administrators.

2. Bucket Settings
   - Name: product-images
   - Public: true (images accessible via public URL without auth)
   - Max file size: 5 MB
   - Allowed MIME types: JPEG, PNG, WebP

3. Security (Storage RLS Policies)
   - All authenticated users can view/download images (SELECT)
   - Only authenticated users can upload images (INSERT)
   - Only authenticated users can delete images (DELETE)
   - Anon users can also SELECT (view) since bucket is public
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
CREATE POLICY "product_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

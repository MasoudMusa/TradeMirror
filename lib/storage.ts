import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Ensures the trade evidence bucket exists
 */
async function ensureBucket(bucket: string = 'trade-evidence') {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (buckets && !buckets.find(b => b.name === bucket)) {
      console.log(`Creating bucket: ${bucket}`);
      await supabaseAdmin.storage.createBucket(bucket, { 
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
    }
  } catch (err) {
    console.warn('Bucket check/creation failed (might already exist):', err);
  }
}

/**
 * Uploads a Base64 string as a file to Supabase Storage
 * @param base64 The Base64 string (with or without data prefix)
 * @param path The path in the bucket (e.g., 'screenshots/trade_123/entry.png')
 * @param bucket The bucket name (defaults to 'trade-evidence')
 */
export async function uploadBase64Image(
  base64: string,
  path: string,
  bucket: string = 'trade-evidence'
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!base64) return { url: null, error: 'Empty base64 data' };
    
    await ensureBucket(bucket);

    // Remove data:image/xxx;base64, prefix if present
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: 'image/gif', // EA sends GIF for efficiency, but we can detect
        upsert: true
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrl, error: null };
  } catch (err: any) {
    console.error('Unexpected Upload Error:', err);
    return { url: null, error: err.message };
  }
}

/**
 * Uploads a file Buffer directly
 */
export async function uploadBufferImage(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/png',
  bucket: string = 'trade-evidence'
): Promise<{ url: string | null; error: string | null }> {
  try {
    await ensureBucket(bucket);
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return { url: null, error: error.message };
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrl, error: null };
  } catch (err: any) {
    console.error('Unexpected Upload Error:', err);
    return { url: null, error: err.message };
  }
}

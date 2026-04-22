'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signInWithDiscord() {
  console.log('🚀 Initiating Discord OAuth via Server Action...');
  
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      console.error('❌ Discord Auth Error:', error.message);
      throw error;
    }

    if (data.url) {
      console.log('✅ Redirecting to Discord OAuth URL...');
      redirect(data.url);
    } else {
      console.error('❌ No URL returned from signInWithOAuth');
      throw new Error('No authentication URL received from server');
    }
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') {
      throw error; // Let Next.js handle redirects
    }
    console.error('💥 Server Action Crash:', error);
    // Redirect back to login with error param for UI feedback
    redirect('/auth/login?error=server_action_failed');
  }
}

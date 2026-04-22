import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const errorParam = searchParams.get('error');

  if (errorParam) {
     console.error('❌ Auth Error received in Callback:', errorParam, searchParams.get('error_description'));
     return NextResponse.redirect(new URL(`/auth/login?error=${errorParam}`, request.url));
  }

  if (code) {
    console.log('🔍 Debug Auth Params:');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key (start):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10));
    console.log('Key (length):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
    
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

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('✅ Auth code exchanged for session successfully.');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Error fetching user after session exchange:', userError);
      } else if (user) {
        console.log('👤 User authenticated:', user.id, user.email);
        
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name || user.user_metadata.name,
            avatar_url: user.user_metadata.avatar_url,
            discord_id: user.user_metadata.provider_id,
            discord_username: user.user_metadata.custom_claims?.global_name || user.user_metadata.name,
            discord_avatar: user.user_metadata.avatar_url,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

          if (profileError) {
            console.error('⚠️ Error updating profile:', profileError);
          } else {
            console.log('✅ Profile updated/created.');
          }
      } else {
        console.warn('⚠️ No user found despite successful session exchange.');
      }

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';

      console.log('🔄 Redirecting to:', next);

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${new URL(request.url).origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${new URL(request.url).origin}${next}`);
      }
    } else {
      console.error('❌ Auth Code Exchange Error:', JSON.stringify(error, null, 2));
      if (error && typeof error === 'object' && 'error_description' in error) {
        console.error('📝 Error Description:', error.error_description);
      }
      return NextResponse.redirect(new URL(`/auth/login?error=auth_failed&detail=${encodeURIComponent(error?.message || 'unknown')}`, request.url));
    }
  }

  console.error('❌ No code provided in callback');
  return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
}

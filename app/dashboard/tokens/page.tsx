'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Copy, Plus, Trash2, Key } from 'lucide-react';

interface AccessToken {
  id: string;
  token: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export default function TokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('access_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    if (!newTokenName.trim()) return;

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate a random token
      const token = `tmk_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;

      const { data, error } = await supabase
        .from('access_tokens')
        .insert({
          user_id: user.id,
          token,
          name: newTokenName,
        })
        .select()
        .single();

      if (error) throw error;

      setNewlyCreatedToken(token);
      setNewTokenName('');
      fetchTokens();
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const deleteToken = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('access_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTokens();
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token');
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    alert('Token copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#02040a] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Access Tokens</h1>
          <p className="text-slate-400">
            Manage API tokens for EA authentication. Keep your tokens secure!
          </p>
        </div>

        {/* New Token Created Alert */}
        {newlyCreatedToken && (
          <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <Key className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-emerald-400 font-bold mb-1">Token Created Successfully!</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Make sure to copy your token now. You won't be able to see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 text-sm font-mono">
                    {newlyCreatedToken}
                  </code>
                  <button
                    onClick={() => copyToken(newlyCreatedToken)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewlyCreatedToken(null)}
                className="text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Create New Token */}
        <div className="mb-6 p-6 bg-slate-900/40 border border-slate-800 rounded-xl">
          <h2 className="text-lg font-bold text-white mb-4">Create New Token</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="Token name (e.g., 'My MT5 EA')"
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createToken()}
            />
            <button
              onClick={createToken}
              disabled={creating || !newTokenName.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Token
            </button>
          </div>
        </div>

        {/* Tokens List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No tokens yet. Create one to get started!</p>
            </div>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">{token.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>Created {new Date(token.created_at).toLocaleDateString()}</span>
                      {token.last_used_at && (
                        <span>Last used {new Date(token.last_used_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <code className="mt-2 inline-block px-3 py-1 bg-slate-900 border border-slate-800 rounded text-slate-500 text-xs font-mono">
                      {token.token.substring(0, 20)}...{token.token.substring(token.token.length - 8)}
                    </code>
                  </div>
                  <button
                    onClick={() => deleteToken(token.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
            <Key className="w-5 h-5" />
            How to use your token
          </h3>
          <ol className="space-y-2 text-sm text-slate-300">
            <li>1. Copy your access token</li>
            <li>2. In your MT5 EA settings, paste the token in the "Access Token" field</li>
            <li>3. The EA will use this token to authenticate with the backend</li>
            <li>4. All your trades will be linked to your account</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

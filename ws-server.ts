import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket Heartbeat Server started on ws://localhost:${PORT}`);

interface HeartbeatMessage {
  type: 'heartbeat';
  token: string;
  account_id: string;
  balance: number;
  equity: number;
  profit: number;
  margin: number;
  free_margin: number;
  open_trades?: Array<{
    ticket: string;
    current_price: number;
    floating_pnl: number;
  }>;
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', async (data: string) => {
    try {
      const message: HeartbeatMessage = JSON.parse(data.toString());

      if (message.type === 'heartbeat') {
        const { token, account_id, balance, equity, profit, margin, free_margin, open_trades } = message;

        // 1. Authenticate EA
        const { data: account, error: authError } = await supabaseAdmin
          .from('accounts')
          .select('*')
          .eq('token', token)
          .single();

        if (authError || !account) {
          ws.send(JSON.stringify({ error: 'Unauthorized', code: 401 }));
          return;
        }

        // Security check: account_id mismatch
        if (account.mt5_account_id && String(account.mt5_account_id) !== String(account_id)) {
           ws.send(JSON.stringify({ 
             error: `Account Mismatch: Token linked to ${account.mt5_account_id}`, 
             code: 403 
           }));
           return;
        }

        // 2. Update account metrics
        const { error: updateError } = await supabaseAdmin
          .from('accounts')
          .update({
            balance: parseFloat(balance.toString()),
            equity: parseFloat(equity.toString()),
            profit: parseFloat(profit.toString()),
            margin: parseFloat(margin.toString()),
            free_margin: parseFloat(free_margin.toString()),
            last_heartbeat_at: new Date().toISOString(),
            last_sync_at: new Date().toISOString(),
            mt5_account_id: account.mt5_account_id || account_id // Bind if first time
          })
          .eq('id', account.id);

        if (updateError) {
          console.error('Account update error:', updateError);
          ws.send(JSON.stringify({ error: 'Database update failed', code: 500 }));
          return;
        }

        // 3. Update open trades
        if (open_trades && Array.isArray(open_trades)) {
          for (const trade of open_trades) {
            await supabaseAdmin
              .from('trades')
              .update({
                current_price: parseFloat(trade.current_price.toString()),
                floating_pnl: parseFloat(trade.floating_pnl.toString()),
                updated_at: new Date().toISOString(),
              })
              .eq('account_id', account.id)
              .eq('ticket', BigInt(trade.ticket));
          }
        }

        ws.send(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
      }
    } catch (err) {
      console.error('Error processing message:', err);
      ws.send(JSON.stringify({ error: 'Invalid message format', code: 400 }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

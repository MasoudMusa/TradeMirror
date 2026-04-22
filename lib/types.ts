export interface AccountMetrics {
    account_id: number;
    balance: number;
    equity: number;
    margin: number;
    free_margin: number;
    margin_level: number;
    currency: string;
    broker: string;
    is_connected: boolean;
    last_heartbeat: string;
}

export interface Trade {
    ticket: number;
    symbol: string;
    type: 'BUY' | 'SELL';
    volume: number;
    entry_price: number;
    current_price: number;
    sl: number;
    tp: number;
    pnl: number;
    swap: number;
    commission: number;
    open_time: string;
    close_time?: string;
    status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
    comment?: string;
    magic?: number;
}

export interface CommandResponse {
    actions: {
        type: string;
        params?: any;
    }[];
}

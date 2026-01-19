import { Ticket, User, Asset, SystemLog } from '../types';

const STORAGE_KEYS = {
  TICKETS: 'helpdesk_db_tickets',
  USERS: 'helpdesk_db_users',
  ASSETS: 'helpdesk_db_assets',
  LOGS: 'helpdesk_db_logs',
  INITIALIZED: 'helpdesk_db_initialized'
};

const syncChannel = new BroadcastChannel('helpdesk_realtime_sync');

class DatabaseService {
  private broadcastChange(type: 'TICKETS' | 'USERS' | 'ASSETS' | 'LOGS' | 'ALL') {
    syncChannel.postMessage({ type, timestamp: Date.now() });
    window.dispatchEvent(new CustomEvent('local_db_update', { detail: { type } }));
  }

  // Tiện ích ghi Log
  logAction(userId: string, userName: string, action: string, details: string, type: SystemLog['type'] = 'INFO') {
    const logs = this.getLogs();
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      details,
      type
    };
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100))); // Lưu 100 log gần nhất
    this.broadcastChange('LOGS');
  }

  getLogs(): SystemLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  }

  isInitialized(): boolean {
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  }

  setInitialized() {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // QUẢN LÝ TICKETS
  getTickets(): Ticket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  }

  saveTickets(tickets: Ticket[], actor?: {id: string, name: string}, actionDesc?: string) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    if (actor && actionDesc) {
      this.logAction(actor.id, actor.name, 'TICKET_UPDATE', actionDesc, 'SUCCESS');
    }
    this.broadcastChange('TICKETS');
  }

  // QUẢN LÝ NGƯỜI DÙNG (USER & ADMIN)
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  saveUsers(users: User[], actor?: {id: string, name: string}, actionDesc?: string) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    if (actor && actionDesc) {
      this.logAction(actor.id, actor.name, 'USER_MANAGEMENT', actionDesc, 'INFO');
    }
    this.broadcastChange('USERS');
  }

  // QUẢN LÝ TÀI SẢN
  getAssets(): Asset[] {
    const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return data ? JSON.parse(data) : [];
  }

  saveAssets(assets: Asset[], actor?: {id: string, name: string}, actionDesc?: string) {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    if (actor && actionDesc) {
      this.logAction(actor.id, actor.name, 'ASSET_UPDATE', actionDesc, 'INFO');
    }
    this.broadcastChange('ASSETS');
  }

  // TIỆN ÍCH DỮ LIỆU
  generateSyncLink(): string {
    const data = {
      tickets: this.getTickets(),
      users: this.getUsers(),
      assets: this.getAssets(),
      logs: this.getLogs()
    };
    const jsonStr = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const url = new URL(window.location.href);
    url.searchParams.set('sync_data', base64);
    return url.toString();
  }

  // Fix: Added importDB to handle JSON backup import
  importDB(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.tickets) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
      if (data.logs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
      this.setInitialized();
      this.broadcastChange('ALL');
      return true;
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  }

  // Fix: Added exportDB to trigger JSON backup download
  exportDB() {
    const data = {
      tickets: this.getTickets(),
      users: this.getUsers(),
      assets: this.getAssets(),
      logs: this.getLogs()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `helpdesk_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importFromEncodedString(encoded: string): boolean {
    try {
      const jsonStr = decodeURIComponent(escape(atob(encoded)));
      const data = JSON.parse(jsonStr);
      if (data.tickets) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
      if (data.logs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
      this.setInitialized();
      this.broadcastChange('ALL');
      return true;
    } catch (e) {
      return false;
    }
  }

  getDatabaseSize(): string {
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith('helpdesk_db_')) {
        total += (localStorage[key].length * 2); // 2 bytes per char
      }
    }
    return (total / 1024).toFixed(2) + ' KB';
  }

  clearDB() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    this.broadcastChange('ALL');
    window.location.reload();
  }

  onSync(callback: (data: any) => void) {
    syncChannel.onmessage = (event) => callback(event.data);
  }
}

export const db = new DatabaseService();
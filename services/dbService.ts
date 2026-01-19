import { Ticket, User, Asset } from '../types';

const STORAGE_KEYS = {
  TICKETS: 'helpdesk_db_tickets',
  USERS: 'helpdesk_db_users',
  ASSETS: 'helpdesk_db_assets',
  INITIALIZED: 'helpdesk_db_initialized'
};

const syncChannel = new BroadcastChannel('helpdesk_realtime_sync');

class DatabaseService {
  private broadcastChange(type: 'TICKETS' | 'USERS' | 'ASSETS' | 'ALL') {
    syncChannel.postMessage({ type, timestamp: Date.now() });
    window.dispatchEvent(new CustomEvent('local_db_update', { detail: { type } }));
  }

  isInitialized(): boolean {
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  }

  setInitialized() {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  getTickets(): Ticket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  }

  saveTickets(tickets: Ticket[]) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.broadcastChange('TICKETS');
  }

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.broadcastChange('USERS');
  }

  getAssets(): Asset[] {
    const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return data ? JSON.parse(data) : [];
  }

  saveAssets(assets: Asset[]) {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    this.broadcastChange('ASSETS');
  }

  // Tạo mã đồng bộ hóa để gửi qua trình duyệt khác
  generateSyncLink(): string {
    const data = {
      tickets: this.getTickets(),
      users: this.getUsers(),
      assets: this.getAssets()
    };
    const jsonStr = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const url = new URL(window.location.href);
    url.searchParams.set('sync_data', base64);
    return url.toString();
  }

  // Nhập dữ liệu từ chuỗi nén
  importFromEncodedString(encoded: string): boolean {
    try {
      const jsonStr = decodeURIComponent(escape(atob(encoded)));
      const data = JSON.parse(jsonStr);
      if (data.tickets) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
      this.setInitialized();
      this.broadcastChange('ALL');
      return true;
    } catch (e) {
      console.error("Sync Error", e);
      return false;
    }
  }

  exportDB() {
    const data = {
      tickets: this.getTickets(),
      users: this.getUsers(),
      assets: this.getAssets(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `it_helpdesk_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  importDB(jsonData: string) {
    try {
      const data = JSON.parse(jsonData);
      if (data.tickets) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
      this.setInitialized();
      this.broadcastChange('ALL');
      return true;
    } catch (e) {
      return false;
    }
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
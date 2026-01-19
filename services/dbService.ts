
import { Ticket, User, Asset, SystemLog } from '../types';
import { pushToCloud, pullFromCloud } from './googleSheetsService';

const STORAGE_KEYS = {
  TICKETS: 'helpdesk_db_tickets',
  USERS: 'helpdesk_db_users',
  ASSETS: 'helpdesk_db_assets',
  LOGS: 'helpdesk_db_logs',
  INITIALIZED: 'helpdesk_db_initialized',
  CLOUD_URL: 'helpdesk_cloud_sync_url',
  LAST_SYNC: 'helpdesk_last_sync_time'
};

const syncChannel = new BroadcastChannel('helpdesk_realtime_sync');

class DatabaseService {
  private broadcastChange(type: 'TICKETS' | 'USERS' | 'ASSETS' | 'LOGS' | 'ALL') {
    syncChannel.postMessage({ type, timestamp: Date.now() });
    window.dispatchEvent(new CustomEvent('local_db_update', { detail: { type } }));
    
    // Tự động đẩy lên Cloud khi có thay đổi cục bộ
    this.autoPush(type);
  }

  private async autoPush(type: string) {
    const cloudUrl = this.getCloudUrl();
    if (!cloudUrl) return;

    try {
      if (type === 'TICKETS' || type === 'ALL') await pushToCloud(cloudUrl, 'Tickets', this.getTickets());
      if (type === 'ASSETS' || type === 'ALL') await pushToCloud(cloudUrl, 'Assets', this.getAssets());
      if (type === 'USERS' || type === 'ALL') await pushToCloud(cloudUrl, 'Users', this.getUsers());
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
      console.error("Auto push failed", e);
    }
  }

  setCloudUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.CLOUD_URL, url);
    this.broadcastChange('ALL');
  }

  getCloudUrl(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CLOUD_URL);
  }

  getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }

  async syncWithCloud(): Promise<boolean> {
    const url = this.getCloudUrl();
    if (!url) return false;
    
    try {
      const cloudData = await pullFromCloud(url);
      if (cloudData && Object.keys(cloudData).length > 0) {
        // Chỉ ghi đè nếu dữ liệu thực sự tồn tại trên Cloud
        if (cloudData.Tickets) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(cloudData.Tickets));
        if (cloudData.Assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(cloudData.Assets));
        if (cloudData.Users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cloudData.Users));
        
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        // Thông báo cho các tab khác biết dữ liệu đã thay đổi
        syncChannel.postMessage({ type: 'ALL', timestamp: Date.now() });
        window.dispatchEvent(new CustomEvent('local_db_update', { detail: { type: 'ALL' } }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Cloud Sync Error:", e);
      return false;
    }
  }

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
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
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
      return false;
    }
  }

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
      if (key.startsWith('helpdesk_db_')) total += (localStorage[key].length * 2);
    }
    return (total / 1024).toFixed(2) + ' KB';
  }

  clearDB() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }

  onSync(callback: (data: any) => void) {
    syncChannel.onmessage = (event) => callback(event.data);
  }
}

export const db = new DatabaseService();

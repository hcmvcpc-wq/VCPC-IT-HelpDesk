
import { Ticket, User, Asset, SystemLog } from '../types';
import { pushToCloud, pullFromCloud } from './googleSheetsService';

const STORAGE_KEYS = {
  TICKETS: 'helpdesk_db_tickets',
  USERS: 'helpdesk_db_users',
  ASSETS: 'helpdesk_db_assets',
  LOGS: 'helpdesk_db_logs',
  INITIALIZED: 'helpdesk_db_initialized',
  CLOUD_URL: 'helpdesk_cloud_sync_url',
  MYSQL_API_URL: 'helpdesk_mysql_api_url',
  REMOTE_JSON_URL: 'helpdesk_remote_json_url',
  LAST_SYNC: 'helpdesk_last_sync_time'
};

const syncChannel = new BroadcastChannel('helpdesk_realtime_sync');

class DatabaseService {
  private isPushing = false;

  private broadcastChange(type: 'TICKETS' | 'USERS' | 'ASSETS' | 'LOGS' | 'ALL') {
    syncChannel.postMessage({ type, timestamp: Date.now() });
    window.dispatchEvent(new CustomEvent('local_db_update', { detail: { type } }));
    this.autoPush(type);
  }

  private async autoPush(type: string) {
    if (this.isPushing) return;
    const mysqlUrl = this.getMysqlApiUrl();
    const cloudUrl = this.getCloudUrl();

    if (!mysqlUrl && !cloudUrl) return;

    this.isPushing = true;
    try {
      // MySQL Priority Sync
      if (mysqlUrl) {
        const payload = {
          type,
          data: {
            tickets: type === 'TICKETS' || type === 'ALL' ? this.getTickets() : [],
            users: type === 'USERS' || type === 'ALL' ? this.getUsers() : [],
            assets: type === 'ASSETS' || type === 'ALL' ? this.getAssets() : [],
            logs: type === 'LOGS' || type === 'ALL' ? this.getLogs() : []
          }
        };

        await fetch(`${mysqlUrl}/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      }

      // Google Sheets Backup Sync
      if (cloudUrl) {
        if (type === 'TICKETS' || type === 'ALL') await pushToCloud(cloudUrl, 'Tickets', this.getTickets());
        if (type === 'ASSETS' || type === 'ALL') await pushToCloud(cloudUrl, 'Assets', this.getAssets());
        if (type === 'USERS' || type === 'ALL') await pushToCloud(cloudUrl, 'Users', this.getUsers());
      }
    } catch (e) {
      console.warn("Database sync failed, keeping local copy.", e);
    } finally {
      this.isPushing = false;
    }
  }

  setMysqlApiUrl(url: string) {
    if (url && !url.startsWith('http')) {
      throw new Error("URL must start with http/https");
    }
    localStorage.setItem(STORAGE_KEYS.MYSQL_API_URL, url || '');
    if (url) {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      this.syncFromMysql();
    }
  }

  getMysqlApiUrl(): string | null {
    return localStorage.getItem(STORAGE_KEYS.MYSQL_API_URL);
  }

  setCloudUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.CLOUD_URL, url || '');
    if (url) {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      this.broadcastChange('ALL');
    }
  }

  getCloudUrl(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CLOUD_URL);
  }

  setRemoteJsonUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.REMOTE_JSON_URL, url);
    this.syncFromRemoteUrl();
  }

  getRemoteJsonUrl(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REMOTE_JSON_URL);
  }

  getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }

  async syncFromMysql(): Promise<boolean> {
    const url = this.getMysqlApiUrl();
    if (!url) return false;
    try {
      const response = await fetch(`${url}/pull`);
      const data = await response.json();
      return this.importDB(JSON.stringify(data));
    } catch (e) {
      console.error("MySQL Sync Error:", e);
      return false;
    }
  }

  async syncWithCloud(): Promise<boolean> {
    const url = this.getCloudUrl();
    if (!url) return false;
    try {
      const cloudData = await pullFromCloud(url);
      if (cloudData) {
        return this.importDB(JSON.stringify({
          tickets: cloudData.Tickets,
          users: cloudData.Users,
          assets: cloudData.Assets
        }));
      }
      return false;
    } catch (e) { return false; }
  }

  async syncFromRemoteUrl(): Promise<boolean> {
    const url = this.getRemoteJsonUrl();
    if (!url) return false;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return this.importDB(JSON.stringify(data));
    } catch (e) { return false; }
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

  importDB(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      let hasChange = false;
      const tickets = data.tickets || data.Tickets;
      const users = data.users || data.Users;
      const assets = data.assets || data.Assets;

      if (tickets) { localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets)); hasChange = true; }
      if (users) { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); hasChange = true; }
      if (assets) { localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets)); hasChange = true; }
      
      if (hasChange) {
        this.setInitialized();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        window.dispatchEvent(new CustomEvent('local_db_update', { detail: { type: 'ALL' } }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("DB Import Error:", e);
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

  onSync(callback: (data: any) => void) {
    syncChannel.onmessage = (event) => callback(event.data);
  }
}

export const db = new DatabaseService();

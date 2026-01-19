import { Ticket, User, Asset } from '../types';

const STORAGE_KEYS = {
  TICKETS: 'helpdesk_db_tickets',
  USERS: 'helpdesk_db_users',
  ASSETS: 'helpdesk_db_assets',
};

class DatabaseService {
  // Lấy toàn bộ dữ liệu để backup
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

  // Nạp dữ liệu từ file backup
  importDB(jsonData: string) {
    try {
      const data = JSON.parse(jsonData);
      if (data.tickets) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }

  // Quản lý Tickets
  getTickets(): Ticket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  }

  saveTickets(tickets: Ticket[]) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }

  // Quản lý Users
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Quản lý Assets
  getAssets(): Asset[] {
    const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return data ? JSON.parse(data) : [];
  }

  saveAssets(assets: Asset[]) {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  }

  // Xóa sạch DB
  clearDB() {
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
  }
}

export const db = new DatabaseService();
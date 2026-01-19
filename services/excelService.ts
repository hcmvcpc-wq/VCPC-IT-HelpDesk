import * as XLSX from 'xlsx';
import { Ticket, Asset, User, SystemLog } from '../types';

/**
 * Xuất dữ liệu Ticket cơ bản
 */
export const exportTicketsToExcel = (tickets: Ticket[]) => {
  const data = tickets.map(t => ({
    'Ma_Phieu': t.id,
    'Tieu_De': t.title,
    'Mo_Ta': t.description,
    'Trang_Thai': t.status,
    'Uu_Tien': t.priority,
    'Danh_Muc': t.category,
    'Nguoi_Tao': t.creatorName,
    'Don_Vi': t.subsidiary,
    'Phong_Ban': t.department,
    'Vi_Tri': t.location,
    'Ngay_Tao': new Date(t.createdAt).toLocaleString('vi-VN'),
    'Cap_Nhat': new Date(t.updatedAt).toLocaleString('vi-VN')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
  
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Bao_Cao_Tickets_${dateStr}.xlsx`);
};

/**
 * Xuất toàn bộ Database sang Excel để Import vào MS Access
 */
export const exportFullDatabaseToExcel = (data: {
  tickets: Ticket[],
  assets: Asset[],
  users: User[],
  logs: SystemLog[]
}) => {
  const workbook = XLSX.utils.book_new();

  // 1. Sheet Tickets
  const ticketData = data.tickets.map(t => ({
    ID: t.id,
    Title: t.title,
    Description: t.description,
    Status: t.status,
    Priority: t.priority,
    Category: t.category,
    CreatorID: t.creatorId,
    CreatorName: t.creatorName,
    Subsidiary: t.subsidiary,
    Department: t.department,
    CreatedAt: t.createdAt,
    UpdatedAt: t.updatedAt
  }));
  const ticketSheet = XLSX.utils.json_to_sheet(ticketData);
  XLSX.utils.book_append_sheet(workbook, ticketSheet, "Tickets");

  // 2. Sheet Assets
  const assetData = data.assets.map(a => ({
    AssetID: a.id,
    AssetName: a.name,
    Type: a.type,
    SerialNumber: a.serialNumber,
    Status: a.status,
    AssignedToID: a.assignedToId || 'N/A',
    AssignedToName: a.assignedToName || 'N/A',
    Subsidiary: a.subsidiary,
    Department: a.department,
    PurchaseDate: a.purchaseDate,
    Value: a.value
  }));
  const assetSheet = XLSX.utils.json_to_sheet(assetData);
  XLSX.utils.book_append_sheet(workbook, assetSheet, "Assets");

  // 3. Sheet Users
  const userData = data.users.map(u => ({
    UserID: u.id,
    Username: u.username,
    FullName: u.fullName,
    Role: u.role,
    Department: u.department,
    Subsidiary: u.subsidiary
  }));
  const userSheet = XLSX.utils.json_to_sheet(userData);
  XLSX.utils.book_append_sheet(workbook, userSheet, "Users");

  // 4. Sheet Logs
  const logData = data.logs.map(l => ({
    LogID: l.id,
    Timestamp: l.timestamp,
    UserID: l.userId,
    UserName: l.userName,
    Action: l.action,
    Details: l.details,
    Type: l.type
  }));
  const logSheet = XLSX.utils.json_to_sheet(logData);
  XLSX.utils.book_append_sheet(workbook, logSheet, "SystemLogs");

  // Xuất file
  const timestamp = new Date().getTime();
  XLSX.writeFile(workbook, `IT_Helpdesk_Master_DB_${timestamp}.xlsx`);
};
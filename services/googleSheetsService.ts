
import { Ticket, Asset, User, SystemLog } from '../types';

/**
 * GOOGLE APPS SCRIPT CODE (Dành cho người dùng)
 */
export const generateGoogleAppsScript = (): string => {
  return `
/**
 * GOOGLE APPS SCRIPT FOR IT HELPDESK REAL-TIME SYNC
 */
var ss = SpreadsheetApp.getActiveSpreadsheet();

function doPost(e) {
  var requestData = JSON.parse(e.postData.contents);
  var action = requestData.action; // 'PUSH' hoặc 'PULL'
  
  if (action === 'PUSH') {
    var type = requestData.type;
    var payload = requestData.payload;
    var sheet = ss.getSheetByName(type) || ss.insertSheet(type);
    
    // Xóa dữ liệu cũ và ghi mới để giữ bản master (Mirror Sync)
    sheet.clear();
    if (payload.length > 0) {
      var headers = Object.keys(payload[0]);
      sheet.appendRow(headers);
      payload.forEach(function(item) {
        sheet.appendRow(Object.values(item));
      });
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Data Synced to Cloud"})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  // Trả về toàn bộ dữ liệu hiện có để trình duyệt khác Pull về
  var results = {};
  var sheets = ss.getSheets();
  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    var data = sheet.getDataRange().getValues();
    if (data.length > 1) {
      var headers = data[0];
      var rows = data.slice(1);
      results[name] = rows.map(function(row) {
        var obj = {};
        headers.forEach(function(header, i) { obj[header] = row[i]; });
        return obj;
      });
    }
  });
  return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
}
`;
};

/**
 * Gửi dữ liệu lên Cloud
 */
export const pushToCloud = async (url: string, type: string, data: any[]) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script yêu cầu no-cors hoặc xử lý OPTIONS
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'PUSH', type, payload: data })
    });
    return true;
  } catch (error) {
    console.error("Cloud Push Error:", error);
    return false;
  }
};

/**
 * Lấy dữ liệu từ Cloud
 */
export const pullFromCloud = async (url: string) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Cloud Pull Error:", error);
    return null;
  }
};

export const exportCSVForSheets = (data: any[], fileName: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
  const csvContent = "\uFEFF" + headers + "\n" + rows.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}.csv`);
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadScriptFile = (content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'google_apps_script_realtime.txt';
  link.click();
  URL.revokeObjectURL(url);
};

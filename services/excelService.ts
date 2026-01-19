import * as XLSX from 'xlsx';
import { Ticket } from '../types';

export const exportTicketsToExcel = (tickets: Ticket[]) => {
  // Chuẩn bị dữ liệu để xuất
  const data = tickets.map(t => ({
    'Mã Phiếu': t.id,
    'Tiêu Đề': t.title,
    'Mô Tả': t.description,
    'Trạng Thái': t.status,
    'Mức Độ Ưu Tiên': t.priority,
    'Danh Mục': t.category,
    'Người Tạo': t.creatorName,
    'Đơn Vị': t.subsidiary,
    'Phòng Ban': t.department,
    'Vị Trí': t.location,
    'Ngày Tạo': new Date(t.createdAt).toLocaleString('vi-VN'),
    'Cập Nhật Cuối': new Date(t.updatedAt).toLocaleString('vi-VN'),
    'Số Bình Luận': t.comments?.length || 0
  }));

  // Tạo workbook và worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach yeu cau");

  // Thiết lập độ rộng cột cơ bản
  const wscols = [
    { wch: 10 }, // Mã
    { wch: 30 }, // Tiêu đề
    { wch: 50 }, // Mô tả
    { wch: 15 }, // Trạng thái
    { wch: 15 }, // Ưu tiên
    { wch: 15 }, // Danh mục
    { wch: 20 }, // Người tạo
    { wch: 10 }, // Đơn vị
    { wch: 15 }, // Phòng ban
    { wch: 15 }, // Vị trí
    { wch: 20 }, // Ngày tạo
    { wch: 20 }, // Cập nhật
    { wch: 12 }  // Bình luận
  ];
  worksheet['!cols'] = wscols;

  // Tạo file và kích hoạt tải về
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Bao_Cao_Helpdesk_${dateStr}.xlsx`);
};
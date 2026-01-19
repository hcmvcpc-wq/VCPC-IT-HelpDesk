
import React, { useState, useMemo } from 'react';
import { Asset, AssetStatus, User } from '../types.ts';
import { ASSET_TYPES } from '../constants.tsx';

interface AssetManagementProps {
  assets: Asset[];
  users: User[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (id: string, updates: Partial<Asset>) => void;
  onDeleteAsset: (id: string) => void;
}

const AssetManagement: React.FC<AssetManagementProps> = ({ 
  assets, users, onAddAsset, onUpdateAsset, onDeleteAsset 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: ASSET_TYPES[0],
    serialNumber: '',
    status: AssetStatus.IN_STOCK,
    assignedToId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    value: 0
  });

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'ALL' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [assets, searchTerm, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: assets.length,
      inUse: assets.filter(a => a.status === AssetStatus.IN_USE).length,
      totalValue: assets.reduce((sum, a) => sum + a.value, 0),
      broken: assets.filter(a => a.status === AssetStatus.BROKEN || a.status === AssetStatus.REPAIRING).length
    };
  }, [assets]);

  const handleExportExcel = () => {
    if (filteredAssets.length === 0) return;

    // Headers cho file CSV
    const headers = ['Mã Tài Sản', 'Tên Thiết Bị', 'Loại', 'Số Serial', 'Trạng Thái', 'Người Sử Dụng', 'Ngày Nhập', 'Giá Trị (VNĐ)'];
    
    // Dữ liệu hàng
    const rows = filteredAssets.map(a => [
      a.id,
      a.name,
      a.type,
      a.serialNumber,
      a.status,
      a.assignedToName || 'Chưa cấp phát',
      a.purchaseDate,
      a.value
    ]);

    // Tạo nội dung CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Sử dụng BOM (Byte Order Mark) để Excel nhận diện UTF-8 (hiển thị đúng tiếng Việt)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_cao_tai_san_IT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        name: asset.name,
        type: asset.type,
        serialNumber: asset.serialNumber,
        status: asset.status,
        assignedToId: asset.assignedToId || '',
        purchaseDate: asset.purchaseDate,
        value: asset.value
      });
    } else {
      setEditingAsset(null);
      setFormData({
        name: '',
        type: ASSET_TYPES[0],
        serialNumber: '',
        status: AssetStatus.IN_STOCK,
        assignedToId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        value: 0
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = users.find(u => u.id === formData.assignedToId);
    
    const assetData: Asset = {
      id: editingAsset ? editingAsset.id : `AST-${Date.now().toString().slice(-4)}`,
      ...formData,
      assignedToName: assignedUser ? assignedUser.fullName : undefined
    };

    if (editingAsset) {
      onUpdateAsset(editingAsset.id, assetData);
    } else {
      onAddAsset(assetData);
    }
    setShowModal(false);
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.IN_USE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case AssetStatus.IN_STOCK: return 'bg-blue-50 text-blue-600 border-blue-100';
      case AssetStatus.REPAIRING: return 'bg-amber-50 text-amber-600 border-amber-100';
      case AssetStatus.BROKEN: return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto pb-24 page-enter">
      {/* Header & Quick Stats */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý <span className="text-blue-600">Tài sản IT</span></h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Kiểm kê, phân bổ thiết bị và theo dõi khấu hao tài sản công nghệ.</p>
          <div className="flex flex-wrap gap-4 mt-6">
            <button 
              onClick={() => handleOpenModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 transition transform active:scale-95 shadow-xl shadow-slate-200"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Nhập tài sản mới</span>
            </button>
            <button 
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 transition transform active:scale-95 shadow-xl shadow-emerald-100"
            >
              <i className="fa-solid fa-file-excel"></i>
              <span>Xuất Excel (CSV)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto">
          {[
            { label: 'Tổng thiết bị', value: stats.total, color: 'text-slate-900', icon: 'fa-box-archive' },
            { label: 'Đang cấp phát', value: stats.inUse, color: 'text-emerald-600', icon: 'fa-user-check' },
            { label: 'Cần bảo trì', value: stats.broken, color: 'text-rose-600', icon: 'fa-screwdriver-wrench' },
            { label: 'Tổng giá trị', value: (stats.totalValue / 1000000).toFixed(1) + 'M', color: 'text-blue-600', icon: 'fa-money-bill-trend-up' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${item.color} mb-3`}>
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Tìm theo tên thiết bị, Serial Number..."
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-50 rounded-3xl outline-none focus:border-blue-600 transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-6 py-4 bg-white border-2 border-slate-50 rounded-3xl outline-none focus:border-blue-600 font-bold text-slate-700 shadow-sm"
        >
          <option value="ALL">Tất cả loại tài sản</option>
          {ASSET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {/* Asset List */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-6">Thiết bị & Serial</th>
                <th className="px-10 py-6">Loại</th>
                <th className="px-10 py-6">Trạng thái</th>
                <th className="px-10 py-6">Người sử dụng</th>
                <th className="px-10 py-6 text-right">Giá trị & Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center">
                    <div className="opacity-30">
                      <i className="fa-solid fa-box-open text-6xl mb-4"></i>
                      <p className="font-bold">Không tìm thấy tài sản phù hợp</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <i className={`fa-solid ${
                            asset.type === 'Laptop' ? 'fa-laptop' : 
                            asset.type === 'Monitor' ? 'fa-desktop' : 
                            asset.type === 'Printer' ? 'fa-print' : 'fa-server'
                          } text-lg`}></i>
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-800">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{asset.id} • SN: {asset.serialNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className="text-sm font-bold text-slate-600">{asset.type}</span>
                    </td>
                    <td className="px-10 py-7">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusColor(asset.status)}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      {asset.assignedToName ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                            {asset.assignedToName.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{asset.assignedToName}</span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-300">Chưa cấp phát</span>
                      )}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end space-x-4">
                         <p className="text-sm font-black text-slate-900">{asset.value.toLocaleString()} ₫</p>
                         <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(asset)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition"><i className="fa-solid fa-pen-to-square"></i></button>
                            <button onClick={() => {if(window.confirm('Xóa tài sản này?')) onDeleteAsset(asset.id)}} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition"><i className="fa-solid fa-trash-can"></i></button>
                         </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-slate-900 text-white relative">
              <h3 className="text-3xl font-black tracking-tight">{editingAsset ? 'Cập nhật' : 'Khai báo'} Tài sản</h3>
              <p className="text-slate-400 font-medium mt-1">Thông tin chi tiết thiết bị công nghệ.</p>
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-10 right-10 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên thiết bị</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none transition font-bold" placeholder="VD: Dell Latitude 5420" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số Serial</label>
                  <input required type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none transition font-mono font-bold" placeholder="VD: SN-123456" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Loại tài sản</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none transition font-bold bg-white">
                    {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Trạng thái</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none transition font-bold bg-white">
                    {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Người sử dụng</label>
                <select value={formData.assignedToId} onChange={e => setFormData({...formData, assignedToId: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none transition font-bold bg-white">
                  <option value="">-- Chưa cấp phát --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.department})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ngày nhập kho</label>
                  <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none transition font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Giá trị (VNĐ)</label>
                  <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: parseInt(e.target.value) || 0})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none transition font-bold" />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transform transition active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-widest">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>{editingAsset ? 'Lưu thay đổi' : 'Xác nhận nhập kho'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;

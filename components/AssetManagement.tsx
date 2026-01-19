
import React, { useState, useMemo } from 'react';
import { Asset, AssetStatus, User } from '../types';
import { ASSET_TYPES, SUBSIDIARIES, DEPARTMENTS } from '../constants';

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
    subsidiary: SUBSIDIARIES[0],
    department: DEPARTMENTS[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    value: 0
  });

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.subsidiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.assignedToName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'ALL' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [assets, searchTerm, typeFilter]);

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        name: asset.name,
        type: asset.type,
        serialNumber: asset.serialNumber,
        status: asset.status,
        assignedToId: asset.assignedToId || '',
        subsidiary: asset.subsidiary,
        department: asset.department,
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
        subsidiary: SUBSIDIARIES[0],
        department: DEPARTMENTS[0],
        purchaseDate: new Date().toISOString().split('T')[0],
        value: 0
      });
    }
    setShowModal(true);
  };

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      assignedToId: userId,
      // Logic thông minh: Nếu có người dùng, tự động chuyển trạng thái thành IN_USE
      status: userId ? AssetStatus.IN_USE : AssetStatus.IN_STOCK,
      // Nếu có người dùng, tự động cập nhật đơn vị và phòng ban theo người dùng đó
      subsidiary: selectedUser ? selectedUser.subsidiary : prev.subsidiary,
      department: selectedUser ? selectedUser.department : prev.department
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = users.find(u => u.id === formData.assignedToId);
    const assetData: Asset = {
      id: editingAsset ? editingAsset.id : `AST-${Date.now().toString().slice(-4)}`,
      ...formData,
      assignedToName: assignedUser ? assignedUser.fullName : undefined
    };
    if (editingAsset) onUpdateAsset(editingAsset.id, assetData);
    else onAddAsset(assetData);
    setShowModal(false);
  };

  const getStatusStyle = (status: AssetStatus) => {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Quản lý <span className="text-blue-600">Tài sản IT</span></h1>
          <p className="text-slate-500 font-medium mt-3">Bàn giao, thu hồi và theo dõi thiết bị trong toàn đơn vị.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tìm thiết bị, SN, nhân viên..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-sm font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center space-x-3 transition transform active:scale-95 shrink-0">
            <i className="fa-solid fa-plus"></i>
            <span>Thêm tài sản</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-2">
           <button onClick={() => setTypeFilter('ALL')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${typeFilter === 'ALL' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>Tất cả</button>
           {ASSET_TYPES.map(type => (
             <button key={type} onClick={() => setTypeFilter(type)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${typeFilter === type ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>{type}</button>
           ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-6">Thiết bị</th>
                <th className="px-10 py-6">Đơn vị / Phòng ban</th>
                <th className="px-10 py-6 text-center">Trạng thái</th>
                <th className="px-10 py-6">Người sử dụng</th>
                <th className="px-10 py-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-medium italic">Không có dữ liệu tài sản phù hợp</td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <i className={`fa-solid ${asset.type === 'Laptop' ? 'fa-laptop' : asset.type === 'Mobile' ? 'fa-mobile' : 'fa-box-open'}`}></i>
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SN: {asset.serialNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{asset.subsidiary}</span>
                        <span className="text-sm font-bold text-slate-600 mt-0.5">{asset.department}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(asset.status)}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      {asset.assignedToName ? (
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg">
                             {asset.assignedToName.charAt(0)}
                           </div>
                           <span className="text-sm font-black text-slate-800 underline decoration-blue-500/30 underline-offset-4">{asset.assignedToName}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleOpenModal(asset)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <i className="fa-solid fa-user-plus text-xs"></i>
                          <span className="text-[10px] font-black uppercase tracking-widest">Bàn giao ngay</span>
                        </button>
                      )}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(asset)} 
                          title="Bàn giao / Chỉnh sửa"
                          className="w-11 h-11 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-2xl transition-all hover:scale-110"
                        >
                          <i className="fa-solid fa-user-tag"></i>
                        </button>
                        <button 
                          onClick={() => {if(window.confirm('Xóa thông tin tài sản này?')) onDeleteAsset(asset.id)}} 
                          title="Xóa tài sản"
                          className="w-11 h-11 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-2xl transition-all hover:scale-110"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-black tracking-tight">{editingAsset ? 'Bàn giao / Cập nhật' : 'Thêm tài sản'}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-bold">Vui lòng điền đầy đủ thông tin thiết bị.</p>
               </div>
               <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90">
                 <i className="fa-solid fa-xmark"></i>
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
              {/* PHẦN THÔNG TIN THIẾT BỊ */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">1. Thông tin thiết bị</p>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên thiết bị</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50" placeholder="VD: Laptop HP EliteBook 840 G8" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Loại tài sản</label>
                    <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50">
                      {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số Serial / Service Tag</label>
                    <input required type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50" placeholder="VD: SN-5CG21..." />
                  </div>
                </div>
              </div>

              {/* PHẦN BÀN GIAO NHÂN SỰ */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">2. Bàn giao & Sở hữu</p>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Người sử dụng</label>
                  <select 
                    value={formData.assignedToId} 
                    onChange={e => handleUserChange(e.target.value)} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-600 outline-none font-black text-slate-800 bg-blue-50/30"
                  >
                    <option value="">-- Để trống nếu chưa bàn giao --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.username} - {u.department})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Đơn vị sở hữu</label>
                    <select required value={formData.subsidiary} onChange={e => setFormData({...formData, subsidiary: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50">
                      {SUBSIDIARIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phòng ban quản lý</label>
                    <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Trạng thái vận hành</label>
                  <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-slate-50/50">
                    <option value={AssetStatus.IN_STOCK}>Trong kho (Sẵn sàng cấp)</option>
                    <option value={AssetStatus.IN_USE}>Đang sử dụng (Đã bàn giao)</option>
                    <option value={AssetStatus.REPAIRING}>Đang sửa chữa / Bảo hành</option>
                    <option value={AssetStatus.BROKEN}>Hư hỏng / Không sử dụng được</option>
                    <option value={AssetStatus.RETIRED}>Đã thanh lý</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black shadow-2xl shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center space-x-3">
                  <i className="fa-solid fa-check-circle text-lg"></i>
                  <span>{editingAsset ? 'Xác nhận Bàn giao / Cập nhật' : 'Xác nhận thêm mới'}</span>
                </button>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">Dữ liệu sẽ được lưu vào hệ thống và ghi nhật ký tự động</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;

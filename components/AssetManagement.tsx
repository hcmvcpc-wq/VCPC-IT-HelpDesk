import React, { useState, useMemo } from 'react';
import { Asset, AssetStatus, User } from '../types';
import { ASSET_TYPES } from '../constants';

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

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto pb-24 page-enter">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý <span className="text-blue-600">Tài sản IT</span></h1>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold">Nhập tài sản mới</button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-6">Thiết bị</th>
                <th className="px-10 py-6">Trạng thái</th>
                <th className="px-10 py-6">Người dùng</th>
                <th className="px-10 py-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-10 py-7 font-black text-slate-800">{asset.name}</td>
                  <td className="px-10 py-7 text-xs font-bold">{asset.status}</td>
                  <td className="px-10 py-7 text-sm">{asset.assignedToName || 'Chưa cấp'}</td>
                  <td className="px-10 py-7 text-right">
                    <button onClick={() => {if(window.confirm('Xóa?')) onDeleteAsset(asset.id)}} className="text-rose-500"><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10">
            <h3 className="text-2xl font-black mb-6">Nhập tài sản</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100" placeholder="Tên thiết bị" />
              <input required type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100" placeholder="Số Serial" />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">Xác nhận</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full py-2">Hủy</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;
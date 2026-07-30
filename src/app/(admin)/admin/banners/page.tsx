'use client';

import { useState, useEffect } from 'react';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
}

const positionMap: Record<string, string> = {
  home: '首页',
  divination: '排盘页',
  membership: '会员页',
  offering: '供奉页',
  profile: '个人中心',
};

const positionOptions = Object.entries(positionMap).map(([value, label]) => ({ value, label }));

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (positionFilter) params.set('position', positionFilter);
      const res = await fetch(`/api/admin/banners?${params}`);
      if (res.ok) {
        const d = await res.json();
        setBanners(d.banners || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [positionFilter]);

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'home',
    sortOrder: 0,
    isActive: true,
    startAt: '',
    endAt: '',
  });

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      position: 'home',
      sortOrder: banners.length,
      isActive: true,
      startAt: '',
      endAt: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startAt: banner.startAt || '',
      endAt: banner.endAt || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.imageUrl) {
      alert('请填写标题和图片链接');
      return;
    }

    if (editingBanner) {
      const res = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingBanner.id, ...formData }),
      });
      if (res.ok) {
        setModalOpen(false);
        fetchBanners();
      }
    } else {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setModalOpen(false);
        fetchBanners();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此 Banner？')) return;
    const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchBanners();
  };

  const toggleActive = async (banner: Banner) => {
    const res = await fetch('/api/admin/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: banner.id, isActive: !banner.isActive }),
    });
    if (res.ok) fetchBanners();
  };

  const handleDragStart = (id: string) => {
    setDragId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;

    const newBanners = [...banners];
    const dragIndex = newBanners.findIndex((b) => b.id === dragId);
    const targetIndex = newBanners.findIndex((b) => b.id === targetId);

    const [moved] = newBanners.splice(dragIndex, 1);
    newBanners.splice(targetIndex, 0, moved);

    const orders = newBanners.map((b, idx) => ({ id: b.id, sortOrder: idx }));

    await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });

    setBanners(newBanners.map((b, idx) => ({ ...b, sortOrder: idx })));
    setDragId(null);
    setDragOverId(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Banner管理</h2>
          <p className="text-sm text-gray-500">共 {banners.length} 个 Banner</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={positionFilter}
            onChange={(e) => { setPositionFilter(e.target.value); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部位置</option>
            {positionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            + 新增 Banner
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium w-12">排序</th>
              <th className="px-4 py-3 text-gray-500 font-medium">标题</th>
              <th className="px-4 py-3 text-gray-500 font-medium">图片</th>
              <th className="px-4 py-3 text-gray-500 font-medium">位置</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">生效时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : banners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无 Banner</td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr
                  key={banner.id}
                  className={`border-b hover:bg-gray-50 cursor-move transition-colors ${
                    dragOverId === banner.id ? 'bg-blue-50' : ''
                  } ${dragId === banner.id ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(banner.id)}
                  onDragOver={(e) => handleDragOver(e, banner.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={() => handleDrop(banner.id)}
                >
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-lg">⋮⋮</span>
                    <span className="ml-2 text-xs text-gray-500">{banner.sortOrder}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{banner.title}</td>
                  <td className="px-4 py-3">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-20 h-12 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400">无图</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {positionMap[banner.position] || banner.position}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(banner)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        banner.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {banner.isActive ? '已上架' : '已下架'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>开始: {formatDate(banner.startAt)}</div>
                    <div>结束: {formatDate(banner.endAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(banner)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingBanner ? '编辑 Banner' : '新增 Banner'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Banner 标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图片链接 *</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="预览"
                    className="mt-2 w-32 h-20 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跳转链接</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="https://example.com (可选)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {positionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">生效开始</label>
                  <input
                    type="datetime-local"
                    value={formData.startAt ? formData.startAt.slice(0, 16) : ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      startAt: e.target.value ? new Date(e.target.value).toISOString() : ''
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">生效结束</label>
                  <input
                    type="datetime-local"
                    value={formData.endAt ? formData.endAt.slice(0, 16) : ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      endAt: e.target.value ? new Date(e.target.value).toISOString() : ''
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">立即上架</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                {editingBanner ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
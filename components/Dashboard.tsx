import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Settings, FileText, Image, List, Grid, Trash2, Code, ChevronRight, X, Layers, RefreshCw, DownloadCloud } from 'lucide-react';
import { ClipItem, AppSettings } from '../types';
import { AddItemModal } from './AddItemModal';
import { ItemDetailModal } from './ItemDetailModal';

interface DashboardProps {
  password: string;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ password, onLogout }) => {
  const [items, setItems] = useState<ClipItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ appTitle: 'Clipboard', subTitle: 'Cloud Share' });
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClipItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [tempTitle, setTempTitle] = useState('');
  const [tempSubtitle, setTempSubtitle] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    }
  };

  // Fetch Data & Settings
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch
      const [itemsRes, settingsRes] = await Promise.all([
        fetch('/api/items', { headers: { 'Authorization': password } }),
        fetch('/api/settings', { headers: { 'Authorization': password } })
      ]);
      setTempTitle(settingsData.appTitle);
      setTempSubtitle(settingsData.subTitle);
      document.title = settingsData.appTitle;
    }

    } catch (e) {
    console.error("Failed to fetch data", e);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, []);

const handleAddItem = async (formData: FormData) => {
  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Authorization': password },
      body: formData
    });
    if (res.ok) {
      fetchData(); // Refresh list
    } else {
      alert('上传失败，请重试');
    }
  } catch (e) {
    alert('网络错误');
  }
};

const handleDelete = async (e: React.MouseEvent, id: string) => {
  e.stopPropagation();
  if (confirm('确定要删除这个条目吗？')) {
    const oldItems = [...items];
    setItems(items.filter(i => i.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': password }
      });
      if (!res.ok) {
        setItems(oldItems); // Revert
        alert('删除失败');
      }
    } catch (err) {
      setItems(oldItems);
    }
  }
};

const saveSettings = async () => {
  setSavingSettings(true);
  try {
    const newSettings = { appTitle: tempTitle, subTitle: tempSubtitle };
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': password
      },
      body: JSON.stringify(newSettings)
    });

    if (res.ok) {
      setSettings(newSettings);
      document.title = newSettings.appTitle;
      setShowSettings(false);
    } else {
      alert('保存设置失败');
    }
  } catch (e) {
    alert('保存失败');
  } finally {
    setSavingSettings(false);
  }
}

const filteredItems = useMemo(() => items.filter(item =>
  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.texts.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
  item.files.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
  item.files.some(f => f.remark?.toLowerCase().includes(searchQuery.toLowerCase()))
), [items, searchQuery]);

const getItemType = (item: ClipItem): 'text' | 'image' | 'file' | 'mixed' => {
  const hasText = item.texts.length > 0;
  const hasFiles = item.files.length > 0;

  if (hasText && hasFiles) return 'mixed';
  if (hasFiles) {
    return item.files.every(f => f.type === 'image') ? 'image' : 'file';
  }
  return 'text';
};

const renderIcon = (type: string) => {
  switch (type) {
    case 'image': return <Image size={20} />;
    case 'file': return <FileText size={20} />;
    case 'mixed': return <Layers size={20} />;
    default: return <Code size={20} />;
  }
};

return (
  <div className="min-h-screen bg-[#f8f9fa] pb-24 sm:pb-10 selection:bg-black selection:text-white">
    {/* Header */}
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">

          {/* Branding */}
          <div
            className="flex flex-col group cursor-pointer select-none"
            onClick={() => setShowSettings(true)}
            title="点击修改全局标题"
          >
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight group-hover:opacity-70 transition-opacity">
                {settings.appTitle}
              </h1>
              <Settings size={14} className="ml-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {settings.subTitle && (
              <p className="text-xs text-gray-500 font-medium tracking-wide group-hover:text-gray-400 transition-colors">
                {settings.subTitle}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex items-center bg-gray-100/80 hover:bg-gray-100 rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all duration-200">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="搜索标题、内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-gray-800 placeholder-gray-400"
              />
            </div>

            <button
              onClick={fetchData}
              className={`p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block ${loading ? 'animate-spin' : ''}`}
              title="刷新列表"
            >
              <RefreshCw size={20} />
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-black text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95"
            >
              <Plus size={18} className="mr-1" />
              <span className="text-sm">新建</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2.5 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="搜索内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {loading && items.length === 0 ? (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mb-2"></span>
          正在加载数据...
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Plus size={32} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无内容</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">
            点击右上角的“新建”按钮，开始分享您的第一个代码片段或文件。
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm font-semibold text-black hover:underline"
          >
            立即创建 →
          </button>
        </div>
      ) : (
        <div className={`
            ${viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'space-y-3'}
          `}>
          {filteredItems.map(item => {
            const type = getItemType(item);
            const fileRemarks = item.files.map(f => f.remark).filter(Boolean);
            const hasFiles = item.files.length > 0;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`
                    group bg-white border border-gray-200/75 hover:border-gray-300 
                    shadow-sm hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 cursor-pointer
                    ${viewMode === 'grid' ? 'rounded-2xl flex flex-col h-full' : 'rounded-xl p-4 flex items-center justify-between'}
                  `}
              >
                {/* Card Body */}
                <div className={`${viewMode === 'grid' ? 'p-5' : 'flex-1 min-w-0 pr-4'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`
                             shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors
                             ${type === 'image' ? 'bg-purple-50 text-purple-600' :
                          type === 'file' ? 'bg-orange-50 text-orange-600' :
                            type === 'mixed' ? 'bg-indigo-50 text-indigo-600' :
                              'bg-blue-50 text-blue-600'}
                           `}>
                        {renderIcon(type)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-base leading-tight mb-0.5" title={item.title}>
                          {item.title}
                        </h3>
                        <span className="text-[11px] text-gray-400 font-medium block">
                          {new Date(item.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview / Thumbnail */}
                  <div className="mt-4">
                    {type === 'image' && hasFiles ? (
                      <div className="rounded-lg bg-gray-50 aspect-[2/1] flex items-center justify-center text-gray-400 border border-gray-100 relative overflow-hidden">
                        <Image size={32} className="opacity-20" />
                        <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/5 to-transparent">
                          <span className="text-[10px] font-medium bg-white/90 px-2 py-0.5 rounded text-gray-600 shadow-sm truncate max-w-full">
                            {item.files[0].name} {item.files.length > 1 ? `+${item.files.length - 1}` : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative bg-gray-50 rounded-lg p-3 border border-gray-100 h-24 overflow-hidden group-hover:bg-gray-50/80 transition-colors">
                        <p className="text-xs text-gray-500 font-mono break-all line-clamp-4 leading-relaxed">
                          {item.texts[0] || (hasFiles ? `[附件: ${item.files[0].name}]` : '[无内容]')}
                        </p>
                        {item.texts.length > 1 && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md">+{item.texts.length - 1}</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                      </div>
                    )}
                  </div>

                  {fileRemarks.length > 0 && (
                    <div className="mt-3 text-xs text-gray-400 truncate flex items-center">
                      <span className="w-1 h-1 bg-yellow-400 rounded-full mr-2"></span>
                      {fileRemarks[0]}
                      {fileRemarks.length > 1 && <span className="ml-1 opacity-60"> (+{fileRemarks.length - 1})</span>}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className={`
                    ${viewMode === 'grid'
                    ? 'mt-auto px-5 py-3 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center rounded-b-2xl'
                    : 'hidden'}
                  `}>
                  <span className="text-[10px] font-mono text-gray-300">#{item.id}</span>
                  <div className="flex items-center text-xs text-gray-400 font-medium group-hover:text-black transition-colors">
                    查看详情 <ChevronRight size={14} className="ml-1" />
                  </div>
                </div>

                {/* List View Actions */}
                {viewMode === 'list' && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>

    <AddItemModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onAdd={handleAddItem}
    />

    <ItemDetailModal
      item={selectedItem}
      onClose={() => setSelectedItem(null)}
      password={password}
    />

    {/* Settings Modal */}
    {showSettings && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Settings className="mr-2.5 text-gray-500" size={18} />
              应用设置
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              提示：此处修改的标题将同步到所有设备。
            </p>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">站点名称 (自定义)</label>
              <input
                value={tempTitle}
                onChange={e => setTempTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-0 outline-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">副标题</label>
              <input
                value={tempSubtitle}
                onChange={e => setTempSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-0 outline-none transition-all"
              />
            </div>

            {deferredPrompt && (
              <div className="pt-2">
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
                >
                  <DownloadCloud size={18} className="mr-2" /> 安装应用到桌面
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 mt-2">
              <button onClick={onLogout} className="text-red-500 text-sm font-medium hover:underline py-2">退出登录</button>
            </div>
          </div>

          <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
            <button
              onClick={() => setShowSettings(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
            >
              取消
            </button>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm disabled:opacity-70"
            >
              {savingSettings ? '同步中...' : '保存并同步'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};
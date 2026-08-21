import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { 
  Folder, Image, Video, Play, Search, ArrowLeft, Check, 
  Download, Info, Loader2, RefreshCw, FolderOpen, 
  SlidersHorizontal, AlertCircle, CheckCircle2, MapPin, Maximize2
} from 'lucide-react';

export default function MediaExtractor() {
  const [sourcePath, setSourcePath] = useState('/Users/Daiki/Pictures/iPhoto Library');
  const [targetPath, setTargetPath] = useState('/Users/Daiki/Desktop/Extracted_Media');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [operationMode, setOperationMode] = useState('copy');
  const [browsingSource, setBrowsingSource] = useState(false);
  const [videoError, setVideoError] = useState('');
  
  const [scanResult, setScanResult] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set()); // paths of checked items
  const [activeItem, setActiveItem] = useState(null); // single item in detail view
  
  // Filters
  const [filterType, setFilterType] = useState('all'); // all, image, video
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('all');
  const [sortBy, setSortBy] = useState('dateTakenNewest'); // dateTakenNewest, dateTakenOldest, name, size
  const [selectedSizeRange, setSelectedSizeRange] = useState('all'); // all, small, medium, large
  
  // Notification / Progress
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [operationResult, setOperationResult] = useState(null);

  useEffect(() => {
    setVideoError('');
  }, [activeItem]);

  const handleBrowseSource = async () => {
    setBrowsingSource(true);
    setErrorMsg('');
    try {
      const result = await api.browseMediaFolder('media-source');
      setSourcePath(result.path);
      setScanResult(null);
      setSelectedItems(new Set());
      setActiveItem(null);
      setOperationResult(null);
    } catch (err) {
      if (!String(err.message).includes('キャンセル')) {
        setErrorMsg(err.message || 'フォルダを選択できませんでした。');
      }
    } finally {
      setBrowsingSource(false);
    }
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!sourcePath) return;
    
    setLoading(true);
    setScanning(true);
    setErrorMsg('');
    setSuccessMsg('');
    setOperationResult(null);
    setSelectedItems(new Set());
    setActiveItem(null);
    
    try {
      const res = await api.scanMedia(sourcePath);
      setScanResult(res);
      if (res.items.length > 0) {
        setActiveItem(res.items[0]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'フォルダのスキャンに失敗しました。');
      setScanResult(null);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleFileOperation = async () => {
    const isMove = operationMode === 'move';
    if (selectedItems.size === 0) {
      setErrorMsg(`${isMove ? '移動' : 'コピー'}するファイルを1つ以上選択してください。`);
      return;
    }
    if (!targetPath) {
      setErrorMsg(`${isMove ? '移動' : 'コピー'}先フォルダパスを指定してください。`);
      return;
    }

    setProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');
    setOperationResult(null);

    try {
      const files = Array.from(selectedItems);
      const res = isMove
        ? await api.moveMedia(files, targetPath)
        : await api.extractMedia(files, targetPath);
      setOperationResult({ mode: operationMode, ...res });

      if (isMove) {
        const movedPaths = new Set(res.results.success.map(item => item.src));
        setScanResult(prev => {
          if (!prev) return prev;
          const items = prev.items.filter(item => !movedPaths.has(item.path));
          return { ...prev, items, totalCount: items.length };
        });
        setActiveItem(prev => prev && movedPaths.has(prev.path) ? null : prev);
      }

      setSelectedItems(new Set());
      setSuccessMsg(`${res.successCount}個のファイルを${isMove ? '移動' : 'コピー'}しました。`);
    } catch (err) {
      setErrorMsg(err.message || `ファイルの${isMove ? '移動' : 'コピー'}に失敗しました。`);
    } finally {
      setProcessing(false);
    }
  };

  // Selection helpers
  const handleToggleSelectItem = (path) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectAll = (filteredItems) => {
    setSelectedItems(new Set(filteredItems.map(item => item.path)));
  };

  const handleSelectNone = () => {
    setSelectedItems(new Set());
  };

  const handleSelectInvert = (filteredItems) => {
    setSelectedItems(prev => {
      const next = new Set();
      filteredItems.forEach(item => {
        if (!prev.has(item.path)) {
          next.add(item.path);
        }
      });
      return next;
    });
  };

  // Get unique camera list from scan results
  const cameraList = useMemo(() => {
    if (!scanResult) return [];
    const cameras = new Set();
    scanResult.items.forEach(item => {
      if (item.camera) cameras.add(item.camera);
    });
    return Array.from(cameras).sort();
  }, [scanResult]);

  // Filtering & Sorting
  const filteredAndSortedItems = useMemo(() => {
    if (!scanResult) return [];
    
    let items = [...scanResult.items];
    
    // Type Filter
    if (filterType !== 'all') {
      items = items.filter(item => item.type === filterType);
    }
    
    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.path.toLowerCase().includes(query)
      );
    }
    
    // Camera Filter
    if (selectedCamera !== 'all') {
      items = items.filter(item => item.camera === selectedCamera);
    }
    
    // Size Filter
    if (selectedSizeRange !== 'all') {
      items = items.filter(item => {
        const sizeMB = item.size / (1024 * 1024);
        if (selectedSizeRange === 'small') return sizeMB < 1; // < 1MB
        if (selectedSizeRange === 'medium') return sizeMB >= 1 && sizeMB <= 10; // 1-10MB
        if (selectedSizeRange === 'large') return sizeMB > 10; // > 10MB
        return true;
      });
    }
    
    // Sorting
    items.sort((a, b) => {
      const dateA = new Date(a.dateTaken || a.dateCreated || a.dateModified);
      const dateB = new Date(b.dateTaken || b.dateCreated || b.dateModified);
      
      if (sortBy === 'dateTakenNewest') return dateB - dateA;
      if (sortBy === 'dateTakenOldest') return dateA - dateB;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      return 0;
    });
    
    return items;
  }, [scanResult, filterType, searchQuery, selectedCamera, sortBy, selectedSizeRange]);

  // Format Helper
  const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Media Extractor
            </h1>
            <p className="text-xs text-gray-400">ローカルファイルから写真・動画データを抽出・コピーします</p>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Control & Filter Panel */}
        <aside className="media-scrollbar w-80 min-h-0 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-y-scroll">
          {/* Scan Folder Form */}
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              スキャン設定
            </h2>
            <form onSubmit={handleScan} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">抽出元フォルダ</label>
                <button
                  type="button"
                  onClick={handleBrowseSource}
                  disabled={browsingSource || scanning}
                  className="w-full rounded-xl border border-blue-800 bg-blue-950/50 p-3 text-left transition-colors hover:bg-blue-900/50 disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                      {browsingSource ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-blue-100">フォルダを探して選択</span>
                      <span className="block truncate text-[11px] text-gray-400">選択中: {pathBasename(sourcePath)}</span>
                    </span>
                  </span>
                </button>
              </div>
              <button
                type="submit"
                disabled={scanning || browsingSource || !sourcePath}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    スキャン中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    スキャンを実行
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Filtering Section */}
          <div className="p-5 flex-1 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              フィルター & 並べ替え
            </h2>

            {/* Type */}
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-2">メディア種別</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'すべて' },
                  { id: 'image', label: '画像' },
                  { id: 'video', label: '動画' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFilterType(opt.id)}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filterType === opt.id 
                        ? 'bg-blue-600/20 border border-blue-500 text-blue-300' 
                        : 'bg-gray-950 border border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-1.5">ファイル名検索</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ファイル名で検索..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Camera Filter */}
            {cameraList.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">カメラ機種</label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">すべてのカメラ</option>
                  {cameraList.map(cam => (
                    <option key={cam} value={cam}>{cam}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Size Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">ファイルサイズ</label>
              <select
                value={selectedSizeRange}
                onChange={(e) => setSelectedSizeRange(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">制限なし</option>
                <option value="small">小サイズ (1MB 未満)</option>
                <option value="medium">中サイズ (1MB 〜 10MB)</option>
                <option value="large">大サイズ (10MB 超)</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">並べ替え順</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="dateTakenNewest">撮影日・作成日 (新しい順)</option>
                <option value="dateTakenOldest">撮影日・作成日 (古い順)</option>
                <option value="name">ファイル名 (昇順)</option>
                <option value="size">サイズ (大きい順)</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Center Gallery Area */}
        <main className="flex-1 min-h-0 flex flex-col min-w-0 bg-gray-950">
          {/* Notifications Banner */}
          {errorMsg && (
            <div className="bg-red-950/40 border-b border-red-900/50 px-6 py-3 flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border-b border-emerald-900/50 px-6 py-3 flex items-center gap-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Selection control bar */}
          {scanResult && filteredAndSortedItems.length > 0 && (
            <div className="bg-gray-900/60 border-b border-gray-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <span>スキャン結果: <strong>{filteredAndSortedItems.length}</strong> 件のファイル</span>
                <span>•</span>
                <span className="text-blue-400">選択中: <strong>{selectedItems.size}</strong> 件</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAll(filteredAndSortedItems)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded text-[11px] transition-colors"
                >
                  すべて選択
                </button>
                <button
                  onClick={handleSelectNone}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded text-[11px] transition-colors"
                >
                  選択解除
                </button>
                <button
                  onClick={() => handleSelectInvert(filteredAndSortedItems)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded text-[11px] transition-colors"
                >
                  選択反転
                </button>
              </div>
            </div>
          )}

          {/* Grid/Content container */}
          <div className="media-scrollbar flex-1 min-h-0 overflow-y-scroll p-6">
            {!scanResult && !scanning && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-4 text-blue-500 shadow-md">
                  <Folder className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-200 mb-1">スキャンを開始してください</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  左の「フォルダを探して選択」から抽出元を選び、「スキャンを実行」ボタンをクリックしてください。
                </p>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-left w-full">
                  <div className="text-[11px] text-gray-400 font-medium mb-1 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-blue-400" />
                    iPhotoライブラリ検出対応:
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    iPhoto/写真ライブラリを指定すると、パッケージ内のオリジナル写真が格納されているディレクトリを自動検出してスキャンします。
                  </p>
                </div>
              </div>
            )}

            {scanning && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <h3 className="text-sm font-semibold text-gray-200">フォルダスキャン中</h3>
                <p className="text-xs text-gray-500 mt-1">
                  メディアファイルとEXIFメタデータを取得しています。しばらくお待ちください...
                </p>
              </div>
            )}

            {scanResult && filteredAndSortedItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <SlidersHorizontal className="w-12 h-12 text-gray-700 mb-3" />
                <h3 className="text-sm font-semibold text-gray-300">該当するメディアが見つかりません</h3>
                <p className="text-xs text-gray-500 mt-1">
                  フィルター条件を変更するか、別のキーワードで検索をお試しください。
                </p>
              </div>
            )}

            {scanResult && filteredAndSortedItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredAndSortedItems.map((item) => {
                  const isChecked = selectedItems.has(item.path);
                  const isActive = activeItem && activeItem.path === item.path;
                  const fileUrl = getMediaFileUrl(item.path);
                  
                  return (
                    <div
                      key={item.path}
                      onClick={() => setActiveItem(item)}
                      className={`group relative aspect-square bg-gray-900 border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? 'border-blue-500 ring-2 ring-blue-500/20' 
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {/* Checkbox overlay */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectItem(item.path);
                        }}
                        className="absolute top-2.5 left-2.5 z-10 w-5 h-5 bg-gray-950/80 backdrop-blur border border-gray-700 rounded flex items-center justify-center text-white opacity-90 transition-opacity hover:scale-105"
                      >
                        {isChecked ? (
                          <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3px]" />
                        ) : null}
                      </div>

                      {/* Video overlay badge */}
                      {item.type === 'video' && (
                        <div className="absolute bottom-2 right-2 z-10 bg-gray-950/70 backdrop-blur p-1 rounded-md flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}

                      {/* Image / Thumbnail */}
                      <div className="w-full h-full overflow-hidden flex items-center justify-center bg-gray-950">
                        {item.type === 'image' ? (
                          <img
                            src={fileUrl}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          // For video thumbnail placeholder, simple overlay
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950 text-gray-500">
                            <Video className="w-8 h-8 text-gray-600 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] truncate max-w-[80%]">{item.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Hover Info Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2 pointer-events-none">
                        <span className="text-[10px] text-gray-200 truncate w-full font-medium">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Control Bar for Extraction */}
          {scanResult && (
            <div className="bg-gray-900 border-t border-gray-800 p-5 sticky bottom-0 z-30">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-200">
                      選択メディア操作
                    </h3>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">コピー／移動先フォルダパス</label>
                    <input
                      type="text"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      placeholder="例: /Users/Daiki/Desktop/Extracted_Media"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="flex rounded-lg border border-gray-700 bg-gray-950 p-1" role="group" aria-label="ファイル操作">
                    <button
                      type="button"
                      onClick={() => setOperationMode('copy')}
                      disabled={processing}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${operationMode === 'copy' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      コピー
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperationMode('move')}
                      disabled={processing}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${operationMode === 'move' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      移動
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-gray-400">対象ファイル</span>
                    <span className="text-sm font-bold text-blue-400">
                      {selectedItems.size} <span className="text-xs text-gray-300 font-normal">件選択中</span>
                    </span>
                  </div>
                  <button
                    onClick={handleFileOperation}
                    disabled={selectedItems.size === 0 || processing}
                    className={`${operationMode === 'move' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-lg flex items-center gap-2`}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {operationMode === 'move' ? '移動中...' : 'コピー中...'}
                      </>
                    ) : (
                      <>
                        {operationMode === 'move' ? <FolderOpen className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        {operationMode === 'move' ? '選択ファイルを移動' : '選択ファイルをコピー'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {operationResult && (
                <div className={`max-w-4xl mx-auto mt-4 bg-gray-950/80 border ${operationResult.mode === 'move' ? 'border-emerald-900/60' : 'border-blue-900/60'} rounded-xl p-3.5`}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-gray-300">{operationResult.mode === 'move' ? '移動' : 'コピー'}完了レポート</span>
                    <span className="text-[10px] text-gray-500">
                      成功: <span className="text-emerald-400 font-bold">{operationResult.successCount}</span> /
                      失敗: <span className="text-red-400 font-bold">{operationResult.errorCount}</span>
                    </span>
                  </div>
                  <div className="max-h-24 overflow-y-auto text-[10px] space-y-1 text-gray-400 pr-2">
                    {operationResult.results.success.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1 justify-between border-b border-gray-900/50 pb-1">
                        <span className="truncate max-w-[45%] text-gray-300">✓ {pathBasename(item.src)}</span>
                        <span className="text-gray-500 font-mono text-[9px] truncate max-w-[50%]">→ {item.dest}</span>
                      </div>
                    ))}
                    {operationResult.results.errors.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-red-400 font-semibold border-b border-gray-900/50 pb-1">
                        <span className="truncate max-w-[60%]">✗ {pathBasename(item.path)}</span>
                        <span>{item.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

        {/* Right Detail Panel */}
        <aside className="media-scrollbar w-96 min-h-0 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0 overflow-y-scroll">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              詳細・メタデータ
            </h2>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-start">
            {!activeItem ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                <Image className="w-8 h-8 text-gray-700 mb-2" />
                <span className="text-xs">スキャン後に写真/動画を選択すると、ここにプレビューとEXIF情報が表示されます。</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Media Preview Frame */}
                <div className="aspect-video bg-gray-950 rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center relative shadow-inner">
                  {activeItem.type === 'image' ? (
                    <img
                      src={getMediaFileUrl(activeItem.path)}
                      alt={activeItem.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <>
                      <video
                        key={activeItem.path}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                        onError={() => setVideoError(
                          activeItem.ext.toLowerCase() === '.mov'
                            ? 'MOVの再生用変換に失敗しました。元ファイルを開いて再生してください。'
                            : 'この動画はブラウザーで再生できません。'
                        )}
                      >
                        <source
                          src={getMediaFileUrl(activeItem.path, activeItem.ext.toLowerCase() === '.mov')}
                          type={getVideoMimeType(activeItem.ext)}
                        />
                      </video>
                      {videoError && (
                        <div className="absolute inset-x-3 bottom-3 rounded-lg border border-amber-800/60 bg-gray-950/95 p-3 text-[10px] leading-relaxed text-amber-300 shadow-lg">
                          {videoError}
                        </div>
                      )}
                    </>
                  )}
                  <a
                    href={getMediaFileUrl(activeItem.path)}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2.5 right-2.5 bg-gray-900/80 hover:bg-gray-800 backdrop-blur p-1.5 rounded-lg text-gray-300 hover:text-white transition-all shadow-md"
                    title="元画像を新しいタブで開く"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Details Table */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 mb-1.5">基本情報</h3>
                    <div className="bg-gray-950 border border-gray-800 rounded-lg divide-y divide-gray-800/60 overflow-hidden text-xs">
                      <div className="flex px-3 py-2">
                        <span className="w-24 text-gray-500">ファイル名</span>
                        <span className="flex-1 font-semibold text-gray-200 break-all">{activeItem.name}</span>
                      </div>
                      <div className="flex px-3 py-2">
                        <span className="w-24 text-gray-500">拡張子</span>
                        <span className="flex-1 text-gray-300 uppercase font-mono">{activeItem.ext.slice(1)}</span>
                      </div>
                      <div className="flex px-3 py-2">
                        <span className="w-24 text-gray-500">種別</span>
                        <span className="flex-1 text-gray-300">
                          {activeItem.type === 'image' ? '画像' : '動画'}
                        </span>
                      </div>
                      <div className="flex px-3 py-2">
                        <span className="w-24 text-gray-500">ファイルサイズ</span>
                        <span className="flex-1 text-gray-300">{formatSize(activeItem.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 mb-1.5">EXIF メタデータ</h3>
                    <div className="bg-gray-950 border border-gray-800 rounded-lg divide-y divide-gray-800/60 overflow-hidden text-xs">
                      <div className="flex px-3 py-2">
                        <span className="w-24 text-gray-500">撮影日時</span>
                        <span className="flex-1 text-gray-300">
                          {formatDate(activeItem.dateTaken || activeItem.dateCreated)}
                        </span>
                      </div>
                      <div className="flex px-3 py-2">
                        <span className="w-24 text-gray-500">カメラ機種</span>
                        <span className="flex-1 text-gray-300">{activeItem.camera || '-'}</span>
                      </div>
                      {activeItem.width && activeItem.height && (
                        <div className="flex px-3 py-2">
                          <span className="w-24 text-gray-500">解像度</span>
                          <span className="flex-1 text-gray-300">
                            {activeItem.width} × {activeItem.height}
                          </span>
                        </div>
                      )}
                      {activeItem.software && (
                        <div className="flex px-3 py-2">
                          <span className="w-24 text-gray-500">編集ソフト</span>
                          <span className="flex-1 text-gray-300">{activeItem.software}</span>
                        </div>
                      )}
                      <div className="flex px-3 py-2">
                        <span className="w-24 text-gray-500">更新日時</span>
                        <span className="flex-1 text-gray-300">{formatDate(activeItem.dateModified)}</span>
                      </div>
                    </div>
                  </div>

                  {activeItem.gps && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 mb-1.5">位置情報 (GPS)</h3>
                      <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="font-semibold">GPSタグ埋め込みあり</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-400 font-mono text-[11px]">
                          <div>緯度: {activeItem.gps.latitude.toFixed(6)}</div>
                          <div>経度: {activeItem.gps.longitude.toFixed(6)}</div>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${activeItem.gps.latitude},${activeItem.gps.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-center bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[11px] text-blue-400 hover:text-blue-300 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          Google Maps で位置を確認
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 mb-1.5">ファイルパス</h3>
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-[10px] text-gray-400 font-mono break-all leading-normal select-all">
                      {activeItem.path}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Utility to get basename of file path
function pathBasename(filepath) {
  if (!filepath) return '';
  const parts = filepath.split('/');
  return parts[parts.length - 1];
}

function getVideoMimeType(ext = '') {
  const normalizedExt = ext.toLowerCase();
  if (normalizedExt === '.mov') return 'video/mp4';
  if (normalizedExt === '.webm') return 'video/webm';
  if (normalizedExt === '.avi') return 'video/x-msvideo';
  return 'video/mp4';
}

function getMediaFileUrl(filePath, preview = false) {
  const params = new URLSearchParams({
    path: filePath,
    token: localStorage.getItem('auth_token') || ''
  });
  if (preview) params.set('preview', '1');
  return `/api/media/file?${params.toString()}`;
}

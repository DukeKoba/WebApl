import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Film, FolderOpen, HardDrive,
  Loader2, RefreshCw, AlertCircle, FileVideo2
} from 'lucide-react';
import { api } from '../../utils/api';

const DEFAULT_SOURCE = '/Users/Daiki/Downloads';
const DEFAULT_TARGET = '/Users/Daiki/Downloads/Converted_MP4';

export default function MovConverter() {
  const [sourceDir, setSourceDir] = useState(DEFAULT_SOURCE);
  const [targetDir, setTargetDir] = useState(DEFAULT_TARGET);
  const [scanResult, setScanResult] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [converting, setConverting] = useState(false);
  const [browsing, setBrowsing] = useState('');
  const [error, setError] = useState('');

  const handleBrowse = async (purpose) => {
    setBrowsing(purpose);
    setError('');
    try {
      const result = await api.browseMediaFolder(purpose);
      if (purpose === 'source') {
        setSourceDir(result.path);
        setScanResult(null);
        setConversionResult(null);
        setProgress(null);
      } else {
        setTargetDir(result.path);
      }
    } catch (err) {
      if (!String(err.message).includes('キャンセル')) {
        setError(err.message || 'フォルダを選択できませんでした。');
      }
    } finally {
      setBrowsing('');
    }
  };

  const handleScan = async (event) => {
    event.preventDefault();
    setScanning(true);
    setError('');
    setScanResult(null);
    setConversionResult(null);
    setProgress(null);
    try {
      setScanResult(await api.scanMovFolder(sourceDir));
    } catch (err) {
      setError(err.message || 'MOVファイルの検索に失敗しました。');
    } finally {
      setScanning(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    setError('');
    setConversionResult(null);
    setProgress(null);
    try {
      let job = await api.convertMovFolder(sourceDir, targetDir);
      setProgress(job);

      while (job.status === 'queued' || job.status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 750));
        job = await api.getMovConversionProgress(job.jobId);
        setProgress(job);
      }

      if (job.status === 'failed') {
        throw new Error(job.error || 'MOVファイルの変換に失敗しました。');
      }
      setConversionResult(job);
    } catch (err) {
      setError(err.message || 'MOVファイルの変換に失敗しました。');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link to="/" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="ホームへ戻る">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600">
            <Film className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">MOV → MP4 Converter</h1>
            <p className="text-xs text-slate-400">ローカルフォルダ内の古いMOVをブラウザー互換MP4へ一括変換</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <form onSubmit={handleScan} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-5 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-violet-400" />
            <h2 className="font-semibold">変換するフォルダ</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <span className="text-slate-300">変換元フォルダ</span>
              <button type="button" onClick={() => handleBrowse('source')} disabled={Boolean(browsing) || scanning || converting} className="flex w-full items-center gap-3 rounded-xl border border-violet-700 bg-violet-950 px-4 py-4 text-left hover:bg-violet-900 disabled:opacity-40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                  {browsing === 'source' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-violet-100">フォルダを探して選択</span>
                  <span className="block truncate text-xs text-slate-400">選択中: {folderName(sourceDir)}</span>
                </span>
              </button>
              <span className="block text-xs text-slate-500">選択したフォルダ配下のサブフォルダも検索します</span>
            </div>
            <div className="space-y-2 text-sm">
              <span className="text-slate-300">MP4保存先フォルダ</span>
              <button type="button" onClick={() => handleBrowse('target')} disabled={Boolean(browsing) || scanning || converting} className="flex w-full items-center gap-3 rounded-xl border border-violet-700 bg-violet-950 px-4 py-4 text-left hover:bg-violet-900 disabled:opacity-40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                  {browsing === 'target' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-violet-100">保存先を探して選択</span>
                  <span className="block truncate text-xs text-slate-400">選択中: {folderName(targetDir)}</span>
                </span>
              </button>
              <span className="block text-xs text-slate-500">元フォルダ構造を維持して保存します</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={scanning || converting || !sourceDir} className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-600 disabled:opacity-40">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              MOVを検索
            </button>
            <button type="button" onClick={handleConvert} disabled={converting || scanning || !scanResult?.totalCount || !targetDir} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500">
              {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileVideo2 className="h-4 w-4" />}
              {converting ? 'MP4変換中...' : `${scanResult?.totalCount || 0}件をMP4変換`}
            </button>
          </div>
        </form>

        {error && <div className="flex items-center gap-3 rounded-xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-300"><AlertCircle className="h-5 w-5" />{error}</div>}

        {progress && !conversionResult && (
          <section className="rounded-2xl border border-violet-800 bg-violet-950/30 p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                <div>
                  <h2 className="font-semibold">MP4へ変換中</h2>
                  <p className="text-sm text-slate-400">{progress.completedCount} / {progress.totalCount} 件完了</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-violet-300">{progress.progressPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${progress.progressPercent}%` }} />
            </div>
            <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
              <span>成功: <strong className="text-emerald-400">{progress.successCount}</strong></span>
              <span>失敗: <strong className="text-red-400">{progress.errorCount}</strong></span>
              <span className="truncate sm:text-right" title={progress.currentFile}>処理中: {progress.currentFile || '準備中...'}</span>
            </div>
          </section>
        )}

        {scanResult && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">検索結果</h2>
                <p className="mt-1 text-sm text-slate-400">{scanResult.totalCount}件・合計 {formatSize(scanResult.totalSize)}</p>
              </div>
              <HardDrive className="h-6 w-6 text-violet-400" />
            </div>
            {scanResult.totalCount === 0 ? (
              <p className="rounded-xl bg-slate-950 p-6 text-center text-sm text-slate-500">MOVファイルは見つかりませんでした。</p>
            ) : (
              <div className="media-scrollbar max-h-80 overflow-y-scroll rounded-xl border border-slate-800 bg-slate-950">
                {scanResult.items.map((item) => (
                  <div key={item.path} className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 text-sm last:border-b-0">
                    <span className="min-w-0 truncate font-mono text-slate-300">{item.relativePath}</span>
                    <span className="shrink-0 text-xs text-slate-500">{formatSize(item.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {conversionResult && (
          <section className="rounded-2xl border border-emerald-900 bg-emerald-950/30 p-6">
            <div className="mb-4 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
              <div><h2 className="font-semibold">変換完了</h2><p className="text-sm">成功 {conversionResult.successCount}件・失敗 {conversionResult.errorCount}件</p></div>
            </div>
            <p className="break-all rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-400">保存先: {conversionResult.targetDir}</p>
          </section>
        )}
      </main>
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function folderName(folderPath) {
  if (!folderPath) return '未選択';
  const parts = folderPath.split('/').filter(Boolean);
  return parts.at(-1) || folderPath;
}

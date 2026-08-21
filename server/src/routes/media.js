import express from 'express';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import exifr from 'exifr';
import heicConvert from 'heic-convert';
import { spawn } from 'child_process';

const router = express.Router();
const previewConversions = new Map();
const downloadTickets = new Map();
const movConversionJobs = new Map();

function chooseLocalFolder(promptText) {
  return new Promise((resolve, reject) => {
    const script = `POSIX path of (choose folder with prompt ${JSON.stringify(promptText)})`;
    const chooser = spawn('/usr/bin/osascript', ['-e', script]);
    let stdout = '';
    let stderr = '';
    chooser.stdout.on('data', data => { stdout += data.toString(); });
    chooser.stderr.on('data', data => { stderr += data.toString(); });
    chooser.on('error', reject);
    chooser.on('close', code => {
      if (code === 0 && stdout.trim()) resolve(stdout.trim().replace(/\/$/, ''));
      else reject(new Error(stderr.trim() || 'フォルダの選択をキャンセルしました。'));
    });
  });
}

function convertMovFile(sourcePath, outputPath) {
  return new Promise((resolve, reject) => {
    const converter = spawn('/usr/bin/avconvert', [
      '--source', sourcePath,
      '--preset', 'PresetAppleM4V720pHD',
      '--output', outputPath,
      '--replace',
      '--disableMetadataFilter'
    ]);
    let stderrData = '';
    converter.stderr.on('data', (data) => { stderrData += data.toString(); });
    converter.on('error', reject);
    converter.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) resolve(outputPath);
      else reject(new Error(stderrData || `avconvert exited with code ${code}`));
    });
  });
}

async function getMovPreview(sourcePath) {
  const sourceStat = await fsPromises.stat(sourcePath);
  const cacheDir = path.join(os.tmpdir(), 'webapl-media-previews');
  const cacheKey = crypto.createHash('sha256')
    .update(`${sourcePath}:${sourceStat.size}:${sourceStat.mtimeMs}`)
    .digest('hex');
  const outputPath = path.join(cacheDir, `${cacheKey}.m4v`);

  await fsPromises.mkdir(cacheDir, { recursive: true });
  if (fs.existsSync(outputPath)) return outputPath;
  if (previewConversions.has(cacheKey)) return previewConversions.get(cacheKey);

  const conversion = new Promise((resolve, reject) => {
    const converter = spawn('/usr/bin/avconvert', [
      '--source', sourcePath,
      '--preset', 'PresetAppleM4V720pHD',
      '--output', outputPath,
      '--replace',
      '--disableMetadataFilter'
    ]);
    let stderrData = '';
    converter.stderr.on('data', (data) => { stderrData += data.toString(); });
    converter.on('error', reject);
    converter.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) resolve(outputPath);
      else reject(new Error(stderrData || `avconvert exited with code ${code}`));
    });
  }).finally(() => previewConversions.delete(cacheKey));

  previewConversions.set(cacheKey, conversion);
  return conversion;
}

// Helper to check if a directory has Masters or Originals
function getScanTargetDirectory(inputPath) {
  try {
    const masters = path.join(inputPath, 'Masters');
    if (fs.existsSync(masters)) {
      return masters;
    }
    const originals = path.join(inputPath, 'Originals');
    if (fs.existsSync(originals)) {
      return originals;
    }
  } catch (e) {
    // ignore
  }
  return inputPath;
}

// Recursive helper to list all media files
async function scanDirectoryRecursive(dirPath, maxFiles = 3000) {
  const mediaFiles = [];
  
  async function traverse(currentDir) {
    if (mediaFiles.length >= maxFiles) return;
    
    const entries = await fsPromises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (mediaFiles.length >= maxFiles) break;
      
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip system directories like .Trashes or .com.apple.Photos
        if (entry.name.startsWith('.')) continue;
        await traverse(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const isImg = ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp'].includes(ext);
        const isVid = ['.mov', '.mp4', '.m4v', '.avi', '.webm'].includes(ext);
        
        if (isImg || isVid) {
          try {
            const stat = await fsPromises.stat(fullPath);
            mediaFiles.push({
              name: entry.name,
              path: fullPath,
              type: isImg ? 'image' : 'video',
              ext,
              size: stat.size,
              dateModified: stat.mtime,
              dateCreated: stat.birthtime || stat.mtime
            });
          } catch (e) {
            console.error(`Error reading stats for ${fullPath}:`, e.message);
          }
        }
      }
    }
  }
  
  await traverse(dirPath);
  return mediaFiles;
}

async function findMovFilesRecursive(sourceDir, maxFiles = 2000) {
  const files = [];

  async function traverse(currentDir) {
    if (files.length >= maxFiles) return;
    const entries = await fsPromises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (path.extname(entry.name).toLowerCase() === '.mov') {
        const stat = await fsPromises.stat(fullPath);
        files.push({
          name: entry.name,
          path: fullPath,
          relativePath: path.relative(sourceDir, fullPath),
          size: stat.size,
          dateModified: stat.mtime
        });
      }
    }
  }

  await traverse(sourceDir);
  return files;
}

// POST /api/media/scan-mov-folder - Find MOV files below a local folder
router.post('/browse-folder', async (req, res) => {
  try {
    const prompts = {
      target: 'MP4の保存先フォルダを選択してください',
      source: 'MOVファイルがあるフォルダを選択してください',
      'media-source': '写真・動画を抽出するフォルダを選択してください'
    };
    const folderPath = await chooseLocalFolder(prompts[req.body?.purpose] || 'フォルダを選択してください');
    res.json({ path: folderPath });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/media/scan-mov-folder - Find MOV files below a local folder
router.post('/scan-mov-folder', async (req, res) => {
  const { sourceDir } = req.body;
  if (!sourceDir) return res.status(400).json({ error: '変換元フォルダを指定してください。' });

  const resolvedSourceDir = path.resolve(sourceDir);
  if (!fs.existsSync(resolvedSourceDir)) {
    return res.status(404).json({ error: `フォルダが見つかりません: ${sourceDir}` });
  }

  try {
    const files = await findMovFilesRecursive(resolvedSourceDir);
    res.json({
      sourceDir: resolvedSourceDir,
      totalCount: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      items: files
    });
  } catch (err) {
    res.status(500).json({ error: `MOV検索中にエラーが発生しました: ${err.message}` });
  }
});

async function runMovFolderConversion(jobId, movFiles, resolvedTargetDir) {
  const job = movConversionJobs.get(jobId);
  if (!job) return;

  job.status = 'running';
  const results = { success: [], errors: [] };

  for (const item of movFiles) {
    let temporaryPath = '';
    job.currentFile = item.relativePath;
    try {
      const relativeDirectory = path.dirname(item.relativePath);
      const outputDirectory = path.join(resolvedTargetDir, relativeDirectory === '.' ? '' : relativeDirectory);
      await fsPromises.mkdir(outputDirectory, { recursive: true });

      const sourceName = path.basename(item.name, path.extname(item.name));
      let outputPath = path.join(outputDirectory, `${sourceName}.mp4`);
      let counter = 1;
      while (fs.existsSync(outputPath)) {
        outputPath = path.join(outputDirectory, `${sourceName}_${counter}.mp4`);
        counter += 1;
      }

      temporaryPath = path.join(outputDirectory, `.${sourceName}-${crypto.randomUUID()}.m4v`);
      await convertMovFile(item.path, temporaryPath);
      await fsPromises.rename(temporaryPath, outputPath);
      results.success.push({ src: item.path, dest: outputPath });
    } catch (err) {
      if (temporaryPath) await fsPromises.rm(temporaryPath, { force: true }).catch(() => {});
      results.errors.push({ path: item.path, error: err.message });
    } finally {
      job.completedCount += 1;
      job.successCount = results.success.length;
      job.errorCount = results.errors.length;
      job.progressPercent = Math.round((job.completedCount / job.totalCount) * 100);
    }
  }

  job.status = 'completed';
  job.currentFile = '';
  job.progressPercent = 100;
  job.results = results;
  job.finishedAt = new Date().toISOString();
  setTimeout(() => movConversionJobs.delete(jobId), 60 * 60 * 1000).unref();
}

// POST /api/media/convert-mov-folder - Start converting every MOV below a local folder
router.post('/convert-mov-folder', async (req, res) => {
  const { sourceDir, targetDir } = req.body;
  if (!sourceDir) return res.status(400).json({ error: '変換元フォルダを指定してください。' });

  const resolvedSourceDir = path.resolve(sourceDir);
  const resolvedTargetDir = path.resolve(targetDir || path.join(resolvedSourceDir, 'Converted_MP4'));
  if (!fs.existsSync(resolvedSourceDir)) {
    return res.status(404).json({ error: `フォルダが見つかりません: ${sourceDir}` });
  }

  try {
    const movFiles = await findMovFilesRecursive(resolvedSourceDir);
    if (movFiles.length === 0) {
      return res.status(404).json({ error: '指定フォルダ内にMOVファイルがありません。' });
    }

    const jobId = crypto.randomUUID();
    const job = {
      jobId,
      status: 'queued',
      sourceDir: resolvedSourceDir,
      targetDir: resolvedTargetDir,
      totalCount: movFiles.length,
      completedCount: 0,
      successCount: 0,
      errorCount: 0,
      progressPercent: 0,
      currentFile: '',
      results: { success: [], errors: [] },
      startedAt: new Date().toISOString()
    };
    movConversionJobs.set(jobId, job);
    res.status(202).json(job);
    void runMovFolderConversion(jobId, movFiles, resolvedTargetDir).catch(err => {
      job.status = 'failed';
      job.error = err.message;
      job.currentFile = '';
    });
  } catch (err) {
    res.status(500).json({ error: `MOV一括変換中にエラーが発生しました: ${err.message}` });
  }
});

router.get('/convert-mov-folder/status/:jobId', (req, res) => {
  const job = movConversionJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: '変換ジョブが見つかりません。' });
  res.json(job);
});

// POST /api/media/scan - Scan directory for media files
router.post('/scan', async (req, res) => {
  const { path: inputPath } = req.body;
  if (!inputPath) {
    return res.status(400).json({ error: 'スキャン対象のパスを指定してください。' });
  }
  
  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    return res.status(400).json({ error: `指定されたパスが存在しません: ${inputPath}` });
  }
  
  try {
    const scanPath = getScanTargetDirectory(resolvedPath);
    console.log(`Scanning media in: ${scanPath}`);
    
    const files = await scanDirectoryRecursive(scanPath);
    
    // Parse EXIF data in batches of 50 to avoid high concurrency overhead
    const filesWithExif = [];
    const limit = 50;
    
    for (let i = 0; i < files.length; i += limit) {
      const chunk = files.slice(i, i + limit);
      const processed = await Promise.all(chunk.map(async (file) => {
        if (file.type === 'image' && ['.jpg', '.jpeg', '.png', '.heic'].includes(file.ext)) {
          try {
            const exif = await exifr.parse(file.path, {
              tiff: true,
              exif: ['Make', 'Model', 'DateTimeOriginal', 'Software', 'ExifImageWidth', 'ExifImageHeight'],
              gps: true
            });
            if (exif) {
              return {
                ...file,
                camera: exif.Model ? `${exif.Make || ''} ${exif.Model}`.trim() : null,
                dateTaken: exif.DateTimeOriginal || exif.CreateDate || null,
                gps: exif.latitude && exif.longitude ? { latitude: exif.latitude, longitude: exif.longitude } : null,
                width: exif.ExifImageWidth || null,
                height: exif.ExifImageHeight || null,
                software: exif.Software || null
              };
            }
          } catch (e) {
            // ignore exifr error
          }
        }
        return file;
      }));
      filesWithExif.push(...processed);
    }
    
    res.json({
      scanPath,
      totalCount: filesWithExif.length,
      items: filesWithExif
    });
  } catch (err) {
    console.error('Scan failed:', err);
    res.status(500).json({ error: `スキャン中にエラーが発生しました: ${err.message}` });
  }
});

// GET /api/media/file - Serve file and handle on-the-fly HEIC conversion + Range requests for video
router.get('/file', async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) {
    return res.status(400).json({ error: 'ファイルパスを指定してください。' });
  }
  
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: 'ファイルが見つかりません。' });
  }
  
  const ext = path.extname(resolvedPath).toLowerCase();
  
  // HEIC conversion
  if (ext === '.heic') {
    try {
      const inputBuffer = await fsPromises.readFile(resolvedPath);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.8
      });
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(outputBuffer);
    } catch (err) {
      console.error('HEIC conversion failed:', err);
      // Fallback to sending raw file if conversion fails
    }
  }
  
  // Video streaming with Range support
  const isVideo = ['.mov', '.mp4', '.m4v', '.avi', '.webm'].includes(ext);
  if (isVideo) {
    try {
      const shouldConvertMov = ext === '.mov' && req.query.preview === '1';
      const streamedPath = shouldConvertMov ? await getMovPreview(resolvedPath) : resolvedPath;
      const streamedExt = shouldConvertMov ? '.m4v' : ext;
      const stat = await fsPromises.stat(streamedPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      const mime = getMimeType(streamedExt);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        if (start >= fileSize || end >= fileSize) {
          res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
          return res.end();
        }
        
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(streamedPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunksize,
        };
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
        };
        res.writeHead(200, head);
        fs.createReadStream(streamedPath).pipe(res);
      }
      return;
    } catch (err) {
      console.error('Video streaming error:', err);
      return res.status(500).json({ error: '動画のストリーミング中にエラーが発生しました。' });
    }
  }
  
  // For images and others, serve directly
  res.sendFile(resolvedPath);
});

// POST /api/media/extract - Copy selected files to target directory
router.post('/extract', async (req, res) => {
  const { files, targetDir } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: '抽出するファイルを選択してください。' });
  }
  if (!targetDir) {
    return res.status(400).json({ error: '抽出先フォルダを指定してください。' });
  }
  
  const resolvedTargetDir = path.resolve(targetDir);
  
  try {
    // Ensure directory exists
    await fsPromises.mkdir(resolvedTargetDir, { recursive: true });
    
    const results = {
      success: [],
      errors: []
    };
    
    for (const srcPath of files) {
      try {
        if (!fs.existsSync(srcPath)) {
          results.errors.push({ path: srcPath, error: 'ファイルが存在しません。' });
          continue;
        }
        
        const baseName = path.basename(srcPath);
        let destPath = path.join(resolvedTargetDir, baseName);
        
        // Handle name collision
        if (fs.existsSync(destPath)) {
          const ext = path.extname(baseName);
          const nameWithoutExt = path.basename(baseName, ext);
          let counter = 1;
          while (fs.existsSync(destPath)) {
            destPath = path.join(resolvedTargetDir, `${nameWithoutExt}_${counter}${ext}`);
            counter++;
          }
        }
        
        await fsPromises.copyFile(srcPath, destPath);
        results.success.push({ src: srcPath, dest: destPath });
      } catch (err) {
        console.error(`Failed to copy ${srcPath}:`, err);
        results.errors.push({ path: srcPath, error: err.message });
      }
    }
    
    res.json({
      successCount: results.success.length,
      errorCount: results.errors.length,
      results
    });
  } catch (err) {
    console.error('Extraction failed:', err);
    res.status(500).json({ error: `抽出処理中にエラーが発生しました: ${err.message}` });
  }
});

// POST /api/media/move - Move selected files to target directory
router.post('/move', async (req, res) => {
  const { files, targetDir } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: '移動するファイルを選択してください。' });
  }
  if (!targetDir) {
    return res.status(400).json({ error: '移動先フォルダを指定してください。' });
  }

  const resolvedTargetDir = path.resolve(String(targetDir));
  const results = { success: [], errors: [] };

  try {
    await fsPromises.mkdir(resolvedTargetDir, { recursive: true });

    for (const requestedPath of files) {
      const srcPath = path.resolve(String(requestedPath));
      let destPath = '';

      try {
        const stat = await fsPromises.stat(srcPath);
        if (!stat.isFile()) {
          throw new Error('ファイルではありません。');
        }
        if (path.dirname(srcPath) === resolvedTargetDir) {
          throw new Error('移動元と移動先が同じフォルダです。');
        }

        const baseName = path.basename(srcPath);
        const ext = path.extname(baseName);
        const nameWithoutExt = path.basename(baseName, ext);
        destPath = path.join(resolvedTargetDir, baseName);
        let counter = 1;
        while (fs.existsSync(destPath)) {
          destPath = path.join(resolvedTargetDir, `${nameWithoutExt}_${counter}${ext}`);
          counter += 1;
        }

        try {
          await fsPromises.rename(srcPath, destPath);
        } catch (err) {
          if (err.code !== 'EXDEV') throw err;

          await fsPromises.copyFile(srcPath, destPath);
          try {
            await fsPromises.unlink(srcPath);
          } catch (unlinkError) {
            await fsPromises.rm(destPath, { force: true });
            throw unlinkError;
          }
        }

        results.success.push({ src: srcPath, dest: destPath });
      } catch (err) {
        console.error(`Failed to move ${srcPath}:`, err);
        results.errors.push({ path: srcPath, error: err.message });
      }
    }

    res.json({
      successCount: results.success.length,
      errorCount: results.errors.length,
      results
    });
  } catch (err) {
    console.error('Move failed:', err);
    res.status(500).json({ error: `移動処理中にエラーが発生しました: ${err.message}` });
  }
});

// POST /api/media/convert-mov - Convert selected legacy MOV files to browser-compatible MP4
router.post('/convert-mov', async (req, res) => {
  const { files, targetDir } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: '変換するMOVファイルを選択してください。' });
  }
  if (!targetDir) {
    return res.status(400).json({ error: '変換後の保存先フォルダを指定してください。' });
  }

  const resolvedTargetDir = path.resolve(targetDir);
  const results = { success: [], errors: [] };

  try {
    await fsPromises.mkdir(resolvedTargetDir, { recursive: true });

    for (const requestedPath of files) {
      const sourcePath = path.resolve(String(requestedPath));
      let temporaryPath = '';
      try {
        if (path.extname(sourcePath).toLowerCase() !== '.mov') {
          throw new Error('MOVファイルではありません。');
        }
        if (!fs.existsSync(sourcePath)) {
          throw new Error('ファイルが存在しません。');
        }

        const sourceName = path.basename(sourcePath, path.extname(sourcePath));
        let outputPath = path.join(resolvedTargetDir, `${sourceName}.mp4`);
        let counter = 1;
        while (fs.existsSync(outputPath)) {
          outputPath = path.join(resolvedTargetDir, `${sourceName}_${counter}.mp4`);
          counter += 1;
        }

        temporaryPath = path.join(resolvedTargetDir, `.${sourceName}-${crypto.randomUUID()}.m4v`);
        await convertMovFile(sourcePath, temporaryPath);
        await fsPromises.rename(temporaryPath, outputPath);
        results.success.push({ src: sourcePath, dest: outputPath });
      } catch (err) {
        if (temporaryPath) await fsPromises.rm(temporaryPath, { force: true }).catch(() => {});
        results.errors.push({ path: sourcePath, error: err.message });
      }
    }

    res.json({
      successCount: results.success.length,
      errorCount: results.errors.length,
      results
    });
  } catch (err) {
    res.status(500).json({ error: `MOV変換中にエラーが発生しました: ${err.message}` });
  }
});

function resolveDownloadFiles(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  const supportedExtensions = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp',
    '.mov', '.mp4', '.m4v', '.avi', '.webm'
  ]);
  return [...new Set(files
    .map((filePath) => path.resolve(String(filePath)))
    .filter((filePath) => !filePath.includes('\n'))
    .filter((filePath) => fs.existsSync(filePath) && supportedExtensions.has(path.extname(filePath).toLowerCase())))];
}

function streamMediaZip(availableFiles, res) {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="media_export.zip"');
  res.setHeader('Cache-Control', 'no-store');

  const commonDirectory = getCommonDirectory(availableFiles);
  const relativeFiles = availableFiles.map((filePath) => path.relative(commonDirectory, filePath));
  const zipProcess = spawn('zip', ['-q', '-', '-@'], { cwd: commonDirectory });

  zipProcess.on('error', (err) => {
    console.error('Failed to start zip process:', err);
    if (!res.headersSent) res.status(500).json({ error: '圧縮処理の起動に失敗しました。' });
    else res.destroy(err);
  });

  zipProcess.stdout.pipe(res);
  let stderrData = '';
  zipProcess.stderr.on('data', (data) => { stderrData += data.toString(); });
  zipProcess.on('close', (code) => {
    if (code !== 0) console.error(`Zip process exited with code ${code}. Stderr: ${stderrData}`);
  });
  res.on('close', () => {
    if (zipProcess.exitCode === null) zipProcess.kill();
  });

  relativeFiles.forEach((filePath) => zipProcess.stdin.write(filePath + '\n'));
  zipProcess.stdin.end();
}

// POST /api/media/download-ticket - Create a short-lived native download URL
router.post('/download-ticket', (req, res) => {
  const availableFiles = resolveDownloadFiles(req.body.files);

  if (availableFiles.length === 0) {
    return res.status(404).json({ error: 'ダウンロードできる写真・動画が見つかりません。' });
  }

  const ticket = crypto.randomUUID();
  downloadTickets.set(ticket, { files: availableFiles, expiresAt: Date.now() + 5 * 60 * 1000 });
  res.json({ ticket, fileCount: availableFiles.length });
});

// GET /api/media/download/:ticket - Stream ZIP through the browser download manager
router.get('/download/:ticket', (req, res) => {
  const entry = downloadTickets.get(req.params.ticket);
  downloadTickets.delete(req.params.ticket);

  if (!entry || entry.expiresAt < Date.now()) {
    return res.status(404).json({ error: 'ダウンロードURLの有効期限が切れています。もう一度実行してください。' });
  }

  streamMediaZip(entry.files, res);
});

function getCommonDirectory(filePaths) {
  let commonParts = path.dirname(filePaths[0]).split(path.sep);

  for (const filePath of filePaths.slice(1)) {
    const directoryParts = path.dirname(filePath).split(path.sep);
    let matchingLength = 0;
    while (
      matchingLength < commonParts.length &&
      matchingLength < directoryParts.length &&
      commonParts[matchingLength] === directoryParts[matchingLength]
    ) {
      matchingLength += 1;
    }
    commonParts = commonParts.slice(0, matchingLength);
  }

  const commonPath = commonParts.join(path.sep);
  return commonPath || path.parse(filePaths[0]).root;
}

function getMimeType(ext) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.mov':
      return 'video/quicktime';
    case '.mp4':
      return 'video/mp4';
    case '.m4v':
      return 'video/mp4';
    case '.avi':
      return 'video/x-msvideo';
    case '.webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}

export default router;

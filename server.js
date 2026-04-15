const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { PDFParse } = require('pdf-parse');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.set('trust proxy', 1);
app.use(express.static('public'));
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// File upload config
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.txt', '.text', '.md', '.csv', '.log', '.py', '.js', '.cpp', '.java', '.c', '.h', '.html', '.css', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not supported. Use: ${allowed.join(', ')}`));
        }
    }
});

// --- C++ Engine Config ---
const execName = os.platform() === 'win32' ? 'text_analysis.exe' : 'text_analysis';
const EXECUTABLE = path.join(__dirname, execName);
const EXEC_OPTIONS = { maxBuffer: 10 * 1024 * 1024, timeout: 30000 };

// Helper: run C++ engine
function runEngine(args) {
    return new Promise((resolve, reject) => {
        execFile(EXECUTABLE, args, EXEC_OPTIONS, (error, stdout, stderr) => {
            if (error) return reject(new Error(stderr || 'Engine execution failed'));
            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                reject(new Error('Failed to parse engine output'));
            }
        });
    });
}

// Helper: cleanup temp files
function cleanupFiles(...filePaths) {
    filePaths.forEach(fp => {
        if (fp && fs.existsSync(fp)) {
            fs.unlink(fp, () => {});
        }
    });
}

// --- Health Endpoint ---
app.get('/health', (req, res) => {
    const engineAvailable = fs.existsSync(EXECUTABLE);
    const uptimeSec = Math.floor(process.uptime());
    const mem = process.memoryUsage();

    const payload = {
        status: 'healthy',
        uptime: uptimeSec,
        timestamp: new Date().toISOString(),
        engine: engineAvailable ? 'available' : 'missing',
        platform: `${os.platform()} ${os.arch()}`,
        node: process.version,
        memory: {
            rss: Math.round(mem.rss / 1024 / 1024),
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
        }
    };

    // Serve HTML for browser requests, JSON for API clients
    const wantsHtml = req.headers.accept && req.headers.accept.includes('text/html');
    if (!wantsHtml) return res.json(payload);

    const engineBadge = engineAvailable
        ? `<span class="badge ok">● Available</span>`
        : `<span class="badge err">✕ Missing</span>`;

    const uptimeStr = (() => {
        const h = Math.floor(uptimeSec / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = uptimeSec % 60;
        return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
    })();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TextForge — Engine Health</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--bg:#09090b;--surface:#0c0c0f;--card:#131318;--border:rgba(255,255,255,0.07);--text:#f4f4f5;--muted:#71717a;--accent:#8b5cf6;--ok:#10b981;--err:#f43f5e;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;-webkit-font-smoothing:antialiased;}
  .wrap{width:100%;max-width:560px;}
  .header{display:flex;align-items:center;gap:0.75rem;margin-bottom:2rem;}
  .logo-icon{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 12px rgba(139,92,246,0.35);}
  .logo-icon svg{width:18px;height:18px;color:#fff;}
  .logo-text{font-weight:700;font-size:1.1rem;letter-spacing:-0.03em;}
  .logo-sub{font-size:0.72rem;color:var(--muted);margin-left:auto;font-family:'JetBrains Mono',monospace;}
  .status-banner{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.5rem 1.75rem;margin-bottom:1rem;display:flex;align-items:center;gap:1rem;}
  .dot{width:10px;height:10px;border-radius:50%;background:var(--ok);box-shadow:0 0 10px rgba(16,185,129,0.5);animation:pulse 2.5s ease-in-out infinite;flex-shrink:0;}
  @keyframes pulse{0%,100%{box-shadow:0 0 6px rgba(16,185,129,0.3);}50%{box-shadow:0 0 14px rgba(16,185,129,0.7);}}
  .status-text{font-weight:600;font-size:1rem;}
  .status-sub{font-size:0.75rem;color:var(--muted);margin-top:0.2rem;}
  .ts{font-family:'JetBrains Mono',monospace;font-size:0.68rem;color:var(--muted);margin-left:auto;text-align:right;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.1rem 1.25rem;}
  .card-label{font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:0.4rem;font-weight:600;}
  .card-value{font-size:1rem;font-weight:700;letter-spacing:-0.02em;font-family:'JetBrains Mono',monospace;}
  .badge{display:inline-flex;align-items:center;gap:0.35rem;font-size:0.78rem;font-weight:600;padding:0.2rem 0.6rem;border-radius:6px;}
  .badge.ok{color:var(--ok);background:rgba(16,185,129,0.12);}
  .badge.err{color:var(--err);background:rgba(244,63,94,0.12);}
  .footer{margin-top:1.25rem;text-align:center;font-size:0.68rem;color:var(--muted);}
  a{color:var(--accent);text-decoration:none;}
  a:hover{text-decoration:underline;}
  @media(max-width:480px){.grid{grid-template-columns:1fr;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>
      </svg>
    </div>
    <div>
      <div class="logo-text">TextForge</div>
    </div>
    <div class="logo-sub">Engine Health</div>
  </div>

  <div class="status-banner">
    <div class="dot"></div>
    <div>
      <div class="status-text">All Systems Operational</div>
      <div class="status-sub">Server is running normally</div>
    </div>
    <div class="ts">${new Date().toUTCString()}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">C++ Engine</div>
      <div class="card-value">${engineBadge}</div>
    </div>
    <div class="card">
      <div class="card-label">Uptime</div>
      <div class="card-value">${uptimeStr}</div>
    </div>
    <div class="card">
      <div class="card-label">Heap Used / Total</div>
      <div class="card-value">${payload.memory.heapUsed} / ${payload.memory.heapTotal} MB</div>
    </div>
    <div class="card">
      <div class="card-label">RSS Memory</div>
      <div class="card-value">${payload.memory.rss} MB</div>
    </div>
    <div class="card">
      <div class="card-label">Platform</div>
      <div class="card-value" style="font-size:0.82rem">${payload.platform}</div>
    </div>
    <div class="card">
      <div class="card-label">Node.js</div>
      <div class="card-value" style="font-size:0.82rem">${payload.node}</div>
    </div>
  </div>

  <div class="footer">
    <a href="/">&larr; Back to TextForge</a> &nbsp;·&nbsp;
    <a href="/health" id="raw-link">View raw JSON</a>
  </div>
</div>
<script>
  // Raw JSON link bypasses HTML content negotiation
  document.getElementById('raw-link').addEventListener('click', e => {
    e.preventDefault();
    fetch('/health', { headers: { Accept: 'application/json' } })
      .then(r => r.json()).then(d => {
        const w = window.open('', '_blank');
        w.document.write('<pre style="font-family:monospace;white-space:pre-wrap;padding:1rem">' + JSON.stringify(d, null, 2) + '</pre>');
      });
  });
</script>
</body>
</html>`);
});

// --- API Endpoints ---

// Pattern Search
app.post('/api/search', async (req, res) => {
    try {
        const { text, pattern } = req.body;
        if (!text || !pattern) return res.status(400).json({ error: 'Text and pattern are required' });
        if (text.length > 500000) return res.status(400).json({ error: 'Text too large (max 500KB)' });
        const data = await runEngine(['search', text, pattern]);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Algorithm Comparison
app.post('/api/compare', async (req, res) => {
    try {
        const { text, pattern } = req.body;
        if (!text || !pattern) return res.status(400).json({ error: 'Text and pattern are required' });
        if (text.length > 500000) return res.status(400).json({ error: 'Text too large (max 500KB)' });
        const data = await runEngine(['compare', text, pattern]);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


async function extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        await parser.destroy();
        return result.text;
    }
    return fs.readFileSync(filePath, 'utf-8');
}

// Helper: write extracted text to a temp .txt file for the C++ engine
async function prepareTextFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
        const text = await extractText(filePath);
        const txtPath = filePath.replace(/\.pdf$/i, '.txt');
        fs.writeFileSync(txtPath, text, 'utf-8');
        return { path: txtPath, text, tempCreated: true };
    }
    return { path: filePath, text: fs.readFileSync(filePath, 'utf-8'), tempCreated: false };
}

// Plagiarism Upload (file upload mode with detailed results — supports PDF + text files)
app.post('/api/plagiarism-upload', upload.fields([
    { name: 'source', maxCount: 1 },
    { name: 'target', maxCount: 1 }
]), async (req, res) => {
    let srcPath, tgtPath;
    const tempFiles = [];
    try {
        if (!req.files || !req.files.source || !req.files.target) {
            return res.status(400).json({ error: 'Both source and target files are required' });
        }
        srcPath = req.files.source[0].path;
        tgtPath = req.files.target[0].path;

        // Extract text from PDFs if needed, converting to .txt for the C++ engine
        const srcPrep = await prepareTextFile(srcPath);
        const tgtPrep = await prepareTextFile(tgtPath);
        if (srcPrep.tempCreated) tempFiles.push(srcPrep.path);
        if (tgtPrep.tempCreated) tempFiles.push(tgtPrep.path);

        const data = await runEngine(['plagiarism-detailed', srcPrep.path, tgtPrep.path]);
        // Send back the raw text for highlighting
        data.sourceText = srcPrep.text;
        data.targetText = tgtPrep.text;
        data.sourceFile = req.files.source[0].originalname;
        data.targetFile = req.files.target[0].originalname;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        cleanupFiles(srcPath, tgtPath, ...tempFiles);
    }
});

// Plagiarism from pasted text (detailed results)
app.post('/api/plagiarism-text', async (req, res) => {
    try {
        const { sourceText, targetText } = req.body;
        if (!sourceText || !targetText) return res.status(400).json({ error: 'Both source and target text are required' });
        if (sourceText.length > 500000 || targetText.length > 500000) {
            return res.status(400).json({ error: 'Text too large (max 500KB each)' });
        }
        const data = await runEngine(['plagiarism-text', sourceText, targetText]);
        data.sourceText = sourceText;
        data.targetText = targetText;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Multi-pattern Search
app.post('/api/multi', async (req, res) => {
    try {
        const { text, patterns } = req.body;
        if (!text || !Array.isArray(patterns) || patterns.length === 0) {
            return res.status(400).json({ error: 'Text and patterns array are required' });
        }
        if (text.length > 500000) return res.status(400).json({ error: 'Text too large (max 500KB)' });
        if (patterns.length > 50) return res.status(400).json({ error: 'Too many patterns (max 50)' });
        const data = await runEngine(['multi', text, ...patterns]);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Error Handling ---
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

// --- Graceful Shutdown ---
const server = app.listen(port, () => {
    console.log(`\n  ✦ Text Analysis Engine — http://localhost:${port}`);
    console.log(`  ✦ Health check — http://localhost:${port}/health\n`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.close(() => process.exit(0));
});

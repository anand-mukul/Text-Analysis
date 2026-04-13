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
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        engine: fs.existsSync(EXECUTABLE) ? 'available' : 'missing'
    });
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

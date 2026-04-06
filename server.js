const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const execName = os.platform() === 'win32' ? 'text_analysis.exe' : 'text_analysis';
const EXECUTABLE = path.join(__dirname, execName);

app.post('/api/search', (req, res) => {
    const { text, pattern } = req.body;
    execFile(EXECUTABLE, ['search', text, pattern], {maxBuffer: 10 * 1024 * 1024}, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: "Execution failed or executable not found" });
        try { res.json(JSON.parse(stdout)); } catch (e) { res.status(500).json({ error: "Failed to parse JSON core" }); }
    });
});

app.post('/api/compare', (req, res) => {
    const { text, pattern } = req.body;
    execFile(EXECUTABLE, ['compare', text, pattern], {maxBuffer: 10 * 1024 * 1024}, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: "Execution failed or executable not found" });
        try { res.json(JSON.parse(stdout)); } catch (e) { res.status(500).json({ error: "Failed to parse JSON core" }); }
    });
});

app.post('/api/plagiarism', (req, res) => {
    const { file1, file2 } = req.body;
    execFile(EXECUTABLE, ['plagiarism', file1, file2], {maxBuffer: 10 * 1024 * 1024}, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: "Execution failed or text files not found." });
        try { res.json(JSON.parse(stdout)); } catch (e) { res.status(500).json({ error: "Failed to parse JSON core" }); }
    });
});

app.post('/api/multi', (req, res) => {
    const { text, patterns } = req.body;
    if (!text || !Array.isArray(patterns)) return res.status(400).json({error: "Invalid payload"});
    execFile(EXECUTABLE, ['multi', text, ...patterns], {maxBuffer: 10 * 1024 * 1024}, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: "Execution failed" });
        try { res.json(JSON.parse(stdout)); } catch (e) { res.status(500).json({ error: "Failed to parse JSON core" }); }
    });
});

app.listen(port, () => {
    console.log(`Text Analysis Web Dashboard running at http://localhost:${port}`);
});

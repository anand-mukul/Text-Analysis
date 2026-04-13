/* ============================================
   TextForge — Frontend Application Logic
   Silicon Valley SaaS-grade interactions
   ============================================ */

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Animated counter for metric values
function animateValue(el, start, end, duration = 600) {
    const range = end - start;
    const startTime = performance.now();
    const isFloat = String(end).includes('.');

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = start + range * eased;
        el.textContent = isFloat ? current.toFixed(3) : Math.round(current).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Terminal-style multistep loader with spinner
async function runSimpleLoader(container, stepsText) {
    container.innerHTML = `<div class="card"><div class="step-loader"></div></div>`;
    const loaderDiv = container.querySelector('.step-loader');

    stepsText.forEach((stepText, i) => {
        const d = document.createElement('div');
        d.className = 'step';
        d.id = `step-${i}`;
        d.textContent = stepText;
        loaderDiv.appendChild(d);
    });

    for (let i = 0; i < stepsText.length; i++) {
        const cur = loaderDiv.querySelector(`#step-${i}`);
        cur.classList.add('active');
        await sleep(300 + Math.random() * 250);
        cur.classList.remove('active');
        cur.classList.add('done');
    }
}

// Highlight matched words
function highlightText(text, matchedWords) {
    if (!matchedWords || matchedWords.length === 0) return escapeHtml(text);

    const matchSet = new Set();
    const missSet = new Set();
    matchedWords.forEach(wm => {
        if (wm.matched) matchSet.add(wm.word.toLowerCase());
        else missSet.add(wm.word.toLowerCase());
    });

    return text.replace(/(\S+)/g, (match) => {
        const clean = match.replace(/[^\w]/g, '').toLowerCase();
        if (clean.length < 3) return escapeHtml(match);
        if (matchSet.has(clean)) return `<span class="hl-match">${escapeHtml(match)}</span>`;
        if (missSet.has(clean)) return `<span class="hl-miss">${escapeHtml(match)}</span>`;
        return escapeHtml(match);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Set button loading state
function setBtnLoading(btn, loading, originalText) {
    if (loading) {
        btn._originalHTML = btn.innerHTML;
        btn.innerHTML = `<span class="spinner"></span> Processing...`;
        btn.disabled = true;
    } else {
        btn.innerHTML = btn._originalHTML || originalText;
        btn.disabled = false;
    }
}

// Render an error
function renderError(container, message) {
    container.innerHTML = `
        <div class="error-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            ${escapeHtml(message)}
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {

    // ===== Navigation =====
    const navBtns = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // ===== Upload Mode Switcher =====
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modeContainers = document.querySelectorAll('.upload-mode');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            modeContainers.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.mode}-mode`).classList.add('active');
        });
    });

    // ===== Sample Data Injectors =====
    const sampleData = {
        'search-text': `The Rabin-Karp algorithm is a string-searching algorithm created by Richard M. Karp and Michael O. Rabin in 1987. It uses hashing to find an exact match of a pattern string in a text. It is particularly effective when searching for multiple patterns simultaneously, making it ideal for plagiarism detection and DNA sequence analysis.`,
        'search-pattern': 'Rabin-Karp',
        'multi-text': `Computer science is the study of computation, information, and automation. Programming involves tasks such as analysis, algorithm design, profiling resource consumption, and implementation. Modern software engineering leverages algorithms like hashing, searching, sorting, and graph traversal.`,
        'multi-patterns': 'algorithm, programming, hashing, computation, sorting',
        'comp-text': `GATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACA`,
        'comp-pattern': 'GATTACA'
    };

    document.querySelectorAll('.btn-sample').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const sampleKey = btn.getAttribute('data-sample');
            if (targetId && sampleData[sampleKey]) {
                const el = document.getElementById(targetId);
                el.value = sampleData[sampleKey];
                // Micro-feedback: brief glow
                el.style.borderColor = 'var(--accent)';
                el.style.boxShadow = '0 0 0 3px var(--accent-dim)';
                setTimeout(() => {
                    el.style.borderColor = '';
                    el.style.boxShadow = '';
                }, 800);
            }
        });
    });

    // ===== Dropzone Setup =====
    function setupDropzone(zoneId, inputId, filenameId) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);
        const filename = document.getElementById(filenameId);

        if (!zone) return;

        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
                handleFileSelect(zone, input, filename);
            }
        });
        input.addEventListener('change', () => handleFileSelect(zone, input, filename));
    }

    function handleFileSelect(zone, input, filename) {
        if (input.files.length > 0) {
            const file = input.files[0];
            zone.classList.add('has-file');
            filename.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            checkUploadReady();
        }
    }

    function checkUploadReady() {
        const src = document.getElementById('file-source');
        const tgt = document.getElementById('file-target');
        const btn = document.getElementById('btn-upload-analyze');
        btn.disabled = !(src.files.length > 0 && tgt.files.length > 0);
    }

    setupDropzone('dropzone-source', 'file-source', 'filename-source');
    setupDropzone('dropzone-target', 'file-target', 'filename-target');

    // ===== Health Check =====
    async function checkEngine() {
        const el = document.getElementById('engine-status');
        try {
            const res = await fetch('/health');
            const data = await res.json();
            if (data.status === 'healthy' && data.engine === 'available') {
                el.innerHTML = `<div class="status-dot"></div><span>Engine Online</span>`;
            } else {
                el.innerHTML = `<div class="status-dot offline"></div><span>Engine Fault</span>`;
            }
        } catch (e) {
            el.innerHTML = `<div class="status-dot offline"></div><span>Offline</span>`;
        }
    }
    checkEngine();

    // ===== Pattern Search =====
    document.getElementById('btn-search').addEventListener('click', async () => {
        const text = document.getElementById('search-text').value;
        const pattern = document.getElementById('search-pattern').value;
        if (!text || !pattern) return;

        const btn = document.getElementById('btn-search');
        setBtnLoading(btn, true);

        const resultsDiv = document.getElementById('search-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, pattern })
        });

        await runSimpleLoader(resultsDiv, [
            'Computing rolling hash window...',
            'Scanning corpus for matches...',
            'Verifying hash collisions...'
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            let highlighted = '';
            let lastIdx = 0;
            const positions = [...data.positions].sort((a, b) => a - b);

            positions.forEach(pos => {
                highlighted += escapeHtml(text.substring(lastIdx, pos));
                highlighted += `<span class="hl-match">${escapeHtml(text.substring(pos, pos + pattern.length))}</span>`;
                lastIdx = pos + pattern.length;
            });
            highlighted += escapeHtml(text.substring(lastIdx));

            resultsDiv.innerHTML = `
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Matches Found</div>
                        <div class="metric-value" data-count="${data.matches}">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Compute Time</div>
                        <div class="metric-value">${data.time}<span style="font-size:0.7rem;color:var(--text-muted);margin-left:2px">ms</span></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Comparisons</div>
                        <div class="metric-value" data-count="${data.comparisons}">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Hash Collisions</div>
                        <div class="metric-value" data-count="${data.collisions}">0</div>
                    </div>
                </div>
                ${data.matches > 0 ? `
                <div class="doc-card" style="margin-top:1rem">
                    <h3>Matches in Corpus</h3>
                    <div class="highlighted-body">${highlighted}</div>
                </div>` : ''}
            `;

            // Animate the counters
            resultsDiv.querySelectorAll('[data-count]').forEach(el => {
                animateValue(el, 0, parseInt(el.dataset.count, 10));
            });

        } catch (e) {
            renderError(resultsDiv, e.message);
        }

        setBtnLoading(btn, false);
    });

    // ===== Multi-Pattern Search =====
    document.getElementById('btn-multi').addEventListener('click', async () => {
        const text = document.getElementById('multi-text').value;
        const patternsStr = document.getElementById('multi-patterns').value;
        if (!text || !patternsStr) return;

        const patterns = patternsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (patterns.length === 0) return;

        const btn = document.getElementById('btn-multi');
        setBtnLoading(btn, true);

        const resultsDiv = document.getElementById('multi-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/multi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, patterns })
        });

        await runSimpleLoader(resultsDiv, [
            'Parsing batch patterns...',
            'Executing concurrent hash search...',
            'Aggregating results...'
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            const totalHits = data.results.reduce((sum, r) => sum + r.matches, 0);

            const rows = data.results.map(r => `
                <tr>
                    <td>
                        <span style="font-family:var(--font-mono);font-size:0.76rem;background:var(--bg-hover);padding:0.15rem 0.45rem;border-radius:4px">${escapeHtml(r.pattern)}</span>
                    </td>
                    <td>
                        <span style="font-variant-numeric:tabular-nums;font-weight:600;${r.matches > 0 ? 'color:var(--accent-light)' : 'color:var(--text-muted)'}">${r.matches}</span>
                    </td>
                    <td style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.72rem">
                        ${r.positions.length > 0 ? r.positions.slice(0, 8).join(', ') + (r.positions.length > 8 ? ` <span style="color:var(--text-muted)">+${r.positions.length - 8} more</span>` : '') : '<span style="opacity:0.4">—</span>'}
                    </td>
                </tr>
            `).join('');

            resultsDiv.innerHTML = `
                <div class="metric-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1rem;">
                    <div class="metric-card">
                        <div class="metric-label">Patterns Searched</div>
                        <div class="metric-value" data-count="${patterns.length}">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Total Hits</div>
                        <div class="metric-value" data-count="${totalHits}">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Hit Rate</div>
                        <div class="metric-value">${((data.results.filter(r => r.matches > 0).length / patterns.length) * 100).toFixed(0)}<span style="font-size:0.7rem;color:var(--text-muted);margin-left:1px">%</span></div>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead><tr><th>Pattern</th><th>Hits</th><th>Positions</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;

            resultsDiv.querySelectorAll('[data-count]').forEach(el => {
                animateValue(el, 0, parseInt(el.dataset.count, 10));
            });

        } catch (e) {
            renderError(resultsDiv, e.message);
        }

        setBtnLoading(btn, false);
    });

    // ===== Algorithm Compare =====
    document.getElementById('btn-compare').addEventListener('click', async () => {
        const text = document.getElementById('comp-text').value;
        const pattern = document.getElementById('comp-pattern').value;
        if (!text || !pattern) return;

        const btn = document.getElementById('btn-compare');
        setBtnLoading(btn, true);

        const resultsDiv = document.getElementById('comp-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, pattern })
        });

        await runSimpleLoader(resultsDiv, [
            'Initializing Naive brute-force engine...',
            'Initializing Rabin-Karp hash engine...',
            'Running benchmark comparison...'
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            const maxTime = Math.max(data.naive.time, data.rk.time) || 0.001;
            const naivePct = ((data.naive.time / maxTime) * 100).toFixed(0);
            const rkPct = ((data.rk.time / maxTime) * 100).toFixed(0);

            const speedup = data.naive.time > 0
                ? (data.naive.comparisons / Math.max(data.rk.comparisons, 1)).toFixed(1)
                : '—';

            // Determine winner by fewer comparisons (more stable than sub-ms timing)
            const rkWins = data.rk.comparisons <= data.naive.comparisons;
            const winnerLabel = rkWins ? 'Rabin-Karp' : 'Naive';

            resultsDiv.innerHTML = `
                <div class="text-grid">
                    <div class="card" style="position:relative;overflow:hidden;${!rkWins ? 'border-color:rgba(139,92,246,0.2)' : ''}">
                        ${!rkWins ? '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent-gradient)"></div>' : ''}
                        <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:${!rkWins ? 'var(--accent-light)' : 'var(--text-muted)'};margin-bottom:0.6rem;font-weight:600;display:flex;align-items:center;gap:0.4rem">
                            Naive Search
                            ${!rkWins ? '<span style="font-size:0.55rem;background:var(--accent-dim);padding:0.1rem 0.4rem;border-radius:4px;color:var(--accent-light)">WINNER</span>' : ''}
                        </div>
                        <div style="font-size:1.75rem;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;${!rkWins ? 'color:var(--accent-light)' : ''}">${data.naive.time}<span style="font-size:0.75rem;color:var(--text-muted);margin-left:3px">ms</span></div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.35rem;font-variant-numeric:tabular-nums">${data.naive.comparisons.toLocaleString()} comparisons</div>
                    </div>
                    <div class="card" style="position:relative;overflow:hidden;${rkWins ? 'border-color:rgba(139,92,246,0.2)' : ''}">
                        ${rkWins ? '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent-gradient)"></div>' : ''}
                        <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:${rkWins ? 'var(--accent-light)' : 'var(--text-muted)'};margin-bottom:0.6rem;font-weight:600;display:flex;align-items:center;gap:0.4rem">
                            Rabin-Karp
                            ${rkWins ? '<span style="font-size:0.55rem;background:var(--accent-dim);padding:0.1rem 0.4rem;border-radius:4px;color:var(--accent-light)">WINNER</span>' : ''}
                        </div>
                        <div style="font-size:1.75rem;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;${rkWins ? 'color:var(--accent-light)' : ''}">${data.rk.time}<span style="font-size:0.75rem;color:var(--text-muted);margin-left:3px">ms</span></div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.35rem;font-variant-numeric:tabular-nums">${data.rk.comparisons.toLocaleString()} comparisons</div>
                    </div>
                </div>

                <div class="metric-grid" style="grid-template-columns:repeat(3,1fr);margin-top:1rem">
                    <div class="metric-card">
                        <div class="metric-label">Matches Found</div>
                        <div class="metric-value" data-count="${data.rk.matches || data.naive.matches || 0}">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Comparison Ratio</div>
                        <div class="metric-value">${speedup}<span style="font-size:0.65rem;color:var(--text-muted);margin-left:2px">×</span></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Corpus Length</div>
                        <div class="metric-value" data-count="${text.length}">0</div>
                    </div>
                </div>

                <div class="benchmark-bars">
                    <div class="bar-row">
                        <div class="bar-label-group"><span>Naive — Execution Time</span><span class="bar-value">${data.naive.time}ms</span></div>
                        <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
                    </div>
                    <div class="bar-row">
                        <div class="bar-label-group"><span>Rabin-Karp — Execution Time</span><span class="bar-value">${data.rk.time}ms</span></div>
                        <div class="bar-track"><div class="bar-fill winner" style="width:0%"></div></div>
                    </div>
                </div>
            `;

            // Animate bars
            requestAnimationFrame(() => {
                const fills = resultsDiv.querySelectorAll('.bar-fill');
                if (fills[0]) fills[0].style.width = naivePct + '%';
                if (fills[1]) fills[1].style.width = rkPct + '%';
            });

            // Animate counters
            resultsDiv.querySelectorAll('[data-count]').forEach(el => {
                animateValue(el, 0, parseInt(el.dataset.count, 10));
            });

        } catch (e) {
            renderError(resultsDiv, e.message);
        }

        setBtnLoading(btn, false);
    });

    // ===== Detailed Plagiarism Renderer =====
    function renderDetailedPlagiarismResults(container, data) {
        const srcHighlighted = highlightText(data.sourceText || '', data.wordMatches || []);
        const tgtHighlighted = highlightText(data.targetText || '', data.wordMatches || []);

        const similarity = parseFloat(data.similarity) || 0;
        const isWarning = data.warning;

        // Color the similarity ring
        const ringColor = isWarning ? 'var(--danger)' : 'var(--success)';
        const ringBg = isWarning ? 'var(--danger-bg)' : 'var(--success-bg)';

        container.innerHTML = `
            <div class="plag-summary">
                <div class="stat-item" style="align-items:center">
                    <div style="width:56px;height:56px;border-radius:50%;border:3px solid ${ringColor};display:flex;align-items:center;justify-content:center;background:${ringBg};margin-bottom:0.35rem">
                        <span style="font-size:1rem;font-weight:700;color:${ringColor}">${Math.round(similarity)}%</span>
                    </div>
                    <span class="lbl">Similarity</span>
                </div>
                <div class="stat-item">
                    <span class="val" style="font-size:0.82rem;display:flex;align-items:center;gap:0.4rem">
                        <span style="width:8px;height:8px;border-radius:50%;background:${ringColor};display:inline-block"></span>
                        ${isWarning ? 'High Overlap Detected' : 'Within Acceptable Range'}
                    </span>
                    <span class="lbl" style="margin-top:0.25rem">Status</span>
                </div>
                <div class="stat-item">
                    <span class="val">${data.totalWords}</span>
                    <span class="lbl">Total Words</span>
                </div>
                <div class="stat-item">
                    <span class="val ${isWarning ? 'danger' : 'success'}">${data.matchedWords}</span>
                    <span class="lbl">Matched Words</span>
                </div>
            </div>

            <div class="side-by-side">
                <div class="doc-card">
                    <h3>Source Document</h3>
                    <div class="highlighted-body">${srcHighlighted}</div>
                </div>
                <div class="doc-card">
                    <h3>Target Document</h3>
                    <div class="highlighted-body">${tgtHighlighted}</div>
                </div>
            </div>
        `;
    }

    // ===== File Upload Plagiarism =====
    document.getElementById('btn-upload-analyze').addEventListener('click', async () => {
        const srcInput = document.getElementById('file-source');
        const tgtInput = document.getElementById('file-target');
        if (srcInput.files.length === 0 || tgtInput.files.length === 0) return;

        const btn = document.getElementById('btn-upload-analyze');
        setBtnLoading(btn, true);

        const resultsDiv = document.getElementById('upload-results');
        resultsDiv.classList.remove('hidden');

        const formData = new FormData();
        formData.append('source', srcInput.files[0]);
        formData.append('target', tgtInput.files[0]);

        const fetchPromise = fetch('/api/plagiarism-upload', { method: 'POST', body: formData });

        await runSimpleLoader(resultsDiv, [
            'Ingesting uploaded documents...',
            'Normalizing and tokenizing text...',
            'Cross-referencing word hashes...',
            'Computing similarity score...'
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            renderDetailedPlagiarismResults(resultsDiv, data);
        } catch (e) {
            renderError(resultsDiv, e.message);
        }

        setBtnLoading(btn, false);
    });

    // ===== Text Paste Plagiarism =====
    document.getElementById('btn-text-analyze').addEventListener('click', async () => {
        const sourceText = document.getElementById('paste-source').value;
        const targetText = document.getElementById('paste-target').value;
        if (!sourceText || !targetText) return;

        const btn = document.getElementById('btn-text-analyze');
        setBtnLoading(btn, true);

        const resultsDiv = document.getElementById('upload-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/plagiarism-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceText, targetText })
        });

        await runSimpleLoader(resultsDiv, [
            'Normalizing text inputs...',
            'Cross-referencing word hashes...',
            'Computing similarity score...'
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            renderDetailedPlagiarismResults(resultsDiv, data);
        } catch (e) {
            renderError(resultsDiv, e.message);
        }

        setBtnLoading(btn, false);
    });

});

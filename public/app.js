const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runMultistepLoader(container, stepsText) {
    container.innerHTML = `<div class="card"><div class="step-loader"></div></div>`;
    const loaderDiv = container.querySelector('.step-loader');
    
    stepsText.forEach((stepText, i) => {
        const d = document.createElement('div');
        d.className = `step-item hidden`; // completely hidden initially except we will manage them
        d.id = `step-${i}`;
        d.innerHTML = `
            <svg class="spinner-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span style="font-weight:500;">${stepText}</span>
        `;
        loaderDiv.appendChild(d);
    });

    for (let i = 0; i < stepsText.length; i++) {
        const cur = loaderDiv.querySelector(`#step-${i}`);
        cur.classList.remove('hidden');
        cur.classList.add('active');
        
        await sleep(350); 
        
        cur.classList.remove('active');
        cur.classList.add('done');
        cur.querySelector('svg').outerHTML = `
            <svg style="width:1.25rem; height:1.25rem;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const navBtns = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view');

    // UI Tab Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // Sample Data Injection Logic
    const sampleData = {
        'search-text': `The Rabin-Karp algorithm is a string-searching algorithm developed by Michael O. Rabin and Richard M. Karp in 1987. It uses a rolling hash function to find an exact match of a pattern string in a text. While mostly highly efficient, overlapping string patterns and identical modulo remainders can cause the Rabin-Karp engine to execute hash comparisons vigorously.`,
        'search-pattern': 'Rabin-Karp',
        'multi-text': `Computer software programming is the technical process of performing a particular computation. Programming fundamentally involves tasks such as systematic analysis, generating algorithms, profiling algorithms' systemic accuracy and resource consumption, and the rigorous implementation of those algorithms in a chosen programming language.`,
        'multi-patterns': 'program, algorithm, process, logic, system',
        'comp-text': `GATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACAGATTACA`,
        'comp-pattern': 'GATTACA'
    };

    document.querySelectorAll('.btn-sample').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const sampleKey = btn.getAttribute('data-sample');
            if (targetId && sampleData[sampleKey]) {
                const targetElement = document.getElementById(targetId);
                targetElement.value = sampleData[sampleKey];
                // Flash animation purely for visual focus
                targetElement.style.boxShadow = '0 0 0 3px var(--primary)';
                targetElement.style.borderColor = 'var(--primary)';
                setTimeout(() => {
                    targetElement.style.boxShadow = '';
                    targetElement.style.borderColor = '';
                }, 300);
            }
        });
    });

    // Pattern Search
    document.getElementById('btn-search').addEventListener('click', async () => {
        const text = document.getElementById('search-text').value;
        const pattern = document.getElementById('search-pattern').value;
        if (!text || !pattern) { alert("Fields cannot be empty."); return; }

        const btn = document.getElementById('btn-search');
        btn.innerText = "Executing...";
        btn.disabled = true;

        const resultsDiv = document.getElementById('search-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, pattern })
        });

        await runMultistepLoader(resultsDiv, [
            "Allocating C++ memory buffers...",
            "Calculating sliding Rabin-Karp hashes...",
            "Validating strict collision bounds...",
            "Aggregating spatial index metrics..."
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();
            
            if (data.error) {
                resultsDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
            } else {
                resultsDiv.innerHTML = `
                    <div class="metric-grid" style="animation: fade 0.4s ease;">
                        <div class="metric-card">
                            <div class="metric-label">Matches</div>
                            <div class="metric-value">${data.matches}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Execution Time</div>
                            <div class="metric-value">${data.time}ms</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Hash Comparisons</div>
                            <div class="metric-value">${data.comparisons}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Collisions</div>
                            <div class="metric-value">${data.collisions}</div>
                        </div>
                    </div>
                `;
            }
        } catch(e) { resultsDiv.innerHTML = `<div class="alert alert-danger">Network error</div>`; }
        btn.innerText = "Execute Search";
        btn.disabled = false;
    });

    // Bulk Search
    document.getElementById('btn-multi').addEventListener('click', async () => {
        const text = document.getElementById('multi-text').value;
        const patternsStr = document.getElementById('multi-patterns').value;
        if (!text || !patternsStr) return;

        const patterns = patternsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (patterns.length === 0) return alert("Enter valid patterns");

        const btn = document.getElementById('btn-multi');
        btn.innerText = "Running Bulk Match...";
        btn.disabled = true;

        const resultsDiv = document.getElementById('multi-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/multi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, patterns })
        });

        await runMultistepLoader(resultsDiv, [
            "Parsing bulk pattern payload...",
            "Deploying concurrent substring analysis...",
            "Resolving sequence spatial matrices..."
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();
            
            if (data.error) {
                resultsDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
            } else {
                let tableRows = data.results.map(r => `
                    <tr>
                        <td><strong>${r.pattern}</strong></td>
                        <td>${r.matches}</td>
                        <td style="color:var(--text-secondary); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${r.positions.length > 0 ? r.positions.slice(0, 5).join(', ') + (r.positions.length > 5 ? '...' : '') : 'None'}
                        </td>
                    </tr>
                `).join('');

                resultsDiv.innerHTML = `
                    <div class="table-container" style="animation: fade 0.4s ease;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Pattern Query</th>
                                    <th>Total Matches</th>
                                    <th>Relative Indices</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                `;
            }
        } catch(e) { }
        btn.innerText = "Run Bulk Search";
        btn.disabled = false;
    });

    // Benchmark Compare
    document.getElementById('btn-compare').addEventListener('click', async () => {
        const text = document.getElementById('comp-text').value;
        const pattern = document.getElementById('comp-pattern').value;
        if (!text || !pattern) return;

        const btn = document.getElementById('btn-compare');
        btn.innerText = "Benchmarking...";
        btn.disabled = true;

        const resultsDiv = document.getElementById('comp-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, pattern })
        });

        await runMultistepLoader(resultsDiv, [
            "Executing Naive string matching engine...",
            "Executing rolling Rabin-Karp engine...",
            "Calculating comparative execution limits..."
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();
            
            if (data.error) {
                resultsDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
            } else {
                resultsDiv.innerHTML = `
                    <div class="table-container" style="animation: fade 0.4s ease;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Algorithm</th>
                                    <th>Matches</th>
                                    <th>Comparisons</th>
                                    <th>Execution Time (ms)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Naive Search</td>
                                    <td>${data.naive.matches}</td>
                                    <td>${data.naive.comparisons}</td>
                                    <td>${data.naive.time}</td>
                                </tr>
                                <tr>
                                    <td><strong>Rabin-Karp</strong></td>
                                    <td>${data.rk.matches}</td>
                                    <td>${data.rk.comparisons}</td>
                                    <td>${data.rk.time}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch(e) { }
        btn.innerText = "Run Benchmark";
        btn.disabled = false;
    });

    // Plagiarism Check
    document.getElementById('btn-plag').addEventListener('click', async () => {
        const file1 = document.getElementById('plag-file1').value;
        const file2 = document.getElementById('plag-file2').value;
        if (!file1 || !file2) return;

        const btn = document.getElementById('btn-plag');
        btn.innerText = "Analyzing...";
        btn.disabled = true;

        const resultsDiv = document.getElementById('plag-results');
        resultsDiv.classList.remove('hidden');

        const fetchPromise = fetch('/api/plagiarism', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file1, file2 })
        });

        await runMultistepLoader(resultsDiv, [
            "Retrieving local file contents...",
            "Sanitizing strings and splitting lexical tokens...",
            "Evaluating structural Rabin-Karp overlap...",
            "Computing definitive similarity percentages..."
        ]);

        try {
            const response = await fetchPromise;
            const data = await response.json();
            if (data.error) {
                resultsDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
            } else {
                resultsDiv.innerHTML = `
                    <div class="card" style="display:flex; justify-content:space-between; align-items:center; animation: fade 0.4s ease;">
                        <div>
                            <div class="metric-label" style="margin-bottom:0.2rem">Structural Similarity</div>
                            <div class="metric-value">${data.similarity}%</div>
                        </div>
                        ${data.warning ? '<div class="badge badge-danger">High Plagiarism Detected</div>' : '<div class="badge badge-success">Acceptable Margins</div>'}
                    </div>
                `;
            }
        } catch(e) { }
        btn.innerText = "Analyze Documents";
        btn.disabled = false;
    });
});

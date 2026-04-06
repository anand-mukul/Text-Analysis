# 🔍 Intelligent Text Analysis System
### High-Performance Rabin-Karp String Matching Engine with a Web UI

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![C++](https://img.shields.io/badge/Engine-C%2B%2B17-blue?logo=c%2B%2B)
![Backend](https://img.shields.io/badge/Middleware-Node.js-green?logo=nodedotjs)
![Frontend](https://img.shields.io/badge/UI-Vanilla_JS-yellow?logo=javascript)

An enterprise-grade, high-performance text analysis dashboard. Under the hood, it leverages a pure C++ implementation of the **Rabin-Karp** rolling-hash algorithm for string searching, wrapped elegantly in a Node.js/Express child-process middleware, and served to a sleek, dark-themed responsive frontend.

Created as a comprehensive demonstration of algorithmic efficiency versus standard naive string searching.

---

## ✨ Core Features

*   **⚡ Rabin-Karp Implementation:** O(n+m) average time complexity using a highly optimized sliding-window rolling hash.
*   **📊 Interactive Benchmarking:** Real-time side-by-side performance benchmarking of the Rabin-Karp engine versus Native Naive searching.
*   **📂 Plagiarism Detection:** Checks local document similarity percentages via structural text tokenization and aggregated hash matching.
*   **🔍 Bulk Pattern Matching:** Deploy multiple simultaneous substring targets against a massive corpus payload concurrently.
*   **🖥️ Dashboard GUI:** Deep dark mode aesthetic (GitHub/Vercel inspired) with live multi-step execution visualization.

---

## 🏗️ System Architecture

1. **C++ Engine (`/main.cpp`, `/rabin_karp.cpp`):** The core intelligence. Responsible for mathematically generating the rolling hash offsets, validating collisions, and outputting JSON stringified vectors via stdout.
2. **API Gateway (`server.js`):** An Express.js node server that spawns the compiled C++ executable, feeds payloads via raw STDIN arguments, and manages cross-communication bridges.
3. **Frontend (`/public`):** Pure HTML/CSS/Vanilla JS interface interacting optimally with the Node APIs without requiring heavy frontend frameworks.

---

## 🚀 Installation & Usage

### Prerequisites
*   [Node.js](https://nodejs.org/en/) (v16.0+)
*   G++ Compiler (MinGW on Windows, or GCC on Linux/Mac)

### 1. Compile the C++ Engine
You must first compile the C++ source code into a binary executable that Node.js can interface with.
```bash
g++ main.cpp utils.cpp file_handler.cpp rabin_karp.cpp naive.cpp -o text_analysis.exe
```
*(Note for Linux/Mac users: Compile to `-o text_analysis` and update the `server.js` path to spawn `./text_analysis`)*

### 2. Install Node Dependencies
Initialize the backend environment variables.
```bash
npm install 
# Or manually install if missing: npm install express body-parser
```

### 3. Start the Web Dashboard
Boot up the Node.js API bridge.
```bash
npm start
```
Navigate to `http://localhost:3000` in your web browser to access the finalized dashboard!

---

## 🧮 Algorithmic Complexity: Rabin-Karp

The Rabin-Karp algorithm calculates a hash value for the pattern, and for each overlapping window of the text.

*   **Average Case / Best Case Time:** `O(n + m)`
*   **Worst Case Time:** `O(n * m)` *(This occurs continuously under extreme hash collisions where manual string matching must be executed)*
*   **Space Complexity:** `O(1)`

**The Rolling Hash:**
Instead of recomputing the full hash for every structural window iteratively, we mathematically roll the hash:
`H(next) = (d * (H(prev) - text[i] * h) + text[i+m]) % q`

---

## 👥 Authors & Academic Context
Built meticulously for Advanced Design and Analysis of Algorithms (DAA) submissions as a demonstration of implementing advanced search heuristics into a modern full-stack ecosystem.

*   *Modular logic cleanly abstracted with ZERO external C++ dependencies.*
*   *Designed for optimum visual testing scalability.*

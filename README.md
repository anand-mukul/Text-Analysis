# Intelligent Text Analysis System

A full-stack text analysis system built around the **Rabin-Karp rolling hash algorithm**. The project provides pattern searching, plagiarism detection, algorithm benchmarking, and multi-pattern search through both a command-line interface and an interactive web dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Build and Run](#build-and-run)
- [Usage](#usage)
  - [Interactive CLI Mode](#interactive-cli-mode)
  - [Web Dashboard](#web-dashboard)
- [Module Reference](#module-reference)
  - [RabinKarp (rabin\_karp.h / rabin\_karp.cpp)](#rabinkarp)
  - [NaiveSearch (naive.h / naive.cpp)](#naivesearch)
  - [FileHandler (file\_handler.h / file\_handler.cpp)](#filehandler)
  - [Utilities (utils.h / utils.cpp)](#utilities)
  - [Main Entry Point (main.cpp)](#main-entry-point)
  - [API Server (server.js)](#api-server)
- [API Endpoints](#api-endpoints)
- [Algorithm Details](#algorithm-details)
- [Configuration](#configuration)
- [License](#license)

---

## Overview

The system implements the Rabin-Karp string matching algorithm using a rolling hash function with `BASE = 256` and `PRIME = 101`. A compiled C++ engine handles all computation, a Node.js/Express server exposes the engine over HTTP as a JSON API, and a static web frontend provides the user interface.

All searches are **case-insensitive**. The engine supports both interactive terminal usage and a non-interactive CLI mode that outputs structured JSON for programmatic consumption.

---

## Architecture

The system follows a three-layer architecture:

```
+--------------------------+
|   Layer 3: Frontend      |
|   HTML / CSS / JavaScript|
|   (public/)              |
+------------+-------------+
             |  HTTP (JSON)
+------------v-------------+
|   Layer 2: API Server    |
|   Node.js + Express      |
|   (server.js)            |
+------------+-------------+
             |  execFile (stdin/stdout)
+------------v-------------+
|   Layer 1: C++ Engine    |
|   Rabin-Karp, Naive,     |
|   FileHandler, Utils     |
|   (*.cpp / *.h)          |
+--------------------------+
```

- **Layer 1 -- C++ Engine:** Core algorithm implementations, file I/O, and utility functions. Compiled into a single binary (`text_analysis`). Accepts CLI arguments and outputs JSON to stdout.
- **Layer 2 -- Node.js API Server:** Receives HTTP POST requests, spawns the C++ executable with appropriate arguments, captures JSON output, and returns it to the client.
- **Layer 3 -- Web Dashboard:** A static single-page application with tab-based navigation for each feature. Communicates with the API server using `fetch`.

---

## Features

1. **Single Pattern Search** -- Search for a pattern in a given text corpus. Returns match positions, total matches, execution time, comparison count, and hash collision count.

2. **Plagiarism Detection** -- Compare two text files for similarity. Extracts words from the source file and searches each word (length >= 3) in the target file using Rabin-Karp. Reports a similarity percentage and flags results above 50%.

3. **Algorithm Comparison** -- Run both the Naive brute-force search and Rabin-Karp on identical input. Displays side-by-side metrics including matches found, total comparisons, and execution time.

4. **Multi-Pattern Search** -- Search for multiple patterns simultaneously within a single text corpus. Returns match positions for each pattern independently.

---

## Project Structure

```
.
|-- main.cpp              # Entry point (CLI and interactive modes)
|-- rabin_karp.h          # RabinKarp class declaration and SearchResult struct
|-- rabin_karp.cpp        # Rabin-Karp algorithm implementation
|-- naive.h               # NaiveSearch class declaration
|-- naive.cpp             # Naive brute-force search implementation
|-- file_handler.h        # FileHandler class declaration
|-- file_handler.cpp      # File reading and plagiarism calculation
|-- utils.h               # Utility function declarations
|-- utils.cpp             # toLowerCase, removePunctuation, extractWords
|-- server.js             # Node.js/Express API server
|-- Makefile              # Build configuration for the C++ engine
|-- package.json          # Node.js dependencies and scripts
|-- .gitignore            # Git ignore rules
|-- sample1.txt           # Sample text file for testing plagiarism
|-- sample2.txt           # Sample text file for testing plagiarism
|-- public/
|   |-- index.html        # Web dashboard markup
|   |-- style.css         # Dashboard styling (dark theme)
|   |-- app.js            # Frontend logic and API integration
```

---

## Prerequisites

- **C++ Compiler:** g++ with C++11 support (or later)
- **Node.js:** v14 or later
- **npm:** Included with Node.js
- **Make:** (Optional) For using the provided Makefile

---

## Build and Run

### 1. Clone the Repository

```bash
git clone https://github.com/anand-mukul/Text-Analysis.git
cd Text-Analysis
```

### 2. Compile the C++ Engine

Using the Makefile:

```bash
make
```

Or manually:

```bash
g++ -Wall -Wextra -std=c++11 -O2 -o text_analysis main.cpp rabin_karp.cpp naive.cpp file_handler.cpp utils.cpp
```

On Windows, this produces `text_analysis.exe`.

### 3. Install Node.js Dependencies

```bash
npm install
```

### 4. Start the Web Server

```bash
npm start
```

The dashboard will be available at `http://localhost:3000`.

---

## Usage

### Interactive CLI Mode

Run the compiled binary directly without arguments to enter the interactive terminal menu:

```bash
./text_analysis
```

The menu presents the following options:

```
============================================
 INTELLIGENT TEXT ANALYSIS SYSTEM
============================================
1. Search Pattern in Text
2. Check Plagiarism (Compare Two Files)
3. Compare Algorithms (Naive vs Rabin-Karp)
4. Multi-pattern Search
5. Exit
============================================
```

### Non-Interactive CLI Mode

The engine also accepts command-line arguments for scripted or API-driven usage. All output is structured JSON.

**Pattern Search:**
```bash
./text_analysis search "<text>" "<pattern>"
```

**Plagiarism Detection:**
```bash
./text_analysis plagiarism <file1_path> <file2_path>
```

**Algorithm Comparison:**
```bash
./text_analysis compare "<text>" "<pattern>"
```

**Multi-Pattern Search:**
```bash
./text_analysis multi "<text>" "<pattern1>" "<pattern2>" ...
```

### Web Dashboard

Open `http://localhost:3000` in a browser after starting the Node.js server. The dashboard provides a tabbed interface for all four features with formatted result displays.

---

## Module Reference

### RabinKarp

**Header:** `rabin_karp.h`
**Source:** `rabin_karp.cpp`

Defines the `SearchResult` struct and the `RabinKarp` class.

#### SearchResult (struct)

| Field             | Type                | Description                               |
|-------------------|---------------------|-------------------------------------------|
| `positions`       | `vector<int>`       | Zero-indexed positions of all matches     |
| `comparisons`     | `int`               | Total number of comparisons performed     |
| `collisions`      | `int`               | Number of hash collisions encountered     |
| `executionTimeMs` | `double`            | Execution time in milliseconds            |

#### RabinKarp (class)

| Member    | Type / Signature                                                                           | Description                                                  |
|-----------|--------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| `BASE`    | `static const int` (256)                                                                   | Size of the input character alphabet                         |
| `PRIME`   | `static const int` (101)                                                                   | Prime modulus for hash computation                           |
| `search`  | `static SearchResult search(const string& text, const string& pattern)`                    | Searches for a single pattern in the text using rolling hash |
| `multiSearch` | `static vector<SearchResult> multiSearch(const string& text, const vector<string>& patterns)` | Searches for multiple patterns by invoking `search` for each |

---

### NaiveSearch

**Header:** `naive.h`
**Source:** `naive.cpp`

#### NaiveSearch (class)

| Member   | Type / Signature                                                        | Description                                                  |
|----------|-------------------------------------------------------------------------|--------------------------------------------------------------|
| `search` | `static SearchResult search(const string& text, const string& pattern)` | Brute-force character-by-character search at every position  |

---

### FileHandler

**Header:** `file_handler.h`
**Source:** `file_handler.cpp`

#### FileHandler (class)

| Member               | Type / Signature                                                                  | Description                                                                                               |
|----------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `readFile`           | `static string readFile(const string& filePath)`                                  | Reads the entire contents of a file into a string. Returns an empty string on failure.                    |
| `calculatePlagiarism`| `static double calculatePlagiarism(const string& file1Path, const string& file2Path)` | Extracts words from file1, searches each (length >= 3) in file2 using Rabin-Karp. Returns similarity %. |

---

### Utilities

**Header:** `utils.h`
**Source:** `utils.cpp`

| Function            | Signature                                                 | Description                                                           |
|---------------------|-----------------------------------------------------------|-----------------------------------------------------------------------|
| `toLowerCase`       | `string toLowerCase(const string& str)`                   | Converts all characters in a string to lowercase                      |
| `removePunctuation` | `string removePunctuation(const string& str)`             | Strips all punctuation characters from a string                       |
| `extractWords`      | `vector<string> extractWords(const string& text)`         | Lowercases and removes punctuation, then splits text into word tokens |

---

### Main Entry Point

**Source:** `main.cpp`

| Function      | Signature                           | Description                                                       |
|---------------|-------------------------------------|-------------------------------------------------------------------|
| `displayMenu` | `void displayMenu()`               | Prints the interactive terminal menu                              |
| `escapeJson`  | `string escapeJson(const string& s)`| Escapes special characters for safe JSON string embedding         |
| `main`        | `int main(int argc, char* argv[])`  | Routes to CLI mode (with arguments) or interactive mode (without) |

**Supported CLI modes:** `search`, `plagiarism`, `compare`, `multi`. See [Non-Interactive CLI Mode](#non-interactive-cli-mode) for argument formats.

---

### API Server

**Source:** `server.js`

Express application serving the static frontend from `public/` and exposing four POST endpoints. Each endpoint spawns the compiled C++ binary, passes arguments, and returns the parsed JSON response.

| Route              | Method | Description                                  |
|--------------------|--------|----------------------------------------------|
| `/api/search`      | POST   | Single pattern search                        |
| `/api/compare`     | POST   | Naive vs Rabin-Karp comparison               |
| `/api/plagiarism`  | POST   | Plagiarism detection between two files       |
| `/api/multi`       | POST   | Multi-pattern search                         |

---

## API Endpoints

### POST /api/search

**Request Body:**
```json
{
  "text": "the quick brown fox jumps over the lazy dog",
  "pattern": "the"
}
```

**Response:**
```json
{
  "positions": [0, 31],
  "matches": 2,
  "time": 0.0012,
  "comparisons": 48,
  "collisions": 0
}
```

---

### POST /api/compare

**Request Body:**
```json
{
  "text": "abcabcabc",
  "pattern": "abc"
}
```

**Response:**
```json
{
  "naive": { "matches": 3, "comparisons": 21, "time": 0.0008 },
  "rk":    { "matches": 3, "comparisons": 16, "time": 0.0006 }
}
```

---

### POST /api/plagiarism

**Request Body:**
```json
{
  "file1": "sample1.txt",
  "file2": "sample2.txt"
}
```

**Response:**
```json
{
  "similarity": 72.50,
  "warning": true
}
```

---

### POST /api/multi

**Request Body:**
```json
{
  "text": "the algorithm uses hashing for pattern matching",
  "patterns": ["algorithm", "hashing", "pattern"]
}
```

**Response:**
```json
{
  "results": [
    { "pattern": "algorithm", "positions": [4], "matches": 1 },
    { "pattern": "hashing",   "positions": [19], "matches": 1 },
    { "pattern": "pattern",   "positions": [31], "matches": 1 }
  ]
}
```

---

## Algorithm Details

### Rabin-Karp Rolling Hash

The implementation uses a polynomial rolling hash function:

```
hash(s[0..m-1]) = (s[0] * BASE^(m-1) + s[1] * BASE^(m-2) + ... + s[m-1]) mod PRIME
```

When the window slides by one character, the new hash is computed in O(1) time:

```
newHash = (BASE * (oldHash - text[i] * h) + text[i + m]) mod PRIME
```

Where `h = BASE^(m-1) mod PRIME`.

If a hash match occurs, the algorithm performs a full character-by-character verification to rule out collisions.

| Property             | Value |
|----------------------|-------|
| BASE                 | 256   |
| PRIME                | 101   |
| Average complexity   | O(n + m) |
| Worst-case complexity| O(n * m) |

### Naive Search

The brute-force baseline compares the pattern at every position in the text character by character, without any hashing or preprocessing.

| Property             | Value     |
|----------------------|-----------|
| Average complexity   | O(n * m)  |
| Worst-case complexity| O(n * m)  |

---

## Configuration

| Parameter       | Location       | Default | Description                              |
|-----------------|----------------|---------|------------------------------------------|
| `BASE`          | `rabin_karp.h` | 256     | Hash function base (alphabet size)       |
| `PRIME`         | `rabin_karp.h` | 101     | Hash function prime modulus              |
| `PORT`          | `server.js`    | 3000    | HTTP server port (overridable via env)   |
| `maxBuffer`     | `server.js`    | 10 MB   | Maximum stdout buffer for child process  |
| Min word length | `file_handler.cpp` | 3   | Minimum word length for plagiarism check |

---

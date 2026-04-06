#include "rabin_karp.h"
#include <chrono>

SearchResult RabinKarp::search(const std::string& text, const std::string& pattern) {
    SearchResult result;
    auto start = std::chrono::high_resolution_clock::now();

    int n = text.length();
    int m = pattern.length();

    if (m == 0 || m > n) {
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> diff = end - start;
        result.executionTimeMs = diff.count();
        return result;
    }

    int pHash = 0; // hash value for pattern
    int tHash = 0; // hash value for text
    int h = 1;

    // The value of h would be "pow(BASE, m-1)%PRIME"
    for (int i = 0; i < m - 1; i++) {
        h = (h * BASE) % PRIME;
    }

    // Calculate the hash value of pattern and first window of text
    for (int i = 0; i < m; i++) {
        pHash = (BASE * pHash + pattern[i]) % PRIME;
        tHash = (BASE * tHash + text[i]) % PRIME;
    }

    // Slide the pattern over text one by one
    for (int i = 0; i <= n - m; i++) {
        result.comparisons++; // Hash comparison tracking

        // Check the hash values of current window of text and pattern
        if (pHash == tHash) {
            bool match = true;
            // Check for characters one by one
            for (int j = 0; j < m; j++) {
                result.comparisons++; // Character comparison tracking
                if (text[i + j] != pattern[j]) {
                    match = false;
                    result.collisions++; // Collision detected
                    break;
                }
            }

            if (match) {
                result.positions.push_back(i);
            }
        }

        // Calculate hash value for next window of text
        if (i < n - m) {
            tHash = (BASE * (tHash - text[i] * h) + text[i + m]) % PRIME;
            
            // Convert negative value of tHash to positive
            if (tHash < 0) {
                tHash = (tHash + PRIME);
            }
        }
    }

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> diff = end - start;
    result.executionTimeMs = diff.count();

    return result;
}

std::vector<SearchResult> RabinKarp::multiSearch(const std::string& text, const std::vector<std::string>& patterns) {
    std::vector<SearchResult> results;
    for (const auto& pattern : patterns) {
        results.push_back(search(text, pattern));
    }
    return results;
}

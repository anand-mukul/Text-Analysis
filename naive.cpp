#include "naive.h"
#include <chrono>

SearchResult NaiveSearch::search(const std::string& text, const std::string& pattern) {
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

    for (int i = 0; i <= n - m; i++) {
        bool match = true;
        for (int j = 0; j < m; j++) {
            result.comparisons++;
            if (text[i + j] != pattern[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            result.positions.push_back(i);
        }
    }

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> diff = end - start;
    result.executionTimeMs = diff.count();

    return result;
}

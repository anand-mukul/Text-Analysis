#ifndef RABIN_KARP_H
#define RABIN_KARP_H

#include <string>
#include <vector>

struct SearchResult {
    std::vector<int> positions;
    int comparisons = 0;
    int collisions = 0;
    double executionTimeMs = 0.0;
};

class RabinKarp {
private:
    static const int BASE = 256;
    static const int PRIME = 101;

public:
    static SearchResult search(const std::string& text, const std::string& pattern);
    static std::vector<SearchResult> multiSearch(const std::string& text, const std::vector<std::string>& patterns);
};

#endif

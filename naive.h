#ifndef NAIVE_H
#define NAIVE_H

#include <string>
#include <vector>
#include "rabin_karp.h" // Includes SearchResult struct

class NaiveSearch {
public:
    static SearchResult search(const std::string& text, const std::string& pattern);
};

#endif

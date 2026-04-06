#include "utils.h"
#include <cctype>
#include <sstream>

std::string toLowerCase(const std::string& str) {
    std::string res = str;
    for (char& c : res) {
        c = std::tolower(static_cast<unsigned char>(c));
    }
    return res;
}

std::string removePunctuation(const std::string& str) {
    std::string res;
    for (char c : str) {
        if (!std::ispunct(static_cast<unsigned char>(c))) {
            res += c;
        }
    }
    return res;
}

std::vector<std::string> extractWords(const std::string& text) {
    std::string cleanText = removePunctuation(toLowerCase(text));
    std::vector<std::string> words;
    std::stringstream ss(cleanText);
    std::string word;
    while (ss >> word) {
        words.push_back(word);
    }
    return words;
}

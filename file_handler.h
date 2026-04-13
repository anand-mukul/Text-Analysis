#ifndef FILE_HANDLER_H
#define FILE_HANDLER_H

#include <string>
#include <vector>

struct WordMatch {
    std::string word;
    std::vector<int> positionsInSource;
    std::vector<int> positionsInTarget;
    bool matched;
};

struct DetailedPlagiarismResult {
    double similarity;
    bool warning;
    int totalWords;
    int matchedWords;
    std::vector<WordMatch> wordMatches;
};

class FileHandler {
public:
    static std::string readFile(const std::string& filePath);
    static double calculatePlagiarism(const std::string& file1Path, const std::string& file2Path);
    static DetailedPlagiarismResult calculateDetailedPlagiarism(const std::string& file1Path, const std::string& file2Path);
    static DetailedPlagiarismResult calculateDetailedPlagiarismFromText(const std::string& text1, const std::string& text2);
};

#endif

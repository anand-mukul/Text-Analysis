#ifndef FILE_HANDLER_H
#define FILE_HANDLER_H

#include <string>

class FileHandler {
public:
    static std::string readFile(const std::string& filePath);
    static double calculatePlagiarism(const std::string& file1Path, const std::string& file2Path);
};

#endif

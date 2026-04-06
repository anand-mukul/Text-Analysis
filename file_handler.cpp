#include "file_handler.h"
#include "rabin_karp.h"
#include "utils.h"
#include <fstream>
#include <iostream>
#include <sstream>

std::string FileHandler::readFile(const std::string &filePath) {
  std::ifstream file(filePath);
  if (!file.is_open()) {
    std::cerr << "Error: Could not open file " << filePath << std::endl;
    return "";
  }
  std::stringstream buffer;
  buffer << file.rdbuf();
  return buffer.str();
}

double FileHandler::calculatePlagiarism(const std::string &file1Path,
                                        const std::string &file2Path) {
  std::string text1 = readFile(file1Path);
  std::string text2 = readFile(file2Path);

  if (text1.empty() || text2.empty())
    return 0.0;

  // Use lowercased text for plagiarism detection to make it case-insensitive
  std::string cleanText2 = toLowerCase(text2);

  std::vector<std::string> words1 = extractWords(text1);
  if (words1.empty())
    return 0.0;

  int matchedWords = 0;
  int totalWords = words1.size();

  // Loop through each word in File 1 and search heavily across File 2
  for (const std::string &word : words1) {
    if (word.length() < 3) {
      // Skip very short generic words like 'a', 'an', 'to', 'it'
      totalWords--;
      continue;
    }

    // Applying Rabin-Karp to determine similarity token by token
    SearchResult res = RabinKarp::search(cleanText2, word);
    if (!res.positions.empty()) {
      matchedWords++;
    }
  }

  if (totalWords == 0)
    return 0.0;

  return (static_cast<double>(matchedWords) / totalWords) * 100.0;
}

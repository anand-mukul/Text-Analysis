#include "file_handler.h"
#include "rabin_karp.h"
#include "utils.h"
#include <fstream>
#include <iostream>
#include <sstream>
#include <set>
#include <algorithm>

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

  // Track unique words
  std::set<std::string> processedWords;

  // Loop through each word in File 1 and search heavily across File 2
  for (const std::string &word : words1) {
    if (word.length() < 3) {
      // Skip very short generic words like 'a', 'an', 'to', 'it'
      totalWords--;
      continue;
    }

    std::string lowerWord = toLowerCase(word);
    if (processedWords.count(lowerWord)) {
      totalWords--;
      continue;
    }
    processedWords.insert(lowerWord);

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

DetailedPlagiarismResult FileHandler::calculateDetailedPlagiarism(const std::string &file1Path,
                                                                   const std::string &file2Path) {
  std::string text1 = readFile(file1Path);
  std::string text2 = readFile(file2Path);
  return calculateDetailedPlagiarismFromText(text1, text2);
}

DetailedPlagiarismResult FileHandler::calculateDetailedPlagiarismFromText(const std::string &text1,
                                                                          const std::string &text2) {
  DetailedPlagiarismResult result;
  result.similarity = 0.0;
  result.warning = false;
  result.totalWords = 0;
  result.matchedWords = 0;

  if (text1.empty() || text2.empty())
    return result;

  std::string cleanText1 = toLowerCase(text1);
  std::string cleanText2 = toLowerCase(text2);

  std::vector<std::string> words1 = extractWords(text1);
  if (words1.empty())
    return result;

  int totalWords = words1.size();
  int matchedCount = 0;

  // Track unique words to avoid duplicate entries in output
  std::set<std::string> processedWords;

  for (size_t i = 0; i < words1.size(); i++) {
    const std::string &word = words1[i];
    if (word.length() < 3) {
      totalWords--;
      continue;
    }

    // Skip if we've already processed this word
    std::string lowerWord = toLowerCase(word);
    if (processedWords.count(lowerWord)) {
      totalWords--;
      continue;
    }
    processedWords.insert(lowerWord);

    // Find positions in source (text1)
    SearchResult srcRes = RabinKarp::search(cleanText1, lowerWord);
    // Find positions in target (text2)
    SearchResult tgtRes = RabinKarp::search(cleanText2, lowerWord);

    WordMatch wm;
    wm.word = lowerWord;
    wm.positionsInSource = srcRes.positions;
    wm.positionsInTarget = tgtRes.positions;
    wm.matched = !tgtRes.positions.empty();

    if (wm.matched) {
      matchedCount++;
    }

    result.wordMatches.push_back(wm);
  }

  if (totalWords == 0) {
    result.similarity = 0.0;
  } else {
    result.similarity = (static_cast<double>(matchedCount) / totalWords) * 100.0;
  }

  result.warning = result.similarity > 50.0;
  result.totalWords = totalWords;
  result.matchedWords = matchedCount;

  return result;
}

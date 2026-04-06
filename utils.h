#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <vector>

std::string toLowerCase(const std::string& str);
std::string removePunctuation(const std::string& str);
std::vector<std::string> extractWords(const std::string& text);

#endif

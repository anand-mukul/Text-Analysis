#include <iostream>
#include <string>
#include <vector>
#include <iomanip>
#include <sstream>
#include "rabin_karp.h"
#include "naive.h"
#include "file_handler.h"
#include "utils.h"

using namespace std;

void displayMenu() {
    cout << "\n============================================\n";
    cout << " INTELLIGENT TEXT ANALYSIS SYSTEM \n";
    cout << "============================================\n";
    cout << "1. Search Pattern in Text\n";
    cout << "2. Check Plagiarism (Compare Two Files)\n";
    cout << "3. Compare Algorithms (Naive vs Rabin-Karp)\n";
    cout << "4. Multi-pattern Search\n";
    cout << "5. Exit\n";
    cout << "============================================\n";
    cout << "Enter your choice: ";
}

string escapeJson(const string& s) {
    ostringstream o;
    for (auto c = s.cbegin(); c != s.cend(); c++) {
        if (*c == '"' || *c == '\\' || ('\x00' <= *c && *c <= '\x1f')) {
            o << "\\u" << hex << setw(4) << setfill('0') << (int)*c;
        } else {
            o << *c;
        }
    }
    return o.str();
}

int main(int argc, char* argv[]) {
    // API CLI MODE (Bypasses UI)
    if (argc > 1) {
        string mode = argv[1];
        if (mode == "search" && argc == 4) {
            string text = argv[2];
            string pattern = argv[3];
            SearchResult res = RabinKarp::search(toLowerCase(text), toLowerCase(pattern));
            
            cout << "{";
            cout << "\"positions\":[";
            for(size_t i=0; i<res.positions.size(); ++i) {
                cout << res.positions[i] << (i < res.positions.size() - 1 ? "," : "");
            }
            cout << "],";
            cout << "\"matches\":" << res.positions.size() << ",";
            cout << "\"time\":" << fixed << setprecision(4) << res.executionTimeMs << ",";
            cout << "\"comparisons\":" << res.comparisons << ",";
            cout << "\"collisions\":" << res.collisions;
            cout << "}\n";
            return 0;
        }
        else if (mode == "plagiarism" && argc == 4) {
            string f1 = argv[2];
            string f2 = argv[3];
            double similarity = FileHandler::calculatePlagiarism(f1, f2);
            cout << "{";
            cout << "\"similarity\":" << fixed << setprecision(2) << similarity << ",";
            cout << "\"warning\":" << (similarity > 50.0 ? "true" : "false");
            cout << "}\n";
            return 0;
        }
        else if (mode == "compare" && argc == 4) {
             string text = toLowerCase(argv[2]);
             string pattern = toLowerCase(argv[3]);
             SearchResult rkRes = RabinKarp::search(text, pattern);
             SearchResult naiveRes = NaiveSearch::search(text, pattern);
             cout << "{";
             cout << "\"naive\":{\"matches\":" << naiveRes.positions.size() << ",\"comparisons\":" << naiveRes.comparisons << ",\"time\":" << fixed << setprecision(4) << naiveRes.executionTimeMs << "},";
             cout << "\"rk\":{\"matches\":" << rkRes.positions.size() << ",\"comparisons\":" << rkRes.comparisons << ",\"time\":" << fixed << setprecision(4) << rkRes.executionTimeMs << "}";
             cout << "}\n";
             return 0;
        }
        else if (mode == "multi" && argc >= 4) {
             string text = toLowerCase(argv[2]);
             vector<string> patterns;
             for(int i=3; i<argc; i++) {
                 patterns.push_back(toLowerCase(argv[i]));
             }
             vector<SearchResult> results = RabinKarp::multiSearch(text, patterns);
             cout << "{\"results\":[";
             for (size_t i=0; i<results.size(); i++) {
                 auto res = results[i];
                 cout << "{";
                 cout << "\"pattern\":\"" << escapeJson(patterns[i]) << "\",";
                 cout << "\"positions\":[";
                 for(size_t j=0; j<res.positions.size(); ++j) cout << res.positions[j] << (j<res.positions.size()-1?",":"");
                 cout << "],";
                 cout << "\"matches\":" << res.positions.size();
                 cout << "}" << (i < results.size()-1 ? "," : "");
             }
             cout << "]}\n";
             return 0;
        }
        cout << "{\"error\":\"Invalid arguments\"}\n";
        return 1;
    }

    // ORIGINAL INTERACTIVE MODE
    int choice;
    while (true) {
        displayMenu();
        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(10000, '\n');
            continue;
        }

        switch (choice) {
            case 1: {
                string text, pattern;
                cout << "Enter text corpus: ";
                cin.ignore();
                getline(cin, text);
                cout << "Enter pattern to search: ";
                getline(cin, pattern);

                SearchResult res = RabinKarp::search(toLowerCase(text), toLowerCase(pattern));
                
                cout << "\n--- Search Results ---\n";
                if (res.positions.empty()) {
                    cout << "Pattern not found.\n";
                } else {
                    cout << "Pattern found at positions: ";
                    for (int pos : res.positions) cout << pos << " ";
                    cout << "\nTotal matches: " << res.positions.size() << "\n";
                }
                cout << "Execution time: " << fixed << setprecision(4) << res.executionTimeMs << " ms\n";
                cout << "Comparisons made: " << res.comparisons << "\n";
                cout << "Hash collisions: " << res.collisions << "\n";
                break;
            }
            case 2: {
                string f1, f2;
                cout << "Enter path/name for Source File 1: ";
                cin >> f1;
                cout << "Enter path/name for Target File 2: ";
                cin >> f2;
                
                cout << "Analyzing Structure...\n";
                double similarity = FileHandler::calculatePlagiarism(f1, f2);
                cout << "\n--- Plagiarism Report ---\n";
                cout << "Total Similarity: " << fixed << setprecision(2) << similarity << "%\n";
                if (similarity > 50.0) {
                    cout << ">>> \033[31mWarning: High plagiarism similarity detected!\033[0m <<<\n";
                }
                break;
            }
            case 3: {
                string text, pattern;
                cout << "Enter text to evaluate: ";
                cin.ignore();
                getline(cin, text);
                cout << "Enter pattern: ";
                getline(cin, pattern);

                text = toLowerCase(text);
                pattern = toLowerCase(pattern);

                SearchResult rkRes = RabinKarp::search(text, pattern);
                SearchResult naiveRes = NaiveSearch::search(text, pattern);

                cout << "\n--- Algorithm Comparison ---\n";
                cout << left << setw(20) << "Metric" << setw(20) << "Naive" << setw(20) << "Rabin-Karp" << "\n";
                cout << "--------------------------------------------------------\n";
                cout << left << setw(20) << "Matches Found" << setw(20) << naiveRes.positions.size() << setw(20) << rkRes.positions.size() << "\n";
                cout << left << setw(20) << "Total Comparisons" << setw(20) << naiveRes.comparisons << setw(20) << rkRes.comparisons << "\n";
                cout << left << setw(20) << "Time Exec (ms)" << setw(20) << fixed << setprecision(4) << naiveRes.executionTimeMs << setw(20) << rkRes.executionTimeMs << "\n";
                break;
            }
            case 4: {
                string text;
                int n;
                cout << "Enter text corpus: ";
                cin.ignore();
                getline(cin, text);
                cout << "How many patterns do you want to search? ";
                cin >> n;
                
                vector<string> patterns;
                cin.ignore();
                for (int i = 0; i < n; i++) {
                    string p;
                    cout << "Enter pattern " << i + 1 << ": ";
                    getline(cin, p);
                    patterns.push_back(toLowerCase(p));
                }

                text = toLowerCase(text);
                vector<SearchResult> results = RabinKarp::multiSearch(text, patterns);
                
                cout << "\n--- Multi-Pattern Search Results ---\n";
                for (int i = 0; i < n; i++) {
                    cout << "Pattern '" << patterns[i] << "': ";
                    if (results[i].positions.empty()) {
                        cout << "Not found\n";
                    } else {
                        cout << "Found " << results[i].positions.size() << " time(s) at pos: ";
                        for (int pos : results[i].positions) cout << pos << " ";
                        cout << "\n";
                    }
                }
                break;
            }
            case 5:
                cout << "Exiting Analysis System. Goodbye!\n";
                return 0;
            default:
                cout << "Invalid choice. Please try again.\n";
        }
    }
    return 0;
}

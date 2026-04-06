# Intelligent Text Analysis (Rabin-Karp) - VIVA Questions

### Fundamentals & Algorithm Concepts

**1. What is the Rabin-Karp algorithm?**
It is a scalable string-matching algorithm that uses numerical hashing to find any one of a set of pattern strings nested inside a text string payload.

**2. How does Rabin-Karp differ from the Naive String Matching algorithm?**
While the naive approach compares the pattern against substrings character-by-character continuously, Rabin-Karp hashes both the pattern and the current window of the text. Character comparisons only execute if the evaluated hashes are strictly equal. 

**3. What is a "Rolling Hash" function?**
A rolling hash is a custom hash function that allows the hash value of a sliding window of text to be calculated quickly using the hash value of the previous underlying window. It removes the hash trace of the older character exiting the left bound and incorporates the hash of the newest character entering the right bound, usually in $O(1)$ time. 

**4. Why is modulo (`% PRIME`) used in Rabin-Karp?**
Modulo is used to prevent compiler integer overflow since iteratively raising a base to a large exponent generates massive values quickly. Leveraging a prime number heavily distributes the hash representations uniformly, lowering the margin of random collisions. 

**5. What is a "Hash Collision"?**
A hash collision occurs when two uniquely different alphanumeric sequences resolve to the exact identical numeric hash value. 

**6. What are "spurious hits" in Rabin-Karp?**
A spurious hit is a type of collision where the hash of the text window matches the hash of the pattern, but the actual strings do not match. The algorithm resolves this by manually evaluating strings character-by-character when hashes loosely match.

**7. In Plagiarism Detection, why did we use Rabin-Karp?**
Rabin-Karp excels uniquely in sequential pattern matching. We can compute the hashes of multiple test words natively and roll over the target document swiftly, tracking token matches to flag suspicious overlaps. 

**8. What is the best and average-case time complexity of Rabin-Karp?**
Best and Average Case: $O(n + m)$ where "$n$" represents the length of the text length and "$m$" indicates the length of the pattern being located. 

**9. What is the worst-case time complexity of Rabin-Karp?**
Worst Case Time Complexity: $O(n \times m)$. This is usually realized when there is a hash collision at almost every shift in a restricted text block (e.g., searching for "aaa" in "aaaaaaa" causing non-stop rigorous character comparisons).

**10. What base and prime modulus did you use in your project?**
We used `BASE = 256` because there are 256 possible byte combinations in standard ASCII formatting maps. We used `PRIME = 101` as our primary algorithm divisor to constrain calculations and minimize collisions safely across memory segments.

### Advanced Concept Understanding

**11. Why do we specifically chose a prime number for modulo?**
A prime modulus yields a much stronger distribution mapping of hashes across the available arithmetic range than standard composite numbers, therefore minimizing the localized probability of overlaps.

**12. Explain the fundamental difference between KMP (Knuth-Morris-Pratt) and Rabin-Karp.**
KMP employs a deterministic prefix array (LPS tracking array) to bypass scanned portions of the text intelligently and guarantees a worst-case $O(n)$ search. Rabin-Karp uses a sliding rolling hash window instead and operates heavily probabilistically, bearing a worst-case $O(nm)$. However, Rabin-Karp is simpler to configure for multi-pattern architecture.

**13. Mention a real-life industry application for Rabin-Karp.**
It plays a leading role in mass Plagiarism Detection architectures (like MOSS platforms on academic servers), bio-informatics DNA sequence analysis, and querying keywords continuously inside anti-virus application monitors.

**14. What improvements can be made to the plagiarism module?**
Instead of matching individual scattered terms causing false-high percentage hits on mundane text (e.g. "it", "and"), we could use $k$-grams (phrasal combinations of 3-5 consecutive elements) to rigorously detect stolen paragraph structure. 

**15. Could this algorithm footprint be extended to a real-time word processor?**
Yes. Successfully integrated with an overarching internal node trie or arrays of multiple hashes, it could perpetually evaluate and parse out flagged dictionary entries as users actively type entries.

### Technical & Implementation Details

**16. How did you track hash collisions within your actual source code?**
Whenever `textHash == patternHash` evaluated to true, but the inner loop hit an explicit divergence where `text[i+j] != pattern[j]`, we incremented the standard `collisions` counter variable wrapped inside the `SearchResult` struct.

**17. What specifically does standard library `<chrono>` do in the algorithm comparison?**
 `<chrono>` is a standard utility class in C++11 used to get extremely high-fidelity timestamps generated directly before and after functions execute, permitting measurement benchmarks of exactly how many native milliseconds were burned tracking matches.

**18. Compare Rabin-Karp against Boyer-Moore briefly.**
Boyer-Moore uses bad-character/good-suffix structural heuristics to heavily skip sections of evaluations acting in general sub-linear bounds $O(n/m)$ dynamically. While BM runs noticeably faster single matches, Rabin-Karp carries a structural scale advantage for implementing rolling concurrent tests.

**19. How did you execute the plagiarism parser to check dynamically case-insensitively?**
We implemented an embedded modular function labeled `toLowerCase()` iterating across sequence scopes formatting upper-scale character tokens universally via standard logic `std::tolower()`. 

**20. Why do you use `static_cast<unsigned char>` combined with `std::tolower`?**
This defends strictly against compiler-defined undefined behavior involving standard 8-bit limits. Characters expanding beyond positive limitations turn physically negative generating potential segmentation flaws.

**21. Is your Multiple Pattern Search feature optimally drafted?**
For foundational simplicity native to this demonstration scale, we strictly chain the Rabin-Karp loop sequentially per pattern input. More refined operational optimization combines all queried payload hashes simultaneously across a bloom filter index.

**22. How is generic File Handling natively streamlined?**
The generic C++ `ifstream` buffer stream pulls entirely and natively down into an `ostringstream` directly permitting scalable dynamic memory storage via a single procedural pass, escaping tedious looped file line tracking.

**23. Why did Plagiarism filter limit search loops against minor linguistic terms?**
Micro propositions and standard conjunction modifiers identically shared ("to", "or", "so", "be") falsely saturate overlaps failing to signify accurate content theft metrics. 

**24. What are the bounding hardware constraints of the project architecture?**
It actively needs runtime memory capacity equivalent or larger than the raw target stream since Out-of-Core disk swapping hasn't been configured for enterprise terabyte clusters yet.

**25. Why initialize `structs` over returning dynamically allocated arrays?**
A compiled C++ `struct` enables natively type-safe aggregations pairing multiple related values elegantly without dangling pointers, honoring strong Object-Oriented methodologies cleanly natively. 

**26. What happens if the PRIME number used is too small?**
If PRIME is severely small, cyclic modulo arithmetic causes hash values to loop causing extreme volumes of hash collisions constantly forcing the algorithm to fall back to the naive bounds scaling at $O(n \times m)$.

**27. What happens if the PRIME number is irrefutably large computationally?**
Unmanageable massive prime numbers effectively block collisions entirely but invoke compiler integer overflow during complex multiplication loops resulting in invalid runtime crashes or corrupted random allocations. Code bounds must operate harmoniously within signed 32/64 bit barriers natively.

**28. How is an effective Prime explicitly found?**
A superior computational prime strictly sits directly below local architectural memory constraints minimizing collisions harmlessly. Constants like 1e9+7 are adopted thoroughly.

**29. Can Rabin-Karp theoretically find two-dimensional geometric patterns natively?**
Yes. The rolling properties organically cascade. Structural calculations uniquely remap to process structural grids natively evaluating sub-patched matrices making it remarkably excellent for raw pixel-stream processing logic and Computer Vision tests.

**30. Why is standard `<chrono>` preferred industrially over standard header `<time.h>` operations?**
Modern `<chrono>` delivers localized, hardware-abstract, exceptionally high-resolution clocks evaluating strict absolute wall-clock times natively bypassing inaccurate raw system CPU thread-tick aggregations. 

*(Note: Instructors may utilize core foundational programming principles applied dynamically extending off these 30 subjects natively.)*

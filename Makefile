CXX = g++
CXXFLAGS = -Wall -Wextra -std=c++11 -O2

SRCS = main.cpp rabin_karp.cpp naive.cpp file_handler.cpp utils.cpp
OBJS = $(SRCS:.cpp=.o)
TARGET = text_analysis

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(OBJS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)

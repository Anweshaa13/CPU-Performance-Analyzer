cmake_minimum_required(VERSION 3.16)
project(cpu_performance_analyzer_engine LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
add_library(cpu_performance_analyzer STATIC cpu_performance_analyzer.cpp)

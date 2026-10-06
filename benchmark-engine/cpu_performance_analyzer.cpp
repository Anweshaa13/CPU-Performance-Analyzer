// Optional native benchmark reference implementation.
// The production demo currently executes the same workload definitions in browser TypeScript
// so it works without requiring a local C++/Emscripten toolchain.
#include <cstdint>
#include <cmath>
#include <vector>

extern "C" {
std::int32_t integer_work(std::int32_t n) { std::int32_t x=0; for(std::int32_t i=0;i<n;i++){ x=static_cast<std::int32_t>(__builtin_mul_overflow_p(x+17,i+3,(std::int32_t)0)?x: x); x ^= (x<<5)|(static_cast<std::uint32_t>(x)>>27); } return x; }
double floating_work(std::int32_t n){double x=1.001;for(std::int32_t i=0;i<n;i++) x=std::fma(x,1.0000001,0.00001);return x;}
}

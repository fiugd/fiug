#include <iostream>
using namespace std;

int* fib(int n){
    int t1 = 0, t2 = 1, nextTerm = 0;
    int results [10];
    for (int i = 0; i < n; ++i) {
        if(i == 0) {
            results[i] = t1;
            continue;
        }
        if(i == 1){
            results[i] = t2;
            continue;
        }
        nextTerm = t1 + t2;
        t1 = t2;
        t2 = nextTerm;
        results[i] = nextTerm;
    }
    return results;
}

int main(){
    int n = 10;
    int* results = fib(n);
    for (int i = 0; i < 10; ++i) {
      cout << results[i] << endl;
    }
    return 0;
}

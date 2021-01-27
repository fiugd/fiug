<!-- no-select -->


<!-- here-here=true -->


```javascript
  console.log('hello');
```

```javascript/json
  {
    "tree": {
      "apple": {},
      "lemon": {},
      "pear": {}
    }
  }
```


### foo
hello


<div id="foo-manual">
  hello
</div>



An example of CS highlight in editor, by CodeMirror.
```css
  #foo { color: red; }
```

Less/Sass/Stylus don't seem to get the same
```text/less
#foo
  color red
```
```text/sass
#foo
  color red
```
```text/styl
#foo
  color red
```


It's cool that CodeMirror gives highlighting here!  Would be even cooler to have prism (or something similar) highlighting the preview..

```ada
with Ada.Text_IO; use Ada.Text_IO;
with Ada.Long_Integer_Text_IO; use Ada.Long_Integer_Text_IO;

procedure Fib is
    function Fib (N : Long_Integer) return Long_Integer is
    begin
        if N <= 1 then
            return 1;
        end if;
        return Fib (N - 1) + Fib (N - 2);
    end Fib;
begin
    Put (Fib (46));
    New_Line;
end Fib;
```


```crystal
def fib(n : UInt64)
  return 1_u64 if n <= 1
  fib(n - 1) + fib(n - 2)
end
puts fib(46)
```

```clojure
(def fib-seq 
  ((fn rfib [a b] 
     (lazy-seq (cons a (rfib b (+ a b)))))
   0 1))
(print (take 10 fib-seq))
```

```c-like
#include <iostream>

inline void fibmul(int* f, int* g){
    int tmp = f[0]*g[0] + f[1]*g[1];
    f[1] = f[0]*g[1] + f[1]*(g[0] + g[1]);
    f[0] = tmp;
}

int fibonacci(int n){
    int f[] = { 1, 0 };
    int g[] = { 0, 1 };
    while (n > 0) {
        if (n & 1) {
            fibmul(f, g);
            --n;
        } else {
            fibmul(g, g);
            n >>= 1;
        }
    }
    return f[1];
}

int main(){
    for (int i = 0; i < 10; ++i){
        cout << fibonacci(i) << endl;
    }
    return 0;
}
```



```scheme
; scheme loves parenthesis tails

(define (fib n)
(cond
    ((= n 0) 0)
    ((= n 1) 1)
    (else
    (+ (fib (- n 1))
        (fib (- n 2))))))

; todo: write some driver code

```


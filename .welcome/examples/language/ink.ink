`
https://github.com/thesephist/ink

https://blog.gopheracademy.com/advent-2018/llvm-ir-and-go/
https://dev.to/enbis/generate-and-run-webassembly-code-using-go-4fbp

ideas on how to get this to work:

1) use go on server compile the interpreter to llvm ir -> wasm or directly to wasm

2) run ink code in browser using go template

`

` fibonacci sequence generator `

log := load('std').log

` naive implementation `
fib := n => n :: {
	0 -> 0
	1 -> 1
	_ -> fib(n - 1) + fib(n - 2)
}

` memoized / dynamic programming implementation `
memo := [0, 1]
fibMemo := n => (
	memo.(n) :: {
		() -> memo.(n) := fibMemo(n - 1) + fibMemo(n - 2)
	}
	memo.(n)
)

log('fib(20) is 6765:')
out('Naive solution: '), log(fib(20))
out('Dynamic solution: '), log(fibMemo(20))

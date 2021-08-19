`
https://github.com/thesephist/ink

https://blog.gopheracademy.com/advent-2018/llvm-ir-and-go/
https://dev.to/enbis/generate-and-run-webassembly-code-using-go-4fbp

ideas on how to get this to work:

1) use go on server compile the interpreter to llvm ir -> wasm or directly to wasm

2) run ink code in browser using go template


https://play.dotink.co/

`

` fibonacci sequence generator `

memo := [0, 1]
fibMemo := n => (
	memo.(n) :: {
		() -> memo.(n) := fibMemo(n - 1) + fibMemo(n - 2)
	}
	memo.(n)
)

fibDriver := n => map(
	range(0, n + 1, 1)
	fibMemo
)

each(
	fibDriver(9)
	n => out(n + ' ')
)
log('\n')

`
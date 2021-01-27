package main

import (
	"syscall/js"
)

func fib(n int) int {
	if n <= 1 {
		return n
	}
	return fib(n-1) + fib(n-2)
}

func main() {
	for n := 0; n < 9; n++ {
		js.Global().Call("doEach", fib(n))
		js.Global().Call("doEach", "\n")
	}
}

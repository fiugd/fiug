# import ../../shared.styl
#=

use https://github.com/Keno/julia-wasm

=# 

function fib(n)
	if n <= 1 return n end
	return fib(n - 1) + fib(n - 2)
end

fibprint(n) = println(fib(n))

A = collect(0:9)  # create an array with each integer in range
fibprint.(A)      # apply fibprint to each array item

nothing           # return nothing; supress extra output

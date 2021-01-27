def fib():
	a, b = 0, 1
	while True:
		yield a
		a, b = b, a + b

for index, fibonacci_number in zip(range(10), fib()):
	print('{f:3}'.format(f=fibonacci_number))

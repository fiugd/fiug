// import ../../shared.styl

program Fibonacci;
var i : integer;

function fib(n : integer) : integer;
begin
	if n = 0 then fib := 0
	else if n <= 2 then fib := 1
	else fib := fib(n-2) + fib(n-1)
end;

begin
	for i := 0 to 9 do
	begin
		writeln(fib(i))
	end
end.

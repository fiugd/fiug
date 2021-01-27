"""

https://tylerscript.dev/bringing-the-beam-to-webassembly-with-lumen

"""

defmodule Fibonacci do
  def find(nth) do
    list = [1, 1]
    fib(list, nth)
  end

  def fib(list, 2) do
    Enum.reverse(list)
  end

  def fib(list, n) do
    fib([hd(list) + hd(tl(list))] ++ list, n - 1)
  end
end
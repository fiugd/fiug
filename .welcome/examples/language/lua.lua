-- import ../../shared.styl

local function fib(n)
  local function inner(m)
    if m < 2 then
      return m
    end
    return inner(m-1) + inner(m-2)
  end
  return inner(n)
end

for i = 0,9,1
do 
   print(fib(i))
end

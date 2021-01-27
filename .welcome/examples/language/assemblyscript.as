function fib(n: i32): i32 {
  let a = 0;
  let b = 1;
  if (n <= 0){
    return a;
  }
  while (--n) {
    const t = a + b;
    a = b;
    b = t;
  }
  return b;
}

export function main(): string {
  let array: i32[] = new Array<i32>(10);
  for (let i = 0; i < array.length; ++i) {
    array[i] = i;
  }
  return array.map<i32>((i) => fib(i)).join('\n');
}

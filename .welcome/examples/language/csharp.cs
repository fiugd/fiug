/*

https://github.com/SteveSanderson/Blazor

https://github.com/migueldeicaza/mono-wasm

http://www.kumpera.com/wasm/fsharp.html

http://www.kumpera.com/wasm/driver.html

http://www.hipbyte.com/~lrz/mono-wasm-hello/

https://jenkins.mono-project.com/job/test-mono-mainline-wasm/label=ubuntu-1804-amd64/


-- does everything
https://www.strathweb.com/2019/06/building-a-c-interactive-shell-in-a-browser-with-blazor-webassembly-and-roslyn/
https://csharpinteractive.azurewebsites.net/

*/

using System;

public class Fib {
  static uint fib(uint n) {
    if (n <= 1) return 1;
    return fib(n - 1) + fib(n - 2);
  }

  public static void Main(string[] args) {
    Console.WriteLine(fib(46));
  }
}
(* import ../../shared.styl *)

(*
https://github.com/sebmarkbage/ocamlrun-wasm
https://try.ocamlpro.com/ uses js_of_ocaml
*)

let rec fib i =
  if i <= 1 then 1 else fib (i - 1) + fib (i - 2)

let () =
  print_int (fib 1);
  print_newline ();

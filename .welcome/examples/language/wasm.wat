;; import ../../shared.styl

;; https://hacks.mozilla.org/2017/02/creating-and-working-with-webassembly-modules/
;; https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format
;; https://github.com/WebAssembly/interface-types/issues/18
;; https://learnxinyminutes.com/docs/wasm/
;; https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format

(module
  (import "env" "jsIntPrint" (func $import0 (param i32 i32)))
  (type $type0 (func (param i32) (result i32)))
  (table 0 anyfunc)
  (memory $0 1)
  (export "memory" (memory $0))

  (data (i32.const 16) "" )    ;; output
  (data (i32.const 20) "" )    ;; i
  (data (i32.const 24) "\n" )  ;; \n is eq 10
  (data (i32.const 28) "" )    ;; t1
  (data (i32.const 32) "\01" ) ;; nextTerm
  (data (i32.const 36) "" )    ;; ???

  (export "main" (func $fib))
  (func $fib
    (local $var0 i32) (local $var1 i32)
    i32.const 0
    i32.const 0
    i32.store offset=20
    block $label0
      loop $label4
        i32.const 0
        i32.load offset=20
        i32.const 0
        i32.load offset=24
        i32.ge_s
        br_if $label0
        block $label3 block $label2 block $label1
          i32.const 0
          i32.load offset=20
          i32.eqz
          br_if $label1
          i32.const 0
          i32.load offset=20
          i32.const 1
          i32.ne
          br_if $label2
          i32.const 0
          i32.const 1
          i32.store8 offset=16
          br $label3
        end $label1
          i32.const 0
          i32.const 0
          i32.store8 offset=16
          br $label3
        end $label2
          i32.const 0
          i32.const 0
          i32.load offset=28
          i32.const 0
          i32.load offset=32
          tee_local $var0
          i32.add
          tee_local $var1
          i32.store offset=36
          i32.const 0
          get_local $var0
          i32.store offset=28
          i32.const 0
          get_local $var1
          i32.store offset=32
          i32.const 0
          get_local $var1
          i32.store8 offset=16
        end $label3
        i32.const 16
        i32.const 1
        call $import0
        i32.const 0
        i32.const 0
        i32.load offset=20
        i32.const 1
        i32.add
        i32.store offset=20
        br $label4
      end $label4
    end $label0
  )
)

;; https://mbebenita.github.io/WasmExplorer/

;; extern "C" void jsprint(const char *s, int len);

;; char output;
;; int i=0, n=10, t1 = 0, t2 = 1, nextTerm = 0;

;; void fib(){
;;    for (i = 0; i < n; ++i) {
;;        if(i == 0) {
;;            output = 0;
;;            jsprint(&output, 1);
;;            continue;
;;        }
;;        if(i == 1){
;;            output = 1;
;;            jsprint(&output, 1);
;;            continue;
;;        }
;;        nextTerm = t1 + t2;
;;        t1 = t2;
;;        t2 = nextTerm;
;;        output = (char) nextTerm;
;;        jsprint(&output, 1);
;;    }
;; }

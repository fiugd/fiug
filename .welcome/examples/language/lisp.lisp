;;;Original code by Arnold Schoenhage,
;;;translated to Scheme by Bradley J. Lucier (2004),
;;;and adapted to Common Lisp by Nicolas Neuss.
(lambda()
  (defun fast-fib-pair (n)
    "Returns f_n f_{n+1}."
    (case n
      ((0) (values 0 1))
      ((1) (values 1 1))
      (t (let ((m (floor n 2)))
           (multiple-value-bind (f_m f_m+1)
               (fast-fib-pair m)
             (let ((f_m^2   (* f_m f_m))
                   (f_m+1^2 (* f_m+1 f_m+1)))
               (if (evenp n)
                   (values (- (* 2 f_m+1^2)
                              (* 3 f_m^2)
                              (if (oddp m) -2 2))
                           (+ f_m^2 f_m+1^2))
                   (values (+ f_m^2 f_m+1^2)
                           (- (* 3 f_m+1^2)
                              (* 2 f_m^2)
                              (if (oddp m) -2 2))))))))))
  (dotimes (i 10)
    (#j:console:info (fast-fib-pair i) "\\n"))
)

( import ../../shared.styl )

: FIB ( n -- fib )
  0 1 ROT 0
  DO
    OVER + SWAP
  LOOP DROP CR ;

: FIB_ALL
  2DUP SWAP
  DO
    I 0 >
      IF I FIB .
      ELSE 0 .
    THEN
  LOOP
;

0 10 FIB_ALL

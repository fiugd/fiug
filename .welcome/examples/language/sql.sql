-- SQL FIBO VIA RECURSE

WITH RECURSIVE fib (n1, n2) AS
(
    SELECT 0, 1
    UNION ALL
    SELECT n2, n1+n2
    FROM fib
    LIMIT 10
)
SELECT n1 FROM fib;

-- driver code?
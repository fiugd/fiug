# use https://fglock.github.io/Perlito/perlito/perlito6.html

sub fib {
  my $n = shift;
  if ( $n <= 1 ) { return 1; }
  return fib($n - 1) + fib($n - 2);
}

print fib(46)

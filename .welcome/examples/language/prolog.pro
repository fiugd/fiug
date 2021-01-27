% http://tau-prolog.org/documentation
:- use_module(library(js)).
:- use_module(library(lists)).
:- use_module(library(dom)).

fib(0, 0) :- !.
fib(1, 1) :- !.
fib(N, F) :-
    N > 1,
    N1 is N-1,
    N2 is N-2,
    fib(N1, F1),
    fib(N2, F2),
    F is F1+F2.

domInit :-
    create(pre, LI),
    add_class(LI, 'list-group-item'),
    html(LI, 'example of dom manipulation'),
    body(Parent),
    append_child(Parent, LI).

console_log(Text) :-
    prop(console, Console),
    prop(Console, log, ConsoleLog),
    apply(ConsoleLog, [Text], _).

numlist(Start, Count, List) :-
    findall(N, between(Start,Count,N), List).

write_fib(A) :-
    findall(X, fib(A, X), [X0|_]),
    console_log(X0), nl.

main :-
    numlist(0, 9, L),
    maplist(write_fib, L),
    % domInit,
    % console_log('example of console log'),
    !.

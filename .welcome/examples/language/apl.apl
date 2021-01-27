@ This program is very simple in APL!

'Hello World!'

@ In APL, anything that is printed in quotes is printed to the terminal. (@ in APL signifies a comment)

@ If the "Hello World statement needed to be stored, then you could use the following :
h<-'Hello World'
h

@Typing h causes h's value to be printed to be printed.



@ fibonacci 1

↑+.×/N/⊂2 2⍴1 1 1 0

@ fibonacci 2

⌊.5+(((1+PHI)÷2)*⍳N)÷PHI←5*.5
/*

package everything into one single file (or only a few)

https://github.com/garfieldius/Browser-UglifyJS


Service Worker

A)
it may be possible to install a service worker from one html file, but this is very much going against best practices and at the very least may be hard

B)
could use a worker with some sort of fetch override, but this would have to be done in a way that makes it easy to use the same code and switch back and forth between worker and service worker
 - https://www.quora.com/Is-there-a-polyfill-for-Service-Workers

C)
probably the best solution is to make service worker as minimal as possible and bundle everything else into a single html or one js file

*/
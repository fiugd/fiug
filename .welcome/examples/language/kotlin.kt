/*

http://teavm.org/sandbox/

*/

fun fibonacciFoldDebug(n: Int) =
    (2 until n).fold(1 to 1) { (prev, curr), _ ->
        println("prev=$prev, curr=$curr")
        curr to (prev + curr)
    }.second

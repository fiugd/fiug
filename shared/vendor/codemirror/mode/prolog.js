/* for the Prolog syntax, 
 * see: http://www.sics.se/sicstus/docs/3.7.1/html/sicstus_45.html */

CodeMirror.defineMode("prolog", function(config, parserConfig) {
  var reservedids = {}; 
  var reservedops = {
    ":-": "builtin", ":":  "builtin",  "?-":  "builtin",
    "->": "builtin", 
    "<-": "builtin", "->": "builtin",  "@":   "builtin",
    "~":  "builtin", "=>": "builtin",  ",":   "builtin", 
    ".":  "builtin", "\\+": "builtin", "-->": "builtin",   
  };

  var isSymbolChar = /[+\-*/\\\^<>=`~:.?@#$&]/;
  var isSoloChar = /[!;]/;
  var isWordChar = /[\w_]/;
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "\"" || ch == "'") {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
    }
    // with punctuation, the type of the token is the symbol itself
    else if (/[0-9]/.test(ch))
      return readNumber(stream);
    else if (/[\(\),\[\]{|}]/.test(ch))
      return null;
    else if (ch == "%") {
      stream.skipToEnd(); return "comment";
    }
    else if (ch == "/") {
      if (stream.eat("*")) { 
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      else 
        return readSymbol(stream);
    }
    else if (isSymbolChar.test(ch)) 
      return readSymbol(stream);
    else if (isSoloChar.test(ch)) 
      return "builtin"
    else
      return readWord(stream);
  } 

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !escaped)
        state.tokenize = null;
      return "string";
    };
  }

  function readNumber(stream) {
    stream.eatWhile(/[0-9]/);
    if (stream.eat(".")){
      stream.eatWhile(/[0-9]/);
    }
    if (stream.eat("e") || stream.eat("E")){
      if (stream.eat("-"));
      stream.eatWhile(/[0-9]/);
    }
    return "number";
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd){
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function readSymbol(stream) {
    stream.eatWhile(isSymbolChar);
    var word = stream.current();
    var known = reservedops.hasOwnProperty(word)
                && reservedops.propertyIsEnumerable(word)
                && reservedops[word];
    return known || "operator";
  }

  function readWord(stream) {
    stream.eatWhile(isWordChar);
    var word = stream.current();
    var known = reservedids.hasOwnProperty(word)
                && reservedids.propertyIsEnumerable(word)
                && reservedids[word];
    return known || "variable";
  }

  return {
    startState: function() {
      return ({ tokenize: null });
    },
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      return style;
    },
    // indent: function(state, textAfter) {}
    lineComment:       "%",
    blockCommentStart: "/*",
    blockCommentEnd:   "*/",
    electricChars:     ""
  };
});

CodeMirror.defineMIME("text/x-prolog", "prolog");
// converted from ace mode found at https://playground.ponylang.io/
// using https://github.com/espadrine/ace2cm


// Parts from Ace; see <https://raw.githubusercontent.com/ajaxorg/ace/master/LICENSE>
CodeMirror.defineMode("pony", function (cmCfg, modeCfg) {
  // Fake define() function.
  var moduleHolder = Object.create(null);

  // Given a module path as a string, create the canonical version
  // (no leading ./, no ending .js).
  var canonicalPath = function (path) {
    return path.replace(/\.\//, "").replace(/\.js$/, "");
  };

  // We intentionally add the `path` argument to `define()`.
  var define = function (path, init) {
    var exports = Object.create(null);
    init(require, exports); // module (3rd parameter) isn't supported.
    moduleHolder[canonicalPath(path)] = exports;
  };

  // path: string of the location of the JS file.
  var require = function (path) {
    return moduleHolder[canonicalPath(path)];
  };

  // All dependencies here.
  define("oop.js", function (require, exports, module) {
    "use strict";

    exports.inherits = function (ctor, superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true,
        },
      });
    };

    exports.mixin = function (obj, mixin) {
      for (var key in mixin) {
        obj[key] = mixin[key];
      }
      return obj;
    };

    exports.implement = function (proto, mixin) {
      exports.mixin(proto, mixin);
    };
  });

  define("lang.js", function (require, exports, module) {
    "use strict";

    exports.last = function (a) {
      return a[a.length - 1];
    };

    exports.stringReverse = function (string) {
      return string.split("").reverse().join("");
    };

    exports.stringRepeat = function (string, count) {
      var result = "";
      while (count > 0) {
        if (count & 1) result += string;

        if ((count >>= 1)) string += string;
      }
      return result;
    };

    var trimBeginRegexp = /^\s\s*/;
    var trimEndRegexp = /\s\s*$/;

    exports.stringTrimLeft = function (string) {
      return string.replace(trimBeginRegexp, "");
    };

    exports.stringTrimRight = function (string) {
      return string.replace(trimEndRegexp, "");
    };

    exports.copyObject = function (obj) {
      var copy = {};
      for (var key in obj) {
        copy[key] = obj[key];
      }
      return copy;
    };

    exports.copyArray = function (array) {
      var copy = [];
      for (var i = 0, l = array.length; i < l; i++) {
        if (array[i] && typeof array[i] == "object")
          copy[i] = this.copyObject(array[i]);
        else copy[i] = array[i];
      }
      return copy;
    };

    exports.deepCopy = function deepCopy(obj) {
      if (typeof obj !== "object" || !obj) return obj;
      var copy;
      if (Array.isArray(obj)) {
        copy = [];
        for (var key = 0; key < obj.length; key++) {
          copy[key] = deepCopy(obj[key]);
        }
        return copy;
      }
      if (Object.prototype.toString.call(obj) !== "[object Object]") return obj;

      copy = {};
      for (var key in obj) copy[key] = deepCopy(obj[key]);
      return copy;
    };

    exports.arrayToMap = function (arr) {
      var map = {};
      for (var i = 0; i < arr.length; i++) {
        map[arr[i]] = 1;
      }
      return map;
    };

    exports.createMap = function (props) {
      var map = Object.create(null);
      for (var i in props) {
        map[i] = props[i];
      }
      return map;
    };

    /*
     * splice out of 'array' anything that === 'value'
     */
    exports.arrayRemove = function (array, value) {
      for (var i = 0; i <= array.length; i++) {
        if (value === array[i]) {
          array.splice(i, 1);
        }
      }
    };

    exports.escapeRegExp = function (str) {
      return str.replace(/([.*+?^${}()|[\]\/\\])/g, "\\$1");
    };

    exports.escapeHTML = function (str) {
      return ("" + str)
        .replace(/&/g, "&#38;")
        .replace(/"/g, "&#34;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&#60;");
    };

    exports.getMatchOffsets = function (string, regExp) {
      var matches = [];

      string.replace(regExp, function (str) {
        matches.push({
          offset: arguments[arguments.length - 2],
          length: str.length,
        });
      });

      return matches;
    };

    /* deprecated */
    exports.deferredCall = function (fcn) {
      var timer = null;
      var callback = function () {
        timer = null;
        fcn();
      };

      var deferred = function (timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
      };

      deferred.schedule = deferred;

      deferred.call = function () {
        this.cancel();
        fcn();
        return deferred;
      };

      deferred.cancel = function () {
        clearTimeout(timer);
        timer = null;
        return deferred;
      };

      deferred.isPending = function () {
        return timer;
      };

      return deferred;
    };

    exports.delayedCall = function (fcn, defaultTimeout) {
      var timer = null;
      var callback = function () {
        timer = null;
        fcn();
      };

      var _self = function (timeout) {
        if (timer == null)
          timer = setTimeout(callback, timeout || defaultTimeout);
      };

      _self.delay = function (timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
      };
      _self.schedule = _self;

      _self.call = function () {
        this.cancel();
        fcn();
      };

      _self.cancel = function () {
        timer && clearTimeout(timer);
        timer = null;
      };

      _self.isPending = function () {
        return timer;
      };

      return _self;
    };
  });

  define("text_highlight_rules.js", function (require, exports, module) {
    "use strict";

    var lang = require("lang");

    var TextHighlightRules = function () {
      // regexp must not have capturing parentheses
      // regexps are ordered -> the first match is used

      this.$rules = {
        start: [
          {
            token: "empty_line",
            regex: "^$",
          },
          {
            defaultToken: "text",
          },
        ],
      };
    };

    (function () {
      this.addRules = function (rules, prefix) {
        if (!prefix) {
          for (var key in rules) this.$rules[key] = rules[key];
          return;
        }
        for (var key in rules) {
          var state = rules[key];
          for (var i = 0; i < state.length; i++) {
            var rule = state[i];
            if (rule.next || rule.onMatch) {
              if (typeof rule.next == "string") {
                if (rule.next.indexOf(prefix) !== 0)
                  rule.next = prefix + rule.next;
              }
              if (rule.nextState && rule.nextState.indexOf(prefix) !== 0)
                rule.nextState = prefix + rule.nextState;
            }
          }
          this.$rules[prefix + key] = state;
        }
      };

      this.getRules = function () {
        return this.$rules;
      };

      this.embedRules = function (
        HighlightRules,
        prefix,
        escapeRules,
        states,
        append
      ) {
        var embedRules =
          typeof HighlightRules == "function"
            ? new HighlightRules().getRules()
            : HighlightRules;
        if (states) {
          for (var i = 0; i < states.length; i++)
            states[i] = prefix + states[i];
        } else {
          states = [];
          for (var key in embedRules) states.push(prefix + key);
        }

        this.addRules(embedRules, prefix);

        if (escapeRules) {
          var addRules = Array.prototype[append ? "push" : "unshift"];
          for (var i = 0; i < states.length; i++)
            addRules.apply(this.$rules[states[i]], lang.deepCopy(escapeRules));
        }

        if (!this.$embeds) this.$embeds = [];
        this.$embeds.push(prefix);
      };

      this.getEmbeds = function () {
        return this.$embeds;
      };

      var pushState = function (currentState, stack) {
        if (currentState != "start" || stack.length)
          stack.unshift(this.nextState, currentState);
        return this.nextState;
      };
      var popState = function (currentState, stack) {
        // if (stack[0] === currentState)
        stack.shift();
        return stack.shift() || "start";
      };

      this.normalizeRules = function () {
        var id = 0;
        var rules = this.$rules;
        function processState(key) {
          var state = rules[key];
          state.processed = true;
          for (var i = 0; i < state.length; i++) {
            var rule = state[i];
            var toInsert = null;
            if (Array.isArray(rule)) {
              toInsert = rule;
              rule = {};
            }
            if (!rule.regex && rule.start) {
              rule.regex = rule.start;
              if (!rule.next) rule.next = [];
              rule.next.push(
                {
                  defaultToken: rule.token,
                },
                {
                  token: rule.token + ".end",
                  regex: rule.end || rule.start,
                  next: "pop",
                }
              );
              rule.token = rule.token + ".start";
              rule.push = true;
            }
            var next = rule.next || rule.push;
            if (next && Array.isArray(next)) {
              var stateName = rule.stateName;
              if (!stateName) {
                stateName = rule.token;
                if (typeof stateName != "string")
                  stateName = stateName[0] || "";
                if (rules[stateName]) stateName += id++;
              }
              rules[stateName] = next;
              rule.next = stateName;
              processState(stateName);
            } else if (next == "pop") {
              rule.next = popState;
            }

            if (rule.push) {
              rule.nextState = rule.next || rule.push;
              rule.next = pushState;
              delete rule.push;
            }

            if (rule.rules) {
              for (var r in rule.rules) {
                if (rules[r]) {
                  if (rules[r].push)
                    rules[r].push.apply(rules[r], rule.rules[r]);
                } else {
                  rules[r] = rule.rules[r];
                }
              }
            }
            var includeName = typeof rule == "string" ? rule : rule.include;
            if (includeName) {
              if (Array.isArray(includeName))
                toInsert = includeName.map(function (x) {
                  return rules[x];
                });
              else toInsert = rules[includeName];
            }

            if (toInsert) {
              var args = [i, 1].concat(toInsert);
              if (rule.noEscape)
                args = args.filter(function (x) {
                  return !x.next;
                });
              state.splice.apply(state, args);
              // skip included rules since they are already processed
              //i += args.length - 3;
              i--;
            }

            if (rule.keywordMap) {
              rule.token = this.createKeywordMapper(
                rule.keywordMap,
                rule.defaultToken || "text",
                rule.caseInsensitive
              );
              delete rule.defaultToken;
            }
          }
        }
        Object.keys(rules).forEach(processState, this);
      };

      this.createKeywordMapper = function (
        map,
        defaultToken,
        ignoreCase,
        splitChar
      ) {
        var keywords = Object.create(null);
        this.$keywordList = [];
        Object.keys(map).forEach(function (className) {
          var a = map[className];
          var list = a.split(splitChar || "|");
          for (var i = list.length; i--; ) {
            var word = list[i];
            this.$keywordList.push(word);
            if (ignoreCase) word = word.toLowerCase();
            keywords[word] = className;
          }
        }, this);
        map = null;
        return ignoreCase
          ? function (value) {
              return keywords[value.toLowerCase()] || defaultToken;
            }
          : function (value) {
              return keywords[value] || defaultToken;
            };
      };

      this.getKeywords = function () {
        return this.$keywords;
      };
    }.call(TextHighlightRules.prototype));

    exports.TextHighlightRules = TextHighlightRules;
  });

  define("pony_highlight_rules", function (require, exports, module) {
    "use strict";

    var oop = require("oop");
    var TextHighlightRules = require("text_highlight_rules").TextHighlightRules;

    var PonyHighlightRules = function () {
      this.$rules = {
        start: [
          {
            include: "#block-comments",
          },
          {
            include: "#line-comments",
          },
          {
            include: "#typedeclarations",
          },
          {
            include: "#methoddeclarations",
          },
          {
            include: "#keywords",
          },
          {
            include: "#constants",
          },
          {
            include: "#identifiers",
          },
          {
            include: "#strings",
          },
        ],
        "#block-comments": [
          {
            token: "comment.block.pony",
            regex: /\/\*/,
            push: [
              {
                token: "comment.block.pony",
                regex: /\*\//,
                next: "pop",
              },
              {
                include: "#block-comments",
              },
              {
                defaultToken: "comment.block.pony",
              },
            ],
          },
        ],
        "#constants": [
          {
            token: "constant.other.pony",
            regex: /\bthis\b/,
          },
          {
            token: "constant.language.pony",
            regex: /\b(?:true|false)\b/,
          },
          {
            token: "constant.numeric.pony",
            regex: /\b(?:0b[0-1_]*|0x[0-9a-fA-F_]*|[0-9][0-9_]*(?:\.[0-9][0-9_]*)?(?:(?:e|E)(?:\+|-)?[0-9_]+)?)\b/,
          },
        ],
        "#methoddeclarations": [
          {
            token: [
              "keyword.declaration.pony",
              "text",
              "keyword.other.capability.pony",
              "text",
              "entity.name.function.pony",
            ],
            regex: /\b(new|be|fun)(\s+)((?:iso|trn|ref|val|box|tag)?)\b(\s*)([_a-z][_a-zA-Z0-9]*)/,
          },
        ],
        "#typedeclarations": [
          {
            token: [
              "keyword.declaration.pony",
              "text",
              "keyword.other.capability.pony",
              "text",
              "entity.name.type.pony",
            ],
            regex: /\b(type|interface|trait|primitive|struct|class|actor)(\s+)((?:iso|trn|ref|val|box|tag)?)(@?\s*)([_A-Z][_a-zA-Z0-9]*)/,
          },
        ],
        "#identifiers": [
          {
            token: ["support.function.pony", "text"],
            regex: /\b([_a-z][_a-zA-Z0-9]*)\b(\(|\[)/,
          },
          {
            token: ["text", "variable.parameter.pony", "text"],
            regex: /(\.\s*)([_a-z][_a-zA-Z0-9]*)\b([^\(\[])/,
          },
          {
            token: ["text", "support.function.pony", "text", "text"],
            regex: /(@\s*)([_a-zA-z][_a-zA-Z0-9]*)(\s*)(\(|\[)/,
          },
          {
            token: "entity.name.class.pony",
            regex: /\b_*[A-Z][_a-zA-Z0-9]*\b/,
          },
          {
            token: "text",
            regex: /\b_*[a-z][_a-zA-Z0-9']*/,
          },
        ],
        "#keywords": [
          {
            token: "keyword.other.intrinsic.pony",
            regex: /\b(?:compile_intrinsic|compile_error)\b/,
          },
          {
            token: "keyword.other.import.pony",
            regex: /\buse\b/,
          },
          {
            token: "keyword.other.declaration.pony",
            regex: /\b(?:var|let|embed|delegate)\b/,
          },
          {
            token: "entity.other.attribute-name.pony",
            regex: /\b(?:iso|trn|ref|val|box|tag)\b/,
          },
          {
            token: "keyword.control.jump.pony",
            regex: /\b(?:break|continue|return|error)\b/,
          },
          {
            token: "keyword.control.pony",
            regex: /\b(?:if|ifdef|then|elseif|else|end|match|where|try|with|as|recover|consume|object|digestof)\b/,
          },
          {
            token: "keyword.control.loop.pony",
            regex: /\b(?:while|do|repeat|until|for|in)\b/,
          },
          {
            token: "text",
            regex: /\-|\+|\*|\/(?![\/*])|%|<<|>>/,
          },
          {
            token: "text",
            regex: /==|!=|<=|>=|<|>/,
          },
          {
            token: "text",
            regex: /\b(?:is|isnt|not|and|or|xor)\b/,
          },
          {
            token: "text",
            regex: /=/,
          },
          {
            token: "text",
            regex: /\?|=>/,
          },
          {
            token: "text",
            regex: /\||\&|\,|\^/,
          },
        ],
        "#line-comments": [
          {
            token: "comment.line.double-slash.pony",
            regex: /\/\//,
            push: [
              {
                token: "comment.line.double-slash.pony",
                regex: /$/,
                next: "pop",
              },
              {
                defaultToken: "comment.line.double-slash.pony",
              },
            ],
          },
        ],
        "#strings": [
          {
            token: "punctuation.definition.character.begin.pony",
            regex: /'/,
            push: [
              {
                token: "punctuation.definition.character.end.pony",
                regex: /'/,
                next: "pop",
              },
              {
                token: "constant.character.escape.pony",
                regex: /\\(?:[abfnrtv\\"0]|x[0-9A-Fa-f]{2})/,
              },
              {
                token: "invalid.illegal.pony",
                regex: /\\./,
              },
              {
                defaultToken: "constant.character.pony",
              },
            ],
          },
          {
            token: "punctuation.definition.string.begin.pony",
            regex: /"""/,
            push: [
              {
                token: "punctuation.definition.string.end.pony",
                regex: /"""(?!")/,
                next: "pop",
              },
              {
                defaultToken: "variable.parameter.pony",
              },
            ],
          },
          {
            token: "punctuation.definition.string.begin.pony",
            regex: /"/,
            push: [
              {
                token: "punctuation.definition.string.end.pony",
                regex: /"/,
                next: "pop",
              },
              {
                token: "constant.string.escape.pony",
                regex: /\\(?:[abfnrtv\\"0]|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{6})/,
              },
              {
                token: "invalid.illegal.pony",
                regex: /\\./,
              },
              {
                defaultToken: "string.quoted.double.pony",
              },
            ],
          },
        ],
      };

      this.normalizeRules();
    };

    PonyHighlightRules.metaData = {
      fileTypes: ["pony"],
      name: "Pony",
      scopeName: "source.pony",
    };

    oop.inherits(PonyHighlightRules, TextHighlightRules);

    exports.PonyHighlightRules = PonyHighlightRules;
  });

  // Ace highlight rules function imported below.
  var HighlightRules = require("pony_highlight_rules").PonyHighlightRules;

  // Ace's Syntax Tokenizer.

  // tokenizing lines longer than this makes editor very slow
  var MAX_TOKEN_COUNT = 1000;
  var Tokenizer = function (rules) {
    this.states = rules;

    this.regExps = {};
    this.matchMappings = {};
    for (var key in this.states) {
      var state = this.states[key];
      var ruleRegExps = [];
      var matchTotal = 0;
      var mapping = (this.matchMappings[key] = { defaultToken: "text" });
      var flag = "g";

      var splitterRurles = [];
      for (var i = 0; i < state.length; i++) {
        var rule = state[i];
        if (rule.defaultToken) mapping.defaultToken = rule.defaultToken;
        if (rule.caseInsensitive) flag = "gi";
        if (rule.regex == null) continue;

        if (rule.regex instanceof RegExp)
          rule.regex = rule.regex.toString().slice(1, -1);

        // Count number of matching groups. 2 extra groups from the full match
        // And the catch-all on the end (used to force a match);
        var adjustedregex = rule.regex;
        var matchcount =
          new RegExp("(?:(" + adjustedregex + ")|(.))").exec("a").length - 2;
        if (Array.isArray(rule.token)) {
          if (rule.token.length == 1 || matchcount == 1) {
            rule.token = rule.token[0];
          } else if (matchcount - 1 != rule.token.length) {
            throw new Error(
              "number of classes and regexp groups in '" +
                rule.token +
                "'\n'" +
                rule.regex +
                "' doesn't match\n" +
                (matchcount - 1) +
                "!=" +
                rule.token.length
            );
          } else {
            rule.tokenArray = rule.token;
            rule.token = null;
            rule.onMatch = this.$arrayTokens;
          }
        } else if (typeof rule.token == "function" && !rule.onMatch) {
          if (matchcount > 1) rule.onMatch = this.$applyToken;
          else rule.onMatch = rule.token;
        }

        if (matchcount > 1) {
          if (/\\\d/.test(rule.regex)) {
            // Replace any backreferences and offset appropriately.
            adjustedregex = rule.regex.replace(/\\([0-9]+)/g, function (
              match,
              digit
            ) {
              return "\\" + (parseInt(digit, 10) + matchTotal + 1);
            });
          } else {
            matchcount = 1;
            adjustedregex = this.removeCapturingGroups(rule.regex);
          }
          if (!rule.splitRegex && typeof rule.token != "string")
            splitterRurles.push(rule); // flag will be known only at the very end
        }

        mapping[matchTotal] = i;
        matchTotal += matchcount;

        ruleRegExps.push(adjustedregex);

        // makes property access faster
        if (!rule.onMatch) rule.onMatch = null;
      }

      splitterRurles.forEach(function (rule) {
        rule.splitRegex = this.createSplitterRegexp(rule.regex, flag);
      }, this);

      this.regExps[key] = new RegExp(
        "(" + ruleRegExps.join(")|(") + ")|($)",
        flag
      );
    }
  };

  (function () {
    this.$setMaxTokenCount = function (m) {
      MAX_TOKEN_COUNT = m | 0;
    };

    (this.$applyToken = function (str) {
      var values = this.splitRegex.exec(str).slice(1);
      var types = this.token.apply(this, values);

      // required for compatibility with old modes
      if (typeof types === "string") return [{ type: types, value: str }];

      var tokens = [];
      for (var i = 0, l = types.length; i < l; i++) {
        if (values[i])
          tokens[tokens.length] = {
            type: types[i],
            value: values[i],
          };
      }
      return tokens;
    }),
      (this.$arrayTokens = function (str) {
        if (!str) return [];
        var values = this.splitRegex.exec(str);
        if (!values) return "text";
        var tokens = [];
        var types = this.tokenArray;
        for (var i = 0, l = types.length; i < l; i++) {
          if (values[i + 1])
            tokens[tokens.length] = {
              type: types[i],
              value: values[i + 1],
            };
        }
        return tokens;
      });

    this.removeCapturingGroups = function (src) {
      var r = src.replace(/\[(?:\\.|[^\]])*?\]|\\.|\(\?[:=!]|(\()/g, function (
        x,
        y
      ) {
        return y ? "(?:" : x;
      });
      return r;
    };

    this.createSplitterRegexp = function (src, flag) {
      if (src.indexOf("(?=") != -1) {
        var stack = 0;
        var inChClass = false;
        var lastCapture = {};
        src.replace(/(\\.)|(\((?:\?[=!])?)|(\))|([\[\]])/g, function (
          m,
          esc,
          parenOpen,
          parenClose,
          square,
          index
        ) {
          if (inChClass) {
            inChClass = square != "]";
          } else if (square) {
            inChClass = true;
          } else if (parenClose) {
            if (stack == lastCapture.stack) {
              lastCapture.end = index + 1;
              lastCapture.stack = -1;
            }
            stack--;
          } else if (parenOpen) {
            stack++;
            if (parenOpen.length != 1) {
              lastCapture.stack = stack;
              lastCapture.start = index;
            }
          }
          return m;
        });

        if (
          lastCapture.end != null &&
          /^\)*$/.test(src.substr(lastCapture.end))
        )
          src =
            src.substring(0, lastCapture.start) + src.substr(lastCapture.end);
      }
      return new RegExp(src, (flag || "").replace("g", ""));
    };

    /**
     * Returns an object containing two properties: `tokens`, which contains all the tokens; and `state`, the current state.
     * @returns {Object}
     **/
    this.getLineTokens = function (line, startState) {
      if (startState && typeof startState != "string") {
        var stack = startState.slice(0);
        startState = stack[0];
      } else var stack = [];

      var currentState = startState || "start";
      var state = this.states[currentState];
      if (!state) {
        currentState = "start";
        state = this.states[currentState];
      }
      var mapping = this.matchMappings[currentState];
      var re = this.regExps[currentState];
      re.lastIndex = 0;

      var match,
        tokens = [];
      var lastIndex = 0;

      var token = { type: null, value: "" };

      while ((match = re.exec(line))) {
        var type = mapping.defaultToken;
        var rule = null;
        var value = match[0];
        var index = re.lastIndex;

        if (index - value.length > lastIndex) {
          var skipped = line.substring(lastIndex, index - value.length);
          if (token.type == type) {
            token.value += skipped;
          } else {
            if (token.type) tokens.push(token);
            token = { type: type, value: skipped };
          }
        }

        for (var i = 0; i < match.length - 2; i++) {
          if (match[i + 1] === undefined) continue;

          rule = state[mapping[i]];

          if (rule.onMatch) type = rule.onMatch(value, currentState, stack);
          else type = rule.token;

          if (rule.next) {
            if (typeof rule.next == "string") currentState = rule.next;
            else currentState = rule.next(currentState, stack);

            state = this.states[currentState];
            if (!state) {
              window.console &&
                console.error &&
                console.error(currentState, "doesn't exist");
              currentState = "start";
              state = this.states[currentState];
            }
            mapping = this.matchMappings[currentState];
            lastIndex = index;
            re = this.regExps[currentState];
            re.lastIndex = index;
          }
          break;
        }

        if (value) {
          if (typeof type == "string") {
            if ((!rule || rule.merge !== false) && token.type === type) {
              token.value += value;
            } else {
              if (token.type) tokens.push(token);
              token = { type: type, value: value };
            }
          } else if (type) {
            if (token.type) tokens.push(token);
            token = { type: null, value: "" };
            for (var i = 0; i < type.length; i++) tokens.push(type[i]);
          }
        }

        if (lastIndex == line.length) break;

        lastIndex = index;

        if (tokens.length > MAX_TOKEN_COUNT) {
          // chrome doens't show contents of text nodes with very long text
          while (lastIndex < line.length) {
            if (token.type) tokens.push(token);
            token = {
              value: line.substring(lastIndex, (lastIndex += 2000)),
              type: "overflow",
            };
          }
          currentState = "start";
          stack = [];
          break;
        }
      }

      if (token.type) tokens.push(token);

      if (stack.length > 1) {
        if (stack[0] !== currentState) stack.unshift(currentState);
      }
      return {
        tokens: tokens,
        state: stack.length ? stack : currentState,
      };
    };
  }.call(Tokenizer.prototype));

  // Token conversion.
  // See <https://github.com/ajaxorg/ace/wiki/Creating-or-Extending-an-Edit-Mode#common-tokens>
  // This is not an exact match nor the best match that can be made.
  var tokenFromAceToken = {
    empty: null,
    text: null,

    // Keyword
    keyword: "keyword",
    control: "keyword",
    operator: "operator",

    // Constants
    constant: "atom",
    numeric: "number",
    character: "atom",
    escape: "atom",

    // Variables
    variable: "variable",
    parameter: "variable-3",
    language: "variable-2", // Python's `self` uses that.

    // Comments
    comment: "comment",
    line: "comment",
    "double-slash": "comment",
    "double-dash": "comment",
    "number-sign": "comment",
    percentage: "comment",
    block: "comment",
    documentation: "comment",

    // String
    string: "string",
    quoted: "string",
    single: "string",
    double: "string",
    triple: "string",
    unquoted: "string",
    interpolated: "string",
    regexp: "string-2",

    meta: "meta",
    literal: "qualifier",
    support: "builtin",

    // Markup
    markup: "tag",
    underline: "link",
    link: "link",
    bold: "strong",
    heading: "header",
    italic: "em",
    list: "variable-2",
    numbered: "variable-2",
    unnumbered: "variable-2",
    quote: "quote",
    raw: "variable-2", // Markdown's raw block uses that.

    // Invalid
    invalid: "error",
    illegal: "invalidchar",
    deprecated: "error",
  };

  // Takes a list of Ace tokens, returns a (string) CodeMirror token.
  var cmTokenFromAceTokens = function (tokens) {
    var token = null;
    for (var i = 0; i < tokens.length; i++) {
      // Find the most specific token.
      if (tokenFromAceToken[tokens[i]] !== undefined) {
        token = tokenFromAceToken[tokens[i]];
      }
    }
    return token;
  };

  // Consume a token from plannedTokens.
  var consumeToken = function (stream, state) {
    var plannedToken = state.plannedTokens.shift();
    if (plannedToken === undefined) {
      return null;
    }
    stream.match(plannedToken.value);
    var tokens = plannedToken.type.split(".");
    return cmTokenFromAceTokens(tokens);
  };

  var matchToken = function (stream, state) {
    // Anormal start: we already have planned tokens to consume.
    if (state.plannedTokens.length > 0) {
      return consumeToken(stream, state);
    }

    // Normal start.
    var currentState = state.current;
    var currentLine = stream.match(/.*$/, false)[0];
    var tokenized = tokenizer.getLineTokens(currentLine, currentState);
    // We got a {tokens, state} object.
    // Each token is a {value, type} object.
    state.plannedTokens = tokenized.tokens;
    state.current = tokenized.state;

    // Consume a token.
    return consumeToken(stream, state);
  };

  // Initialize all state.
  var aceHighlightRules = new HighlightRules();
  var tokenizer = new Tokenizer(aceHighlightRules.$rules);

  return {
    startState: function () {
      return {
        current: "start",
        // List of {value, type}, with type being an Ace token string.
        plannedTokens: [],
      };
    },
    blankLine: function (state) {
      matchToken("", state);
    },
    token: matchToken,
  };
});

CodeMirror.defineMIME("text/x-pony", "pony");

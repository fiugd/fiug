//show-preview
//import * as CodeMirrorModule from '/shared/vendor/codemirror.js';
//import * as modeBundle from '/shared/vendor/codemirror/mode.bundle.js';

import { appendUrls, consoleHelper, htmlToElement, importCSS } from '../.tools/misc.mjs';
import '../shared.styl';
import '/shared/css/codemirror.css';
import '/shared/css/vscode.codemirror.css';
consoleHelper();
//console.log(CodeMirrorModule);
//console.log(CodeMirror);

/*
https://stackoverflow.com/questions/12652769/rendering-html-elements-to-canvas
http://html2canvas.hertzen.com/

https://github.com/alterfan/minimap

https://github.com/microsoft/vscode/blob/master/src/vs/editor/browser/viewParts/minimap/minimapCharRenderer.ts

*/

const deps = [
	"/shared/vendor/codemirror.js",
	"/shared/vendor/codemirror/mode.bundle.js",
	"https://unpkg.com/html2canvas@1.0.0-alpha.12/dist/html2canvas.min.js",
];

const dummyText = (new Array(1000))
	.fill()
	.map(x => 'console.log("Hello, World");')
	.join('\n\n');

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const setupEditor = function(){
	const editorDiv = document.createElement('div');
	editorDiv.id = 'editor-div';
	editorDiv.style.width = "100%";
	editorDiv.style.height = "90vh";
	editorDiv.style.border = "1px solid black";
	document.body.appendChild(editorDiv);

	minimapPlugin();

	const cm = CodeMirror(editorDiv, {
		lineNumbers: true,
		tabSize: 2,
		mode: 'javascript',
		theme: 'vscode-dark',
		value: minimapPlugin.toString(),
		miniMap: true,
		miniMapSide: "right",
		miniMapWidth: 64,
	});
	cm.setSize(null, 1500);
};

const basicElement = function(){
	const basicDiv = document.createElement('div');
	basicDiv.id = 'basic-div';
	basicDiv.style.width = "100%";
	basicDiv.style.height = "400px";
	basicDiv.style.border = "1px solid black";
	basicDiv.style.overflow = "auto";
	basicDiv.style.marginTop = "3em";
	basicDiv.innerText = dummyText;
	document.body.appendChild(basicDiv);
};

const captureHTML = async function(){
	//.CodeMirror
	html2canvas(document.querySelector("#basic-div"))
		.then(canvas => {
			document.body.appendChild(canvas)
		});
};

function minimapPlugin(){
	//console.log(CodeMirror);

// scrollbars
{
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define(["../../lib/codemirror"], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function(CodeMirror) {
	"use strict";

	function Bar(cls, orientation, scroll) {
		this.orientation = orientation;
		this.scroll = scroll;
		this.screen = this.total = this.size = 1;
		this.pos = 0;

		this.node = document.createElement("div");
		this.node.className = cls + "-" + orientation;
		this.inner = this.node.appendChild(document.createElement("div"));

		var self = this;
		CodeMirror.on(this.inner, "mousedown", function(e) {
			if (e.which != 1) return;
			CodeMirror.e_preventDefault(e);
			var axis = self.orientation == "horizontal" ? "pageX" : "pageY";
			var start = e[axis], startpos = self.pos;
			function done() {
				CodeMirror.off(document, "mousemove", move);
				CodeMirror.off(document, "mouseup", done);
			}
			function move(e) {
				if (e.which != 1) return done();
				self.moveTo(startpos + (e[axis] - start) * (self.total / self.size));
			}
			CodeMirror.on(document, "mousemove", move);
			CodeMirror.on(document, "mouseup", done);
		});

		CodeMirror.on(this.node, "click", function(e) {
			CodeMirror.e_preventDefault(e);
			var innerBox = self.inner.getBoundingClientRect(), where;
			if (self.orientation == "horizontal")
				where = e.clientX < innerBox.left ? -1 : e.clientX > innerBox.right ? 1 : 0;
			else
				where = e.clientY < innerBox.top ? -1 : e.clientY > innerBox.bottom ? 1 : 0;
			self.moveTo(self.pos + where * self.screen);
		});

		function onWheel(e) {
			var moved = CodeMirror.wheelEventPixels(e)[self.orientation == "horizontal" ? "x" : "y"];
			var oldPos = self.pos;
			self.moveTo(self.pos + moved);
			if (self.pos != oldPos) CodeMirror.e_preventDefault(e);
		}
		CodeMirror.on(this.node, "mousewheel", onWheel);
		CodeMirror.on(this.node, "DOMMouseScroll", onWheel);
	}

	Bar.prototype.setPos = function(pos, force) {
		if (pos < 0) pos = 0;
		if (pos > this.total - this.screen) pos = this.total - this.screen;
		if (!force && pos == this.pos) return false;
		this.pos = pos;
		this.inner.style[this.orientation == "horizontal" ? "left" : "top"] =
			(pos * (this.size / this.total)) + "px";
		return true
	};

	Bar.prototype.moveTo = function(pos) {
		if (this.setPos(pos)) this.scroll(pos, this.orientation);
	}

	var minButtonSize = 10;

	Bar.prototype.update = function(scrollSize, clientSize, barSize) {
		var sizeChanged = this.screen != clientSize || this.total != scrollSize || this.size != barSize
		if (sizeChanged) {
			this.screen = clientSize;
			this.total = scrollSize;
			this.size = barSize;
		}

		var buttonSize = this.screen * (this.size / this.total);
		if (buttonSize < minButtonSize) {
			this.size -= minButtonSize - buttonSize;
			buttonSize = minButtonSize;
		}
		this.inner.style[this.orientation == "horizontal" ? "width" : "height"] =
			buttonSize + "px";
		this.setPos(this.pos, sizeChanged);
	};

	function SimpleScrollbars(cls, place, scroll) {
		this.addClass = cls;
		this.horiz = new Bar(cls, "horizontal", scroll);
		place(this.horiz.node);
		this.vert = new Bar(cls, "vertical", scroll);
		place(this.vert.node);
		this.width = null;
	}

	SimpleScrollbars.prototype.update = function(measure) {
		if (this.width == null) {
			var style = window.getComputedStyle ? window.getComputedStyle(this.horiz.node) : this.horiz.node.currentStyle;
			if (style) this.width = parseInt(style.height);
		}
		var width = this.width || 0;

		var needsH = measure.scrollWidth > measure.clientWidth + 1;
		var needsV = measure.scrollHeight > measure.clientHeight + 1;
		this.vert.node.style.display = needsV ? "block" : "none";
		this.horiz.node.style.display = needsH ? "block" : "none";

		if (needsV) {
			this.vert.update(measure.scrollHeight, measure.clientHeight,
											 measure.viewHeight - (needsH ? width : 0));
			this.vert.node.style.bottom = needsH ? width + "px" : "0";
		}
		if (needsH) {
			this.horiz.update(measure.scrollWidth, measure.clientWidth,
												measure.viewWidth - (needsV ? width : 0) - measure.barLeft);
			this.horiz.node.style.right = needsV ? width + "px" : "0";
			this.horiz.node.style.left = measure.barLeft + "px";
		}

		return {right: needsV ? width : 0, bottom: needsH ? width : 0};
	};

	SimpleScrollbars.prototype.setScrollTop = function(pos) {
		this.vert.setPos(pos);
	};

	SimpleScrollbars.prototype.setScrollLeft = function(pos) {
		this.horiz.setPos(pos);
	};

	SimpleScrollbars.prototype.clear = function() {
		var parent = this.horiz.node.parentNode;
		parent.removeChild(this.horiz.node);
		parent.removeChild(this.vert.node);
	};

	CodeMirror.scrollbarModel.simple = function(place, scroll) {
		return new SimpleScrollbars("CodeMirror-simplescroll", place, scroll);
	};
	CodeMirror.scrollbarModel.overlay = function(place, scroll) {
		return new SimpleScrollbars("CodeMirror-overlayscroll", place, scroll);
	};
});

}

// addPanel
{
	(function (mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define(["../../lib/codemirror"], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function (CodeMirror) {
		CodeMirror.defineExtension("addPanel", function (node, options) {
			options = options || {};

			if (!this.state.panels) initPanels(this);

			var info = this.state.panels;
			var wrapper = info.wrapper;
			var cmWrapper = this.getWrapperElement();
			var replace = options.replace instanceof Panel && !options.replace.cleared;

			if (options.after instanceof Panel && !options.after.cleared) {
				wrapper.insertBefore(node, options.before.node.nextSibling);
			} else if (options.before instanceof Panel && !options.before.cleared) {
				wrapper.insertBefore(node, options.before.node);
			} else if (replace) {
				wrapper.insertBefore(node, options.replace.node);
				options.replace.clear(true);
			} else if (options.position == "bottom") {
				wrapper.appendChild(node);
			} else if (options.position == "before-bottom") {
				wrapper.insertBefore(node, cmWrapper.nextSibling);
			} else if (options.position == "after-top") {
				wrapper.insertBefore(node, cmWrapper);
			} else {
				wrapper.insertBefore(node, wrapper.firstChild);
			}

			var height = (options && options.height) || node.offsetHeight;

			var panel = new Panel(this, node, options, height);
			info.panels.push(panel);

			this.setSize();
			if (options.stable && isAtTop(this, node))
				this.scrollTo(null, this.getScrollInfo().top + height);

			return panel;
		});

		function Panel(cm, node, options, height) {
			this.cm = cm;
			this.node = node;
			this.options = options;
			this.height = height;
			this.cleared = false;
		}

		/* when skipRemove is true, clear() was called from addPanel().
		 * Thus removePanels() should not be called (issue 5518) */
		Panel.prototype.clear = function (skipRemove) {
			if (this.cleared) return;
			this.cleared = true;
			var info = this.cm.state.panels;
			info.panels.splice(info.panels.indexOf(this), 1);
			this.cm.setSize();
			if (this.options.stable && isAtTop(this.cm, this.node))
				this.cm.scrollTo(null, this.cm.getScrollInfo().top - this.height)
			info.wrapper.removeChild(this.node);
			if (info.panels.length == 0 && !skipRemove) removePanels(this.cm);
		};

		Panel.prototype.changed = function () {
			this.height = this.node.getBoundingClientRect().height;
			this.cm.setSize();
		};

		function initPanels(cm) {
			var wrap = cm.getWrapperElement();
			var style = window.getComputedStyle ? window.getComputedStyle(wrap) : wrap.currentStyle;
			var height = parseInt(style.height);
			var info = cm.state.panels = {
				setHeight: wrap.style.height,
				panels: [],
				wrapper: document.createElement("div")
			};
			wrap.parentNode.insertBefore(info.wrapper, wrap);
			var hasFocus = cm.hasFocus();
			info.wrapper.appendChild(wrap);
			if (hasFocus) cm.focus();

			cm._setSize = cm.setSize;
			if (height != null) cm.setSize = function (width, newHeight) {
				if (!newHeight) newHeight = info.wrapper.offsetHeight;
				info.setHeight = newHeight;
				if (typeof newHeight != "number") {
					var px = /^(\d+\.?\d*)px$/.exec(newHeight);
					if (px) {
						newHeight = Number(px[1]);
					} else {
						info.wrapper.style.height = newHeight;
						newHeight = info.wrapper.offsetHeight;
					}
				}
				var editorheight = newHeight - info.panels
					.map(function (p) { return p.node.getBoundingClientRect().height; })
					.reduce(function (a, b) { return a + b; }, 0);
				cm._setSize(width, editorheight);
				height = newHeight;
			};
		}

		function removePanels(cm) {
			var info = cm.state.panels;
			cm.state.panels = null;

			var wrap = cm.getWrapperElement();
			info.wrapper.parentNode.replaceChild(wrap, info.wrapper);
			wrap.style.height = info.setHeight;
			cm.setSize = cm._setSize;
			cm.setSize();
		}

		function isAtTop(cm, dom) {
			for (var sibling = dom.nextSibling; sibling; sibling = sibling.nextSibling)
				if (sibling == cm.getWrapperElement()) return true
			return false
		}
	});
}

	const tokenlist = ["#text", "#space", "comment", "string", "string-2", "number", "variable", "variable-2",
			"def", "operator", "keyword", "atom", "meta", "tag", "tag bracket", "attribute", "qualifier", "property", "builtin", "variable-3", "type", "string property", "tab"
	];

	const viewboxStyle = {
			position: "absolute",
			cursor: "pointer",
			zIndex: "1",
			background: "rgba(255,255,255,0.15)",
			transition: "background-color 300ms ease-in-out, opacity 300ms ease-in-out",
	}

	var cache = new class {
			constructor() {
					this.buffer = {};
			}
			get getAll() {
					this.buffer = this.buffer || {}
					return this.buffer;
			}
			get(property) {
					const _property = this.buffer[property];
					return _property
			};
			set(property, data) {
					let oldVal = this.buffer[property];
					if (oldVal != data) {
							this.buffer[property] = data;
					}
					return data
			};
	}

	class Drawer {
			constructor(context) {
					this.context = context;
			}
			get maxRow() {
					const h = cache.miniMapHeight;
					const maxlines = Math.ceil(h / 3);
					return maxlines;
			}
			get lineHeight() {
					return 3;
			}
			get SyntaxColor() {
					return cache.get("syntaxColorsTokens");
			}
			clear(startY, endY) {



					startY = startY ? startY * 3 : 0
					endY = endY ? endY * 3 : this.maxRow;

					this.context.save();
					this.context.clearRect(0, startY, cache.miniMapWidth, this.maxRow * 3);
					this.context.restore();
			}
			draw(from, to, e) {
					var curent, y, end;
					if (e)
							curent = e.type == "scroll" ? 0 : from;
					this.clear(0, to - from);

					y = 1;
					curent = from ? from : 0;
					end = to ? to : cache.lineCount;
					for (curent; curent < end; curent++) {
							const tokens = this.lineTokens[curent];
							if (tokens == undefined) return
							this.drawLine(y, tokens);
							y = y + 3
					}
			}
			get lineTokens() {
					return cache.lineTokens;
			}
			drawLine(y, lineTokens, event) {
					var tokenArr, token, i, n;
					this.posX = 1;
					this.posY = y;
					for (i = 0; i < lineTokens.length; i++) {
							token = lineTokens[i];
							if (token.type == null) {
									tokenArr = token.string.split(/(\s+)/).filter(x => x);
									for (n = 0; n < tokenArr.length; n++) {
											token = {};
											token.string = tokenArr[n];
											token.type = "#text";
											if (/[\s]/.test(token.string)) token.type = "#space";
											this.drawToken(token);
									}
							} else {
									this.drawToken(token);
							}
					}
			}
			drawToken(token) {
					let charHeight = 2
					let charWidth = 2
					var width, color = this.SyntaxColor[token.type];
					width = charWidth * token.string.length;
					this.drawRect(color, this.posX, this.posY, width, charHeight);
					this.posX = this.posX + width;
			}
			drawRect(color, x, y, width, height) {
					this.context.fillStyle = color;
					this.context.fillRect(x, y, width, height)
			}
			//drawText(color, text, x, y) {
			//    this.context.fillStyle = color;
			//    this.context.fillText(text, x, y);
			//}
	};

	class ViewBoxElement {
			constructor(parent) {
					this.node = document.createElement('div');
					this.attach(parent);
					this.applyStyle(viewboxStyle);
			}
			move(scrollPos) {
					scrollPos = Math.round(scrollPos)
					this.node.style.transform = "translateY(" + (scrollPos) + "px)";
			}
			hide() {
					this.node.style.opacity = 0
			}
			show() {
					this.node.style.opacity = 1
			}
			applyStyle(cssObject) {
					for (var prop in cssObject) {
							this.node.style[prop] = cssObject[prop]
					}
			}
			resize(visibleLines, width) {
					const height = visibleLines * 3;
					if (width != this.width) this.node.style.width = width + "px";
					if (height != this.height) this.node.style.height = height + "px";
					this.height = height;
					this.width = width;

			}
			attach(parent) {
					parent.appendChild(this.node);
			}
	}

	class CanvasElement {
			constructor(parent) {
					this.initCanvasLayer();
					this.attachCanvasLayers(parent);
			}
			initCanvasLayer() {
					this.node = document.createElement('canvas');
					this.node.className = "front-layer";
					this.node.style.zIndex = "0";
					this.frontCTX = this.node.getContext('2d');
			}
			attachCanvasLayers(parent) {
					parent.appendChild(this.node)
			}
			resize(height, width) {
					if (width != this.node.width) this.node.width = width;
					if (height != this.node.height) this.node.height = height;
			}
	};

	class MiniMapElement {
			constructor(cm) {
					this.cm = undefined;
					this.width = undefined;
					this.height = undefined;
					this.attached = false;
					this.cm = cm;
					this.node = document.createElement('div');
					this.cm.addPanel(this.node);
			}
			resize(height, width) {
					if (width != this.width) this.node.style.width = width + "px";
					if (height != this.height) this.node.style.height = height + "px";
					this.width = width;
					this.height = height;

			}
			setBackground(bg) {
					this.node.style.backgroundColor = bg;
			}
			setSide(side) {
					this.node.style.float = side;
			}
	}

	class MiniMap {
			constructor(cm) {
					this.cm = cm; //The width of the current Minimap.
					this.changed = false;
					this.lineTokens = {};
					this.minimap = new MiniMapElement(this.cm);
					this.viewbox = new ViewBoxElement(this.minimap.node);
					this.canvas = new CanvasElement(this.minimap.node);
					this.drawer = new Drawer(this.canvas.frontCTX);
					this.Binding();
					this.refresh();
			}
			get node() {
					return this.cm.getWrapperElement();
			}
			get lineCount() {
					return cache.set("lineCount", this.cm.lineCount());
			}
			get lineHeight() {
					return cache.set("lineHeight", this.cm.display.maxLine.height);
			}
			get firstVisibleLine() {
					return Math.floor(this.scrollbar.top / this.lineHeight);
			}
			get scrollbar() {
					return this.cm.getScrollInfo();
			}
			get maxVisibleLineRange() {
					return Math.ceil(this.node.offsetHeight / this.lineHeight);
			}
			get maxVisibleRows() {
					return Math.round(this.node.offsetHeight / 3);
			}
			get viewboxScrollRatio() {
					const viewScrollHeight = cache.lineCount - this.maxVisibleRows + 1;
					const editorScrollHeight = cache.lineCount - this.maxVisibleLineRange + 1;
					return viewScrollHeight / editorScrollHeight;
			}
			get minimapScrollRatio() {
					const mapScrollHeight = cache.lineCount - this.maxVisibleRows + 1;
					const editorScrollHeight = cache.lineCount - this.maxVisibleLineRange + 1;
					return mapScrollHeight / editorScrollHeight;
			}
			get scrollRatio() {
					return this.cm.getScrollInfo().clientHeight / this.cm.getScrollInfo().height;
			}
			get getInfo() {
					return {
							top: Math.ceil(this.firstVisibleLine * this.minimapScrollRatio),
							total: Math.ceil(cache.miniMapHeight / 3),
							pos: this.scrollbar.top * (this.getVieboxScrollHeight - this.viewbox.height) / (this.scrollbar.height - cache.miniMapHeight),
					};
			}
			get getVieboxPos() {
					return cache.VieboxPos = this.viewbox.node.getBoundingClientRect();
			}

			get getMinimapPos() {
					return cache.MinimapPos = this.minimap.node.getBoundingClientRect();
			}
			get getVieboxScrollHeight() {
					const totalHeight = (this.lineCount * 3);
					return totalHeight < cache.miniMapHeight ? totalHeight : cache.miniMapHeight
			}
			updateSyntaxColors() {
					syntax(this);
			}
			updateSize() {
					cache.editorOffsetWidth = cache.editorOffsetWidth = this.node.offsetWidth;
					cache.miniMapHeight = this.miniMapHeight = this.node.offsetHeight;
					cache.miniMapWidth = this.cm.getOption("miniMapWidth");
					this.minimap.resize(cache.miniMapHeight, cache.miniMapWidth);
					this.viewbox.resize(this.maxVisibleLineRange, cache.miniMapWidth);
					this.canvas.resize(cache.miniMapHeight, cache.miniMapWidth);
			}
			Resize() {
					const n = this.node;
					n.style.maxWidth = n.offsetParent.offsetWidth + "px";
					n.parentNode.style.width = n.offsetParent.offsetWidth + "px";
					n.style.width = (n.parentNode.offsetWidth - cache.miniMapWidth) + "px";
			}
			Binding() {
					if (this.side) this.side = this.cm.getOption("miniMapSide") === "left" ? "right" : "left";
					else this.side = this.cm.getOption("miniMapSide");
					this.cm.setOption("miniMapSide", this.side);
					this.minimap.setSide(this.side);
			}
			Scroll(e) {
					this.viewbox.move(this.getInfo.pos);
					if (this.lineCount * 3 < cache.miniMapHeight) return
					this.drawer.draw(this.getInfo.top, this.getInfo.top + this.getInfo.total, e);
			}
			Drag(e) {
					if (e.which !== 1 && e.which !== 2 && !(e.touches != null)) return;
					if (e.touches) {
							e = eTouch(e);
					}
					const mapOffset = this.getMinimapPos.top;
					const vieboxOffset = e.clientY - this.getVieboxPos.top;
					var dragging = e => {
							if (e.touches) {
									e.preventDefault();
									e = e.touches[0];
							}
							var y = (e.clientY - mapOffset - vieboxOffset) / this.scrollRatio;
							this.cm.scrollTo(null, y);
					};
					var done = () => offDrag();
					var offDrag = () => removeListener(dragging, done);
					addListener(dragging, done);
			}


			ScrollTo(e) {
					const mapOffset = this.getMinimapPos.top;
					const vieboxOffset = this.getVieboxPos.top;
					if (e.touches) {
							e = eTouch(e);
					}
					var y = (e.clientY - mapOffset - this.viewbox.height / 2) / this.scrollRatio;
					this.cm.scrollTo(null, y);
			}
			updateTextLines(from, to) {
					let lineTokens = {},
							number = from || 0,
							lineCount = to || cache.set("lineCount", this.cm.lineCount());
					this.textLines = this.cm.getValue().split("\n");
					for (number; number < lineCount; number++) {
							lineTokens[number] = this.cm.getLineTokens(number);
					}
					cache.lineTokens = lineTokens;
					cache.lineCount = lineCount;
			}
			updateBg() {
					this.minimap.setBackground(getComputedStyle(this.cm.getWrapperElement())["background-color"]);
			}
			BeforeChange(change) {
					var from = this.cm.getRange({
							line: 0,
							ch: 0
					}, change.from).split("\n");
					var text = this.cm.getRange(change.from, change.to);
					var after = this.cm.getRange(change.to, {
							line: this.cm.lineCount() + 1,
							ch: 0
					}).split("\n");
					this.from = change.from.line;
					this.to = after.length;
			}
			Change() {
					this.updateTextLines();
					this.updateSize();
					cache.textLines = this.textLines;
					const total = Math.ceil(cache.miniMapHeight / 3);
					this.top = Math.ceil(this.firstVisibleLine * this.minimapScrollRatio);
					this.drawer.draw(this.top, this.from + total);
			}
			refresh() {
					this.updateBg();
					this.updateTextLines();
					this.updateSize();
					this.Resize();
					this.updateSyntaxColors();
					this.drawer.draw(0, this.lineCount);
			}
	}

	function eTouch(e) {
			e.preventDefault();
			e = e.touches[0];
			return e;
	}

	function colorize(color) {
			color = color.replace('rgb(', 'rgba(').replace(')', `, .55)`);
			return color;
	}

	function removeListener(mousemoveHandler, mouseupHandler) {
			document.body.removeEventListener('mousemove', mousemoveHandler);
			document.body.removeEventListener('mouseup', mouseupHandler);
			document.body.removeEventListener('touchmove', mousemoveHandler);
			document.body.removeEventListener('touchend', mouseupHandler);
	}

	function addListener(mousemoveHandler, mouseupHandler) {
			document.body.addEventListener('mousemove', mousemoveHandler);
			document.body.addEventListener('mouseup', mouseupHandler);
			document.body.addEventListener('touchmove', mousemoveHandler);
			document.body.addEventListener('touchend', mouseupHandler);
	}

	function syntax(context) {
			context.syntaxColorsTokens = {};
			for (var i = 0, len = tokenlist.length; i < len; i++) {
					var key = tokenlist[i];
					if (key == "#text") {
							context.syntaxColorsTokens[key] = colorize("rgba(255,255,255)");
					} else if (key == "#space") {
							context.syntaxColorsTokens[key] = "rgba(0,0,0,0)";
					} else {
							const span = document.createElement("span");
							span.className = "cm-" + key.replace(" ", " cm-");
							span.innerText = span;
							context.node.appendChild(span);
							context.syntaxColorsTokens[key] = colorize(getComputedStyle(span)["color"]);
							span.remove();
					}
			}
			cache.set("syntaxColorsTokens", context.syntaxColorsTokens);
	}

	(() => {
			CodeMirror.defineOption("miniMapWidth", 64);
			CodeMirror.defineOption("miniMapSide", "left");
			CodeMirror.defineOption("miniMap", false, function(cm, val, old) {
					if (old && old != CodeMirror.Init) {
							return;
					}
					if (old == CodeMirror.Init) old = false;
					if (!old == !val) {
							return;
					}
					if (val) {
							var mm = new MiniMap(cm);
							mm.refresh();
							var node = mm.minimap.node,
									view = mm.viewbox.node;
							cm.on("change", (cm, change, e) => {
									mm.BeforeChange(change);
									mm.Change(e)
						});
						cm.on("inputRead", (cm, change, e) => {
									mm.BeforeChange(change);
									mm.Change(e)
							});
							CodeMirror.on(mm.cm.getScrollerElement(), "scroll", (e) => {
									mm.Scroll(e);
							});
							CodeMirror.on(node, "dblclick", () => {
									mm.Binding()
							});
							CodeMirror.on(view, "mousedown", (e) => {
									mm.Drag(e)
							});
							CodeMirror.on(mm.canvas.node, "mousedown", (e) => {
									mm.ScrollTo(e)
							});
							CodeMirror.on(view, "touchstart", (e) => {
									mm.Drag(e)
							});
							window.onresize = (e) => {
									mm.Resize(e)
							};
					}
			});
	})()
}

(async () => {
	await appendUrls(deps);
	const editorDiv = setupEditor();
	//basicElement();
	//await delay(3000);
	//captureHTML();
})();

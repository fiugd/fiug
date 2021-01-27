var exports = {},
    _dewExec = false;

var _global = typeof self !== "undefined" ? self : global;

export function dew() {
  if (_dewExec) return exports;
  _dewExec = true;

  /*! split-grid - v1.0.9 */
  (function (global, factory) {
    typeof exports === 'object' && true ? exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.Split = factory();
  })(exports, function () {
    'use strict';

    var numeric = function (value, unit) {
      return Number(value.slice(0, -1 * unit.length));
    };

    var parseValue = function (value) {
      if (value.endsWith('px')) {
        return {
          value: value,
          type: 'px',
          numeric: numeric(value, 'px')
        };
      }

      if (value.endsWith('fr')) {
        return {
          value: value,
          type: 'fr',
          numeric: numeric(value, 'fr')
        };
      }

      if (value.endsWith('%')) {
        return {
          value: value,
          type: '%',
          numeric: numeric(value, '%')
        };
      }

      if (value === 'auto') {
        return {
          value: value,
          type: 'auto'
        };
      }

      return null;
    };

    var parse = function (rule) {
      return rule.split(' ').map(parseValue);
    };

    var getSizeAtTrack = function (index, tracks, gap, end) {
      if (gap === void 0) {
        gap = 0;
      }

      if (end === void 0) {
        end = false;
      }

      var newIndex = end ? index + 1 : index;
      var trackSum = tracks.slice(0, newIndex).reduce(function (accum, value) {
        return accum + value.numeric;
      }, 0);
      var gapSum = gap ? index * gap : 0;
      return trackSum + gapSum;
    };

    var getStyles = function (rule, ownRules, matchedRules) {
      return ownRules.concat(matchedRules).map(function (r) {
        return r.style[rule];
      }).filter(function (style) {
        return style !== undefined && style !== '';
      });
    };

    var getGapValue = function (unit, size) {
      if (size.endsWith(unit)) {
        return Number(size.slice(0, -1 * unit.length));
      }

      return null;
    };

    var firstNonZero = function (tracks) {
      // eslint-disable-next-line no-plusplus
      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].numeric > 0) {
          return i;
        }
      }

      return null;
    };

    function getMatchedCSSRules(el) {
      var ref;
      return (ref = []).concat.apply(ref, Array.from(el.ownerDocument.styleSheets).map(function (s) {
        var rules = [];

        try {
          rules = Array.from(s.cssRules || []);
        } catch (e) {// Ignore results on security error
        }

        return rules;
      })).filter(function (r) {
        var matches = false;

        try {
          matches = el.matches(r.selectorText);
        } catch (e) {// Ignore matching erros
        }

        return matches;
      });
    }

    var gridTemplatePropColumns = 'grid-template-columns';
    var gridTemplatePropRows = 'grid-template-rows';

    var NOOP = function () {
      return false;
    };

    var defaultWriteStyle = function (element, gridTemplateProp, style) {
      // eslint-disable-next-line no-param-reassign
      element.style[gridTemplateProp] = style;
    };

    var getOption = function (options, propName, def) {
      var value = options[propName];

      if (value !== undefined) {
        return value;
      }

      return def;
    };

    var Gutter = function Gutter(direction, options, parentOptions) {
      (this || _global).direction = direction;
      (this || _global).element = options.element;
      (this || _global).track = options.track;
      (this || _global).trackTypes = {};

      if (direction === 'column') {
        (this || _global).gridTemplateProp = gridTemplatePropColumns;
        (this || _global).gridGapProp = 'grid-column-gap';
        (this || _global).cursor = getOption(parentOptions, 'columnCursor', getOption(parentOptions, 'cursor', 'col-resize'));
        (this || _global).snapOffset = getOption(parentOptions, 'columnSnapOffset', getOption(parentOptions, 'snapOffset', 30));
        (this || _global).dragInterval = getOption(parentOptions, 'columnDragInterval', getOption(parentOptions, 'dragInterval', 1));
        (this || _global).clientAxis = 'clientX';
        (this || _global).optionStyle = getOption(parentOptions, 'gridTemplateColumns');
      } else if (direction === 'row') {
        (this || _global).gridTemplateProp = gridTemplatePropRows;
        (this || _global).gridGapProp = 'grid-row-gap';
        (this || _global).cursor = getOption(parentOptions, 'rowCursor', getOption(parentOptions, 'cursor', 'row-resize'));
        (this || _global).snapOffset = getOption(parentOptions, 'rowSnapOffset', getOption(parentOptions, 'snapOffset', 30));
        (this || _global).dragInterval = getOption(parentOptions, 'rowDragInterval', getOption(parentOptions, 'dragInterval', 1));
        (this || _global).clientAxis = 'clientY';
        (this || _global).optionStyle = getOption(parentOptions, 'gridTemplateRows');
      }

      (this || _global).onDragStart = getOption(parentOptions, 'onDragStart', NOOP);
      (this || _global).onDragEnd = getOption(parentOptions, 'onDragEnd', NOOP);
      (this || _global).onDrag = getOption(parentOptions, 'onDrag', NOOP);
      (this || _global).writeStyle = getOption(parentOptions, 'writeStyle', defaultWriteStyle);
      (this || _global).startDragging = (this || _global).startDragging.bind(this || _global);
      (this || _global).stopDragging = (this || _global).stopDragging.bind(this || _global);
      (this || _global).drag = (this || _global).drag.bind(this || _global);
      (this || _global).minSizeStart = options.minSizeStart;
      (this || _global).minSizeEnd = options.minSizeEnd;

      if (options.element) {
        (this || _global).element.addEventListener('mousedown', (this || _global).startDragging);

        (this || _global).element.addEventListener('touchstart', (this || _global).startDragging);
      }
    };

    Gutter.prototype.getDimensions = function getDimensions() {
      var ref = (this || _global).grid.getBoundingClientRect();

      var width = ref.width;
      var height = ref.height;
      var top = ref.top;
      var bottom = ref.bottom;
      var left = ref.left;
      var right = ref.right;

      if ((this || _global).direction === 'column') {
        (this || _global).start = top;
        (this || _global).end = bottom;
        (this || _global).size = height;
      } else if ((this || _global).direction === 'row') {
        (this || _global).start = left;
        (this || _global).end = right;
        (this || _global).size = width;
      }
    };

    Gutter.prototype.getSizeAtTrack = function getSizeAtTrack$1(track, end) {
      return getSizeAtTrack(track, (this || _global).computedPixels, (this || _global).computedGapPixels, end);
    };

    Gutter.prototype.getSizeOfTrack = function getSizeOfTrack(track) {
      return (this || _global).computedPixels[track].numeric;
    };

    Gutter.prototype.getRawTracks = function getRawTracks() {
      var tracks = getStyles((this || _global).gridTemplateProp, [(this || _global).grid], getMatchedCSSRules((this || _global).grid));

      if (!tracks.length) {
        if ((this || _global).optionStyle) {
          return (this || _global).optionStyle;
        }

        throw Error('Unable to determine grid template tracks from styles.');
      }

      return tracks[0];
    };

    Gutter.prototype.getGap = function getGap() {
      var gap = getStyles((this || _global).gridGapProp, [(this || _global).grid], getMatchedCSSRules((this || _global).grid));

      if (!gap.length) {
        return null;
      }

      return gap[0];
    };

    Gutter.prototype.getRawComputedTracks = function getRawComputedTracks() {
      return window.getComputedStyle((this || _global).grid)[(this || _global).gridTemplateProp];
    };

    Gutter.prototype.getRawComputedGap = function getRawComputedGap() {
      return window.getComputedStyle((this || _global).grid)[(this || _global).gridGapProp];
    };

    Gutter.prototype.setTracks = function setTracks(raw) {
      (this || _global).tracks = raw.split(' ');
      (this || _global).trackValues = parse(raw);
    };

    Gutter.prototype.setComputedTracks = function setComputedTracks(raw) {
      (this || _global).computedTracks = raw.split(' ');
      (this || _global).computedPixels = parse(raw);
    };

    Gutter.prototype.setGap = function setGap(raw) {
      (this || _global).gap = raw;
    };

    Gutter.prototype.setComputedGap = function setComputedGap(raw) {
      (this || _global).computedGap = raw;
      (this || _global).computedGapPixels = getGapValue('px', (this || _global).computedGap) || 0;
    };

    Gutter.prototype.getMousePosition = function getMousePosition(e) {
      if ('touches' in e) {
        return e.touches[0][(this || _global).clientAxis];
      }

      return e[(this || _global).clientAxis];
    };

    Gutter.prototype.startDragging = function startDragging(e) {
      if ('button' in e && e.button !== 0) {
        return;
      } // Don't actually drag the element. We emulate that in the drag function.


      e.preventDefault();

      if ((this || _global).element) {
        (this || _global).grid = (this || _global).element.parentNode;
      } else {
        (this || _global).grid = e.target.parentNode;
      }

      this.getDimensions();
      this.setTracks(this.getRawTracks());
      this.setComputedTracks(this.getRawComputedTracks());
      this.setGap(this.getGap());
      this.setComputedGap(this.getRawComputedGap());

      var trackPercentage = (this || _global).trackValues.filter(function (track) {
        return track.type === '%';
      });

      var trackFr = (this || _global).trackValues.filter(function (track) {
        return track.type === 'fr';
      });

      (this || _global).totalFrs = trackFr.length;

      if ((this || _global).totalFrs) {
        var track = firstNonZero(trackFr);

        if (track !== null) {
          (this || _global).frToPixels = (this || _global).computedPixels[track].numeric / trackFr[track].numeric;
        }
      }

      if (trackPercentage.length) {
        var track$1 = firstNonZero(trackPercentage);

        if (track$1 !== null) {
          (this || _global).percentageToPixels = (this || _global).computedPixels[track$1].numeric / trackPercentage[track$1].numeric;
        }
      } // get start of gutter track


      var gutterStart = this.getSizeAtTrack((this || _global).track, false) + (this || _global).start;

      (this || _global).dragStartOffset = this.getMousePosition(e) - gutterStart;
      (this || _global).aTrack = (this || _global).track - 1;

      if ((this || _global).track < (this || _global).tracks.length - 1) {
        (this || _global).bTrack = (this || _global).track + 1;
      } else {
        throw Error("Invalid track index: " + (this || _global).track + ". Track must be between two other tracks and only " + (this || _global).tracks.length + " tracks were found.");
      }

      (this || _global).aTrackStart = this.getSizeAtTrack((this || _global).aTrack, false) + (this || _global).start;
      (this || _global).bTrackEnd = this.getSizeAtTrack((this || _global).bTrack, true) + (this || _global).start; // Set the dragging property of the pair object.

      (this || _global).dragging = true; // All the binding. `window` gets the stop events in case we drag out of the elements.

      window.addEventListener('mouseup', (this || _global).stopDragging);
      window.addEventListener('touchend', (this || _global).stopDragging);
      window.addEventListener('touchcancel', (this || _global).stopDragging);
      window.addEventListener('mousemove', (this || _global).drag);
      window.addEventListener('touchmove', (this || _global).drag); // Disable selection. Disable!

      (this || _global).grid.addEventListener('selectstart', NOOP);

      (this || _global).grid.addEventListener('dragstart', NOOP);

      (this || _global).grid.style.userSelect = 'none';
      (this || _global).grid.style.webkitUserSelect = 'none';
      (this || _global).grid.style.MozUserSelect = 'none';
      (this || _global).grid.style.pointerEvents = 'none'; // Set the cursor at multiple levels

      (this || _global).grid.style.cursor = (this || _global).cursor;
      window.document.body.style.cursor = (this || _global).cursor;
      this.onDragStart((this || _global).direction, (this || _global).track);
    };

    Gutter.prototype.stopDragging = function stopDragging() {
      (this || _global).dragging = false; // Remove the stored event listeners. This is why we store them.

      this.cleanup();
      this.onDragEnd((this || _global).direction, (this || _global).track);

      if ((this || _global).needsDestroy) {
        if ((this || _global).element) {
          (this || _global).element.removeEventListener('mousedown', (this || _global).startDragging);

          (this || _global).element.removeEventListener('touchstart', (this || _global).startDragging);
        }

        this.destroyCb();
        (this || _global).needsDestroy = false;
        (this || _global).destroyCb = null;
      }
    };

    Gutter.prototype.drag = function drag(e) {
      var mousePosition = this.getMousePosition(e);
      var gutterSize = this.getSizeOfTrack((this || _global).track);
      var minMousePosition = (this || _global).aTrackStart + (this || _global).minSizeStart + (this || _global).dragStartOffset + (this || _global).computedGapPixels;
      var maxMousePosition = (this || _global).bTrackEnd - (this || _global).minSizeEnd - (this || _global).computedGapPixels - (gutterSize - (this || _global).dragStartOffset);
      var minMousePositionOffset = minMousePosition + (this || _global).snapOffset;
      var maxMousePositionOffset = maxMousePosition - (this || _global).snapOffset;

      if (mousePosition < minMousePositionOffset) {
        mousePosition = minMousePosition;
      }

      if (mousePosition > maxMousePositionOffset) {
        mousePosition = maxMousePosition;
      }

      if (mousePosition < minMousePosition) {
        mousePosition = minMousePosition;
      } else if (mousePosition > maxMousePosition) {
        mousePosition = maxMousePosition;
      }

      var aTrackSize = mousePosition - (this || _global).aTrackStart - (this || _global).dragStartOffset - (this || _global).computedGapPixels;
      var bTrackSize = (this || _global).bTrackEnd - mousePosition + (this || _global).dragStartOffset - gutterSize - (this || _global).computedGapPixels;

      if ((this || _global).dragInterval > 1) {
        var aTrackSizeIntervaled = Math.round(aTrackSize / (this || _global).dragInterval) * (this || _global).dragInterval;

        bTrackSize -= aTrackSizeIntervaled - aTrackSize;
        aTrackSize = aTrackSizeIntervaled;
      }

      if (aTrackSize < (this || _global).minSizeStart) {
        aTrackSize = (this || _global).minSizeStart;
      }

      if (bTrackSize < (this || _global).minSizeEnd) {
        bTrackSize = (this || _global).minSizeEnd;
      }

      if ((this || _global).trackValues[(this || _global).aTrack].type === 'px') {
        (this || _global).tracks[(this || _global).aTrack] = aTrackSize + "px";
      } else if ((this || _global).trackValues[(this || _global).aTrack].type === 'fr') {
        if ((this || _global).totalFrs === 1) {
          (this || _global).tracks[(this || _global).aTrack] = '1fr';
        } else {
          var targetFr = aTrackSize / (this || _global).frToPixels;
          (this || _global).tracks[(this || _global).aTrack] = targetFr + "fr";
        }
      } else if ((this || _global).trackValues[(this || _global).aTrack].type === '%') {
        var targetPercentage = aTrackSize / (this || _global).percentageToPixels;
        (this || _global).tracks[(this || _global).aTrack] = targetPercentage + "%";
      }

      if ((this || _global).trackValues[(this || _global).bTrack].type === 'px') {
        (this || _global).tracks[(this || _global).bTrack] = bTrackSize + "px";
      } else if ((this || _global).trackValues[(this || _global).bTrack].type === 'fr') {
        if ((this || _global).totalFrs === 1) {
          (this || _global).tracks[(this || _global).bTrack] = '1fr';
        } else {
          var targetFr$1 = bTrackSize / (this || _global).frToPixels;
          (this || _global).tracks[(this || _global).bTrack] = targetFr$1 + "fr";
        }
      } else if ((this || _global).trackValues[(this || _global).bTrack].type === '%') {
        var targetPercentage$1 = bTrackSize / (this || _global).percentageToPixels;
        (this || _global).tracks[(this || _global).bTrack] = targetPercentage$1 + "%";
      }

      var style = (this || _global).tracks.join(' ');

      this.writeStyle((this || _global).grid, (this || _global).gridTemplateProp, style);
      this.onDrag((this || _global).direction, (this || _global).track, style);
    };

    Gutter.prototype.cleanup = function cleanup() {
      window.removeEventListener('mouseup', (this || _global).stopDragging);
      window.removeEventListener('touchend', (this || _global).stopDragging);
      window.removeEventListener('touchcancel', (this || _global).stopDragging);
      window.removeEventListener('mousemove', (this || _global).drag);
      window.removeEventListener('touchmove', (this || _global).drag);

      if ((this || _global).grid) {
        (this || _global).grid.removeEventListener('selectstart', NOOP);

        (this || _global).grid.removeEventListener('dragstart', NOOP);

        (this || _global).grid.style.userSelect = '';
        (this || _global).grid.style.webkitUserSelect = '';
        (this || _global).grid.style.MozUserSelect = '';
        (this || _global).grid.style.pointerEvents = '';
        (this || _global).grid.style.cursor = '';
      }

      window.document.body.style.cursor = '';
    };

    Gutter.prototype.destroy = function destroy(immediate, cb) {
      if (immediate === void 0) immediate = true;

      if (immediate || (this || _global).dragging === false) {
        this.cleanup();

        if ((this || _global).element) {
          (this || _global).element.removeEventListener('mousedown', (this || _global).startDragging);

          (this || _global).element.removeEventListener('touchstart', (this || _global).startDragging);
        }

        if (cb) {
          cb();
        }
      } else {
        (this || _global).needsDestroy = true;

        if (cb) {
          (this || _global).destroyCb = cb;
        }
      }
    };

    var getTrackOption = function (options, track, defaultValue) {
      if (track in options) {
        return options[track];
      }

      return defaultValue;
    };

    var createGutter = function (direction, options) {
      return function (gutterOptions) {
        if (gutterOptions.track < 1) {
          throw Error("Invalid track index: " + gutterOptions.track + ". Track must be between two other tracks.");
        }

        var trackMinSizes = direction === 'column' ? options.columnMinSizes || {} : options.rowMinSizes || {};
        var trackMinSize = direction === 'column' ? 'columnMinSize' : 'rowMinSize';
        return new Gutter(direction, Object.assign({}, {
          minSizeStart: getTrackOption(trackMinSizes, gutterOptions.track - 1, getOption(options, trackMinSize, getOption(options, 'minSize', 0))),
          minSizeEnd: getTrackOption(trackMinSizes, gutterOptions.track + 1, getOption(options, trackMinSize, getOption(options, 'minSize', 0)))
        }, gutterOptions), options);
      };
    };

    var Grid = function Grid(options) {
      var this$1 = this || _global;
      (this || _global).columnGutters = {};
      (this || _global).rowGutters = {};
      (this || _global).options = Object.assign({}, {
        columnGutters: options.columnGutters || [],
        rowGutters: options.rowGutters || [],
        columnMinSizes: options.columnMinSizes || {},
        rowMinSizes: options.rowMinSizes || {}
      }, options);

      (this || _global).options.columnGutters.forEach(function (gutterOptions) {
        this$1.columnGutters[options.track] = createGutter('column', this$1.options)(gutterOptions);
      });

      (this || _global).options.rowGutters.forEach(function (gutterOptions) {
        this$1.rowGutters[options.track] = createGutter('row', this$1.options)(gutterOptions);
      });
    };

    Grid.prototype.addColumnGutter = function addColumnGutter(element, track) {
      if ((this || _global).columnGutters[track]) {
        (this || _global).columnGutters[track].destroy();
      }

      (this || _global).columnGutters[track] = createGutter('column', (this || _global).options)({
        element: element,
        track: track
      });
    };

    Grid.prototype.addRowGutter = function addRowGutter(element, track) {
      if ((this || _global).rowGutters[track]) {
        (this || _global).rowGutters[track].destroy();
      }

      (this || _global).rowGutters[track] = createGutter('row', (this || _global).options)({
        element: element,
        track: track
      });
    };

    Grid.prototype.removeColumnGutter = function removeColumnGutter(track, immediate) {
      var this$1 = this || _global;
      if (immediate === void 0) immediate = true;

      if ((this || _global).columnGutters[track]) {
        (this || _global).columnGutters[track].destroy(immediate, function () {
          delete this$1.columnGutters[track];
        });
      }
    };

    Grid.prototype.removeRowGutter = function removeRowGutter(track, immediate) {
      var this$1 = this || _global;
      if (immediate === void 0) immediate = true;

      if ((this || _global).rowGutters[track]) {
        (this || _global).rowGutters[track].destroy(immediate, function () {
          delete this$1.rowGutters[track];
        });
      }
    };

    Grid.prototype.handleDragStart = function handleDragStart(e, direction, track) {
      if (direction === 'column') {
        if ((this || _global).columnGutters[track]) {
          (this || _global).columnGutters[track].destroy();
        }

        (this || _global).columnGutters[track] = createGutter('column', (this || _global).options)({
          track: track
        });

        (this || _global).columnGutters[track].startDragging(e);
      } else if (direction === 'row') {
        if ((this || _global).rowGutters[track]) {
          (this || _global).rowGutters[track].destroy();
        }

        (this || _global).rowGutters[track] = createGutter('row', (this || _global).options)({
          track: track
        });

        (this || _global).rowGutters[track].startDragging(e);
      }
    };

    Grid.prototype.destroy = function destroy(immediate) {
      var this$1 = this || _global;
      if (immediate === void 0) immediate = true;
      Object.keys((this || _global).columnGutters).forEach(function (track) {
        return this$1.columnGutters[track].destroy(immediate, function () {
          delete this$1.columnGutters[track];
        });
      });
      Object.keys((this || _global).rowGutters).forEach(function (track) {
        return this$1.rowGutters[track].destroy(immediate, function () {
          delete this$1.rowGutters[track];
        });
      });
    };

    function index(options) {
      return new Grid(options);
    }

    return index;
  });

  return exports;
}
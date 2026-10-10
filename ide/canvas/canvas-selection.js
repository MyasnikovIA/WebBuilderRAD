/* Canvas: выделение, resize-handles, перемещение, изменение размера.

   Дополняет Canvas.prototype, определённый в canvas-core.js.
   Загружается ПОСЛЕ canvas-events.js. */
(function (global) {
    'use strict';
    var Canvas = global.Canvas;
    if (!Canvas) { console.error('[canvas-selection] Canvas не загружен'); return; }

    var bus = global.EventBus;
    var SEL = Canvas.SEL;
    var RESIZE_DIRS = Canvas.RESIZE_DIRS;
    var MOVE_THRESHOLD = Canvas.MOVE_THRESHOLD;

    Canvas.prototype.setPending  = function (def) { this.pending = def; };
    Canvas.prototype.getSelected = function () { return this.getDoc().querySelector('.' + SEL); };

    Canvas.prototype.select = function (el) {
        if (!el || el.nodeType !== 1) return;
        if (el === this.getHtml()) return;
        if (this.designMode) return;
        var prev = this.getDoc().querySelectorAll('.' + SEL);
        for (var i = 0; i < prev.length; i++) {
            prev[i].classList.remove(SEL);
            this._cleanClass(prev[i]);
        }
        el.classList.add(SEL);
        this._addResizeHandles(el);
        bus.emit('selection:changed', { element: el });
    };

    Canvas.prototype._applyBox = function (el, left, top, width, height, setAttrs) {
        el.style.left   = left   + 'px';
        el.style.top    = top    + 'px';
        el.style.width  = width  + 'px';
        el.style.height = height + 'px';

        if (setAttrs && el.getAttribute &&
            (el.getAttribute('data-wb-tag') || el.getAttribute('cmptype'))) {
            el.setAttribute('width',  Math.round(width)  + 'px');
            el.setAttribute('height', Math.round(height) + 'px');
        }

        var preview = null;
        for (var k = 0; k < el.children.length; k++) {
            var ch = el.children[k];
            if (ch.getAttribute && ch.getAttribute('data-wb-preview') === '1') {
                preview = ch;
                break;
            }
        }
        if (preview) {
            preview.style.width     = width  + 'px';
            preview.style.height    = height + 'px';
            preview.style.boxSizing = 'border-box';
        }
    };

    Canvas.prototype._makeAbsolute = function (el) {
        var doc  = this.getDoc();
        var body = this.getBody();
        if (!body) return false;
        var cs = doc.defaultView.getComputedStyle(el);
        if (cs.position !== 'absolute' && cs.position !== 'fixed') {
            var op = this._getOffsetParent(el);
            if (!op) op = body;
            var r  = el.getBoundingClientRect();
            var or = op.getBoundingClientRect();
            el.style.position = 'absolute';
            el.style.left     = Math.round(r.left - or.left) + 'px';
            el.style.top      = Math.round(r.top  - or.top)  + 'px';
            el.style.width    = Math.round(r.width)  + 'px';
            el.style.height   = Math.round(r.height) + 'px';
            return true;
        }
        return false;
    };

    Canvas.prototype._addResizeHandles = function (el) {
        this._removeResizeHandles();
        if (!el || el.nodeType !== 1) return;
        if (this.designMode) return;

        try {
            var cs = this.getDoc().defaultView.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
        } catch (e) {}

        var html = this.getHtml();
        var head = this.getHead();
        var body = this.getBody();
        if (!html || !body) return;

        if (el === html || el === head || el === body) return;
        if (head && head.contains(el)) return;

        var rc = this.getRootContainer();
        if (this._rootType !== 'html' && rc && el === rc) return;

        var doc = this.getDoc();
        var self = this;
        this._handles = [];

        for (var i = 0; i < RESIZE_DIRS.length; i++) {
            (function (dir) {
                var h = doc.createElement('div');
                h.className = 'wb-resize-handle wb-resize-' + dir;
                h.setAttribute('data-wb-ide', '1');
                h.setAttribute('data-dir', dir);
                h.setAttribute('contenteditable', 'false');
                h.addEventListener('mousedown', function (ev) {
                    self._startResize(ev, dir);
                }, false);
                body.appendChild(h);
                self._handles.push(h);
            })(RESIZE_DIRS[i]);
        }

        (function () {
            var m = doc.createElement('div');
            m.className = 'wb-resize-handle wb-move-handle';
            m.setAttribute('data-wb-ide', '1');
            m.setAttribute('data-dir', 'move');
            m.setAttribute('contenteditable', 'false');
            m.addEventListener('mousedown', function (ev) {
                self._startMoveFromHandle(ev);
            }, false);
            body.appendChild(m);
            self._handles.push(m);
        })();

        this._positionResizeHandles(el);
    };

    Canvas.prototype._removeResizeHandles = function () {
        if (!this._handles) return;
        for (var i = 0; i < this._handles.length; i++) {
            var h = this._handles[i];
            if (h && h.parentNode) h.parentNode.removeChild(h);
        }
        this._handles = null;
    };

    Canvas.prototype._positionResizeHandles = function (el) {
        if (!this._handles || !this._handles.length) return;
        if (!el) el = this.getSelected();
        if (!el || el.nodeType !== 1) return;
        var body = this.getBody();
        if (!body) return;

        var r  = el.getBoundingClientRect();
        var br = body.getBoundingClientRect();
        var x = r.left - br.left;
        var y = r.top  - br.top;
        var w = r.width;
        var h = r.height;

        var positions = {
            nw: [x,       y,       'nwse-resize'],
            n:  [x + w/2, y,       'ns-resize'],
            ne: [x + w,   y,       'nesw-resize'],
            e:  [x + w,   y + h/2, 'ew-resize'],
            se: [x + w,   y + h,   'nwse-resize'],
            s:  [x + w/2, y + h,   'ns-resize'],
            sw: [x,       y + h,   'nesw-resize'],
            w:  [x,       y + h/2, 'ew-resize'],
            move: [x + w/2, y + h/2, 'move']
        };

        for (var i = 0; i < this._handles.length; i++) {
            var hd = this._handles[i];
            var dir = hd.getAttribute('data-dir');
            var p = positions[dir];
            if (!p) continue;
            hd.style.left   = p[0] + 'px';
            hd.style.top    = p[1] + 'px';
            hd.style.cursor = p[2];
        }
    };

    Canvas.prototype._trackMouse = function (onMove, onUp) {
        var doc      = this.getDoc();
        var iframe   = this.iframe;
        var outerDoc = global.document;
        var body     = this.getBody();

        var oldIframeCursor = body ? (body.style.cursor || '') : '';
        var oldOuterCursor  = (outerDoc && outerDoc.body)
            ? (outerDoc.body.style.cursor || '') : '';

        function handleIframe(ev) {
            onMove(ev.clientX, ev.clientY);
        }
        function handleOuter(ev) {
            var rect = iframe.getBoundingClientRect();
            onMove(ev.clientX - rect.left, ev.clientY - rect.top);
        }
        function handleUp() {
            doc.removeEventListener('mousemove', handleIframe, true);
            doc.removeEventListener('mouseup',   handleUp,     true);
            if (outerDoc) {
                outerDoc.removeEventListener('mousemove', handleOuter, true);
                outerDoc.removeEventListener('mouseup',   handleUp,    true);
            }
            if (body) body.style.cursor = oldIframeCursor;
            if (outerDoc && outerDoc.body) outerDoc.body.style.cursor = oldOuterCursor;
            if (onUp) onUp();
        }

        if (body) body.style.cursor = 'move';
        if (outerDoc && outerDoc.body) outerDoc.body.style.cursor = 'move';

        doc.addEventListener('mousemove', handleIframe, true);
        doc.addEventListener('mouseup',   handleUp,     true);
        if (outerDoc) {
            outerDoc.addEventListener('mousemove', handleOuter, true);
            outerDoc.addEventListener('mouseup',   handleUp,    true);
        }
    };

    Canvas.prototype._startResize = function (e, dir) {
        var self = this;
        var el = this.getSelected();
        if (!el) return;

        e.preventDefault();
        e.stopPropagation();

        var doc  = this.getDoc();
        var body = this.getBody();
        if (!body) return;

        var r  = el.getBoundingClientRect();

        this._makeAbsolute(el);

        var startLeft   = parseFloat(el.style.left);
        var startTop    = parseFloat(el.style.top);
        var startWidth  = parseFloat(el.style.width);
        var startHeight = parseFloat(el.style.height);

        if (isNaN(startLeft) || isNaN(startTop) ||
            isNaN(startWidth) || isNaN(startHeight)) {
            var op = this._getOffsetParent(el) || body;
            var or = op.getBoundingClientRect();
            if (isNaN(startLeft))   startLeft   = r.left - or.left;
            if (isNaN(startTop))    startTop    = r.top  - or.top;
            if (isNaN(startWidth))  startWidth  = r.width;
            if (isNaN(startHeight)) startHeight = r.height;
        }

        var startX = e.clientX;
        var startY = e.clientY;
        var MIN = 8;

        for (var i = 0; i < (this._handles || []).length; i++) {
            if (this._handles[i].getAttribute('data-dir') === dir) {
                this._handles[i].classList.add('wb-resize-active');
            }
        }

        function applyResize(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;
            var nl = startLeft, nt = startTop, nw = startWidth, nh = startHeight;

            if (dir.indexOf('e') >= 0) nw = Math.max(MIN, startWidth + dx);
            if (dir.indexOf('s') >= 0) nh = Math.max(MIN, startHeight + dy);
            if (dir.indexOf('w') >= 0) {
                var tw = Math.max(MIN, startWidth - dx);
                nl = startLeft + (startWidth - tw);
                nw = tw;
            }
            if (dir.indexOf('n') >= 0) {
                var th = Math.max(MIN, startHeight - dy);
                nt = startTop + (startHeight - th);
                nh = th;
            }

            self._applyBox(el, nl, nt, nw, nh, true);
            self._positionResizeHandles(el);
        }

        this._trackMouse(applyResize, function () {
            for (var k = 0; k < (self._handles || []).length; k++) {
                self._handles[k].classList.remove('wb-resize-active');
            }
            bus.emit('canvas:changed');
            bus.emit('selection:changed', { element: el });
        });
    };

    Canvas.prototype._startMove = function (e, el) {
        if (!el || el.nodeType !== 1) return;
        if (this.designMode) return;

        var html = this.getHtml();
        var head = this.getHead();
        var body = this.getBody();
        if (!html || !body) return;
        if (el === html || el === body || el === head) return;
        if (head && head.contains(el)) return;

        var rc = this.getRootContainer();
        if (this._rootType !== 'html' && rc && el === rc) return;

        if (e.target && e.target.classList &&
            e.target.classList.contains('wb-resize-handle')) return;

        var self = this;
        var startX = e.clientX;
        var startY = e.clientY;
        var moved = false;
        var startLeft = 0, startTop = 0;

        function onMove(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;

            if (!moved) {
                if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;
                moved = true;

                self._makeAbsolute(el);

                var sl = parseFloat(el.style.left);
                var st = parseFloat(el.style.top);
                if (isNaN(sl) || isNaN(st)) {
                    var op = self._getOffsetParent(el) || body;
                    var r  = el.getBoundingClientRect();
                    var or = op.getBoundingClientRect();
                    if (isNaN(sl)) { sl = r.left - or.left; el.style.left = sl + 'px'; }
                    if (isNaN(st)) { st = r.top  - or.top;  el.style.top  = st + 'px'; }
                }
                startLeft = sl;
                startTop  = st;

                el.classList.add('wb-moving');
            }

            el.style.left = (startLeft + dx) + 'px';
            el.style.top  = (startTop  + dy) + 'px';
            self._positionResizeHandles(el);
        }

        this._trackMouse(onMove, function () {
            el.classList.remove('wb-moving');
            if (moved) {
                bus.emit('canvas:changed');
                bus.emit('selection:changed', { element: el });
            }
        });
    };

    Canvas.prototype._startMoveFromHandle = function (e) {
        var el = this.getSelected();
        if (!el || el.nodeType !== 1) return;
        if (this.designMode) return;

        e.preventDefault();
        e.stopPropagation();

        var html = this.getHtml();
        var body = this.getBody();
        if (!html || !body) return;
        if (el === html || el === body) return;

        var rc = this.getRootContainer();
        if (this._rootType !== 'html' && rc && el === rc) return;

        var self = this;
        var startX = e.clientX;
        var startY = e.clientY;

        this._makeAbsolute(el);

        var startLeft = parseFloat(el.style.left);
        var startTop  = parseFloat(el.style.top);

        if (isNaN(startLeft) || isNaN(startTop)) {
            var op = this._getOffsetParent(el) || body;
            var r  = el.getBoundingClientRect();
            var or = op.getBoundingClientRect();
            if (isNaN(startLeft)) startLeft = r.left - or.left;
            if (isNaN(startTop))  startTop  = r.top  - or.top;
            el.style.left = startLeft + 'px';
            el.style.top  = startTop  + 'px';
        }

        el.classList.add('wb-moving');

        function onMove(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;
            el.style.left = (startLeft + dx) + 'px';
            el.style.top  = (startTop  + dy) + 'px';
            self._positionResizeHandles(el);
        }

        this._trackMouse(onMove, function () {
            el.classList.remove('wb-moving');
            bus.emit('canvas:changed');
            bus.emit('selection:changed', { element: el });
        });
    };

})(window);
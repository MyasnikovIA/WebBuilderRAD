/* Canvas: обработчики мыши / клавиатуры / контекстного меню.

   Дополняет Canvas.prototype, определённый в canvas-core.js.
   Загружается ПОСЛЕ canvas-core.js. */
(function (global) {
    'use strict';
    var Canvas = global.Canvas;
    if (!Canvas) { console.error('[canvas-events] Canvas не загружен'); return; }

    var bus = global.EventBus;
    var SEL = Canvas.SEL;
    var HOV = Canvas.HOV;

    Canvas.prototype._getOffsetParent = function (el) {
        var doc = this.getDoc();
        if (!el || el.nodeType !== 1) return doc.body;
        var op = el.offsetParent;
        if (op && op !== doc.documentElement) return op;
        var p = el.parentNode;
        while (p && p.nodeType === 1) {
            var cs = doc.defaultView.getComputedStyle(p);
            if (cs.position !== 'static') return p;
            p = p.parentNode;
        }
        return doc.body;
    };

    Canvas.prototype._resolveSelection = function (eTarget) {
        if (!eTarget || eTarget.nodeType !== 1) return null;
        var doc = this.getDoc();

        var cur = eTarget;
        while (cur && cur !== doc.body && cur !== doc.documentElement) {
            if (cur.getAttribute && cur.getAttribute('data-wb-preview') === '1') {
                var owner = cur.parentNode;
                while (owner && owner !== doc.body) {
                    if (owner.getAttribute && owner.getAttribute('data-wb-tag')) return owner;
                    if (owner.getAttribute && owner.getAttribute('cmptype')) return owner;
                    owner = owner.parentNode;
                }
                return eTarget;
            }
            if (cur.getAttribute && cur.getAttribute('data-wb-ide') === '1') {
                var p = cur.parentNode;
                while (p && p !== doc.body) {
                    if (p.getAttribute && p.getAttribute('data-wb-tag')) return p;
                    if (p.getAttribute && p.getAttribute('cmptype')) return p;
                    p = p.parentNode;
                }
                return null;
            }
            cur = cur.parentNode;
        }
        return eTarget;
    };

    Canvas.prototype._unbind = function () {
        if (!this._handlers) return;
        var doc = this._boundDoc || this.getDoc();
        if (!doc) { this._handlers = null; this._boundDoc = null; return; }
        for (var i = 0; i < this._handlers.length; i++) {
            var h = this._handlers[i];
            try { doc.removeEventListener(h.type, h.fn, h.capture); } catch (e) {}
        }
        this._handlers = null;
        this._boundDoc = null;
    };

    Canvas.prototype._bind = function () {
        this._unbind();

        var self = this, doc = this.getDoc();
        this._boundDoc = doc;
        this._handlers = [];

        function on(type, fn, capture) {
            doc.addEventListener(type, fn, capture);
            self._handlers.push({ type: type, fn: fn, capture: capture });
        }

        on('mousedown', function (e) {
            bus.emit('contextmenu:hide');
            if (self.designMode) return;

            if (self.pending) {
                var target0 = self._placementTarget(e.target);
                self._place(self.pending, target0);
                e.preventDefault(); e.stopPropagation();
                return;
            }

            if (e.target && e.target.classList &&
                e.target.classList.contains('wb-resize-handle')) {
                return;
            }

            var target = self._resolveSelection(e.target);
            if (!target) return;
            if (target === doc.body || target === doc.documentElement) return;

            var current = self.getSelected();
            if (current !== target) self.select(target);
            else if (!self._handles) self._addResizeHandles(target);

            self._startMove(e, target);
            e.preventDefault();
        }, true);

        on('mouseover', function (e) {
            if (self.designMode) return;
            if (e.target && e.target.nodeType === 1 && !e.target.classList.contains(SEL))
                e.target.classList.add(HOV);
        }, true);

        on('mouseout', function (e) {
            if (self.designMode) return;
            if (e.target && e.target.nodeType === 1) {
                e.target.classList.remove(HOV);
                self._cleanClass(e.target);
            }
        }, true);

        on('keydown', function (e) {
            if (self.designMode) return;
            if (e.keyCode === 46) { bus.emit('command:delete'); e.preventDefault(); }
            else if (e.keyCode >= 37 && e.keyCode <= 40) {
                bus.emit('command:move', {
                    dx: e.keyCode === 37 ? -1 : e.keyCode === 39 ? 1 : 0,
                    dy: e.keyCode === 38 ? -1 : e.keyCode === 40 ? 1 : 0,
                    resize: e.ctrlKey || e.shiftKey
                });
                e.preventDefault();
            } else if (e.ctrlKey && e.keyCode === 90) { bus.emit('command:undo'); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 89) { bus.emit('command:redo'); e.preventDefault(); }
        });

        on('contextmenu', function (e) {
            if (self.pending) { self.pending = null; bus.emit('palette:cancelled'); }
            if (!self.designMode && e.target && e.target.nodeType === 1) {
                var target = self._resolveSelection(e.target);
                if (target) self.select(target);
            }
            var pt = self._pageCoordsFromIframeEvent(e);
            bus.emit('contextmenu:element', { x: pt.x, y: pt.y });
            e.preventDefault();
        });

        on('click', function (e) {
            if (self.designMode) return;
            e.preventDefault();
            e.stopPropagation();
        }, true);
    };

})(window);
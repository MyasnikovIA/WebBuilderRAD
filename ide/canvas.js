/* Canvas: iframe-холст, выбор элементов, размещение компонентов. */
(function (global) {
    'use strict';
    var bus = global.EventBus;

    var SEL = 'wb-selected', HOV = 'wb-hover';
    var VOID = { IMG:1, INPUT:1, BR:1, HR:1, META:1, LINK:1, AREA:1, BASE:1,
        COL:1, EMBED:1, SOURCE:1, TRACK:1, WBR:1 };

    function Canvas(iframeEl) {
        this.iframe = iframeEl;
        this.pending = null;
        this._init();
    }

    Canvas.prototype._init = function () {
        var doc = this.getDoc();
        doc.open();
        doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Canvas</title></head><body></body></html>');
        doc.close();

        // IDE-стили внутри iframe.
        // ВАЖНО: html,body получают min-height:100%, иначе body пустой
        // не имеет размеров и клик в пустой области попадает в <html>.
        var style = this.getDoc().createElement('style');
        style.setAttribute('data-wb-ide', '1');
        style.textContent =
            'html, body { min-height: 100%; }' +
            'html { height: 100%; }' +
            'body { min-height: 100vh; margin: 0; box-sizing: border-box; }' +
            '.' + SEL + '{outline:1px dashed #1e88e5 !important;outline-offset:-1px;}' +
            '.' + HOV + '{outline:1px dotted #90caf9 !important;outline-offset:-1px;}';
        this.getDoc().head.appendChild(style);

        this._bind();

        if (global.IDE) global.IDE._canvas = this;

        if (global.MutationObserver) {
            this._mo = new global.MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    var m = muts[i];
                    if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
                        bus.emit('canvas:changed');
                        return;
                    }
                }
            });
            this._mo.observe(this.getBody(), { childList: true, subtree: true });
        }

        bus.emit('canvas:ready', this);

        // После завершения навигации iframe актуализируем observer и дерево.
        var self2 = this;
        setTimeout(function () {
            self2._reobserve();
            bus.emit('canvas:changed');
        }, 0);
    };

    Canvas.prototype.getDoc = function () {
        return this.iframe.contentDocument || this.iframe.contentWindow.document;
    };
    Canvas.prototype.getBody = function () {
        var d = this.getDoc();
        return d ? d.body : null;
    };

    Canvas.prototype._reobserve = function () {
        if (!this._mo) return;
        this._mo.disconnect();
        var b = this.getBody();
        if (b) this._mo.observe(b, { childList: true, subtree: true });
    };

    Canvas.prototype._bind = function () {
        var self = this, doc = this.getDoc();

        doc.addEventListener('mousedown', function (e) {
            if (self.pending) {
                var target = self._placementTarget(e.target);
                self._place(self.pending, target);
                e.preventDefault(); e.stopPropagation();
                return;
            }
            if (e.target && e.target.nodeType === 1) self.select(e.target);
        }, true);

        doc.addEventListener('mouseover', function (e) {
            if (e.target && e.target.nodeType === 1 && !e.target.classList.contains(SEL))
                e.target.classList.add(HOV);
        }, true);
        doc.addEventListener('mouseout', function (e) {
            if (e.target && e.target.nodeType === 1) e.target.classList.remove(HOV);
        }, true);

        doc.addEventListener('keydown', function (e) {
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

        doc.addEventListener('contextmenu', function (e) {
            if (self.pending) { self.pending = null; bus.emit('palette:cancelled'); }
            if (e.target && e.target.nodeType === 1) self.select(e.target);
            bus.emit('contextmenu:element', { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
    };

    /* ГЛАВНОЕ ИСПРАВЛЕНИЕ:
       — если клик вне body (например, по <html>) → вернуть body;
       — иначе подниматься вверх до body, пропуская VOID-теги. */
    Canvas.prototype._placementTarget = function (el) {
        var body = this.getBody();
        if (!body) return null;
        if (!el || el.nodeType !== 1) return body;

        // клик вне body (в <html>, в документ и т.п.) — кладём в body
        if (el !== body && !body.contains(el)) return body;

        var n = el;
        while (n && n !== body) {
            if (!VOID[n.tagName]) return n;
            n = n.parentNode;
        }
        return body;
    };

    Canvas.prototype._place = function (def, target) {
        if (!target) return;
        var doc = this.getDoc();
        var el = def.create ? def.create(doc) : doc.createElement(def.tagName);
        el.setAttribute('data-cmptype', def.id);
        target.appendChild(el);

        this.pending = null;
        bus.emit('palette:placed');

        var prev = doc.querySelectorAll('.' + SEL);
        for (var i = 0; i < prev.length; i++) prev[i].classList.remove(SEL);
        el.classList.add(SEL);

        bus.emit('canvas:changed');
        bus.emit('selection:changed', { element: el });
    };

    Canvas.prototype.setPending  = function (def) { this.pending = def; };
    Canvas.prototype.getSelected = function () { return this.getDoc().querySelector('.' + SEL); };

    Canvas.prototype.select = function (el) {
        if (!el || el.nodeType !== 1 || el === this.getDoc().documentElement) return;
        var prev = this.getDoc().querySelectorAll('.' + SEL);
        for (var i = 0; i < prev.length; i++) prev[i].classList.remove(SEL);
        el.classList.add(SEL);
        bus.emit('selection:changed', { element: el });
    };

    Canvas.prototype.cleanHtml = function () {
        var html = '<!DOCTYPE html>\n' + this.getDoc().documentElement.outerHTML;
        html = html.replace(/ class="wb-selected"/g, '')
            .replace(/ class="wb-hover"/g, '')
            .replace(/ data-cmptype="[^"]*"/g, '')
            .replace(/<style data-wb-ide="1">[\s\S]*?<\/style>/g, '')
            .replace(/ data-wb-ide="1"/g, '');
        return html;
    };

    global.Canvas = Canvas;
})(window);
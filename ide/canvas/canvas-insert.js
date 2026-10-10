/* Canvas: вставка компонентов, target-логика, preview-узлы.

   Дополняет Canvas.prototype, определённый в canvas-core.js.
   Загружается ПОСЛЕ canvas-selection.js. */
(function (global) {
    'use strict';
    var Canvas = global.Canvas;
    if (!Canvas) { console.error('[canvas-insert] Canvas не загружен'); return; }

    var bus = global.EventBus;
    var SEL = Canvas.SEL;
    var VOID = Canvas.VOID;
    var PARENT_FALLBACK = Canvas.PARENT_FALLBACK;

    Canvas.prototype._placementTarget = function (el) {
        var html = this.getHtml();
        var body = this.getBody() || this.getOrCreateBody();
        var head = this.getHead();
        if (!html) return null;
        if (!el || el.nodeType !== 1) return body;

        if (this._rootType !== 'html') {
            var rc = this.getRootContainer();
            if (rc && el !== rc && !rc.contains(el)) return rc;
        }

        if (el !== html && !html.contains(el)) return body;

        var n = el;
        while (n && n !== body && n !== head && n !== html) {
            if (n.getAttribute && n.getAttribute('data-wb-preview') === '1') {
                n = n.parentNode;
                continue;
            }
            if (!VOID[n.tagName]) return n;
            n = n.parentNode;
        }
        if (n === head) return head;

        if (this._rootType !== 'html') {
            var rc2 = this.getRootContainer();
            if (rc2) return rc2;
        }
        return body;
    };

    Canvas.prototype._findParentFor = function (parentOnly, target) {
        var doc = this.getDoc();
        var html = this.getHtml();

        var wanted;
        if (Array.isArray(parentOnly)) {
            wanted = parentOnly.map(function (t) { return String(t).toLowerCase(); });
        } else {
            wanted = [String(parentOnly).toLowerCase()];
        }

        var t = target;
        while (t && t !== html) {
            if (t.tagName) {
                var tag = t.tagName.toLowerCase();
                if (wanted.indexOf(tag) >= 0) return t;
            }
            t = t.parentNode;
        }
        for (var i = 0; i < wanted.length; i++) {
            var all = doc.querySelectorAll(wanted[i]);
            if (all.length > 0) return all[0];
        }
        return null;
    };

    Canvas.prototype.insertComponent = function (def, target, zone) {
        var doc  = this.getDoc();
        var html = this.getHtml();
        if (!html) return null;

        if (def.unique) {
            var existing = doc.querySelector(def.tagName);
            if (existing) {
                this.pending = null;
                bus.emit('palette:placed');
                this.select(existing);
                return existing;
            }
        }

        var el = def.create ? def.create(doc) : doc.createElement(def.tagName);
        if (def.cmptype && !el.getAttribute('cmptype')) {
            el.setAttribute('cmptype', def.cmptype);
        }
        if (def.cmptypeId) el.setAttribute('data-cmptype', def.cmptypeId);
        if (def.xmlTag && !el.getAttribute('data-wb-tag')) {
            el.setAttribute('data-wb-tag', def.xmlTag);
        }

        if (def.nameTemplate) {
            var newName = Canvas.generateComponentName(doc, def.tagName, def.nameTemplate);
            if (newName) el.setAttribute('name', newName);
        }

        var parentOnly = def.parentOnly;
        if (!parentOnly && def.tagName) {
            parentOnly = PARENT_FALLBACK[String(def.tagName).toLowerCase()];
        }

        if (parentOnly) {
            var parent = this._findParentFor(parentOnly, target);
            if (!parent) {
                this.pending = null;
                bus.emit('palette:placed');
                return null;
            }
            parent.appendChild(el);
        } else if (def.rootLevel) {
            html.appendChild(el);
        } else if (def.headOnly) {
            var head = this.getOrCreateHead();
            head.appendChild(el);
        } else if (target === html || !target || !target.parentNode) {
            var body = this.getOrCreateBody();
            if (body) body.appendChild(el);
        } else if (zone === 'before') {
            target.parentNode.insertBefore(el, target);
        } else if (zone === 'after') {
            target.parentNode.insertBefore(el, target.nextSibling);
        } else {
            target.appendChild(el);
        }

        this.refreshPreviewAndParent(el);

        this.pending = null;
        bus.emit('palette:placed');

        var prev = doc.querySelectorAll('.' + SEL);
        for (var i = 0; i < prev.length; i++) {
            prev[i].classList.remove(SEL);
            this._cleanClass(prev[i]);
        }
        el.classList.add(SEL);
        this._addResizeHandles(el);

        bus.emit('canvas:changed');
        bus.emit('selection:changed', { element: el });
        return el;
    };

    Canvas.prototype._renderPreview = function (el) {
        if (!el || el.nodeType !== 1) return;

        var old = el.querySelector(':scope > [data-wb-preview="1"]');
        if (old) old.parentNode.removeChild(old);

        if (this.getRootContainer && this.getRootContainer() === el) return;

        var def = global.ComponentRegistry && global.ComponentRegistry.match(el);
        if (!def || !def.preview) return;

        var doc = this.getDoc();
        var node;
        try { node = def.preview(el, doc); } catch (e) { node = null; }
        if (!node) return;

        if (typeof node === 'string') {
            var tmp = doc.createElement('div');
            tmp.innerHTML = node;
            node = tmp.firstChild;
        }
        if (!node || node.nodeType !== 1) return;

        node.setAttribute('data-wb-preview', '1');
        el.appendChild(node);

        /* Preview-узел может содержать img/iframe с относительным путём —
           сразу подменяем на blob/data URL. */
        if (global.ProjectResolver) {
            try { global.ProjectResolver.applyTree(node); } catch (e) {}
        }
    };

    Canvas.prototype.refreshPreview = function (el) {
        if (!el || el.nodeType !== 1) return;
        this._renderPreview(el);
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var c = kids[i];
            if (c.getAttribute && (c.getAttribute('data-wb-tag') || c.getAttribute('cmptype'))) {
                this.refreshPreview(c);
            }
        }
    };

    Canvas.prototype.refreshPreviewAndParent = function (el) {
        if (!el || el.nodeType !== 1) return;
        this.refreshPreview(el);
        var p = el.parentNode;
        if (p && p.nodeType === 1 && p.getAttribute &&
            (p.getAttribute('data-wb-tag') || p.getAttribute('cmptype'))) {
            this._renderPreview(p);
        }
    };

    Canvas.prototype._place = function (def, target) {
        this.insertComponent(def, target, 'inside');
    };

})(window);
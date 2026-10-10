/* DomTree — дерево структуры страницы (левая верхняя панель).

   Загружается после panels-utils.js. Экспортирует global.DomTree. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;
    var U   = global.PanelsUtils;

    var VOID_TAGS        = U.VOID_TAGS;
    var STRICT_HEAD_TAGS = U.STRICT_HEAD_TAGS;
    var PARENT_ONLY      = U.PARENT_ONLY;
    var stripServiceClasses = U.stripServiceClasses;

    var _idCounter = 0;

    function collectTreeKids(el) {
        var kids = [];
        for (var i = 0; i < el.children.length; i++) {
            var c = el.children[i];
            if (c.getAttribute && c.getAttribute('data-wb-ide') === '1') continue;
            if (c.getAttribute && c.getAttribute('data-wb-preview') === '1') continue;
            if (c.getAttribute && c.getAttribute('data-wb-comp-asset') === '1') continue;
            if (c.tagName && c.tagName.toLowerCase() === 'wb-cdata') continue;
            if (c.tagName && (c.tagName.toLowerCase() === 'wb-images'
                || c.tagName.toLowerCase() === 'wb-image')) continue;
            kids.push(c);
        }
        return kids;
    }

    function DomTree(rootEl) {
        var self = this;
        this.rootId = (typeof rootEl === 'string') ? rootEl : rootEl.id;
        this.canvas = null;
        this._mo = null;
        this._rebuildScheduled = false;
        this._dragEl = null;
        this._collapsed = {};
        this._collapseAll = true;

        bus.on('canvas:ready', function (c) {
            self.canvas = c;
            self._observe();
            self._collapseAll = true;
            self.rebuild();
        });
        bus.on('canvas:changed',   function () { self.rebuild(); });
        bus.on('canvas:refreshed', function (e) {
            if (!e || e.collapseTree !== false) self._collapseAll = true;
            self.rebuild();
        });
        bus.on('selection:changed',function (e) { self.highlight(e.element); });

        bus.on('canvas:changed', function () {
            if (!self.canvas && global.IDE && global.IDE._canvas) {
                self.canvas = global.IDE._canvas;
                self._observe();
                self._collapseAll = true;
                self.rebuild();
            }
        });

        $('#wb-domtree-filter').bind('keyup input', function () { self._filter($(this).val()); });
        this._installDnD();
        this._installContextMenu();
    }

    DomTree.prototype._observe = function () {
        if (this._mo) { this._mo.disconnect(); this._mo = null; }
        if (!this.canvas || !global.MutationObserver) return;
        var self = this;
        var html = this.canvas.getHtml();
        if (!html) return;
        this._mo = new global.MutationObserver(function () { self._scheduleRebuild(); });
        this._mo.observe(html, { childList: true, subtree: true, characterData: true });
    };

    DomTree.prototype._scheduleRebuild = function () {
        if (this._rebuildScheduled) return;
        this._rebuildScheduled = true;
        var self = this;
        setTimeout(function () { self._rebuildScheduled = false; self.rebuild(); }, 0);
    };

    DomTree.prototype._getRoot = function () { return $('#' + this.rootId); };

    DomTree.prototype._collapseSubtree = function (root) {
        var self = this;
        function walk(el, path, isRoot) {
            if (!el || el.nodeType !== 1) return;
            var kids = collectTreeKids(el);
            if (kids.length > 0 && !isRoot) self._collapsed[path] = true;
            for (var j = 0; j < kids.length; j++) walk(kids[j], path + '.' + j, false);
        }
        walk(root, 'r', true);
    };

    DomTree.prototype.rebuild = function () {
        if (!this.canvas) return;
        var $root = this._getRoot();
        if (!$root.length) return;
        var html = this.canvas.getHtml();
        if (!html) return;

        var startEl = html;
        var rootType = this.canvas.getRootType ? this.canvas.getRootType() : 'html';
        if (rootType !== 'html') {
            var rc = this.canvas.getRootContainer && this.canvas.getRootContainer();
            if (rc) startEl = rc;
        }

        if (this._collapseAll) {
            this._collapseAll = false;
            this._collapsed = {};
            this._collapseSubtree(startEl);
        }

        $root.empty();
        var ul = $('<ul class="wb-tree wb-tree-root"></ul>');
        this._build(startEl, ul, 'r');
        $root.append(ul);

        var sel = this.canvas.getSelected();
        if (sel) this.highlight(sel);
    };

    DomTree.prototype._build = function (el, parentUl, path) {
        if (!el || el.nodeType !== 1) return;
        if (el.getAttribute && el.getAttribute('data-wb-ide') === '1') return;
        if (el.getAttribute && el.getAttribute('data-wb-preview') === '1') return;
        if (el.getAttribute && el.getAttribute('data-wb-comp-asset') === '1') return;
        if (el.tagName && el.tagName.toLowerCase() === 'wb-cdata') return;
        if (el.tagName && (el.tagName.toLowerCase() === 'wb-images'
            || el.tagName.toLowerCase() === 'wb-image')) return;

        var self = this;
        var li = $('<li></li>');
        var collKey = path;

        var html = this.canvas.getHtml();
        var head = this.canvas.getHead();
        var body = this.canvas.getBody();
        var rootContainer = this.canvas.getRootContainer ? this.canvas.getRootContainer() : html;
        var rootType = this.canvas.getRootType ? this.canvas.getRootType() : 'html';

        var isHtmlRoot = (el === html);
        var isContainerRoot = (rootType !== 'html' && el === rootContainer);
        var isRoot = isHtmlRoot || isContainerRoot;
        var isHead = (el === head) || (head && head.contains(el));
        var isHidden = (el.tagName && ['CMPACTION','CMPDATASET','CMPSCRIPT','CMPMASK','CMPBROKER','CMPTAGITEM'].indexOf(el.tagName) >= 0);

        var nid = this._nid(el);
        var kids = collectTreeKids(el);
        var hasKids = kids.length > 0;
        var collapsed = !!this._collapsed[collKey];

        var toggle = $('<span class="wb-toggle"></span>')
            .text(collapsed ? '+' : '\u2212')
            .toggleClass('wb-leaf', !hasKids)
            .attr('data-node-id', nid);
        li.append(toggle);

        var label = $('<span class="wb-tree-label"></span>')
            .text(this._label(el))
            .toggleClass('wb-invisible', (isHead && el !== head) || isHidden)
            .attr('data-node-id', nid)
            .attr('draggable', isRoot ? 'false' : 'true');
        li.append(label);

        if (hasKids) {
            var cul = $('<ul></ul>');
            for (var j = 0; j < kids.length; j++) self._build(kids[j], cul, collKey + '.' + j);
            if (collapsed) cul.hide();
            li.append(cul);
        }
        parentUl.append(li);

        label.click(function (e) {
            e.stopPropagation();
            if (self.canvas && self.canvas.pending) {
                var zone = self._zoneFromEvent(this, e.originalEvent || e);
                self._clearIndicators();
                self._insertFromPalette(self.canvas.pending, el, zone);
                return;
            }
            self.canvas.select(el);
        });

        label.bind('mouseenter', function () { label.addClass('wb-hover'); });
        label.bind('mousemove', function (e) {
            if (!self.canvas || !self.canvas.pending) return;
            if (self._dragEl) return;
            var native = e.originalEvent || e;
            var zone = self._zoneFromEvent(this, native);
            self._clearIndicators();
            label.addClass('wb-drop-' + zone);
        });
        label.bind('mouseleave', function () {
            label.removeClass('wb-hover');
            label.removeClass('wb-drop-before wb-drop-after wb-drop-inside');
        });

        if (hasKids) {
            toggle.click(function (e) {
                e.stopPropagation();
                var nowCollapsed = !self._collapsed[collKey];
                self._collapsed[collKey] = nowCollapsed;
                toggle.text(nowCollapsed ? '+' : '\u2212');
                var $ul = li.children('ul').first();
                if (nowCollapsed) $ul.hide(); else $ul.show();
            });
        }
    };

    DomTree.prototype._label = function (el) {
        var custom = el.getAttribute && el.getAttribute('data-wb-tag');
        var tag = custom || el.tagName.toLowerCase();

        if (tag === 'cmpComment') {
            var ctext = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (ctext.length > 60) ctext = ctext.substr(0, 60) + '…';
            return '<!-- ' + ctext + ' -->';
        }

        var extra = '';

        if (tag === 'component') {
            var m2ct = el.getAttribute('cmptype') || '';
            var m2name = el.getAttribute('name');
            var m2cap = el.getAttribute('caption');
            if (m2ct) extra += ' cmptype="' + m2ct + '"';
            if (m2name) extra += ' name="' + m2name + '"';
            if (m2cap)  extra += ' caption="' + m2cap + '"';
            return tag + extra;
        }

        if (tag === 'meta') {
            var ch = el.getAttribute('charset');
            var nm = el.getAttribute('name');
            if (ch) extra = ' charset="' + ch + '"';
            else if (nm) extra = ' name="' + nm + '"';
        } else if (tag === 'link') {
            var rel = el.getAttribute('rel');
            var href = el.getAttribute('href');
            if (rel) extra += ' rel="' + rel + '"';
            if (href) extra += ' href="' + href + '"';
        } else if (tag === 'script') {
            var src = el.getAttribute('src');
            extra = src ? ' src="' + src + '"' : ' (inline)';
        } else if (tag === 'title') {
            var t = el.textContent || '';
            if (t.length > 40) t = t.substr(0, 40) + '…';
            extra = ' "' + t + '"';
        } else if (tag === 'style') {
            extra = ' (inline)';
        } else if (custom) {
            var n = el.getAttribute('name');
            var cap = el.getAttribute('caption');
            if (n) extra += ' name="' + n + '"';
            if (cap) extra += ' caption="' + cap + '"';
        }

        var id  = el.id ? '#' + el.id : '';
        var cls = '';
        if (typeof el.className === 'string' && el.className && el.className.trim() !== '') {
            var parts = stripServiceClasses(el.className).split(/\s+/).filter(function (c) {
                return c;
            });
            if (parts.length) cls = '.' + parts.join('.');
        }

        return tag + id + cls + extra;
    };

    DomTree.prototype._nid = function (el) {
        if (!el.__wb_nid) el.__wb_nid = 'n' + (++_idCounter);
        return el.__wb_nid;
    };

    DomTree.prototype._findByNid = function (el, nid) {
        if (!el || el.nodeType !== 1) return null;
        if (el.__wb_nid === nid) return el;
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var r = this._findByNid(kids[i], nid);
            if (r) return r;
        }
        return null;
    };

    DomTree.prototype._labelToElement = function (label) {
        var nid = $(label).attr('data-node-id');
        if (!nid || !this.canvas) return null;
        var html = this.canvas.getHtml();
        if (!html) return null;
        var root = html;
        var rootType = this.canvas.getRootType ? this.canvas.getRootType() : 'html';
        if (rootType !== 'html') {
            var rc = this.canvas.getRootContainer && this.canvas.getRootContainer();
            if (rc) root = rc;
        }
        if (root.__wb_nid === nid) return root;
        return this._findByNid(html, nid);
    };

    DomTree.prototype.highlight = function (el) {
        var $root = this._getRoot();
        $root.find('.wb-tree-label').removeClass('wb-selected');
        if (!el) return;

        if (!el.__wb_nid) {
            var html = this.canvas && this.canvas.getHtml();
            if (html && html.contains(el)) { this.rebuild(); return; }
        }

        var nid = el.__wb_nid;
        if (!nid) return;
        var $lab = $root.find('.wb-tree-label[data-node-id="' + nid + '"]');
        if (!$lab.length) return;

        $lab.parents('li').each(function () {
            var $li = $(this);
            var $ul = $li.children('ul').first();
            if ($ul.length && $ul.is(':hidden')) {
                $ul.show();
                var $tg = $li.children('.wb-toggle').first();
                if ($tg.length) $tg.text('\u2212');
            }
        });

        $lab.addClass('wb-selected');
        var cTop = $root.scrollTop();
        var lTop = $lab.position().top + cTop;
        if (lTop < cTop || lTop > cTop + $root.height() - 30)
            $root.scrollTop(Math.max(0, lTop - $root.height() / 2));
    };

    DomTree.prototype._filter = function (txt) {
        txt = (txt || '').toLowerCase();
        var all = this._getRoot().find('li');
        all.show();
        this._getRoot().find('ul').show();
        if (!txt) return;
        all.each(function () {
            var li = $(this);
            var selfLabel  = li.children('.wb-tree-label').text().toLowerCase();
            var selfMatch  = selfLabel.indexOf(txt) >= 0;
            var childMatch = li.find('.wb-tree-label').filter(function () {
                return $(this).text().toLowerCase().indexOf(txt) >= 0;
            }).length > 0;
            if (!selfMatch && !childMatch) li.hide();
        });
    };

    DomTree.prototype._zoneFromEvent = function (labelEl, nativeEvent) {
        var rect = labelEl.getBoundingClientRect();
        var y = nativeEvent.clientY - rect.top;
        var h = rect.height || 1;
        if (y < h * 0.25) return 'before';
        if (y > h * 0.75) return 'after';
        return 'inside';
    };

    DomTree.prototype._insertFromPalette = function (def, target, zone) {
        if (!this.canvas || !def || !target) return;
        this.canvas.insertComponent(def, target, zone);
    };

    DomTree.prototype._installContextMenu = function () {
        var self = this;
        var $root = this._getRoot();

        $root.delegate('.wb-tree-label', 'contextmenu', function (e) {
            var el = self._labelToElement(this);
            if (!el) return true;

            var html = self.canvas && self.canvas.getHtml();
            var rootType = self.canvas && self.canvas.getRootType ? self.canvas.getRootType() : 'html';
            var rootContainer = self.canvas && self.canvas.getRootContainer ? self.canvas.getRootContainer() : html;

            var isRoot = (el === html) || (rootType !== 'html' && el === rootContainer);

            e.preventDefault();
            e.stopPropagation();

            if (isRoot) {
                if (self.canvas && !self.canvas.designMode) self.canvas.select(el);
                var native = e.originalEvent || e;
                bus.emit('contextmenu:root', { x: native.clientX, y: native.clientY, rootType: rootType });
                return false;
            }

            if (self.canvas && !self.canvas.designMode) self.canvas.select(el);
            var native2 = e.originalEvent || e;
            bus.emit('contextmenu:tree', { x: native2.clientX, y: native2.clientY, element: el });
            return false;
        });
    };

    DomTree.prototype._installDnD = function () {
        var self = this;
        var $root = this._getRoot();

        $root.delegate('.wb-tree-label', 'dragstart', function (e) {
            var el = self._labelToElement(this);
            var html = self.canvas && self.canvas.getHtml();
            if (!el || !html || el === html) { e.preventDefault(); return false; }
            var rootType = self.canvas && self.canvas.getRootType ? self.canvas.getRootType() : 'html';
            var rc = self.canvas && self.canvas.getRootContainer ? self.canvas.getRootContainer() : null;
            if (rootType !== 'html' && rc && el === rc) { e.preventDefault(); return false; }
            if (self.canvas && self.canvas.pending) {
                self.canvas.pending = null;
                bus.emit('palette:cancelled');
            }
            self._dragEl = el;
            $(this).addClass('wb-dragging');
            var native = e.originalEvent;
            if (native && native.dataTransfer) {
                native.dataTransfer.effectAllowed = 'move';
                try { native.dataTransfer.setData('text/plain', 'wb-tree'); } catch (ex) {}
            }
        });

        $(document).bind('dragend.wbDomTree', function () { self._endDrag(); });

        $root.delegate('.wb-tree-label', 'dragover', function (e) {
            if (!self._dragEl) return;
            var target = self._labelToElement(this);
            var native = e.originalEvent;
            var zone = self._zoneFromEvent(this, native);
            if (!self._canDrop(self._dragEl, target, zone)) {
                if (native && native.dataTransfer) native.dataTransfer.dropEffect = 'none';
                $(this).addClass('wb-drop-forbidden');
                return;
            }
            $(this).removeClass('wb-drop-forbidden');
            e.preventDefault();
            if (native && native.dataTransfer) native.dataTransfer.dropEffect = 'move';
            self._clearIndicators();
            $(this).addClass('wb-drop-' + zone);
        });

        $root.delegate('.wb-tree-label', 'dragleave', function () {
            $(this).removeClass('wb-drop-before wb-drop-after wb-drop-inside wb-drop-forbidden');
        });

        $root.delegate('.wb-tree-label', 'drop', function (e) {
            if (!self._dragEl) return;
            var target = self._labelToElement(this);
            var zone = self._zoneFromEvent(this, e.originalEvent);
            if (!self._canDrop(self._dragEl, target, zone)) return;
            e.preventDefault();
            e.stopPropagation();
            self._performDrop(self._dragEl, target, zone);
            self._endDrag();
            return false;
        });
    };

    DomTree.prototype._canDrop = function (src, dst, zone) {
        if (!src || !dst) return false;
        if (src === dst) return false;
        if (src.contains(dst)) return false;
        var html = this.canvas.getHtml();
        var head = this.canvas.getHead();
        var body = this.canvas.getBody();
        if (!html) return false;
        if (VOID_TAGS[dst.tagName]) return false;

        if ((src === head || src === body) && dst !== html) return false;

        var rootType = this.canvas.getRootType ? this.canvas.getRootType() : 'html';
        var rc = this.canvas.getRootContainer ? this.canvas.getRootContainer() : null;
        if (rootType !== 'html' && rc && src === rc) return false;

        var srcTag = src.tagName.toLowerCase();
        var parentOnly = PARENT_ONLY[srcTag];
        if (parentOnly) {
            var checkNode = (zone === 'inside') ? dst : dst.parentNode;
            var checkTag = checkNode && checkNode.tagName ? checkNode.tagName.toLowerCase() : '';
            var allowed = Array.isArray(parentOnly) ? parentOnly : [parentOnly];
            if (allowed.indexOf(checkTag) < 0) return false;
        }

        if (STRICT_HEAD_TAGS[srcTag]) {
            var targetIsHead = (dst === head) || (dst.tagName.toLowerCase() === 'head');
            if (!targetIsHead) return false;
        }

        if (dst === body && rootType !== 'html' && src !== rc) return false;

        if (dst === html) return true;
        if (!html.contains(dst)) return false;
        return true;
    };

    DomTree.prototype._performDrop = function (src, dst, zone) {
        var html = this.canvas.getHtml();
        if (!html) return;

        if (dst === html) html.appendChild(src);
        else if (zone === 'inside') dst.appendChild(src);
        else if (zone === 'before') dst.parentNode.insertBefore(src, dst);
        else if (zone === 'after') dst.parentNode.insertBefore(src, dst.nextSibling);

        var newParent = src.parentNode;
        if (newParent && newParent.nodeType === 1 &&
            newParent.getAttribute && newParent.getAttribute('data-wb-tag')) {
            this.canvas._renderPreview(newParent);
        }

        var doc = this.canvas.getDoc();
        var prev = doc.querySelectorAll('.wb-selected');
        for (var i = 0; i < prev.length; i++) {
            prev[i].classList.remove('wb-selected');
            if (this.canvas && this.canvas._cleanClass) this.canvas._cleanClass(prev[i]);
        }
        src.classList.add('wb-selected');

        bus.emit('canvas:changed');
        bus.emit('selection:changed', { element: src });
    };

    DomTree.prototype._clearIndicators = function () {
        this._getRoot()
            .find('.wb-drop-before, .wb-drop-after, .wb-drop-inside, .wb-drop-forbidden')
            .removeClass('wb-drop-before wb-drop-after wb-drop-inside wb-drop-forbidden');
    };

    DomTree.prototype._endDrag = function () {
        this._dragEl = null;
        this._clearIndicators();
        this._getRoot().find('.wb-dragging').removeClass('wb-dragging');
    };

    global.DomTree = DomTree;

})(window, jQuery);
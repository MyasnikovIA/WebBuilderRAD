/* DomTree, Palette, Inspector. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    var VOID_TAGS = { IMG:1, INPUT:1, BR:1, HR:1, META:1, LINK:1, AREA:1, BASE:1,
        COL:1, EMBED:1, SOURCE:1, TRACK:1, WBR:1 };

    var STRICT_HEAD_TAGS = { meta:1, title:1, base:1 };

    /* Разрешённые родители для drag&drop (в нижнем регистре).
       Может быть строкой или массивом строк. */
    var PARENT_ONLY = {
        cmpactionvar:    ['cmpaction', 'cmpsubaction'],
        cmpsubaction:    ['cmpaction', 'cmpsubaction'],
        cmpsubactionvar: 'cmpsubaction',
        cmpdatasetvar:   'cmpdataset',
        cmpcomboitem:    'cmpcombobox'
    };

    /* ============================================================ */
    var _idCounter = 0;

    function DomTree(rootEl) {
        var self = this;
        this.rootId = (typeof rootEl === 'string') ? rootEl : rootEl.id;
        this.canvas = null;
        this._mo = null;
        this._rebuildScheduled = false;
        this._dragEl = null;
        this._collapsed = {};

        bus.on('canvas:ready', function (c) {
            self.canvas = c;
            self._observe();
            self.rebuild();
        });
        bus.on('canvas:changed',   function () { self.rebuild(); });
        bus.on('canvas:refreshed', function () { self.rebuild(); });
        bus.on('selection:changed',function (e) { self.highlight(e.element); });

        bus.on('canvas:changed', function () {
            if (!self.canvas && global.IDE && global.IDE._canvas) {
                self.canvas = global.IDE._canvas;
                self._observe();
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

    DomTree.prototype.rebuild = function () {
        if (!this.canvas) return;
        var $root = this._getRoot();
        if (!$root.length) return;
        var html = this.canvas.getHtml();
        if (!html) return;

        $root.empty();
        var ul = $('<ul class="wb-tree wb-tree-root"></ul>');

        var startEl = html;
        var rootType = this.canvas.getRootType ? this.canvas.getRootType() : 'html';
        if (rootType !== 'html') {
            var rc = this.canvas.getRootContainer && this.canvas.getRootContainer();
            if (rc) startEl = rc;
        }

        this._build(startEl, ul);
        $root.append(ul);

        var sel = this.canvas.getSelected();
        if (sel) this.highlight(sel);
    };

    DomTree.prototype._build = function (el, parentUl) {
        if (!el || el.nodeType !== 1) return;
        if (el.getAttribute && el.getAttribute('data-wb-ide') === '1') return;
        if (el.getAttribute && el.getAttribute('data-wb-preview') === '1') return;
        if (el.tagName && el.tagName.toLowerCase() === 'wb-cdata') return;

        var self = this;
        var li = $('<li></li>');

        var html = this.canvas.getHtml();
        var head = this.canvas.getHead();
        var body = this.canvas.getBody();
        var rootContainer = this.canvas.getRootContainer ? this.canvas.getRootContainer() : html;
        var rootType = this.canvas.getRootType ? this.canvas.getRootType() : 'html';

        var isHtmlRoot = (el === html);
        var isContainerRoot = (rootType !== 'html' && el === rootContainer);
        var isRoot = isHtmlRoot || isContainerRoot;
        var isHead = (el === head) || (head && head.contains(el));
        var isHidden = (el.tagName && ['CMPACTION','CMPDATASET','CMPSCRIPT','CMPMASK'].indexOf(el.tagName) >= 0);
        var nid = this._nid(el);

        var kids = [];
        for (var i = 0; i < el.children.length; i++) {
            var child = el.children[i];
            if (child.getAttribute && child.getAttribute('data-wb-ide') === '1') continue;
            if (child.getAttribute && child.getAttribute('data-wb-preview') === '1') continue;
            if (child.tagName && child.tagName.toLowerCase() === 'wb-cdata') continue;
            kids.push(child);
        }
        var hasKids = kids.length > 0;
        var collapsed = !!this._collapsed[nid];

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
            for (var j = 0; j < kids.length; j++) self._build(kids[j], cul);
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
                var nowCollapsed = !self._collapsed[nid];
                self._collapsed[nid] = nowCollapsed;
                toggle.text(nowCollapsed ? '+' : '\u2212');
                var $ul = li.children('ul').first();
                if (nowCollapsed) $ul.hide(); else $ul.show();
            });
        }
    };

    DomTree.prototype._label = function (el) {
        var custom = el.getAttribute && el.getAttribute('data-wb-tag');
        var tag = custom || el.tagName.toLowerCase();
        var extra = '';

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
            var parts = el.className.split(/\s+/).filter(function (c) {
                return c && c !== 'wb-selected' && c !== 'wb-hover';
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
                bus.emit('contextmenu:root', {
                    x: native.clientX,
                    y: native.clientY,
                    rootType: rootType
                });
                return false;
            }

            if (self.canvas && !self.canvas.designMode) self.canvas.select(el);
            var native2 = e.originalEvent || e;
            bus.emit('contextmenu:tree', {
                x: native2.clientX,
                y: native2.clientY,
                element: el
            });
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

    /* ============================================================ */
    function Palette(rootEl) {
        this.root = $(rootEl);
        this.active = null;
        this._collapsed = {};
        this._render();
        var self = this;
        $('#wb-palette-filter').bind('keyup input', function () { self._filter($(this).val()); });
        bus.on('palette:placed',    function () { self.clearActive(); });
        bus.on('palette:cancelled', function () { self.clearActive(); });
    }

    Palette.prototype._render = function () {
        var self = this;
        this.root.empty();
        var ul = $('<ul class="wb-tree wb-tree-root"></ul>');

        ComponentRegistry.categories().forEach(function (cat) {
            var catId = 'cat_' + cat.name;
            var visible = cat.components.filter(function (c) { return !c.hidden; });
            if (visible.length === 0) return;

            var collapsed = !!self._collapsed[catId];

            var li = $('<li></li>');
            var toggle = $('<span class="wb-toggle"></span>')
                .text(collapsed ? '+' : '\u2212')
                .toggleClass('wb-leaf', visible.length === 0);
            li.append(toggle);
            li.append($('<span class="wb-tree-label wb-cat-label"></span>').text(cat.name));

            var cul = $('<ul></ul>');
            visible.forEach(function (c) {
                var cli = $('<li></li>');
                cli.append($('<span class="wb-toggle wb-leaf"></span>'));
                var comp = $('<span class="wb-tree-label wb-comp-label wb-palette-btn"></span>')
                    .text(c.caption)
                    .attr('data-comp-id', c.id);
                comp.click(function () { self._select(c, comp); });
                cli.append(comp);
                cul.append(cli);
            });
            if (collapsed) cul.hide();
            li.append(cul);
            ul.append(li);

            toggle.click(function (e) {
                e.stopPropagation();
                var nowCollapsed = !self._collapsed[catId];
                self._collapsed[catId] = nowCollapsed;
                toggle.text(nowCollapsed ? '+' : '\u2212');
                if (nowCollapsed) cul.hide(); else cul.show();
            });
        });
        this.root.append(ul);
    };

    Palette.prototype._select = function (comp, btn) {
        this.clearActive();
        btn.addClass('wb-active');
        this.active = comp;
        $('#wb-domtree').addClass('wb-drop-mode');
        bus.emit('palette:selected', { component: comp });
    };

    Palette.prototype.clearActive = function () {
        this.root.find('.wb-palette-btn').removeClass('wb-active');
        this.active = null;
        $('#wb-domtree').removeClass('wb-drop-mode');
    };

    Palette.prototype._filter = function (txt) {
        txt = (txt || '').toLowerCase();
        var $root = this.root;
        $root.find('ul').show();
        $root.find('li').show();
        if (!txt) return;
        $root.find('li').each(function () {
            var li = $(this);
            var $comp = li.children('.wb-comp-label');
            if ($comp.length) {
                var match = $comp.text().toLowerCase().indexOf(txt) >= 0;
                li.toggle(match);
            }
        });
        $root.children('ul').children('li').each(function () {
            var li = $(this);
            var anyVisible = li.find('.wb-comp-label:visible').length > 0;
            var selfLabel = li.children('.wb-cat-label').text().toLowerCase();
            var selfMatch = selfLabel.indexOf(txt) >= 0;
            li.toggle(anyVisible || selfMatch);
            if (anyVisible) {
                li.children('ul').show();
                li.children('.wb-toggle').text('\u2212');
            }
        });
    };

    /* ============================================================ */
    function Inspector(rootEl) {
        this.root = $(rootEl);
        this.element = null;
        this.def = null;
        this.tab = 'properties';
        this._bindTabs();
        var self = this;
        bus.on('selection:changed', function (e) { self.show(e.element); });
        bus.on('canvas:changed',    function ()  { if (self.element) self.refresh(); });
    }

    Inspector.prototype._bindTabs = function () {
        var self = this;
        this.root.find('.wb-itab').click(function () {
            self.root.find('.wb-itab').removeClass('wb-active');
            $(this).addClass('wb-active');
            self.tab = $(this).attr('data-tab');
            self.root.find('.wb-itab-pane').hide();
            self.root.find('.wb-itab-pane[data-tab="' + self.tab + '"]').show();
        });
    };

    Inspector.prototype.show = function (el) {
        this.element = el || null;
        if (!el) {
            this.def = null;
            this.root.find('#wb-inspector-target').text('—');
            this.root.find('.wb-itab-pane').empty();
            return;
        }
        this.def = ComponentRegistry.match(el);
        var custom = el.getAttribute && el.getAttribute('data-wb-tag');
        var displayTag = custom || el.tagName.toLowerCase();
        this.root.find('#wb-inspector-target')
            .text('<' + displayTag + '>' + (this.def ? ' — ' + this.def.caption : ''));
        this.refresh();
    };

    Inspector.prototype.refresh = function () {
        var self = this;
        ['properties', 'styles', 'events'].forEach(function (tab) {
            var pane = self.root.find('.wb-itab-pane[data-tab="' + tab + '"]');
            pane.empty();
            var schema = (self.def && self.def.schema && self.def.schema[tab]) || [];
            if (!schema.length) { pane.html('<div class="wb-empty">No ' + tab + '</div>'); return; }
            schema.forEach(function (f) { pane.append(self._row(tab, f)); });
        });
    };

    Inspector.prototype._get = function (tab, f) {
        var el = this.element; if (!el) return '';
        if (tab === 'properties') {
            if (f.get) return f.get(el);
            if (f.attr) return el.getAttribute(f.name) || '';
            var v = el[f.name]; return (v == null) ? '' : v;
        }
        if (tab === 'styles') return el.style[f.name] || '';
        if (tab === 'events') return el.getAttribute(f.name) || '';
        return '';
    };

    Inspector.prototype._set = function (tab, f, v) {
        var el = this.element; if (!el) return;

        var cleanClass = function (node) {
            if (node && node.nodeType === 1 && typeof node.className === 'string' && node.className.trim() === '') {
                node.removeAttribute('class');
            }
        };

        if (tab === 'properties') {
            if (f.set) f.set(el, v);
            else if (f.type === 'boolean') el[f.name] = !!v;
            else if (f.attr) el.setAttribute(f.name, v);
            else el[f.name] = v;
            if (f.name === 'className') cleanClass(el);
        } else if (tab === 'styles') {
            if (v === '' || v == null) {
                try { el.style.removeProperty(f.name); } catch (e) { el.style[f.name] = ''; }
            } else {
                el.style[f.name] = v;
            }
        } else if (tab === 'events') {
            if (v) el.setAttribute(f.name, v); else el.removeAttribute(f.name);
        }

        var canvas = global.IDE && global.IDE._canvas;
        if (canvas && canvas.refreshPreview) {
            var isCmp = el.getAttribute && el.getAttribute('data-wb-tag');
            var isRoot = canvas.getRootContainer && canvas.getRootContainer() === el;
            if (isCmp || isRoot) canvas.refreshPreview(el);
        }

        bus.emit('canvas:changed');
    };

    Inspector.prototype._row = function (tab, f) {
        var row = $('<div class="wb-row"></div>');
        row.append($('<div class="wb-row-name"></div>').text(f.caption || f.name));
        var box = $('<div class="wb-row-value"></div>').append(this._editor(tab, f));
        row.append(box);
        return row;
    };

    Inspector.prototype._editor = function (tab, f) {
        var self = this, t = f.type || 'string', val = self._get(tab, f);
        var commit = function (v) { self._set(tab, f, v); };

        if (t === 'boolean') {
            var cb = $('<input type="checkbox">').prop('checked', !!val);
            cb.change(function () { commit(cb.prop('checked')); });
            return cb;
        }
        if (t === 'enum') {
            var sel = $('<select></select>');
            (f.values || []).forEach(function (v) {
                sel.append($('<option></option>').val(v).text(v === '' ? '(not set)' : v));
            });
            sel.val(val == null ? '' : val);
            sel.change(function () { commit(sel.val()); });
            return sel;
        }
        if (t === 'color') {
            var wrap = $('<div class="wb-color"></div>');
            var ci = $('<input type="color">').val(val || '#000000');
            var ti = $('<input type="text" class="wb-color-text">').val(val || '');
            ci.change(function () { ti.val(ci.val()); commit(ci.val()); });
            ti.change(function () { ci.val(ti.val() || '#000000'); commit(ti.val()); });
            wrap.append(ci).append(ti);
            return wrap;
        }
        if (t === 'length') {
            var lw = $('<div class="wb-length"></div>');
            var num = val ? parseFloat(val) : '';
            var um = String(val).match(/[a-z%]+$/i);
            var unit = um ? um[0] : 'px';
            if (val === 'auto') { num = ''; unit = 'auto'; }
            var ni = $('<input type="number" class="wb-length-num">').val(isNaN(num) ? '' : num);
            var us = $('<select class="wb-length-unit">' +
                '<option>px</option><option>%</option><option>em</option>' +
                '<option>rem</option><option>pt</option><option>auto</option>' +
                '</select>').val(unit);
            var upd = function () {
                if (us.val() === 'auto') commit('auto');
                else if (ni.val() === '') commit('');
                else commit(ni.val() + us.val());
            };
            ni.change(upd); us.change(upd);
            lw.append(ni).append(us);
            return lw;
        }
        if (t === 'number') {
            var nn = $('<input type="number">').val(val === '' ? '' : val);
            nn.change(function () { commit(nn.val()); });
            return nn;
        }
        if (t === 'text') {
            var ta = $('<textarea rows="3" style="width:100%;box-sizing:border-box;font-family:inherit;font-size:11px;border:1px solid #c0c0c0;"></textarea>').val(val || '');
            ta.change(function () { commit(ta.val()); });
            return ta;
        }
        if (t === 'code') {
            var btn = $('<button type="button" class="wb-code-btn">Edit…</button>');
            btn.click(function () {
                var current = self._get(tab, f);
                var ed = $('<textarea class="wb-code-editor"></textarea>').val(current);
                Modal.open({
                    title: f.caption || f.name,
                    content: ed[0],
                    onOk: function () { commit(ed.val()); }
                });
            });
            return btn;
        }
        var inp = $('<input type="text">').val(val == null ? '' : val);
        inp.change(function () { commit(inp.val()); });
        return inp;
    };

    global.DomTree   = DomTree;
    global.Palette   = Palette;
    global.Inspector = Inspector;
})(window, jQuery);
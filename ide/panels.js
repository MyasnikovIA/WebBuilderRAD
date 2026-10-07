/* DomTree, Palette, Inspector. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    /* ============================================================
       DomTree — дерево структуры
       (+ drag & drop, + складные узлы, + вставка из палитры)
       ============================================================ */
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
            self._observeBody();
            self.rebuild();
        });
        bus.on('canvas:changed',   function () { self.rebuild(); });
        bus.on('canvas:refreshed', function () { self.rebuild(); });
        bus.on('selection:changed',function (e) { self.highlight(e.element); });

        bus.on('canvas:changed', function () {
            if (!self.canvas && global.IDE && global.IDE._canvas) {
                self.canvas = global.IDE._canvas;
                self._observeBody();
                self.rebuild();
            }
        });

        $('#wb-domtree-filter').bind('keyup input', function () { self._filter($(this).val()); });
        this._installDnD();
    }

    /* ---------- MutationObserver ---------- */
    DomTree.prototype._observeBody = function () {
        if (this._mo) { this._mo.disconnect(); this._mo = null; }
        if (!this.canvas || !global.MutationObserver) return;
        var self = this;
        var body = this.canvas.getBody();
        if (!body) return;
        this._mo = new global.MutationObserver(function () { self._scheduleRebuild(); });
        this._mo.observe(body, { childList: true, subtree: true });
    };

    DomTree.prototype._scheduleRebuild = function () {
        if (this._rebuildScheduled) return;
        this._rebuildScheduled = true;
        var self = this;
        setTimeout(function () { self._rebuildScheduled = false; self.rebuild(); }, 0);
    };

    /* ---------- корень и построение ---------- */
    DomTree.prototype._getRoot = function () { return $('#' + this.rootId); };

    DomTree.prototype.rebuild = function () {
        if (!this.canvas) return;
        var $root = this._getRoot();
        if (!$root.length) return;

        var body = this.canvas.getBody();
        if (!body) return;

        $root.empty();
        var ul = $('<ul class="wb-tree wb-tree-root"></ul>');
        this._build(body, ul);
        $root.append(ul);

        var sel = this.canvas.getSelected();
        if (sel) this.highlight(sel);
    };

    DomTree.prototype._build = function (el, parentUl) {
        if (!el || el.nodeType !== 1) return;
        var self = this;
        var li = $('<li></li>');
        var isBody = (el === this.canvas.getBody());
        var nid = this._nid(el);

        var kids = [];
        for (var i = 0; i < el.children.length; i++) kids.push(el.children[i]);
        var hasKids = kids.length > 0;
        var collapsed = !!this._collapsed[nid];

        /* toggle [+] / [−] */
        var toggle = $('<span class="wb-toggle"></span>')
            .text(collapsed ? '+' : '\u2212')
            .toggleClass('wb-leaf', !hasKids)
            .attr('data-node-id', nid);
        li.append(toggle);

        /* label */
        var label = $('<span class="wb-tree-label"></span>')
            .text(this._label(el))
            .attr('data-node-id', nid)
            .attr('draggable', isBody ? 'false' : 'true');
        li.append(label);

        /* дети */
        if (hasKids) {
            var cul = $('<ul></ul>');
            for (var j = 0; j < kids.length; j++) self._build(kids[j], cul);
            if (collapsed) cul.hide();
            li.append(cul);
        }
        parentUl.append(li);

        /* ---------- события label ---------- */
        label.click(function (e) {
            e.stopPropagation();
            /* Если активен компонент из палитры — вставляем сюда. */
            if (self.canvas && self.canvas.pending) {
                var zone = self._zoneFromEvent(this, e.originalEvent || e);
                self._clearIndicators();
                self._insertFromPalette(self.canvas.pending, el, zone);
                return;
            }
            self.canvas.select(el);
        });

        label.bind('mouseenter', function () {
            label.addClass('wb-hover');
        });

        label.bind('mousemove', function (e) {
            /* Показываем индикатор зоны вставки, только если из палитры
               выбран компонент и не идёт перетаскивание. */
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
        var tag = el.tagName.toLowerCase();
        var id  = el.id ? '#' + el.id : '';
        var cls = '';
        if (typeof el.className === 'string' && el.className) {
            var parts = el.className.split(/\s+/).filter(function (c) {
                return c && c !== 'wb-selected' && c !== 'wb-hover';
            });
            if (parts.length) cls = '.' + parts.join('.');
        }
        return tag + id + cls;
    };

    DomTree.prototype._nid = function (el) {
        if (!el.__wb_nid) el.__wb_nid = 'n' + (++_idCounter);
        return el.__wb_nid;
    };

    /* ---------- поиск элемента по nid ---------- */
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
        var body = this.canvas.getBody();
        if (!body) return null;
        return this._findByNid(body, nid);
    };

    /* ---------- выделение в дереве ---------- */
    DomTree.prototype.highlight = function (el) {
        var $root = this._getRoot();
        $root.find('.wb-tree-label').removeClass('wb-selected');
        if (!el) return;

        if (!el.__wb_nid) {
            var body = this.canvas && this.canvas.getBody();
            if (body && body.contains(el)) { this.rebuild(); return; }
        }

        var nid = el.__wb_nid;
        if (!nid) return;
        var $lab = $root.find('.wb-tree-label[data-node-id="' + nid + '"]');
        if (!$lab.length) return;

        /* раскрыть всех родителей выделенного узла */
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

    /* ---------- фильтр ---------- */
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

    /* ============================================================
       Вставка компонента из палитры по клику в дереве
       ============================================================ */

    /* Вычислить зону по позиции курсора (верх 25% / середина / низ 25%) */
    DomTree.prototype._zoneFromEvent = function (labelEl, nativeEvent) {
        var rect = labelEl.getBoundingClientRect();
        var y = nativeEvent.clientY - rect.top;
        var h = rect.height || 1;
        if (y < h * 0.25) return 'before';
        if (y > h * 0.75) return 'after';
        return 'inside';
    };

    DomTree.prototype._insertFromPalette = function (def, target, zone) {
        var canvas = this.canvas;
        if (!canvas || !def || !target) return;

        var doc  = canvas.getDoc();
        var body = canvas.getBody();
        if (!body) return;

        /* у body только inside */
        if (target === body) zone = 'inside';

        var el = def.create ? def.create(doc) : doc.createElement(def.tagName);
        el.setAttribute('data-cmptype', def.id);

        try {
            if (zone === 'inside') {
                target.appendChild(el);
            } else if (zone === 'before') {
                target.parentNode.insertBefore(el, target);
            } else if (zone === 'after') {
                target.parentNode.insertBefore(el, target.nextSibling);
            }
        } catch (e) {
            console.error('[DomTree] insert failed', e);
            return;
        }

        /* сбрасываем ожидание палитры */
        canvas.pending = null;
        bus.emit('palette:placed');

        /* снимаем выделение со всех, выделяем новый */
        var prev = doc.querySelectorAll('.wb-selected');
        for (var i = 0; i < prev.length; i++) prev[i].classList.remove('wb-selected');
        el.classList.add('wb-selected');

        /* перестраиваем дерево + обновляем инспектор + History */
        bus.emit('canvas:changed');
        bus.emit('selection:changed', { element: el });
    };

    /* ============================================================
       Drag & drop: перетаскивание узлов дерева
       ============================================================ */
    DomTree.prototype._installDnD = function () {
        var self = this;
        var $root = this._getRoot();

        $root.delegate('.wb-tree-label', 'dragstart', function (e) {
            var el = self._labelToElement(this);
            var body = self.canvas && self.canvas.getBody();
            if (!el || !body || el === body) { e.preventDefault(); return false; }
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
            if (!self._canDrop(self._dragEl, target)) {
                if (native && native.dataTransfer) native.dataTransfer.dropEffect = 'none';
                return;
            }
            e.preventDefault();
            if (native && native.dataTransfer) native.dataTransfer.dropEffect = 'move';
            var zone = self._hitZone(this, native);
            self._clearIndicators();
            $(this).addClass('wb-drop-' + zone);
        });

        $root.delegate('.wb-tree-label', 'dragleave', function () {
            $(this).removeClass('wb-drop-before wb-drop-after wb-drop-inside');
        });

        $root.delegate('.wb-tree-label', 'drop', function (e) {
            if (!self._dragEl) return;
            var target = self._labelToElement(this);
            if (!self._canDrop(self._dragEl, target)) return;
            e.preventDefault();
            e.stopPropagation();
            var zone = self._hitZone(this, e.originalEvent);
            self._performDrop(self._dragEl, target, zone);
            self._endDrag();
            return false;
        });
    };

    DomTree.prototype._hitZone = function (labelEl, native) {
        return this._zoneFromEvent(labelEl, native);
    };

    DomTree.prototype._canDrop = function (src, dst) {
        if (!src || !dst) return false;
        if (src === dst) return false;
        if (src.contains(dst)) return false;
        var body = this.canvas.getBody();
        if (!body) return false;
        if (dst === body) return true;
        if (!body.contains(dst)) return false;
        return true;
    };

    DomTree.prototype._performDrop = function (src, dst, zone) {
        var body = this.canvas.getBody();
        if (!body) return;
        if (dst === body) zone = 'inside';

        try {
            if (zone === 'inside') {
                dst.appendChild(src);
            } else if (zone === 'before') {
                dst.parentNode.insertBefore(src, dst);
            } else if (zone === 'after') {
                dst.parentNode.insertBefore(src, dst.nextSibling);
            }
        } catch (e) {
            console.error('[DomTree] drop failed', e);
            return;
        }

        var doc = this.canvas.getDoc();
        var prev = doc.querySelectorAll('.wb-selected');
        for (var i = 0; i < prev.length; i++) prev[i].classList.remove('wb-selected');
        src.classList.add('wb-selected');

        bus.emit('canvas:changed');
        bus.emit('selection:changed', { element: src });
    };

    DomTree.prototype._clearIndicators = function () {
        this._getRoot()
            .find('.wb-drop-before, .wb-drop-after, .wb-drop-inside')
            .removeClass('wb-drop-before wb-drop-after wb-drop-inside');
    };

    DomTree.prototype._endDrag = function () {
        this._dragEl = null;
        this._clearIndicators();
        this._getRoot().find('.wb-dragging').removeClass('wb-dragging');
    };

    /* ============================================================
       Palette — палитра компонентов (в виде дерева)
       ============================================================ */
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
            var collapsed = !!self._collapsed[catId];

            var li = $('<li></li>');

            var toggle = $('<span class="wb-toggle"></span>')
                .text(collapsed ? '+' : '\u2212')
                .toggleClass('wb-leaf', visible.length === 0);
            li.append(toggle);

            var catLabel = $('<span class="wb-tree-label wb-cat-label"></span>').text(cat.name);
            li.append(catLabel);

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

            if (visible.length) {
                toggle.click(function (e) {
                    e.stopPropagation();
                    var nowCollapsed = !self._collapsed[catId];
                    self._collapsed[catId] = nowCollapsed;
                    toggle.text(nowCollapsed ? '+' : '\u2212');
                    if (nowCollapsed) cul.hide(); else cul.show();
                });
            }
        });

        this.root.append(ul);
    };

    Palette.prototype._select = function (comp, btn) {
        this.clearActive();
        btn.addClass('wb-active');
        this.active = comp;
        /* подсветить дерево Structure как приёмник вставки */
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

    /* ============================================================
       Inspector — Object Inspector (Delphi 7 style)
       ============================================================ */
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
        this.root.find('#wb-inspector-target')
            .text('<' + el.tagName.toLowerCase() + '>' + (this.def ? ' — ' + this.def.caption : ''));
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
        if (tab === 'properties') {
            if (f.set) f.set(el, v);
            else if (f.type === 'boolean') el[f.name] = !!v;
            else if (f.attr) el.setAttribute(f.name, v);
            else el[f.name] = v;
        } else if (tab === 'styles') {
            if (v === '' || v == null) {
                try { el.style.removeProperty(f.name); } catch (e) { el.style[f.name] = ''; }
            } else {
                el.style[f.name] = v;
            }
        } else if (tab === 'events') {
            if (v) el.setAttribute(f.name, v); else el.removeAttribute(f.name);
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
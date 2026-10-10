/* DomTree, Palette, Inspector + встроенный ProjectFilePicker. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    var VOID_TAGS = { IMG:1, INPUT:1, BR:1, HR:1, META:1, LINK:1, AREA:1, BASE:1,
        COL:1, EMBED:1, SOURCE:1, TRACK:1, WBR:1 };

    var STRICT_HEAD_TAGS = { meta:1, title:1, base:1 };

    var SERVICE_CLASSES = { 'wb-selected': 1, 'wb-hover': 1, 'wb-moving': 1 };

    function isServiceClass(c) { return !!SERVICE_CLASSES[c]; }

    function stripServiceClasses(cls) {
        if (!cls) return '';
        return String(cls).split(/\s+/).filter(function (c) {
            return c && !isServiceClass(c);
        }).join(' ');
    }

    function getServiceClasses(cls) {
        if (!cls) return '';
        return String(cls).split(/\s+/).filter(function (c) {
            return c && isServiceClass(c);
        }).join(' ');
    }

    var PARENT_ONLY = {
        cmpactionvar:    ['cmpaction', 'cmpsubaction'],
        cmpsubaction:    ['cmpaction', 'cmpsubaction'],
        cmpsubactionvar: 'cmpsubaction',
        cmpdatasetvar:   'cmpdataset',
        cmpfetchvar:     'cmpfetch',
        cmpmodulevar:    'cmpmodule',
        cmpcomboitem:    'cmpcombobox',
        cmpfilteritem:   'cmpfilter',
        cmpcolumn:       'cmpgrid',
        cmpgridfooter:   'cmpgrid',
        cmptreecolumn: 'cmptree',
        cmptreefooter: 'cmptree',
        cmptabsheet:     'cmppagecontrol',
        cmplayoutrow:    'cmplayout',
        cmpradioitem: 'cmpradiogroup',
        cmplayoutcell:   'cmplayoutrow',
        cmppopupitem:      ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        cmppopupgroupitem: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        cmptagitem:      'cmpbuttonedit',
        cmpselectlistitem: 'cmpselectlist'
    };

    /* ============================================================
       Имена полей, которые трактуются как «ссылка на файл/ресурс»:
       к ним автоматически добавляется кнопка выбора файла из проекта.
       Отключить автодетект: { name: 'data', type: 'string', filePicker: false }
       ============================================================ */
    var FILE_LIKE_NAMES = {
        'src': 1, 'href': 1, 'action': 1, 'srcset': 1, 'poster': 1,
        'icon': 1, 'path': 1, 'module': 1, 'url': 1, 'link': 1, 'file': 1,
        'formaction': 1, 'cite': 1, 'longdesc': 1, 'usemap': 1, 'codebase': 1,
        'manifest': 1, 'ping': 1, 'download': 1, 'profile': 1, 'archive': 1,
        'classid': 1, 'background': 1, 'img': 1, 'image': 1,
        'content': 1, 'logo': 1
    };

    var IMAGE_LIKE_NAMES = {
        'src': 1, 'poster': 1, 'icon': 1, 'logo': 1, 'img': 1, 'image': 1
    };

    function isFileField(f) {
        if (!f) return false;
        if (f.filePicker === false) return false;
        if (f.type === 'FILE') return true;
        if (f.type === 'image') return true;
        if (f.type === 'string' || !f.type) {
            var n = String(f.name || '').toLowerCase();
            if (FILE_LIKE_NAMES[n]) return true;
        }
        return false;
    }

    function isImageField(f) {
        if (!f) return false;
        if (f.type === 'image') return true;
        var n = String(f.name || '').toLowerCase();
        return !!IMAGE_LIKE_NAMES[n];
    }

    function resolvePreviewSrc(value) {
        if (!value) return '';
        var v = String(value);
        if (/^data:/i.test(v)) return v;
        if (/^https?:\/\//i.test(v)) return v;
        var pm = global.IDE && global.IDE.projectManager;
        if (pm && pm.current && pm.current.files) {
            var f = pm.current.files[v];
            if (f && f.content) return f.content;
        }
        return '';
    }

    /* ============================================================
       Извлечение JS-функций из cmpScript / component[cmptype="Script"]
       ============================================================ */

    function parseArgsList(raw) {
        if (!raw) return [];
        return String(raw).split(',')
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });
    }

    function buildCallSignature(name, args) {
        var out = args.slice();
        if (out.length > 0) {
            var first = out[0];
            if (first === 'dom' || /^_this/i.test(first)) out[0] = 'this';
        }
        return name + '(' + out.join(', ') + ');';
    }

    function eventNamePriority(name) {
        var last = String(name).split('.').pop();
        return /^on/i.test(last) ? 0 : 1;
    }

    function collectFormFunctions(canvas) {
        var out = [];
        if (!canvas || !canvas.getDoc) return out;
        var doc = canvas.getDoc();
        if (!doc) return out;

        var sources = [];
        var scripts = doc.querySelectorAll('cmpscript, component[cmptype="Script"], script');
        for (var i = 0; i < scripts.length; i++) {
            var s = scripts[i];
            var tag = s.tagName.toLowerCase();
            if (tag === 'script' && s.getAttribute('src')) continue;
            var raw = s.textContent || '';
            var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
            sources.push(m ? m[1] : raw);
        }
        if (!sources.length) return out;

        var combined = sources.join('\n');
        var seen = {};

        function add(name, argsRaw) {
            if (!name || seen[name]) return;
            seen[name] = 1;
            var args = parseArgsList(argsRaw);
            out.push({ name: name, args: args, call: buildCallSignature(name, args) });
        }

        var reAssign = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*function\s*\(([^)]*)\)/g;
        var m;
        while ((m = reAssign.exec(combined)) !== null) add(m[1], m[2]);

        var reFunc = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;
        while ((m = reFunc.exec(combined)) !== null) add(m[1], m[2]);

        out.sort(function (a, b) {
            var pa = eventNamePriority(a.name);
            var pb = eventNamePriority(b.name);
            if (pa !== pb) return pa - pb;
            return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
        });

        return out;
    }

    var EVENT_CAMEL_MAP = {
        onclick: 'Click', ondblclick: 'DblClick',
        onmousedown: 'MouseDown', onmouseup: 'MouseUp',
        onmouseover: 'MouseOver', onmouseout: 'MouseOut', onmousemove: 'MouseMove',
        onkeydown: 'KeyDown', onkeyup: 'KeyUp', onkeypress: 'KeyPress',
        onchange: 'Change', oninput: 'Input',
        onfocus: 'Focus', onblur: 'Blur',
        onsubmit: 'Submit', onreset: 'Reset',
        onload: 'Load', onerror: 'Error'
    };

    function eventNameToCamel(name) {
        var lc = String(name || '').toLowerCase();
        if (EVENT_CAMEL_MAP[lc]) return EVENT_CAMEL_MAP[lc];
        var rest = lc.replace(/^on/, '');
        return rest.charAt(0).toUpperCase() + rest.slice(1);
    }

    function isFunctionDeclared(code, name) {
        if (!code || !name) return false;
        var esc = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re1 = new RegExp('\\b' + esc + '\\s*=\\s*function');
        if (re1.test(code)) return true;
        var lastSeg = String(name).split('.').pop();
        if (lastSeg && lastSeg !== name) {
            var escLast = lastSeg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var re2 = new RegExp('\\bfunction\\s+' + escLast + '\\s*\\(');
            if (re2.test(code)) return true;
        }
        return false;
    }

    /* ============================================================
       DomTree
       ============================================================ */
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

    /* ============================================================
       Palette
       ============================================================ */

    function Palette(rootEl) {
        this.root = $(rootEl);
        this.active = null;
        this._collapsed = {};
        this._collapseAllOnRender = true;
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
        var tree = ComponentRegistry.categoryTree();

        if (this._collapseAllOnRender) {
            this._collapseAllOnRender = false;
            this._collapsed = {};
            for (var i = 0; i < tree.length; i++) {
                var node = tree[i];
                this._collapsed['cat_' + node.name] = true;
                for (var j = 0; j < node.subcategories.length; j++) {
                    this._collapsed['cat_' + node.name + '/' + node.subcategories[j].name] = true;
                }
            }
        }

        for (var k = 0; k < tree.length; k++) {
            ul.append(self._renderTopCategory(tree[k]));
        }
        this.root.append(ul);
    };

    Palette.prototype._renderTopCategory = function (node) {
        var self = this;
        var visibleDirect = node.components.filter(function (c) { return !c.hidden; });
        var visibleSubs = [];
        for (var i = 0; i < node.subcategories.length; i++) {
            var sub = node.subcategories[i];
            var vis = sub.components.filter(function (c) { return !c.hidden; });
            if (vis.length > 0) visibleSubs.push({ name: sub.name, components: vis });
        }

        var li = $('<li></li>');
        if (visibleDirect.length === 0 && visibleSubs.length === 0) return li;

        var catId = 'cat_' + node.name;
        var collapsed = !!this._collapsed[catId];

        var toggle = $('<span class="wb-toggle"></span>')
            .text(collapsed ? '+' : '\u2212')
            .toggleClass('wb-leaf', false);
        li.append(toggle);
        li.append($('<span class="wb-tree-label wb-cat-label"></span>').text(node.name));

        var cul = $('<ul></ul>');
        for (var d = 0; d < visibleDirect.length; d++) cul.append(self._renderComponentLi(visibleDirect[d]));
        for (var s = 0; s < visibleSubs.length; s++) cul.append(self._renderSubCategoryLi(node.name, visibleSubs[s]));

        if (collapsed) cul.hide();
        li.append(cul);

        toggle.click(function (e) {
            e.stopPropagation();
            var now = !self._collapsed[catId];
            self._collapsed[catId] = now;
            toggle.text(now ? '+' : '\u2212');
            if (now) cul.hide(); else cul.show();
        });

        return li;
    };

    Palette.prototype._renderSubCategoryLi = function (parentName, sub) {
        var self = this;
        var li = $('<li></li>');
        var catId = 'cat_' + parentName + '/' + sub.name;
        var collapsed = !!this._collapsed[catId];

        var toggle = $('<span class="wb-toggle"></span>')
            .text(collapsed ? '+' : '\u2212')
            .toggleClass('wb-leaf', false);
        li.append(toggle);
        li.append($('<span class="wb-tree-label wb-cat-label"></span>').text(sub.name));

        var cul = $('<ul></ul>');
        for (var i = 0; i < sub.components.length; i++) {
            cul.append(self._renderComponentLi(sub.components[i]));
        }
        if (collapsed) cul.hide();
        li.append(cul);

        toggle.click(function (e) {
            e.stopPropagation();
            var now = !self._collapsed[catId];
            self._collapsed[catId] = now;
            toggle.text(now ? '+' : '\u2212');
            if (now) cul.hide(); else cul.show();
        });

        return li;
    };

    Palette.prototype._renderComponentLi = function (c) {
        var self = this;
        var cli = $('<li></li>');
        cli.append($('<span class="wb-toggle wb-leaf"></span>'));

        var comp = $('<span></span>')
            .addClass('wb-tree-label wb-comp-label wb-palette-btn')
            .attr('data-comp-id', c.id);

        if (c.iconUrl) {
            var $img = $('<img/>')
                .addClass('wb-palette-icon')
                .attr('alt', '')
                .attr('src', c.iconUrl)
                .bind('error', function () { $(this).remove(); });
            comp.append($img);
        }
        comp.append(document.createTextNode(c.caption));

        comp.click(function () { self._select(c, comp); });
        cli.append(comp);
        return cli;
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

        if (!txt) {
            $root.find('ul, li').show();
            $root.find('li').each(function () {
                var $t = $(this).children('.wb-toggle').first();
                if (!$t.length || $t.hasClass('wb-leaf')) return;
                var $ul = $(this).children('ul').first();
                if ($ul.length) $ul.show();
                $t.text('\u2212');
            });
            return;
        }

        $root.find('li').hide();
        $root.find('ul').hide();

        $root.find('.wb-comp-label').each(function () {
            var $lab = $(this);
            if ($lab.text().toLowerCase().indexOf(txt) < 0) return;
            $lab.show();
            var $li = $lab.closest('li');
            $li.show();
            $li.parents('li').show();
            $li.parents('ul').show();
        });

        $root.find('.wb-cat-label').each(function () {
            var $lab = $(this);
            if ($lab.text().toLowerCase().indexOf(txt) < 0) return;
            var $li = $lab.closest('li');
            $li.show();
            $li.find('ul, li, .wb-comp-label').show();
            $li.parents('li').show();
            $li.parents('ul').show();
        });
    };

    /* ============================================================
       ProjectFilePicker — встроенный модуль выбора файла из проекта.
       Открывает модальное окно с деревом файлов текущего проекта.
       Пользователь может кликнуть по файлу (или ввести путь вручную
       в поле внизу) и подтвердить выбор.
       ============================================================ */
    var ProjectFilePicker = {
        open: function (opts) {
            opts = opts || {};
            var pm = global.IDE && global.IDE.projectManager;
            if (!pm || !pm.current) {
                alert('Проект не выбран. Выберите проект в панели Project.');
                return;
            }
            var project = pm.current;

            var host = document.createElement('div');
            host.className = 'wb-filepicker';
            host.style.cssText =
                'display:flex;flex-direction:column;height:100%;gap:4px;';

            var filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.placeholder = 'filter…';
            filterInput.className = 'wb-filepicker-filter';
            host.appendChild(filterInput);

            var treeBox = document.createElement('div');
            treeBox.className = 'wb-filepicker-tree';
            host.appendChild(treeBox);

            var rootUl = document.createElement('ul');
            rootUl.className = 'wb-ptree wb-ptree-root';
            treeBox.appendChild(rootUl);

            var pathInput = document.createElement('input');
            pathInput.type = 'text';
            pathInput.className = 'wb-filepicker-path';
            pathInput.placeholder = 'путь или выберите файл в списке';
            pathInput.value = opts.value || '';
            host.appendChild(pathInput);

            function buildNode(prefix, parentUl) {
                var files = project.files || {};
                var searchPrefix = prefix ? prefix + '/' : '';
                var folders = {};
                var fileList = [];

                for (var p in files) {
                    if (!files.hasOwnProperty(p)) continue;
                    if (p === '.keep' || /(^|\/)\.keep$/.test(p)) continue;
                    if (searchPrefix && p.indexOf(searchPrefix) !== 0) continue;

                    var rest = prefix ? p.substring(searchPrefix.length) : p;
                    if (!rest) continue;
                    var slash = rest.indexOf('/');
                    if (slash < 0) fileList.push(rest);
                    else folders[rest.substring(0, slash)] = true;
                }

                var folderNames = Object.keys(folders).sort();
                var fileNames = fileList.sort();

                for (var i = 0; i < folderNames.length; i++) {
                    var fname = folderNames[i];
                    var fpath = prefix ? prefix + '/' + fname : fname;

                    var li = document.createElement('li');
                    var toggle = document.createElement('span');
                    toggle.className = 'wb-toggle';
                    toggle.textContent = '−';
                    li.appendChild(toggle);

                    var lbl = document.createElement('span');
                    lbl.className = 'wb-tree-label wb-ptree-folder';
                    lbl.textContent = fname;
                    lbl.setAttribute('data-path', fpath);
                    lbl.setAttribute('data-type', 'folder');
                    li.appendChild(lbl);

                    var ul = document.createElement('ul');
                    buildNode(fpath, ul);
                    li.appendChild(ul);

                    (function (ul, toggle) {
                        toggle.addEventListener('click', function (e) {
                            e.stopPropagation();
                            if (ul.style.display === 'none') {
                                ul.style.display = '';
                                toggle.textContent = '−';
                            } else {
                                ul.style.display = 'none';
                                toggle.textContent = '+';
                            }
                        }, false);
                    })(ul, toggle);

                    parentUl.appendChild(li);
                }

                for (var j = 0; j < fileNames.length; j++) {
                    var name = fileNames[j];
                    var path = prefix ? prefix + '/' + name : name;

                    var li2 = document.createElement('li');
                    var t = document.createElement('span');
                    t.className = 'wb-toggle wb-leaf';
                    li2.appendChild(t);

                    var lbl2 = document.createElement('span');
                    lbl2.className = 'wb-tree-label wb-ptree-file';
                    lbl2.textContent = name;
                    lbl2.setAttribute('data-path', path);
                    lbl2.setAttribute('data-type', 'file');
                    lbl2.setAttribute('title', path);
                    li2.appendChild(lbl2);
                    parentUl.appendChild(li2);
                }
            }
            buildNode('', rootUl);

            function findLabel(t) {
                while (t && t !== treeBox) {
                    if (t.classList && t.classList.contains('wb-tree-label')) return t;
                    t = t.parentNode;
                }
                return null;
            }

            treeBox.addEventListener('click', function (e) {
                var lbl = findLabel(e.target);
                if (!lbl) return;
                var all = treeBox.querySelectorAll('.wb-tree-label');
                for (var i = 0; i < all.length; i++) all[i].classList.remove('wb-selected');
                lbl.classList.add('wb-selected');
                if (lbl.getAttribute('data-type') === 'file') {
                    pathInput.value = lbl.getAttribute('data-path');
                }
            }, false);

            treeBox.addEventListener('dblclick', function (e) {
                var lbl = findLabel(e.target);
                if (!lbl) return;
                if (lbl.getAttribute('data-type') !== 'file') return;
                pathInput.value = lbl.getAttribute('data-path');
                global.Modal.ok();
            }, false);

            filterInput.addEventListener('input', function () {
                var q = (filterInput.value || '').toLowerCase();
                var labels = treeBox.querySelectorAll('.wb-tree-label');
                for (var i = 0; i < labels.length; i++) {
                    var lbl = labels[i];
                    var match = !q || lbl.textContent.toLowerCase().indexOf(q) >= 0;
                    var li = lbl.parentNode;
                    if (li) li.style.display = match ? '' : 'none';
                }
                var uls = treeBox.querySelectorAll('ul');
                for (var j = 0; j < uls.length; j++) uls[j].style.display = '';
            }, false);

            global.Modal.open({
                title: 'Select Project File',
                content: host,
                onOk: function () {
                    var v = pathInput.value || '';
                    if (opts.onPick) opts.onPick(v);
                }
            });

            setTimeout(function () { filterInput.focus(); }, 50);
        }
    };

    /* ============================================================
       Inspector
       ============================================================ */
    function Inspector(rootEl) {
        this.root = $(rootEl);
        this.element = null;
        this.def = null;
        this.tab = 'properties';
        this._internalChange = false;
        this._bindTabs();
        var self = this;
        bus.on('selection:changed', function (e) { self.show(e.element); });
        bus.on('canvas:changed', function () {
            if (self._internalChange) return;
            if (self.element) self.refresh();
        });
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

            /* Хелпер: читаем оригинал пути из data-wb-orig-<name>.
               ProjectResolver кладёт туда исходный путь, когда подменяет
               значение на blob:/data:-URL. */
            var readOrig = function () {
                if (!el.getAttribute) return null;
                var v = el.getAttribute('data-wb-orig-' + f.name);
                return (v == null) ? null : v;
            };

            /* 1. Кастомный getter. Но если он вернул blob:/data:-URL —
                  это подмена resolver'а, отдаём оригинал. */
            if (f.get) {
                var v0 = f.get(el);
                if (typeof v0 === 'string' && /^(blob:|data:)/i.test(v0)) {
                    var o0 = readOrig();
                    if (o0 != null) return o0;
                }
                return v0;
            }

            if (f.name === 'class' || f.name === 'className') {
                var raw = f.attr ? (el.getAttribute('class') || '') : (el.className || '');
                return stripServiceClasses(raw);
            }

            /* 2. У любого поля сначала проверяем orig — это приоритетнее
                  того, что лежит сейчас в атрибуте (там может быть blob:/data:). */
            var orig = readOrig();
            if (orig != null) return orig;

            /* 3. Обычный attr-филд. */
            if (f.attr) return el.getAttribute(f.name) || '';

            /* 4. URL-подобное поле без attr=true: читаем через getAttribute,
                  иначе el.src вернёт абсолютный/blob:-URL. */
            if (isFileField(f)) {
                var av = el.getAttribute && el.getAttribute(f.name);
                if (av != null) return av;
            }

            /* 5. Обычное DOM-свойство. */
            var v = el[f.name];
            return (v == null) ? '' : v;
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
            if (f.set) {
                f.set(el, v);
                /* После кастомного сеттера — подтягиваем resolver,
                   если значение совпадает с файлом проекта. */
                if (global.ProjectResolver && global.ProjectResolver.applyElement) {
                    try { global.ProjectResolver.applyElement(el); } catch (e) {}
                }
            } else if (f.type === 'boolean') {
                var bv = !!v;
                el[f.name] = bv;
                if (f.attr) {
                    if (bv) el.setAttribute(f.name, 'true');
                    else    el.removeAttribute(f.name);
                }
            } else if (f.name === 'class' || f.name === 'className') {
                var preserved = getServiceClasses(el.getAttribute('class') || '');
                var userCls   = stripServiceClasses(v);
                var merged    = (userCls + ' ' + preserved).replace(/\s+/g, ' ').trim();
                if (merged) el.setAttribute('class', merged);
                else el.removeAttribute('class');
            } else if (f.attr || isFileField(f)) {
                /* Обычный HTML-атрибут ИЛИ URL-подобное поле без attr=true:
                   применяем через ProjectResolver, чтобы сразу подменить
                   путь проекта на blob:/data:-URL и сохранить оригинал
                   в data-wb-orig-<name>. */
                if (global.ProjectResolver && global.ProjectResolver.applyToAttribute) {
                    global.ProjectResolver.applyToAttribute(el, f.name, v);
                } else {
                    el.setAttribute(f.name, v);
                }
            } else {
                el[f.name] = v;
            }
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
        if (canvas && canvas.refreshPreviewAndParent) {
            var isCmp  = el.getAttribute && (el.getAttribute('data-wb-tag') || el.getAttribute('cmptype'));
            var isRoot = canvas.getRootContainer && canvas.getRootContainer() === el;
            if (isCmp || isRoot) {
                canvas.refreshPreviewAndParent(el);
            } else if (canvas.refreshPreview) {
                canvas.refreshPreview(el);
            }
        }

        this._internalChange = true;
        bus.emit('canvas:changed');
        this._internalChange = false;
    };

    Inspector.prototype._unset = function (tab, f) {
        var el = this.element;
        if (!el) return;

        if (tab === 'properties') {
            if (typeof f.unset === 'function') {
                f.unset(el);
            } else if (typeof f.set === 'function') {
                f.set(el, '');
            } else if (f.type === 'boolean') {
                el[f.name] = false;
                if (f.attr) el.removeAttribute(f.name);
            } else if (f.attr) {
                el.removeAttribute(f.name);
            } else {
                try { el[f.name] = ''; } catch (e) {}
            }

            if (f.name === 'class' || f.name === 'className') {
                var preserved = getServiceClasses(el.getAttribute('class') || '');
                if (preserved) el.setAttribute('class', preserved);
                else el.removeAttribute('class');
            }
        } else if (tab === 'styles') {
            try { el.style.removeProperty(f.name); }
            catch (e) { el.style[f.name] = ''; }
        } else if (tab === 'events') {
            el.removeAttribute(f.name);
        }

        var canvas = global.IDE && global.IDE._canvas;
        if (canvas && canvas.refreshPreviewAndParent) {
            var isCmp  = el.getAttribute && (el.getAttribute('data-wb-tag') || el.getAttribute('cmptype'));
            var isRoot = canvas.getRootContainer && canvas.getRootContainer() === el;
            if (isCmp || isRoot) {
                canvas.refreshPreviewAndParent(el);
            } else if (canvas.refreshPreview) {
                canvas.refreshPreview(el);
            }
        }

        this._internalChange = true;
        bus.emit('canvas:changed');
        this._internalChange = false;
    };

    Inspector.prototype._row = function (tab, f) {
        if (f.type === 'separator') {
            return $('<div class="wb-row-separator"></div>').text(f.caption || '');
        }
        var self = this;
        var row = $('<div class="wb-row"></div>');
        row.append($('<div class="wb-row-name"></div>').text(f.caption || f.name));
        var box = $('<div class="wb-row-value"></div>').append(this._editor(tab, f));
        row.append(box);

        var del = $('<button type="button" class="wb-row-del"></button>')
            .attr('title', 'Удалить')
            .text('\u00D7');
        del.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(function () { self._unset(tab, f); }, 0);
        });
        row.append(del);

        return row;
    };

    Inspector.prototype._attachSuggest = function (inputNode, suggestList) {
        if (!suggestList || !suggestList.length) return inputNode;
        var listId = 'wb-sug-' + Math.floor(Math.random() * 1e9);
        var dl = document.createElement('datalist');
        dl.id = listId;
        for (var i = 0; i < suggestList.length; i++) {
            var opt = document.createElement('option');
            opt.value = String(suggestList[i]);
            dl.appendChild(opt);
        }
        inputNode.setAttribute('list', listId);

        var wrap = document.createElement('div');
        wrap.className = 'wb-suggest';
        wrap.appendChild(inputNode);
        wrap.appendChild(dl);
        return wrap;
    };

    /* -------- input + [миниатюра] + кнопка выбора файла -------- */
    Inspector.prototype._buildFileRow = function (f, val, commit) {
        var withThumb = isImageField(f);

        var wrap = document.createElement('div');
        wrap.className = 'wb-file';

        var input = document.createElement('input');
        input.type = 'text';
        input.value = (val == null ? '' : val);
        wrap.appendChild(input);

        var thumb = null;
        if (withThumb) {
            thumb = document.createElement('img');
            thumb.className = 'wb-file-thumb';
            thumb.alt = '';
            wrap.appendChild(thumb);
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wb-file-btn';
        btn.title = 'Выбрать файл из проекта';
        btn.textContent = '…';
        wrap.appendChild(btn);

        function refreshThumb() {
            if (!thumb) return;
            var src = resolvePreviewSrc(input.value);
            if (src) {
                thumb.src = src;
                thumb.style.display = '';
            } else {
                thumb.removeAttribute('src');
                thumb.style.display = 'none';
            }
        }
        refreshThumb();

        input.addEventListener('change', function () {
            commit(input.value);
            refreshThumb();
        }, false);

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            ProjectFilePicker.open({
                value: input.value || '',
                onPick: function (path) {
                    input.value = path;
                    commit(path);
                    refreshThumb();
                }
            });
        }, false);

        return wrap;
    };

    /* -------- Редактор поля инспектора -------- */
    Inspector.prototype._editor = function (tab, f) {
        var self = this, t = f.type || 'string', val = self._get(tab, f);
        var commit = function (v) { self._set(tab, f, v); };

        /* ---------- boolean ---------- */
        if (t === 'boolean') {
            var cb = $('<input type="checkbox">').prop('checked', !!val);
            cb.change(function () { commit(cb.prop('checked')); });
            return cb;
        }

        /* ---------- enum ---------- */
        if (t === 'enum') {
            var sel = $('<select></select>');
            (f.values || []).forEach(function (v) {
                sel.append($('<option></option>').val(v).text(v === '' ? '(not set)' : v));
            });
            sel.val(val == null ? '' : val);
            sel.change(function () { commit(sel.val()); });
            return sel;
        }

        /* ---------- color ---------- */
        if (t === 'color') {
            var wrapC = $('<div class="wb-color"></div>');
            var ci = $('<input type="color">').val(val || '#000000');
            var ti = $('<input type="text" class="wb-color-text">').val(val || '');
            ci.change(function () { ti.val(ci.val()); commit(ci.val()); });
            ti.change(function () { ci.val(ti.val() || '#000000'); commit(ti.val()); });
            wrapC.append(ci).append(ti);
            return wrapC;
        }

        /* ---------- length ---------- */
        if (t === 'length') {
            var lw = $('<div class="wb-length"></div>');
            var num = val ? parseFloat(val) : '';
            var um = String(val).match(/[a-z%]+$/i);
            var unit = um ? um[0] : 'px';
            if (val === 'auto') { num = ''; unit = 'auto'; }
            var ni = $('<input type="number" class="wb-length-num">').val(isNaN(num) ? '' : num);
            var us = $('<select class="wb-length-unit">' +
                '<option>px</option><option>%</option><option>em</option>' +
                '<option>rem</option><option>pt</option><option>vh</option>' +
                '<option>vw</option><option>auto</option>' +
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

        /* ---------- number ---------- */
        if (t === 'number') {
            var nn = $('<input type="number">').val(val === '' ? '' : val);
            nn.change(function () { commit(nn.val()); });
            if (f.suggest && f.suggest.length) {
                return $(self._attachSuggest(nn[0], f.suggest));
            }
            return nn;
        }

        /* ---------- FILE / image / URL-имена ---------- */
        if (isFileField(f)) {
            return $(self._buildFileRow(f, val, commit));
        }

        /* ---------- text (многострочный) ---------- */
        if (t === 'text') {
            var ta = $('<textarea rows="3" style="width:100%;box-sizing:border-box;' +
                'font-family:inherit;font-size:11px;border:1px solid #c0c0c0;"></textarea>')
                .val(val || '');
            ta.change(function () { commit(ta.val()); });
            ta.dblclick(function () {
                var editor = new CodeEditor({ value: ta.val() || '', language: 'plaintext' });
                Modal.open({
                    title: (f.caption || f.name) + ' — Edit',
                    content: editor.el,
                    onOk: function () {
                        var v = editor.getValue();
                        ta.val(v);
                        commit(v);
                    }
                });
                setTimeout(function () { editor.focus(); }, 50);
            });
            return ta;
        }

        /* ---------- images ---------- */
        if (t === 'images') {
            var mBtn = $('<button type="button" class="wb-code-btn">Edit…</button>');
            mBtn.click(function () {
                var current = self._get(tab, f) || {};
                global.D3.openImagesEditor(current, function (newMap) { commit(newMap); });
            });
            return mBtn;
        }

        /* ---------- code (события) ---------- */
        if (t === 'code' && tab === 'events') {
            return self._buildEventEditor(f, val, commit);
        }

        /* ---------- code (обычный) ---------- */
        if (t === 'code') {
            var btn = $('<button type="button" class="wb-code-btn">Edit…</button>');
            btn.click(function () {
                var current = self._get(tab, f);
                var editor = new CodeEditor({
                    value: current || '',
                    language: f.language || 'javascript'
                });
                Modal.open({
                    title: f.caption || f.name,
                    content: editor.el,
                    onOk: function () { commit(editor.getValue()); }
                });
                setTimeout(function () { editor.focus(); }, 50);
            });
            return btn;
        }

        /* ---------- code-editor ---------- */
        if (t === 'code-editor') {
            var btn2 = $('<button type="button" class="wb-code-btn">Edit…</button>');
            btn2.click(function () {
                var current = self._get(tab, f);
                var lang = 'xml';
                if (typeof f.language === 'function') lang = f.language(self.element) || 'xml';
                else if (typeof f.language === 'string') lang = f.language;
                var editor = new CodeEditor({ value: current, language: lang });
                Modal.open({
                    title: f.caption || f.name,
                    content: editor.el,
                    onOk: function () { commit(editor.getValue()); }
                });
                setTimeout(function () { editor.focus(); }, 50);
            });
            return btn2;
        }

        /* ---------- string (по умолчанию) ---------- */
        var inp = $('<input type="text">').val(val == null ? '' : val);
        inp.change(function () { commit(inp.val()); });

        if (f.suggest && f.suggest.length) {
            return $(self._attachSuggest(inp[0], f.suggest));
        }

        return inp;
    };

    /* ============================================================
       Events editor: input + dropdown со списком функций формы.
       ============================================================ */
    Inspector.prototype._buildEventEditor = function (f, val, commit) {
        var self = this;
        var evRow = $('<div class="wb-event-row"></div>');

        var evInp = $('<input type="text" class="wb-event-input">').val(val == null ? '' : val);
        var evSel = $('<select class="wb-event-select" title="Выбрать функцию формы"></select>');
        evSel.append($('<option></option>').val('').text('⋯'));

        var canvas = global.IDE && global.IDE._canvas;
        var fns = collectFormFunctions(canvas);
        fns.forEach(function (fn) {
            evSel.append($('<option></option>').val(fn.call).text(fn.call));
        });

        if (val) {
            if (evSel.find('option[value="' + val.replace(/"/g, '\\"') + '"]').length === 0) {
                evSel.append($('<option></option>').val(val).text(val));
            }
            evSel.val(val);
        }

        evInp.change(function () { commit(evInp.val()); });
        evInp.dblclick(function () {
            var current = evInp.val();
            var editor = new CodeEditor({ value: current, language: 'javascript' });
            Modal.open({
                title: f.caption || f.name,
                content: editor.el,
                onOk: function () {
                    var v = editor.getValue();
                    evInp.val(v);
                    commit(v);
                }
            });
            setTimeout(function () { editor.focus(); }, 50);
        });

        evSel.change(function () {
            var v = evSel.val();
            if (!v) return;
            evInp.val(v);
            commit(v);
        });

        evSel.dblclick(function () {
            var v = evSel.val();
            if (v) {
                bus.emit('codeview:show');
                bus.emit('codeview:navigate-function', { signature: v });
                return;
            }
            if (!evInp.val()) {
                var result = self._createEventFunction(f);
                if (result && result.signature) {
                    var call = result.signature;
                    var callName = result.name || call;

                    evInp.val(call);
                    if (evSel.find('option[value="' + call.replace(/"/g, '\\"') + '"]').length === 0) {
                        evSel.append($('<option></option>').val(call).text(call));
                    }
                    evSel.val(call);
                    commit(call);

                    bus.emit('codeview:show');
                    bus.emit('codeview:navigate-function', { signature: call, name: callName });
                }
            }
        });

        evRow.append(evInp).append(evSel);
        return evRow;
    };

    function isM2Element(el) {
        if (!el || el.nodeType !== 1) return false;
        if (!el.getAttribute) return false;
        if (el.getAttribute('data-wb-tag')) return false;
        return !!el.getAttribute('cmptype');
    }

    function findOrCreateScriptContainer(doc, canvas, isM2) {
        if (isM2) {
            var m2Script = doc.querySelector('component[cmptype="Script"]');
            if (m2Script) return { node: m2Script, isFormFunc: true, created: false };
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Script');
            el.appendChild(doc.createTextNode('<![CDATA[\n]]>'));
            var root = canvas.getRootContainer() || canvas.getBody();
            if (root) {
                if (root.firstChild) root.insertBefore(el, root.firstChild);
                else root.appendChild(el);
            }
            return { node: el, isFormFunc: true, created: true };
        }
        var cmpScript = doc.querySelector('cmpscript');
        if (cmpScript) return { node: cmpScript, isFormFunc: true, created: false };
        var el2 = doc.createElement('cmpscript');
        el2.setAttribute('data-wb-tag', 'cmpScript');
        el2.appendChild(doc.createTextNode('<![CDATA[\n]]>'));
        var root2 = canvas.getRootContainer() || canvas.getBody();
        if (root2) {
            if (root2.firstChild) root2.insertBefore(el2, root2.firstChild);
            else root2.appendChild(el2);
        }
        return { node: el2, isFormFunc: true, created: true };
    }

    Inspector.prototype._createEventFunction = function (f) {
        var el = this.element;
        if (!el) return null;
        var canvas = global.IDE && global.IDE._canvas;
        if (!canvas || !canvas.getDoc) return null;
        var doc = canvas.getDoc();
        if (!doc) return null;

        var isM2 = isM2Element(el);
        var camelEvent = eventNameToCamel(f.name);
        var ctrlName = '';
        if (el.getAttribute) ctrlName = el.getAttribute('name') || el.getAttribute('id') || '';
        var funcName = 'on' + camelEvent + ctrlName;

        var container = findOrCreateScriptContainer(doc, canvas, isM2);
        if (!container || !container.node) return null;

        var scriptNode   = container.node;
        var createdScript = container.created;
        var isFormFunc = container.isFormFunc;
        var funcPath = (isFormFunc ? 'Form.' : '') + funcName;

        function applyPlaceholders(str) {
            return String(str)
                .replace(/\{name\}/g, funcName)
                .replace(/\{func\}/g, funcPath)
                .replace(/\{event\}/g, camelEvent)
                .replace(/\{ctrl\}/g, ctrlName);
        }

        var funcBody;
        if (f.template && typeof f.template === 'string') {
            funcBody = applyPlaceholders(f.template);
        } else {
            funcBody = funcPath + ' = function(dom) {\n\n};';
        }

        var callSig;
        if (f.callTemplate && typeof f.callTemplate === 'string') {
            callSig = applyPlaceholders(f.callTemplate);
        } else {
            callSig = funcPath + '(this);';
        }

        var callName = funcPath;
        if (callSig.indexOf(funcPath) < 0) {
            var nm = callSig.match(/^\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/);
            if (nm) callName = nm[1];
        }

        var existingCode = scriptNode.textContent || '';
        if (isFunctionDeclared(existingCode, callName)) {
            return { signature: callSig, name: callName };
        }

        var textNode = null;
        for (var i = 0; i < scriptNode.childNodes.length; i++) {
            var cn = scriptNode.childNodes[i];
            if (cn.nodeType === 3) { textNode = cn; break; }
        }
        if (!textNode) {
            textNode = doc.createTextNode('<![CDATA[\n]]>');
            scriptNode.appendChild(textNode);
        }
        var raw = textNode.nodeValue || '';
        var cdataMatch = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        var innerBody = cdataMatch ? cdataMatch[1] : raw;
        innerBody = innerBody.replace(/\s+$/, '') + '\n\n' + funcBody + '\n';
        textNode.nodeValue = '<![CDATA[' + innerBody + ']]>';

        if (createdScript && canvas._reobserve) canvas._reobserve();

        return { signature: callSig, name: callName };
    };

    global.DomTree   = DomTree;
    global.Palette   = Palette;
    global.Inspector = Inspector;
    global.ProjectFilePicker = ProjectFilePicker;

})(window, jQuery);
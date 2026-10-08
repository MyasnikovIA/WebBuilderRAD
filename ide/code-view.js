/* CodeView — вкладка Code в центральной области.
   Показывает текущую страницу в виде HTML (cleanHtml()), позволяет
   редактировать и применять правки обратно в canvas (loadHtml).

   Двунаправленная навигация:
     - при выборе элемента в дереве (selection:changed) — позиционирует
       курсор редактора на начало исходника этого элемента;
     - при перемещении курсора в редакторе (keyup/mouseup/click) —
       находит ближайший тег, внутри которого стоит курсор, и выделяет
       соответствующий элемент в дереве и на сцене. Работает и во время
       набора текста (когда DOM ещё не перестроен под правки). */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    function CodeView(paneEl) {
        this.pane = $(paneEl);
        this.editor = null;
        this.statusEl = null;
        this.canvas = null;
        this.active = false;

        this._elemIndex = null;
        this._elemIndexStale = true;
        this._codeDirty = false;
        this._suppressTreeSync = false;
        this._lastCodeElement = null;

        this._build();

        var self = this;
        bus.on('canvas:ready', function (c) {
            self.canvas = c;
            self._elemIndexStale = true;
        });
        bus.on('canvas:changed', function () {
            if (self._codeDirty) return;
            if (self.active) self.refresh();
            self._elemIndexStale = true;
        });
        bus.on('canvas:refreshed', function () {
            if (self._codeDirty) return;
            if (self.active) self.refresh();
            self._elemIndexStale = true;
        });
        bus.on('selection:changed', function (e) {
            self.navigateTo(e.element);
        });

        bus.on('codeview:show', function () { self.openTab(); });
        bus.on('codeview:navigate-function', function (e) {
            self.navigateToFunctionSignature(e && e.signature, e && e.name);
        });
    }

    CodeView.prototype._build = function () {
        var self = this;

        var wrap = $('<div class="wb-code-view"></div>');

        var toolbar = $(
            '<div class="wb-code-view-toolbar">' +
            '<button type="button" class="wb-code-btn wb-code-view-apply">Apply</button>' +
            '<button type="button" class="wb-code-btn wb-code-view-reload">Reload from Scene</button>' +
            '<span class="wb-code-view-status"></span>' +
            '</div>'
        );

        var host = $('<div class="wb-code-view-editor"></div>');

        wrap.append(toolbar).append(host);
        this.pane.empty().append(wrap);

        this.editor = new CodeEditor({ value: '', language: 'xml' });
        host.append(this.editor.el);

        toolbar.find('.wb-code-view-apply').click(function () { self.apply(); });
        toolbar.find('.wb-code-view-reload').click(function () { self.refresh(); });
        this.statusEl = toolbar.find('.wb-code-view-status');

        var ta = this.editor.ta;
        ta.addEventListener('input', function () {
            self._codeDirty = true;
            self._elemIndexStale = true;
        });
        ta.addEventListener('keyup', function () { self._onCursorMove(); });
        ta.addEventListener('mouseup', function () { self._onCursorMove(); });
        ta.addEventListener('click', function () { self._onCursorMove(); });

        /* При потере фокуса — автоматический Apply. setTimeout(0), чтобы
           не конфликтовать с кнопками Apply / Reload и переключением вкладок. */
        ta.addEventListener('blur', function () {
            setTimeout(function () {
                if (!self._codeDirty) return;
                if (!self.canvas) return;
                self.apply();
            }, 0);
        });
    };

    CodeView.prototype.setActive = function (on) {
        this.active = !!on;
        if (this.active) {
            this.refresh();
            if (this.canvas) {
                var sel = this.canvas.getSelected();
                if (sel) {
                    this._lastCodeElement = sel;
                    this._scrollToElement(sel);
                }
            }
        }
    };
    CodeView.prototype.isActive = function () { return !!this.active; };
    CodeView.prototype.hasUnsavedChanges = function () { return !!this._codeDirty; };

    CodeView.prototype.openTab = function () {
        var tab = $('#wb-center-tabs .wb-center-tab[data-pane="code"]');
        if (tab.length && !tab.hasClass('wb-active')) tab.click();
    };

    CodeView.prototype.refresh = function () {
        if (!this.canvas) return;
        var pos = this.editor.ta.selectionStart;
        var html = this.canvas.cleanHtml();
        this.editor.setValue(html);
        if (pos != null && pos <= html.length) {
            this.editor.ta.setSelectionRange(pos, pos);
        }
        this.statusEl.text('').css('color', '');
        this._elemIndex = null;
        this._elemIndexStale = true;
        this._codeDirty = false;
    };

    /* Применить правки в canvas. Возвращает true/false.
       _codeDirty сбрасывается ДО loadHtml, чтобы слушатели canvas:*
       смогли обновить textarea нормализованным содержимым. */
    CodeView.prototype.apply = function () {
        if (!this.canvas) return false;
        var html = this.editor.getValue();
        var wasDirty = this._codeDirty;
        this._codeDirty = false;
        try {
            this.canvas.loadHtml(html, { collapseTree: false });
            this.statusEl.text('Applied.').css('color', '#2e7d32');
            this._elemIndex = null;
            this._elemIndexStale = true;
            return true;
        } catch (ex) {
            this._codeDirty = wasDirty;
            this.statusEl.text('Error: ' + (ex.message || ex))
                .css('color', '#c62828');
            return false;
        }
    };

    CodeView.prototype.getCurrentElement = function () {
        return this._lastCodeElement || null;
    };

    CodeView.prototype.navigateTo = function (el) {
        this._pendingEl = el || null;
        this._lastCodeElement = el || null;
        if (this._suppressTreeSync) return;
        if (this.active) this._scrollToElement(el);
    };

    /* -------------------- Навигация код → дерево -------------------- */

    CodeView.prototype._onCursorMove = function () {
        var self = this;
        if (this._suppressTreeSync) return;
        if (!this.active) return;

        if (this._cursorTimer) clearTimeout(this._cursorTimer);
        this._cursorTimer = setTimeout(function () {
            self._cursorTimer = null;
            self._syncTreeWithCursor();
        }, 60);
    };

    CodeView.prototype._syncTreeWithCursor = function () {
        if (!this.canvas) return;
        if (this._suppressTreeSync) return;

        if (!this._elemIndex || this._elemIndexStale) {
            this._buildElementIndex();
            this._elemIndexStale = false;
        }
        if (!this._elemIndex || !this._elemIndex.length) return;

        var offset = this.editor.ta.selectionStart;
        var el = this._elementAtOffset(offset);
        if (!el) return;
        if (el === this._lastCodeElement) return;

        this._lastCodeElement = el;

        this._suppressTreeSync = true;
        try {
            this.canvas.select(el);
        } finally {
            this._suppressTreeSync = false;
        }
    };

    /* Построить индекс: [ {element, start, end, light} ].
       - light: false → точное совпадение (полная сериализация найдена);
       - light: true  → fallback по открывающему тегу (элемент изменён
                        пользователем, полная сериализация не совпадает).

       Устойчиво к несохранённым правкам: при idx < 0 не прерывает обход,
       а ищет только открывающий тег в тексте. */
    CodeView.prototype._buildElementIndex = function () {
        this._elemIndex = [];
        if (!this.canvas) return;
        var code = this.editor.getValue();
        if (!code) return;
        var root = this.canvas.getRootContainer();
        if (!root) return;

        var self = this;
        var index = this._elemIndex;

        function isSkippedEl(el) {
            if (!el || el.nodeType !== 1) return true;
            if (el.getAttribute) {
                if (el.getAttribute('data-wb-ide') === '1') return true;
                if (el.getAttribute('data-wb-preview') === '1') return true;
                if (el.getAttribute('data-wb-comp-asset') === '1') return true;
            }
            var t = el.tagName.toLowerCase();
            if (t === 'wb-cdata' || t === 'wb-images' || t === 'wb-image') return true;
            return false;
        }

        /* Fallback: искать в тексте только открывающий тег. Использует
           tagName (или data-wb-tag) и ключевые атрибуты. */
        function findOpenTag(code, el, from) {
            var xmlTag = (el.getAttribute && el.getAttribute('data-wb-tag')) || el.tagName;
            var attrsToMatch = [];
            if (el.getAttribute) {
                var keys = ['cmptype', 'name', 'caption', 'id'];
                for (var i = 0; i < keys.length; i++) {
                    var v = el.getAttribute(keys[i]);
                    if (v) attrsToMatch.push({ name: keys[i], value: v });
                }
            }

            var re;
            try {
                re = new RegExp('<' + xmlTag + '(\\s[^<>]*?)?\\s*/?>', 'gi');
            } catch (e) {
                return -1;
            }
            re.lastIndex = from;

            var m;
            while ((m = re.exec(code)) !== null) {
                var attrsStr = m[1] || '';
                var ok = true;
                for (var a = 0; a < attrsToMatch.length; a++) {
                    var attrRe = new RegExp('\\s' + attrsToMatch[a].name +
                        '\\s*=\\s*"([^"]*)"', 'i');
                    var am = attrsStr.match(attrRe);
                    if (!am || am[1] !== attrsToMatch[a].value) { ok = false; break; }
                }
                if (ok) return m.index;
            }
            return -1;
        }

        function walk(el, level, searchFrom) {
            if (!el || el.nodeType !== 1) return searchFrom;
            if (isSkippedEl(el)) return searchFrom;

            var snippet;
            try { snippet = self.canvas._formatNode(el, level); }
            catch (e) { snippet = ''; }
            var cleanSnip = snippet ? snippet.replace(/\n$/, '') : '';

            var idx = -1;
            if (cleanSnip) idx = code.indexOf(cleanSnip, searchFrom);

            var elStart = -1, elEnd = -1, light = false;

            if (idx >= 0) {
                elStart = idx;
                elEnd = idx + cleanSnip.length;
            } else {
                /* Fallback: узел изменён пользователем — ищем открывающий тег. */
                var openIdx = findOpenTag(code, el, searchFrom);
                if (openIdx >= 0) {
                    elStart = openIdx;
                    elEnd = openIdx + 1;
                    light = true;
                }
            }

            if (elStart >= 0) {
                index.push({
                    element: el,
                    start: elStart,
                    end: elEnd,
                    light: light
                });
            }

            /* ВАЖНО: обходим детей в любом случае, даже если сам узел
               не найден в тексте (изменён пользователем). Иначе при
               правке внутри cmpScript не будут найдены его соседи. */
            var newSearch = (elStart >= 0) ? elStart : searchFrom;
            var kids = el.children;
            for (var i = 0; i < kids.length; i++) {
                newSearch = walk(kids[i], level + 1, newSearch);
            }

            return (idx >= 0) ? elEnd : newSearch;
        }

        walk(root, 0, 0);
    };

    /* Найти элемент под курсором.
       1) Сначала пробуем точное совпадение (light: false) — по границам.
       2) Иначе — fallback: ищем ближайший открывающий тег слева от
          курсора (light: true). */
    CodeView.prototype._elementAtOffset = function (offset) {
        var idx = this._elemIndex;
        if (!idx || !idx.length) return null;

        var precise = null;
        var preciseSize = Infinity;
        for (var i = 0; i < idx.length; i++) {
            var rec = idx[i];
            if (rec.light) continue;
            if (offset >= rec.start && offset <= rec.end) {
                var size = rec.end - rec.start;
                if (size < preciseSize) {
                    preciseSize = size;
                    precise = rec.element;
                }
            }
        }
        if (precise) return precise;

        /* Fallback: последний открывающий тег, начинающийся не позже курсора. */
        var best = null;
        var bestStart = -1;
        for (var j = 0; j < idx.length; j++) {
            if (idx[j].start <= offset && idx[j].start > bestStart) {
                bestStart = idx[j].start;
                best = idx[j].element;
            }
        }
        return best;
    };

    /* -------------------- Навигация дерево → код -------------------- */

    CodeView.prototype.navigateToFunctionSignature = function (signature, hintName) {
        if (!signature && !hintName) return;
        this.openTab();

        var code = this.editor.getValue();
        if (!code) return;

        var candidates = [];
        if (hintName) candidates.push(hintName);
        if (signature) {
            var m = String(signature).match(/^\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/);
            if (m) {
                var n = m[1].trim();
                if (n && candidates.indexOf(n) < 0) candidates.push(n);
            }
        }

        var idx = -1;
        for (var i = 0; i < candidates.length && idx < 0; i++) {
            var name = candidates[i];
            if (!name) continue;

            var esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            var re1 = new RegExp('\\b' + esc + '\\s*=\\s*function');
            var m1 = code.match(re1);
            if (m1) { idx = m1.index; break; }

            var lastSeg = name.split('.').pop();
            if (lastSeg) {
                var escLast = lastSeg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var re2 = new RegExp('\\bfunction\\s+' + escLast + '\\s*\\(');
                var m2 = code.match(re2);
                if (m2) { idx = m2.index; break; }
            }

            var pos = code.indexOf(name);
            if (pos >= 0) { idx = pos; break; }
        }

        if (idx < 0) return;

        this.editor.ta.focus();
        this.editor.ta.setSelectionRange(idx, idx);
        this.editor.revealOffset(idx);
    };

    CodeView.prototype._scrollToElement = function (el) {
        if (!el || !this.canvas) return;
        var code = this.editor.getValue();
        if (!code) return;

        var root = this.canvas.getRootContainer();
        if (!root) return;

        var inRoot = false;
        var cur = el;
        while (cur) {
            if (cur === root) { inRoot = true; break; }
            cur = cur.parentNode;
        }
        if (!inRoot) return;

        var level = 0;
        cur = el;
        while (cur && cur !== root) {
            cur = cur.parentNode;
            if (!cur) return;
            if (cur.nodeType === 1) level++;
        }

        var snippet;
        try {
            snippet = this.canvas._formatNode(el, level).replace(/\n$/, '');
        } catch (e) { return; }
        if (!snippet) return;

        var idx = code.indexOf(snippet);
        if (idx < 0 && level !== 0) {
            try {
                snippet = this.canvas._formatNode(el, 0).replace(/\n$/, '');
            } catch (e) { return; }
            if (snippet) idx = code.indexOf(snippet);
        }
        if (idx < 0) return;

        this.editor.ta.focus();
        this.editor.ta.setSelectionRange(idx, idx);
        this.editor.revealOffset(idx);
    };

    global.CodeView = CodeView;
})(window, jQuery);
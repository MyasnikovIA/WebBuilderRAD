/* CodeView — вкладка Code в центральной области.
   Показывает текущую страницу в виде HTML (cleanHtml()), позволяет
   редактировать и применять правки обратно в canvas (loadHtml).

   Двунаправленная навигация:
     - при выборе элемента в дереве (selection:changed) — позиционирует
       курсор редактора на начало исходника этого элемента;
     - при перемещении курсора в редакторе (keyup/mouseup/click) —
       находит ближайший тег, внутри которого стоит курсор, и выделяет
       соответствующий элемент в дереве и на сцене.

   Дополнительно:
     - codeview:show / codeview:navigate-function — открыть вкладку Code
       и позиционировать курсор на объявлении функции формы;
     - getCurrentElement() — вернуть элемент, отслеженный последним. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    function CodeView(paneEl) {
        this.pane = $(paneEl);
        this.editor = null;
        this.statusEl = null;
        this.canvas = null;
        this.active = false;

        /* Индекс позиций элементов в тексте: [{element, start, end}].
           Строится один раз на актуальный текст и переиспользуется. */
        this._elemIndex = null;
        this._elemIndexStale = true;

        /* Флаг «правки не применены»: пока пользователь не нажал Apply,
           не пытаемся синхронизировать дерево — текст не совпадает с DOM. */
        this._codeDirty = false;

        /* Защита от рекурсии: когда выделение инициировано кодом,
           selection:changed не должен откатывать курсор обратно. */
        this._suppressTreeSync = false;

        /* Последний элемент, выделенный по курсору в коде — чтобы
           не переспрашивать дерево на каждый keyup. */
        this._lastCodeElement = null;

        this._build();

        var self = this;
        bus.on('canvas:ready', function (c) {
            self.canvas = c;
            self._elemIndexStale = true;
        });
        bus.on('canvas:changed', function () {
            if (self.active) self.refresh();
            self._elemIndexStale = true;
        });
        bus.on('canvas:refreshed', function () {
            if (self.active) self.refresh();
            self._elemIndexStale = true;
        });
        bus.on('selection:changed', function (e) {
            self.navigateTo(e.element);
        });

        bus.on('codeview:show', function () {
            self.openTab();
        });
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

        /* Отслеживание перемещения курсора в редакторе. */
        var ta = this.editor.ta;
        ta.addEventListener('input', function () {
            self._codeDirty = true;
            self._elemIndexStale = true;
        });
        ta.addEventListener('keyup', function () {
            if (self._codeDirty) return;
            self._onCursorMove();
        });
        ta.addEventListener('mouseup', function () {
            if (self._codeDirty) return;
            self._onCursorMove();
        });
        ta.addEventListener('click', function () {
            if (self._codeDirty) return;
            self._onCursorMove();
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

    /* Открыть вкладку Code (кликнуть по соответствующему табу). */
    CodeView.prototype.openTab = function () {
        var tab = $('#wb-center-tabs .wb-center-tab[data-pane="code"]');
        if (tab.length && !tab.hasClass('wb-active')) {
            tab.click();
        }
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
        /* Текст синхронизирован с DOM — можно строить индекс и
           реагировать на перемещение курсора. */
        this._elemIndex = null;
        this._elemIndexStale = true;
        this._codeDirty = false;
    };

    CodeView.prototype.apply = function () {
        if (!this.canvas) return;
        var html = this.editor.getValue();
        try {
            this.canvas.loadHtml(html);
            this.statusEl.text('Applied.').css('color', '#2e7d32');
            this._elemIndex = null;
            this._elemIndexStale = true;
            this._codeDirty = false;
        } catch (ex) {
            this.statusEl.text('Error: ' + (ex.message || ex))
                .css('color', '#c62828');
        }
    };

    /* Вернуть элемент, отслеженный последним (по курсору в коде или
       по выделению в дереве). Используется при переключении обратно
       на вкладку Scene — чтобы перевыделить тот же элемент. */
    CodeView.prototype.getCurrentElement = function () {
        return this._lastCodeElement || null;
    };

    /* Вызывается из selection:changed. Если выделение инициировано
       нами же (_suppressTreeSync), ничего не делаем — иначе получим
       цикл «код → дерево → код». */
    CodeView.prototype.navigateTo = function (el) {
        this._pendingEl = el || null;
        this._lastCodeElement = el || null;
        if (this._suppressTreeSync) return;
        if (this.active) this._scrollToElement(el);
    };

    /* -------------------- Навигация код → дерево -------------------- */

    /* Обработчик перемещения курсора. Дебаунсится, чтобы не дёргать
       синхронизацию на каждый символ. */
    CodeView.prototype._onCursorMove = function () {
        var self = this;
        if (this._suppressTreeSync) return;
        if (!this.active) return;
        if (this._codeDirty) return;

        if (this._cursorTimer) clearTimeout(this._cursorTimer);
        this._cursorTimer = setTimeout(function () {
            self._cursorTimer = null;
            self._syncTreeWithCursor();
        }, 60);
    };

    CodeView.prototype._syncTreeWithCursor = function () {
        if (!this.canvas) return;
        if (this._suppressTreeSync) return;
        if (this._codeDirty) return;

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

        /* Исключаем обратный вызов navigateTo (иначе код «дёрнется»). */
        this._suppressTreeSync = true;
        try {
            this.canvas.select(el);
        } finally {
            this._suppressTreeSync = false;
        }
    };

    /* Построить индекс: для каждого элемента canvas — его позиция в
       текущем тексте редактора.

       Идём по DOM в document order и для каждого элемента ищем его
       сериализацию (canvas._formatNode) в тексте, начиная с позиции
       последнего успешного совпадения. Это даёт точные [start, end].

       Сложность O(n * m), где n — число элементов, m — длина их
       сериализации. Для типовых форм работает мгновенно. */
    CodeView.prototype._buildElementIndex = function () {
        this._elemIndex = [];
        if (!this.canvas) return;

        var code = this.editor.getValue();
        if (!code) return;

        var root = this.canvas.getRootContainer();
        if (!root) return;

        var self = this;
        var index = this._elemIndex;

        function walk(el, level, searchFrom) {
            if (!el || el.nodeType !== 1) return searchFrom;

            /* Пропускаем служебные узлы — их нет в cleanHtml(). */
            if (el.getAttribute) {
                if (el.getAttribute('data-wb-ide') === '1') return searchFrom;
                if (el.getAttribute('data-wb-preview') === '1') return searchFrom;
                if (el.getAttribute('data-wb-comp-asset') === '1') return searchFrom;
            }
            if (el.tagName) {
                var t = el.tagName.toLowerCase();
                if (t === 'wb-cdata' || t === 'wb-images' || t === 'wb-image') return searchFrom;
            }

            var snippet;
            try {
                snippet = self.canvas._formatNode(el, level);
            } catch (e) {
                return searchFrom;
            }
            if (!snippet) return searchFrom;

            /* _formatNode добавляет \n в конце. Срезаем, чтобы индекс
               совпадал с реальной длиной блока в тексте. */
            var cleanSnip = snippet.replace(/\n$/, '');
            if (!cleanSnip) return searchFrom;

            var idx = code.indexOf(cleanSnip, searchFrom);
            if (idx < 0) return searchFrom;

            index.push({
                element: el,
                start: idx,
                end: idx + cleanSnip.length
            });

            var newSearch = idx;
            var kids = el.children;
            for (var i = 0; i < kids.length; i++) {
                newSearch = walk(kids[i], level + 1, newSearch);
            }

            return idx + cleanSnip.length;
        }

        walk(root, 0, 0);
    };

    /* Найти элемент, внутри диапазона которого лежит offset.
       Из всех подходящих выбираем самый маленький по длине — это
       самый глубоко вложенный тег. */
    CodeView.prototype._elementAtOffset = function (offset) {
        var idx = this._elemIndex;
        if (!idx || !idx.length) return null;

        var best = null;
        var bestSize = Infinity;
        for (var i = 0; i < idx.length; i++) {
            var rec = idx[i];
            if (offset >= rec.start && offset <= rec.end) {
                var size = rec.end - rec.start;
                if (size < bestSize) {
                    bestSize = size;
                    best = rec.element;
                }
            }
        }
        return best;
    };

    /* -------------------- Навигация дерево → код -------------------- */

    /* Навигация к объявлению JS-функции.

       Параметры:
         signature — строка вида 'Form.onClick(this);' или 'onClick(event);'.
         hintName  — необязательное прямое имя функции. Если задано,
                     используется как первый кандидат для поиска. */
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

    /* Прокрутка к началу исходника DOM-элемента. */
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
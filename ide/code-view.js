/* CodeView — вкладка Code в центральной области.
   Показывает текущую страницу в виде HTML (cleanHtml()), позволяет
   редактировать и применять правки обратно в canvas (loadHtml).

   При выборе элемента в дереве (selection:changed) позиционирует
   курсор редактора на начало исходника этого элемента.

   По событиям codeview:show и codeview:navigate-function — открывает
   вкладку Code и позиционирует курсор на объявлении функции формы.

   В codeview:navigate-function поддерживается необязательный параметр
   name — прямое имя функции. Если он задан, используется в первую
   очередь; иначе имя извлекается из signature. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    function CodeView(paneEl) {
        this.pane = $(paneEl);
        this.editor = null;
        this.statusEl = null;
        this.canvas = null;
        this.active = false;

        this._build();

        var self = this;
        bus.on('canvas:ready',      function (c) { self.canvas = c; });
        bus.on('canvas:changed',    function ()  { if (self.active) self.refresh(); });
        bus.on('canvas:refreshed',  function ()  { if (self.active) self.refresh(); });
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
    };

    CodeView.prototype.setActive = function (on) {
        this.active = !!on;
        if (this.active) {
            this.refresh();
            if (this.canvas) {
                var sel = this.canvas.getSelected();
                if (sel) this._scrollToElement(sel);
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
    };

    CodeView.prototype.apply = function () {
        if (!this.canvas) return;
        var html = this.editor.getValue();
        try {
            this.canvas.loadHtml(html);
            this.statusEl.text('Applied.').css('color', '#2e7d32');
        } catch (ex) {
            this.statusEl.text('Error: ' + (ex.message || ex))
                .css('color', '#c62828');
        }
    };

    CodeView.prototype.navigateTo = function (el) {
        this._pendingEl = el || null;
        if (this.active) this._scrollToElement(el);
    };

    /* Навигация к объявлению JS-функции.

       Параметры:
         signature — строка вида 'Form.onClick(this);' или 'onClick(event);'.
                     Может быть null, если задан hintName.
         hintName  — необязательное прямое имя функции (например,
                     'Form.onClickMyButton'). Если задано, используется
                     как первый кандидат для поиска.

       Порядок поиска:
         1) hintName (если задан);
         2) name, извлечённое из signature (первое слово до скобки).

       Для каждого кандидата пробуются формы объявления:
         '<name> = function'
         'function <lastSegment>'
         вхождение подстроки '<name>' как fallback. */
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
/* CodeView — вкладка Code в центральной области.
   Показывает текущую страницу в виде HTML (cleanHtml()), позволяет
   редактировать и применять правки обратно в canvas (loadHtml).

   При выборе элемента в дереве (selection:changed) позиционирует
   курсор редактора на начало исходника этого элемента.

   Использует CodeEditor для подсветки синтаксиса. */
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

    /* Переключение вкладки Code: on = true — открываемся. */
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

    /* Пересобрать текст из canvas (cleanHtml). Сохраняем позицию
       курсора, чтобы правки не сбрасывали её. */
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

    /* Применить правки: разобрать текст через canvas.loadHtml. */
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

    /* Выделили элемент в дереве → держим ссылку, а если вкладка Code
       открыта — сразу прокручиваем редактор. */
    CodeView.prototype.navigateTo = function (el) {
        this._pendingEl = el || null;
        if (this.active) this._scrollToElement(el);
    };

    /* Прокрутка к началу исходника элемента в текущем тексте.

       Алгоритм:
         1. Определяем уровень вложенности элемента в форматируемом
            дереве (сколько узлов-родителей до корневого контейнера).
         2. Сериализуем элемент через canvas._formatNode(el, level) —
            это даст ровно тот же блок, что и в cleanHtml().
         3. Ищем блок в тексте редактора. Первое совпадение — и есть
            начало исходника. При неудаче пробуем уровень 0. */
    CodeView.prototype._scrollToElement = function (el) {
        if (!el || !this.canvas) return;
        var code = this.editor.getValue();
        if (!code) return;

        var root = this.canvas.getRootContainer();
        if (!root) return;

        /* Проверяем, что элемент внутри корня. */
        var inRoot = false;
        var cur = el;
        while (cur) {
            if (cur === root) { inRoot = true; break; }
            cur = cur.parentNode;
        }
        if (!inRoot) return;

        /* Уровень = число узлов-родителей от el до root (не считая el). */
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
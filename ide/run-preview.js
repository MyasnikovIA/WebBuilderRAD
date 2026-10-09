/* RunPreview — предпросмотр текущей формы в отдельном popup-окне.
   Единственное окно переиспользуется между запусками: если оно уже
   открыто — новый HTML записывается поверх; если пользователь его
   закрыл — при следующем запуске открывается новое.

   Внутри окна перехватываются F5 и Ctrl+R: вместо браузерной
   перезагрузки (которая вернула бы about:blank) вызывается тот же
   RunPreview.run(), берущий свежий HTML из редактора.

   Точка входа: global.RunPreview.run().
   Инициализация: RunPreview.attach({ canvas, codeView }). */
(function (global) {
    'use strict';

    var WIN_NAME = 'wb_preview';

    var RunPreview = {
        _canvas:      null,
        _codeView:    null,
        _previewWin:  null,
        _watchTimer:  null,

        /* Привязка к актуальным объектам IDE. */
        attach: function (opts) {
            opts = opts || {};
            this._canvas   = opts.canvas   || null;
            this._codeView = opts.codeView || null;

            /* Сторож: если пользователь закрыл popup — сбросить ссылку,
               чтобы следующий Run открыл новое (единственное) окно. */
            if (!this._watchTimer) {
                var self = this;
                this._watchTimer = setInterval(function () {
                    if (self._previewWin && self._previewWin.closed) {
                        self._previewWin = null;
                    }
                }, 1000);
            }

            return this;
        },

        /* Главный метод. */
        run: function () {
            var canvas   = this._canvas;
            var codeView = this._codeView;

            if (!canvas) {
                alert('RunPreview: canvas не привязан. ' +
                    'Вызовите RunPreview.attach({ canvas, codeView }) при старте IDE.');
                return;
            }

            /* Если открыта вкладка Code с несохранёнными правками —
               сначала применяем их в canvas. */
            if (codeView &&
                codeView.isActive() &&
                codeView.hasUnsavedChanges()) {
                if (!codeView.apply()) return;
            }

            var html;
            try {
                html = canvas.cleanHtml();
            } catch (e) {
                alert('Ошибка генерации HTML: ' + e.message);
                return;
            }

            if (!html || !html.replace(/\s+/g, '')) {
                alert('Пустая страница.');
                return;
            }

            html = this._ensureFullDocument(html);
            html = this._injectHeadAssets(html);

            this._writeToWindow(html);
        },

        /* ---------- внутренние ---------- */

        _ensureFullDocument: function (html) {
            var isFullDoc = /<!DOCTYPE/i.test(html) || /<html[\s>]/i.test(html);
            if (isFullDoc) return html;

            return '<!DOCTYPE html>\n' +
                '<html lang="ru">\n' +
                '<head>\n' +
                '<meta charset="UTF-8">\n' +
                '<title>Preview</title>\n' +
                '</head>\n' +
                '<body>\n' + html + '\n</body>\n' +
                '</html>';
        },

        _injectHeadAssets: function (html) {
            var baseHref = window.location.href.replace(/[?#].*$/, '');
            var baseTag  = '<base href="' + baseHref.replace(/"/g, '&quot;') + '">';

            var links = '';
            var seen  = {};
            if (global.ComponentRegistry) {
                var list = global.ComponentRegistry.all();
                for (var i = 0; i < list.length; i++) {
                    var cssList = list[i].previewCssUrls || [];
                    for (var j = 0; j < cssList.length; j++) {
                        var url = cssList[j];
                        if (seen[url]) continue;
                        seen[url] = 1;
                        links += '<link rel="stylesheet" href="' + url + '">\n';
                    }
                }
            }

            var inject = baseTag + '\n' + links;

            if (/<\/head>/i.test(html)) {
                return html.replace(/<\/head>/i, inject + '</head>');
            }
            if (/<body[\s>]/i.test(html)) {
                return html.replace(/(<body[\s>])/i,
                    '<head>\n' + inject + '</head>\n$1');
            }
            return inject + html;
        },

        _writeToWindow: function (html) {
            var self = this;

            var winName = WIN_NAME;
            var features = [
                'popup=yes',
                'width=1100',
                'height=800',
                'left=' + Math.max(0, Math.round((screen.width  - 1100) / 2)),
                'top='  + Math.max(0, Math.round((screen.height -  800) / 2)),
                'resizable=yes',
                'scrollbars=yes'
            ].join(',');

            var win = self._previewWin;

            if (!win || win.closed) {
                win = window.open('', winName, features);
                self._previewWin = win || null;
            }

            if (!win) {
                alert('Не удалось открыть окно предпросмотра.\n' +
                    'Разрешите всплывающие окна (popups) для этого сайта.');
                return;
            }

            win.document.open();
            win.document.write(html);
            win.document.close();

            this._bindReloadKeys(win);

            win.focus();
        },

        /* Перехват F5 / Ctrl+R внутри popup: перезапуск RunPreview.run(). */
        _bindReloadKeys: function (win) {
            function isReloadKey(e) {
                return e.keyCode === 116 ||                 /* F5 */
                    (e.ctrlKey && e.keyCode === 82);     /* Ctrl+R */
            }
            function onKey(e) {
                if (!isReloadKey(e)) return;
                e.preventDefault();
                e.stopPropagation();
                try { RunPreview.run(); } catch (ex) {}
                return false;
            }
            try {
                win.document.addEventListener('keydown', onKey, true);
                win.addEventListener('keydown', onKey, true);
            } catch (ex) { /* cross-origin — маловероятно */ }
        }
    };

    global.RunPreview = RunPreview;

})(window);
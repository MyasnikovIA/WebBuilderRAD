/* RunPreview — предпросмотр текущей формы в отдельном popup-окне.

   Единственное окно переиспользуется между запусками: если оно уже
   открыто — новый HTML записывается поверх; если пользователь его
   закрыл — при следующем запуске открывается новое.

   Внутри окна перехватываются F5 и Ctrl+R: вместо браузерной
   перезагрузки (которая вернула бы about:blank) вызывается тот же
   RunPreview.run(), берущий свежий HTML из редактора.

   Если активен проект — все ссылки на его файлы (img, link, script,
   iframe, video, audio, source, poster, srcset, style url(...))
   резолвятся в blob:/data:-URL, поэтому предпросмотр получает доступ
   ко всем ресурсам проекта так же, как при Run Project.

   Точка входа: global.RunPreview.run().
   Инициализация: RunPreview.attach({ canvas, codeView }). */
(function (global) {
    'use strict';

    var WIN_NAME = 'wb_preview';

    /* ------------------------------------------------------------------
       MIME-типы по расширению
       ------------------------------------------------------------------ */
    var MIME = {
        html: 'text/html',  htm: 'text/html',
        css:  'text/css',
        js:   'text/javascript', mjs: 'text/javascript',
        json: 'application/json',
        xml:  'application/xml',
        svg:  'image/svg+xml',
        png:  'image/png',  jpg:  'image/jpeg', jpeg: 'image/jpeg',
        gif:  'image/gif',  bmp:  'image/bmp',  webp: 'image/webp',
        ico:  'image/x-icon',
        txt:  'text/plain', md:   'text/markdown',
        php:  'text/x-php',
        frm:  'text/plain',
        sql:  'text/plain',
        pdf:  'application/pdf',
        woff: 'font/woff',  woff2: 'font/woff2',
        ttf:  'font/ttf',   otf:   'font/otf'
    };

    function extOf(p) {
        var m = String(p || '').match(/\.([^.\\\/?#]+)(?:[?#]|$)/);
        return m ? m[1].toLowerCase() : '';
    }
    function mimeFor(p) { return MIME[extOf(p)] || 'application/octet-stream'; }

    /* ------------------------------------------------------------------
       BlobResolver — кэш blob-URL для одного предпросмотра.
       Освобождается при закрытии окна предпросмотра.
       ------------------------------------------------------------------ */
    function BlobResolver(project) {
        this.project = project;
        this._cache = {};
        this._created = [];
    }
    BlobResolver.prototype.resolve = function (path) {
        if (!path) return path;
        if (/^(data:|blob:|https?:|mailto:|tel:|javascript:|#|\/\/)/i.test(path)) return path;
        if (this._cache[path]) return this._cache[path];

        var f = this.project.files && this.project.files[path];
        if (!f) return path;

        if (f.kind === 'image' && /^data:/i.test(f.content || '')) {
            this._cache[path] = f.content;
            return f.content;
        }

        try {
            var blob = new Blob([f.content || ''], { type: mimeFor(path) });
            var url = URL.createObjectURL(blob);
            this._cache[path] = url;
            this._created.push(url);
            return url;
        } catch (e) {
            return path;
        }
    };
    BlobResolver.prototype.revokeAll = function () {
        for (var i = 0; i < this._created.length; i++) {
            try { URL.revokeObjectURL(this._created[i]); } catch (e) {}
        }
        this._created = [];
        this._cache = {};
    };

    /* ------------------------------------------------------------------
       Резолвинг относительного пути
       ------------------------------------------------------------------ */
    function resolveRelative(pagePath, href) {
        if (!href) return '';
        if (/^(data:|blob:|https?:|mailto:|tel:|javascript:|#|\/\/)/i.test(href)) {
            return href;
        }
        var hash = '', query = '', p = String(href);
        var hi = p.indexOf('#');
        if (hi >= 0) { hash = p.substring(hi); p = p.substring(0, hi); }
        var qi = p.indexOf('?');
        if (qi >= 0) { query = p.substring(qi); p = p.substring(0, qi); }

        var isAbsolute = p.charAt(0) === '/';
        if (isAbsolute) p = p.substring(1);

        var baseDir = '';
        if (!isAbsolute) {
            var pi = String(pagePath).lastIndexOf('/');
            baseDir = pi >= 0 ? pagePath.substring(0, pi) : '';
        }
        var joined = baseDir ? baseDir + '/' + p : p;
        var parts = joined.split('/');
        var out = [];
        for (var i = 0; i < parts.length; i++) {
            var s = parts[i];
            if (s === '' || s === '.') continue;
            if (s === '..') { if (out.length) out.pop(); }
            else out.push(s);
        }
        return out.join('/') + query + hash;
    }

    /* ------------------------------------------------------------------
       Перезапись URL-атрибутов в документе
       ------------------------------------------------------------------ */
    var URL_ATTRS = ['src', 'href', 'poster', 'action', 'data',
        'formaction', 'background', 'longdesc', 'manifest'];

    function rewriteURLs(doc, pagePath, resolver, project) {
        function walk(el) {
            if (!el || el.nodeType !== 1) return;
            var tag = el.tagName.toLowerCase();

            for (var i = 0; i < URL_ATTRS.length; i++) {
                var attr = URL_ATTRS[i];
                var v = el.getAttribute && el.getAttribute(attr);
                if (!v) continue;

                var resolved = resolveRelative(pagePath, v);
                var clean = resolved ? resolved.split('#')[0].split('?')[0] : '';
                var inProject = clean && project.files[clean];

                /* Ссылки <a href> и формы <form action> — оставляем
                   как есть: в предпросмотре переходить по ним некуда.
                   Но если файл есть в проекте — можно было бы открыть;
                   пока просто игнорируем. */
                var isLink = (attr === 'href' && tag === 'a');
                var isForm = (attr === 'action' && tag === 'form');

                if (isLink || isForm) {
                    if (inProject) {
                        el.setAttribute('data-wb-nav', clean);
                        if (isLink) el.setAttribute('href', 'javascript:void(0)');
                    }
                    continue;
                }

                if (inProject) {
                    el.setAttribute(attr, resolver.resolve(clean));
                }
            }

            /* srcset — список URL через запятую. */
            var srcset = el.getAttribute && el.getAttribute('srcset');
            if (srcset) {
                var newSrcset = String(srcset).replace(/([^\s,]+)(\s+[^,]+)?/g,
                    function (m, url, desc) {
                        var r = resolveRelative(pagePath, url);
                        var c = r.split('#')[0].split('?')[0];
                        if (project.files[c]) return resolver.resolve(c) + (desc || '');
                        return m;
                    });
                el.setAttribute('srcset', newSrcset);
            }

            /* style="..." и <style>...</style>. */
            var st = el.getAttribute && el.getAttribute('style');
            if (st && st.indexOf('url(') >= 0) {
                el.setAttribute('style', replaceCssUrls(st, pagePath, resolver, project));
            }
            if (tag === 'style') {
                var t = el.textContent || '';
                if (t.indexOf('url(') >= 0) {
                    el.textContent = replaceCssUrls(t, pagePath, resolver, project);
                }
            }

            var kids = el.children;
            for (var k = 0; k < kids.length; k++) walk(kids[k]);
        }
        walk(doc.documentElement);
    }

    function replaceCssUrls(css, pagePath, resolver, project) {
        return String(css).replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
            function (m, q, url) {
                var r = resolveRelative(pagePath, url);
                var c = r.split('#')[0].split('?')[0];
                if (project.files[c]) return 'url(' + resolver.resolve(c) + ')';
                return m;
            });
    }

    /* ------------------------------------------------------------------
       RunPreview
       ------------------------------------------------------------------ */
    var RunPreview = {
        _canvas:      null,
        _codeView:    null,
        _previewWin:  null,
        _watchTimer:  null,
        _resolver:    null,

        attach: function (opts) {
            opts = opts || {};
            this._canvas   = opts.canvas   || null;
            this._codeView = opts.codeView || null;

            if (!this._watchTimer) {
                var self = this;
                this._watchTimer = setInterval(function () {
                    if (self._previewWin && self._previewWin.closed) {
                        self._previewWin = null;
                        if (self._resolver) {
                            try { self._resolver.revokeAll(); } catch (e) {}
                            self._resolver = null;
                        }
                    }
                }, 1000);
            }
            return this;
        },

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
            if (codeView && codeView.isActive() && codeView.hasUnsavedChanges()) {
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

            /* 1) Делаем полный документ. */
            html = this._ensureFullDocument(html);

            /* 2) Проверяем проект. */
            var project  = this._getCurrentProject();
            var pagePath = this._getEditingPath() || 'index.html';

            if (project) {
                /* Есть проект — резолвим все ссылки в blob:/data:.
                   <base> в этом случае не нужен, убираем его. */
                if (this._resolver) {
                    try { this._resolver.revokeAll(); } catch (e) {}
                    this._resolver = null;
                }
                this._resolver = new BlobResolver(project);

                html = this._resolveProjectURLs(html, pagePath, project, false);
                html = this._injectComponentAssets(html);
            } else {
                /* Нет проекта — старое поведение: <base href> на URL IDE,
                   чтобы относительные пути хотя бы не ломались в about:blank. */
                html = this._injectHeadAssets(html);
            }

            this._writeToWindow(html);
        },

        /* ------------------------------------------------------------------
           Доступ к проекту
           ------------------------------------------------------------------ */
        _getCurrentProject: function () {
            var pm = global.IDE && global.IDE.projectManager;
            if (!pm || !pm.current) return null;
            if (!pm.current.files) return null;
            return pm.current;
        },

        _getEditingPath: function () {
            var pm = global.IDE && global.IDE.projectManager;
            if (pm && pm.editing && pm.editing.path) return pm.editing.path;
            if (pm && pm.current && pm.current.mainFile) return pm.current.mainFile;
            return null;
        },

        /* ------------------------------------------------------------------
           Проход по HTML: заменяем URL-атрибуты на blob:/data:
           ------------------------------------------------------------------ */
        _resolveProjectURLs: function (html, pagePath, project, keepBase) {
            var doc;
            try {
                doc = new DOMParser().parseFromString(html, 'text/html');
            } catch (e) {
                return html;
            }
            if (!doc || !doc.documentElement) return html;

            /* Убираем <base> — он бы ломал blob-URL. */
            if (!keepBase) {
                var bases = doc.querySelectorAll('base');
                for (var i = 0; i < bases.length; i++) {
                    bases[i].parentNode.removeChild(bases[i]);
                }
            }

            rewriteURLs(doc, pagePath, this._resolver, project);

            return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
        },

        /* ------------------------------------------------------------------
           Обёртка в полный документ, если пришёл фрагмент
           ------------------------------------------------------------------ */
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

        /* ------------------------------------------------------------------
           Только CSS компонентов (без <base>) — когда резолвим проект.
           Пути к previewCss компонентов уже абсолютные.
           ------------------------------------------------------------------ */
        _injectComponentAssets: function (html) {
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
            if (!links) return html;

            if (/<\/head>/i.test(html)) {
                return html.replace(/<\/head>/i, links + '</head>');
            }
            if (/<body[\s>]/i.test(html)) {
                return html.replace(/(<body[\s>])/i,
                    '<head>\n' + links + '</head>\n$1');
            }
            return links + html;
        },

        /* ------------------------------------------------------------------
           <base> + CSS компонентов — когда проекта нет.
           ------------------------------------------------------------------ */
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
                return e.keyCode === 116 ||
                    (e.ctrlKey && e.keyCode === 82);
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
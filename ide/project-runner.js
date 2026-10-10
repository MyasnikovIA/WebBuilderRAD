/* ProjectRunner — запуск проекта в отдельном окне.

   Стартовая страница берётся из project.mainFile (манифест project.json).
   Все ссылки и ресурсы внутри проекта резолвятся в blob:/data:-URL, чтобы
   браузер не пытался скачать их по HTTP. Навигация по <a>, <form action>
   перехватывается и приводит к подгрузке следующей страницы из проекта.

   Экспортирует global.ProjectRunner. */
(function (global) {
    'use strict';

    var bus = global.EventBus;

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
       Резолвер blob-URL
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

        /* Абсолютные/внешние — как есть. */
        if (/^(data:|blob:|https?:|mailto:|tel:|javascript:|#|\/\/)/i.test(href)) {
            return href;
        }

        /* Отделяем query и hash. */
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

                var isLink = (attr === 'href' && tag === 'a');
                var isForm = (attr === 'action' && tag === 'form');

                var resolved = resolveRelative(pagePath, v);
                var targetInProject = resolved &&
                    project.files[resolved.split('#')[0].split('?')[0]];

                if (isLink || isForm) {
                    /* Навигация внутри проекта. */
                    if (targetInProject) {
                        var cleanPath = resolved.split('#')[0].split('?')[0];
                        el.setAttribute('data-wb-nav', cleanPath);
                        if (isLink) el.setAttribute('href', 'javascript:void(0)');
                    }
                    /* Иначе — оставляем как есть (внешняя ссылка). */
                    continue;
                }

                /* Ресурсный атрибут — подменяем на blob/data URL. */
                if (targetInProject) {
                    var cleanRes = resolved.split('#')[0].split('?')[0];
                    el.setAttribute(attr, resolver.resolve(cleanRes));
                }
            }

            /* srcset — список через запятую. */
            var srcset = el.getAttribute && el.getAttribute('srcset');
            if (srcset) {
                var newSrcset = String(srcset).replace(/([^\s,]+)(\s+[^,]+)?/g,
                    function (m, url, desc) {
                        var r = resolveRelative(pagePath, url);
                        var clean = r.split('#')[0].split('?')[0];
                        if (project.files[clean]) {
                            return resolver.resolve(clean) + (desc || '');
                        }
                        return m;
                    });
                el.setAttribute('srcset', newSrcset);
            }

            /* style с url(...) — только для <style> и атрибута style. */
            rewriteInlineStyleURLs(el, pagePath, resolver, project);

            var kids = el.children;
            for (var k = 0; k < kids.length; k++) walk(kids[k]);
        }

        walk(doc.documentElement);
    }

    function rewriteInlineStyleURLs(el, pagePath, resolver, project) {
        /* Атрибут style="..." */
        var st = el.getAttribute && el.getAttribute('style');
        if (st && st.indexOf('url(') >= 0) {
            el.setAttribute('style', replaceCssUrls(st, pagePath, resolver, project));
        }
        /* <style>...</style> */
        if (el.tagName && el.tagName.toLowerCase() === 'style') {
            var t = el.textContent || '';
            if (t.indexOf('url(') >= 0) {
                el.textContent = replaceCssUrls(t, pagePath, resolver, project);
            }
        }
    }

    function replaceCssUrls(css, pagePath, resolver, project) {
        return String(css).replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
            function (m, q, url) {
                var r = resolveRelative(pagePath, url);
                var clean = r.split('#')[0].split('?')[0];
                if (project.files[clean]) {
                    return 'url(' + resolver.resolve(clean) + ')';
                }
                return m;
            });
    }

    /* ------------------------------------------------------------------
       ProjectRunner
       ------------------------------------------------------------------ */
    var WIN_NAME = 'wb_project_run';
    var _current = null;   /* { win, resolver, watchdog } */

    var ProjectRunner = {
        run: function () {
            var pm = global.IDE && global.IDE.projectManager;
            if (!pm || !pm.current) {
                alert('Проект не выбран. Выберите проект в панели Project.');
                return;
            }

            var project = pm.current;
            if (!project.files || !Object.keys(project.files).length) {
                alert('Проект пуст.');
                return;
            }

            /* Автосохранение текущего редактируемого файла. */
            if (pm.editing && project.files[pm.editing.path]) {
                var canvas = global.IDE && global.IDE._canvas;
                if (canvas && canvas.cleanHtml) {
                    try {
                        var clean = canvas.cleanHtml();
                        project.files[pm.editing.path].content = clean;
                        pm.editing.initialClean = clean;
                        pm.save();
                    } catch (e) {}
                }
            }

            var main = project.mainFile;
            if (!main || !project.files[main]) {
                alert('Стартовый файл не задан или не найден.\n' +
                    'ПКМ по файлу в Project → "Set as Main File ★".');
                return;
            }

            /* Закрываем предыдущее окно (переиспользуем, если открыто). */
            this._closeCurrent();

            var features = [
                'popup=yes',
                'width=1200',
                'height=850',
                'left=' + Math.max(0, Math.round((screen.width  - 1200) / 2)),
                'top='  + Math.max(0, Math.round((screen.height -  850) / 2)),
                'resizable=yes',
                'scrollbars=yes'
            ].join(',');

            var win = window.open('', WIN_NAME, features);
            if (!win) {
                alert('Не удалось открыть окно.\nРазрешите popup-окна для этого сайта.');
                return;
            }

            var resolver = new BlobResolver(project);

            _current = {
                win: win,
                resolver: resolver,
                watchdog: null
            };

            this._navigateTo(win, resolver, project, main);

            /* Сторож: освобождаем blob-URL, когда окно закрыто. */
            var self = this;
            _current.watchdog = setInterval(function () {
                if (!win || win.closed) {
                    clearInterval(_current.watchdog);
                    try { resolver.revokeAll(); } catch (e) {}
                    _current = null;
                }
            }, 1000);

            try { win.focus(); } catch (e) {}
        },

        /* Закрыть текущее окно и освободить ресурсы. */
        _closeCurrent: function () {
            if (!_current) return;
            try {
                if (_current.watchdog) clearInterval(_current.watchdog);
                if (_current.resolver) _current.resolver.revokeAll();
                if (_current.win && !_current.win.closed) _current.win.close();
            } catch (e) {}
            _current = null;
        },

        /* ------------------------------------------------------------------
           Навигация внутри окна
           ------------------------------------------------------------------ */
        _navigateTo: function (win, resolver, project, pagePath) {
            var f = project.files[pagePath];
            if (!f) {
                alert('Файл не найден в проекте: ' + pagePath);
                return;
            }

            var raw = f.content || '';
            var html = this._renderPage(project, pagePath, resolver, raw);

            try {
                win.document.open();
                win.document.write(html);
                win.document.close();
            } catch (e) {
                alert('Ошибка записи в окно: ' + e.message);
                return;
            }

            /* Сохраняем состояние — оно переживёт замену DOM. */
            try {
                win.__wbProject = {
                    project: project,
                    resolver: resolver,
                    currentPath: pagePath
                };
            } catch (e) { /* cross-origin? — маловероятно */ }

            this._bindNavigation(win, resolver, project);
        },

        _renderPage: function (project, pagePath, resolver, rawContent) {
            var doc;
            try {
                doc = new DOMParser().parseFromString(rawContent, 'text/html');
            } catch (e) {
                doc = null;
            }
            if (!doc || !doc.documentElement) {
                /* Fallback: не удалось распарсить — отдаём как есть. */
                return rawContent;
            }

            /* Убираем <base> — он бы ломал blob-URL. */
            var bases = doc.querySelectorAll('base');
            for (var i = 0; i < bases.length; i++) {
                bases[i].parentNode.removeChild(bases[i]);
            }

            /* Переписываем URL-атрибуты. */
            rewriteURLs(doc, pagePath, resolver, project);

            /* Собираем HTML. */
            var doctype = '<!DOCTYPE html>';
            return doctype + '\n' + doc.documentElement.outerHTML;
        },

        /* ------------------------------------------------------------------
           Привязка обработчиков навигации
           ------------------------------------------------------------------ */
        _bindNavigation: function (win, resolver, project) {
            var self = this;
            var doc = win.document;
            if (!doc) return;

            /* Клик по <a data-wb-nav>. */
            doc.addEventListener('click', function (e) {
                var a = e.target;
                while (a && a.tagName && a.tagName.toLowerCase() !== 'a') a = a.parentNode;
                if (!a || !a.getAttribute) return;

                var nav = a.getAttribute('data-wb-nav');
                if (!nav) return;

                e.preventDefault();
                e.stopPropagation();
                self._navigateTo(win, resolver, project, nav);
            }, true);

            /* Submit на <form> с action внутри проекта. */
            doc.addEventListener('submit', function (e) {
                var fm = e.target;
                if (!fm || !fm.tagName || fm.tagName.toLowerCase() !== 'form') return;
                var action = fm.getAttribute && fm.getAttribute('action');
                if (!action) return;

                /* Находим data-wb-nav — он был проставлен в rewriteURLs. */
                var nav = fm.getAttribute('data-wb-nav');
                if (!nav) return;

                e.preventDefault();
                e.stopPropagation();
                self._navigateTo(win, resolver, project, nav);
            }, true);

            /* Ctrl+R / F5 / F9 — перезагрузить текущую страницу проекта. */
            doc.addEventListener('keydown', function (e) {
                if (e.keyCode === 116 ||
                    (e.ctrlKey && e.keyCode === 82) ||
                    e.keyCode === 120) {
                    e.preventDefault();
                    e.stopPropagation();
                    var st = win.__wbProject;
                    if (st && st.currentPath) {
                        self._navigateTo(win, resolver, project, st.currentPath);
                    }
                }
            }, true);
        },

        /* ------------------------------------------------------------------
           Служебное: обновление после project:changed
           ------------------------------------------------------------------ */
        _attachBus: function () {
            var self = this;
            bus.on('project:changed', function () {
                /* На лету не обновляем — окно остаётся снимком.
                   Пользователь перезапускает Run Project для обновления. */
            });
        }
    };

    ProjectRunner._attachBus();

    global.ProjectRunner = ProjectRunner;

})(window);
/* ProjectResolver — подменяет относительные пути к файлам проекта
   на blob:/data: URL, чтобы браузер мог их загрузить.

   Зачем: <iframe src="page.html">, <img src="logo.png"> и т.п.
   пытаются скачать файл по HTTP относительно URL IDE, что даёт 404 —
   файлы проекта лежат в LocalStorage, а не на сервере.

   Механика:
     1. Для элемента с URL-атрибутом (src/href/data/…) проверяем,
        совпадает ли значение с путём файла в текущем проекте.
     2. Если да — создаём blob-URL (для текстовых файлов) или
        берём data-URL (для картинок) и записываем его в атрибут.
     3. Оригинальный путь сохраняется в data-wb-orig-<attr>.
     4. cleanHtml() и Inspector читают оригинал, а не blob-URL.

   Автоматически подписан на:
     - 'project:changed' — сбрасывает кэш blob-URL и переприменяет;
     - 'canvas:changed'  — переприменяет для элементов, добавленных
                           без ведома Inspector (paste, drag&drop и т.п.). */
(function (global) {
    'use strict';

    /* Каким тегам какие атрибуты подменяем. */
    function attrsFor(tag) {
        if (tag === 'img' || tag === 'iframe' || tag === 'script' ||
            tag === 'video' || tag === 'audio' || tag === 'source' ||
            tag === 'embed' || tag === 'track') {
            return ['src'];
        }
        if (tag === 'link')   return ['href'];
        if (tag === 'object') return ['data'];
        return [];
    }

    /* MIME-типы по расширению — нужны, чтобы iframe рендерил HTML,
       а не скачивал файл; script — выполнялся как JS; и т.д. */
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

    /* Значение уже является абсолютной ссылкой? */
    function isAbsolute(v) {
        return /^(data:|blob:|https?:|mailto:|tel:|javascript:|#|\/\/)/i.test(String(v || ''));
    }

    function getFile(path) {
        var pm = global.IDE && global.IDE.projectManager;
        if (!pm || !pm.current || !pm.current.files) return null;
        return pm.current.files[path] || null;
    }

    function isProjectPath(path) {
        if (!path) return false;
        if (isAbsolute(path)) return false;
        return !!getFile(path);
    }

    /* ---------- Кэш blob-URL ---------- */
    var _cache = {};   /* path → { key, url } */

    function _cacheKey(f) {
        var c = String(f.content || '');
        return c.length + '|' + (c.length >= 32 ? c.substr(0, 16) + c.slice(-16) : c);
    }

    function resolve(path) {
        if (!isProjectPath(path)) return path;

        var f = getFile(path);

        /* Картинки уже хранятся как data-URL — отдаём как есть. */
        if (f.kind === 'image' && /^data:/i.test(f.content || '')) {
            return f.content;
        }

        var key = _cacheKey(f);
        var c = _cache[path];
        if (c && c.key === key) return c.url;

        try {
            var blob = new Blob([f.content || ''], { type: mimeFor(path) });
            var url = URL.createObjectURL(blob);
            if (c) { try { URL.revokeObjectURL(c.url); } catch (e) {} }
            _cache[path] = { key: key, url: url };
            return url;
        } catch (e) {
            return path;
        }
    }

    function invalidate() {
        for (var k in _cache) {
            if (_cache.hasOwnProperty(k)) {
                try { URL.revokeObjectURL(_cache[k].url); } catch (e) {}
            }
        }
        _cache = {};
    }

    /* ---------- Обработка одного элемента ---------- */
    function applyElement(el) {
        if (!el || el.nodeType !== 1) return;

        var tag = el.tagName.toLowerCase();
        var names = attrsFor(tag);
        if (!names.length) return;

        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            var orig    = el.getAttribute('data-wb-orig-' + name);
            var current = el.getAttribute(name);

            if (orig != null) {
                /* Мы уже подменяли это значение. Проверяем:
                   - если текущее значение всё ещё blob:/data: (наша подмена) —
                     освежаем (например, после project:changed);
                   - если текущее значение изменилось извне (кто-то вручную
                     переписал src) — снимаем метку и обрабатываем заново. */
                if (current && /^(blob:|data:)/i.test(current)) {
                    var res = resolve(orig);
                    if (res !== current) {
                        try { el.setAttribute(name, res); } catch (e) {}
                    }
                    continue;
                }
                el.removeAttribute('data-wb-orig-' + name);
                /* fall-through к обработке как свежего значения */
            }

            if (!current) continue;
            if (!isProjectPath(current)) continue;

            var resolved = resolve(current);
            if (resolved === current) continue;

            el.setAttribute('data-wb-orig-' + name, current);
            try { el.setAttribute(name, resolved); } catch (e) {}
        }
    }

    function applyTree(root) {
        if (!root || root.nodeType !== 1) return;
        applyElement(root);
        var all = root.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) applyElement(all[i]);
    }

    /* ---------- Применение к отдельному атрибуту ----------
       Используется Inspector._set. Снимает старую метку, ставит новую. */
    function applyToAttribute(el, name, value) {
        if (!el || el.nodeType !== 1) return;

        el.removeAttribute('data-wb-orig-' + name);

        if (value == null || value === '') {
            el.removeAttribute(name);
            return;
        }

        var v = String(value);

        if (isProjectPath(v)) {
            var resolved = resolve(v);
            if (resolved !== v) {
                el.setAttribute('data-wb-orig-' + name, v);
                el.setAttribute(name, resolved);
                return;
            }
        }

        el.setAttribute(name, v);
    }

    /* ---------- Полное переприменение (после смены проекта) ---------- */
    function reapplyAll() {
        invalidate();
        var canvas = global.IDE && global.IDE._canvas;
        if (!canvas || !canvas.getDoc) return;
        var doc = canvas.getDoc();
        if (!doc || !doc.documentElement) return;
        applyTree(doc.documentElement);
    }

    /* ---------- Подписка на события ---------- */
    if (global.EventBus) {
        global.EventBus.on('project:changed', function () {
            /* Откладываем на следующий тик, чтобы DOM успел обновиться
               (например, после ProjectTree.rebuild). */
            setTimeout(reapplyAll, 0);
        });

        global.EventBus.on('canvas:changed', function () {
            var canvas = global.IDE && global.IDE._canvas;
            if (!canvas || !canvas.getDoc) return;
            var doc = canvas.getDoc();
            if (!doc || !doc.documentElement) return;
            /* Уже помеченные элементы — быстро пропускаются, так что
               полный обход недорогой. */
            applyTree(doc.documentElement);
        });
    }

    global.ProjectResolver = {
        isProjectPath:    isProjectPath,
        resolve:          resolve,
        applyElement:     applyElement,
        applyTree:        applyTree,
        applyToAttribute: applyToAttribute,
        invalidate:       invalidate
    };

})(window);
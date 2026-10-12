/* ZipUtils — экспорт/импорт ZIP-архивов проекта и компонентов.

   Файлы в lib/wb-component/ помечаются на импорте как _system:'wb-lib'
   и не отображаются в дереве. При экспорте попадают в архив как есть.

   Экспорт HTML-файлов:
     При выгрузке проекта в ZIP:
       1. Самозакрытые стандартные HTML-теги (<div/>, <span/>, …) в HTML
          нормализуются в <tag></tag> — иначе браузер трактует <div .../>
          как ОТКРЫВАЮЩИЙ и вкладывает следующий контент внутрь (первый
          компонент «исчезает», второй наезжает).
       2. В <head> каждого HTML/Frm-файла, использующего пользовательские
          компоненты ([data-wb-user-comp]), вставляются <link>/<script> на
          lib/wb-component/{core.js,<cmptype>.js,<cmptype>.css}. */
(function (global) {
    'use strict';
    var JSZIP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    var _loading = null;

    var KEEP_NAME = '.keep';
    var KEEP_RE   = /(^|\/)\.keep$/;
    var LIB_DIR   = 'lib/wb-component/';

    function isKeep(path) { return path === KEEP_NAME || KEEP_RE.test(path); }

    function loadJSZip() {
        return new Promise(function (resolve, reject) {
            if (global.JSZip) { resolve(global.JSZip); return; }
            if (_loading) { _loading.then(resolve, reject); return; }
            _loading = new Promise(function (res, rej) {
                var s = document.createElement('script');
                s.src = JSZIP_CDN; s.async = true;
                s.onload = function () {
                    if (global.JSZip) res(global.JSZip);
                    else rej(new Error('JSZip загружен, но не определён глобально.'));
                };
                s.onerror = function () { rej(new Error('Не удалось загрузить JSZip с CDN.')); };
                document.head.appendChild(s);
            });
            _loading.then(resolve, reject);
        });
    }

    function extOf(path) { var m = String(path || '').match(/\.([^.\\\/]+)$/); return m ? m[1].toLowerCase() : ''; }
    function mimeFor(e) {
        return global.FilePreview && global.FilePreview._mimeForExt
            ? global.FilePreview._mimeForExt(e) : ('image/' + e);
    }
    function normalizeCustomProps(arr) {
        var out = [];
        if (!Array.isArray(arr)) return out;
        for (var i = 0; i < arr.length; i++) {
            var p = arr[i] || {};
            out.push({
                name: p.name || '', caption: p.caption || p.name || '',
                type: p.type || 'string', values: p.values || '', unit: p.unit || '',
                fieldType: p.fieldType || 'none', fieldUrl: p.fieldUrl || '',
                fieldPredefined: p.fieldPredefined || '', onChangeFunc: p.onChangeFunc || ''
            });
        }
        return out;
    }

    /* ------------------------------------------------------------------
       Нормализация самозакрытых стандартных HTML-тегов.

       В text/html браузер трактует <div .../> как ОТКРЫВАЮЩИЙ — следующий
       элемент становится вложенным. Это ломает визуализацию
       user-компонентов: верхний <div data-wb-user-comp …/> «съедает»
       нижний, получает ребёнка, hasRealContent() возвращает true — и HTML
       в него не инжектится.

       Разворачиваем <tag …/> в <tag …></tag> для всех стандартных
       HTML-контейнеров. Void-теги (<br>, <img>, …) не трогаем.
       Custom-теги (cmp*, component) тоже не трогаем — их обрабатывают
       expandSelfClosing* в canvas-core.js при загрузке.

       Регулярка написана так, чтобы корректно обрабатывать:
         • обычные атрибуты;
         • значения в одинарных / двойных кавычках;
         • пробелы перед `/>`.
       ------------------------------------------------------------------ */
    var HTML_VOID_TAGS = {
        area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1,
        link:1, meta:1, param:1, source:1, track:1, wbr:1
    };
    /* <tag ATTRS /> — ATTRS содержит любые символы, кроме <, >, кавычек
       внутри которых допустимы пробелы/слэши/спецсимволы. */
    var HTML_SELF_CLOSE_RE = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+(?:[^"'<>\/]|\/(?!>)|"[^"]*"|'[^']*')*?)?)\s*\/>/g;
    function normalizeSelfClosingTags(html) {
        if (!html) return html;
        return String(html).replace(HTML_SELF_CLOSE_RE, function (m, tag, attrs) {
            var t = tag.toLowerCase();
            if (HTML_VOID_TAGS[t]) return m;
            if (t.indexOf('cmp') === 0) return m;
            if (t === 'component') return m;
            return '<' + tag + (attrs || '') + '></' + tag + '>';
        });
    }

    /* ------------------------------------------------------------------
       Инжект библиотек в HTML
       ------------------------------------------------------------------ */

    function collectCmptypesInHtml(html) {
        var used = {};
        var m;
        var re1 = /\bdata-wb-user-comp\s*=\s*"[^"]*"[^>]*\bcmptype\s*=\s*"([^"]+)"/gi;
        while ((m = re1.exec(html)) !== null) used[m[1]] = true;
        var re2 = /\bcmptype\s*=\s*"([^"]+)"[^>]*\bdata-wb-user-comp\s*=/gi;
        while ((m = re2.exec(html)) !== null) used[m[1]] = true;
        return Object.keys(used);
    }

    function buildLibTagsFor(cmptypes, project) {
        if (!cmptypes || !cmptypes.length) return '';
        var files = (project && project.files) || {};
        var tags = [];
        var i, safe, path;

        for (i = 0; i < cmptypes.length; i++) {
            safe = String(cmptypes[i]).replace(/[^A-Za-z0-9_.-]/g, '_');
            path = LIB_DIR + safe + '.css';
            if (files[path]) {
                tags.push('<link rel="stylesheet" href="' + path + '">');
            }
        }
        path = LIB_DIR + 'core.js';
        if (files[path]) {
            tags.push('<script src="' + path + '"></script>');
        }
        for (i = 0; i < cmptypes.length; i++) {
            safe = String(cmptypes[i]).replace(/[^A-Za-z0-9_.-]/g, '_');
            path = LIB_DIR + safe + '.js';
            if (files[path]) {
                tags.push('<script src="' + path + '"></script>');
            }
        }
        return tags.join('\n');
    }

    function hasLibTags(html) {
        return /(?:src|href)\s*=\s*["']lib\/wb-component\//i.test(html);
    }

    /* Вставляет теги библиотек в <head> HTML-строки.
   Возвращает изменённую строку либо исходную, если инжект не нужен.

   Добавляет:
     1. <link> для CSS библиотек user-компонентов;
     2. <script> для JS библиотек user-компонентов;
     3. lib/wb-component/core.js и <cmptype>.{css,js} (как раньше). */
    function injectLibTagsIntoHtml(html, project) {
        if (!html || !project) return html;

        var cmptypes = collectCmptypesInHtml(html);
        if (!cmptypes.length) return html;

        /* Внешние библиотеки (https://…) — соберём из ComponentStorage. */
        var extCss = [], extJs = [];
        if (global.ComponentStorage) {
            var seenCss = {}, seenJs = {};
            for (var i = 0; i < cmptypes.length; i++) {
                var uc = global.ComponentStorage.findByCmptype(cmptypes[i]);
                if (!uc) continue;
                var libs = global.ComponentStorage.getComponentLibs(uc);
                for (var c = 0; c < libs.cssLibs.length; c++) {
                    var cu = libs.cssLibs[c].value;
                    if (!cu || seenCss[cu]) continue;
                    seenCss[cu] = true;
                    extCss.push(cu);
                }
                for (var j = 0; j < libs.jsLibs.length; j++) {
                    var ju = libs.jsLibs[j].value;
                    if (!ju || seenJs[ju]) continue;
                    seenJs[ju] = true;
                    extJs.push(ju);
                }
            }
        }

        /* Теги lib/wb-component/*, которые нужно добавить (если их нет). */
        var wbTags = buildLibTagsFor(cmptypes, project);

        var hasLib = hasLibTags(html);

        /* Если ни внешних, ни wb-библиотек нет — выходим. */
        if (!extCss.length && !extJs.length && !wbTags) return html;

        var injectParts = [];
        if (extCss.length) {
            for (var cc = 0; cc < extCss.length; cc++) {
                injectParts.push('<link rel="stylesheet" href="' + extCss[cc] + '">');
            }
        }
        if (extJs.length) {
            for (var jj = 0; jj < extJs.length; jj++) {
                injectParts.push('<script src="' + extJs[jj] + '"></script>');
            }
        }
        if (wbTags && !hasLib) injectParts.push(wbTags);

        if (!injectParts.length) return html;
        var inject = '\n' + injectParts.join('\n') + '\n';

        if (/<\/head>/i.test(html)) {
            return html.replace(/<\/head>/i, inject + '</head>');
        }
        if (/<body[\s>]/i.test(html)) {
            return html.replace(/(<body[\s>])/i, '<head>' + inject + '</head>\n$1');
        }
        return inject + html;
    }

    /* ------------------------------------------------------------------
       ZipUtils
       ------------------------------------------------------------------ */

    var ZipUtils = {
        readManifest: function (file) {
            return loadJSZip().then(function (JSZip) { return JSZip.loadAsync(file); })
                .then(function (zip) {
                    var entry = zip.file('project.json');
                    if (!entry) return null;
                    return entry.async('string').then(function (txt) {
                        try { return JSON.parse(txt); } catch (e) { return null; }
                    });
                });
        },

        exportProject: function (project, opts) {
            if (!project) return;
            opts = opts || {};

            if (global.ComponentStorage && global.ComponentStorage.syncProjectLibraries) {
                var canvas = global.IDE && global.IDE._canvas;
                global.ComponentStorage.syncProjectLibraries(project, canvas);
            }

            var isComponent = opts.asComponent === true
                || project.rootType === 'component'
                || (global.App && global.App._componentMode);

            loadJSZip().then(function (JSZip) {
                var zip = new JSZip();

                var manifest = {
                    name: project.name || '',
                    mainFile: project.mainFile || '',
                    version: 4,
                    type: isComponent ? 'component' : 'project',
                    rootType: isComponent ? 'component' : (project.rootType || 'html')
                };

                if (isComponent) {
                    var cd = project.componentData;
                    if (!cd && global.componentTab && global.componentTab.getFormData) {
                        try { cd = global.componentTab.getFormData(); } catch (e) { cd = null; }
                    }
                    cd = cd || {};
                    manifest.component = {
                        name: cd.name || project.name || 'Component',
                        icon: cd.icon || '', tagName: cd.tagName || 'div',
                        cmptype: cd.cmptype || '', description: cd.description || '',
                        jsLibs: Array.isArray(cd.jsLibs) ? cd.jsLibs : [],
                        cssLibs: Array.isArray(cd.cssLibs) ? cd.cssLibs : [],
                        js: cd.js || '', css: cd.css || '',
                        previewIdeHtml: cd.previewIdeHtml || '',
                        customProperties: normalizeCustomProps(cd.customProperties),
                        customEvents: Array.isArray(cd.customEvents) ? cd.customEvents : [],
                        nestingMode: cd.nestingMode || 'all',
                        nestingRules: Array.isArray(cd.nestingRules) ? cd.nestingRules : []
                    };
                }

                zip.file('project.json', JSON.stringify(manifest, null, 2));

                var files = project.files || {};
                for (var path in files) {
                    if (!files.hasOwnProperty(path)) continue;
                    if (isKeep(path)) continue;
                    var f = files[path];
                    if (!f) continue;
                    var content = f.content || '';

                    if (f.kind === 'text' && /\.(html?|frm)$/i.test(path)) {
                        /* Сначала раскрываем <tag/> → <tag></tag>,
                           потом добавляем <link>/<script> на библиотеки. */
                        content = normalizeSelfClosingTags(content);
                        content = injectLibTagsIntoHtml(content, project);
                    }

                    if (/^data:/.test(content)) {
                        var m = content.match(/^data:[^;,]*;base64,(.*)$/);
                        if (m) { zip.file(path, m[1], { base64: true }); continue; }
                    }
                    zip.file(path, String(content));
                }

                return zip.generateAsync({ type: 'blob' });
            }).then(function (blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                var baseName = project.name || 'project';
                if (isComponent) baseName += '.component';
                a.download = baseName + '.zip';
                document.body.appendChild(a);
                a.click();
                setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
            }).catch(function (err) { alert('Ошибка экспорта ZIP: ' + (err && err.message || err)); });
        },

        importInto: function (project, file) {
            if (!project) return Promise.reject(new Error('No project'));

            return loadJSZip().then(function (JSZip) { return JSZip.loadAsync(file); })
                .then(function (zip) {
                    var tasks = [];
                    var mainFromManifest = null;
                    var emptyDirs = {};
                    var manifest = null;

                    var projJson = zip.file('project.json');
                    if (projJson) {
                        tasks.push(projJson.async('string').then(function (txt) {
                            try { manifest = JSON.parse(txt); } catch (e) { manifest = null; }
                            if (manifest && manifest.mainFile) mainFromManifest = manifest.mainFile;
                        }));
                    }

                    zip.forEach(function (relPath, entry) {
                        if (relPath === 'project.json') return;
                        if (entry.dir) {
                            var dir = relPath.replace(/\/+$/, '');
                            if (dir) emptyDirs[dir] = true;
                            return;
                        }
                        if (isKeep(relPath)) return;

                        var isLib = relPath.indexOf(LIB_DIR) === 0;
                        var e = extOf(relPath);
                        var isImage = /^(png|jpg|jpeg|gif|bmp|webp|svg|ico)$/.test(e);

                        if (isImage) {
                            tasks.push(entry.async('base64').then(function (b64) {
                                project.files[relPath] = {
                                    kind: 'image',
                                    _system: isLib ? 'wb-lib' : undefined,
                                    content: 'data:' + mimeFor(e) + ';base64,' + b64
                                };
                            }));
                        } else {
                            tasks.push(entry.async('string').then(function (txt) {
                                project.files[relPath] = {
                                    kind: 'text',
                                    _system: isLib ? 'wb-lib' : undefined,
                                    content: txt
                                };
                            }));
                        }
                    });

                    return Promise.all(tasks).then(function () {
                        for (var dir in emptyDirs) {
                            if (!emptyDirs.hasOwnProperty(dir)) continue;
                            var prefix = dir + '/';
                            var hasRealFile = false;
                            for (var p in project.files) {
                                if (!project.files.hasOwnProperty(p)) continue;
                                if (p.indexOf(prefix) === 0 && !isKeep(p)) { hasRealFile = true; break; }
                            }
                            if (!hasRealFile) {
                                project.files[prefix + KEEP_NAME] = { kind: 'text', content: '' };
                            }
                        }
                        if (mainFromManifest && project.files[mainFromManifest]) {
                            project.mainFile = mainFromManifest;
                        }
                        project._lastImportedManifest = manifest;
                        return project;
                    });
                });
        }
    };

    ZipUtils.injectLibTagsIntoHtml    = injectLibTagsIntoHtml;
    ZipUtils.collectCmptypesInHtml    = collectCmptypesInHtml;
    ZipUtils.normalizeSelfClosingTags = normalizeSelfClosingTags;

    global.ZipUtils = ZipUtils;
})(window);
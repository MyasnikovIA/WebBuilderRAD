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
          компоненты ([data-wb-user-comp]), вставляются:
            • внешние libs (jsLibs / cssLibs из ComponentStorage);
            • <link>/<script> на lib/wb-component/{core.js,<cmptype>.js,
              <cmptype>.css}.

   Компонентный проект (type: 'component', rootType: 'component'):
     manifest.component формируется из project.componentData. Но если
     IDE открыта на том же проекте в режиме Root: component —
     предпочитаются свежие данные из ComponentTab, чтобы не терять
     только что введённые jsLibs / cssLibs (пользователь мог не
     нажать Save Project перед экспортом). */
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
    function normalizeLibs(arr) {
        var out = [];
        if (!Array.isArray(arr)) return out;
        for (var i = 0; i < arr.length; i++) {
            var e = arr[i];
            if (!e) continue;
            if (typeof e === 'string') {
                out.push({ type: 'url', value: e });
            } else {
                out.push({ type: e.type || 'url', value: e.value || '' });
            }
        }
        return out;
    }

    /* ------------------------------------------------------------------
       Нормализация самозакрытых стандартных HTML-тегов.
       ------------------------------------------------------------------ */
    var HTML_VOID_TAGS = {
        area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1,
        link:1, meta:1, param:1, source:1, track:1, wbr:1
    };
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
       Инжект библиотек в HTML.
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
     Добавляет:
       1. <link> для CSS библиотек user-компонентов;
       2. <script> для JS библиотек user-компонентов;
       3. lib/wb-component/core.js и <cmptype>.{css,js}.

     Идемпотентность: теги на URL, уже присутствующие в HTML,
     повторно не добавляются — важно, потому что файл может быть
     прогнан через функцию несколько раз (автосейв, экспорт, снова
     автосейв). */
    function injectLibTagsIntoHtml(html, project) {
        if (!html || !project) return html;

        var cmptypes = collectCmptypesInHtml(html);
        if (!cmptypes.length) return html;

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

        /* ← НОВОЕ: не дублируем теги, которые уже есть в html — при
           повторном сохранении того же файла (автосейв, экспорт)
           они бы накапливались. */
        function dropExisting(list, attrName) {
            var out = [];
            for (var k = 0; k < list.length; k++) {
                var url = list[k];
                var esc = String(url).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var re = new RegExp(
                    '\\b' + attrName + '\\s*=\\s*["\']' + esc + '["\']', 'i'
                );
                if (!re.test(html)) out.push(url);
            }
            return out;
        }
        extCss = dropExisting(extCss, 'href');
        extJs  = dropExisting(extJs,  'src');

        var wbTags = buildLibTagsFor(cmptypes, project);
        var hasLib = hasLibTags(html);

        if (!extCss.length && !extJs.length && (!wbTags || hasLib)) return html;

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

        /* ------------------------------------------------------------------
   exportProject

   При isComponent === true manifest.component формируется так:
     1. Если IDE в режиме Root: component И открыт тот же проект —
        берём живой componentTab.getFormData().
     2. Иначе — project.componentData.
     3. Если в обоих пустые jsLibs / cssLibs, но ComponentTab
        жив — добираем libs из DOM через _collectLibs.
     4. ← ИЗМЕНЕНО: если previewIdeHtml пуст или совпадает
        с дефолтной заготовкой ComponentTab — берём реальный
        HTML сцены (canvas.cleanHtml()).

   Это гарантирует, что пользовательские jsLibs / cssLibs
   и реальный HTML виджета попадут в project.json при экспорте,
   даже если пользователь забыл предварительно сохранить проект. */
        exportProject: function (project, opts) {
            if (!project) return;
            opts = opts || {};

            /* Перед экспортом обновляем lib-файлы. */
            if (global.ComponentStorage && global.ComponentStorage.syncProjectLibraries) {
                var canvasForSync = global.IDE && global.IDE._canvas;
                global.ComponentStorage.syncProjectLibraries(project, canvasForSync);
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
                    /* 1. Живые данные из ComponentTab. */
                    var liveCd = null;
                    try {
                        var pm = global.IDE && global.IDE.projectManager;
                        var sameProject = pm && pm.current && pm.current.name === project.name;
                        if (global.componentTab && global.componentTab.getFormData && sameProject) {
                            liveCd = global.componentTab.getFormData();
                        }
                    } catch (e) { liveCd = null; }

                    /* 2. Сохранённый componentData. */
                    var storedCd = project.componentData || {};

                    /* 3. Libs из DOM ComponentTab. */
                    var domJs = [], domCss = [];
                    try {
                        if (global.componentTab && global.componentTab._collectLibs) {
                            domJs  = global.componentTab._collectLibs('js')  || [];
                            domCss = global.componentTab._collectLibs('css') || [];
                        }
                    } catch (e) { /* ignore */ }

                    function pickLibs(liveArr, storedArr, domArr) {
                        if (Array.isArray(liveArr) && liveArr.length)   return liveArr;
                        if (Array.isArray(domArr) && domArr.length)     return domArr;
                        if (Array.isArray(storedArr) && storedArr.length) return storedArr;
                        return [];
                    }

                    var effName        = (liveCd && liveCd.name)        || storedCd.name        || project.name || 'Component';
                    var effIcon        = (liveCd && liveCd.icon)        || storedCd.icon        || '';
                    var effTagName     = (liveCd && liveCd.tagName)     || storedCd.tagName     || 'div';
                    var effCmptype     = (liveCd && liveCd.cmptype)     || storedCd.cmptype     || '';
                    var effDescription = (liveCd && liveCd.description) || storedCd.description || '';
                    var effJsLibs      = pickLibs(
                        liveCd && liveCd.jsLibs,
                        storedCd.jsLibs,
                        domJs
                    );
                    var effCssLibs     = pickLibs(
                        liveCd && liveCd.cssLibs,
                        storedCd.cssLibs,
                        domCss
                    );
                    var effJs          = (liveCd && liveCd.js)          || storedCd.js          || '';
                    var effCss         = (liveCd && liveCd.css)         || storedCd.css         || '';
                    var effPreview     = (liveCd && liveCd.previewIdeHtml) || storedCd.previewIdeHtml || '';
                    var effProps       = (liveCd && liveCd.customProperties) || storedCd.customProperties || [];
                    var effEvents      = (liveCd && liveCd.customEvents)     || storedCd.customEvents     || [];
                    var effNestingMode = (liveCd && liveCd.nestingMode)      || storedCd.nestingMode      || 'all';
                    var effNestingRls  = (liveCd && liveCd.nestingRules)     || storedCd.nestingRules     || [];

                    /* ← ИЗМЕНЕНО: если PreViewIDE пуст или дефолтная
                       заготовка — берём реальный HTML сцены. */
                    var isDefault = !global.ComponentTab
                        || typeof global.ComponentTab.isDefaultPreview !== 'function'
                        || global.ComponentTab.isDefaultPreview(effPreview);

                    if (isDefault) {
                        var canvasX = global.IDE && global.IDE._canvas;
                        if (canvasX && canvasX.cleanHtml) {
                            try {
                                var sceneHtmlX = canvasX.cleanHtml();
                                if (sceneHtmlX && sceneHtmlX.replace(/\s+/g, '')) {
                                    effPreview = sceneHtmlX;
                                }
                            } catch (e) { /* ignore */ }
                        }
                    }

                    manifest.component = {
                        name:            effName,
                        icon:            effIcon,
                        tagName:         effTagName,
                        cmptype:         effCmptype,
                        description:     effDescription,
                        /* ← НОВОЕ: признак видимости. Приоритет — как у libs:
                           liveCd, потом storedCd, иначе true. */
                        visible: (liveCd && liveCd.visible != null)
                            ? liveCd.visible
                            : ((storedCd.visible != null) ? storedCd.visible : true),
                        jsLibs:          normalizeLibs(effJsLibs),
                        cssLibs:         normalizeLibs(effCssLibs),
                        js:              effJs,
                        css:             effCss,
                        previewIdeHtml:  effPreview,
                        customProperties: normalizeCustomProps(effProps),
                        customEvents:    Array.isArray(effEvents) ? effEvents : [],
                        nestingMode:     effNestingMode,
                        nestingRules:    Array.isArray(effNestingRls) ? effNestingRls : []
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
/* ZipUtils — экспорт проекта в ZIP и импорт ZIP-архива в проект.

   Манифест project.json:
     {
       name:     '...',
       mainFile: 'index.html',
       version:  3,
       type:     'project' | 'component',
       rootType: 'html' | 'cmpForm' | 'm2Form' | 'div' | 'component',
       component: {
         name, icon, tagName, cmptype, description,
         jsLibs, cssLibs, js, css, previewIdeHtml,
         customProperties: [ { name, caption, type, values, unit,
                               fieldType, fieldUrl, fieldPredefined } ]
       }   — только при type='component'
     } */
(function (global) {
    'use strict';

    var JSZIP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    var _loading = null;

    var KEEP_NAME = '.keep';
    var KEEP_RE   = /(^|\/)\.keep$/;

    function isKeep(path) {
        return path === KEEP_NAME || KEEP_RE.test(path);
    }

    function loadJSZip() {
        return new Promise(function (resolve, reject) {
            if (global.JSZip) { resolve(global.JSZip); return; }
            if (_loading) { _loading.then(resolve, reject); return; }

            _loading = new Promise(function (res, rej) {
                var s = document.createElement('script');
                s.src = JSZIP_CDN;
                s.async = true;
                s.onload = function () {
                    if (global.JSZip) res(global.JSZip);
                    else rej(new Error('JSZip загружен, но не определён глобально.'));
                };
                s.onerror = function () {
                    rej(new Error('Не удалось загрузить JSZip с CDN.'));
                };
                document.head.appendChild(s);
            });

            _loading.then(resolve, reject);
        });
    }

    function extOf(path) {
        var m = String(path || '').match(/\.([^.\\\/]+)$/);
        return m ? m[1].toLowerCase() : '';
    }

    function mimeFor(e) {
        return global.FilePreview && global.FilePreview._mimeForExt
            ? global.FilePreview._mimeForExt(e)
            : ('image/' + e);
    }

    /* Нормализация customProperties — гарантирует, что во всех записях
       будут все поля, даже если чего-то не было задано. */
    function normalizeCustomProps(arr) {
        var out = [];
        if (!Array.isArray(arr)) return out;
        for (var i = 0; i < arr.length; i++) {
            var p = arr[i] || {};
            out.push({
                name:            p.name || '',
                caption:         p.caption || p.name || '',
                type:            p.type || 'string',
                values:          p.values || '',
                unit:            p.unit || '',
                fieldType:       p.fieldType || 'none',
                fieldUrl:        p.fieldUrl || '',
                fieldPredefined: p.fieldPredefined || ''
            });
        }
        return out;
    }

    var ZipUtils = {
        /* Чтение project.json без побочных эффектов. Promise<obj|null>. */
        readManifest: function (file) {
            return loadJSZip().then(function (JSZip) {
                return JSZip.loadAsync(file);
            }).then(function (zip) {
                var entry = zip.file('project.json');
                if (!entry) return null;
                return entry.async('string').then(function (txt) {
                    try { return JSON.parse(txt); } catch (e) { return null; }
                });
            });
        },

        /* Экспорт проекта в ZIP.
           opts.asComponent === true — принудительно пометить как компонент. */
        exportProject: function (project, opts) {
            if (!project) return;
            opts = opts || {};

            var isComponent = opts.asComponent === true
                || project.rootType === 'component'
                || (global.App && global.App._componentMode);

            loadJSZip().then(function (JSZip) {
                var zip = new JSZip();

                var manifest = {
                    name:     project.name || '',
                    mainFile: project.mainFile || '',
                    version:  3,
                    type:     isComponent ? 'component' : 'project',
                    rootType: isComponent ? 'component' : (project.rootType || 'html')
                };

                if (isComponent) {
                    /* Собираем все поля формы ComponentTab — включая customProperties. */
                    var cd = project.componentData;
                    if (!cd && global.componentTab && global.componentTab.getFormData) {
                        try { cd = global.componentTab.getFormData(); } catch (e) { cd = null; }
                    }
                    cd = cd || {};
                    manifest.component = {
                        name:           cd.name || project.name || 'Component',
                        icon:           cd.icon || '',
                        tagName:        cd.tagName || 'div',
                        cmptype:        cd.cmptype || '',
                        description:    cd.description || '',
                        jsLibs:         Array.isArray(cd.jsLibs)  ? cd.jsLibs  : [],
                        cssLibs:        Array.isArray(cd.cssLibs) ? cd.cssLibs : [],
                        js:             cd.js || '',
                        css:            cd.css || '',
                        previewIdeHtml: cd.previewIdeHtml || '',
                        customProperties: normalizeCustomProps(cd.customProperties)
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

                    if (/^data:/.test(content)) {
                        var m = content.match(/^data:[^;,]*;base64,(.*)$/);
                        if (m) {
                            zip.file(path, m[1], { base64: true });
                            continue;
                        }
                    }

                    zip.file(path, String(content));
                }

                return zip.generateAsync({ type: 'blob' });
            }).then(function (blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                var baseName = (project.name || 'project');
                if (isComponent) baseName += '.component';
                a.download = baseName + '.zip';
                document.body.appendChild(a);
                a.click();
                setTimeout(function () {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            }).catch(function (err) {
                alert('Ошибка экспорта ZIP: ' + (err && err.message || err));
            });
        },

        /* Импорт ZIP в проект (без проверки типа). Promise<Project>. */
        importInto: function (project, file) {
            if (!project) return Promise.reject(new Error('No project'));

            return loadJSZip().then(function (JSZip) {
                return JSZip.loadAsync(file);
            }).then(function (zip) {
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

                    var e = extOf(relPath);
                    var isImage = /^(png|jpg|jpeg|gif|bmp|webp|svg|ico)$/.test(e);

                    if (isImage) {
                        tasks.push(entry.async('base64').then(function (b64) {
                            project.files[relPath] = {
                                kind: 'image',
                                content: 'data:' + mimeFor(e) + ';base64,' + b64
                            };
                        }));
                    } else {
                        tasks.push(entry.async('string').then(function (txt) {
                            project.files[relPath] = {
                                kind: 'text',
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
                            if (p.indexOf(prefix) === 0 && !isKeep(p)) {
                                hasRealFile = true;
                                break;
                            }
                        }
                        if (!hasRealFile) {
                            project.files[prefix + KEEP_NAME] =
                                { kind: 'text', content: '' };
                        }
                    }

                    if (mainFromManifest && project.files[mainFromManifest]) {
                        project.mainFile = mainFromManifest;
                    }

                    /* Сохраняем обработанный манифест на проекте, чтобы
                       ProjectManager мог восстановить режим и componentData. */
                    project._lastImportedManifest = manifest;
                    return project;
                });
            });
        }
    };

    global.ZipUtils = ZipUtils;

})(window);
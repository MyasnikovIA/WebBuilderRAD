/* ComponentExportUtils — экспорт/импорт пользовательских компонентов через ZIP.

   Формат 1 — palette.json (мульти-экспорт нескольких компонентов палитры).
   Формат 2 — project.json с type='component' (компонент, выгруженный из
              проекта в режиме Root: component).

   При импорте принимаются оба. Все поля (в т.ч. customProperties)
   переносятся в палитру без потерь. */
(function (global) {
    'use strict';

    var JSZIP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    var _loading = null;

    function loadJSZip() {
        return new Promise(function (resolve, reject) {
            if (global.JSZip) return resolve(global.JSZip);
            if (_loading) return _loading.then(resolve, reject);
            _loading = new Promise(function (res, rej) {
                var s = document.createElement('script');
                s.src = JSZIP_CDN; s.async = true;
                s.onload = function () {
                    if (global.JSZip) res(global.JSZip);
                    else rej(new Error('JSZip не определён'));
                };
                s.onerror = function () { rej(new Error('Не удалось загрузить JSZip')); };
                document.head.appendChild(s);
            });
            _loading.then(resolve, reject);
        });
    }

    function slug(s) {
        return String(s || 'component').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'component';
    }

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

    function exportComponents(components) {
        if (!components || !components.length) { alert('Нечего экспортировать.'); return; }

        loadJSZip().then(function (JSZip) {
            var zip = new JSZip();
            var manifest = { version: 2, components: [], folders: [] };

            var usedFolders = {};
            for (var i = 0; i < components.length; i++) {
                var fid = components[i].folderId;
                while (fid) {
                    if (usedFolders[fid]) break;
                    var f = global.ComponentStorage.getFolder(fid);
                    if (!f) break;
                    usedFolders[fid] = f;
                    fid = f.parentId || '';
                }
            }
            for (var k in usedFolders) if (usedFolders.hasOwnProperty(k)) manifest.folders.push(usedFolders[k]);
            for (var j = 0; j < components.length; j++) {
                var c = components[j];
                manifest.components.push({
                    id:              c.id,
                    name:            c.name,
                    icon:            c.icon,
                    tagName:         c.tagName,
                    cmptype:         c.cmptype,
                    description:     c.description,
                    jsLibs:          c.jsLibs || [],
                    cssLibs:         c.cssLibs || [],
                    js:              c.js || '',
                    css:             c.css || '',
                    previewIdeHtml:  c.previewIdeHtml || '',
                    customProperties: normalizeCustomProps(c.customProperties),
                    folderId:        c.folderId || ''
                });
            }

            zip.file('palette.json', JSON.stringify(manifest, null, 2));
            return zip.generateAsync({ type: 'blob' });
        }).then(function (blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (components.length === 1
                ? slug(components[0].name) + '.wbcomp.zip'
                : 'wb-palette-' + Date.now().toString(36) + '.zip');
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }).catch(function (err) {
            alert('Ошибка экспорта: ' + (err && err.message || err));
        });
    }

    /* Импорт ZIP → палитра. Promise<stats>. */
    function importComponents(file) {
        return loadJSZip().then(function (JSZip) {
            return JSZip.loadAsync(file);
        }).then(function (zip) {
            var projEntry = zip.file('project.json');
            if (projEntry) {
                return projEntry.async('string').then(function (txt) {
                    var m;
                    try { m = JSON.parse(txt); } catch (e) { m = null; }

                    if (!m || m.type !== 'component') {
                        throw new Error(
                            'Выбранный ZIP-архив не является компонентом.\n' +
                            'Ожидается project.json с полем type = "component".'
                        );
                    }
                    var c = m.component || {};
                    var compData = {
                        name:            c.name || m.name || 'Component',
                        icon:            c.icon || '',
                        tagName:         c.tagName || 'div',
                        cmptype:         c.cmptype || '',
                        description:     c.description || '',
                        js:              c.js || '',
                        css:             c.css || '',
                        previewIdeHtml:  c.previewIdeHtml || '',
                        jsLibs:          c.jsLibs || [],
                        cssLibs:         c.cssLibs || [],
                        customProperties: normalizeCustomProps(c.customProperties),
                        html:            c.previewIdeHtml || c.html || ''
                    };

                    var model = { version: 2, folders: {}, components: {} };
                    model.components[compData.name] = compData;
                    return global.ComponentStorage.mergeWithConfirmation(model);
                });
            }

            var paletteEntry = zip.file('palette.json');
            if (paletteEntry) {
                return paletteEntry.async('string').then(function (txt) {
                    var model = JSON.parse(txt);
                    if (!model || !model.components) {
                        throw new Error('palette.json повреждён.');
                    }
                    if (Array.isArray(model.components)) {
                        var map = {};
                        for (var i = 0; i < model.components.length; i++) {
                            var c = model.components[i];
                            var key = c.id || ('c' + i);
                            map[key] = c;
                        }
                        model.components = map;
                    }
                    return global.ComponentStorage.mergeWithConfirmation(model);
                });
            }

            throw new Error(
                'В ZIP-архиве нет ни project.json, ни palette.json.\n' +
                'Выбранный файл не является компонентом.'
            );
        });
    }

    global.ComponentExportUtils = {
        exportComponents: exportComponents,
        importComponents: importComponents
    };
})(window);
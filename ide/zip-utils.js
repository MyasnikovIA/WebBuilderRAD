/* ZipUtils — экспорт проекта в ZIP и импорт ZIP-архива в проект.

   JSZip загружается лениво с CDN при первом использовании, если
   глобальный JSZip не найден.

   Соглашение о манифесте:
     В корень архива кладётся project.json:
       { "name": "...", "mainFile": "index.html", "version": 1 }
     При импорте, если в архиве есть project.json и указанный mainFile
     существует среди файлов — он становится стартовым.

   Служебный файл .keep (используется для хранения пустых папок):
     • НЕ экспортируется в архив;
     • при импорте создаётся для каждой пустой папки из архива. */
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
                    rej(new Error('Не удалось загрузить JSZip с CDN.\n' +
                        'Проверьте интернет, либо положите jszip.min.js в lib/ ' +
                        'и подключите его в index.html.'));
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

    var ZipUtils = {
        /* Экспорт проекта в ZIP и скачивание. */
        exportProject: function (project) {
            if (!project) return;

            loadJSZip().then(function (JSZip) {
                var zip = new JSZip();

                var manifest = {
                    name:     project.name || '',
                    mainFile: project.mainFile || '',
                    version:  1
                };
                zip.file('project.json', JSON.stringify(manifest, null, 2));

                var files = project.files || {};
                for (var path in files) {
                    if (!files.hasOwnProperty(path)) continue;

                    /* .keep — служебный файл, в архив не пишем. */
                    if (isKeep(path)) continue;

                    var f = files[path];
                    if (!f) continue;

                    var content = f.content || '';

                    /* data URL → base64-полезная нагрузка. */
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
                a.download = (project.name || 'project') + '.zip';
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

        /* Импорт ZIP-файла в проект. Возвращает Promise. */
        importInto: function (project, file) {
            if (!project) return Promise.reject(new Error('No project'));

            return loadJSZip().then(function (JSZip) {
                return JSZip.loadAsync(file);
            }).then(function (zip) {
                var tasks = [];
                var mainFromManifest = null;
                var emptyDirs = {};

                zip.forEach(function (relPath, entry) {
                    /* JSZip отдаёт директории с entry.dir === true.
                       Запоминаем их, чтобы потом создать .keep. */
                    if (entry.dir) {
                        var dir = relPath.replace(/\/+$/, '');
                        if (dir) emptyDirs[dir] = true;
                        return;
                    }

                    /* Пропускаем .keep, если он случайно есть в архиве. */
                    if (isKeep(relPath)) return;

                    if (relPath === 'project.json') {
                        tasks.push(entry.async('string').then(function (txt) {
                            try {
                                var m = JSON.parse(txt);
                                if (m && m.mainFile) mainFromManifest = m.mainFile;
                            } catch (e) { /* ignore */ }
                        }));
                        return;
                    }

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
                    /* Создаём .keep для каждой папки, которая в архиве
                       оказалась пустой (не содержит файлов). */
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
                    return project;
                });
            });
        }
    };

    global.ZipUtils = ZipUtils;

})(window);
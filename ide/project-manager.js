/* ProjectManager — центральный контроллер управления проектами. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    function ProjectManager(opts) {
        opts = opts || {};
        this.opts = opts;
        this.combo  = $(opts.comboSel);
        this.comboEl = this.combo[0];
        this.treeEl = $(opts.treeSel);
        this.current = null;
        this.editing = null;
        this._ctx = null;
        this._saveTimer = null;

        this.tree = new global.ProjectTree(this.treeEl[0]);

        this._bindUI();
        this._bindBus();
        this.refreshCombo();
        this._restoreLast();
    }

    /* ---------------- UI ---------------- */

    ProjectManager.prototype._bindUI = function () {
        var self = this;

        if (this.comboEl) {
            this.comboEl.addEventListener('change', function () {
                var name = self.comboEl.value;
                if (!self._confirmSwitchProject(name)) {
                    self.comboEl.value = self.current ? self.current.name : '';
                    return;
                }
                if (name) self.load(name);
                else self.close();
            }, false);
        }

        var btnNew = document.querySelector(this.opts.btnNewSel);
        if (btnNew) {
            btnNew.addEventListener('click', function () { self.createNew(); }, false);
        }

        var btnDel = document.querySelector(this.opts.btnDelSel);
        if (btnDel) {
            btnDel.addEventListener('click', function () { self.deleteCurrent(); }, false);
        }
    };

    ProjectManager.prototype._bindBus = function () {
        var self = this;

        bus.on('project:contextmenu', function (e) { self.showContextMenu(e); });

        bus.on('project:file:preview', function (e) {
            global.FilePreview.open(e.path, e.data);
        });

        bus.on('project:file:edit-visual', function (e) {
            var canvas = global.IDE && global.IDE._canvas;
            if (!canvas) return;

            if (self.editing && self.editing.path !== e.path) {
                if (!self._confirmSwitchFrom(canvas)) return;
            }

            self.editing = {
                path: e.path,
                project: self.current,
                initialClean: ''
            };

            var html = (e.data && e.data.content) || '';
            try {
                canvas.loadHtml(html);
                try { self.editing.initialClean = canvas.cleanHtml(); }
                catch (ex) { self.editing.initialClean = ''; }
                bus.emit('project:editing:started', { path: e.path });
            } catch (ex) {
                alert('Ошибка загрузки HTML в редактор: ' + ex.message);
                self.editing = null;
            }
        });

        bus.on('canvas:changed', function () {
            if (!self.editing || !self.current) return;
            var canvas = global.IDE && global.IDE._canvas;
            if (!canvas) return;
            if (!self._hasUnsavedChanges(canvas)) return;

            clearTimeout(self._saveTimer);
            self._saveTimer = setTimeout(function () {
                self._saveCurrentEdit(canvas);
            }, 700);
        });

        bus.on('canvas:rootType:changed', function () {
            if (!self.current) return;
            self.save();
        });
    };

    /* ---------------- Диалог сохранения при переключении ---------------- */

    ProjectManager.prototype._hasUnsavedChanges = function (canvas) {
        if (!this.editing || !canvas) return false;
        var current;
        try { current = canvas.cleanHtml(); }
        catch (e) { return false; }
        return current !== (this.editing.initialClean || '');
    };

    ProjectManager.prototype._confirmSwitchFrom = function (canvas) {
        if (!this.editing) return true;
        if (!this._hasUnsavedChanges(canvas)) return true;

        var path = this.editing.path;
        var save = confirm(
            'Файл "' + path + '" был изменён.\n\n' +
            'Сохранить изменения перед переключением?'
        );
        if (save) {
            this._saveCurrentEdit(canvas);
            return true;
        }
        return confirm(
            'Отменить изменения в "' + path + '"\n' +
            'и переключиться без сохранения?'
        );
    };

    ProjectManager.prototype._confirmSwitchProject = function (newName) {
        if (!this.current) return true;
        if (newName === this.current.name) return true;
        var canvas = global.IDE && global.IDE._canvas;
        if (!canvas) return true;
        if (!this.editing) return true;
        return this._confirmSwitchFrom(canvas);
    };

    /* ------------------------------------------------------------------
       _saveCurrentEdit

       Сохраняет текущий редактируемый HTML-файл.

       ВАЖНО: в файл проекта пишется HTML с уже внедрёнными тегами
       внешних библиотек user-компонентов (jQuery / jQuery UI / …) и
       служебных lib/wb-component/*.{js,css}. Раньше этого не делалось —
       теги существовали только в runtime iframe-сцены (canvas) и
       помечались data-wb-comp-asset="1", из-за чего cleanHtml() их
       вырезал, и файл проекта оставался «голым».

       Для сравнения с «чистым» canvas-состоянием initialClean
       по-прежнему хранит результат canvas.cleanHtml() БЕЗ lib-тегов —
       так _hasUnsavedChanges корректно детектит правки пользователя.
       ------------------------------------------------------------------ */
    ProjectManager.prototype._saveCurrentEdit = function (canvas) {
        if (!this.editing || !this.current) return;
        var f = this.current.files[this.editing.path];
        if (!f) return;
        try {
            var clean = canvas.cleanHtml();
            this.editing.initialClean = clean;

            /* Внедряем теги внешних libs + lib/wb-component/* в сам файл. */
            var out = clean;
            if (global.ZipUtils && global.ZipUtils.injectLibTagsIntoHtml) {
                try {
                    out = global.ZipUtils.injectLibTagsIntoHtml(clean, this.current);
                } catch (e) {
                    console.error('[ProjectManager] injectLibTagsIntoHtml', e);
                }
            }

            f.content = out;
            f.kind = 'text';

            this.save();
            bus.emit('project:changed', { project: this.current });
        } catch (e) { /* ignore */ }
    };

    /* ---------------- Проекты ---------------- */

    ProjectManager.prototype.refreshCombo = function () {
        if (!this.comboEl) return;
        var names = global.ProjectStorage.list();
        var cur = this.current ? this.current.name : '';
        this.combo.empty();
        this.combo.append($('<option></option>').val('').text('(no project)'));
        for (var i = 0; i < names.length; i++) {
            this.combo.append($('<option></option>').val(names[i]).text(names[i]));
        }
        if (cur) this.comboEl.value = cur;
    };

    ProjectManager.prototype._restoreLast = function () {
        var last = global.ProjectStorage.getCurrent();
        if (last && global.ProjectStorage.get(last)) {
            this.load(last);
        }
    };

    ProjectManager.prototype.load = function (name) {
        var p = global.ProjectStorage.get(name);
        if (!p) return;
        if (!p.files) p.files = {};

        var canvas = global.IDE && global.IDE._canvas;

        this.editing = null;
        this.current = p;
        global.ProjectStorage.setCurrent(name);
        if (this.comboEl) this.comboEl.value = name;

        if (global.App) global.App._componentMode = false;

        if (canvas && canvas.reset) {
            try { canvas.reset(); }
            catch (e) { console.error('[ProjectManager.load] reset', e); }
        }

        var mainPath = p.mainFile;
        if (!mainPath || !p.files[mainPath]) {
            mainPath = p.files['index.html'] ? 'index.html' : '';
        }
        if (mainPath && p.files[mainPath]) {
            var ext = (mainPath.match(/\.([^.\\\/]+)$/) || ['', ''])[1].toLowerCase();
            if (ext === 'html' || ext === 'htm' || ext === 'frm') {
                bus.emit('project:file:edit-visual', {
                    path:    mainPath,
                    data:    p.files[mainPath],
                    project: p
                });
            }
        }

        bus.emit('project:loaded',  { project: p, name: name });
        bus.emit('project:changed', { project: p });

        this._applyProjectMode(p);
    };

    ProjectManager.prototype.close = function () {
        this.current = null;
        this.editing = null;
        global.ProjectStorage.setCurrent('');
        if (global.App) global.App._componentMode = false;
        try {
            $('#wb-center-tabs .wb-center-tab[data-pane="component"]').hide();
        } catch (e) {}

        this._forceSwitchToSceneIfComponentActive();

        bus.emit('project:loaded', { project: null, name: '' });
        bus.emit('project:changed', { project: null });
        bus.emit('project:mode-changed', { mode: 'page', rootType: 'html' });
    };

    ProjectManager.prototype._forceSwitchToSceneIfComponentActive = function () {
        try {
            var $active = $('#wb-center-tabs .wb-center-tab.wb-active');
            if ($active.length && $active.attr('data-pane') === 'component') {
                $('#wb-center-tabs .wb-center-tab[data-pane="scene"]').click();
            }
        } catch (e) { /* ignore */ }
    };

    ProjectManager.prototype._applyProjectMode = function (p) {
        var canvas = global.IDE && global.IDE._canvas;
        var rt = (p && p.rootType) || 'html';

        if (rt === 'component') {
            if (global.App) global.App._componentMode = true;

            if (global.componentTab && p) {
                var cd = p.componentData ? this._cloneObj(p.componentData) : {};
                var libData = this._readComponentLibraries(p);
                if (libData) {
                    if (!cd.js && libData.js)   cd.js  = libData.js;
                    if (!cd.css && libData.css) cd.css = libData.css;
                }
                if (!cd.previewIdeHtml && cd.html) {
                    cd.previewIdeHtml = cd.html;
                }
                try { global.componentTab.setComponent(cd); } catch (e) {}
            }

            if (canvas) canvas.setRootType('div');

            bus.emit('project:mode-changed', { mode: 'component', rootType: 'component' });
        } else {
            if (global.App) global.App._componentMode = false;
            if (canvas) canvas.setRootType(rt);
            this._forceSwitchToSceneIfComponentActive();

            bus.emit('project:mode-changed', { mode: 'page', rootType: rt });
        }
    };

    ProjectManager.prototype._cloneObj = function (o) {
        if (!o) return null;
        try { return JSON.parse(JSON.stringify(o)); }
        catch (e) { return o; }
    };

    ProjectManager.prototype._readComponentLibraries = function (p) {
        if (!p || !p.files) return null;
        var cd = p.componentData || {};
        var ct = cd.cmptype;
        if (!ct) return null;

        var safeCt = String(ct).replace(/[^A-Za-z0-9_.-]/g, '_');
        var jsPath  = 'lib/wb-component/' + safeCt + '.js';
        var cssPath = 'lib/wb-component/' + safeCt + '.css';

        var out = { js: '', css: '' };

        var jsFile = p.files[jsPath];
        if (jsFile && jsFile.content) {
            out.js = this._extractUserJs(jsFile.content);
        }
        var cssFile = p.files[cssPath];
        if (cssFile && cssFile.content) {
            out.css = this._extractUserCss(cssFile.content);
        }
        return out;
    };

    ProjectManager.prototype._extractUserJs = function (fullJs) {
        if (!fullJs) return '';
        var marker = '/* --- user code --- */';
        var idx = fullJs.indexOf(marker);
        if (idx < 0) return '';
        var user = fullJs.substring(idx + marker.length);
        return user.replace(/^\r?\n/, '');
    };

    ProjectManager.prototype._extractUserCss = function (fullCss) {
        if (!fullCss) return '';
        var marker = '/* --- user css --- */';
        var idx = fullCss.indexOf(marker);
        if (idx < 0) return '';
        var user = fullCss.substring(idx + marker.length);
        return user.replace(/^\r?\n/, '');
    };

    ProjectManager.prototype.createNew = function () {
        var name = prompt('Имя нового проекта:', 'Project' + Date.now().toString(36));
        if (!name) return;
        name = String(name).trim();
        if (!name) return;
        if (global.ProjectStorage.get(name)) {
            alert('Проект с таким именем уже существует.');
            return;
        }
        var p = global.ProjectStorage.create(name);
        if (!p) { alert('Не удалось создать проект.'); return; }

        p.files['index.html'] = {
            kind: 'text',
            content: '<!DOCTYPE html>\n<html>\n<head>\n' +
                '<meta charset="UTF-8">\n<title>' + name + '</title>\n' +
                '</head>\n<body>\n\n</body>\n</html>'
        };
        p.mainFile = 'index.html';
        p.rootType = 'html';
        global.ProjectStorage.save(p);

        this.refreshCombo();
        this.load(name);
    };

    ProjectManager.prototype.deleteCurrent = function () {
        if (!this.current) { alert('Проект не выбран.'); return; }
        if (!confirm('Удалить проект "' + this.current.name + '"?')) return;
        global.ProjectStorage.remove(this.current.name);
        this.close();
        this.refreshCombo();
    };

    /* ------------------------------------------------------------------
       save

       Сохраняет текущий проект.

       Root: component определяется по ДВУМ признакам:
         • App._componentMode === true, ИЛИ
         • this.current.rootType === 'component'.

       Libs (jsLibs / cssLibs) читаются:
         1. через ComponentTab.getFormData();
         2. дополнительно — напрямую через ComponentTab._collectLibs()
            (работает, даже если getFormData по какой-то причине вернул
            пустые массивы);
         3. как последний резерв — из предыдущего componentData.

       Так libs не теряются, если пользователь указал их, но что-то
       пошло не так в форме.
       ------------------------------------------------------------------ */
    ProjectManager.prototype.save = function () {
        if (!this.current) return;
        var canvas = global.IDE && global.IDE._canvas;

        var isComp = !!(global.App && global.App._componentMode)
            || this.current.rootType === 'component';

        if (canvas && canvas.getRootType) {
            this.current.rootType = isComp
                ? 'component'
                : (canvas.getRootType() || 'html');
        } else {
            this.current.rootType = isComp
                ? 'component'
                : (this.current.rootType || 'html');
        }

        if (isComp && global.componentTab) {
            var cd = null;
            try { cd = global.componentTab.getFormData(); }
            catch (e) { cd = null; }
            cd = cd || {};

            /* Явно читаем libs из DOM. */
            var rawJs = [];
            var rawCss = [];
            try {
                if (global.componentTab._collectLibs) {
                    rawJs  = global.componentTab._collectLibs('js')  || [];
                    rawCss = global.componentTab._collectLibs('css') || [];
                }
            } catch (e) { /* ignore */ }

            var prev = this.current.componentData || {};

            /* Fallback 1: getFormData() → cd.jsLibs / cd.cssLibs. */
            if (!rawJs.length && Array.isArray(cd.jsLibs) && cd.jsLibs.length) {
                rawJs = cd.jsLibs;
            }
            if (!rawCss.length && Array.isArray(cd.cssLibs) && cd.cssLibs.length) {
                rawCss = cd.cssLibs;
            }
            /* Fallback 2: предыдущее сохранённое значение. */
            if (!rawJs.length && Array.isArray(prev.jsLibs) && prev.jsLibs.length) {
                rawJs = prev.jsLibs;
            }
            if (!rawCss.length && Array.isArray(prev.cssLibs) && prev.cssLibs.length) {
                rawCss = prev.cssLibs;
            }

            cd.jsLibs  = normalizeLibs(rawJs);
            cd.cssLibs = normalizeLibs(rawCss);

            /* ← ИЗМЕНЕНО: подставляем HTML сцены, если previewIdeHtml
               пуст ИЛИ совпадает с дефолтной заготовкой ComponentTab. */
            var previewIsDefault = !global.ComponentTab
                || typeof global.ComponentTab.isDefaultPreview !== 'function'
                || global.ComponentTab.isDefaultPreview(cd.previewIdeHtml);

            if ((!cd.previewIdeHtml || previewIsDefault) && canvas && canvas.cleanHtml) {
                try {
                    var codeHtml = canvas.cleanHtml();
                    if (codeHtml && codeHtml.replace(/\s+/g, '')) {
                        cd.previewIdeHtml = codeHtml;
                        cd.html = codeHtml;
                    }
                } catch (e) { /* ignore */ }
            }
            if (!cd.html && cd.previewIdeHtml) cd.html = cd.previewIdeHtml;

            delete cd.js;
            delete cd.css;

            this.current.componentData = cd;

            if (global.console && console.debug) {
                console.debug('[ProjectManager.save] component libs:',
                    'js=' + cd.jsLibs.length,
                    'css=' + cd.cssLibs.length);
            }
        }

        if (global.ComponentStorage && global.ComponentStorage.syncProjectLibraries) {
            try { global.ComponentStorage.syncProjectLibraries(this.current, canvas); }
            catch (e) { console.error('[ProjectManager] sync libraries', e); }
        }
        global.ProjectStorage.save(this.current);
    };

    ProjectManager.prototype.stopEditing = function () {
        this.editing = null;
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = null;
    };

    /* ---------------- Операции с файлами ---------------- */

    ProjectManager.prototype.addFile = function (path, data) {
        if (!this.current) return;
        this.current.files[path] = data;
        this.save();
        bus.emit('project:changed', { project: this.current });
    };

    ProjectManager.prototype.removeFile = function (path) {
        if (!this.current || !path) return;
        var prefix = path + '/';
        var keys = Object.keys(this.current.files);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] === path || keys[i].indexOf(prefix) === 0) {
                delete this.current.files[keys[i]];
            }
        }
        if (this.current.mainFile === path) this.current.mainFile = '';
        if (this.editing && this.editing.path === path) this.editing = null;
        this.save();
        bus.emit('project:changed', { project: this.current });
    };

    ProjectManager.prototype.setMainFile = function (path) {
        if (!this.current) return;
        this.current.mainFile = path;
        this.save();
        bus.emit('project:changed', { project: this.current });
    };

    /* ---------------- Контекстное меню ---------------- */

    ProjectManager.prototype.showContextMenu = function (e) {
        if (!this.current) {
            var menuRoot = global.mini.get('wb-prootmenu');
            if (menuRoot) {
                this._ctx = e;
                menuRoot.showAtPos(e.x, e.y);
            }
            return;
        }
        var menuId = (e.type === 'file')   ? 'wb-pfilemenu'
            : (e.type === 'folder') ? 'wb-pfoldermenu'
                :                         'wb-prootmenu';
        var menu = global.mini.get(menuId);
        if (!menu) return;
        this._ctx = e;
        menu.showAtPos(e.x, e.y);
    };

    ProjectManager.prototype._basePath = function () {
        var e = this._ctx;
        if (!e) return '';
        if (e.type === 'folder') return e.path;
        if (e.type === 'file') {
            var p = e.path || '';
            var i = p.lastIndexOf('/');
            return i >= 0 ? p.substring(0, i) : '';
        }
        return '';
    };

    ProjectManager.prototype.ctxNewFolder = function () {
        if (!this.current) return;
        var base = this._basePath();
        var name = prompt('Имя новой папки:', 'folder');
        if (!name) return;
        name = String(name).replace(/[\\\/]+/g, '').trim();
        if (!name) return;
        var path = base ? base + '/' + name : name;
        this.current.files[path + '/.keep'] = { kind: 'text', content: '' };
        this.save();
        bus.emit('project:changed', { project: this.current });
    };

    ProjectManager.prototype.ctxNewFile = function () {
        if (!this.current) return;
        var base = this._basePath();
        var name = prompt('Имя файла (с расширением):', 'file.txt');
        if (!name) return;
        name = String(name).replace(/[\\\/]+/g, '').trim();
        if (!name) return;
        var path = global.ProjectStorage.suggestPath(this.current, base, name);
        this.current.files[path] = { kind: 'text', content: '' };
        this.save();
        bus.emit('project:changed', { project: this.current });
    };

    ProjectManager.prototype.ctxUpload = function () {
        if (!this.current) return;
        var base = this._basePath();
        var self = this;
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.multiple = true;
        inp.onchange = function () {
            var files = inp.files;
            var remaining = files.length;
            if (!remaining) return;
            function done() {
                remaining--;
                if (remaining <= 0) {
                    self.save();
                    bus.emit('project:changed', { project: self.current });
                }
            }
            for (var i = 0; i < files.length; i++) {
                (function (f) {
                    var path = global.ProjectStorage.suggestPath(self.current, base, f.name);
                    var isImage = /^image\//i.test(f.type) ||
                        /\.(png|jpg|jpeg|gif|bmp|webp|svg|ico)$/i.test(f.name);
                    var reader = new FileReader();
                    if (isImage) {
                        reader.onload = function (ev) {
                            self.current.files[path] = { kind: 'image', content: ev.target.result };
                            done();
                        };
                        reader.onerror = done;
                        reader.readAsDataURL(f);
                    } else {
                        reader.onload = function (ev) {
                            self.current.files[path] = { kind: 'text', content: ev.target.result };
                            done();
                        };
                        reader.onerror = done;
                        reader.readAsText(f);
                    }
                })(files[i]);
            }
        };
        inp.click();
    };

    ProjectManager.prototype.ctxUploadZip = function () {
        if (!this.current) return;
        var self = this;
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.zip,application/zip,application/x-zip-compressed';
        inp.onchange = function () {
            var f = inp.files[0];
            if (!f) return;

            global.ZipUtils.readManifest(f).then(function (manifest) {
                if (manifest && manifest.type === 'component') {
                    alert('Выбранный ZIP является компонентом, а не проектом.\n\n' +
                        'Для загрузки компонентов используйте пользовательскую ' +
                        'палитру: ПКМ по User Palette → Import Component(s) from ZIP…');
                    return null;
                }
                return global.ZipUtils.importInto(self.current, f).then(function () {
                    self.save();
                    bus.emit('project:changed', { project: self.current });

                    if (manifest && manifest.rootType) {
                        self.current.rootType = manifest.rootType;
                        if (manifest.rootType === 'component' && manifest.component) {
                            self.current.componentData = manifest.component;
                        }
                        self.save();
                        self._applyProjectMode(self.current);
                    }
                    alert('ZIP успешно распакован в проект "' + self.current.name + '".');
                });
            }).catch(function (err) {
                alert('Ошибка загрузки ZIP: ' + (err && err.message || err));
            });
        };
        inp.click();
    };

    ProjectManager.prototype.ctxImportProjectFromZip = function () {
        var self = this;
        var canvas = global.IDE && global.IDE._canvas;
        if (self.editing && canvas) {
            if (!self._confirmSwitchFrom(canvas)) return;
        }

        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.zip,application/zip,application/x-zip-compressed';
        inp.onchange = function () {
            var f = inp.files[0];
            if (!f) return;

            global.ZipUtils.readManifest(f).then(function (manifest) {
                var defaultName =
                    (manifest && manifest.name) ||
                    String(f.name || '').replace(/\.zip$/i, '') ||
                    ('ImportedProject' + Date.now().toString(36));

                var name = prompt('Имя нового проекта:', defaultName);
                if (!name) return null;
                name = String(name).trim();
                if (!name) return null;

                if (global.ProjectStorage.get(name)) {
                    if (!confirm('Проект "' + name + '" уже существует.\n\n' +
                        'Перезаписать его данными из ZIP?')) {
                        return null;
                    }
                    global.ProjectStorage.remove(name);
                }

                var p = global.ProjectStorage.create(name);
                if (!p) {
                    alert('Не удалось создать проект "' + name + '".');
                    return null;
                }

                return global.ZipUtils.importInto(p, f).then(function () {
                    if (manifest) {
                        if (manifest.mainFile && p.files[manifest.mainFile]) {
                            p.mainFile = manifest.mainFile;
                        }
                        if (manifest.rootType) {
                            p.rootType = manifest.rootType;
                        }
                        if (manifest.type === 'component' && manifest.component) {
                            p.rootType = 'component';
                            p.componentData = manifest.component;
                        }
                    } else {
                        if (!p.mainFile) {
                            if (p.files['index.html']) p.mainFile = 'index.html';
                            else {
                                var firstHtml = null;
                                for (var path in p.files) {
                                    if (!p.files.hasOwnProperty(path)) continue;
                                    if (/\.html?$/i.test(path)) { firstHtml = path; break; }
                                }
                                if (firstHtml) p.mainFile = firstHtml;
                            }
                        }
                        if (!p.rootType) p.rootType = 'html';
                    }

                    global.ProjectStorage.save(p);
                    self.refreshCombo();
                    self.load(name);
                    alert('Проект "' + name + '" успешно импортирован из ZIP.');
                    return p;
                });
            }).catch(function (err) {
                alert('Ошибка импорта проекта из ZIP: ' + (err && err.message || err));
            });
        };
        inp.click();
    };

    /* ------------------------------------------------------------------
       ctxExportZip

       Перед экспортом принудительно синхронизируем componentData
       из живой ComponentTab (если мы в режиме компонента или проект —
       компонент). Это гарантирует, что в project.json попадут
       актуальные jsLibs / cssLibs. */
    ProjectManager.prototype.ctxExportZip = function () {
        if (!this.current) { alert('Проект не выбран.'); return; }

        var isComp = !!(global.App && global.App._componentMode)
            || this.current.rootType === 'component';

        if (isComp && global.componentTab && global.componentTab.getFormData) {
            try {
                var cd = global.componentTab.getFormData() || {};
                var prev = this.current.componentData || {};

                if (!cd.previewIdeHtml && prev.previewIdeHtml) cd.previewIdeHtml = prev.previewIdeHtml;
                if (!cd.html && prev.html) cd.html = prev.html;
                if (!cd.html && cd.previewIdeHtml) cd.html = cd.previewIdeHtml;

                delete cd.js;
                delete cd.css;
                this.current.componentData = cd;
                this.current.rootType = 'component';
            } catch (e) { /* ignore */ }
        }

        this.save();
        global.ZipUtils.exportProject(this.current);
    };

    ProjectManager.prototype.ctxDelete = function () {
        if (!this.current || !this._ctx) return;
        var path = this._ctx.path;
        if (!path) return;
        if (!confirm('Удалить "' + path + '"?')) return;
        this.removeFile(path);
    };

    ProjectManager.prototype.ctxPreview = function () {
        if (!this.current || !this._ctx) return;
        if (this._ctx.type !== 'file') return;
        var f = this.current.files[this._ctx.path];
        if (!f) return;
        global.FilePreview.open(this._ctx.path, f);
    };

    ProjectManager.prototype.ctxEdit = function () {
        if (!this.current || !this._ctx) return;
        if (this._ctx.type !== 'file') return;
        var path = this._ctx.path;
        var f = this.current.files[path];
        if (!f) return;

        var e = (path.match(/\.([^.\\\/]+)$/) || ['', ''])[1].toLowerCase();
        if (e === 'html' || e === 'htm' || e === 'frm') {
            bus.emit('project:file:edit-visual', { path: path, data: f, project: this.current });
        } else if (f.kind === 'image') {
            global.FilePreview.open(path, f);
        } else {
            var self = this;
            var editor = new global.CodeEditor({
                value: f.content || '',
                language: global.FilePreview._langFor(path)
            });
            global.Modal.open({
                title: 'Edit: ' + path,
                content: editor.el,
                onOk: function () {
                    f.content = editor.getValue();
                    f.kind = 'text';
                    self.save();
                    bus.emit('project:changed', { project: self.current });
                }
            });
            setTimeout(function () { editor.focus(); }, 50);
        }
    };

    ProjectManager.prototype.ctxSetMain = function () {
        if (!this.current || !this._ctx) return;
        if (this._ctx.type !== 'file') return;
        this.setMainFile(this._ctx.path);
    };

    ProjectManager.prototype.ctxClearMain = function () {
        if (!this.current) return;
        this.current.mainFile = '';
        this.save();
        bus.emit('project:changed', { project: this.current });
    };

    ProjectManager.prototype.ctxSaveAsComponent = function () {
        if (!this.current) { alert('Проект не выбран.'); return; }

        var canvas = global.IDE && global.IDE._canvas;
        var rt = this.current.rootType || 'html';

        try { this.save(); } catch (e) { /* ignore */ }

        var cd;

        if (rt === 'component' && global.componentTab && global.componentTab.getFormData) {
            try { cd = global.componentTab.getFormData(); }
            catch (e) { cd = null; }
            if (!cd) cd = {};
        } else {
            cd = this.current.componentData
                ? this._cloneObj(this.current.componentData)
                : {};

            if (!cd.cmptype) {
                var ct = prompt('cmptype нового компонента:', 'my.component');
                if (!ct) return;
                cd.cmptype = String(ct).trim();
                if (!cd.cmptype) return;
            }
            if (!cd.name) {
                var nm = prompt('Имя компонента:', this.current.name || 'Component');
                if (!nm) return;
                cd.name = String(nm).trim();
                if (!cd.name) return;
            }
            if (!cd.tagName) cd.tagName = 'div';
        }

        if (!cd || !cd.cmptype) {
            alert('Не удалось определить cmptype компонента.');
            return;
        }

        /* ← ИЗМЕНЕНО: если previewIdeHtml пуст ИЛИ равен дефолтной
           заготовке ComponentTab — подставляем HTML сцены. Раньше
           проверка была только на пустую строку, и placeholder
           «My Component» уезжал в палитру как «настоящий» HTML. */
        var previewIsDefault = !global.ComponentTab
            || typeof global.ComponentTab.isDefaultPreview !== 'function'
            || global.ComponentTab.isDefaultPreview(cd.previewIdeHtml);

        if ((!cd.previewIdeHtml || previewIsDefault) && canvas && canvas.cleanHtml) {
            try {
                var codeHtml = canvas.cleanHtml();
                if (codeHtml && codeHtml.replace(/\s+/g, '')) {
                    cd.previewIdeHtml = codeHtml;
                }
            } catch (e) { /* ignore */ }
        }
        if (!cd.html && cd.previewIdeHtml) cd.html = cd.previewIdeHtml;

        if (!cd.js || !cd.css) {
            var libData = this._readComponentLibraries(this.current);
            if (libData) {
                if (!cd.js  && libData.js)  cd.js  = libData.js;
                if (!cd.css && libData.css) cd.css = libData.css;
            }
        }

        cd.name        = cd.name        || cd.cmptype;
        cd.tagName     = cd.tagName     || 'div';
        cd.description = cd.description || '';
        cd.jsLibs      = normalizeLibs(cd.jsLibs  || []);
        cd.cssLibs     = normalizeLibs(cd.cssLibs || []);
        cd.customProperties = Array.isArray(cd.customProperties) ? cd.customProperties : [];
        cd.customEvents     = Array.isArray(cd.customEvents)     ? cd.customEvents     : [];
        cd.nestingMode      = cd.nestingMode  || 'all';
        cd.nestingRules     = Array.isArray(cd.nestingRules) ? cd.nestingRules : [];
        cd.js               = cd.js  || '';
        cd.css              = cd.css || '';

        var existing = global.ComponentStorage.findByCmptype(cd.cmptype);
        if (existing) {
            var ok = confirm(
                'Компонент с cmptype="' + cd.cmptype + '" уже есть в палитре (' +
                existing.name + ').\n\nПерезаписать его?');
            if (!ok) return;
            global.ComponentStorage.updateComponent(existing.id, cd);
            alert('Компонент "' + cd.name + '" обновлён в палитре.');
        } else {
            global.ComponentStorage.createComponent(cd);
            alert('Компонент "' + cd.name + '" сохранён в палитру.');
        }

        bus.emit('palette:refresh');
    };

    /* Хелпер: нормализует список lib-ов к [{type,value}]. */
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

    global.ProjectManager = ProjectManager;

})(window, jQuery);
/* ProjectManager — центральный контроллер управления проектами.

   Отвечает за:
     • combobox выбора проекта + кнопки New / Delete;
     • передачу проекта в ProjectTree;
     • контекстные меню (файл / папка / корень);
     • создание папок и файлов, удаление, переименование;
     • загрузку внешних файлов (в т.ч. ZIP);
     • экспорт проекта в ZIP;
     • установку головного (main) файла;
     • открытие файла на предпросмотр или редактирование;
     • авто-сохранение сцены в текущий проектный файл (HTML/frm);
     • диалог сохранения при переключении между файлами проекта.

   ВАЖНО: все обработчики DOM навешиваются через нативный addEventListener,
   потому что MiniUI патчит jQuery.fn.on/.delegate и ломает их на 1.6.2. */
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
                    /* Пользователь отменил — возвращаем прежнее значение. */
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

            /* Если сейчас редактируется другой файл с несохранёнными
               изменениями — предлагаем сохранить / отменить / отказаться. */
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

        /* Автосохранение — только если реально есть изменения. */
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
    };

    /* ---------------- Диалог сохранения при переключении ---------------- */

    /* Есть ли изменения в текущем редактируемом файле. */
    ProjectManager.prototype._hasUnsavedChanges = function (canvas) {
        if (!this.editing || !canvas) return false;
        var current;
        try { current = canvas.cleanHtml(); }
        catch (e) { return false; }
        return current !== (this.editing.initialClean || '');
    };

    /* Спросить пользователя, что делать с изменениями.
       Возвращает true — можно продолжать переключение,
       false — пользователь отменил. */
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

    /* Проверка перед сменой проекта (через combobox). */
    ProjectManager.prototype._confirmSwitchProject = function (newName) {
        if (!this.current) return true;
        if (newName === this.current.name) return true;
        var canvas = global.IDE && global.IDE._canvas;
        if (!canvas) return true;
        if (!this.editing) return true;
        return this._confirmSwitchFrom(canvas);
    };

    /* Сохранить текущее состояние сцены в текущий файл проекта. */
    ProjectManager.prototype._saveCurrentEdit = function (canvas) {
        if (!this.editing || !this.current) return;
        var f = this.current.files[this.editing.path];
        if (!f) return;
        try {
            var clean = canvas.cleanHtml();
            f.content = clean;
            f.kind = 'text';
            this.editing.initialClean = clean;
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
        this.current = p;
        this.editing = null;
        global.ProjectStorage.setCurrent(name);
        if (this.comboEl) this.comboEl.value = name;
        bus.emit('project:loaded', { project: p, name: name });
        bus.emit('project:changed', { project: p });
    };

    ProjectManager.prototype.close = function () {
        this.current = null;
        this.editing = null;
        global.ProjectStorage.setCurrent('');
        bus.emit('project:loaded', { project: null, name: '' });
        bus.emit('project:changed', { project: null });
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

    ProjectManager.prototype.save = function () {
        if (!this.current) return;
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
            global.ZipUtils.importInto(self.current, f).then(function () {
                self.save();
                bus.emit('project:changed', { project: self.current });
                alert('ZIP успешно распакован в проект "' + self.current.name + '".');
            }).catch(function (err) {
                alert('Ошибка загрузки ZIP: ' + (err && err.message || err));
            });
        };
        inp.click();
    };

    ProjectManager.prototype.ctxExportZip = function () {
        if (!this.current) { alert('Проект не выбран.'); return; }
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

    global.ProjectManager = ProjectManager;

})(window, jQuery);
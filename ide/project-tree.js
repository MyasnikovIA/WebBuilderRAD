/* ProjectTree — навигационное дерево файлов проекта.

   Функциональность:
     • отображение дерева папок и файлов;
     • одиночный клик — выбрать один элемент;
     • Ctrl+клик — добавить / убрать из выделения;
     • Shift+клик — выделить диапазон видимых узлов;
     • перетаскивание (HTML5 DnD) — перемещение файлов и папок:
         - на папку   → внутрь папки;
         - на файл    → в родительскую папку файла;
         - на пустое  → в корень проекта.
     • мультивыделение сохраняется при drag: тащатся все выделенные элементы.

   Служебные поля:
     this._selectedPaths    — { path: true } — выделенные пути;
     this._lastClickedPath  — для Shift-диапазона;
     this._dragPaths        — массив путей в текущем drag;
     this._dragging         — bool.

   ВАЖНО: обработчики навешиваются через НАТИВНЫЕ addEventListener.
   MiniUI патчит jQuery.fn.on/.delegate и ломает их в 1.6.2. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    /* ------------------------------------------------------------------
       Хелперы
       ------------------------------------------------------------------ */

    function parentOf(path) {
        var i = String(path || '').lastIndexOf('/');
        return i >= 0 ? path.substring(0, i) : '';
    }

    function basenameOf(path) {
        var i = String(path || '').lastIndexOf('/');
        return i >= 0 ? path.substring(i + 1) : path;
    }

    function isFolderPath(project, path) {
        if (!project || !project.files || !path) return false;
        var prefix = path + '/';
        for (var p in project.files) {
            if (!project.files.hasOwnProperty(p)) continue;
            if (p.indexOf(prefix) === 0) return true;
        }
        return false;
    }

    function uniqueFolderName(project, folder, base, usedTargets) {
        var i = 1;
        while (true) {
            var cand = folder
                ? folder + '/' + base + ' (' + i + ')'
                : base + ' (' + i + ')';
            if (usedTargets[cand]) { i++; continue; }
            var has = false;
            for (var p in project.files) {
                if (!project.files.hasOwnProperty(p)) continue;
                if (p.indexOf(cand + '/') === 0) { has = true; break; }
            }
            if (!has) return cand;
            i++;
        }
    }

    function uniqueFilePath(project, folder, filename, usedTargets) {
        var m = String(filename).match(/^(.*?)(\.[^.]+)?$/);
        var stem = m[1] || filename;
        var ext  = m[2] || '';
        var i = 1;
        while (true) {
            var cand = folder
                ? folder + '/' + stem + ' (' + i + ')' + ext
                : stem + ' (' + i + ')' + ext;
            if (!usedTargets[cand] && !project.files[cand]) return cand;
            i++;
        }
    }

    /* ------------------------------------------------------------------
       Конструктор
       ------------------------------------------------------------------ */

    function ProjectTree(rootEl) {
        this.root = $(rootEl);
        this.rootNode = (typeof rootEl === 'string')
            ? document.getElementById(rootEl)
            : rootEl;
        this.project = null;

        this._selectedPaths   = {};
        this._lastClickedPath = null;
        this._dragPaths       = null;
        this._dragging        = false;

        var self = this;
        bus.on('project:loaded', function (e) {
            self.project = e.project || null;
            self._selectedPaths = {};
            self._lastClickedPath = null;
            self.rebuild();
        });
        bus.on('project:changed', function (e) {
            self.project = e.project || self.project;
            self.rebuild();
        });

        this._installHandlers();
    }

    ProjectTree.prototype.setProject = function (p) {
        this.project = p || null;
        this._selectedPaths = {};
        this._lastClickedPath = null;
        this.rebuild();
    };

    /* ------------------------------------------------------------------
       Публичный доступ к выделению
       ------------------------------------------------------------------ */

    ProjectTree.prototype.getSelection = function () {
        var out = [];
        for (var k in this._selectedPaths) {
            if (this._selectedPaths.hasOwnProperty(k)) out.push(k);
        }
        return out;
    };

    /* ------------------------------------------------------------------
       Rebuild / построение дерева
       ------------------------------------------------------------------ */

    ProjectTree.prototype.rebuild = function () {
        this.root.empty();
        if (!this.project) {
            this.root.html('<div class="wb-empty">No project selected</div>');
            return;
        }

        /* Удаляем несуществующие пути из выделения. */
        var files = this.project.files || {};
        var newSel = {};
        for (var k in this._selectedPaths) {
            if (!this._selectedPaths.hasOwnProperty(k)) continue;
            if (files[k] || isFolderPath(this.project, k)) newSel[k] = true;
        }
        this._selectedPaths = newSel;

        var rootUl = $('<ul class="wb-ptree wb-ptree-root"></ul>');
        this._buildNode('', rootUl[0]);
        this.root.append(rootUl);

        this._syncSelectionUI();
    };

    ProjectTree.prototype._buildNode = function (prefix, parentUl) {
        var files = (this.project && this.project.files) || {};
        var searchPrefix = prefix ? prefix + '/' : '';

        var folders = {};
        var fileList = [];

        for (var p in files) {
            if (!files.hasOwnProperty(p)) continue;
            if (searchPrefix && p.indexOf(searchPrefix) !== 0) continue;

            var rest = prefix ? p.substring(searchPrefix.length) : p;
            if (!rest) continue;

            var slash = rest.indexOf('/');
            if (slash < 0) {
                /* .keep в корне — служебный, не показываем как файл. */
                if (rest === '.keep') continue;
                fileList.push(rest);
            } else {
                /* Признак папки. Файл folder/.keep тоже сюда попадает,
                   и это правильно: он создаёт папку folder. */
                folders[rest.substring(0, slash)] = true;
            }
        }

        var folderNames = Object.keys(folders).sort();
        var fileNames = fileList.sort();

        for (var i = 0; i < folderNames.length; i++) {
            var fname = folderNames[i];
            var fpath = prefix ? prefix + '/' + fname : fname;

            var li = document.createElement('li');
            var toggle = document.createElement('span');
            toggle.className = 'wb-toggle';
            toggle.textContent = '−';
            li.appendChild(toggle);

            var lbl = document.createElement('span');
            lbl.className = 'wb-tree-label wb-ptree-folder';
            lbl.textContent = fname;
            lbl.setAttribute('data-path', fpath);
            lbl.setAttribute('data-type', 'folder');
            lbl.setAttribute('draggable', 'true');
            li.appendChild(lbl);

            var ul = document.createElement('ul');
            this._buildNode(fpath, ul);
            li.appendChild(ul);

            (function (ul, toggle) {
                toggle.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (ul.style.display === 'none') {
                        ul.style.display = '';
                        toggle.textContent = '−';
                    } else {
                        ul.style.display = 'none';
                        toggle.textContent = '+';
                    }
                }, false);
            })(ul, toggle);

            parentUl.appendChild(li);
        }

        for (var j = 0; j < fileNames.length; j++) {
            var name = fileNames[j];
            var path = prefix ? prefix + '/' + name : name;
            var isMain = (this.project && path === this.project.mainFile);

            var li2 = document.createElement('li');
            var t = document.createElement('span');
            t.className = 'wb-toggle wb-leaf';
            li2.appendChild(t);

            var lbl2 = document.createElement('span');
            lbl2.className = 'wb-tree-label wb-ptree-file';
            lbl2.textContent = (isMain ? '★ ' : '') + name;
            lbl2.setAttribute('data-path', path);
            lbl2.setAttribute('data-type', 'file');
            lbl2.setAttribute('title', path);
            lbl2.setAttribute('draggable', 'true');
            if (isMain) lbl2.classList.add('wb-ptree-main');
            li2.appendChild(lbl2);
            parentUl.appendChild(li2);
        }
    };

    /* ------------------------------------------------------------------
       Мультивыделение
       ------------------------------------------------------------------ */

    ProjectTree.prototype._syncSelectionUI = function () {
        var rootNode = this.rootNode;
        if (!rootNode) return;
        var labels = rootNode.querySelectorAll('.wb-tree-label');
        for (var i = 0; i < labels.length; i++) {
            var p = labels[i].getAttribute('data-path');
            if (this._selectedPaths[p]) labels[i].classList.add('wb-selected');
            else labels[i].classList.remove('wb-selected');
        }
    };

    ProjectTree.prototype._clearSelection = function () {
        this._selectedPaths = {};
        this._lastClickedPath = null;
        this._syncSelectionUI();
    };

    ProjectTree.prototype._toggleSelection = function (path) {
        if (this._selectedPaths[path]) delete this._selectedPaths[path];
        else this._selectedPaths[path] = true;
        this._syncSelectionUI();
    };

    ProjectTree.prototype._selectRange = function (fromPath, toPath) {
        var order = this._flattenVisiblePaths();
        var i1 = order.indexOf(fromPath);
        var i2 = order.indexOf(toPath);
        if (i1 < 0 || i2 < 0) return;
        var lo = Math.min(i1, i2), hi = Math.max(i1, i2);
        this._selectedPaths = {};
        for (var i = lo; i <= hi; i++) this._selectedPaths[order[i]] = true;
        this._syncSelectionUI();
    };

    /* DFS-обход видимых узлов — в порядке отображения. */
    ProjectTree.prototype._flattenVisiblePaths = function () {
        var out = [];
        var rootNode = this.rootNode;
        if (!rootNode) return out;
        var rootUl = rootNode.querySelector('ul.wb-ptree-root');
        if (!rootUl) return out;

        function walk(ul) {
            for (var i = 0; i < ul.children.length; i++) {
                var li = ul.children[i];
                var lbl = null;
                for (var j = 0; j < li.children.length; j++) {
                    var ch = li.children[j];
                    if (ch.classList && ch.classList.contains('wb-tree-label')) {
                        lbl = ch;
                        break;
                    }
                }
                if (lbl) out.push(lbl.getAttribute('data-path'));

                for (var k = 0; k < li.children.length; k++) {
                    var cu = li.children[k];
                    if (cu.tagName && cu.tagName.toLowerCase() === 'ul') {
                        if (cu.style.display !== 'none') walk(cu);
                        break;
                    }
                }
            }
        }
        walk(rootUl);
        return out;
    };

    /* ------------------------------------------------------------------
       Обработчики
       ------------------------------------------------------------------ */

    ProjectTree.prototype._installHandlers = function () {
        var self = this;
        var rootNode = this.rootNode;
        if (!rootNode) return;

        function findLabel(t) {
            while (t && t !== rootNode) {
                if (t.classList && t.classList.contains('wb-tree-label')) return t;
                t = t.parentNode;
            }
            return null;
        }

        /* Безопасный поиск узла по data-path — итерацией,
           без CSS-селекторов. Работает с русскими буквами, пробелами,
           кавычками и любыми Unicode-символами. */
        function findLabelByPath(path) {
            var labels = rootNode.querySelectorAll('.wb-tree-label');
            for (var i = 0; i < labels.length; i++) {
                if (labels[i].getAttribute('data-path') === path) return labels[i];
            }
            return null;
        }

        /* ---------- Click / multi-select ---------- */
        rootNode.addEventListener('click', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl) {
                self._clearSelection();
                return;
            }
            e.stopPropagation();
            var path = lbl.getAttribute('data-path');
            var type = lbl.getAttribute('data-type');

            var isCtrl  = e.ctrlKey || e.metaKey;
            var isShift = e.shiftKey;

            if (isShift && self._lastClickedPath) {
                self._selectRange(self._lastClickedPath, path);
                self._lastClickedPath = path;
            } else if (isCtrl) {
                self._toggleSelection(path);
                self._lastClickedPath = path;
            } else {
                self._selectedPaths = {};
                self._selectedPaths[path] = true;
                self._lastClickedPath = path;
                self._syncSelectionUI();
            }

            bus.emit('project:file:selected', {
                path: path,
                type: type,
                project: self.project,
                selection: self.getSelection()
            });
        }, false);

        /* ---------- Double-click: открыть / редактировать ---------- */
        rootNode.addEventListener('dblclick', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl) return;
            e.stopPropagation();
            var type = lbl.getAttribute('data-type');
            var path = lbl.getAttribute('data-path');
            if (type !== 'file') return;
            self._openFile(path);
        }, false);

        /* ---------- Context menu ---------- */
        rootNode.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var lbl = findLabel(e.target);

            if (lbl) {
                var path = lbl.getAttribute('data-path');
                var type = lbl.getAttribute('data-type');
                /* Если кликнули по невыделенному — выделяем только его. */
                if (!self._selectedPaths[path]) {
                    self._selectedPaths = {};
                    self._selectedPaths[path] = true;
                    self._lastClickedPath = path;
                    self._syncSelectionUI();
                }
                bus.emit('project:contextmenu', {
                    x: e.clientX, y: e.clientY,
                    path: path, type: type,
                    project: self.project,
                    selection: self.getSelection()
                });
            } else {
                bus.emit('project:contextmenu', {
                    x: e.clientX, y: e.clientY,
                    path: '', type: 'root',
                    project: self.project,
                    selection: self.getSelection()
                });
            }
            return false;
        }, false);

        /* ---------- Drag start ---------- */
        rootNode.addEventListener('dragstart', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl) return;

            var path = lbl.getAttribute('data-path');
            if (!path) return;

            /* Если тащим не выделенный — выделяем только его. */
            if (!self._selectedPaths[path]) {
                self._selectedPaths = {};
                self._selectedPaths[path] = true;
                self._lastClickedPath = path;
                self._syncSelectionUI();
            }

            self._dragPaths = self.getSelection();
            if (!self._dragPaths.length) return;

            self._dragging = true;

            try {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', self._dragPaths.join('\n'));
                e.dataTransfer.setData('application/x-wb-project-path', self._dragPaths[0]);
            } catch (ex) {}

            /* Подсветка источника. */
            for (var i = 0; i < self._dragPaths.length; i++) {
                var el = findLabelByPath(self._dragPaths[i]);
                if (el) el.classList.add('wb-dragging');
            }
        }, false);

        rootNode.addEventListener('dragend', function () {
            self._endDrag();
        }, false);

        /* ---------- Dragover ---------- */
        rootNode.addEventListener('dragover', function (e) {
            if (!self._dragging) return;

            e.preventDefault();

            var lbl = findLabel(e.target);
            self._clearDropIndicators();
            rootNode.classList.remove('wb-drop-root');

            if (!lbl) {
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                rootNode.classList.add('wb-drop-root');
                return;
            }

            var targetPath = lbl.getAttribute('data-path');
            var targetType = lbl.getAttribute('data-type');

            if (!self._canDropOn(targetPath, targetType)) {
                lbl.classList.add('wb-drop-forbidden');
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                return;
            }

            lbl.classList.add('wb-drop-inside');
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        }, false);

        rootNode.addEventListener('dragleave', function (e) {
            var lbl = findLabel(e.target);
            if (lbl) lbl.classList.remove('wb-drop-inside', 'wb-drop-forbidden');
            if (e.target === rootNode) rootNode.classList.remove('wb-drop-root');
        }, false);

        /* ---------- Drop ---------- */
        rootNode.addEventListener('drop', function (e) {
            if (!self._dragging) return;

            e.preventDefault();
            e.stopPropagation();

            var lbl = findLabel(e.target);
            var targetFolder;

            if (lbl) {
                var targetPath = lbl.getAttribute('data-path');
                var targetType = lbl.getAttribute('data-type');
                if (!self._canDropOn(targetPath, targetType)) {
                    self._endDrag();
                    return false;
                }
                targetFolder = (targetType === 'folder')
                    ? targetPath
                    : parentOf(targetPath);
            } else {
                targetFolder = '';
            }

            self._moveItems(self._dragPaths.slice(), targetFolder);
            self._endDrag();
            return false;
        }, false);
    };

    /* ------------------------------------------------------------------
       Проверка допустимости drop
       ------------------------------------------------------------------ */

    ProjectTree.prototype._canDropOn = function (targetPath, targetType) {
        var paths = this._dragPaths || [];
        if (!paths.length) return false;

        var targetFolder = (targetType === 'folder')
            ? targetPath
            : parentOf(targetPath);

        for (var i = 0; i < paths.length; i++) {
            var src = paths[i];

            /* Нельзя на самого себя. */
            if (src === targetPath) return false;

            /* Нельзя тащить папку в своего потомка. */
            if (targetType === 'folder' &&
                targetPath.indexOf(src + '/') === 0) return false;

            /* Хотя бы один источник реально меняет папку. */
            if (parentOf(src) !== targetFolder) {
                return true;
            }
        }
        return false;
    };

    /* ------------------------------------------------------------------
       Перемещение
       ------------------------------------------------------------------ */

    ProjectTree.prototype._moveItems = function (sources, targetFolder) {
        var pm = global.IDE && global.IDE.projectManager;
        if (!pm || !pm.current) return;
        var project = pm.current;
        var files = project.files;

        /* 1) Валидация источников. */
        var valid = [];
        for (var i = 0; i < sources.length; i++) {
            var src = sources[i];
            if (!src) continue;
            if (!files[src] && !isFolderPath(project, src)) continue;
            if (targetFolder) {
                if (src === targetFolder) continue;
                if (targetFolder.indexOf(src + '/') === 0) continue;
            }
            valid.push(src);
        }
        if (!valid.length) return;

        /* 2) Убираем вложенные — если папка выделена,
              файлы внутри неё отдельно не двигаем. */
        valid.sort(function (a, b) { return a.length - b.length; });
        var filtered = [];
        for (var i = 0; i < valid.length; i++) {
            var s = valid[i];
            var inside = false;
            for (var j = 0; j < filtered.length; j++) {
                if (s.indexOf(filtered[j] + '/') === 0) { inside = true; break; }
            }
            if (!inside) filtered.push(s);
        }
        valid = filtered;

        /* 3) Собираем список moves. */
        var moves = [];
        var usedTargets = {};

        for (var i = 0; i < valid.length; i++) {
            var src = valid[i];
            var isFolder = isFolderPath(project, src);
            var baseName = basenameOf(src);

            if (isFolder) {
                var newFolder = targetFolder ? targetFolder + '/' + baseName : baseName;

                /* Конфликт: целевая папка уже существует. */
                var hasConflict = false;
                for (var p in files) {
                    if (!files.hasOwnProperty(p)) continue;
                    if (p.indexOf(newFolder + '/') === 0) { hasConflict = true; break; }
                }
                if (hasConflict || usedTargets[newFolder]) {
                    newFolder = uniqueFolderName(project, targetFolder, baseName, usedTargets);
                }
                usedTargets[newFolder] = true;

                var prefix = src + '/';
                for (var p2 in files) {
                    if (!files.hasOwnProperty(p2)) continue;
                    if (p2.indexOf(prefix) !== 0) continue;
                    var rel = p2.substring(prefix.length);
                    moves.push({ from: p2, to: newFolder + '/' + rel });
                }
            } else {
                var newPath = targetFolder ? targetFolder + '/' + baseName : baseName;

                if (newPath !== src && (files[newPath] || usedTargets[newPath])) {
                    newPath = uniqueFilePath(project, targetFolder, baseName, usedTargets);
                }
                usedTargets[newPath] = true;
                moves.push({ from: src, to: newPath });
            }
        }

        /* 4) Фильтр no-op. */
        moves = moves.filter(function (m) { return m.from !== m.to; });
        if (!moves.length) return;

        /* 5) Применяем. */
        for (var i = 0; i < moves.length; i++) {
            var m = moves[i];
            if (!files[m.from]) continue;
            files[m.to] = files[m.from];
            delete files[m.from];
        }

        /* 6) mainFile. */
        if (project.mainFile) {
            for (var i = 0; i < moves.length; i++) {
                if (project.mainFile === moves[i].from) {
                    project.mainFile = moves[i].to;
                    break;
                }
            }
        }

        /* 7) Сохраняем и уведомляем. */
        pm.save();
        this._selectedPaths = {};
        this._lastClickedPath = null;
        bus.emit('project:changed', { project: project });
    };

    /* ------------------------------------------------------------------
       Служебное
       ------------------------------------------------------------------ */

    ProjectTree.prototype._endDrag = function () {
        this._dragging = false;
        this._dragPaths = null;
        var rootNode = this.rootNode;
        if (!rootNode) return;
        var drags = rootNode.querySelectorAll('.wb-dragging');
        for (var i = 0; i < drags.length; i++) drags[i].classList.remove('wb-dragging');
        this._clearDropIndicators();
        rootNode.classList.remove('wb-drop-root');
    };

    ProjectTree.prototype._clearDropIndicators = function () {
        var rootNode = this.rootNode;
        if (!rootNode) return;
        var els = rootNode.querySelectorAll('.wb-drop-inside, .wb-drop-forbidden');
        for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('wb-drop-inside', 'wb-drop-forbidden');
        }
    };

    ProjectTree.prototype._openFile = function (path) {
        var f = this.project && this.project.files && this.project.files[path];
        if (!f) return;
        var e = (path.match(/\.([^.\\\/]+)$/) || ['', ''])[1].toLowerCase();
        if (e === 'html' || e === 'htm' || e === 'frm') {
            bus.emit('project:file:edit-visual', { path: path, data: f, project: this.project });
        } else {
            bus.emit('project:file:preview', { path: path, data: f, project: this.project });
        }
    };

    global.ProjectTree = ProjectTree;

})(window, jQuery);
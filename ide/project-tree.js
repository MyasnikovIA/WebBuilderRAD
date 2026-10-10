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
     • мультивыделение сохраняется при drag: тащатся все выделенные элементы;
     • автообновление ссылок во всех текстовых файлах проекта
       при перемещении (см. _applyReferenceUpdates).

   ВАЖНО: обработчики навешиваются через НАТИВНЫЕ addEventListener.
   MiniUI патчит jQuery.fn.on/.delegate и ломает их в 1.6.2. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    /* ------------------------------------------------------------------
       Хелперы (пути)
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
       Замена путей в тексте (граничная защита)

       Заменяет 'from' на 'to', но только там, где слева и справа
       стоят НЕ path-символы. Это исключает замену подстрок:
         a/foo.txt не матчится внутри a/foo.txt.bak
         a/foo.txt не матчится внутри x/a/foo.txt
         a/foo.txt не матчится внутри a/foo.txt-more
       При этом корректно матчится:
         href="a/foo.txt"   (после — кавычка)
         url(a/foo.txt)     (после — скобка)
         a/foo.txt#anchor   (после — #)
         a/foo.txt          (после — конец строки)
         a/foo.txt.         (после — точка + конец/пробел/кавычка)
       ------------------------------------------------------------------ */

    function isPathChar(ch) {
        if (!ch) return false;
        var code = ch.charCodeAt(0);

        /* ASCII */
        if (code < 128) {
            if (code >= 48 && code <= 57) return true;   /* 0-9 */
            if (code >= 65 && code <= 90) return true;   /* A-Z */
            if (code >= 97 && code <= 122) return true;  /* a-z */
            return ch === '_' || ch === '-' || ch === '.' ||
                ch === '/' || ch === '\\';
        }

        /* Unicode spaces — границы. */
        if (ch === '\u00A0' || ch === '\u2000' || ch === '\u2001' ||
            ch === '\u2002' || ch === '\u2003' || ch === '\u2009' ||
            ch === '\u202F' || ch === '\u205F' || ch === '\u3000' ||
            ch === '\u2028' || ch === '\u2029') {
            return false;
        }

        /* Латинский расширенный, греческий, кириллица, CJK, Hiragana/Katakana, Hangul. */
        if (code >= 0x0100 && code <= 0x024F) return true;
        if (code >= 0x0370 && code <= 0x03FF) return true;
        if (code >= 0x0400 && code <= 0x04FF) return true;
        if (code >= 0x3040 && code <= 0x30FF) return true;
        if (code >= 0x4E00 && code <= 0x9FFF) return true;
        if (code >= 0xAC00 && code <= 0xD7AF) return true;

        /* Прочее — консервативно считаем границей. */
        return false;
    }

    function replacePathInText(text, from, to) {
        if (!text || !from || from === to) return text;
        if (text.indexOf(from) < 0) return text;

        var out = '';
        var idx = 0;
        var fromLen = from.length;
        var textLen = text.length;

        while (idx < textLen) {
            var found = text.indexOf(from, idx);
            if (found < 0) {
                out += text.substring(idx);
                break;
            }

            /* Граница слева. */
            var beforeCh = found > 0 ? text.charAt(found - 1) : '';
            var beforeOk = !beforeCh || !isPathChar(beforeCh);

            /* Граница справа. */
            var afterIdx = found + fromLen;
            var afterCh = afterIdx < textLen ? text.charAt(afterIdx) : '';
            var afterOk = true;

            if (afterCh) {
                if (isPathChar(afterCh)) {
                    /* Точка: разрешаем, если за ней НЕ идёт path-символ.
                       a/foo.txt. → OK (конец предложения)
                       a/foo.txt.bak → reject */
                    if (afterCh === '.') {
                        var nxt = afterIdx + 1 < textLen ? text.charAt(afterIdx + 1) : '';
                        afterOk = !nxt || !isPathChar(nxt) || (!/[A-Za-z0-9_\-]/.test(nxt) && !(nxt.charCodeAt(0) > 127));
                    } else {
                        afterOk = false;
                    }
                }
            }

            if (beforeOk && afterOk) {
                out += text.substring(idx, found) + to;
                idx = afterIdx;
            } else {
                out += text.substring(idx, found + 1);
                idx = found + 1;
            }
        }

        return out;
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
                /* folder/.keep тоже создаёт папку folder. */
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

        function findLabelByPath(path) {
            var labels = rootNode.querySelectorAll('.wb-tree-label');
            for (var i = 0; i < labels.length; i++) {
                if (labels[i].getAttribute('data-path') === path) return labels[i];
            }
            return null;
        }

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

        rootNode.addEventListener('dblclick', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl) return;
            e.stopPropagation();
            var type = lbl.getAttribute('data-type');
            var path = lbl.getAttribute('data-path');
            if (type !== 'file') return;
            self._openFile(path);
        }, false);

        rootNode.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var lbl = findLabel(e.target);

            if (lbl) {
                var path = lbl.getAttribute('data-path');
                var type = lbl.getAttribute('data-type');
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

        rootNode.addEventListener('dragstart', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl) return;

            var path = lbl.getAttribute('data-path');
            if (!path) return;

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

            for (var i = 0; i < self._dragPaths.length; i++) {
                var el = findLabelByPath(self._dragPaths[i]);
                if (el) el.classList.add('wb-dragging');
            }
        }, false);

        rootNode.addEventListener('dragend', function () {
            self._endDrag();
        }, false);

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

            if (src === targetPath) return false;
            if (targetType === 'folder' &&
                targetPath.indexOf(src + '/') === 0) return false;

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

        /* 2) Убираем вложенные. */
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

        /* 5) Применяем к files map. */
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

        /* 7) Автообновление ссылок во всех текстовых файлах проекта. */
        this._applyReferenceUpdates(moves, project);

        /* 8) Сохраняем и уведомляем. */
        pm.save();
        this._selectedPaths = {};
        this._lastClickedPath = null;
        bus.emit('project:changed', { project: project });
    };

    /* ------------------------------------------------------------------
       Автообновление путей во всех текстовых файлах проекта

       Для каждой пары {from → to} сканируем содержимое каждого
       текстового файла и заменяем вхождения from на to с граничной
       защитой. Работает в HTML, CSS, JS, JSON, TXT, .frm, .php и пр.
       ------------------------------------------------------------------ */

    ProjectTree.prototype._applyReferenceUpdates = function (moves, project) {
        if (!moves || !moves.length || !project) return 0;
        var files = project.files || {};

        /* Готовим пары {from, to}, дедуплицируем по from. */
        var seen = {};
        var pairs = [];
        for (var i = 0; i < moves.length; i++) {
            var m = moves[i];
            if (!m || !m.from || !m.to) continue;
            if (m.from === m.to) continue;
            if (seen[m.from]) continue;
            seen[m.from] = true;
            pairs.push({ from: m.from, to: m.to });
        }
        if (!pairs.length) return 0;

        /* Длинные пути обрабатываем первыми — защита от частичных
           наложений, если оба файла имеют общий префикс. */
        pairs.sort(function (a, b) { return b.from.length - a.from.length; });

        var changedFiles = {};
        var totalSubstitutions = 0;

        for (var path in files) {
            if (!files.hasOwnProperty(path)) continue;
            var f = files[path];
            if (!f || f.kind !== 'text') continue;
            var src = f.content || '';
            if (!src) continue;

            var newSrc = src;
            for (var k = 0; k < pairs.length; k++) {
                var before = newSrc;
                newSrc = replacePathInText(newSrc, pairs[k].from, pairs[k].to);
                if (newSrc !== before) totalSubstitutions++;
            }

            if (newSrc !== src) {
                f.content = newSrc;
                changedFiles[path] = true;
            }
        }

        /* Если редактируемый в canvas файл был обновлён —
           перезагружаем canvas, чтобы его автосейв не перетёр правки. */
        var pm = global.IDE && global.IDE.projectManager;
        if (pm && pm.editing && changedFiles[pm.editing.path]) {
            var canvas = global.IDE && global.IDE._canvas;
            if (canvas && canvas.loadHtml) {
                try {
                    canvas.loadHtml(files[pm.editing.path].content);
                    try {
                        pm.editing.initialClean = canvas.cleanHtml();
                    } catch (e) {}
                } catch (e) {}
            }
        }

        /* Диагностика в консоль — удобно при отладке. */
        if (totalSubstitutions > 0 && global.console && console.info) {
            console.info('[ProjectTree] updated references in ' +
                Object.keys(changedFiles).length + ' file(s), ' +
                totalSubstitutions + ' substitution(s)');
        }

        return totalSubstitutions;
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
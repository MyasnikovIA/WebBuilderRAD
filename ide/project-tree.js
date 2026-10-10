/* ProjectTree — навигационное дерево файлов проекта.

   Показывает папки и файлы проекта, реагирует на клики и двойные клики,
   генерирует события project:file:selected, project:file:preview,
   project:file:edit-visual, project:contextmenu.

   Звёздочка ★ слева от имени файла показывает головной (main) файл.

   Файл-заглушка .keep (используется для сохранения пустых папок)
   скрыт из дерева — пользователь его не видит.

   ВАЖНО: обработчики навешиваются через НАТИВНЫЕ addEventListener.
   MiniUI переопределяет jQuery.fn.on/.delegate и ломает делегирование
   в этой сборке jQuery 1.6.2. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    /* Имя файла-заглушки для пустых папок. */
    var KEEP_NAME = '.keep';
    var KEEP_RE   = /(^|\/)\.keep$/;

    function isKeep(path) {
        return path === KEEP_NAME || KEEP_RE.test(path);
    }

    function ProjectTree(rootEl) {
        this.root = $(rootEl);
        this.rootNode = (typeof rootEl === 'string')
            ? document.getElementById(rootEl)
            : rootEl;
        this.project = null;
        this._selectedPath = null;

        var self = this;
        bus.on('project:loaded', function (e) {
            self.project = e.project || null;
            self._selectedPath = null;
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
        this._selectedPath = null;
        this.rebuild();
    };

    ProjectTree.prototype.rebuild = function () {
        this.root.empty();
        if (!this.project) {
            this.root.html('<div class="wb-empty">No project selected</div>');
            return;
        }
        var rootUl = $('<ul class="wb-ptree wb-ptree-root"></ul>');
        this._buildNode('', rootUl);
        this.root.append(rootUl);
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
                /* .keep — служебный файл, скрываем из дерева. */
                if (rest === KEEP_NAME) continue;
                fileList.push(rest);
            } else {
                folders[rest.substring(0, slash)] = true;
            }
        }

        var folderNames = Object.keys(folders).sort();
        var fileNames = fileList.sort();

        for (var i = 0; i < folderNames.length; i++) {
            var fname = folderNames[i];
            var fpath = prefix ? prefix + '/' + fname : fname;

            var li = $('<li></li>');
            var toggle = $('<span class="wb-toggle">−</span>');
            li.append(toggle);

            var lbl = $('<span class="wb-tree-label wb-ptree-folder"></span>')
                .text(fname)
                .attr('data-path', fpath)
                .attr('data-type', 'folder');
            li.append(lbl);

            var ul = $('<ul></ul>');
            this._buildNode(fpath, ul);
            li.append(ul);

            (function (ul, toggle, btnNode) {
                btnNode.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (ul.is(':hidden')) { ul.show(); $(btnNode).text('−'); }
                    else { ul.hide(); $(btnNode).text('+'); }
                }, false);
            })(ul, toggle, toggle[0]);

            parentUl.append(li);
        }

        for (var j = 0; j < fileNames.length; j++) {
            var name = fileNames[j];
            var path = prefix ? prefix + '/' + name : name;
            var isMain = (this.project && path === this.project.mainFile);

            var li2 = $('<li></li>');
            li2.append($('<span class="wb-toggle wb-leaf"></span>'));

            var lbl2 = $('<span class="wb-tree-label wb-ptree-file"></span>')
                .text((isMain ? '★ ' : '') + name)
                .attr('data-path', path)
                .attr('data-type', 'file')
                .attr('title', path);

            if (isMain) lbl2.addClass('wb-ptree-main');
            li2.append(lbl2);
            parentUl.append(li2);
        }
    };

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

        rootNode.addEventListener('click', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl) return;
            e.stopPropagation();
            self.root.find('.wb-tree-label').removeClass('wb-selected');
            $(lbl).addClass('wb-selected');
            self._selectedPath = lbl.getAttribute('data-path');
            bus.emit('project:file:selected', {
                path: self._selectedPath,
                type: lbl.getAttribute('data-type'),
                project: self.project
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
            self.root.find('.wb-tree-label').removeClass('wb-selected');

            if (lbl) {
                $(lbl).addClass('wb-selected');
                var path = lbl.getAttribute('data-path');
                var type = lbl.getAttribute('data-type');
                self._selectedPath = path;
                bus.emit('project:contextmenu', {
                    x: e.clientX, y: e.clientY,
                    path: path, type: type, project: self.project
                });
            } else {
                self._selectedPath = '';
                bus.emit('project:contextmenu', {
                    x: e.clientX, y: e.clientY,
                    path: '', type: 'root', project: self.project
                });
            }
            return false;
        }, false);
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

    /* Публичный хелпер — пригодится другим модулям. */
    ProjectTree.isKeep = isKeep;

    global.ProjectTree = ProjectTree;

})(window, jQuery);
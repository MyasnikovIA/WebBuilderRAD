/* Palette v6 — единая палитра компонентов с раскладкой в localStorage.

   ВСЕ компоненты (D3/M2/HTML + пользовательские) находятся в одном дереве,
   управляемом раскладкой 'wb.paletteLayout'.

   Возможности:
     • компоненты можно перетаскивать между любыми папками;
     • папки можно создавать, переименовывать, удалять, вкладывать;
     • папку можно тащить целиком (с подпапками и компонентами);
     • мультивыделение (Ctrl+клик) — тащим всю группу.

   Ограничения:
     • стандартные компоненты (kind='builtin') удалить нельзя;
     • папки-категории (kind='category') можно удалять — содержимое
       поднимается в родительскую папку;
     • стандартные компоненты регистрируются в реестре, поэтому всегда
       доступны, даже если их папку удалили (перейдут в корень).

   DnD — HTML5 (как в project-tree.js). Все обработчики через НАТИВНЫЙ
   addEventListener. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    function Palette(rootEl) {
        this.root = $(rootEl);
        this.rootNode = (typeof rootEl === 'string')
            ? document.getElementById(rootEl)
            : rootEl;
        this.active = null;
        this._collapsed = {};
        this._collapseAllOnRender = true;
        this._userSel = {};              /* itemId → true */
        this._lastUserClick = null;
        this._dragItemIds = null;        /* массив itemId при drag items */
        this._dragFolderIds = null;      /* массив folderId при drag folders */
        this._isDragging = false;

        this._render();
        var self = this;

        $('#wb-palette-filter').bind('keyup input', function () {
            self._filter($(this).val());
        });

        bus.on('palette:placed',    function () { self.clearActive(); });
        bus.on('palette:cancelled', function () { self.clearActive(); });
        bus.on('component:added',   function () {
            var m = global.ComponentStorage.readPaletteLayout();
            global.ComponentStorage._syncUserComponentsToLayout(m);
            self._render();
        });
        bus.on('component:removed', function () { self._render(); });
        bus.on('palette:refresh',   function () { self._render(); });

        this._installContextMenu();
        this._installDnD();
    }

    /* ============================================================
       Инициализация раскладки.
       ============================================================ */
    Palette.prototype._ensureLayout = function () {
        return global.ComponentStorage.ensurePaletteInitialized(global.ComponentRegistry);
    };

    /* ============================================================
       Сборка всех элементов палитры (built-in + user).
       ============================================================ */
    Palette.prototype._collectItems = function () {
        var out = [];
        var all = global.ComponentRegistry.all();
        for (var i = 0; i < all.length; i++) {
            var def = all[i];
            if (def.hidden) continue;
            out.push({
                itemId: 'b:' + def.id,
                kind: 'builtin',
                refId: def.id,
                def: def,
                caption: def.caption || def.id
            });
        }
        var comps = global.ComponentStorage.listComponents();
        for (var j = 0; j < comps.length; j++) {
            var c = comps[j];
            out.push({
                itemId: 'u:' + c.id,
                kind: 'user',
                refId: c.id,
                comp: c,
                caption: c.name || c.id
            });
        }
        return out;
    };

    /* ============================================================
       Основной рендер.
       ============================================================ */
    Palette.prototype._render = function () {
        var self = this;
        this.root.empty();

        var layout = this._ensureLayout();

        var fmap = {};
        fmap[''] = {
            id: '', name: '', parentId: null, position: -1, kind: 'root',
            items: [], childFolders: []
        };
        for (var fid in layout.folders) {
            if (!layout.folders.hasOwnProperty(fid)) continue;
            var f = layout.folders[fid];
            fmap[fid] = {
                id: f.id, name: f.name, parentId: f.parentId || '',
                position: f.position || 0, kind: f.kind || 'user',
                items: [], childFolders: []
            };
        }

        for (var fid2 in fmap) {
            if (fid2 === '') continue;
            var fld = fmap[fid2];
            var pid = fld.parentId;
            if (!fmap[pid]) pid = '';
            fmap[pid].childFolders.push(fld);
        }

        var items = this._collectItems();
        for (var ii = 0; ii < items.length; ii++) {
            var it = items[ii];
            var pl = layout.items[it.itemId] || { folderId: '', position: 0 };
            var target = fmap[pl.folderId] || fmap[''];
            it.position = pl.position || 0;
            target.items.push(it);
        }

        for (var fid3 in fmap) {
            if (!fmap.hasOwnProperty(fid3)) continue;
            fmap[fid3].childFolders.sort(function (a, b) {
                if (a.position !== b.position) return a.position - b.position;
                return a.name < b.name ? -1 : 1;
            });
            fmap[fid3].items.sort(function (a, b) {
                if (a.position !== b.position) return a.position - b.position;
                return a.caption < b.caption ? -1 : 1;
            });
        }

        var ul = document.createElement('ul');
        ul.className = 'wb-tree wb-tree-root';
        this._buildFolderNode(fmap[''], ul, /* isRoot */ true);
        this.root.append(ul);

        this._syncSelectionUI();
    };

    Palette.prototype._buildFolderNode = function (folder, parentUl, isRoot) {
        var self = this;
        var li = document.createElement('li');
        var hasChildren = folder.childFolders.length > 0 || folder.items.length > 0;
        var collKey = 'f:' + folder.id;
        var collapsed = !!this._collapsed[collKey];

        var tog = document.createElement('span');
        tog.className = 'wb-toggle' + (hasChildren ? '' : ' wb-leaf');
        tog.textContent = hasChildren ? (collapsed ? '+' : '\u2212') : '';
        li.appendChild(tog);

        var lbl = document.createElement('span');
        lbl.className = 'wb-tree-label wb-cat-label wb-palette-folder';
        lbl.setAttribute('data-palette-folder-id', folder.id);
        if (folder.kind === 'category') lbl.classList.add('wb-palette-folder-cat');
        if (isRoot) {
            lbl.classList.add('wb-palette-root');
            lbl.setAttribute('data-palette-root', '1');
            lbl.textContent = 'Palette';
        } else {
            lbl.textContent = folder.name;
            lbl.setAttribute('draggable', 'true');
        }
        li.appendChild(lbl);

        var ul = document.createElement('ul');
        if (collapsed) ul.style.display = 'none';

        for (var i = 0; i < folder.childFolders.length; i++) {
            this._buildFolderNode(folder.childFolders[i], ul, false);
        }
        for (var j = 0; j < folder.items.length; j++) {
            ul.appendChild(this._buildItemNode(folder.items[j]));
        }

        li.appendChild(ul);
        parentUl.appendChild(li);

        if (hasChildren) {
            tog.addEventListener('click', function (e) {
                e.stopPropagation();
                self._collapsed[collKey] = !self._collapsed[collKey];
                var now = self._collapsed[collKey];
                tog.textContent = now ? '+' : '\u2212';
                ul.style.display = now ? 'none' : '';
            }, false);
        }
        return li;
    };

    Palette.prototype._buildItemNode = function (it) {
        var self = this;
        var li = document.createElement('li');
        var tog = document.createElement('span');
        tog.className = 'wb-toggle wb-leaf';
        li.appendChild(tog);

        var item = document.createElement('span');
        item.className = 'wb-tree-label wb-comp-label wb-palette-item';
        item.setAttribute('data-item-id', it.itemId);
        item.setAttribute('data-item-kind', it.kind);
        item.setAttribute('draggable', 'true');

        var iconUrl = '';
        if (it.kind === 'builtin' && it.def.iconUrl) iconUrl = it.def.iconUrl;
        if (it.kind === 'user' && it.comp.icon) {
            iconUrl = it.comp.icon;
            if (global.ProjectResolver && global.ProjectResolver.isProjectPath && global.ProjectResolver.isProjectPath(iconUrl)) {
                try { iconUrl = global.ProjectResolver.resolve(iconUrl); } catch (e) {}
            }
        }
        if (iconUrl) {
            var img = document.createElement('img');
            img.className = 'wb-palette-icon';
            img.alt = '';
            img.draggable = false;
            img.setAttribute('draggable', 'false');
            img.src = iconUrl;
            img.onerror = function () { if (this.parentNode) this.parentNode.removeChild(this); };
            item.appendChild(img);
        }
        item.appendChild(document.createTextNode(it.caption));

        item.addEventListener('click', function (e) {
            e.stopPropagation();
            self._selectItem(it, e.ctrlKey || e.metaKey);
        }, false);

        li.appendChild(item);
        return li;
    };

    /* ============================================================
       Выделение.
       ============================================================ */
    Palette.prototype._selectItem = function (it, additive) {
        if (!additive) this._userSel = {};
        this._userSel[it.itemId] = true;
        this._lastUserClick = it.itemId;
        this._syncSelectionUI();

        var def;
        if (it.kind === 'builtin') def = it.def;
        else def = global.ComponentStorage.toDef(it.comp);
        this.clearActive();
        this.root.find('.wb-palette-item[data-item-id="' + cssEscape(it.itemId) + '"]').addClass('wb-active');
        this.active = def;
        $('#wb-domtree').addClass('wb-drop-mode');
        bus.emit('palette:selected', { component: def });
    };

    Palette.prototype._syncSelectionUI = function () {
        var self = this;
        this.root.find('.wb-palette-item').each(function () {
            var id = $(this).attr('data-item-id');
            $(this).toggleClass('wb-selected', !!self._userSel[id]);
        });
    };

    Palette.prototype.getSelectedItemIds = function () {
        var out = [];
        for (var k in this._userSel) if (this._userSel[k]) out.push(k);
        return out;
    };

    Palette.prototype.clearActive = function () {
        this.root.find('.wb-palette-item').removeClass('wb-active');
        this.active = null;
        $('#wb-domtree').removeClass('wb-drop-mode');
    };

    /* ============================================================
       Resolve drop target.
       ============================================================ */
    Palette.prototype._resolveDropTarget = function (el, rootNode) {
        if (!el || !rootNode) return null;
        var node = el;
        while (node && node !== rootNode) {
            if (node.classList && node.classList.contains('wb-tree-label')) {
                if (node.getAttribute('data-palette-root') === '1') {
                    return { folderId: '', label: node };
                }
                var fId = node.getAttribute('data-palette-folder-id');
                if (fId != null) {
                    return { folderId: fId || '', label: node };
                }
                var itemId = node.getAttribute('data-item-id');
                if (itemId) {
                    var li = node.parentNode;
                    var ul = li ? li.parentNode : null;
                    return this._folderFromUl(ul, rootNode);
                }
                return null;
            }
            node = node.parentNode;
        }
        node = el;
        while (node && node !== rootNode) {
            if (node.tagName === 'UL') return this._folderFromUl(node, rootNode);
            node = node.parentNode;
        }
        return null;
    };

    Palette.prototype._folderFromUl = function (ul, rootNode) {
        if (!ul) return null;
        var li = ul.parentNode;
        if (li && li.tagName === 'LI') {
            for (var i = 0; i < li.children.length; i++) {
                var c = li.children[i];
                if (!c.classList || !c.classList.contains('wb-tree-label')) continue;
                if (c.getAttribute('data-palette-root') === '1') {
                    return { folderId: '', label: c };
                }
                var fId = c.getAttribute('data-palette-folder-id');
                if (fId != null) return { folderId: fId || '', label: c };
            }
        }
        return null;
    };

    /* ============================================================
       HTML5 DnD.
       ============================================================ */
    Palette.prototype._installDnD = function () {
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

        rootNode.addEventListener('dragstart', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl) return;

            var itemId = lbl.getAttribute('data-item-id');
            var folderId = lbl.getAttribute('data-palette-folder-id');

            if (itemId) {
                if (!self._userSel[itemId]) {
                    self._userSel = {};
                    self._userSel[itemId] = true;
                    self._syncSelectionUI();
                }
                var ids = self.getSelectedItemIds();
                self._dragItemIds = ids;
                self._dragFolderIds = null;
                for (var i = 0; i < ids.length; i++) {
                    var el = rootNode.querySelector('.wb-palette-item[data-item-id="' + cssEscape(ids[i]) + '"]');
                    if (el) el.classList.add('wb-dragging');
                }
                try {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', ids.join('\n'));
                    e.dataTransfer.setData('application/x-wb-palette-item', ids[0]);
                } catch (ex) {}
            } else if (folderId && folderId !== '') {
                self._dragFolderIds = [folderId];
                self._dragItemIds = null;
                lbl.classList.add('wb-dragging');
                try {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', folderId);
                    e.dataTransfer.setData('application/x-wb-palette-folder', folderId);
                } catch (ex) {}
            } else {
                return;
            }
            self._isDragging = true;
        }, false);

        rootNode.addEventListener('dragend', function () { self._endDrag(); }, false);

        rootNode.addEventListener('dragover', function (e) {
            if (!self._isDragging) return;
            var target = self._resolveDropTarget(e.target, rootNode);
            self._clearDropIndicators();
            if (!target) { if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; return; }

            if (self._dragFolderIds && self._dragFolderIds.length) {
                var movingF = self._dragFolderIds[0];
                if (movingF === target.folderId) {
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                    return;
                }
                if (target.folderId && self._isFolderDescendant(target.folderId, movingF)) {
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                    return;
                }
            }

            e.preventDefault();
            try { e.dataTransfer.dropEffect = 'move'; } catch (ex) {}
            if (target.label) target.label.classList.add('wb-drop-inside');
        }, false);

        rootNode.addEventListener('dragleave', function (e) {
            var lbl = findLabel(e.target);
            if (lbl) lbl.classList.remove('wb-drop-inside', 'wb-drop-forbidden');
        }, false);

        rootNode.addEventListener('drop', function (e) {
            if (!self._isDragging) return;
            e.preventDefault();
            e.stopPropagation();

            var target = self._resolveDropTarget(e.target, rootNode);
            if (!target) { self._endDrag(); return false; }

            var moved = false;

            if (self._dragItemIds && self._dragItemIds.length) {
                for (var i = 0; i < self._dragItemIds.length; i++) {
                    if (global.ComponentStorage.setItemPlacement(self._dragItemIds[i], target.folderId)) {
                        moved = true;
                    }
                }
            }

            if (self._dragFolderIds && self._dragFolderIds.length) {
                for (var j = 0; j < self._dragFolderIds.length; j++) {
                    if (global.ComponentStorage.movePaletteFolder(self._dragFolderIds[j], target.folderId)) {
                        moved = true;
                    }
                }
            }

            self._endDrag();
            if (moved) self._render();
            return false;
        }, false);
    };

    Palette.prototype._isFolderDescendant = function (folderId, ancestorId) {
        var m = global.ComponentStorage.readPaletteLayout();
        var cur = folderId;
        while (cur) {
            if (cur === ancestorId) return true;
            cur = m.folders[cur] ? m.folders[cur].parentId : '';
        }
        return false;
    };

    Palette.prototype._endDrag = function () {
        this._isDragging = false;
        this._dragItemIds = null;
        this._dragFolderIds = null;
        if (!this.rootNode) return;
        var drags = this.rootNode.querySelectorAll('.wb-dragging');
        for (var i = 0; i < drags.length; i++) drags[i].classList.remove('wb-dragging');
        this._clearDropIndicators();
    };

    Palette.prototype._clearDropIndicators = function () {
        if (!this.rootNode) return;
        var els = this.rootNode.querySelectorAll('.wb-drop-inside, .wb-drop-forbidden');
        for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('wb-drop-inside', 'wb-drop-forbidden');
        }
    };

    /* ============================================================
       Контекстное меню.
       ============================================================ */
    Palette.prototype._installContextMenu = function () {
        var self = this;
        var rootNode = this.rootNode;
        if (!rootNode) return;

        rootNode.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var tgt = $(e.target);
            var ctx = { x: e.clientX, y: e.clientY };

            var itemEl = tgt.closest('[data-item-id]');
            var folderEl = tgt.closest('[data-palette-folder-id]');

            if (itemEl.length) {
                var id = itemEl.attr('data-item-id');
                if (!self._userSel[id]) {
                    self._userSel = {};
                    self._userSel[id] = true;
                    self._syncSelectionUI();
                }
                ctx.type = 'item';
                ctx.ids = self.getSelectedItemIds();
                ctx.kind = itemEl.attr('data-item-kind');
            } else if (folderEl.length) {
                ctx.type = 'folder';
                ctx.folderId = folderEl.attr('data-palette-folder-id') || '';
                var l = global.ComponentStorage.getPaletteFolder(ctx.folderId);
                ctx.folderKind = l ? l.kind : 'user';
            } else {
                ctx.type = 'root';
            }

            self._ctx = ctx;
            bus.emit('palette:contextmenu', ctx);
        }, false);
    };

    Palette.prototype.showContextMenu = function (ctx) {
        var menuId;
        if (ctx.type === 'item') {
            menuId = (ctx.kind === 'user') ? 'wb-usercompmenu' : 'wb-paletteitemmenu';
        } else if (ctx.type === 'folder') {
            menuId = 'wb-userfoldermenu';
        } else {
            menuId = 'wb-userpalettemenu';
        }
        var menu = global.mini.get(menuId);
        if (menu) menu.showAtPos(ctx.x, ctx.y);
    };

    /* ============================================================
       Действия контекстного меню.
       ============================================================ */
    Palette.prototype.userCtxNewFolder = function () {
        var name = prompt('Имя папки:', 'New Folder');
        if (!name) return;
        var parentId = (this._ctx && this._ctx.type === 'folder') ? (this._ctx.folderId || '') : '';
        global.ComponentStorage.createPaletteFolder(String(name).trim(), parentId);
        this._render();
    };

    Palette.prototype.userCtxRenameFolder = function () {
        if (!this._ctx || this._ctx.type !== 'folder') return;
        var f = global.ComponentStorage.getPaletteFolder(this._ctx.folderId);
        if (!f) return;
        var name = prompt('Новое имя папки:', f.name);
        if (!name) return;
        global.ComponentStorage.renamePaletteFolder(f.id, String(name).trim());
        this._render();
    };

    Palette.prototype.userCtxDeleteFolder = function () {
        if (!this._ctx || this._ctx.type !== 'folder') return;
        if (!this._ctx.folderId) return;
        if (!confirm('Удалить папку? Компоненты и подпапки переместятся в родителя.')) return;
        global.ComponentStorage.deletePaletteFolder(this._ctx.folderId);
        this._render();
    };

    Palette.prototype.paletteItemCtxReset = function () {
        if (!this._ctx || this._ctx.type !== 'item') return;
        var ids = this._ctx.ids || [];
        for (var i = 0; i < ids.length; i++) {
            global.ComponentStorage.clearItemPlacement(ids[i]);
        }
        try {
            global.ComponentStorage.savePaletteLayout({ version: 1, initialized: false, folders: {}, items: {} });
        } catch (e) {}
        this._render();
    };

    Palette.prototype.userCtxOpenInProject = function () {
        var ids = (this._ctx && this._ctx.ids) || [];
        if (!ids.length) return;
        var uid = ids[0];
        if (uid.indexOf('u:') !== 0) return;
        var compId = uid.substring(2);
        var comp = global.ComponentStorage.getComponent(compId);
        if (!comp) return;

        var defaultName = 'Component_' + (comp.name || comp.cmptype || 'edit');
        var projName = prompt('Имя проекта для редактирования:', defaultName);
        if (!projName) return;
        projName = String(projName).trim();
        if (!projName) return;

        var pm = global.ProjectManagerInstance;
        if (!pm) { alert('ProjectManager не подключён.'); return; }

        var proj = global.ProjectStorage.get(projName);
        if (proj) {
            if (!confirm('Проект "' + projName + '" уже существует. Перезаписать?')) return;
        } else {
            proj = global.ProjectStorage.create(projName);
            if (!proj) { alert('Не удалось создать проект.'); return; }
        }

        proj.rootType = 'component';
        proj.mainFile = 'index.html';
        proj.files = proj.files || {};

        proj.componentData = {
            id: comp.id, name: comp.name || '', cmptype: comp.cmptype || '',
            tagName: comp.tagName || 'div', icon: comp.icon || '',
            description: comp.description || '',
            previewIdeHtml: comp.previewIdeHtml || comp.html || '',
            html: comp.previewIdeHtml || comp.html || '',
            customProperties: comp.customProperties || [],
            customEvents: comp.customEvents || [],
            nestingMode: comp.nestingMode || 'all',
            nestingRules: comp.nestingRules || [],
            jsLibs: comp.jsLibs || [], cssLibs: comp.cssLibs || []
        };

        var compHtml = comp.previewIdeHtml || comp.html || '';
        proj.files['index.html'] = {
            kind: 'text',
            content: '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>' +
                escapeHtml(projName) + '</title>\n</head>\n<body>\n' + compHtml + '\n</body>\n</html>'
        };

        var safeCt = String(comp.cmptype || '').replace(/[^A-Za-z0-9_.-]/g, '_');
        var libDir = global.ComponentStorage.LIB_DIR;
        if (safeCt) {
            var keys = Object.keys(proj.files);
            for (var i = 0; i < keys.length; i++) {
                if (keys[i].indexOf(libDir) === 0) delete proj.files[keys[i]];
            }
            proj.files[libDir + 'core.js'] = {
                kind: 'text', _system: 'wb-lib',
                content: global.ComponentStorage.CORE_SOURCE
            };
            proj.files[libDir + safeCt + '.js'] = {
                kind: 'text', _system: 'wb-lib',
                content: global.ComponentStorage._buildCmptypeJs(comp)
            };
            proj.files[libDir + safeCt + '.css'] = {
                kind: 'text', _system: 'wb-lib',
                content: global.ComponentStorage._buildCmptypeCss(comp)
            };
        }

        global.ProjectStorage.save(proj);
        pm.refreshCombo();
        pm.load(projName);
    };

    Palette.prototype.userCtxDeleteComponents = function () {
        var ids = (this._ctx && this._ctx.ids) || [];
        var uids = ids.filter(function (x) { return x.indexOf('u:') === 0; });
        if (!uids.length) { alert('Ничего не выбрано.'); return; }
        if (!confirm('Удалить выбранные компоненты (' + uids.length + ')?')) return;
        for (var i = 0; i < uids.length; i++) {
            var cid = uids[i].substring(2);
            global.ComponentStorage.deleteComponent(cid);
            global.ComponentStorage.clearItemPlacement(uids[i]);
        }
        this._userSel = {};
        this._render();
    };

    Palette.prototype.userCtxExportSelected = function () {
        var ids = (this._ctx && this._ctx.ids) || [];
        var comps = [];
        for (var i = 0; i < ids.length; i++) {
            if (ids[i].indexOf('u:') !== 0) continue;
            var c = global.ComponentStorage.getComponent(ids[i].substring(2));
            if (c) comps.push(c);
        }
        if (!comps.length) { alert('Ничего не выбрано.'); return; }
        global.ComponentExportUtils.exportComponents(comps);
    };

    Palette.prototype.userCtxImport = function () {
        var self = this;
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.zip,application/zip,application/x-zip-compressed';
        inp.onchange = function () {
            var f = inp.files[0]; if (!f) return;
            global.ComponentExportUtils.importComponents(f).then(function (n) {
                alert('Импортировано компонентов: ' + n);
                self._render();
            }).catch(function (err) {
                alert('Ошибка импорта: ' + (err && err.message || err));
            });
        };
        inp.click();
    };

    Palette.prototype.userCtxImportFromProject = function () {
        var self = this;
        var names = global.ProjectStorage.list();
        var list = [];
        for (var i = 0; i < names.length; i++) {
            var p = global.ProjectStorage.get(names[i]);
            if (p && p.rootType === 'component' && p.componentData) {
                list.push({ name: names[i], project: p });
            }
        }
        if (!list.length) { alert('Нет проектов-компонентов (Root: component).'); return; }

        var host = document.createElement('div');
        host.style.cssText = 'padding:10px;font-family:inherit;font-size:12px;';
        var lbl = document.createElement('div');
        lbl.textContent = 'Выберите проект-компонент:';
        lbl.style.marginBottom = '6px';
        host.appendChild(lbl);
        var sel = document.createElement('select');
        sel.style.cssText = 'width:100%;padding:4px 6px;font-size:12px;box-sizing:border-box;';
        for (var k = 0; k < list.length; k++) {
            var cd = list[k].project.componentData || {};
            var opt = document.createElement('option');
            opt.value = list[k].name;
            opt.textContent = list[k].name + '  (cmptype: ' + (cd.cmptype || '?') + ')';
            sel.appendChild(opt);
        }
        host.appendChild(sel);

        global.Modal.open({
            title: 'Import Component from Project',
            content: host,
            onOk: function () {
                var entry = null;
                for (var j = 0; j < list.length; j++) if (list[j].name === sel.value) { entry = list[j]; break; }
                if (!entry) return;
                var cd = self._componentDataFromProject(entry.project);
                if (!cd || !cd.cmptype) { alert('Нет данных компонента.'); return; }
                var existing = global.ComponentStorage.findByCmptype(cd.cmptype);
                if (existing) {
                    if (!confirm('Компонент с cmptype="' + cd.cmptype + '" уже есть. Перезаписать?')) return;
                    global.ComponentStorage.updateComponent(existing.id, cd);
                } else {
                    global.ComponentStorage.createComponent(cd);
                }
                self._render();
            }
        });
    };

    Palette.prototype._componentDataFromProject = function (project) {
        if (!project || !project.componentData) return null;
        var cd;
        try { cd = JSON.parse(JSON.stringify(project.componentData)); } catch (e) { cd = project.componentData; }
        if (!cd.previewIdeHtml && cd.html) cd.previewIdeHtml = cd.html;
        if (!cd.html && cd.previewIdeHtml) cd.html = cd.previewIdeHtml;
        var ct = cd.cmptype;
        if (!ct) return cd;
        var safeCt = String(ct).replace(/[^A-Za-z0-9_.-]/g, '_');
        var files = project.files || {};
        var jsFile = files['lib/wb-component/' + safeCt + '.js'];
        if (jsFile && jsFile.content) cd.js = this._extractUserJs(jsFile.content);
        var cssFile = files['lib/wb-component/' + safeCt + '.css'];
        if (cssFile && cssFile.content) cd.css = this._extractUserCss(cssFile.content);
        return cd;
    };

    Palette.prototype._extractUserJs = function (fullJs) {
        if (!fullJs) return '';
        var marker = '/* --- user code --- */';
        var idx = fullJs.indexOf(marker);
        if (idx < 0) return '';
        return fullJs.substring(idx + marker.length).replace(/^\r?\n/, '');
    };
    Palette.prototype._extractUserCss = function (fullCss) {
        if (!fullCss) return '';
        var marker = '/* --- user css --- */';
        var idx = fullCss.indexOf(marker);
        if (idx < 0) return '';
        return fullCss.substring(idx + marker.length).replace(/^\r?\n/, '');
    };

    /* ============================================================
       Фильтр.
       ============================================================ */
    Palette.prototype._filter = function (txt) {
        txt = (txt || '').toLowerCase();
        var $root = this.root;
        if (!txt) {
            $root.find('ul, li').show();
            return;
        }
        $root.find('li').hide();
        $root.find('ul').hide();
        $root.find('.wb-palette-item').each(function () {
            var $lab = $(this);
            if ($lab.text().toLowerCase().indexOf(txt) < 0) return;
            $lab.show();
            var $li = $lab.closest('li');
            $li.show();
            $li.parents('li').show();
            $li.parents('ul').show();
        });
        $root.find('.wb-palette-folder').each(function () {
            var $lab = $(this);
            if ($lab.text().toLowerCase().indexOf(txt) < 0) return;
            var $li = $lab.closest('li');
            $li.show();
            $li.find('ul, li, .wb-palette-item').show();
            $li.parents('li').show();
            $li.parents('ul').show();
        });
    };

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function cssEscape(s) {
        return String(s).replace(/[^a-zA-Z0-9_\-:]/g, function (c) {
            return '\\' + c;
        });
    }

    global.Palette = Palette;
})(window, jQuery);
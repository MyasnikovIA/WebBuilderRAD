/* PaletteEditor — модальный редактор раскладки Tool Palette.

   Открывается из контекстного меню «Изменить палитру…».

   Даёт пользователю:
     • перемещать любые компоненты и папки по дереву (HTML5 DnD);
     • менять порядок элементов и папок внутри одного контейнера
       (зоны drop как в wb-domtree: верхние 25% — before,
       нижние 25% — after, середина — inside);
     • создавать / переименовывать / удалять папки;
     • удалять только пользовательские компоненты;
     • импортировать компоненты из ZIP / из проектов с Root: component;
     • сбросить раскладку к состоянию по умолчанию.

   Изменения сохраняются в localStorage['wb.paletteLayout'] мгновенно
   (после каждого DnD / операции). Кнопка «Отмена» восстанавливает
   снимок, сделанный при открытии редактора. Кнопка «OK» просто
   закрывает окно, изменения остаются. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    function PaletteEditor() {
        this._treeEl = null;
        this._snapshot = null;
        this._collapsed = {};
        this._dragItemIds = null;
        this._dragFolderIds = null;
        this._isDragging = false;
        this._selItems = {};
        this._open = false;
        this._ctx = null;
        this._modalWatchInstalled = false;
    }

    /* ============================================================
       Наблюдатель за окном MiniUI: когда окно закрывается
       (крестиком / Esc / извне), сбрасываем _open и snapshot.
       ============================================================ */
    PaletteEditor.prototype._installModalWatch = function () {
        if (this._modalWatchInstalled) return;
        var self = this;
        var win = null;
        try { win = global.mini && global.mini.get && global.mini.get('wb-window'); }
        catch (e) { win = null; }
        if (!win || !win.on) return;

        try {
            win.on('hide', function () {
                self._open = false;
                self._snapshot = null;
                self._treeEl = null;
            });
            this._modalWatchInstalled = true;
        } catch (e) { /* ignore */ }
    };

    /* ============================================================
       Открытие редактора.
       ============================================================ */
    PaletteEditor.prototype.open = function () {
        var self = this;

        try {
            var win0 = global.mini && global.mini.get && global.mini.get('wb-window');
            if (!win0 || !win0.getVisible || !win0.getVisible()) {
                this._open = false;
            }
        } catch (e) { this._open = false; }

        if (this._open) return;

        this._installModalWatch();

        try {
            this._open = true;
            this._doOpen();
        } catch (err) {
            console.error('[PaletteEditor.open]', err);
            this._open = false;
            this._snapshot = null;
            this._treeEl = null;
            alert('Не удалось открыть редактор палитры: ' + (err && err.message || err));
        }
    };

    PaletteEditor.prototype._doOpen = function () {
        var self = this;

        this._snapshot = JSON.parse(JSON.stringify(
            global.ComponentStorage.readPaletteLayout()));

        this._collapsed = {};
        this._selItems = {};

        var host = document.createElement('div');
        host.className = 'wb-palette-editor';
        host.style.cssText =
            'display:flex;flex-direction:column;height:100%;min-height:400px;' +
            'background:var(--wb-panel-bg,#fff);color:var(--wb-text,#222);';

        var toolbar = document.createElement('div');
        toolbar.style.cssText =
            'flex:0 0 auto;padding:4px 6px;' +
            'background:var(--wb-panel-head-bg,#f5f5f5);' +
            'border-bottom:1px solid var(--wb-border,#c0c0c0);' +
            'display:flex;gap:4px;align-items:center;flex-wrap:wrap;';

        var btnAddFolder = mkButton('+ Папка');
        var btnImportZip = mkButton('Импорт ZIP…');
        var btnImportProj = mkButton('Из проекта…');

        var spacer = document.createElement('span');
        spacer.style.cssText = 'flex:1;';

        var btnReset = mkButton('Сбросить по умолчанию');
        btnReset.style.cssText += 'color:var(--wb-danger,#c62828);';

        toolbar.appendChild(btnAddFolder);
        toolbar.appendChild(btnImportZip);
        toolbar.appendChild(btnImportProj);
        toolbar.appendChild(spacer);
        toolbar.appendChild(btnReset);
        host.appendChild(toolbar);

        var treeBox = document.createElement('div');
        treeBox.style.cssText =
            'flex:1;overflow:auto;padding:6px;' +
            'background:var(--wb-panel-bg,#fff);' +
            'color:var(--wb-text,#222);' +
            'min-height:0;border-bottom:1px solid var(--wb-border,#c0c0c0);';
        host.appendChild(treeBox);

        var hint = document.createElement('div');
        hint.style.cssText =
            'flex:0 0 auto;padding:4px 6px;font-size:11px;' +
            'color:var(--wb-text-muted,#666);' +
            'background:var(--wb-panel-head-bg,#fafafa);' +
            'border-top:1px solid var(--wb-border,#c0c0c0);';
        hint.textContent =
            'Перетаскивайте компоненты и папки мышью. ' +
            'Верх / низ цели — вставка до / после, середина — внутрь. ' +
            'Стандартные компоненты нельзя удалить — только переместить.';
        host.appendChild(hint);

        this._treeEl = treeBox;

        btnAddFolder.addEventListener('click', function () { self._addFolder(); }, false);
        btnImportZip.addEventListener('click', function () { self._importZip(); }, false);
        btnImportProj.addEventListener('click', function () { self._importFromProject(); }, false);
        btnReset.addEventListener('click', function () { self._resetToDefault(); }, false);

        this._installDnD();
        this._installContextMenu();
        this._render();

        global.Modal.open({
            title: 'Редактор Tool Palette',
            content: host,
            onOk: function () { self._close(true); },
            onCancel: function () { self._close(false); }
        });
    };

    PaletteEditor.prototype._close = function (save) {
        var hadSnapshot = this._snapshot;
        this._open = false;
        this._treeEl = null;
        if (!save && hadSnapshot) {
            try { global.ComponentStorage.savePaletteLayout(hadSnapshot); } catch (e) {}
        }
        this._snapshot = null;
        bus.emit('palette:refresh');
    };

    /* ============================================================
       Сбор элементов (built-in + user).
       ============================================================ */
    PaletteEditor.prototype._collectItems = function () {
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

    PaletteEditor.prototype._captionForItemId = function (itemId) {
        if (!itemId) return '';
        if (itemId.indexOf('b:') === 0) {
            var def = global.ComponentRegistry.get(itemId.substring(2));
            return def ? (def.caption || def.id) : itemId;
        }
        if (itemId.indexOf('u:') === 0) {
            var comp = global.ComponentStorage.getComponent(itemId.substring(2));
            return comp ? (comp.name || comp.id) : itemId;
        }
        return itemId;
    };

    /* ============================================================
       Рендер.
       ============================================================ */
    PaletteEditor.prototype._render = function () {
        var treeEl = this._treeEl;
        if (!treeEl) return;
        treeEl.innerHTML = '';

        var layout = global.ComponentStorage.readPaletteLayout();

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
        this._buildFolderNode(fmap[''], ul, true);
        treeEl.appendChild(ul);

        this._syncSelection();
    };

    PaletteEditor.prototype._buildFolderNode = function (folder, parentUl, isRoot) {
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

    PaletteEditor.prototype._buildItemNode = function (it) {
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
            if (global.ProjectResolver && global.ProjectResolver.isProjectPath
                && global.ProjectResolver.isProjectPath(iconUrl)) {
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
            if (!e.ctrlKey && !e.metaKey) self._selItems = {};
            self._selItems[it.itemId] = true;
            self._syncSelection();
        }, false);

        li.appendChild(item);
        return li;
    };

    PaletteEditor.prototype._syncSelection = function () {
        var self = this;
        if (!this._treeEl) return;
        var els = this._treeEl.querySelectorAll('.wb-palette-item');
        for (var i = 0; i < els.length; i++) {
            var id = els[i].getAttribute('data-item-id');
            els[i].classList.toggle('wb-selected', !!self._selItems[id]);
        }
    };

    /* ============================================================
       Зона drop относительно label — как в dom-tree.js.
       ============================================================ */
    PaletteEditor.prototype._zoneFromEvent = function (labelEl, nativeEvent) {
        var rect = labelEl.getBoundingClientRect();
        var y = nativeEvent.clientY - rect.top;
        var h = rect.height || 1;
        if (y < h * 0.25) return 'before';
        if (y > h * 0.75) return 'after';
        return 'inside';
    };

    /* ============================================================
       Resolve drop target.
       ============================================================ */
    PaletteEditor.prototype._resolveDropTarget = function (el, rootNode, nativeEvent) {
        if (!el || !rootNode) return null;

        var node = el;
        while (node && node !== rootNode) {
            if (node.classList && node.classList.contains('wb-tree-label')) break;
            node = node.parentNode;
        }

        if (node && node !== rootNode) {
            var lbl = node;

            if (lbl.getAttribute('data-palette-root') === '1') {
                return {
                    folderId: '', label: lbl, zone: 'inside',
                    targetKind: 'root'
                };
            }

            var fId = lbl.getAttribute('data-palette-folder-id');
            if (fId != null) {
                var zoneF = nativeEvent ? this._zoneFromEvent(lbl, nativeEvent) : 'inside';
                if (zoneF === 'before' || zoneF === 'after') {
                    var pf = global.ComponentStorage.getPaletteFolder(fId);
                    var parentFolderId = (pf && pf.parentId) ? pf.parentId : '';
                    return {
                        folderId: parentFolderId,
                        label: lbl,
                        zone: zoneF,
                        targetKind: 'folder',
                        targetFolderId: fId
                    };
                }
                return {
                    folderId: fId || '',
                    label: lbl,
                    zone: 'inside',
                    targetKind: 'folder'
                };
            }

            var itemId = lbl.getAttribute('data-item-id');
            if (itemId) {
                var layout = global.ComponentStorage.readPaletteLayout();
                var pl = layout.items[itemId];
                var itemFolderId = (pl && pl.folderId) ? pl.folderId : '';
                var zoneI = nativeEvent ? this._zoneFromEvent(lbl, nativeEvent) : 'inside';
                if (zoneI === 'before' || zoneI === 'after') {
                    return {
                        folderId: itemFolderId,
                        label: lbl,
                        zone: zoneI,
                        targetKind: 'item',
                        targetItemId: itemId
                    };
                }
                return {
                    folderId: itemFolderId,
                    label: lbl,
                    zone: 'inside',
                    targetKind: 'item'
                };
            }
            return null;
        }

        node = el;
        while (node && node !== rootNode) {
            if (node.tagName === 'UL') {
                var t = this._folderFromUl(node, rootNode);
                if (t) {
                    t.zone = 'inside';
                    t.targetKind = 'container';
                }
                return t;
            }
            node = node.parentNode;
        }
        return null;
    };

    PaletteEditor.prototype._folderFromUl = function (ul, rootNode) {
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
       DnD.
       ============================================================ */
    PaletteEditor.prototype._installDnD = function () {
        var self = this;
        var rootNode = this._treeEl;
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
                if (!self._selItems[itemId]) {
                    self._selItems = {};
                    self._selItems[itemId] = true;
                    self._syncSelection();
                }
                var ids = [];
                for (var k in self._selItems) if (self._selItems[k]) ids.push(k);
                self._dragItemIds = ids;
                self._dragFolderIds = null;
                for (var i = 0; i < ids.length; i++) {
                    var el = rootNode.querySelector('.wb-palette-item[data-item-id="' +
                        cssEscape(ids[i]) + '"]');
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
            var target = self._resolveDropTarget(e.target, rootNode, e);
            self._clearDropIndicators();
            if (!target) { if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; return; }

            if (self._dragFolderIds && self._dragFolderIds.length) {
                if (target.targetKind === 'item') {
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                    return;
                }
                var movingF = self._dragFolderIds[0];

                if (target.zone === 'inside' && target.folderId === movingF) {
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                    return;
                }
                if (target.targetKind === 'folder' && target.targetFolderId === movingF) {
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                    return;
                }
                if (target.targetKind === 'folder' && target.targetFolderId) {
                    if (self._isFolderDescendant(target.targetFolderId, movingF)) {
                        if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                        return;
                    }
                }
                if (target.folderId && self._isFolderDescendant(target.folderId, movingF)) {
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                    return;
                }
            }

            if (self._dragItemIds && self._dragItemIds.length) {
                if (target.targetKind === 'item' &&
                    self._dragItemIds.indexOf(target.targetItemId) >= 0) {
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                    return;
                }
            }

            e.preventDefault();
            try { e.dataTransfer.dropEffect = 'move'; } catch (ex) {}

            if (target.label) {
                if (target.zone === 'before')     target.label.classList.add('wb-drop-before');
                else if (target.zone === 'after') target.label.classList.add('wb-drop-after');
                else                              target.label.classList.add('wb-drop-inside');
            }
        }, false);

        rootNode.addEventListener('dragleave', function (e) {
            var lbl = findLabel(e.target);
            if (lbl) lbl.classList.remove('wb-drop-inside', 'wb-drop-before', 'wb-drop-after', 'wb-drop-forbidden');
        }, false);

        rootNode.addEventListener('drop', function (e) {
            if (!self._isDragging) return;
            e.preventDefault();
            e.stopPropagation();

            var target = self._resolveDropTarget(e.target, rootNode, e);
            if (!target) { self._endDrag(); return false; }

            var moved = false;

            if (self._dragItemIds && self._dragItemIds.length) {
                if ((target.zone === 'before' || target.zone === 'after') &&
                    target.targetKind === 'item') {
                    moved = self._reorderItems(
                        self._dragItemIds,
                        target.folderId || '',
                        target.targetItemId,
                        target.zone
                    );
                } else {
                    for (var i = 0; i < self._dragItemIds.length; i++) {
                        if (global.ComponentStorage.setItemPlacement(
                            self._dragItemIds[i], target.folderId)) {
                            moved = true;
                        }
                    }
                }
            }

            if (self._dragFolderIds && self._dragFolderIds.length) {
                if ((target.zone === 'before' || target.zone === 'after') &&
                    target.targetKind === 'folder' && target.targetFolderId) {
                    moved = self._reorderFolders(
                        self._dragFolderIds,
                        target.folderId || '',
                        target.targetFolderId,
                        target.zone
                    );
                } else {
                    for (var j = 0; j < self._dragFolderIds.length; j++) {
                        if (global.ComponentStorage.movePaletteFolder(
                            self._dragFolderIds[j], target.folderId)) {
                            moved = true;
                        }
                    }
                }
            }

            self._endDrag();
            if (moved) self._render();
            return false;
        }, false);
    };

    PaletteEditor.prototype._reorderItems = function (movingIds, folderId, targetItemId, zone) {
        if (!movingIds || !movingIds.length) return false;
        folderId = folderId || '';

        var self = this;
        var layout = global.ComponentStorage.readPaletteLayout();

        var allIds = [];
        for (var iid in layout.items) {
            if (!layout.items.hasOwnProperty(iid)) continue;
            if ((layout.items[iid].folderId || '') === folderId) allIds.push(iid);
        }
        allIds.sort(function (a, b) {
            var pa = (layout.items[a] && layout.items[a].position) || 0;
            var pb = (layout.items[b] && layout.items[b].position) || 0;
            if (pa !== pb) return pa - pb;
            var ca = self._captionForItemId(a) || '';
            var cb = self._captionForItemId(b) || '';
            return ca < cb ? -1 : 1;
        });

        var moving = {};
        for (var i = 0; i < movingIds.length; i++) moving[movingIds[i]] = true;
        var filtered = [];
        for (var j = 0; j < allIds.length; j++) {
            if (!moving[allIds[j]]) filtered.push(allIds[j]);
        }

        var targetIdx = -1;
        for (var k = 0; k < filtered.length; k++) {
            if (filtered[k] === targetItemId) { targetIdx = k; break; }
        }
        if (targetIdx < 0) targetIdx = filtered.length;

        var insertAt = (zone === 'after') ? targetIdx + 1 : targetIdx;

        var result = filtered.slice(0, insertAt)
            .concat(movingIds)
            .concat(filtered.slice(insertAt));

        for (var n = 0; n < result.length; n++) {
            var id = result[n];
            if (!layout.items[id]) layout.items[id] = {};
            layout.items[id].folderId = folderId;
            layout.items[id].position = n;
        }
        global.ComponentStorage.savePaletteLayout(layout);

        return true;
    };

    PaletteEditor.prototype._reorderFolders = function (movingIds, parentFolderId, targetFolderId, zone) {
        if (!movingIds || !movingIds.length) return false;
        parentFolderId = parentFolderId || '';

        var layout = global.ComponentStorage.readPaletteLayout();

        var allIds = [];
        for (var fid in layout.folders) {
            if (!layout.folders.hasOwnProperty(fid)) continue;
            if ((layout.folders[fid].parentId || '') === parentFolderId) allIds.push(fid);
        }
        allIds.sort(function (a, b) {
            var pa = (layout.folders[a] && layout.folders[a].position) || 0;
            var pb = (layout.folders[b] && layout.folders[b].position) || 0;
            if (pa !== pb) return pa - pb;
            var na = layout.folders[a].name || '';
            var nb = layout.folders[b].name || '';
            return na < nb ? -1 : 1;
        });

        var moving = {};
        for (var i = 0; i < movingIds.length; i++) moving[movingIds[i]] = true;
        var filtered = [];
        for (var j = 0; j < allIds.length; j++) {
            if (!moving[allIds[j]]) filtered.push(allIds[j]);
        }

        var targetIdx = -1;
        for (var k = 0; k < filtered.length; k++) {
            if (filtered[k] === targetFolderId) { targetIdx = k; break; }
        }
        if (targetIdx < 0) targetIdx = filtered.length;

        var insertAt = (zone === 'after') ? targetIdx + 1 : targetIdx;

        var result = filtered.slice(0, insertAt)
            .concat(movingIds)
            .concat(filtered.slice(insertAt));

        for (var n = 0; n < result.length; n++) {
            var id = result[n];
            if (!layout.folders[id]) continue;
            layout.folders[id].parentId = parentFolderId;
            layout.folders[id].position = n;
        }
        global.ComponentStorage.savePaletteLayout(layout);

        return true;
    };

    PaletteEditor.prototype._isFolderDescendant = function (folderId, ancestorId) {
        var m = global.ComponentStorage.readPaletteLayout();
        var cur = folderId;
        while (cur) {
            if (cur === ancestorId) return true;
            cur = m.folders[cur] ? m.folders[cur].parentId : '';
        }
        return false;
    };

    PaletteEditor.prototype._endDrag = function () {
        this._isDragging = false;
        this._dragItemIds = null;
        this._dragFolderIds = null;
        if (!this._treeEl) return;
        var drags = this._treeEl.querySelectorAll('.wb-dragging');
        for (var i = 0; i < drags.length; i++) drags[i].classList.remove('wb-dragging');
        this._clearDropIndicators();
    };

    PaletteEditor.prototype._clearDropIndicators = function () {
        if (!this._treeEl) return;
        var els = this._treeEl.querySelectorAll(
            '.wb-drop-inside, .wb-drop-forbidden, .wb-drop-before, .wb-drop-after');
        for (var i = 0; i < els.length; i++) {
            els[i].classList.remove(
                'wb-drop-inside', 'wb-drop-forbidden', 'wb-drop-before', 'wb-drop-after');
        }
    };

    /* ============================================================
       Контекстное меню (локальное для редактора).
       ============================================================ */
    PaletteEditor.prototype._installContextMenu = function () {
        var self = this;
        var rootNode = this._treeEl;
        if (!rootNode) return;

        rootNode.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var tgt = e.target;
            var itemEl = closestWithClass(tgt, 'wb-palette-item', rootNode);
            var folderEl = closestWithAttr(tgt, 'data-palette-folder-id', rootNode);

            if (itemEl) {
                var id = itemEl.getAttribute('data-item-id');
                if (!self._selItems[id]) {
                    self._selItems = {};
                    self._selItems[id] = true;
                    self._syncSelection();
                }
                self._showItemCtxMenu(e.clientX, e.clientY, itemEl.getAttribute('data-item-kind'));
            } else if (folderEl) {
                var fId = folderEl.getAttribute('data-palette-folder-id') || '';
                if (!fId) self._showRootCtxMenu(e.clientX, e.clientY);
                else self._showFolderCtxMenu(e.clientX, e.clientY, fId);
            } else {
                self._showRootCtxMenu(e.clientX, e.clientY);
            }
        }, false);
    };

    /* ------------------------------------------------------------------
       _buildCtxMenu

       ИСПРАВЛЕНО: раньше обработчик mousedown в capture-фазе закрывал
       меню и удалял пункт из DOM до того, как приходил click — из-за
       этого колбэки пунктов (удаление, экспорт, и т.д.) никогда не
       срабатывали. В wb-palette этого не было, потому что там меню
       штатные от MiniUI.

       Теперь mousedown на документе закрывает меню только если клик
       был СНАРУЖИ (menu.contains(ev.target) === false). Клик по пункту
       доходит до нашего click-обработчика, который вызывает closeMenu
       и только потом — колбэк пункта.
       ------------------------------------------------------------------ */
    PaletteEditor.prototype._buildCtxMenu = function (x, y) {
        var menu = document.createElement('div');
        menu.className = 'wb-palette-ctx';
        menu.style.cssText =
            'position:fixed;z-index:100001;' +
            'background:var(--wb-panel-bg,#fff);' +
            'color:var(--wb-text,#222);' +
            'border:1px solid var(--wb-border,#c0c0c0);' +
            'box-shadow:0 2px 6px rgba(0,0,0,0.25);padding:3px 0;' +
            'font:12px/1.4 inherit;min-width:180px;';
        menu.style.left = x + 'px';
        menu.style.top  = y + 'px';

        var docListener = null;

        function closeMenu() {
            if (docListener) {
                document.removeEventListener('mousedown', docListener, true);
                docListener = null;
            }
            if (menu.parentNode) menu.parentNode.removeChild(menu);
        }
        menu._close = closeMenu;

        menu._addItem = function (text, fn, danger) {
            var li = document.createElement('div');
            li.textContent = text;
            li.style.cssText = 'padding:5px 12px;cursor:pointer;' +
                (danger ? 'color:var(--wb-danger,#c62828);' : 'color:var(--wb-text,#222);');
            li.addEventListener('mouseenter', function () {
                li.style.background = 'var(--wb-selected-bg,#e3f2fd)';
                li.style.color = 'var(--wb-selected-text,#0d47a1)';
            });
            li.addEventListener('mouseleave', function () {
                li.style.background = '';
                li.style.color = danger
                    ? 'var(--wb-danger,#c62828)'
                    : 'var(--wb-text,#222)';
            });
            li.addEventListener('click', function (ev) {
                ev.stopPropagation();
                ev.preventDefault();
                /* Закрываем меню ПЕРЕД вызовом — на случай, если колбэк
                   открывает диалоги (prompt / confirm / modal). */
                closeMenu();
                try { fn(); }
                catch (err) { console.error('[PaletteEditor ctx]', err); }
            }, false);
            menu.appendChild(li);
        };

        menu._addSep = function () {
            var s = document.createElement('div');
            s.style.cssText = 'height:1px;background:var(--wb-border,#e0e0e0);margin:3px 0;';
            menu.appendChild(s);
        };

        menu._installClose = function () {
            document.body.appendChild(menu);
            setTimeout(function () {
                /* Закрываем только если клик вне меню. */
                docListener = function (ev) {
                    if (menu.contains(ev.target)) return;
                    closeMenu();
                };
                document.addEventListener('mousedown', docListener, true);
            }, 0);
        };
        return menu;
    };

    PaletteEditor.prototype._showItemCtxMenu = function (x, y, kind) {
        var self = this;
        var menu = this._buildCtxMenu(x, y);

        if (kind === 'user') {
            menu._addItem('Открыть в IDE как проект…', function () {
                if (global.palette && global.palette.userCtxOpenInProject) {
                    global.palette._ctx = {
                        type: 'item',
                        ids: Object.keys(self._selItems).filter(function (k) { return self._selItems[k]; }),
                        kind: 'user'
                    };
                    global.palette.userCtxOpenInProject();
                    setTimeout(function () { self._render(); }, 50);
                }
            });
            menu._addItem('Экспорт в ZIP…', function () {
                var ids = Object.keys(self._selItems).filter(function (k) { return self._selItems[k]; });
                var comps = [];
                for (var i = 0; i < ids.length; i++) {
                    if (ids[i].indexOf('u:') !== 0) continue;
                    var c = global.ComponentStorage.getComponent(ids[i].substring(2));
                    if (c) comps.push(c);
                }
                if (comps.length) global.ComponentExportUtils.exportComponents(comps);
            });
            menu._addSep();
        }

        menu._addItem('Вернуть в исходное место', function () {
            var ids = Object.keys(self._selItems).filter(function (k) { return self._selItems[k]; });
            for (var i = 0; i < ids.length; i++) {
                global.ComponentStorage.clearItemPlacement(ids[i]);
            }
            global.ComponentStorage.savePaletteLayout({ version: 1, initialized: false, folders: {}, items: {} });
            global.ComponentStorage.ensurePaletteInitialized(global.ComponentRegistry);
            self._render();
        });

        if (kind === 'user') {
            menu._addSep();
            menu._addItem('Удалить компонент(ы)', function () {
                var ids = Object.keys(self._selItems).filter(function (k) {
                    return self._selItems[k] && k.indexOf('u:') === 0;
                });
                if (!ids.length) return;
                if (!confirm('Удалить выбранные компоненты (' + ids.length + ')?')) return;
                for (var i = 0; i < ids.length; i++) {
                    global.ComponentStorage.deleteComponent(ids[i].substring(2));
                }
                self._selItems = {};
                self._render();
            }, true);
        }

        menu._installClose();
    };

    PaletteEditor.prototype._showFolderCtxMenu = function (x, y, folderId) {
        var self = this;
        var menu = this._buildCtxMenu(x, y);

        menu._addItem('Создать подпапку…', function () {
            var name = prompt('Имя новой подпапки:', 'Folder');
            if (!name) return;
            global.ComponentStorage.createPaletteFolder(String(name).trim(), folderId);
            self._render();
        });
        menu._addItem('Переименовать…', function () {
            var f = global.ComponentStorage.getPaletteFolder(folderId);
            if (!f) return;
            var name = prompt('Новое имя папки:', f.name);
            if (!name) return;
            global.ComponentStorage.renamePaletteFolder(folderId, String(name).trim());
            self._render();
        });
        menu._addItem('Удалить папку', function () {
            if (!confirm('Удалить папку? Содержимое перейдёт в родительскую.')) return;
            global.ComponentStorage.deletePaletteFolder(folderId);
            self._render();
        }, true);

        menu._installClose();
    };

    PaletteEditor.prototype._showRootCtxMenu = function (x, y) {
        var self = this;
        var menu = this._buildCtxMenu(x, y);

        menu._addItem('Создать папку…', function () {
            var name = prompt('Имя папки:', 'New Folder');
            if (!name) return;
            global.ComponentStorage.createPaletteFolder(String(name).trim(), '');
            self._render();
        });
        menu._addItem('Импорт из ZIP…', function () { self._importZip(); });
        menu._addItem('Импорт из проекта…', function () { self._importFromProject(); });

        menu._installClose();
    };

    /* ============================================================
       Toolbar-действия.
       ============================================================ */
    PaletteEditor.prototype._addFolder = function () {
        var name = prompt('Имя папки:', 'New Folder');
        if (!name) return;
        global.ComponentStorage.createPaletteFolder(String(name).trim(), '');
        this._render();
    };

    PaletteEditor.prototype._resetToDefault = function () {
        if (!confirm('Сбросить раскладку палитры к состоянию по умолчанию?\n\n' +
            'Все пользовательские папки будут удалены. Пользовательские компоненты останутся в корне.')) return;
        global.ComponentStorage.savePaletteLayout({
            version: 1, initialized: false, folders: {}, items: {}
        });
        global.ComponentStorage.ensurePaletteInitialized(global.ComponentRegistry);
        this._selItems = {};
        this._render();
    };

    PaletteEditor.prototype._importZip = function () {
        var self = this;
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.zip,application/zip,application/x-zip-compressed';
        inp.onchange = function () {
            var f = inp.files[0];
            if (!f) return;
            global.ComponentExportUtils.importComponents(f).then(function (n) {
                self._render();
                bus.emit('palette:refresh');
            }).catch(function (err) {
                alert('Ошибка импорта: ' + (err && err.message || err));
            });
        };
        inp.click();
    };

    PaletteEditor.prototype._importFromProject = function () {
        var self = this;
        var names = global.ProjectStorage.list();
        var list = [];
        for (var i = 0; i < names.length; i++) {
            var p = global.ProjectStorage.get(names[i]);
            if (p && p.rootType === 'component' && p.componentData) {
                list.push({ name: names[i], project: p });
            }
        }
        if (!list.length) {
            alert('Нет проектов с Root: component.');
            return;
        }

        var lines = [];
        for (var j = 0; j < list.length; j++) {
            var cd = list[j].project.componentData || {};
            lines.push((j + 1) + ') ' + list[j].name + '  (cmptype: ' + (cd.cmptype || '?') + ')');
        }
        var input = prompt('Выберите проект (номер или имя):\n\n' + lines.join('\n'));
        if (!input) return;

        var entry = null;
        var n = parseInt(input, 10);
        if (!isNaN(n) && n >= 1 && n <= list.length) entry = list[n - 1];
        else {
            for (var k = 0; k < list.length; k++) {
                if (list[k].name === input) { entry = list[k]; break; }
            }
        }
        if (!entry) { alert('Не найдено.'); return; }

        var cd2 = global.palette._componentDataFromProject(entry.project);
        if (!cd2 || !cd2.cmptype) { alert('У проекта нет данных компонента.'); return; }

        var existing = global.ComponentStorage.findByCmptype(cd2.cmptype);
        if (existing) {
            if (!confirm('Компонент cmptype="' + cd2.cmptype + '" уже есть. Перезаписать?')) return;
            global.ComponentStorage.updateComponent(existing.id, cd2);
        } else {
            global.ComponentStorage.createComponent(cd2);
        }
        self._render();
        bus.emit('palette:refresh');
    };

    /* ============================================================
       Утилиты.
       ============================================================ */
    function mkButton(text) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'wb-code-btn';
        b.textContent = text;
        return b;
    }
    function cssEscape(s) {
        return String(s).replace(/[^a-zA-Z0-9_\-:]/g, function (c) {
            return '\\' + c;
        });
    }
    function closestWithClass(el, cls, root) {
        while (el && el !== root) {
            if (el.classList && el.classList.contains(cls)) return el;
            el = el.parentNode;
        }
        return null;
    }
    function closestWithAttr(el, attr, root) {
        while (el && el !== root) {
            if (el.getAttribute && el.getAttribute(attr) != null) return el;
            el = el.parentNode;
        }
        return null;
    }

    global.PaletteEditor = new PaletteEditor();
})(window, jQuery);
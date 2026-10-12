/* Palette — палитра компонентов + пользовательская палитра пользователя.
   Загружается после panels-utils.js.

   ВАЖНО: обработчики устанавливаются через НАТИВНЫЙ addEventListener —
   MiniUI патчит jQuery.fn.on и ломает его на объектах, созданных из
   DOM-элементов (см. project-tree.js).

   Drag-and-drop пользовательских компонентов внутри дерева:
     • реализован на мышиных событиях (mousedown/mousemove/mouseup на
       document) — надёжнее HTML5 DnD, который в некоторых браузерах не
       срабатывает из-за user-select:none на .wb-tree-label;
     • цель drop — label папки, label корня User Palette, пустое место
       внутри <ul> папки/корня или другой компонент (в этом случае —
       его папка);
     • поддерживается мультивыделение: тащим всю выделенную группу. */
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
        this._userSel = {};              /* id → true для multi-select */
        this._lastUserClick = null;
        this._suppressNextClick = false;
        this._render();
        var self = this;

        /* Фильтр — .bind() не патчится MiniUI, безопасно. */
        $('#wb-palette-filter').bind('keyup input', function () {
            self._filter($(this).val());
        });

        bus.on('palette:placed',    function () { self.clearActive(); });
        bus.on('palette:cancelled', function () { self.clearActive(); });
        bus.on('component:added',   function () { self._renderUserPalette(); });
        bus.on('component:removed', function () { self._renderUserPalette(); });
        bus.on('palette:refresh',   function () { self._renderUserPalette(); });

        this._installContextMenu();
        this._installUserPaletteDnD();
    }

    /* ---------- Встроенная палитра ---------- */
    Palette.prototype._render = function () {
        var self = this;
        this.root.empty();
        var ul = $('<ul class="wb-tree wb-tree-root"></ul>');
        var tree = global.ComponentRegistry.categoryTree();

        if (this._collapseAllOnRender) {
            this._collapseAllOnRender = false;
            this._collapsed = {};
            for (var i = 0; i < tree.length; i++) {
                var node = tree[i];
                this._collapsed['cat_' + node.name] = true;
                for (var j = 0; j < node.subcategories.length; j++) {
                    this._collapsed['cat_' + node.name + '/' + node.subcategories[j].name] = true;
                }
            }
        }
        for (var k = 0; k < tree.length; k++) ul.append(self._renderTopCategory(tree[k]));
        this.root.append(ul);

        /* Пользовательская палитра */
        this._userRootUl = $('<ul class="wb-tree wb-tree-root wb-user-palette-root"></ul>');
        this.root.append(this._userRootUl);
        this._renderUserPalette();
    };

    Palette.prototype._renderTopCategory = function (node) {
        var self = this;
        var visibleDirect = node.components.filter(function (c) { return !c.hidden; });
        var visibleSubs = [];
        for (var i = 0; i < node.subcategories.length; i++) {
            var sub = node.subcategories[i];
            var vis = sub.components.filter(function (c) { return !c.hidden; });
            if (vis.length > 0) visibleSubs.push({ name: sub.name, components: vis });
        }
        var li = $('<li></li>');
        if (visibleDirect.length === 0 && visibleSubs.length === 0) return li;

        var catId = 'cat_' + node.name;
        var collapsed = !!this._collapsed[catId];
        var toggle = $('<span class="wb-toggle"></span>').text(collapsed ? '+' : '\u2212');
        li.append(toggle);
        li.append($('<span class="wb-tree-label wb-cat-label"></span>').text(node.name));
        var cul = $('<ul></ul>');
        for (var d = 0; d < visibleDirect.length; d++) cul.append(self._renderComponentLi(visibleDirect[d]));
        for (var s = 0; s < visibleSubs.length; s++) cul.append(self._renderSubCategoryLi(node.name, visibleSubs[s]));
        if (collapsed) cul.hide();
        li.append(cul);
        toggle.click(function (e) {
            e.stopPropagation();
            var now = !self._collapsed[catId];
            self._collapsed[catId] = now;
            toggle.text(now ? '+' : '\u2212');
            if (now) cul.hide(); else cul.show();
        });
        return li;
    };

    Palette.prototype._renderSubCategoryLi = function (parentName, sub) {
        var self = this;
        var li = $('<li></li>');
        var catId = 'cat_' + parentName + '/' + sub.name;
        var collapsed = !!this._collapsed[catId];
        var toggle = $('<span class="wb-toggle"></span>').text(collapsed ? '+' : '\u2212');
        li.append(toggle);
        li.append($('<span class="wb-tree-label wb-cat-label"></span>').text(sub.name));
        var cul = $('<ul></ul>');
        for (var i = 0; i < sub.components.length; i++) cul.append(self._renderComponentLi(sub.components[i]));
        if (collapsed) cul.hide();
        li.append(cul);
        toggle.click(function (e) {
            e.stopPropagation();
            var now = !self._collapsed[catId];
            self._collapsed[catId] = now;
            toggle.text(now ? '+' : '\u2212');
            if (now) cul.hide(); else cul.show();
        });
        return li;
    };

    Palette.prototype._renderComponentLi = function (c) {
        var self = this;
        var cli = $('<li></li>');
        cli.append($('<span class="wb-toggle wb-leaf"></span>'));
        var comp = $('<span></span>')
            .addClass('wb-tree-label wb-comp-label wb-palette-btn')
            .attr('data-comp-id', c.id);
        if (c.iconUrl) {
            var $img = $('<img/>').addClass('wb-palette-icon').attr('alt','').attr('src', c.iconUrl)
                .bind('error', function () { $(this).remove(); });
            comp.append($img);
        }
        comp.append(document.createTextNode(c.caption));
        comp.click(function () { self._select(c, comp); });
        cli.append(comp);
        return cli;
    };

    Palette.prototype._select = function (comp, btn) {
        this.clearActive();
        btn.addClass('wb-active');
        this.active = comp;
        $('#wb-domtree').addClass('wb-drop-mode');
        bus.emit('palette:selected', { component: comp });
    };

    Palette.prototype.clearActive = function () {
        this.root.find('.wb-palette-btn').removeClass('wb-active');
        this.active = null;
        $('#wb-domtree').removeClass('wb-drop-mode');
    };

    /* ---------- Пользовательская палитра ---------- */
    Palette.prototype._renderUserPalette = function () {
        if (!this._userRootUl) return;
        this._userRootUl.empty();
        var self = this;
        var model = global.ComponentStorage.read();

        /* Заголовок-корень. */
        var rootLi = $('<li></li>');
        var rootToggle = $('<span class="wb-toggle"></span>').text('\u2212');
        rootLi.append(rootToggle);
        var rootLabel = $('<span class="wb-tree-label wb-cat-label"></span>')
            .text('User Palette')
            .attr('data-user-root', '1');
        rootLi.append(rootLabel);

        var childrenUl = $('<ul></ul>');
        rootLi.append(childrenUl);
        this._userRootUl.append(rootLi);

        rootToggle.click(function (e) {
            e.stopPropagation();
            var isHidden = childrenUl.is(':hidden');
            childrenUl.toggle();
            rootToggle.text(isHidden ? '\u2212' : '+');
        });

        /* Строим дерево папок и компонентов. */
        var folders = {};
        for (var fk in model.folders) if (model.folders.hasOwnProperty(fk)) {
            folders[fk] = $.extend({}, model.folders[fk], { children: [], comps: [] });
        }
        var rootFolders = [], rootComps = [];
        for (var ck in model.components) if (model.components.hasOwnProperty(ck)) {
            var c = model.components[ck];
            if (c.folderId && folders[c.folderId]) folders[c.folderId].comps.push(c);
            else rootComps.push(c);
        }
        for (var fk2 in folders) {
            var f = folders[fk2];
            if (f.parentId && folders[f.parentId]) folders[f.parentId].children.push(f);
            else rootFolders.push(f);
        }
        rootFolders.sort(function (a,b){ return a.name < b.name ? -1 : 1; });
        rootComps.sort(function (a,b){ return a.name < b.name ? -1 : 1; });

        function renderFolder(f, parentUl) {
            var li = $('<li></li>');
            var tog = $('<span class="wb-toggle"></span>').text('\u2212');
            li.append(tog);
            var lbl = $('<span class="wb-tree-label wb-ptree-folder"></span>')
                .text(f.name)
                .attr('data-folder-id', f.id)
                .attr('draggable', 'false');
            li.append(lbl);
            var ul = $('<ul></ul>');
            li.append(ul);
            for (var i=0;i<f.children.length;i++) renderFolder(f.children[i], ul);
            for (var j=0;j<f.comps.length;j++) ul.append(renderComp(f.comps[j]));
            tog.click(function (e) {
                e.stopPropagation();
                ul.toggle();
                tog.text(ul.is(':hidden') ? '+' : '\u2212');
            });
            parentUl.append(li);
        }

        function renderComp(c) {
            var li = $('<li></li>');
            li.append($('<span class="wb-toggle wb-leaf"></span>'));
            var comp = $('<span></span>')
                .addClass('wb-tree-label wb-comp-label wb-user-comp')
                .attr('data-user-comp-id', c.id)
                .attr('draggable', 'false');   /* HTML5 DnD отключён — используем mouse-based */
            if (c.icon) {
                var src = c.icon;
                if (global.ProjectResolver && global.ProjectResolver.isProjectPath && global.ProjectResolver.isProjectPath(src)) {
                    try { src = global.ProjectResolver.resolve(src); } catch(e){}
                }
                comp.append($('<img/>').addClass('wb-palette-icon').attr('alt','')
                    .attr('draggable', 'false')
                    .attr('src', src)
                    .bind('error', function () { $(this).remove(); }));
            }
            comp.append(document.createTextNode(c.name || c.id));
            comp.click(function (e) {
                e.stopPropagation();
                self._selectUserComponent(c, e.ctrlKey || e.metaKey);
            });
            comp.dblclick(function (e) {
                e.stopPropagation();
                bus.emit('component:edit-request', { component: c });
            });
            li.append(comp);
            return li;
        }

        for (var i=0;i<rootFolders.length;i++) renderFolder(rootFolders[i], childrenUl);
        for (var j=0;j<rootComps.length;j++) childrenUl.append(renderComp(rootComps[j]));

        if (!rootFolders.length && !rootComps.length) {
            childrenUl.append($('<li><span class="wb-tree-label" style="color:#999;font-style:italic;">(пусто — ПКМ для создания)</span></li>'));
        }

        this._syncUserSelectionUI();
    };

    Palette.prototype._buildUserDef = function (c) {
        return global.ComponentStorage.toDef(c);
    };

    Palette.prototype._selectUserComponent = function (c, additive) {
        if (!additive) this._userSel = {};
        this._userSel[c.id] = true;
        this._lastUserClick = c.id;
        this._syncUserSelectionUI();

        var def = this._buildUserDef(c);
        this.clearActive();
        this.root.find('.wb-user-comp[data-user-comp-id="' + c.id + '"]').addClass('wb-active');
        this.active = def;
        $('#wb-domtree').addClass('wb-drop-mode');
        bus.emit('palette:selected', { component: def });
    };

    Palette.prototype._syncUserSelectionUI = function () {
        var self = this;
        this.root.find('.wb-user-comp').each(function () {
            var id = $(this).attr('data-user-comp-id');
            $(this).toggleClass('wb-selected', !!self._userSel[id]);
        });
    };

    Palette.prototype.getUserSelection = function () {
        var ids = [], out = [];
        for (var k in this._userSel) if (this._userSel[k]) ids.push(k);
        for (var i = 0; i < ids.length; i++) {
            var c = global.ComponentStorage.getComponent(ids[i]);
            if (c) out.push(c);
        }
        return out;
    };

    /* ------------------------------------------------------------------
       Определение цели drop по DOM-элементу под курсором.

       Возвращает { folderId, label } либо null, если drop недопустим.
         • folderId — id папки ('' = корень User Palette);
         • label    — DOM-элемент, которому навесим подсветку
                      (label папки/корня). Может быть null.
       ------------------------------------------------------------------ */
    Palette.prototype._resolveUserPaletteDropTarget = function (el, rootNode) {
        if (!el || !rootNode) return null;

        /* 1. Если под курсором — label (или его потомок). */
        var node = el;
        while (node && node !== rootNode) {
            if (node.classList && node.classList.contains('wb-tree-label')) {
                if (node.classList.contains('wb-ptree-folder')) {
                    return { folderId: node.getAttribute('data-folder-id') || '', label: node };
                }
                if (node.getAttribute('data-user-root') === '1') {
                    return { folderId: '', label: node };
                }
                if (node.classList.contains('wb-user-comp')) {
                    /* Дроп на другой компонент — целимся в его папку. */
                    var li = node.parentNode;
                    var ul = li ? li.parentNode : null;
                    return this._folderIdFromUl(ul, rootNode);
                }
                return null;
            }
            node = node.parentNode;
        }

        /* 2. Если под курсором пустое место — ищем ближайший UL. */
        node = el;
        while (node && node !== rootNode) {
            if (node.tagName === 'UL') {
                return this._folderIdFromUl(node, rootNode);
            }
            node = node.parentNode;
        }
        return null;
    };

    /* По <ul> определяет, какой папке он принадлежит. */
    Palette.prototype._folderIdFromUl = function (ul, rootNode) {
        if (!ul) return null;
        if (ul.classList && ul.classList.contains('wb-user-palette-root')) {
            return { folderId: '', label: null };
        }
        var li = ul.parentNode;
        if (li && li.tagName === 'LI') {
            for (var i = 0; i < li.children.length; i++) {
                var c = li.children[i];
                if (!c.classList || !c.classList.contains('wb-tree-label')) continue;
                if (c.classList.contains('wb-ptree-folder')) {
                    return { folderId: c.getAttribute('data-folder-id') || '', label: c };
                }
                if (c.getAttribute('data-user-root') === '1') {
                    return { folderId: '', label: c };
                }
            }
        }
        return null;
    };

    /* ------------------------------------------------------------------
       Mouse-based drag-and-drop.

       Используем mousedown/mousemove/mouseup на document вместо HTML5
       DnD: атрибут draggable и dragstart в некоторых сборках Chrome
       не срабатывают на <span> с user-select:none. Mouse-based работает
       независимо от этих факторов.
       ------------------------------------------------------------------ */
    Palette.prototype._installUserPaletteDnD = function () {
        var self = this;
        var rootNode = this.rootNode;
        if (!rootNode) return;

        var pendingDrag = null;    /* { id, ids, startX, startY } */
        var activeDrag  = null;    /* { ids, ghost, sourceEls, dropTarget } */

        function getCompIdsFromSelection(id) {
            if (self._userSel[id]) {
                var ids = [];
                for (var k in self._userSel) if (self._userSel[k]) ids.push(k);
                if (ids.length) return ids;
            }
            return [id];
        }

        function findCompEl(target) {
            var t = target;
            while (t && t !== rootNode) {
                if (t.classList && t.classList.contains('wb-user-comp')) return t;
                t = t.parentNode;
            }
            return null;
        }

        function startDrag(ev) {
            if (activeDrag || !pendingDrag) return;

            var ids = pendingDrag.ids;
            pendingDrag = null;

            /* Ghost — полупрозрачная плашка, следующая за курсором. */
            var ghost = document.createElement('div');
            var text;
            if (ids.length === 1) {
                var c = global.ComponentStorage.getComponent(ids[0]);
                text = c ? (c.name || c.id) : ids[0];
            } else {
                text = ids.length + ' компонентов';
            }
            ghost.textContent = text;
            ghost.style.cssText =
                'position:fixed;pointer-events:none;z-index:100000;' +
                'padding:3px 8px;border:1px solid #1e88e5;border-radius:3px;' +
                'background:#e3f2fd;color:#0d47a1;' +
                'font-family:Segoe UI,Tahoma,sans-serif;font-size:11px;' +
                'box-shadow:0 2px 6px rgba(0,0,0,0.25);opacity:0.92;' +
                'white-space:nowrap;';
            ghost.style.left = (ev.clientX + 10) + 'px';
            ghost.style.top  = (ev.clientY + 10) + 'px';
            document.body.appendChild(ghost);

            /* Подсветка источников. */
            var sourceEls = [];
            var all = rootNode.querySelectorAll('.wb-user-comp');
            for (var i = 0; i < all.length; i++) {
                var eid = all[i].getAttribute('data-user-comp-id');
                if (ids.indexOf(eid) >= 0) {
                    all[i].classList.add('wb-dragging');
                    sourceEls.push(all[i]);
                }
            }

            activeDrag = {
                ids: ids,
                ghost: ghost,
                sourceEls: sourceEls,
                dropTarget: null
            };

            document.body.style.cursor = 'move';
            try { document.body.style.userSelect = 'none'; } catch (ex) {}
            try { document.body.style.webkitUserSelect = 'none'; } catch (ex) {}
        }

        function updateDropTarget(x, y) {
            if (!activeDrag) return;

            /* Прячем ghost, чтобы elementFromPoint вернул то, что под ним. */
            var ghost = activeDrag.ghost;
            var oldDisplay = '';
            if (ghost) { oldDisplay = ghost.style.display; ghost.style.display = 'none'; }

            var el = null;
            try { el = document.elementFromPoint(x, y); } catch (ex) { el = null; }

            if (ghost) ghost.style.display = oldDisplay;

            self._clearDropIndicators();

            if (!el || !rootNode.contains(el)) {
                activeDrag.dropTarget = null;
                return;
            }

            var tgt = self._resolveUserPaletteDropTarget(el, rootNode);
            if (tgt && tgt.label) tgt.label.classList.add('wb-drop-inside');
            activeDrag.dropTarget = tgt || null;
        }

        function endDrag(commit) {
            if (!activeDrag) return;

            if (commit && activeDrag.dropTarget) {
                var moved = false;
                for (var i = 0; i < activeDrag.ids.length; i++) {
                    if (self._moveUserCompToFolder(activeDrag.ids[i], activeDrag.dropTarget.folderId)) {
                        moved = true;
                    }
                }
                if (moved) self._renderUserPalette();
            }

            /* Cleanup. */
            if (activeDrag.ghost && activeDrag.ghost.parentNode) {
                activeDrag.ghost.parentNode.removeChild(activeDrag.ghost);
            }
            for (var j = 0; j < activeDrag.sourceEls.length; j++) {
                activeDrag.sourceEls[j].classList.remove('wb-dragging');
            }
            self._clearDropIndicators();

            document.body.style.cursor = '';
            try { document.body.style.userSelect = ''; } catch (ex) {}
            try { document.body.style.webkitUserSelect = ''; } catch (ex) {}

            /* Подавляем следующий click, чтобы drag не превратился в выделение. */
            self._suppressNextClick = true;

            activeDrag = null;
        }

        rootNode.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;   /* только левая кнопка */
            var compEl = findCompEl(e.target);
            if (!compEl) return;

            var id = compEl.getAttribute('data-user-comp-id');
            if (!id) return;

            self._suppressNextClick = false;   /* сбрасываем на новом mousedown */

            pendingDrag = {
                id: id,
                ids: getCompIdsFromSelection(id),
                startX: e.clientX,
                startY: e.clientY
            };
        }, false);

        function onMouseMove(e) {
            if (activeDrag) {
                activeDrag.ghost.style.left = (e.clientX + 10) + 'px';
                activeDrag.ghost.style.top  = (e.clientY + 10) + 'px';
                updateDropTarget(e.clientX, e.clientY);
                return;
            }
            if (!pendingDrag) return;

            var dx = e.clientX - pendingDrag.startX;
            var dy = e.clientY - pendingDrag.startY;
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

            startDrag(e);
            /* Сразу обновим ghost и цель под текущей позицией. */
            if (activeDrag) {
                activeDrag.ghost.style.left = (e.clientX + 10) + 'px';
                activeDrag.ghost.style.top  = (e.clientY + 10) + 'px';
                updateDropTarget(e.clientX, e.clientY);
            }
        }

        function onMouseUp(e) {
            if (activeDrag) {
                updateDropTarget(e.clientX, e.clientY);
                endDrag(true);
            }
            pendingDrag = null;
        }

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);

        /* Подавление click после успешного drag: capture-фаза, чтобы
           заблокировать bubble-обработчик .click() на самом label. */
        rootNode.addEventListener('click', function (e) {
            if (self._suppressNextClick) {
                e.preventDefault();
                e.stopPropagation();
                self._suppressNextClick = false;
            }
        }, true);
    };

    Palette.prototype._clearDropIndicators = function () {
        if (!this.rootNode) return;
        var els = this.rootNode.querySelectorAll('.wb-drop-inside, .wb-drop-forbidden');
        for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('wb-drop-inside', 'wb-drop-forbidden');
        }
    };

    /* Переносит один компонент в папку.
       Возвращает true, если состояние изменилось. */
    Palette.prototype._moveUserCompToFolder = function (compId, folderId) {
        if (!compId) return false;
        var c = global.ComponentStorage.getComponent(compId);
        if (!c) return false;

        var curFolder = c.folderId || '';
        var newFolder = folderId || '';
        if (curFolder === newFolder) return false;

        if (newFolder && !global.ComponentStorage.getFolder(newFolder)) return false;

        global.ComponentStorage.updateComponent(compId, { folderId: newFolder });
        return true;
    };

    /* ---------- Контекстное меню ---------- */
    Palette.prototype._installContextMenu = function () {
        var self = this;
        var rootNode = this.rootNode;
        if (!rootNode) return;

        rootNode.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var tgt = $(e.target);
            var ctx = { x: e.clientX, y: e.clientY };

            var userCompEl = tgt.closest('.wb-user-comp');
            if (userCompEl.length) {
                var id = userCompEl.attr('data-user-comp-id');
                if (!self._userSel[id]) {
                    self._userSel = {};
                    self._userSel[id] = true;
                    self._syncUserSelectionUI();
                }
                ctx.type = 'user-components';
                ctx.ids = Object.keys(self._userSel).filter(function (k) {
                    return self._userSel[k];
                });
            } else {
                var folderEl = tgt.closest('[data-folder-id]');
                if (folderEl.length) {
                    ctx.type = 'user-folder';
                    ctx.folderId = folderEl.attr('data-folder-id');
                } else {
                    ctx.type = 'user-root';
                }
            }
            self._ctx = ctx;
            bus.emit('palette:contextmenu', ctx);
        }, false);
    };

    Palette.prototype.showContextMenu = function (ctx) {
        var menuId = (ctx.type === 'user-components') ? 'wb-usercompmenu'
            : (ctx.type === 'user-folder')     ? 'wb-userfoldermenu'
                : 'wb-userpalettemenu';
        var menu = global.mini.get(menuId);
        if (menu) menu.showAtPos(ctx.x, ctx.y);
    };

    /* ---------- Действия контекстного меню ---------- */
    Palette.prototype.userCtxNewFolder = function () {
        var name = prompt('Имя каталога:', 'New Folder');
        if (!name) return;
        var parentId = (this._ctx && this._ctx.type === 'user-folder') ? this._ctx.folderId : '';
        global.ComponentStorage.createFolder(String(name).trim(), parentId);
        this._renderUserPalette();
    };
    Palette.prototype.userCtxRenameFolder = function () {
        if (!this._ctx || this._ctx.type !== 'user-folder') return;
        var f = global.ComponentStorage.getFolder(this._ctx.folderId);
        if (!f) return;
        var name = prompt('Новое имя каталога:', f.name);
        if (!name) return;
        global.ComponentStorage.renameFolder(f.id, String(name).trim());
        this._renderUserPalette();
    };
    Palette.prototype.userCtxDeleteFolder = function () {
        if (!this._ctx || this._ctx.type !== 'user-folder') return;
        if (!confirm('Удалить каталог? Компоненты и вложенные каталоги переместятся в корень.')) return;
        global.ComponentStorage.deleteFolder(this._ctx.folderId);
        this._renderUserPalette();
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
                self._renderUserPalette();
            }).catch(function (err) {
                alert('Ошибка импорта: ' + (err && err.message || err));
            });
        };
        inp.click();
    };
    Palette.prototype.userCtxExportSelected = function () {
        var sel = this.getUserSelection();
        if (!sel.length) { alert('Ничего не выбрано.'); return; }
        global.ComponentExportUtils.exportComponents(sel);
    };
    Palette.prototype.userCtxDeleteComponents = function () {
        var sel = this.getUserSelection();
        if (!sel.length) { alert('Ничего не выбрано.'); return; }
        if (!confirm('Удалить выбранные компоненты (' + sel.length + ')?')) return;
        for (var i = 0; i < sel.length; i++) global.ComponentStorage.deleteComponent(sel[i].id);
        this._userSel = {};
        this._syncUserSelectionUI();
        this._renderUserPalette();
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
        if (!list.length) {
            alert('Нет проектов-компонентов (Root: component).\n\n' +
                'Создайте проект с режимом Root: component или перенесите ' +
                'компонент из палитры: ПКМ по компоненту → Open in IDE as Project…');
            return;
        }

        var host = document.createElement('div');
        host.style.cssText = 'padding:10px;font-family:inherit;font-size:12px;';

        var lbl = document.createElement('div');
        lbl.textContent = 'Выберите проект-компонент:';
        lbl.style.marginBottom = '6px';
        host.appendChild(lbl);

        var sel = document.createElement('select');
        sel.style.cssText = 'width:100%;padding:4px 6px;font-size:12px;box-sizing:border-box;';
        for (var k = 0; k < list.length; k++) {
            var entry = list[k];
            var cd = entry.project.componentData || {};
            var opt = document.createElement('option');
            opt.value = entry.name;
            opt.textContent = entry.name +
                '  (cmptype: ' + (cd.cmptype || '?') + ')';
            sel.appendChild(opt);
        }
        host.appendChild(sel);

        var hint = document.createElement('div');
        hint.style.cssText = 'margin-top:8px;color:#666;font-size:11px;';
        hint.textContent = 'Компонент будет перенесён из проекта в палитру. ' +
            'Если компонент с таким cmptype уже есть — предложат перезаписать.';
        host.appendChild(hint);

        global.Modal.open({
            title: 'Import Component from Project',
            content: host,
            onOk: function () {
                var selectedName = sel.value;
                var entry = null;
                for (var i = 0; i < list.length; i++) {
                    if (list[i].name === selectedName) { entry = list[i]; break; }
                }
                if (!entry) return;

                var cd = self._componentDataFromProject(entry.project);
                if (!cd || !cd.cmptype) {
                    alert('У выбранного проекта нет данных компонента (cmptype).');
                    return;
                }

                var existing = global.ComponentStorage.findByCmptype(cd.cmptype);
                if (existing) {
                    var ok = confirm(
                        'Компонент с cmptype="' + cd.cmptype + '" уже есть в палитре (' +
                        existing.name + ').\n\nПерезаписать его?');
                    if (!ok) return;
                    global.ComponentStorage.updateComponent(existing.id, cd);
                    self._renderUserPalette();
                    bus.emit('palette:refresh');
                    return;
                }

                global.ComponentStorage.createComponent(cd);
                self._renderUserPalette();
                bus.emit('palette:refresh');
            }
        });
    };

    Palette.prototype._componentDataFromProject = function (project) {
        if (!project || !project.componentData) return null;

        var cd;
        try { cd = JSON.parse(JSON.stringify(project.componentData)); }
        catch (e) { cd = project.componentData; }

        if (!cd.previewIdeHtml && cd.html) cd.previewIdeHtml = cd.html;
        if (!cd.html && cd.previewIdeHtml) cd.html = cd.previewIdeHtml;

        var ct = cd.cmptype;
        if (!ct) return cd;

        var safeCt = String(ct).replace(/[^A-Za-z0-9_.-]/g, '_');
        var files = project.files || {};

        var jsPath = 'lib/wb-component/' + safeCt + '.js';
        var jsFile = files[jsPath];
        if (jsFile && jsFile.content) {
            cd.js = this._extractUserJs(jsFile.content);
        }

        var cssPath = 'lib/wb-component/' + safeCt + '.css';
        var cssFile = files[cssPath];
        if (cssFile && cssFile.content) {
            cd.css = this._extractUserCss(cssFile.content);
        }

        return cd;
    };

    Palette.prototype._extractUserJs = function (fullJs) {
        if (!fullJs) return '';
        var marker = '/* --- user code --- */';
        var idx = fullJs.indexOf(marker);
        if (idx < 0) return '';
        var user = fullJs.substring(idx + marker.length);
        return user.replace(/^\r?\n/, '');
    };

    Palette.prototype._extractUserCss = function (fullCss) {
        if (!fullCss) return '';
        var marker = '/* --- user css --- */';
        var idx = fullCss.indexOf(marker);
        if (idx < 0) return '';
        var user = fullCss.substring(idx + marker.length);
        return user.replace(/^\r?\n/, '');
    };

    Palette.prototype.userCtxOpenInProject = function () {
        var sel = this.getUserSelection();
        if (!sel.length) { alert('Ничего не выбрано.'); return; }
        if (sel.length > 1) { alert('Выберите один компонент.'); return; }

        var comp = sel[0];
        var defaultName = 'Component_' + (comp.name || comp.cmptype || 'edit');
        var projName = prompt('Имя проекта для редактирования:', defaultName);
        if (!projName) return;
        projName = String(projName).trim();
        if (!projName) return;

        var pm = global.ProjectManagerInstance;
        if (!pm) { alert('ProjectManager не подключён.'); return; }

        var canvas = global.IDE && global.IDE._canvas;
        if (pm.editing && canvas) {
            if (!pm._confirmSwitchFrom(canvas)) return;
        }

        var proj = global.ProjectStorage.get(projName);
        if (proj) {
            var rt = proj.rootType;
            var ok = confirm(
                'Проект "' + projName + '" уже существует (rootType: ' + rt + ').\n\n' +
                'Перезаписать его данными выбранного компонента?');
            if (!ok) return;
        } else {
            proj = global.ProjectStorage.create(projName);
            if (!proj) { alert('Не удалось создать проект.'); return; }
        }

        proj.rootType = 'component';
        proj.mainFile = 'index.html';
        proj.files = proj.files || {};

        proj.componentData = {
            id: comp.id,
            name: comp.name || '',
            cmptype: comp.cmptype || '',
            tagName: comp.tagName || 'div',
            icon: comp.icon || '',
            description: comp.description || '',
            previewIdeHtml: comp.previewIdeHtml || comp.html || '',
            html: comp.previewIdeHtml || comp.html || '',
            customProperties: comp.customProperties || [],
            customEvents: comp.customEvents || [],
            nestingMode: comp.nestingMode || 'all',
            nestingRules: comp.nestingRules || [],
            jsLibs: comp.jsLibs || [],
            cssLibs: comp.cssLibs || []
        };

        var compHtml = comp.previewIdeHtml || comp.html || '';
        proj.files['index.html'] = {
            kind: 'text',
            content: '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>' +
                escapeHtml(projName) + '</title>\n</head>\n<body>\n' +
                compHtml + '\n</body>\n</html>'
        };

        if (comp.cmptype && global.ComponentStorage) {
            var safeCt = String(comp.cmptype).replace(/[^A-Za-z0-9_.-]/g, '_');
            var libDir = global.ComponentStorage.LIB_DIR;

            var keys = Object.keys(proj.files);
            for (var i = 0; i < keys.length; i++) {
                if (keys[i].indexOf(libDir) === 0) delete proj.files[keys[i]];
            }

            proj.files[libDir + 'core.js'] = {
                kind: 'text',
                _system: 'wb-lib',
                content: global.ComponentStorage.CORE_SOURCE
            };
            proj.files[libDir + safeCt + '.js'] = {
                kind: 'text',
                _system: 'wb-lib',
                content: global.ComponentStorage._buildCmptypeJs(comp)
            };
            proj.files[libDir + safeCt + '.css'] = {
                kind: 'text',
                _system: 'wb-lib',
                content: global.ComponentStorage._buildCmptypeCss(comp)
            };
        }

        global.ProjectStorage.save(proj);

        pm.refreshCombo();
        pm.load(projName);
    };

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ---------- Фильтр ---------- */
    Palette.prototype._filter = function (txt) {
        txt = (txt || '').toLowerCase();
        var $root = this.root;
        if (!txt) {
            $root.find('ul, li').show();
            $root.find('li').each(function () {
                var $t = $(this).children('.wb-toggle').first();
                if (!$t.length || $t.hasClass('wb-leaf')) return;
                var $ul = $(this).children('ul').first();
                if ($ul.length) $ul.show();
                $t.text('\u2212');
            });
            return;
        }
        $root.find('li').hide();
        $root.find('ul').hide();
        $root.find('.wb-comp-label').each(function () {
            var $lab = $(this);
            if ($lab.text().toLowerCase().indexOf(txt) < 0) return;
            $lab.show();
            var $li = $lab.closest('li');
            $li.show();
            $li.parents('li').show();
            $li.parents('ul').show();
        });
        $root.find('.wb-cat-label').each(function () {
            var $lab = $(this);
            if ($lab.text().toLowerCase().indexOf(txt) < 0) return;
            var $li = $lab.closest('li');
            $li.show();
            $li.find('ul, li, .wb-comp-label').show();
            $li.parents('li').show();
            $li.parents('ul').show();
        });
    };

    global.Palette = Palette;
})(window, jQuery);
/* Palette v5 — палитра компонентов + пользовательская палитра пользователя.

   Загружается после panels-utils.js.

   ВАЖНО:
     1. Все обработчики устанавливаются через НАТИВНЫЙ addEventListener —
        MiniUI патчит jQuery.fn.on и ломает его на объектах, созданных
        из DOM-элементов (см. project-tree.js).
     2. draggable ставится двумя способами (property + attribute),
        плюс MutationObserver следит, чтобы атрибут не был сброшен
        сторонним кодом. Без draggable="true" HTML5 dragstart не
        запускается, и перенос компонентов по дереву не работает.

   Drag-and-drop пользовательских компонентов внутри дерева:
     • источник — .wb-user-comp с draggable="true";
     • цель     — label папки (.wb-ptree-folder),
                  label корня ([data-user-root="1"]),
                  label другого компонента (его папка),
                  пустое место внутри <ul> папки/корня;
     • мультивыделение — тащим всю выделенную группу;
     • после drop вызывается ComponentStorage.updateComponent(), который
       пишет модель палитры в localStorage['wb.userPalette'].

   Двойной клик по компоненту ничего не делает. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    var VERSION = 'v5';

    function Palette(rootEl) {
        if (global.console && console.log) {
            console.log('[Palette] version ' + VERSION + ' initializing');
        }

        this.root = $(rootEl);
        this.rootNode = (typeof rootEl === 'string')
            ? document.getElementById(rootEl)
            : rootEl;
        this.active = null;
        this._collapsed = {};
        this._collapseAllOnRender = true;
        this._userSel = {};              /* id → true для multi-select */
        this._lastUserClick = null;
        this._dragUserCompIds = null;    /* массив id в момент drag */
        this._isDragging = false;
        this._draggableObserver = null;

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
        this._installDraggableObserver();
    }

    /* ============================================================
       Хелпер: draggable — держим включённым на .wb-user-comp.

       Выставляем двумя способами сразу: через property (самый надёжный)
       и через attribute (для соответствия DOM и отладки).
       ============================================================ */
    Palette.prototype._forceDraggable = function (el) {
        if (!el || el.nodeType !== 1) return;
        if (!el.classList || !el.classList.contains('wb-user-comp')) return;

        try {
            if (el.draggable !== true) el.draggable = true;
        } catch (e) { /* ignore */ }
        if (el.getAttribute('draggable') !== 'true') {
            el.setAttribute('draggable', 'true');
        }
    };

    Palette.prototype._forceDraggableAll = function () {
        if (!this.rootNode) return;
        var comps = this.rootNode.querySelectorAll('.wb-user-comp');
        for (var i = 0; i < comps.length; i++) this._forceDraggable(comps[i]);
    };

    /* Наблюдатель за атрибутом draggable: если сторонний код (MiniUI,
       jQuery, обработчики фреймворка) сбросит его в false — вернём true.

       Также выставляет draggable у только что добавленных .wb-user-comp
       (например, после перерисовки палитры). */
    Palette.prototype._installDraggableObserver = function () {
        if (!this.rootNode || !global.MutationObserver) return;
        var self = this;

        this._draggableObserver = new global.MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var m = muts[i];

                /* Изменение атрибутов. */
                if (m.type === 'attributes' && m.attributeName === 'draggable') {
                    var tgt = m.target;
                    if (tgt && tgt.classList && tgt.classList.contains('wb-user-comp')) {
                        if (tgt.getAttribute('draggable') !== 'true') {
                            self._forceDraggable(tgt);
                        }
                    }
                    continue;
                }

                /* Появление новых .wb-user-comp. */
                if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        var node = m.addedNodes[j];
                        if (node.nodeType !== 1) continue;
                        if (node.classList && node.classList.contains('wb-user-comp')) {
                            self._forceDraggable(node);
                        }
                        var kids = node.querySelectorAll
                            ? node.querySelectorAll('.wb-user-comp')
                            : [];
                        for (var k = 0; k < kids.length; k++) self._forceDraggable(kids[k]);
                    }
                }
            }
        });

        this._draggableObserver.observe(this.rootNode, {
            attributes: true,
            attributeFilter: ['draggable'],
            childList: true,
            subtree: true
        });
    };

    /* ============================================================
       Встроенная палитра (D3/M2/HTML)
       ============================================================ */
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

    /* ============================================================
       Пользовательская палитра
       ============================================================ */
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
            var li = document.createElement('li');
            var tog = document.createElement('span');
            tog.className = 'wb-toggle';
            tog.textContent = '\u2212';
            li.appendChild(tog);

            var lbl = document.createElement('span');
            lbl.className = 'wb-tree-label wb-ptree-folder';
            lbl.textContent = f.name;
            lbl.setAttribute('data-folder-id', f.id);
            lbl.setAttribute('draggable', 'false');
            li.appendChild(lbl);

            var ul = document.createElement('ul');
            li.appendChild(ul);
            for (var i=0;i<f.children.length;i++) renderFolder(f.children[i], ul);
            for (var j=0;j<f.comps.length;j++) ul.appendChild(renderComp(f.comps[j]));

            tog.addEventListener('click', function (e) {
                e.stopPropagation();
                if (ul.style.display === 'none') {
                    ul.style.display = '';
                    tog.textContent = '\u2212';
                } else {
                    ul.style.display = 'none';
                    tog.textContent = '+';
                }
            }, false);

            parentUl.appendChild(li);
        }

        function renderComp(c) {
            var li = document.createElement('li');
            var tog = document.createElement('span');
            tog.className = 'wb-toggle wb-leaf';
            li.appendChild(tog);

            var comp = document.createElement('span');
            comp.className = 'wb-tree-label wb-comp-label wb-user-comp';
            comp.setAttribute('data-user-comp-id', c.id);

            /* Ключевая строка: draggable двумя способами. */
            comp.draggable = true;
            comp.setAttribute('draggable', 'true');

            if (c.icon) {
                var src = c.icon;
                if (global.ProjectResolver && global.ProjectResolver.isProjectPath && global.ProjectResolver.isProjectPath(src)) {
                    try { src = global.ProjectResolver.resolve(src); } catch(e){}
                }
                var img = document.createElement('img');
                img.className = 'wb-palette-icon';
                img.alt = '';
                img.draggable = false;
                img.setAttribute('draggable', 'false');
                img.src = src;
                img.onerror = function () { if (this.parentNode) this.parentNode.removeChild(this); };
                comp.appendChild(img);
            }
            comp.appendChild(document.createTextNode(c.name || c.id));

            comp.addEventListener('click', function (e) {
                e.stopPropagation();
                self._selectUserComponent(c, e.ctrlKey || e.metaKey);
            }, false);

            /* Двойной клик — ничего не делаем (специально отключено). */

            li.appendChild(comp);
            return li;
        }

        for (var i=0;i<rootFolders.length;i++) renderFolder(rootFolders[i], childrenUl[0]);
        for (var j=0;j<rootComps.length;j++) childrenUl[0].appendChild(renderComp(rootComps[j]));

        if (!rootFolders.length && !rootComps.length) {
            var emptyLi = document.createElement('li');
            var emptyLbl = document.createElement('span');
            emptyLbl.className = 'wb-tree-label';
            emptyLbl.style.color = '#999';
            emptyLbl.style.fontStyle = 'italic';
            emptyLbl.textContent = '(пусто — ПКМ для создания)';
            emptyLi.appendChild(emptyLbl);
            childrenUl[0].appendChild(emptyLi);
        }

        this._syncUserSelectionUI();
        this._forceDraggableAll();
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
            /* На случай, если jQuery .addClass сбросил draggable. */
            self._forceDraggable(this);
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

    /* ============================================================
       Определение цели drop.
       ============================================================ */
    Palette.prototype._resolveDropTarget = function (el, rootNode) {
        if (!el || !rootNode) return null;

        /* 1. Под курсором label (или его потомок). */
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
                    /* Дроп на другой компонент → в его папку. */
                    var li = node.parentNode;
                    var ul = li ? li.parentNode : null;
                    return this._folderIdFromUl(ul, rootNode);
                }
                return null;
            }
            node = node.parentNode;
        }

        /* 2. Пустое место — ищем ближайший UL. */
        node = el;
        while (node && node !== rootNode) {
            if (node.tagName === 'UL') {
                return this._folderIdFromUl(node, rootNode);
            }
            node = node.parentNode;
        }
        return null;
    };

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

    /* ============================================================
       HTML5 drag-and-drop (паттерн project-tree.js)
       ============================================================ */
    Palette.prototype._installUserPaletteDnD = function () {
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

        function findCompLabel(compId) {
            var all = rootNode.querySelectorAll('.wb-user-comp');
            for (var i = 0; i < all.length; i++) {
                if (all[i].getAttribute('data-user-comp-id') === compId) return all[i];
            }
            return null;
        }

        rootNode.addEventListener('dragstart', function (e) {
            var lbl = findLabel(e.target);
            if (!lbl || !lbl.classList.contains('wb-user-comp')) return;

            var id = lbl.getAttribute('data-user-comp-id');
            if (!id) return;

            if (!self._userSel[id]) {
                self._userSel = {};
                self._userSel[id] = true;
                self._syncUserSelectionUI();
            }
            var ids = [];
            for (var k in self._userSel) if (self._userSel[k]) ids.push(k);
            if (!ids.length) ids = [id];
            self._dragUserCompIds = ids;
            self._isDragging = true;

            for (var i = 0; i < ids.length; i++) {
                var el = findCompLabel(ids[i]);
                if (el) el.classList.add('wb-dragging');
            }

            try {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', ids.join('\n'));
                e.dataTransfer.setData('application/x-wb-user-comp', ids[0]);
                /* Некоторые браузеры требуют непустой dataTransfer для drag. */
                if (e.dataTransfer.setDragImage && lbl) {
                    try { e.dataTransfer.setDragImage(lbl, 0, 0); } catch (ex) {}
                }
            } catch (ex) { /* ignore */ }
        }, false);

        rootNode.addEventListener('dragend', function () {
            self._endDrag();
        }, false);

        rootNode.addEventListener('dragover', function (e) {
            if (!self._isDragging || !self._dragUserCompIds || !self._dragUserCompIds.length) return;

            var target = self._resolveDropTarget(e.target, rootNode);

            self._clearDropIndicators();

            if (!target) {
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                return;
            }

            /* Нельзя бросать в свою же папку. */
            var srcFolder = self._currentFolderOfIds(self._dragUserCompIds);
            if (srcFolder !== null && srcFolder === (target.folderId || '')) {
                if (target.label) target.label.classList.add('wb-drop-forbidden');
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
                return;
            }

            e.preventDefault();
            try { e.dataTransfer.dropEffect = 'move'; } catch (ex) {}
            if (target.label) target.label.classList.add('wb-drop-inside');
        }, false);

        rootNode.addEventListener('dragleave', function (e) {
            if (!self._isDragging) return;
            var lbl = findLabel(e.target);
            if (lbl) lbl.classList.remove('wb-drop-inside', 'wb-drop-forbidden');
        }, false);

        rootNode.addEventListener('drop', function (e) {
            if (!self._isDragging || !self._dragUserCompIds || !self._dragUserCompIds.length) return;

            e.preventDefault();
            e.stopPropagation();

            var target = self._resolveDropTarget(e.target, rootNode);
            if (!target) { self._endDrag(); return false; }

            var moved = false;
            for (var i = 0; i < self._dragUserCompIds.length; i++) {
                if (self._moveUserCompToFolder(self._dragUserCompIds[i], target.folderId)) {
                    moved = true;
                }
            }
            if (moved) {
                self._renderUserPalette();
                bus.emit('palette:refresh');
            }
            self._endDrag();
            return false;
        }, false);
    };

    Palette.prototype._currentFolderOfIds = function (ids) {
        var common = null;
        for (var i = 0; i < ids.length; i++) {
            var c = global.ComponentStorage.getComponent(ids[i]);
            if (!c) return null;
            var f = c.folderId || '';
            if (common === null) common = f;
            else if (common !== f) return null;
        }
        return common;
    };

    Palette.prototype._endDrag = function () {
        this._isDragging = false;
        this._dragUserCompIds = null;
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

    /* ============================================================
       Контекстное меню
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

    /* ============================================================
       Действия контекстного меню
       ============================================================ */
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

    /* ============================================================
       Фильтр
       ============================================================ */
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
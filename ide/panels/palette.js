/* Palette — палитра компонентов + пользовательская палитра пользователя.
   Загружается после panels-utils.js.

   ВАЖНО: на корень палитры навешиваем обработчики через НАТИВНЫЙ
   addEventListener — MiniUI патчит jQuery.fn.on и ломает его на
   объектах, созданных из DOM-элементов (см. project-tree.js). */
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
                .attr('draggable', 'false');
            if (c.icon) {
                var src = c.icon;
                if (global.ProjectResolver && global.ProjectResolver.isProjectPath && global.ProjectResolver.isProjectPath(src)) {
                    try { src = global.ProjectResolver.resolve(src); } catch(e){}
                }
                comp.append($('<img/>').addClass('wb-palette-icon').attr('alt','').attr('src', src)
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
    };

    /* Построение def для вставки компонента на сцену.
   Вся логика вынесена в ComponentStorage.toDef — единый источник. */
    Palette.prototype._buildUserDef = function (c) {
        return global.ComponentStorage.toDef(c);
    };

    Palette.prototype._selectUserComponent = function (c, additive) {
        /* Мультивыделение для экспорта/удаления. */
        if (!additive) this._userSel = {};
        this._userSel[c.id] = true;
        this._lastUserClick = c.id;
        this._syncUserSelectionUI();

        /* Активируем для вставки на сцену. */
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

    /* ---------- Контекстное меню ----------
       ВАЖНО: используем НАТИВНЫЙ addEventListener — MiniUI патчит
       jQuery.fn.on, и на jQuery-объекте, созданном из DOM-элемента,
       .on('contextmenu', fn) падает с "$.replace is not a function". */
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
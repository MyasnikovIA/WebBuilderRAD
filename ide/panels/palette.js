/* Palette — палитра компонентов (правая нижняя панель).

   Загружается после panels-utils.js. Экспортирует global.Palette. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    function Palette(rootEl) {
        this.root = $(rootEl);
        this.active = null;
        this._collapsed = {};
        this._collapseAllOnRender = true;
        this._render();
        var self = this;
        $('#wb-palette-filter').bind('keyup input', function () { self._filter($(this).val()); });
        bus.on('palette:placed',    function () { self.clearActive(); });
        bus.on('palette:cancelled', function () { self.clearActive(); });
    }

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

        for (var k = 0; k < tree.length; k++) {
            ul.append(self._renderTopCategory(tree[k]));
        }
        this.root.append(ul);
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

        var toggle = $('<span class="wb-toggle"></span>')
            .text(collapsed ? '+' : '\u2212')
            .toggleClass('wb-leaf', false);
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

        var toggle = $('<span class="wb-toggle"></span>')
            .text(collapsed ? '+' : '\u2212')
            .toggleClass('wb-leaf', false);
        li.append(toggle);
        li.append($('<span class="wb-tree-label wb-cat-label"></span>').text(sub.name));

        var cul = $('<ul></ul>');
        for (var i = 0; i < sub.components.length; i++) {
            cul.append(self._renderComponentLi(sub.components[i]));
        }
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
            var $img = $('<img/>')
                .addClass('wb-palette-icon')
                .attr('alt', '')
                .attr('src', c.iconUrl)
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
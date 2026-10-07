/* Палитра компонентов (как в Delphi Tool Palette). */
(function (global, $) {
    'use strict';

    function Palette(rootEl) {
        this.root = $(rootEl);
        this.active = null;
        this._render();

        var self = this;
        $('#wb-palette-filter').keyup(function () { self._filter($(this).val()); });
        EventBus.on('palette:placed',    function () { self.clearActive(); });
        EventBus.on('palette:cancelled', function () { self.clearActive(); });
    }

    Palette.prototype._render = function () {
        var self = this;
        this.root.empty();
        ComponentRegistry.categories().forEach(function (cat) {
            var group = $('<div class="wb-palette-group"></div>');
            group.append($('<div class="wb-palette-group-head"></div>').text(cat.name));
            var list = $('<div class="wb-palette-list"></div>');
            cat.components.forEach(function (comp) {
                if (comp.hidden) return;
                var btn = $('<button type="button" class="wb-palette-btn"></button>')
                    .text(comp.caption)
                    .attr('data-comp-id', comp.id);
                btn.click(function () { self._select(comp, btn); });
                list.append(btn);
            });
            group.append(list);
            self.root.append(group);
        });
    };

    Palette.prototype._select = function (comp, btn) {
        this.clearActive();
        btn.addClass('wb-active');
        this.active = comp;
        EventBus.emit('palette:selected', { component: comp });
    };

    Palette.prototype.clearActive = function () {
        this.root.find('.wb-palette-btn').removeClass('wb-active');
        this.active = null;
    };

    Palette.prototype._filter = function (text) {
        text = (text || '').toLowerCase();
        this.root.find('.wb-palette-btn').each(function () {
            var t = $(this).text().toLowerCase();
            $(this).toggle(!text || t.indexOf(text) >= 0);
        });
    };

    global.Palette = Palette;
})(window, jQuery);
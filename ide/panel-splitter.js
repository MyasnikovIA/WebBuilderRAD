/* PanelSplitter — горизонтальный сепаратор между двумя панелями
   (верх / низ). Перетаскивается мышкой по вертикали.

   Позиция сохраняется в localStorage('wb.panelSizes').

   ВАЖНО: используются нативные обработчики — MiniUI ломает jQuery.fn.on. */
(function (global, $) {
    'use strict';

    function PanelSplitter(opts) {
        opts = opts || {};
        this.topEl       = $(opts.topSel);
        this.splitEl     = $(opts.splitSel);
        this.containerEl = $(opts.containerSel);
        this.minTop      = opts.minTop    || 80;
        this.minBottom   = opts.minBottom || 120;
        this._bind();
        this._restore();
    }

    PanelSplitter.prototype._bind = function () {
        var self = this;
        var splitNode = this.splitEl[0];
        if (!splitNode) return;

        splitNode.addEventListener('mousedown', function (e) {
            e.preventDefault();

            var startY     = e.clientY;
            var startTopH  = self.topEl.outerHeight();
            var totalH     = self.containerEl.innerHeight();
            var splitH     = self.splitEl.outerHeight();

            document.body.style.cursor = 'row-resize';

            function move(ev) {
                var dy = ev.clientY - startY;
                var newTop = startTopH + dy;
                if (newTop < self.minTop) newTop = self.minTop;
                if (totalH - newTop - splitH < self.minBottom) {
                    newTop = totalH - self.minBottom - splitH;
                }
                self.topEl.css('height', newTop + 'px');
            }
            function up() {
                document.removeEventListener('mousemove', move, false);
                document.removeEventListener('mouseup',   up,   false);
                document.body.style.cursor = '';
                self._save();
            }

            document.addEventListener('mousemove', move, false);
            document.addEventListener('mouseup',   up,   false);
        }, false);
    };

    PanelSplitter.prototype._save = function () {
        try {
            localStorage.setItem('wb.panelSizes', JSON.stringify({
                top: this.topEl.outerHeight()
            }));
        } catch (e) {}
    };

    PanelSplitter.prototype._restore = function () {
        try {
            var raw = localStorage.getItem('wb.panelSizes');
            if (!raw) return;
            var s = JSON.parse(raw);
            if (s && s.top) {
                var h = Math.max(this.minTop, s.top);
                this.topEl.css('height', h + 'px');
            }
        } catch (e) {}
    };

    global.PanelSplitter = PanelSplitter;

})(window, jQuery);
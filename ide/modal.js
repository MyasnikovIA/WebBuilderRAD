/* Универсальное модальное окно для редакторов. */
(function (global, $) {
    'use strict';

    function Modal() {
        this.host   = $('#wb-modal-host');
        this.body   = this.host.find('.wb-modal-body');
        this.title  = $('#wb-modal-title');
        this.onOk   = null;

        var self = this;
        this.host.find('.wb-modal-close, [data-action="cancel"]').click(function () { self.close(); });
        this.host.find('[data-action="ok"]').click(function () {
            var fn = self.onOk;
            self.close();
            if (fn) fn();
        });
        $(document).keydown(function (e) {
            if (e.keyCode === 27 && self.host.hasClass('wb-open')) self.close();
        });
    }

    Modal.prototype.open = function (opts) {
        this.title.text(opts.title || '');
        this.body.empty().append(opts.content || '');
        this.onOk = opts.onOk || null;
        this.host.addClass('wb-open');
    };

    Modal.prototype.close = function () {
        this.host.removeClass('wb-open');
        this.body.empty();
        this.onOk = null;
    };

    global.Modal = new Modal();
})(window, jQuery);
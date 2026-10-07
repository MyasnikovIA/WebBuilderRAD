/* Простая шина событий: модули общаются только через неё. */
(function (global) {
    'use strict';

    function EventBus() { this._handlers = {}; }

    EventBus.prototype.on = function (name, fn) {
        (this._handlers[name] = this._handlers[name] || []).push(fn);
        return this;
    };
    EventBus.prototype.off = function (name, fn) {
        var list = this._handlers[name];
        if (!list) return this;
        if (!fn) { delete this._handlers[name]; return this; }
        for (var i = list.length - 1; i >= 0; i--) if (list[i] === fn) list.splice(i, 1);
        return this;
    };
    EventBus.prototype.emit = function (name, payload) {
        var list = this._handlers[name];
        if (!list) return this;
        for (var i = 0; i < list.length; i++) {
            try { list[i](payload); } catch (e) { if (global.console) console.error('[EventBus]', name, e); }
        }
        return this;
    };

    global.EventBus = new EventBus();
})(window);
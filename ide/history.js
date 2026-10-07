/* Простая история изменений на основе снапшотов body.innerHTML. */
(function (global) {
    'use strict';

    var MAX = 100;
    var stack = [];
    var index = -1;
    var suspended = false;
    var canvas = null;

    var History = {
        attach: function (c) {
            canvas = c;
            EventBus.on('canvas:changed', function () { History.push(); });
            EventBus.on('canvas:ready',   function () { History.reset(); });
        },

        reset: function () {
            stack = []; index = -1;
            History.push();
        },

        push: function () {
            if (suspended || !canvas) return;
            var html = canvas.getBody().innerHTML;
            if (index >= 0 && stack[index] === html) return;
            stack = stack.slice(0, index + 1);
            stack.push(html);
            if (stack.length > MAX) stack.shift();
            index = stack.length - 1;
            EventBus.emit('history:changed', History.state());
        },

        undo: function () {
            if (index <= 0) return;
            index--;
            History._apply(stack[index]);
        },

        redo: function () {
            if (index >= stack.length - 1) return;
            index++;
            History._apply(stack[index]);
        },

        state: function () {
            return {
                canUndo: index > 0,
                canRedo: index < stack.length - 1
            };
        },

        _apply: function (html) {
            suspended = true;
            canvas.getBody().innerHTML = html;
            suspended = false;
            EventBus.emit('canvas:refreshed');
            EventBus.emit('canvas:changed'); // перезапишет снапшот
            EventBus.emit('history:changed', History.state());
        }
    };

    global.History = History;
})(window);
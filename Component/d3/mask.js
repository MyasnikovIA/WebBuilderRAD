/* cmpMask — маска ввода. Невидимый на сцене, но не как data — можно выделить. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.mask', tagName: 'cmpMask', caption: 'Mask',
        attrs: { name: '', controls: '' },
        properties: [
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'controls', caption: 'Controls', type: 'string', attr: true }
        ]
    });

})(window);
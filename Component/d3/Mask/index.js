/* cmpMask — маска ввода. Невидим на сцене (скрыт CSS-правилом). */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.mask', tagName: 'cmpMask', caption: 'Mask',
        icon: 'images/icon.png',
        attrs: { name: '', controls: '' },
        properties: [
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'controls', caption: 'Controls', type: 'string', attr: true }
        ]
    });

})(window);
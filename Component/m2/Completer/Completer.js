/* M2 Completer — автодополнение. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.completer', tagName: 'component', cmptype: 'Completer',
        caption: 'Completer (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Completer');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('showfield', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'Completer' },
            { name: 'controls',  caption: 'Controls',  type: 'string', attr: true },
            { name: 'showfield', caption: 'ShowField', type: 'string', attr: true },
            { name: 'dataset',   caption: 'DataSet',   type: 'string', attr: true },
            { name: 'maxitems',  caption: 'MaxItems',  type: 'number', attr: true },
            { name: 'minlength', caption: 'MinLength', type: 'number', attr: true },
            { name: 'timeout',   caption: 'Timeout',   type: 'number', attr: true }
        ],
        events: [], styles: []
    });

})(window);
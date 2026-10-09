/* M2 ComboItem — элемент ComboBox. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.comboitem', tagName: 'component', cmptype: 'ComboItem',
        caption: 'ComboItem (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'ComboItem');
            el.setAttribute('value', '');
            el.setAttribute('caption', '');
            return el;
        },

        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-m2-comboitem';
            span.textContent = el.getAttribute('caption') || el.getAttribute('value') || '(item)';
            return span;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'ComboItem' },
            { name: 'value',   caption: 'Value',   type: 'string', attr: true },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'data',    caption: 'Data',    type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);
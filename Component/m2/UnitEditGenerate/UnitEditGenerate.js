/* M2 UnitEditGenerate — генератор формы редактирования. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.uniteditgenerate', tagName: 'component', cmptype: 'UnitEditGenerate',
        caption: 'UnitEditGenerate (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'UnitEditGenerate');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('method', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-uniteditgenerate';
            wrap.style.border = '1px solid #ccc';
            wrap.style.padding = '8px';
            wrap.style.borderRadius = '4px';
            wrap.style.background = '#fafafa';
            wrap.textContent = 'UnitEditGenerate: unit=' +
                (el.getAttribute('unit') || '?') +
                ', method=' + (el.getAttribute('method') || '?');
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'UnitEditGenerate' },
            { name: 'unit',   caption: 'Unit',   type: 'string', attr: true },
            { name: 'method', caption: 'Method', type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);
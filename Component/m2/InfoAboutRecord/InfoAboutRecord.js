/* M2 InfoAboutRecord — иконка информации о записи. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.infoaboutrecord', tagName: 'component', cmptype: 'InfoAboutRecord',
        caption: 'InfoAboutRecord (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'InfoAboutRecord');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            return el;
        },

        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-m2-infoaboutrecord';
            span.style.display = 'inline-flex';
            span.style.alignItems = 'center';
            span.style.justifyContent = 'center';
            span.style.width = '16px';
            span.style.height = '16px';
            span.style.borderRadius = '50%';
            span.style.background = '#1e88e5';
            span.style.color = '#fff';
            span.style.fontWeight = 'bold';
            span.style.fontSize = '11px';
            span.textContent = 'i';
            span.title = 'Информация о записи';
            return span;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { type: 'separator', caption: 'InfoAboutRecord' },
            { name: 'value', caption: 'Value (id)', type: 'string', attr: true },
            { name: 'unit',  caption: 'Unit',       type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);
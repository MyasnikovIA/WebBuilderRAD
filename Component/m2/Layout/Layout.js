/* M2 Layout — табличный контейнер. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.layout', tagName: 'component', cmptype: 'Layout',
        caption: 'Layout (M2)', subCategory: 'Containers', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Layout');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var table = doc.createElement('table');
            table.className = 'd3-preview d3-preview-m2-layout';
            table.style.borderCollapse = 'collapse';
            table.style.border = '1px dashed #ccc';
            var tr = doc.createElement('tr');
            for (var c = 0; c < 2; c++) {
                var td = doc.createElement('td');
                td.textContent = '(cell)';
                td.style.border = '1px dashed #ccc';
                td.style.padding = '4px 8px';
                tr.appendChild(td);
            }
            table.appendChild(tr);
            return table;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true }
        ],
        events: CS.EVENT_FIELDS.slice(), styles: CS.STYLE_FIELDS.slice()
    });

})(window);
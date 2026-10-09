/* M2 Range — <component cmptype="Range">. Пагинация. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.range',
        tagName: 'component',
        cmptype: 'Range',
        caption: 'Range (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Range');
            el.setAttribute('name', '');
            el.setAttribute('default_amount', '10');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-range';
            wrap.style.fontSize = '11px';
            wrap.style.color = '#555';
            wrap.textContent = '‹ 1 2 3 4 5 ›   по ' +
                (el.getAttribute('default_amount') || '10') + ' записей';
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            { type: 'separator', caption: 'Range' },
            { name: 'dataset',        caption: 'DataSet',        type: 'string',  attr: true },
            { name: 'default_amount', caption: 'Default Amount', type: 'number',  attr: true },
            { name: 'pages',          caption: 'Visible Pages',  type: 'number',  attr: true },
            { name: 'count',          caption: 'Count',          type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
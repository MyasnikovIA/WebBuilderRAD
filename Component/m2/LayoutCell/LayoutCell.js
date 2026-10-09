/* M2 LayoutCell — ячейка Layout. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.layoutcell', tagName: 'component', cmptype: 'LayoutCell',
        caption: 'LayoutCell (M2)', subCategory: 'Containers', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'LayoutCell');
            el.setAttribute('name', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'Cell' },
            { name: 'colspan', caption: 'ColSpan', type: 'number', attr: true },
            { name: 'rowspan', caption: 'RowSpan', type: 'number', attr: true },
            { name: 'align',   caption: 'Align',   type: 'enum',   attr: true,
                values: ['', 'left', 'center', 'right'] },
            { name: 'valign',  caption: 'VAlign',  type: 'enum',   attr: true,
                values: ['', 'top', 'middle', 'bottom'] }
        ],
        events: [], styles: []
    });

})(window);
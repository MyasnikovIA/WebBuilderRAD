/* M2 StatGridColumn — колонка StatGrid. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.statgridcolumn', tagName: 'component', cmptype: 'StatGridColumn',
        caption: 'StatGridColumn (M2)', subCategory: 'Grids', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'StatGridColumn');
            el.setAttribute('field', '');
            el.setAttribute('caption', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'Column' },
            { name: 'field',   caption: 'Field',   type: 'string', attr: true },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string', attr: true },
            { name: 'align',   caption: 'Align',   type: 'enum',   attr: true,
                values: ['', 'left', 'center', 'right'] },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { type: 'separator', caption: 'Grouping' },
            { name: 'group',      caption: 'Group',       type: 'boolean', attr: true },
            { name: 'grouporder', caption: 'Group Order', type: 'number',  attr: true },
            { type: 'separator', caption: 'Sort' },
            { name: 'sort',      caption: 'Sort Field', type: 'string', attr: true },
            { name: 'sortorder', caption: 'Sort Order', type: 'enum',   attr: true,
                values: ['', 'asc', 'desc'] },
            { type: 'separator', caption: 'Filter' },
            { name: 'filter',     caption: 'Filter Field', type: 'string', attr: true },
            { name: 'filterkind', caption: 'Filter Kind',  type: 'enum',   attr: true,
                values: ['', 'text', 'numb', 'date', 'combo', 'unitedit'] }
        ],
        events: [], styles: []
    });

})(window);
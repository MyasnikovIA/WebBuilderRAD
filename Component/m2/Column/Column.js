/* M2 Column — <component cmptype="Column">. Колонка Grid. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.column',
        tagName: 'component',
        cmptype: 'Column',
        caption: 'Column (M2)',
        subCategory: 'Grids',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Column');
            el.setAttribute('field', '');
            el.setAttribute('caption', '');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'hint',  caption: 'Hint',  type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },

            { type: 'separator', caption: 'Column' },
            { name: 'field',   caption: 'Field',   type: 'string', attr: true },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string', attr: true },
            { name: 'align',   caption: 'Align',   type: 'enum',   attr: true,
                values: ['', 'left', 'center', 'right'] },

            { type: 'separator', caption: 'Sort' },
            { name: 'sort',      caption: 'Sort Field', type: 'string', attr: true },
            { name: 'sortorder', caption: 'Sort Order', type: 'enum',   attr: true,
                values: ['', 'asc', 'desc'] },

            { type: 'separator', caption: 'Filter' },
            { name: 'filter',     caption: 'Filter Field', type: 'string', attr: true },
            { name: 'filterkind', caption: 'Filter Kind',  type: 'enum',   attr: true,
                values: ['', 'text', 'numb', 'date', 'combo', 'unitedit'] }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
/* M2 TreeColumn — <component cmptype="TreeColumn">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.treecolumn',
        tagName: 'component',
        cmptype: 'TreeColumn',
        caption: 'TreeColumn (M2)',
        subCategory: 'Grids',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'TreeColumn');
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

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },

            { type: 'separator', caption: 'Column' },
            { name: 'field',   caption: 'Field',   type: 'string', attr: true },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string', attr: true },
            { name: 'align',   caption: 'Align',   type: 'enum',   attr: true,
                values: ['', 'left', 'center', 'right'] }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
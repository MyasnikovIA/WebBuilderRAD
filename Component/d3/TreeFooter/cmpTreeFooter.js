/* cmpTreeFooter — подвал Tree.

   Серверный контрол: TreeCtrl.inc (class TreeFooter extends BaseCtrl).
   Добавляет свой текст в $parent->footer_text.

   parentOnly: cmptree.

   В IDE: preview = null. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.treefooter', tagName: 'cmpTreeFooter', caption: 'TreeFooter',
        parentOnly: 'cmptree',
        icon: 'images/icon.png',
        nameTemplate: 'treeFooter',
        previewCss: ['css/preview.css'],
        attrs: { separate: 'false' },

        create: function (doc) {
            var el = doc.createElement('cmptreefooter');
            el.setAttribute('data-wb-tag', 'cmpTreeFooter');
            el.setAttribute('separate', 'false');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'TreeFooter' },
            { name: 'separate', caption: 'Separate', type: 'boolean', attr: true },
            { name: 'height',   caption: 'Height',   type: 'number',  attr: true }
        ],

        events: [],
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
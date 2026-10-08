/* cmpStatGridFooter — подвал StatGrid.

   Серверный контрол: StatGridCtrl.inc (class StatGridFooter extends BaseCtrl).
   Добавляет свой текст в $parent->footer_text.

   parentOnly: cmpstatgrid.

   В IDE: preview = null. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.statgridfooter', tagName: 'cmpStatGridFooter', caption: 'StatGridFooter',
        parentOnly: 'cmpstatgrid',
        icon: 'images/icon.png',
        nameTemplate: 'statGridFooter',
        previewCss: ['css/preview.css'],
        attrs: { separate: 'false' },

        create: function (doc) {
            var el = doc.createElement('cmpstatgridfooter');
            el.setAttribute('data-wb-tag', 'cmpStatGridFooter');
            el.setAttribute('separate', 'false');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'StatGridFooter' },
            { name: 'separate', caption: 'Separate', type: 'boolean', attr: true },
            { name: 'height',   caption: 'Height',   type: 'number',  attr: true }
        ],

        events: [],
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
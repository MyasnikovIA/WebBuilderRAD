/* cmpGridFooter — подвал Grid-а.

   Серверный контрол: GridCtrl.inc (class GridFooter).
   GridFooter::Show() пишет содержимое в $this->parent->footer_text
   и задаёт $this->parent->footerHeight.

   Атрибуты:
     height   — высота подвала (px).
     separate — разделитель (обычно boolean, в рантайме учитывается
                как отдельный CSS-класс).

   Дети: как правило, cmpRange (пагинация). В IDE Range отсутствует —
   GridFooter можно добавить пустым.

   parentOnly: cmpgrid. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.gridfooter', tagName: 'cmpGridFooter', caption: 'GridFooter',
        subCategory: 'Grids',
        parentOnly: 'cmpgrid',
        icon: 'images/icon.png',
        nameTemplate: 'gridFooter',
        previewCss: ['css/preview.css'],
        attrs: { separate: 'false' },

        create: function (doc) {
            var el = doc.createElement('cmpgridfooter');
            el.setAttribute('data-wb-tag', 'cmpGridFooter');
            el.setAttribute('separate', 'false');
            return el;
        },

        preview: null,

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- GridFooter --- */
            { type: 'separator', caption: 'GridFooter' },
            { name: 'separate', caption: 'Separate', type: 'boolean', attr: true },
            { name: 'height',   caption: 'Height',   type: 'number',  attr: true }
        ],

        events: [],
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
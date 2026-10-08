/* cmpStatGridColumnHeader — заголовок колонки StatGrid.

   Серверный контрол: StatGridCtrl.inc (class StatGridColumnHeader extends BaseCtrl).
   Заменяет собой caption колонки: `$this->parent->caption = $this->text`.

   parentOnly: cmpstatgridcolumn.

   В IDE: preview = null. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.statgridcolumnheader', tagName: 'cmpStatGridColumnHeader',
        caption: 'StatGridColumnHeader',
        parentOnly: 'cmpstatgridcolumn',
        icon: 'images/icon.png',
        nameTemplate: 'statGridColumnHeader',
        previewCss: ['css/preview.css'],

        create: function (doc) {
            var el = doc.createElement('cmpstatgridcolumnheader');
            el.setAttribute('data-wb-tag', 'cmpStatGridColumnHeader');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'Content' },
            { name: 'cdata', caption: 'Header HTML', type: 'code',
                get: function (el) {
                    var t = el.textContent || '';
                    var m = t.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
                    return m ? m[1] : t;
                },
                set: function (el, v) {
                    el.textContent = '<![CDATA[' + (v == null ? '' : v) + ']]>';
                }
            }
        ],

        events: [],
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
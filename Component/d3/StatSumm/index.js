/* cmpStatSumm — определение итоговой суммы в колонке StatGrid.

   Серверный контрол: StatGridCtrl.inc (class StatSumm extends BaseCtrl).
   Пишет в parent (StatGridColumn) HTML-маркер, содержащий атрибуты
   summ_type / field / index. Клиент StatGrid-а собирает их в
   dom.D3StatGrid.summ для подсчёта итогов.

   parentOnly: cmpstatgridcolumn.

   Атрибуты:
     field        — поле DataSet.
     index        — индекс колонки.
     summ_type    — sum | count | avg | max | min.
     summ_caption — подпись перед суммой.
     summ_before  — строка перед значением.
     summ_after   — строка после значения.
     summ_fixed   — округление.
     summ_postfix — строка после суммы (не используется напрямую,
                    оставлен для совместимости).

   В IDE: preview = null. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.statgridsumm', tagName: 'cmpStatSumm', caption: 'StatSumm',
        parentOnly: 'cmpstatgridcolumn',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],

        create: function (doc) {
            var el = doc.createElement('cmpstatsumm');
            el.setAttribute('data-wb-tag', 'cmpStatSumm');
            el.setAttribute('summ_type', 'sum');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'StatSumm' },
            { name: 'field',        caption: 'Field',        type: 'string', attr: true },
            { name: 'index',        caption: 'Index',        type: 'number', attr: true },
            { name: 'summ_type',    caption: 'Summ Type',    type: 'enum',   attr: true,
                values: ['sum', 'count', 'avg', 'max', 'min'] },
            { name: 'summ_caption', caption: 'Caption',      type: 'string', attr: true },
            { name: 'summ_before',  caption: 'Before',       type: 'string', attr: true },
            { name: 'summ_after',   caption: 'After',        type: 'string', attr: true },
            { name: 'summ_fixed',   caption: 'Fixed',        type: 'number', attr: true },
            { name: 'summ_postfix', caption: 'Postfix',      type: 'string', attr: true }
        ],

        events: [],
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
/* M2 StatSumm — итоговая сумма в колонке StatGrid. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.statsumm', tagName: 'component', cmptype: 'StatSumm',
        caption: 'StatSumm (M2)', subCategory: 'Grids', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'StatSumm');
            el.setAttribute('summ_type', 'sum');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'StatSumm' },
            { name: 'field',        caption: 'Field',        type: 'string', attr: true },
            { name: 'index',        caption: 'Index',        type: 'number', attr: true },
            { name: 'summ_type',    caption: 'Summ Type',    type: 'enum',   attr: true,
                values: ['sum', 'count', 'avg', 'max', 'min'] },
            { name: 'summ_caption', caption: 'Caption',      type: 'string', attr: true },
            { name: 'summ_before',  caption: 'Before',       type: 'string', attr: true },
            { name: 'summ_after',   caption: 'After',        type: 'string', attr: true },
            { name: 'summ_fixed',   caption: 'Fixed',        type: 'number', attr: true }
        ],
        events: [], styles: []
    });

})(window);
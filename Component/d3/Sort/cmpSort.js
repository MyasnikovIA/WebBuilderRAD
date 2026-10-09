/* cmpSort — служебный хелпер сортировки, связанный с DataSet.

   Серверный контрол: (в GridCtrl.inc при usesort генерируется автоматически)
   Клиентский контрол: Sort.js (D3Api.SortCtrl).

   Разметка в рантайме:
     <div cmptype="Sort" style="display:none;" name="<ds>_Sort"></div>

   Атрибуты:
     name        — имя контрола (обычно '<dataset>_Sort').
     sortvalue   — текущее значение сортировки (строка вида '|field:1|field2:-2').
     sortitems   — ';'-разделённый список имён SortItem-ов,
                   зарегистрированных в этом Sort.

   В IDE: невидимый служебный компонент. Обычно создаётся не вручную,
   а автоматически при использовании Grid с атрибутом sort. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.sort', tagName: 'cmpSort', caption: 'Sort',
        subCategory: 'Filters',
        icon: 'images/icon.png',
        nameTemplate: 'sort',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmpsort');
            el.setAttribute('data-wb-tag', 'cmpSort');
            el.setAttribute('name', '');
            el.style.display = 'none';
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

            { type: 'separator', caption: 'Sort' },
            { name: 'sortvalue', caption: 'Sort Value', type: 'string', attr: true },
            { name: 'sortitems', caption: 'Sort Items', type: 'string', attr: true }
        ],

        events: [],
        styles: []
    });

})(window);
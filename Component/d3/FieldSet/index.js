/* cmpFieldSet — контейнер с заголовком.

   Серверный контрол: FieldSetCtrl.inc (class FieldSet).
   Клиентский контрол: FieldSet.js (D3Api.FieldSetCtrl).

   Серверный Show():
     <fieldset class="ctrl_fieldset" ...>
       <legend class="ctrl_fieldset_legend">Caption</legend>
       ...дети...
     </fieldset>

   Атрибуты:
     caption — заголовок; сервер кладёт его в <legend>.

   В IDE chrome-легенда помечена data-wb-ide="1":
     - не попадает в дерево (DomTree._build пропускает),
     - не сериализуется в save (_purgeServiceNodes удаляет),
     - при изменении caption обновляется через preview(). */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function findLegend(el) {
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            if (k.tagName && k.tagName.toLowerCase() === 'legend') return k;
        }
        return null;
    }

    D3.register({
        id: 'd3.fieldset', tagName: 'cmpFieldSet', caption: 'FieldSet',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            caption: 'FieldSet'
        },

        create: function (doc) {
            var el = doc.createElement('cmpfieldset');
            el.setAttribute('data-wb-tag', 'cmpFieldSet');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'FieldSet');

            /* Chrome-легенда. Первым ребёнком, чтобы пользовательские
               дети (appendChild) вставали после неё — как в рантайме. */
            var legend = doc.createElement('legend');
            legend.className = 'ctrl_fieldset_legend';
            legend.setAttribute('data-wb-ide', '1');
            legend.textContent = 'FieldSet';
            el.appendChild(legend);

            return el;
        },

        /* Обновляет текст legend в DOM и возвращает null:
           отдельный preview-узел не нужен, legend уже есть. */
        preview: function (el) {
            var legend = findLegend(el);
            if (legend) {
                legend.textContent = el.getAttribute('caption') || '';
            }
            return null;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- FieldSet --- */
            { type: 'separator', caption: 'FieldSet' },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
/* cmpFilter — контейнер фильтра.

   Серверный контрол: FilterCtrl.inc (class Filter).
   Клиентский контрол: Filter.js (D3Api.FilterCtrl).

   Серверный Show() (без jsonoptions):
     <div class="filter" ...>…дети…</div>

   Серверный Show() (с jsonoptions) сам оборачивает Filter в Expander
   и добавляет кнопки «Отфильтровать»/«Очистить поля». IDE эту генерацию
   не воспроизводит — пользователь добавляет FilterItem-ы и кнопки вручную,
   а на сервере jsonoptions проставит обёртку.

   Атрибуты:
     name         — идентификатор фильтра.
     dataset      — DataSet, который фильтруется.
     jsonoptions  — JSON-описание фильтра (для серверной генерации Expander + Filter).

   Дети: cmpFilterItem. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function getJson(el) {
        var out = '';
        var kids = el.childNodes;
        for (var i = 0; i < kids.length; i++) {
            if (kids[i].nodeType === 3) out += kids[i].nodeValue;
        }
        return out;
    }
    function setJson(el, v) {
        var kids = el.childNodes;
        for (var i = kids.length - 1; i >= 0; i--) {
            if (kids[i].nodeType === 3) el.removeChild(kids[i]);
        }
        el.insertBefore(el.ownerDocument.createTextNode(v == null ? '' : String(v)), el.firstChild);
    }

    D3.register({
        id: 'd3.filter', tagName: 'cmpFilter', caption: 'Filter',
        icon: 'images/icon.png',
        nameTemplate: 'filter',
        previewCss: ['css/preview.css'],
        attrs: { name: '', dataset: '' },

        create: function (doc) {
            var el = doc.createElement('cmpfilter');
            el.setAttribute('data-wb-tag', 'cmpFilter');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            return el;
        },

        /* Chrome не нужен: контейнер пустой, дети — FilterItem-ы. */
        preview: null,

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

            /* --- Filter --- */
            { type: 'separator', caption: 'Filter' },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            {
                name: 'jsonoptions',
                caption: 'JSON Options',
                type: 'code',
                get: function (el) { return getJson(el); },
                set: function (el, v) { setJson(el, v); }
            }
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
/* cmpLayoutRow — строка Layout-а.

   Серверный контрол: LayoutRow (в LayoutCtrl.inc, по аналогии с Column/GridFooter).
   Рендерится как <tr> внутри <table class="ctrl_layout">.

   Атрибуты:
     name — имя контрола.
     class, style — стандартные.
     enabled, visible, hint — из BaseCtrl.

   Дети: cmpLayoutCell.

   parentOnly: 'cmplayout' — можно вставить только внутрь Layout.

   В IDE: display: table-row. Если строка пуста — невидима (как и в HTML). */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.layoutrow', tagName: 'cmpLayoutRow', caption: 'LayoutRow',
        subCategory: 'Containers',
        parentOnly: 'cmplayout',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmplayoutrow');
            el.setAttribute('data-wb-tag', 'cmpLayoutRow');
            el.setAttribute('name', '');
            return el;
        },

        /* Строка — чистый контейнер: её визуализация = её ячейки.
           Пустая строка невидима; пользователь видит её в дереве. */
        preview: null,

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true }
        ],

        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
/* cmpPopupGroupItem — группа пунктов внутри контекстного меню.

   Серверный контрол: PopupMenuCtrl.inc (class PopupGroupItem extends BaseCtrl).
   Клиентский контрол: PopupMenu.js (D3Api.PopupGroupItemCtrl — пустой).

   Рендерится как:
     <div class="popupGroupItem" cont="groupitem" …attrs…>…дети…</div>

   Группа не имеет визуального представления сама по себе — это просто
   контейнер, чтобы отделить одну группу пунктов от другой. PopupMenu
   при Show() создаёт две служебные группы:
     - «additionalMainMenu» — для пользовательских пунктов;
     - «system» — для системных (с разделителем перед).

   Группа может содержать PopupItem и другие PopupGroupItem (вложенные).

   Атрибуты:
     name      — имя группы (используется в addGroupItem).
     separator — 'before' | 'after' — куда поставить разделитель
                 относительно группы. Если задано, PopupMenu создаст
                 <div class="item separator"> до/после группы.

   parentOnly: cmppopupmenu | cmppopupgroupitem | cmppopupitem.

   В IDE: preview = null — визуализируется родителем. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.popupgroupitem', tagName: 'cmpPopupGroupItem', caption: 'PopupGroupItem',
        parentOnly: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmppopupgroupitem');
            el.setAttribute('data-wb-tag', 'cmpPopupGroupItem');
            el.setAttribute('name', '');
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

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            /* --- PopupGroupItem --- */
            { type: 'separator', caption: 'PopupGroupItem' },
            { name: 'separator', caption: 'Separator', type: 'enum', attr: true,
                values: ['', 'before', 'after'] }
        ],

        events: [],
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
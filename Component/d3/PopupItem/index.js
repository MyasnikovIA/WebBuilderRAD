/* cmpPopupItem — пункт контекстного меню.

   Серверный контрол: PopupMenuCtrl.inc (class PopupItem extends BaseCtrl).
   Клиентский контрол: PopupMenu.js (D3Api.PopupItemCtrl).

   Два режима рендера:
     1. Разделитель (caption="-"): <div class="item separator" item_split="true"></div>
     2. Обычный пункт: <div class="item" caption="…">
                         <table><tr>
                           <td><img cont="itemIcon"/><span cont="itemCaption">…</span></td>
                           <td class="caret"></td>
                         </tr></table>
                         [<div class="popupMenu subItems" cont="menu">…подменю…</div>]
                       </div>

   Если у PopupItem есть дочерние PopupItem — рендерится как подменю
   (class «haveItems», появляется «caret» →).

   Атрибуты:
     name         — имя пункта (для getControl / addItem).
     caption      — текст пункта. Если '-', то разделитель.
     icon         — путь к иконке.
     std_icon     — стандартная иконка (см. ~CmpPopupMenu/Icons/<std_icon>).
     onclick      — обработчик клика. Сервер навешивает свой
                    (D3Api.PopupItemCtrl.clickItem) после пользовательского.
     onmouseover  — обработчик наведения. Сервер навешивает свой.
     default      — 'true' — пункт по умолчанию (для defaultAction).
     visible      — показывать ли пункт.

   parentOnly: cmppopupmenu | cmppopupgroupitem | cmppopupitem.
   Может вкладываться в себя (подменю).

   В IDE: preview = null — визуализируется родителем. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.popupitem', tagName: 'cmpPopupItem', caption: 'PopupItem',
        parentOnly: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '', caption: '' },

        create: function (doc) {
            var el = doc.createElement('cmppopupitem');
            el.setAttribute('data-wb-tag', 'cmpPopupItem');
            el.setAttribute('name', '');
            el.setAttribute('caption', '');
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

            /* --- PopupItem --- */
            { type: 'separator', caption: 'PopupItem' },
            { name: 'caption',  caption: 'Caption («-» = separator)', type: 'string', attr: true },
            { name: 'icon',     caption: 'Icon URL',  type: 'string',  attr: true },
            { name: 'std_icon', caption: 'Std Icon',  type: 'string',  attr: true },
            { name: 'default',  caption: 'Default',   type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
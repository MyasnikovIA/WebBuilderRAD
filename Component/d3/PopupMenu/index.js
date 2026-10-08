/* cmpPopupMenu — контекстное меню.

   Серверный контрол: PopupMenuCtrl.inc (class PopupMenu extends BaseCtrl).
   Клиентский контрол: PopupMenu.js (D3Api.PopupMenuCtrl).

   В рантайме меню скрыто (display:none) до вызова show(coords).
   Показывается как fixed-элемент рядом с координатами клика.

   Дети: cmpPopupItem, cmpPopupGroupItem.

   В IDE: НЕВИДИМЫЙ компонент. Виден только в дереве и инспекторе —
   как cmpScript / cmpAction / cmpDataSet. В canvas ничего не рисует. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.popupmenu', tagName: 'cmpPopupMenu', caption: 'PopupMenu',
        icon: 'images/icon.png',
        nameTemplate: 'popupMenu',
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmppopupmenu');
            el.setAttribute('data-wb-tag', 'cmpPopupMenu');
            el.setAttribute('name', '');
            return el;
        },

        /* Невидимый в canvas — как служебные компоненты. */
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

            /* --- PopupMenu --- */
            { type: 'separator', caption: 'PopupMenu' },
            { name: 'popupobject',     caption: 'Popup Object',     type: 'string',  attr: true },
            { name: 'popupobject_var', caption: 'Popup Object Var', type: 'string',  attr: true },
            { name: 'join_menu',       caption: 'Join Menu',        type: 'string',  attr: true },
            { name: 'join_menu_var',   caption: 'Join Menu Var',    type: 'string',  attr: true },
            { name: 'join_group',      caption: 'Join Group',       type: 'string',  attr: true },
            { name: 'onpopup_action',  caption: 'OnPopup Action',   type: 'string',  attr: true },
            { name: 'autopopup',       caption: 'Auto Popup',       type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onpopup',       caption: 'OnPopup',       type: 'code' },
            { name: 'onitem_add',    caption: 'OnItemAdd',     type: 'code' },
            { name: 'onitem_delete', caption: 'OnItemDelete',  type: 'code' },
            { name: 'onclick',       caption: 'OnClick',       type: 'code' },
            { name: 'ondblclick',    caption: 'OnDblClick',    type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
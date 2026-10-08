/* cmpPopupItem — пункт контекстного меню.

   Серверный контрол: PopupMenuCtrl.inc (class PopupItem extends BaseCtrl).
   Клиентский контрол: PopupMenu.js (D3Api.PopupItemCtrl).

   Два режима рендера:
     1. Разделитель (caption="-"): <div class="item separator"></div>.
     2. Обычный пункт с иконкой, текстом и (опционально) подменю.

   parentOnly: cmppopupmenu | cmppopupgroupitem | cmppopupitem.
   Может вкладываться в себя (подменю).

   В IDE: невидим — родитель (PopupMenu) сам скрыт через _injectIdeStyle. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Список стандартных иконок PopupItem. Значения сервер подставляет
       как ~CmpPopupMenu/Icons/<std_icon>. Используется для enum в
       инспекторе, чтобы пользователь выбирал из известных имён. */
    var STD_ICONS = [
        '',
        'refresh',
        'insert',
        'edit',
        'delete',
        'report',
        'printer',
        'upload',
        'download',
        'logs',
        'userprocs',
        'unitprops',
        'jdocs',
        'generation'
    ];

    D3.register({
        id: 'd3.popupitem', tagName: 'cmpPopupItem', caption: 'PopupItem',
        parentOnly: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        icon: 'images/icon.png',
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
            { name: 'caption',  caption: 'Caption («-» = separator)', type: 'string',  attr: true },
            { name: 'icon',     caption: 'Icon URL',                  type: 'string',  attr: true },
            { name: 'std_icon', caption: 'Std Icon',                  type: 'enum',    attr: true,
                values: STD_ICONS },
            { name: 'default',  caption: 'Default',                   type: 'boolean', attr: true }
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
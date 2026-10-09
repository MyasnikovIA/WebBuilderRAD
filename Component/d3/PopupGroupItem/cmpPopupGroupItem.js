/* cmpPopupGroupItem — группа пунктов PopupMenu.

   В рантайме служит контейнером для отделения групп пунктов.
   Атрибут separator="before|after" — вставка разделителя до/после
   группы.

   parentOnly: cmppopupmenu | cmppopupgroupitem | cmppopupitem.
   Может вкладываться в себя.

   В IDE: невидим — родитель (PopupMenu) скрыт через _injectIdeStyle. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.popupgroupitem', tagName: 'cmpPopupGroupItem', caption: 'PopupGroupItem',
        subCategory: 'Menus',
        parentOnly: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        icon: 'images/icon.png',
        nameTemplate: 'popupGroupItem',
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmppopupgroupitem');
            el.setAttribute('data-wb-tag', 'cmpPopupGroupItem');
            el.setAttribute('name', '');
            return el;
        },

        preview: null,

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            { type: 'separator', caption: 'PopupGroupItem' },
            { name: 'separator', caption: 'Separator', type: 'enum', attr: true,
                values: ['', 'before', 'after'] }
        ],

        events: [],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
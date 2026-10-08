/* cmpTagItem — элемент тегированного поля.
   Разрешён ТОЛЬКО внутри cmpButtonEdit.

   Ссылка: ButtonEditCtrl.inc (класс TagItem) / ButtonEdit.js (TagItemCtrl) */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.tagitem', tagName: 'cmpTagItem', caption: 'TagItem',
        icon: 'images/icon.png',
        nameTemplate: 'tagItem',
        parentOnly: ['cmpbuttonedit'],
        attrs: { value: '', caption: '' },

        /* Невидим сам по себе — рисуется внутри cmpButtonEdit (kind="tagged"). */
        preview: null,

        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },

            /* --- TagItem --- */
            { type: 'separator', caption: 'TagItem' },
            { name: 'value',       caption: 'Value',      type: 'string', attr: true },
            { name: 'caption',     caption: 'Caption',    type: 'string', attr: true },
            { name: 'dataset',     caption: 'DataSet',    type: 'string', attr: true },
            { name: 'repeat',      caption: 'Repeat',     type: 'string', attr: true },
            { name: 'data',        caption: 'Data',       type: 'string', attr: true },
            { name: 'keyfield',    caption: 'KeyField',   type: 'string', attr: true },
            { name: 'parent',      caption: 'Parent',     type: 'string', attr: true },
            { name: 'condition',   caption: 'Condition',  type: 'string', attr: true },
            { name: 'onlycreate',  caption: 'OnlyCreate', type: 'string', attr: true }
        ]
    });

})(window);
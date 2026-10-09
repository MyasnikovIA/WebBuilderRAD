/* M2 TagItem — элемент тегированного поля. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.tagitem', tagName: 'component', cmptype: 'TagItem',
        caption: 'TagItem (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'TagItem');
            el.setAttribute('value', '');
            el.setAttribute('caption', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'TagItem' },
            { name: 'value',      caption: 'Value',      type: 'string', attr: true },
            { name: 'caption',    caption: 'Caption',    type: 'string', attr: true },
            { name: 'dataset',    caption: 'DataSet',    type: 'string', attr: true },
            { name: 'data',       caption: 'Data',       type: 'string', attr: true },
            { name: 'keyfield',   caption: 'KeyField',   type: 'string', attr: true },
            { name: 'onlycreate', caption: 'OnlyCreate', type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);

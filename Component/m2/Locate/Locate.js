/* M2 Locate — служебный контрол позиционирования. Невидим. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.locate', tagName: 'component', cmptype: 'Locate',
        caption: 'Locate (M2)', subCategory: 'Data', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Locate');
            el.setAttribute('name', '');
            el.setAttribute('structure', '');
            el.setAttribute('primary', '');
            el.setAttribute('locate', '');
            el.setAttribute('locate_value', '');
            el.setAttribute('locate_field', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name', caption: 'Name', type: 'string', attr: true },
            { type: 'separator', caption: 'Locate' },
            { name: 'structure',    caption: 'Structure',      type: 'code',   attr: true },
            { name: 'primary',      caption: 'Primary DataSet', type: 'string', attr: true },
            { name: 'locate',       caption: 'Locate DataSet',  type: 'string', attr: true },
            { name: 'locate_value', caption: 'Locate Value',    type: 'string', attr: true },
            { name: 'locate_field', caption: 'Locate Field',    type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);
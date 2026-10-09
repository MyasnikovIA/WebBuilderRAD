/* M2 Expander — <component cmptype="Expander">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.expander',
        tagName: 'component',
        cmptype: 'Expander',
        caption: 'Expander (M2)',
        subCategory: 'Containers',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Expander');
            el.setAttribute('caption', 'Заголовок');
            el.setAttribute('value', 'false');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-expander';
            wrap.style.border = '1px solid #ccc';
            wrap.style.borderRadius = '3px';
            wrap.style.padding = '4px 8px';
            wrap.style.background = '#f5f5f5';
            wrap.textContent = (el.getAttribute('value') === 'true' ? '− ' : '+ ') +
                (el.getAttribute('caption') || 'Заголовок');
            return wrap;
        },

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
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            { type: 'separator', caption: 'Expander' },
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'value',   caption: 'Expanded', type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
/* M2 HyperLink — <component cmptype="HyperLink">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.hyperlink',
        tagName: 'component',
        cmptype: 'HyperLink',
        caption: 'HyperLink (M2)',
        subCategory: 'Display',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'HyperLink');
            el.setAttribute('caption', 'Ссылка');
            return el;
        },

        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-m2-hyperlink';
            span.textContent = el.getAttribute('caption') || '(link)';
            span.style.color = '#1e88e5';
            span.style.textDecoration = 'underline';
            span.style.cursor = 'pointer';
            return span;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',     caption: 'Id',     type: 'string', attr: true },
            { name: 'class',  caption: 'Class',  type: 'string', attr: true },
            { name: 'style',  caption: 'Style',  type: 'string', attr: true },
            { name: 'target', caption: 'Target', type: 'enum',   attr: true,
                values: ['', '_self', '_blank', '_parent', '_top'] },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            { type: 'separator', caption: 'HyperLink' },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'href',    caption: 'Href',    type: 'string', attr: true },
            { name: 'unit',    caption: 'Unit',    type: 'string', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
/* M2 Label — компонент <component cmptype="Label">.

   Регистрация через M2.register — попадает в категорию M2. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.label',
        tagName: 'component',
        cmptype: 'Label',
        caption: 'Label (M2)',
        subCategory: 'Display',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Label');
            el.setAttribute('caption', 'Label');
            return el;
        },

        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview-m2-label';
            span.textContent = el.getAttribute('caption') || '';
            if (el.getAttribute('visible') === 'false') span.style.display = 'none';
            return span;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            { type: 'separator', caption: 'Label' },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
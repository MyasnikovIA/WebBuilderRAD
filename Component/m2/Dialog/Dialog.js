/* M2 Dialog — диалоговое окно. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.dialog', tagName: 'component', cmptype: 'Dialog',
        caption: 'Dialog (M2)', subCategory: 'Containers', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Dialog');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Заголовок');
            el.setAttribute('content', 'Содержимое');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-dialog';
            wrap.style.border = '1px solid #999';
            wrap.style.borderRadius = '4px';
            wrap.style.background = '#fff';
            wrap.style.boxShadow = '0 2px 8px rgba(0,0,0,.2)';
            wrap.style.minWidth = '220px';
            var head = doc.createElement('div');
            head.textContent = el.getAttribute('caption') || 'Заголовок';
            head.style.background = '#e0e0e0';
            head.style.padding = '6px 10px';
            head.style.fontWeight = 'bold';
            head.style.borderBottom = '1px solid #ccc';
            wrap.appendChild(head);
            var body = doc.createElement('div');
            body.textContent = el.getAttribute('content') || 'Содержимое';
            body.style.padding = '10px';
            wrap.appendChild(body);
            var foot = doc.createElement('div');
            foot.style.padding = '6px 10px';
            foot.style.borderTop = '1px solid #ccc';
            foot.style.textAlign = 'right';
            foot.innerHTML = '<button disabled>OK</button> <button disabled>Cancel</button>';
            wrap.appendChild(foot);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'Dialog' },
            { name: 'caption',        caption: 'Caption',        type: 'string',  attr: true },
            { name: 'content',        caption: 'Content',        type: 'string',  attr: true },
            { name: 'show_buttons',   caption: 'Show Buttons',   type: 'boolean', attr: true },
            { name: 'agree_caption',  caption: 'Agree Caption',  type: 'string',  attr: true },
            { name: 'cancel_caption', caption: 'Cancel Caption', type: 'string',  attr: true }
        ],
        events: [], styles: []
    });

})(window);
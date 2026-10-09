/* M2 ButtonEdit — поле ввода с кнопкой выбора. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.buttonedit', tagName: 'component', cmptype: 'ButtonEdit',
        caption: 'ButtonEdit (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'ButtonEdit');
            el.setAttribute('name', '');
            el.setAttribute('kind', 'normal');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-buttonedit';
            wrap.style.display = 'inline-flex';
            wrap.style.alignItems = 'center';
            wrap.style.border = '1px solid #b0b0b0';
            wrap.style.borderRadius = '3px';
            wrap.style.background = '#fff';
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.disabled = true;
            inp.value = el.getAttribute('value') || el.getAttribute('caption') || '';
            inp.placeholder = el.getAttribute('placeholder') || '';
            inp.style.border = '0';
            inp.style.flex = '1';
            inp.style.padding = '3px 6px';
            wrap.appendChild(inp);
            var btn = doc.createElement('span');
            btn.textContent = '…';
            btn.style.padding = '0 6px';
            btn.style.borderLeft = '1px solid #ccc';
            btn.style.background = '#f0f0f0';
            wrap.appendChild(btn);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'ButtonEdit' },
            { name: 'kind',        caption: 'Kind',        type: 'enum',    attr: true,
                values: ['normal', 'multiline', 'tagged'] },
            { name: 'value',       caption: 'Value',       type: 'string',  attr: true },
            { name: 'caption',     caption: 'Caption',     type: 'string',  attr: true },
            { name: 'placeholder', caption: 'Placeholder', type: 'string',  attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'boolean', attr: true },
            { name: 'clearbutton', caption: 'ClearButton', type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);
/* cmpEdit — текстовое поле. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.edit', tagName: 'cmpEdit', caption: 'Edit',
        attrs: { name: '', width: '200px' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-edit';
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.placeholder = el.getAttribute('placeholder') || el.getAttribute('name') || '';
            inp.value = el.getAttribute('value') || '';
            if (el.getAttribute('readonly') === 'true') inp.readOnly = true;
            inp.style.width = el.getAttribute('width') || '200px';
            wrap.appendChild(inp);
            return wrap;
        },
        properties: [
            { name: 'name',        caption: 'Name',        type: 'string', attr: true },
            { name: 'value',       caption: 'Value',       type: 'string', attr: true },
            { name: 'data',        caption: 'Data',        type: 'string', attr: true },
            { name: 'placeholder', caption: 'Placeholder', type: 'string', attr: true },
            { name: 'width',       caption: 'Width',       type: 'string', attr: true },
            { name: 'type',        caption: 'Type',        type: 'string', attr: true },
            { name: 'maxlength',   caption: 'MaxLength',   type: 'string', attr: true },
            { name: 'format',      caption: 'Format',      type: 'string', attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'string', attr: true }
        ]
    });

})(window);
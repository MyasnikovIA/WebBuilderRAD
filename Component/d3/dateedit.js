/* cmpDateEdit — поле даты. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.dateedit', tagName: 'cmpDateEdit', caption: 'DateEdit',
        attrs: { name: '', width: '120px' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-edit';
            var inp = doc.createElement('input');
            inp.type = 'date';
            inp.style.width = el.getAttribute('width') || '120px';
            wrap.appendChild(inp);
            return wrap;
        },
        properties: [
            { name: 'name',      caption: 'Name',     type: 'string', attr: true },
            { name: 'value',     caption: 'Value',    type: 'string', attr: true },
            { name: 'width',     caption: 'Width',    type: 'string', attr: true },
            { name: 'format',    caption: 'Format',   type: 'string', attr: true },
            { name: 'mask_type', caption: 'MaskType', type: 'string', attr: true }
        ]
    });

})(window);
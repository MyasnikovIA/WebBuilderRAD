/* cmpDependences — зависимости от других контролов. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.dependences', tagName: 'cmpDependences', caption: 'Dependences',
        icon: 'images/icon.png',
        attrs: { required: '', depend: '' },
        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-dependences';
            span.textContent = '⇄ req:' + (el.getAttribute('required') || '')
                + ' dep:' + (el.getAttribute('depend') || '');
            return span;
        },
        properties: [
            { name: 'required', caption: 'Required', type: 'string', attr: true },
            { name: 'depend',   caption: 'Depend',   type: 'string', attr: true }
        ]
    });

})(window);
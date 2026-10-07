/* cmpSubForm — подключение вложенной формы по пути. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.subform', tagName: 'cmpSubForm', caption: 'SubForm',
        icon: 'images/icon.png',
        attrs: { path: '' },
        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-subform';
            wrap.textContent = 'SubForm: ' + (el.getAttribute('path') || '');
            return wrap;
        },
        properties: [
            { name: 'path', caption: 'Path', type: 'string', attr: true }
        ]
    });

})(window);
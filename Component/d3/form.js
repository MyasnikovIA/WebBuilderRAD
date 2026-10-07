/* cmpForm — корневой контейнер D3-страницы.
   unique: true, hidden: true (в палитре не показывается,
   создаётся через Canvas.setRootType('cmpForm')). */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.form', tagName: 'cmpForm', caption: 'Form',
        unique: true, hidden: true,
        attrs: { 'class': 'd3form formBackground' },
        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-form';
            var head = doc.createElement('div');
            head.className = 'd3-preview-form-cap';
            head.textContent = el.getAttribute('caption') || 'cmpForm';
            wrap.appendChild(head);
            var bodyEl = doc.createElement('div');
            bodyEl.className = 'd3-preview-form-body';
            bodyEl.textContent = '(form content)';
            wrap.appendChild(bodyEl);
            return wrap;
        },
        properties: [
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'class',   caption: 'Class',   type: 'string', attr: true }
        ]
    });

})(window);
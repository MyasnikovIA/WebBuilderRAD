/* cmpComboBox — выпадающий список.
   Превью собирает дочерние cmpComboItem и показывает их
   как <option> в <select>. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.combobox', tagName: 'cmpComboBox', caption: 'ComboBox',
        attrs: { name: '', width: '200px' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-combo';

            var sel = doc.createElement('select');
            sel.style.width = el.getAttribute('width') || '200px';

            var count = 0;
            var items = el.children;
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                if (!it.tagName) continue;
                if (it.tagName.toLowerCase() !== 'cmpcomboitem') continue;

                var opt = doc.createElement('option');
                var ds = it.getAttribute('dataset') || '';
                var d  = it.getAttribute('data')    || '';
                opt.textContent = ds + (d ? '  [' + d + ']' : '');
                sel.appendChild(opt);
                count++;
            }
            if (count === 0) {
                var empty = doc.createElement('option');
                empty.textContent = '(no items)';
                sel.appendChild(empty);
            }
            wrap.appendChild(sel);
            return wrap;
        },
        properties: [
            { name: 'name',  caption: 'Name',  type: 'string', attr: true },
            { name: 'value', caption: 'Value', type: 'string', attr: true },
            { name: 'width', caption: 'Width', type: 'string', attr: true },
            { name: 'data',  caption: 'Data',  type: 'string', attr: true }
        ]
    });

})(window);
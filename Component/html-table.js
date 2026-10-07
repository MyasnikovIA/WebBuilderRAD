(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;
    function sch() { return S.defaultSchema(); }

    R.register({ id: 'table.table', category: 'Tables', caption: 'Table', tagName: 'table',
        create: function (doc) {
            var el = doc.createElement('table');
            el.style.borderCollapse = 'collapse';
            el.style.border = '1px solid #999';
            return el;
        }, schema: sch() });

    R.register({ id: 'table.thead', category: 'Tables', caption: 'THead', tagName: 'thead',
        create: function (doc) { return doc.createElement('thead'); }, schema: sch() });

    R.register({ id: 'table.tbody', category: 'Tables', caption: 'TBody', tagName: 'tbody',
        create: function (doc) { return doc.createElement('tbody'); }, schema: sch() });

    R.register({ id: 'table.tfoot', category: 'Tables', caption: 'TFoot', tagName: 'tfoot',
        create: function (doc) { return doc.createElement('tfoot'); }, schema: sch() });

    R.register({ id: 'table.tr', category: 'Tables', caption: 'Row', tagName: 'tr',
        create: function (doc) {
            var tr = doc.createElement('tr');
            for (var i = 0; i < 2; i++) {
                var td = doc.createElement('td');
                td.textContent = 'Cell';
                td.style.border = '1px solid #ccc';
                td.style.padding = '4px 8px';
                tr.appendChild(td);
            }
            return tr;
        }, schema: sch() });

    R.register({ id: 'table.td', category: 'Tables', caption: 'Cell', tagName: 'td',
        create: function (doc) {
            var td = doc.createElement('td');
            td.textContent = 'Cell';
            td.style.border = '1px solid #ccc';
            td.style.padding = '4px 8px';
            return td;
        }, schema: sch() });

    R.register({ id: 'table.th', category: 'Tables', caption: 'Header Cell', tagName: 'th',
        create: function (doc) {
            var th = doc.createElement('th');
            th.textContent = 'Header';
            th.style.border = '1px solid #999';
            th.style.padding = '4px 8px';
            th.style.background = '#eee';
            return th;
        }, schema: sch() });
})(window);
/* Списки HTML. */
(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;

    function sch(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    R.register({
        id: 'html.ul', category: 'HTML', subCategory: 'Lists', caption: 'UL', tagName: 'ul',
        create: function (doc) {
            var el = doc.createElement('ul');
            el.style.paddingLeft = '20px';
            el.style.margin = '4px 0';
            ['Item 1', 'Item 2', 'Item 3'].forEach(function (t) {
                var li = doc.createElement('li'); li.textContent = t; el.appendChild(li);
            });
            return el;
        },
        schema: sch()
    });

    R.register({
        id: 'html.ol', category: 'HTML', subCategory: 'Lists', caption: 'OL', tagName: 'ol',
        create: function (doc) {
            var el = doc.createElement('ol');
            el.style.paddingLeft = '20px';
            el.style.margin = '4px 0';
            ['Item 1', 'Item 2', 'Item 3'].forEach(function (t) {
                var li = doc.createElement('li'); li.textContent = t; el.appendChild(li);
            });
            return el;
        },
        schema: sch()
    });

    R.register({
        id: 'html.li', category: 'HTML', subCategory: 'Lists', caption: 'LI', tagName: 'li',
        create: function (doc) {
            var el = doc.createElement('li');
            el.textContent = 'List item';
            return el;
        },
        schema: sch()
    });

    R.register({
        id: 'html.dl', category: 'HTML', subCategory: 'Lists', caption: 'DL', tagName: 'dl',
        create: function (doc) {
            var el = doc.createElement('dl');
            var dt = doc.createElement('dt'); dt.textContent = 'Term';
            var dd = doc.createElement('dd'); dd.textContent = 'Definition';
            dt.style.fontWeight = 'bold';
            dd.style.margin = '2px 0 8px 16px';
            el.appendChild(dt); el.appendChild(dd);
            return el;
        },
        schema: sch()
    });

    R.register({
        id: 'html.dt', category: 'HTML', subCategory: 'Lists', caption: 'DT', tagName: 'dt',
        create: function (doc) {
            var el = doc.createElement('dt');
            el.textContent = 'Term';
            el.style.fontWeight = 'bold';
            return el;
        },
        schema: sch()
    });

    R.register({
        id: 'html.dd', category: 'HTML', subCategory: 'Lists', caption: 'DD', tagName: 'dd',
        create: function (doc) {
            var el = doc.createElement('dd');
            el.textContent = 'Definition';
            el.style.margin = '2px 0 8px 16px';
            return el;
        },
        schema: sch()
    });

})(window);
/* Семантические контейнеры и структура HTML. */
(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;

    function sch(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }
    function reg(id, caption, tagName, opts) {
        opts = opts || {};
        R.register({
            id: id, category: 'HTML', subCategory: 'Layout',
            caption: caption, tagName: tagName,
            create: opts.create || function (doc) {
                var el = doc.createElement(tagName);
                el.textContent = opts.text || caption;
                if (opts.style) for (var k in opts.style) el.style[k] = opts.style[k];
                return el;
            },
            schema: sch(opts.props)
        });
    }

    reg('html.section',    'Section',    'section',    { style: { padding: '8px', border: '1px dashed #ccc', minHeight: '40px' } });
    reg('html.article',    'Article',    'article',    { style: { padding: '8px', border: '1px dashed #ccc' } });
    reg('html.aside',      'Aside',      'aside',      { style: { padding: '8px', border: '1px dashed #ccc' } });
    reg('html.header',     'Header',     'header',     { style: { padding: '6px', background: '#f5f5f5' } });
    reg('html.footer',     'Footer',     'footer',     { style: { padding: '6px', background: '#f5f5f5' } });
    reg('html.nav',        'Nav',        'nav',        { style: { padding: '6px', background: '#fafafa' } });
    reg('html.main',       'Main',       'main',       { style: { padding: '8px' } });
    reg('html.figure',     'Figure',     'figure',     { style: { display: 'inline-block', padding: '8px', border: '1px solid #ddd' } });
    reg('html.figcaption', 'FigCaption', 'figcaption', { style: { fontSize: '11px', color: '#666' } });
    reg('html.blockquote', 'Blockquote', 'blockquote', { text: 'Цитата', style: { borderLeft: '3px solid #1e88e5', paddingLeft: '8px', color: '#444', margin: '8px 0' } });
    reg('html.pre',        'Pre',        'pre',        { text: 'preformatted\ntext', style: { background: '#f5f5f5', padding: '8px', fontFamily: 'Consolas, monospace', fontSize: '12px' } });
    reg('html.address',    'Address',    'address',    { text: 'Адрес', style: { fontStyle: 'italic' } });

    reg('html.details', 'Details', 'details', {
        create: function (doc) {
            var el = doc.createElement('details');
            el.setAttribute('open', '');
            el.style.border = '1px solid #ddd';
            el.style.padding = '6px';
            var sm = doc.createElement('summary');
            sm.textContent = 'Заголовок';
            var p = doc.createElement('p');
            p.textContent = 'Содержимое';
            p.style.margin = '6px 0 0';
            el.appendChild(sm); el.appendChild(p);
            return el;
        }
    });
    reg('html.summary', 'Summary', 'summary', { text: 'Заголовок' });

    reg('html.dialog', 'Dialog', 'dialog', {
        create: function (doc) {
            var el = doc.createElement('dialog');
            el.setAttribute('open', '');
            el.style.padding = '12px';
            el.style.border = '1px solid #999';
            el.textContent = 'Dialog';
            return el;
        }
    });

})(window);
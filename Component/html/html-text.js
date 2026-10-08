/* Текстовые элементы HTML. */
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
            id: id, category: 'HTML', subCategory: 'Text',
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

    reg('html.h3',     'H3',         'h3',     { text: 'Heading 3' });
    reg('html.h4',     'H4',         'h4',     { text: 'Heading 4' });
    reg('html.h5',     'H5',         'h5',     { text: 'Heading 5' });
    reg('html.h6',     'H6',         'h6',     { text: 'Heading 6' });
    reg('html.strong', 'Strong',     'strong', { text: 'Strong' });
    reg('html.em',     'Emphasis',   'em',     { text: 'Emphasis' });
    reg('html.b',      'Bold',       'b',      { text: 'Bold' });
    reg('html.i',      'Italic',     'i',      { text: 'Italic' });
    reg('html.u',      'Underline',  'u',      { text: 'Underline' });
    reg('html.s',      'Strike',     's',      { text: 'Strike' });
    reg('html.del',    'Deleted',    'del',    { text: 'Deleted' });
    reg('html.ins',    'Inserted',   'ins',    { text: 'Inserted' });
    reg('html.small',  'Small',      'small',  { text: 'Small text' });
    reg('html.mark',   'Mark',       'mark',   { text: 'Highlighted' });
    reg('html.sub',    'Sub',        'sub',    { text: 'sub' });
    reg('html.sup',    'Sup',        'sup',    { text: 'sup' });

    reg('html.code', 'Code', 'code', {
        text: 'code',
        style: { fontFamily: 'Consolas, monospace', background: '#f5f5f5', padding: '1px 4px' }
    });
    reg('html.kbd', 'Kbd', 'kbd', {
        text: 'Ctrl+K',
        style: { fontFamily: 'Consolas, monospace', background: '#eee', border: '1px solid #ccc', padding: '1px 4px', borderRadius: '2px' }
    });
    reg('html.samp', 'Samp', 'samp', {
        text: 'sample output',
        style: { fontFamily: 'Consolas, monospace' }
    });
    reg('html.var', 'Var', 'var', {
        text: 'variable',
        style: { fontStyle: 'italic' }
    });
    reg('html.q', 'Quote', 'q', { text: 'inline quote' });
    reg('html.cite', 'Cite', 'cite', {
        text: 'Source',
        style: { fontStyle: 'italic' }
    });
    reg('html.abbr', 'Abbr', 'abbr', {
        text: 'HTML',
        props: [{ name: 'title', caption: 'Title (tooltip)', type: 'string', attr: true }]
    });
    reg('html.time', 'Time', 'time', {
        text: '2025-01-01',
        props: [{ name: 'datetime', caption: 'Datetime', type: 'string', attr: true }]
    });

})(window);
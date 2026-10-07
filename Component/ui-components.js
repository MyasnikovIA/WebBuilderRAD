(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;
    function schema(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    R.register({ id: 'ui.button', category: 'UI', caption: 'StyledButton', tagName: 'button', cmptype: 'ui.button',
        create: function (doc) {
            var el = doc.createElement('button');
            el.textContent = 'Click me';
            el.style.padding = '8px 16px';
            el.style.border = '0';
            el.style.borderRadius = '4px';
            el.style.background = '#1e88e5';
            el.style.color = '#fff';
            el.style.cursor = 'pointer';
            return el;
        }, schema: schema([{ name: 'disabled', caption: 'Disabled', type: 'boolean' }]) });

    R.register({ id: 'ui.card', category: 'UI', caption: 'Card', tagName: 'div', cmptype: 'ui.card',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.display = 'inline-block';
            el.style.background = '#fff';
            el.style.border = '1px solid #e0e0e0';
            el.style.borderRadius = '6px';
            el.style.padding = '12px';
            el.style.minWidth = '180px';
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            var t = doc.createElement('h3');
            t.textContent = 'Card title';
            t.style.margin = '0 0 6px 0';
            t.style.fontSize = '14px';
            var p = doc.createElement('p');
            p.textContent = 'Card content...';
            p.style.margin = '0';
            p.style.color = '#666';
            p.style.fontSize = '12px';
            el.appendChild(t); el.appendChild(p);
            return el;
        }, schema: S.defaultSchema() });

    R.register({ id: 'ui.badge', category: 'UI', caption: 'Badge', tagName: 'span', cmptype: 'ui.badge',
        create: function (doc) {
            var el = doc.createElement('span');
            el.textContent = 'NEW';
            el.style.display = 'inline-block';
            el.style.padding = '2px 8px';
            el.style.borderRadius = '10px';
            el.style.background = '#e53935';
            el.style.color = '#fff';
            el.style.fontSize = '11px';
            el.style.fontWeight = 'bold';
            return el;
        }, schema: S.defaultSchema() });
})(window);
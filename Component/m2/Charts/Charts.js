/* M2 Charts — график (заглушка в IDE). */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.charts', tagName: 'component', cmptype: 'Charts',
        caption: 'Charts (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Charts');
            el.setAttribute('name', '');
            el.setAttribute('type', 'bar');
            return el;
        },

        preview: function (el, doc) {
            var type = el.getAttribute('type') || 'bar';
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-charts';
            wrap.style.border = '1px solid #ccc';
            wrap.style.padding = '4px';
            wrap.style.background = '#fafafa';
            var cap = doc.createElement('div');
            cap.textContent = 'Charts: ' + type;
            cap.style.fontSize = '11px';
            cap.style.color = '#666';
            cap.style.marginBottom = '4px';
            wrap.appendChild(cap);
            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = doc.createElementNS(svgNS, 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '80');
            svg.setAttribute('viewBox', '0 0 200 80');
            if (type === 'pie') {
                var c = doc.createElementNS(svgNS, 'circle');
                c.setAttribute('cx', '100');
                c.setAttribute('cy', '40');
                c.setAttribute('r', '30');
                c.setAttribute('fill', '#1e88e5');
                c.setAttribute('stroke', '#fff');
                svg.appendChild(c);
            } else {
                for (var i = 0; i < 6; i++) {
                    var r = doc.createElementNS(svgNS, 'rect');
                    r.setAttribute('x', String(20 + i * 28));
                    r.setAttribute('y', String(70 - (10 + i * 8)));
                    r.setAttribute('width', '20');
                    r.setAttribute('height', String(10 + i * 8));
                    r.setAttribute('fill', '#1e88e5');
                    svg.appendChild(r);
                }
            }
            wrap.appendChild(svg);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },
            { type: 'separator', caption: 'Charts' },
            { name: 'type',      caption: 'Type',      type: 'enum',   attr: true,
                values: ['bar', 'pie', 'rowbar'] },
            { name: 'dataset',   caption: 'DataSet',   type: 'string', attr: true },
            { name: 'dimension', caption: 'Dimension', type: 'string', attr: true },
            { name: 'group',     caption: 'Group',     type: 'string', attr: true },
            { name: 'reduce',    caption: 'Reduce',    type: 'enum',   attr: true,
                values: ['count', 'sum'] }
        ],
        events: [], styles: []
    });

})(window);
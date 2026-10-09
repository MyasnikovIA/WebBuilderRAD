/* M2 LinksViewer — граф связей. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.linksviewer', tagName: 'component', cmptype: 'LinksViewer',
        caption: 'LinksViewer (M2)', subCategory: 'Display', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'LinksViewer');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-linksviewer';
            wrap.style.border = '1px solid #ccc';
            wrap.style.padding = '4px';
            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = doc.createElementNS(svgNS, 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '120');
            svg.setAttribute('viewBox', '0 0 200 120');
            var pts = [[100, 20], [40, 100], [160, 100]];
            var paths = [[0, 1], [1, 2], [2, 0]];
            for (var i = 0; i < paths.length; i++) {
                var p = doc.createElementNS(svgNS, 'line');
                p.setAttribute('x1', String(pts[paths[i][0]][0]));
                p.setAttribute('y1', String(pts[paths[i][0]][1]));
                p.setAttribute('x2', String(pts[paths[i][1]][0]));
                p.setAttribute('y2', String(pts[paths[i][1]][1]));
                p.setAttribute('stroke', '#1e88e5');
                p.setAttribute('stroke-width', '1');
                svg.appendChild(p);
            }
            var labels = ['A', 'B', 'C'];
            for (var j = 0; j < pts.length; j++) {
                var c = doc.createElementNS(svgNS, 'circle');
                c.setAttribute('cx', String(pts[j][0]));
                c.setAttribute('cy', String(pts[j][1]));
                c.setAttribute('r', '10');
                c.setAttribute('fill', '#e3f2fd');
                c.setAttribute('stroke', '#1e88e5');
                svg.appendChild(c);
                var t = doc.createElementNS(svgNS, 'text');
                t.setAttribute('x', String(pts[j][0]));
                t.setAttribute('y', String(pts[j][1] + 4));
                t.setAttribute('text-anchor', 'middle');
                t.setAttribute('font-size', '11');
                t.textContent = labels[j];
                svg.appendChild(t);
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
            { type: 'separator', caption: 'LinksViewer' },
            { name: 'value', caption: 'Value (JSON)', type: 'code', attr: true }
        ],
        events: [], styles: []
    });

})(window);
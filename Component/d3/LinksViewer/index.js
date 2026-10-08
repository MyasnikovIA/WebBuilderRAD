/* cmpLinksViewer — граф связей (force-directed layout на D3 v3).

   Серверный контрол: LinksViewerCtrl.inc (class LinksViewer).
   Клиентский контрол: LinksViewer.js (D3Api.LinksViewerCtrl).

   Серверный Show():
     <div class="linkviewver-div" …attrs… …events…>
       <svg class="linkviewver-svg"></svg>
     </div>

   Плюс два CSS-файла подключаются через include_css:
     - Components/LinksViewer/css/links_shapes.css
     - Components/LinksViewer/css/LinksViewer.css

   В рантайме D3 v3 загружается асинхронно через D3Api.include_js,
   после чего setValue(array) строит force-граф:
     - marker-end на <path> для каждой link_type;
     - <circle> для каждой вершины, класс = source_type/target_type;
     - <text> с именем узла;
     - force.linkDistance(150), force.charge(-1200).

   Значение value — массив объектов:
     [{source, target, link_type, source_type, target_type}, …]

   В IDE: рисуем статичный SVG-скелет (узлы + дуги-стрелки + подписи),
   чтобы пользователь видел структуру контрола на холсте. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Парсит value (JSON-строку или массив) и возвращает массив links. */
    function parseLinks(raw) {
        if (!raw) return [];
        if (typeof raw === 'object' && raw.length !== undefined) return raw;
        try {
            var v = JSON.parse(raw);
            return Array.isArray(v) ? v : [];
        } catch (e) {
            return [];
        }
    }

    /* Извлекает уникальные имена узлов из массива links. */
    function collectNodes(links) {
        var seen = {};
        var out = [];
        for (var i = 0; i < links.length; i++) {
            var l = links[i] || {};
            [l.source, l.target].forEach(function (n) {
                if (n == null) return;
                var key = String(n);
                if (!seen[key]) { seen[key] = 1; out.push(key); }
            });
        }
        return out;
    }

    D3.register({
        id: 'd3.linksviewer', tagName: 'cmpLinksViewer', caption: 'LinksViewer',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmplinksviewer');
            el.setAttribute('data-wb-tag', 'cmpLinksViewer');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-linksviewer';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            /* Пробрасываем width / height на preview-узел. */
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            /* SVG с фиксированным viewBox: статичное представление графа. */
            var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'linkviewver-svg');
            svg.setAttribute('viewBox', '0 0 300 160');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');

            /* defs/marker — стрелка как в рантайме */
            var defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
            var marker = doc.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'lv-arrow');
            marker.setAttribute('viewBox', '0 -5 10 10');
            marker.setAttribute('refX', '15');
            marker.setAttribute('refY', '-1.5');
            marker.setAttribute('markerWidth', '6');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('orient', 'auto');
            var mpath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
            mpath.setAttribute('d', 'M0,-5L10,0L0,5');
            marker.appendChild(mpath);
            defs.appendChild(marker);
            svg.appendChild(defs);

            /* Пытаемся построить настоящий статичный граф, если value задан. */
            var links = parseLinks(el.getAttribute('value'));
            var nodes = collectNodes(links);

            /* Фиксированные позиции по кругу для наглядности. */
            var cx = 150, cy = 80, R = 55;

            function pos(i, n) {
                var a = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
                return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
            }

            /* Если данных нет — рисуем демо из 3 узлов и 3 стрелок. */
            var demo = nodes.length === 0;
            if (demo) {
                nodes = ['A', 'B', 'C'];
                links = [
                    { source: 'A', target: 'B', link_type: 'link' },
                    { source: 'B', target: 'C', link_type: 'link' },
                    { source: 'C', target: 'A', link_type: 'link' }
                ];
            }

            var positions = {};
            for (var i = 0; i < nodes.length; i++) {
                positions[nodes[i]] = pos(i, nodes.length);
            }

            /* Пути (links) */
            for (var j = 0; j < links.length; j++) {
                var l = links[j] || {};
                var p1 = positions[String(l.source)];
                var p2 = positions[String(l.target)];
                if (!p1 || !p2) continue;

                var path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', 'link' + (l.link_type ? ' ' + l.link_type : ''));
                path.setAttribute('marker-end', 'url(#lv-arrow)');
                path.setAttribute(
                    'd',
                    'M' + p1.x + ',' + p1.y +
                    'A' + (R / 2) + ',' + (R / 2) +
                    ' 0 0,1 ' + p2.x + ',' + p2.y
                );
                svg.appendChild(path);
            }

            /* Кружки-вершины */
            for (var k = 0; k < nodes.length; k++) {
                var p = positions[nodes[k]];
                var c = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttribute('cx', p.x);
                c.setAttribute('cy', p.y);
                c.setAttribute('r', '6');
                c.setAttribute('class', 'circle');
                svg.appendChild(c);

                var t = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
                t.setAttribute('x', p.x + 8);
                t.setAttribute('y', p.y + 3);
                t.textContent = nodes[k];
                svg.appendChild(t);
            }

            /* Метка «demo» в углу, чтобы пользователь понимал, что это превью. */
            if (demo) {
                var badge = doc.createElement('div');
                badge.className = 'd3-preview-linksviewer-badge';
                badge.textContent = 'demo';
                wrap.appendChild(badge);
            }

            wrap.appendChild(svg);
            return wrap;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- LinksViewer --- */
            { type: 'separator', caption: 'LinksViewer' },
            {
                name: 'value',
                caption: 'Value (JSON: [{source,target,link_type,…}])',
                type: 'code',
                get: function (el) { return el.getAttribute('value') || ''; },
                set: function (el, v) {
                    if (v == null || v === '') el.removeAttribute('value');
                    else el.setAttribute('value', String(v));
                }
            }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
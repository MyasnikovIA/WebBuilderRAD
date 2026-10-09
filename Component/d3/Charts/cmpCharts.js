/* cmpCharts — график на базе dc.js + crossfilter + d3.

   Серверный контрол: ChartsCtrl.inc
   Клиентский контрол: Charts.js

   В серверном коде компонент выводит <div class="ctrl_chart">,
   внутри которого спрятан <textarea> с настройками графика.
   Клиентский ChartsCtrl при инициализации:
     * подгружает crossfilter.js, d3.js, dc.js;
     * читает настройки из <textarea>;
     * строит график по атрибутам type / dimension / group / reduce / dataset.

   Поддерживаемые типы графиков: bar, pie, rowbar.
   Способы вычисления значений: count (по умолчанию), sum.

   Превью в редакторе показывает статичную заглушку с иконкой
   выбранного типа — реального crossfilter в редакторе нет. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Рисуем заглушку графика — визуально похожую на итоговый вид. */
    function drawPlaceholder(doc, type, title) {
        var wrap = doc.createElement('div');
        wrap.className = 'd3-chart d3-chart-preview d3-chart-preview-' + (type || 'bar');

        /* Заголовок */
        var cap = doc.createElement('div');
        cap.className = 'd3-chart-preview-cap';
        cap.textContent = title || ('Charts: ' + (type || 'bar'));
        wrap.appendChild(cap);

        /* SVG-заглушка */
        var svgNS = 'http://www.w3.org/2000/svg';
        var svg = doc.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 300 160');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        if (type === 'pie') {
            /* Круг с 4 секторами */
            var colors = ['#1e88e5', '#43a047', '#fb8c00', '#e53935'];
            var startAngles = [0, 90, 200, 300];
            var endAngles = [90, 200, 300, 360];
            var cx = 150, cy = 80, r = 60;
            for (var i = 0; i < 4; i++) {
                var s = (startAngles[i] - 90) * Math.PI / 180;
                var e = (endAngles[i] - 90) * Math.PI / 180;
                var x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
                var x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
                var large = (endAngles[i] - startAngles[i]) > 180 ? 1 : 0;
                var path = doc.createElementNS(svgNS, 'path');
                path.setAttribute('d', 'M' + cx + ',' + cy +
                    ' L' + x1.toFixed(2) + ',' + y1.toFixed(2) +
                    ' A' + r + ',' + r + ' 0 ' + large + ',1 ' +
                    x2.toFixed(2) + ',' + y2.toFixed(2) + ' Z');
                path.setAttribute('fill', colors[i]);
                path.setAttribute('stroke', '#fff');
                path.setAttribute('stroke-width', '1');
                svg.appendChild(path);
            }
        } else if (type === 'rowbar') {
            /* Горизонтальные полоски */
            var data = [0.9, 0.7, 0.5, 0.35, 0.2];
            for (var j = 0; j < data.length; j++) {
                var w = data[j] * 200;
                var y = 20 + j * 26;
                var rect = doc.createElementNS(svgNS, 'rect');
                rect.setAttribute('x', 40);
                rect.setAttribute('y', y);
                rect.setAttribute('width', w.toFixed(2));
                rect.setAttribute('height', 18);
                rect.setAttribute('fill', '#1e88e5');
                svg.appendChild(rect);

                var lbl = doc.createElementNS(svgNS, 'text');
                lbl.setAttribute('x', 6);
                lbl.setAttribute('y', y + 14);
                lbl.setAttribute('font-size', '11');
                lbl.setAttribute('fill', '#555');
                lbl.textContent = 'row' + (j + 1);
                svg.appendChild(lbl);
            }
        } else {
            /* bar — вертикальные столбики */
            var vals = [0.3, 0.6, 0.9, 0.45, 0.75, 0.5];
            var barW = 30;
            for (var k = 0; k < vals.length; k++) {
                var h = vals[k] * 120;
                var x = 30 + k * 42;
                var y2 = 150 - h;
                var r2 = doc.createElementNS(svgNS, 'rect');
                r2.setAttribute('x', x);
                r2.setAttribute('y', y2.toFixed(2));
                r2.setAttribute('width', barW);
                r2.setAttribute('height', h.toFixed(2));
                r2.setAttribute('fill', '#1e88e5');
                svg.appendChild(r2);
            }

            /* Ось */
            var axis = doc.createElementNS(svgNS, 'line');
            axis.setAttribute('x1', 15);
            axis.setAttribute('y1', 150);
            axis.setAttribute('x2', 290);
            axis.setAttribute('y2', 150);
            axis.setAttribute('stroke', '#999');
            axis.setAttribute('stroke-width', '1');
            svg.appendChild(axis);
        }

        wrap.appendChild(svg);
        return wrap;
    }

    D3.register({
        id: 'd3.charts', tagName: 'cmpCharts', caption: 'Charts',
        subCategory: 'Controls',
        icon: 'images/icon.png',
        nameTemplate: 'charts',
        previewCss: ['css/preview.css'],
        attrs: { type: 'bar', name: '' },

        preview: function (el, doc) {
            if (el.getAttribute('visible') === 'false') {
                var hidden = doc.createElement('span');
                hidden.style.display = 'none';
                return hidden;
            }

            var type = el.getAttribute('type') || 'bar';
            var title = el.getAttribute('name') ||
                el.getAttribute('caption') ||
                ('Charts: ' + type);

            var wrap = drawPlaceholder(doc, type, title);

            /* Размеры */
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width  = /^\d+$/.test(w) ? w + 'px' : w;
            if (h) wrap.style.height = /^\d+$/.test(h) ? h + 'px' : h;

            return wrap;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',       caption: 'Id',       type: 'string', attr: true },
            { name: 'class',    caption: 'Class',    type: 'string', attr: true },
            { name: 'style',    caption: 'Style',    type: 'string', attr: true },
            { name: 'title',    caption: 'Title',    type: 'string', attr: true },
            { name: 'tabindex', caption: 'TabIndex', type: 'number', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true, default: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true, default: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Charts --- */
            { type: 'separator', caption: 'Charts' },
            { name: 'type',        caption: 'Type',        type: 'enum',   attr: true,
                values: ['bar', 'pie', 'rowbar'] },
            { name: 'dataset',     caption: 'DataSet',     type: 'string', attr: true },
            { name: 'dimension',   caption: 'Dimension',   type: 'string', attr: true },
            { name: 'group',       caption: 'Group',       type: 'string', attr: true },
            { name: 'reduce',      caption: 'Reduce',      type: 'enum',   attr: true,
                values: ['count', 'sum'] },
            { name: 'datamethod',  caption: 'DataMethod',  type: 'string', attr: true },

            /* Настройки dc.js, передаваемые в eval() внутри Charts.js.
               Пример: chart.margins({top:10,right:10,bottom:20,left:40}); */
            D3.cdataProp('Settings')
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' },
            { name: 'onmousedown', caption: 'OnMouseDown', type: 'code' },
            { name: 'onmouseup',   caption: 'OnMouseUp',   type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
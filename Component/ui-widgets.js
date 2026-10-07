/* Расширенные UI-виджеты. */
(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;

    function sch(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    R.register({
        id: 'ui.alert', category: 'UI', caption: 'Alert', tagName: 'div', cmptype: 'ui.alert',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '8px';
            el.style.padding = '10px 14px';
            el.style.borderRadius = '4px';
            el.style.background = '#e3f2fd';
            el.style.color = '#0d47a1';
            el.style.border = '1px solid #90caf9';
            el.style.fontFamily = 'Segoe UI, sans-serif';
            el.style.fontSize = '13px';
            el.innerHTML = '<b style="font-size:16px">i</b><span>Текст сообщения</span>';
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.panel', category: 'UI', caption: 'Panel', tagName: 'div', cmptype: 'ui.panel',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.border = '1px solid #d0d0d0';
            el.style.borderRadius = '4px';
            el.style.overflow = 'hidden';
            el.style.background = '#fff';
            el.style.minWidth = '200px';
            var head = doc.createElement('div');
            head.textContent = 'Заголовок панели';
            head.style.padding = '8px 12px';
            head.style.background = '#f0f0f0';
            head.style.fontWeight = 'bold';
            head.style.borderBottom = '1px solid #d0d0d0';
            head.style.fontSize = '12px';
            var body = doc.createElement('div');
            body.textContent = 'Содержимое панели';
            body.style.padding = '12px';
            body.style.fontSize = '12px';
            el.appendChild(head); el.appendChild(body);
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.toolbar', category: 'UI', caption: 'Toolbar', tagName: 'div', cmptype: 'ui.toolbar',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '4px';
            el.style.background = '#f5f5f5';
            el.style.border = '1px solid #d0d0d0';
            el.style.padding = '4px 6px';
            el.style.borderRadius = '3px';
            ['A', 'B', 'C', 'D'].forEach(function (t) {
                var b = doc.createElement('button');
                b.type = 'button';
                b.textContent = t;
                b.style.padding = '4px 10px';
                b.style.border = '1px solid #b0b0b0';
                b.style.background = '#fafafa';
                b.style.cursor = 'pointer';
                b.style.fontSize = '12px';
                el.appendChild(b);
            });
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.breadcrumb', category: 'UI', caption: 'Breadcrumb', tagName: 'nav', cmptype: 'ui.breadcrumb',
        create: function (doc) {
            var el = doc.createElement('nav');
            el.style.fontFamily = 'Segoe UI, sans-serif';
            el.style.fontSize = '12px';
            el.style.color = '#555';
            el.innerHTML =
                '<a href="#" style="color:#1e88e5;text-decoration:none">Главная</a>' +
                '<span style="margin:0 6px">/</span>' +
                '<a href="#" style="color:#1e88e5;text-decoration:none">Каталог</a>' +
                '<span style="margin:0 6px">/</span>' +
                '<span>Текущая страница</span>';
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.pagination', category: 'UI', caption: 'Pagination', tagName: 'div', cmptype: 'ui.pagination',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.display = 'flex';
            el.style.gap = '2px';
            ['«', '1', '2', '3', '4', '5', '»'].forEach(function (t, i) {
                var b = doc.createElement('button');
                b.type = 'button';
                b.textContent = t;
                b.style.minWidth = '30px';
                b.style.padding = '4px 8px';
                b.style.border = '1px solid #b0b0b0';
                b.style.background = (i === 1) ? '#1e88e5' : '#fafafa';
                b.style.color = (i === 1) ? '#fff' : '#222';
                b.style.cursor = 'pointer';
                b.style.fontSize = '12px';
                el.appendChild(b);
            });
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.tabs', category: 'UI', caption: 'Tabs', tagName: 'div', cmptype: 'ui.tabs',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.fontFamily = 'Segoe UI, sans-serif';
            el.style.fontSize = '12px';
            var head = doc.createElement('div');
            head.style.display = 'flex';
            head.style.borderBottom = '1px solid #d0d0d0';
            ['Tab 1', 'Tab 2', 'Tab 3'].forEach(function (t, i) {
                var tab = doc.createElement('div');
                tab.textContent = t;
                tab.style.padding = '6px 14px';
                tab.style.cursor = 'pointer';
                tab.style.borderTop = '1px solid #d0d0d0';
                tab.style.borderLeft = '1px solid #d0d0d0';
                tab.style.borderRight = i === 2 ? '1px solid #d0d0d0' : 'none';
                tab.style.background = (i === 0) ? '#fff' : '#f0f0f0';
                tab.style.borderBottom = (i === 0) ? '1px solid #fff' : 'none';
                tab.style.marginBottom = '-1px';
                head.appendChild(tab);
            });
            var body = doc.createElement('div');
            body.textContent = 'Содержимое вкладки';
            body.style.padding = '12px';
            body.style.border = '1px solid #d0d0d0';
            body.style.borderTop = 'none';
            el.appendChild(head); el.appendChild(body);
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.accordion', category: 'UI', caption: 'Accordion', tagName: 'div', cmptype: 'ui.accordion',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.fontFamily = 'Segoe UI, sans-serif';
            el.style.fontSize = '12px';
            ['Раздел 1', 'Раздел 2', 'Раздел 3'].forEach(function (t, i) {
                var d = doc.createElement('details');
                if (i === 0) d.setAttribute('open', '');
                d.style.border = '1px solid #d0d0d0';
                d.style.borderTop = i === 0 ? '1px solid #d0d0d0' : 'none';
                var sm = doc.createElement('summary');
                sm.textContent = t;
                sm.style.padding = '6px 10px';
                sm.style.cursor = 'pointer';
                sm.style.background = '#f5f5f5';
                var p = doc.createElement('div');
                p.textContent = 'Содержимое раздела';
                p.style.padding = '8px 12px';
                d.appendChild(sm); d.appendChild(p);
                el.appendChild(d);
            });
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.progressbar', category: 'UI', caption: 'ProgressBar', tagName: 'div', cmptype: 'ui.progressbar',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.width = '220px';
            el.style.height = '14px';
            el.style.background = '#e0e0e0';
            el.style.borderRadius = '7px';
            el.style.overflow = 'hidden';
            var fill = doc.createElement('div');
            fill.style.width = '60%';
            fill.style.height = '100%';
            fill.style.background = 'linear-gradient(90deg, #42a5f5, #1e88e5)';
            el.appendChild(fill);
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.spinner', category: 'UI', caption: 'Spinner', tagName: 'div', cmptype: 'ui.spinner',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.display = 'inline-block';
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.border = '4px solid #e0e0e0';
            el.style.borderTopColor = '#1e88e5';
            el.style.borderRadius = '50%';
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.avatar', category: 'UI', caption: 'Avatar', tagName: 'div', cmptype: 'ui.avatar',
        create: function (doc) {
            var el = doc.createElement('div');
            el.textContent = 'AB';
            el.style.display = 'inline-flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.borderRadius = '50%';
            el.style.background = '#1e88e5';
            el.style.color = '#fff';
            el.style.fontWeight = 'bold';
            el.style.fontSize = '14px';
            el.style.fontFamily = 'Segoe UI, sans-serif';
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.chip', category: 'UI', caption: 'Chip', tagName: 'span', cmptype: 'ui.chip',
        create: function (doc) {
            var el = doc.createElement('span');
            el.textContent = 'Chip';
            el.style.display = 'inline-block';
            el.style.padding = '3px 10px';
            el.style.borderRadius = '12px';
            el.style.background = '#eceff1';
            el.style.color = '#37474f';
            el.style.fontSize = '11px';
            el.style.fontFamily = 'Segoe UI, sans-serif';
            el.style.border = '1px solid #cfd8dc';
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.divider', category: 'UI', caption: 'Divider', tagName: 'div', cmptype: 'ui.divider',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '8px';
            el.style.color = '#888';
            el.style.fontSize = '11px';
            el.style.fontFamily = 'Segoe UI, sans-serif';
            el.innerHTML =
                '<span style="flex:0 0 auto">Раздел</span>' +
                '<span style="flex:1;height:1px;background:#d0d0d0"></span>';
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.hero', category: 'UI', caption: 'Hero', tagName: 'div', cmptype: 'ui.hero',
        create: function (doc) {
            var el = doc.createElement('div');
            el.style.padding = '24px';
            el.style.borderRadius = '6px';
            el.style.background = 'linear-gradient(135deg, #e3f2fd, #bbdefb)';
            el.style.textAlign = 'center';
            el.style.fontFamily = 'Segoe UI, sans-serif';
            el.innerHTML =
                '<h1 style="margin:0 0 6px;font-size:22px;color:#0d47a1">Заголовок</h1>' +
                '<p style="margin:0 0 14px;color:#1565c0;font-size:13px">Краткое описание баннера</p>' +
                '<button style="padding:8px 18px;border:0;border-radius:4px;background:#1e88e5;color:#fff;cursor:pointer">Действие</button>';
            return el;
        },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'ui.kbd', category: 'UI', caption: 'Kbd', tagName: 'span', cmptype: 'ui.kbd',
        create: function (doc) {
            var el = doc.createElement('span');
            el.textContent = 'Ctrl+K';
            el.style.display = 'inline-block';
            el.style.padding = '1px 6px';
            el.style.border = '1px solid #b0b0b0';
            el.style.borderBottomWidth = '2px';
            el.style.borderRadius = '3px';
            el.style.background = '#fafafa';
            el.style.fontFamily = 'Consolas, monospace';
            el.style.fontSize = '11px';
            el.style.color = '#333';
            return el;
        },
        schema: S.defaultSchema()
    });

})(window);
/* Компоненты Data: cmpAction, cmpDataSet и их дочерние.
   Хранят XML-фрагменты с CDATA для SQL/PL/SQL.
   Невидимы на сцене; оригинальный camelCase восстанавливается
   через data-wb-tag при сохранении. */
(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;

    function cdataSchema(extraAttrs) {
        var props = (extraAttrs || []).slice();
        props.push({
            name: 'cdata',
            caption: 'CDATA',
            type: 'code',
            get: function (el) {
                var t = el.textContent || '';
                var m = t.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
                return m ? m[1] : t;
            },
            set: function (el, v) {
                el.textContent = '<![CDATA[' + (v == null ? '' : v) + ']]>';
            }
        });
        return { properties: props, styles: [], events: [] };
    }

    function attrSchema(extra) {
        return { properties: (extra || []).slice(), styles: [], events: [] };
    }

    /* ============================================================
       cmpAction — процедурный блок (begin ... end;)
       ============================================================ */
    R.register({
        id: 'cmp.action', category: 'Data', caption: 'Action', tagName: 'cmpAction',
        create: function (doc) {
            var el = doc.createElement('cmpAction');
            el.setAttribute('data-wb-tag', 'cmpAction');
            el.setAttribute('name', 'ActionName');
            el.textContent = '<![CDATA[\n  begin\n    \n  end;\n]]>';
            return el;
        },
        schema: cdataSchema([
            { name: 'name', caption: 'Name', type: 'string', attr: true }
        ])
    });

    R.register({
        id: 'cmp.actionvar', category: 'Data', caption: 'ActionVar', tagName: 'cmpActionVar',
        create: function (doc) {
            var el = doc.createElement('cmpActionVar');
            el.setAttribute('data-wb-tag', 'cmpActionVar');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            el.setAttribute('srctype', 'var');
            el.setAttribute('put', '');
            el.setAttribute('len', '');
            return el;
        },
        schema: attrSchema([
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'src',     caption: 'Src',     type: 'string', attr: true },
            { name: 'srctype', caption: 'SrcType', type: 'enum',   attr: true,
                values: ['', 'var', 'session', 'param', 'const'] },
            { name: 'put',     caption: 'Put',     type: 'string', attr: true },
            { name: 'len',     caption: 'Len',     type: 'number', attr: true }
        ])
    });

    /* ============================================================
       cmpDataSet — выборка данных (select ...)
       ============================================================ */
    R.register({
        id: 'cmp.dataset', category: 'Data', caption: 'DataSet', tagName: 'cmpDataSet',
        create: function (doc) {
            var el = doc.createElement('cmpDataSet');
            el.setAttribute('data-wb-tag', 'cmpDataSet');
            el.setAttribute('name', 'DataSetName');
            el.setAttribute('activateoncreate', 'true');
            el.textContent = '<![CDATA[\n  select 1 from dual\n]]>';
            return el;
        },
        schema: cdataSchema([
            { name: 'name',             caption: 'Name',             type: 'string',  attr: true },
            { name: 'activateoncreate', caption: 'ActivateOnCreate', type: 'boolean', attr: true }
        ])
    });

    R.register({
        id: 'cmp.datasetvar', category: 'Data', caption: 'DataSetVar', tagName: 'cmpDataSetVar',
        create: function (doc) {
            var el = doc.createElement('cmpDataSetVar');
            el.setAttribute('data-wb-tag', 'cmpDataSetVar');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            el.setAttribute('srctype', 'var');
            return el;
        },
        schema: attrSchema([
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'src',     caption: 'Src',     type: 'string', attr: true },
            { name: 'srctype', caption: 'SrcType', type: 'enum',   attr: true,
                values: ['', 'var', 'session', 'param', 'const'] }
        ])
    });

})(window);
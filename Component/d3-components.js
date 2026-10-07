/* D3 Framework Components: cmpButton, cmpEdit, cmpDataSet, cmpAction и т.д.
   Каждый компонент хранится как тег <cmp***> с атрибутом data-wb-tag (camelCase).
   preview() возвращает HTML-представление для редактора (не попадает в save).

   CDATA (SQL/PL/SQL/JS) хранится как первый текстовый узел внутри cmp-элемента
   в виде "<![CDATA[ ... ]]>". Дочерние элементы (cmpDataSetVar, cmpActionVar,
   cmpSubAction, cmpSubActionVar и т.д.) идут следом.

   parentOnly может быть строкой или массивом — родительские теги (в нижнем регистре),
   внутри которых разрешено добавлять этот компонент. */
(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;

    /* ---------------- Helpers ---------------- */

    function findFirstTextNode(el) {
        var nodes = el.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType === 3) return nodes[i];
        }
        return null;
    }

    function setCdataOnElement(el, text) {
        var doc = el.ownerDocument;
        var cdataText = '<![CDATA[' + (text == null ? '' : text) + ']]>';
        var tn = findFirstTextNode(el);
        if (tn) {
            tn.nodeValue = cdataText;
        } else {
            el.insertBefore(doc.createTextNode(cdataText), el.firstChild);
        }
    }

    function getCdataFromElement(el) {
        var raw = el.textContent || '';
        var m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        return m ? m[1] : '';
    }

    function cdataProp(caption) {
        return {
            name: 'cdata',
            caption: caption || 'CDATA',
            type: 'code',
            get: function (el) { return getCdataFromElement(el); },
            set: function (el, v) { setCdataOnElement(el, v); }
        };
    }

    function attrSchema(attrs, cdata) {
        var props = (attrs || []).slice();
        if (cdata) props.push(cdataProp(cdata.caption));
        return { properties: props, styles: [], events: [] };
    }

    function registerD3(opts) {
        R.register({
            id: opts.id,
            category: 'D3',
            caption: opts.caption,
            tagName: (opts.tagName || opts.id.split('.')[1]).toLowerCase(),
            xmlTag: opts.tagName || opts.id.split('.')[1],
            hidden: !!opts.hidden,
            create: function (doc) {
                var el = doc.createElement((opts.tagName || opts.id.split('.')[1]).toLowerCase());
                el.setAttribute('data-wb-tag', opts.tagName || opts.id.split('.')[1]);
                if (opts.attrs) {
                    for (var k in opts.attrs) el.setAttribute(k, opts.attrs[k]);
                }
                if (opts.cdata != null) {
                    el.appendChild(doc.createTextNode('<![CDATA[' + opts.cdata + ']]>'));
                }
                return el;
            },
            preview: opts.preview,
            parentOnly: opts.parentOnly,
            unique: opts.unique,
            schema: attrSchema(opts.properties, opts.cdataSchema)
        });
    }

    /* ============================================================
       Form-контейнеры
       ============================================================ */

    registerD3({
        id: 'd3.form', tagName: 'cmpForm', caption: 'Form',
        unique: true, hidden: true,
        attrs: { 'class': 'd3form formBackground' },
        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-form';
            var head = doc.createElement('div');
            head.className = 'd3-preview-form-cap';
            head.textContent = el.getAttribute('caption') || 'cmpForm';
            wrap.appendChild(head);
            var bodyEl = doc.createElement('div');
            bodyEl.className = 'd3-preview-form-body';
            bodyEl.textContent = '(form content)';
            wrap.appendChild(bodyEl);
            return wrap;
        },
        properties: [
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'class',   caption: 'Class',   type: 'string', attr: true }
        ]
    });

    R.register({
        id: 'd3.rootdiv', category: 'D3', caption: 'RootDiv',
        tagName: 'div', hidden: true,
        create: function (doc) {
            var el = doc.createElement('div');
            el.setAttribute('class', 'formBackground');
            return el;
        },
        schema: {
            properties: [
                { name: 'id',    caption: 'Id',    type: 'string', attr: true },
                { name: 'class', caption: 'Class', type: 'string', attr: true }
            ],
            styles: S.STYLE_FIELDS.slice(),
            events: S.EVENT_FIELDS.slice()
        }
    });

    registerD3({
        id: 'd3.subform', tagName: 'cmpSubForm', caption: 'SubForm',
        attrs: { path: '' },
        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-subform';
            wrap.textContent = 'SubForm: ' + (el.getAttribute('path') || '');
            return wrap;
        },
        properties: [
            { name: 'path', caption: 'Path', type: 'string', attr: true }
        ]
    });

    /* ============================================================
       Controls
       ============================================================ */
    registerD3({
        id: 'd3.button', tagName: 'cmpButton', caption: 'Button',
        attrs: { caption: 'Button' },
        preview: function (el, doc) {
            var b = doc.createElement('button');
            b.type = 'button';
            b.className = 'd3-preview d3-preview-button';
            b.textContent = el.getAttribute('caption') || '';
            return b;
        },
        properties: [
            { name: 'name',       caption: 'Name',        type: 'string', attr: true },
            { name: 'caption',    caption: 'Caption',     type: 'string', attr: true },
            { name: 'onclick',    caption: 'OnClick',     type: 'string', attr: true },
            { name: 'popupmenu',  caption: 'PopupMenu',   type: 'string', attr: true },
            { name: 'icon',       caption: 'Icon',        type: 'string', attr: true },
            { name: 'background', caption: 'Background',  type: 'string', attr: true },
            { name: 'type',       caption: 'Type',        type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.edit', tagName: 'cmpEdit', caption: 'Edit',
        attrs: { name: '', width: '200px' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-edit';
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.placeholder = el.getAttribute('placeholder') || el.getAttribute('name') || '';
            inp.value = el.getAttribute('value') || '';
            if (el.getAttribute('readonly') === 'true') inp.readOnly = true;
            inp.style.width = el.getAttribute('width') || '200px';
            wrap.appendChild(inp);
            return wrap;
        },
        properties: [
            { name: 'name',        caption: 'Name',        type: 'string', attr: true },
            { name: 'value',       caption: 'Value',       type: 'string', attr: true },
            { name: 'data',        caption: 'Data',        type: 'string', attr: true },
            { name: 'placeholder', caption: 'Placeholder', type: 'string', attr: true },
            { name: 'width',       caption: 'Width',       type: 'string', attr: true },
            { name: 'type',        caption: 'Type',        type: 'string', attr: true },
            { name: 'maxlength',   caption: 'MaxLength',   type: 'string', attr: true },
            { name: 'format',      caption: 'Format',      type: 'string', attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.dateedit', tagName: 'cmpDateEdit', caption: 'DateEdit',
        attrs: { name: '', width: '120px' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-edit';
            var inp = doc.createElement('input');
            inp.type = 'date';
            inp.style.width = el.getAttribute('width') || '120px';
            wrap.appendChild(inp);
            return wrap;
        },
        properties: [
            { name: 'name',      caption: 'Name',     type: 'string', attr: true },
            { name: 'value',     caption: 'Value',    type: 'string', attr: true },
            { name: 'width',     caption: 'Width',    type: 'string', attr: true },
            { name: 'format',    caption: 'Format',   type: 'string', attr: true },
            { name: 'mask_type', caption: 'MaskType', type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.combobox', tagName: 'cmpComboBox', caption: 'ComboBox',
        attrs: { name: '', width: '200px' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-combo';
            var sel = doc.createElement('select');
            sel.style.width = el.getAttribute('width') || '200px';
            var opt = doc.createElement('option');
            opt.textContent = '(no items)';
            sel.appendChild(opt);
            wrap.appendChild(sel);
            return wrap;
        },
        properties: [
            { name: 'name',  caption: 'Name',  type: 'string', attr: true },
            { name: 'value', caption: 'Value', type: 'string', attr: true },
            { name: 'width', caption: 'Width', type: 'string', attr: true },
            { name: 'data',  caption: 'Data',  type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.comboitem', tagName: 'cmpComboItem', caption: 'ComboItem',
        parentOnly: 'cmpcombobox',
        attrs: { dataset: '', data: 'value:VALUE;caption:CAPTION', repeat: '0' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-comboitem';
            wrap.textContent = 'Item ← ' + (el.getAttribute('dataset') || 'dataset');
            return wrap;
        },
        properties: [
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'data',    caption: 'Data',    type: 'string', attr: true },
            { name: 'repeat',  caption: 'Repeat',  type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.unitedit', tagName: 'cmpUnitEdit', caption: 'UnitEdit',
        attrs: { name: '', unit: '', width: '100%' },
        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-unitedit';
            var inp = doc.createElement('input');
            inp.type = 'text';
            inp.readOnly = true;
            inp.value = el.getAttribute('unit') || '';
            inp.style.width = el.getAttribute('width') || '100%';
            wrap.appendChild(inp);
            return wrap;
        },
        properties: [
            { name: 'name',          caption: 'Name',         type: 'string', attr: true },
            { name: 'unit',          caption: 'Unit',         type: 'string', attr: true },
            { name: 'composition',   caption: 'Composition',  type: 'string', attr: true },
            { name: 'width',         caption: 'Width',        type: 'string', attr: true },
            { name: 'multisel',      caption: 'MultiSel',     type: 'string', attr: true },
            { name: 'readonly',      caption: 'ReadOnly',     type: 'string', attr: true },
            { name: 'clearbutton',   caption: 'ClearButton',  type: 'string', attr: true },
            { name: 'is_mis',        caption: 'IsMis',        type: 'string', attr: true },
            { name: 'type',          caption: 'Type',         type: 'string', attr: true },
            { name: 'custom_filter', caption: 'CustomFilter', type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.hyperlink', tagName: 'cmpHyperLink', caption: 'HyperLink',
        attrs: { caption: 'Link' },
        preview: function (el, doc) {
            var a = doc.createElement('a');
            a.href = 'javascript:void(0)';
            a.className = 'd3-preview d3-preview-link';
            a.textContent = el.getAttribute('caption') || '';
            return a;
        },
        properties: [
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'onclick', caption: 'OnClick', type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.dependences', tagName: 'cmpDependences', caption: 'Dependences',
        attrs: { required: '', depend: '' },
        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-dependences';
            span.textContent = '⇄ req:' + (el.getAttribute('required') || '')
                + ' dep:' + (el.getAttribute('depend') || '');
            return span;
        },
        properties: [
            { name: 'required', caption: 'Required', type: 'string', attr: true },
            { name: 'depend',   caption: 'Depend',   type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.mask', tagName: 'cmpMask', caption: 'Mask',
        attrs: { name: '', controls: '' },
        properties: [
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'controls', caption: 'Controls', type: 'string', attr: true }
        ]
    });

    /* ============================================================
       Data / Actions / Scripts
       ============================================================ */
    registerD3({
        id: 'd3.script', tagName: 'cmpScript', caption: 'Script',
        cdata: '// JavaScript\n',
        cdataSchema: { caption: 'JavaScript' },
        properties: []
    });

    registerD3({
        id: 'd3.dataset', tagName: 'cmpDataSet', caption: 'DataSet',
        attrs: { name: 'DataSetName', activateoncreate: 'true' },
        cdata: 'select 1 from dual\n',
        cdataSchema: { caption: 'SQL' },
        properties: [
            { name: 'name',             caption: 'Name',             type: 'string', attr: true },
            { name: 'activateoncreate', caption: 'ActivateOnCreate', type: 'string', attr: true }
        ]
    });

    registerD3({
        id: 'd3.datasetvar', tagName: 'cmpDataSetVar', caption: 'DataSetVar',
        parentOnly: 'cmpdataset',
        attrs: { name: '', src: '', srctype: 'var' },
        properties: [
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'src',     caption: 'Src',     type: 'string', attr: true },
            { name: 'srctype', caption: 'SrcType', type: 'string', attr: true }
        ]
    });

    /* cmpAction — контейнер процедурного блока.
       Родитель — форма (или корневой контейнер).
       Дети: cmpActionVar, cmpSubAction. */
    registerD3({
        id: 'd3.action', tagName: 'cmpAction', caption: 'Action',
        attrs: { name: 'ActionName' },
        cdata: 'begin\n  null;\nend;\n',
        cdataSchema: { caption: 'PL/SQL' },
        properties: [
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'compile', caption: 'Compile', type: 'string', attr: true }
        ]
    });

    /* cmpActionVar — переменная/параметр действия.
       Разрешена внутри cmpAction ИЛИ cmpSubAction. */
    registerD3({
        id: 'd3.actionvar', tagName: 'cmpActionVar', caption: 'ActionVar',
        parentOnly: ['cmpaction', 'cmpsubaction'],
        attrs: { name: '', src: '', srctype: 'var' },
        properties: [
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'src',      caption: 'Src',      type: 'string', attr: true },
            { name: 'srctype',  caption: 'SrcType',  type: 'string', attr: true },
            { name: 'property', caption: 'Property', type: 'string', attr: true },
            { name: 'get',      caption: 'Get',      type: 'string', attr: true },
            { name: 'put',      caption: 'Put',      type: 'string', attr: true },
            { name: 'len',      caption: 'Len',      type: 'string', attr: true }
        ]
    });

    /* cmpSubAction — вложенное действие.
       Может быть вложено в cmpAction ИЛИ в другой cmpSubAction.
       Может содержать CDATA и/или детей: cmpActionVar / cmpSubActionVar / cmpSubAction. */
    registerD3({
        id: 'd3.subaction', tagName: 'cmpSubAction', caption: 'SubAction',
        parentOnly: ['cmpaction', 'cmpsubaction'],
        attrs: { name: '', repeatername: '', execon: 'each', action: '' },
        properties: [
            { name: 'name',         caption: 'Name',         type: 'string', attr: true },
            { name: 'repeatername', caption: 'RepeaterName', type: 'string', attr: true },
            { name: 'execon',       caption: 'ExecOn',       type: 'string', attr: true },
            { name: 'action',       caption: 'Action',       type: 'string', attr: true },
            { name: 'compile',      caption: 'Compile',      type: 'string', attr: true },
            cdataProp('PL/SQL')
        ]
    });

    /* cmpSubActionVar — переменная вложенного действия.
       Разрешена ТОЛЬКО внутри cmpSubAction. */
    registerD3({
        id: 'd3.subactionvar', tagName: 'cmpSubActionVar', caption: 'SubActionVar',
        parentOnly: ['cmpsubaction'],
        attrs: { name: '', src: '', srctype: 'var' },
        properties: [
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'src',      caption: 'Src',      type: 'string', attr: true },
            { name: 'srctype',  caption: 'SrcType',  type: 'string', attr: true },
            { name: 'property', caption: 'Property', type: 'string', attr: true },
            { name: 'get',      caption: 'Get',      type: 'string', attr: true },
            { name: 'put',      caption: 'Put',      type: 'string', attr: true },
            { name: 'len',      caption: 'Len',      type: 'string', attr: true }
        ]
    });

})(window);
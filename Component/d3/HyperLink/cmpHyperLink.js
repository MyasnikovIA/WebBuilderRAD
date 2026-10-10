/* cmpHyperLink — гиперссылка.

   Серверный контрол: HyperLinkCtrl.inc (class HyperLink).
   Клиентский контрол: HyperLink.js (D3Api.HyperLinkCtrl).

   Серверный Show():
     <a class="ctrl_hyper_link" tabindex="0" …events… …attrs…
        onclick="D3Api.HyperLinkCtrl.onClick(this);">caption</a>

   onclick сервер навешивает сам, если пользователь не задал свой.

   Поведение по клику:
     1. Если задан href — стандартный переход (клиент ничего не делает).
     2. Если задан unit и target="_blank" — переход на ?unit=…&id=….
     3. Иначе — D3Api.openFormByUnit(…).

   Поле href имеет тип FILE: можно выбрать файл из текущего проекта
   или ввести путь / URL вручную. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function getCaption(el) {
        return el.getAttribute('caption') || '';
    }
    function setCaption(el, v) {
        if (v == null || v === '') el.removeAttribute('caption');
        else el.setAttribute('caption', String(v));
    }
    function getValue(el) {
        return el.getAttribute('keyvalue') || el.getAttribute('value') || '';
    }
    function setValue(el, v) {
        if (v == null || v === '') {
            el.removeAttribute('keyvalue');
            el.removeAttribute('value');
        } else {
            el.setAttribute('keyvalue', String(v));
        }
    }

    D3.register({
        id: 'd3.hyperlink', tagName: 'cmpHyperLink', caption: 'HyperLink',
        subCategory: 'Display',
        icon: 'images/icon.png',
        nameTemplate: 'hyperLink',
        previewCss: ['css/preview.css'],
        attrs: { name: '', caption: 'Ссылка', target: '' },

        create: function (doc) {
            var el = doc.createElement('cmphyperlink');
            el.setAttribute('data-wb-tag', 'cmpHyperLink');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Ссылка');
            el.setAttribute('target', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-hyperlink';

            var cap = getCaption(el);
            wrap.textContent = cap || '(link)';
            if (!cap) wrap.classList.add('d3-preview-hyperlink-empty');

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('newthread') === 'true') wrap.classList.add('d3-preview-hyperlink-newthread');

            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',     caption: 'Id',     type: 'string', attr: true },
            { name: 'class',  caption: 'Class',  type: 'string', attr: true },
            { name: 'style',  caption: 'Style',  type: 'string', attr: true },
            { name: 'title',  caption: 'Title',  type: 'string', attr: true },
            { name: 'target', caption: 'Target', type: 'enum',   attr: true,
                values: ['', '_self', '_blank', '_parent', '_top'] },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            {
                name: 'value', caption: 'Value (id)', type: 'string', attr: true,
                get: function (el) { return getValue(el); },
                set: function (el, v) { setValue(el, v); }
            },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            { type: 'separator', caption: 'HyperLink' },
            {
                name: 'caption', caption: 'Caption', type: 'string', attr: true,
                get: function (el) { return getCaption(el); },
                set: function (el, v) { setCaption(el, v); }
            },
            /* href — файл проекта или URL. */
            { name: 'href', caption: 'Href (файл проекта или URL)', type: 'FILE', attr: true },

            { type: 'separator', caption: 'Открытие формы' },
            { name: 'unit',        caption: 'Unit',        type: 'string',  attr: true },
            { name: 'composition', caption: 'Composition', type: 'string',  attr: true },
            { name: 'method',      caption: 'Method',      type: 'string',  attr: true },
            { name: 'is_view',     caption: 'Is View',     type: 'boolean', attr: true },
            { name: 'newthread',   caption: 'New Thread',  type: 'boolean', attr: true },
            { name: 'emptyvalue',  caption: 'Empty Value', type: 'boolean', attr: true },
            { name: 'keyvaluecontrol', caption: 'KeyValue Control', type: 'string', attr: true },

            { type: 'separator', caption: 'Параметры открываемой формы' },
            { name: 'comp_vars',     caption: 'Comp Vars',     type: 'code', attr: true },
            { name: 'comp_request',  caption: 'Comp Request',  type: 'code', attr: true },
            { name: 'append_filter', caption: 'Append Filter', type: 'code', attr: true },

            { type: 'separator', caption: 'Handlers' },
            { name: 'onclose', caption: 'OnClose', type: 'code', attr: true }
        ],

        events: [
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'onfocus',     caption: 'OnFocus',     type: 'code' },
            { name: 'onblur',      caption: 'OnBlur',      type: 'code' },
            { name: 'onmousedown', caption: 'OnMouseDown', type: 'code' },
            { name: 'onmouseup',   caption: 'OnMouseUp',   type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' },
            { name: 'onkeydown',   caption: 'OnKeyDown',   type: 'code' },
            { name: 'onkeyup',     caption: 'OnKeyUp',     type: 'code' }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
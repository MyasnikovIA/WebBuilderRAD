/* cmpComboItem — элемент выпадающего списка ComboBox.

   Серверный контрол: ComboBoxCtrlTraits.inc (ComboItemTrait)
   Клиентский контрол: ComboBox.js (D3Api.ComboItemCtrl)
   Разметка в рантайме: <tr> внутри <table> в .cmbb-droplist.

   parentOnly: 'cmpcombobox' — элемент можно добавлять только внутрь ComboBox
   (см. ComponentRegistry и PARENT_ONLY в panels.js). */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.comboitem', tagName: 'cmpComboItem', caption: 'ComboItem',
        parentOnly: 'cmpcombobox',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],

        attrs: { value: '', caption: '' },

        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-comboitem';
            span.textContent = el.getAttribute('caption') || el.getAttribute('value') || '(item)';
            return span;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'value',   caption: 'Value',   type: 'string', attr: true },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },

            /* --- Data --- */
            { type: 'separator', caption: 'Data' },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'data',    caption: 'Data',    type: 'string', attr: true },

            /* --- Hierarchy --- */
            { type: 'separator', caption: 'Hierarchy (иерархический ComboBox)' },
            { name: 'parentfield',    caption: 'Parent Field',     type: 'string',  attr: true },
            { name: 'keyfield',       caption: 'Key Field',        type: 'string',  attr: true },
            { name: 'openedparent',   caption: 'Opened Parent',    type: 'boolean', attr: true },
            { name: 'noselectparent', caption: 'No Select Parent', type: 'boolean', attr: true },
            { name: 'levelHierh',     caption: 'Level (auto)',     type: 'number',  attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',  caption: 'OnClick',  type: 'code' },
            { name: 'onchange', caption: 'OnChange', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
/* cmpComboItem — элемент выпадающего списка.
   Разрешён ТОЛЬКО внутри cmpComboBox.
   Невидим на сцене: описывает привязку к dataset; визуализируется
   родительским cmpComboBox как <option>. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.comboitem', tagName: 'cmpComboItem', caption: 'ComboItem',
        parentOnly: 'cmpcombobox',
        attrs: { dataset: '', data: 'value:VALUE;caption:CAPTION', repeat: '0' },
        /* Нет собственного превью — рисуется внутри ComboBox. */
        properties: [
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'data',    caption: 'Data',    type: 'string', attr: true },
            { name: 'repeat',  caption: 'Repeat',  type: 'string', attr: true }
        ]
    });

})(window);
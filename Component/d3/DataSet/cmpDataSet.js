/* cmpDataSet — SQL-выборка. Невидим на сцене. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.dataset', tagName: 'cmpDataSet', caption: 'DataSet',
        subCategory: 'Data',
        icon: 'images/icon.png',
        nameTemplate: 'dataSet',
        attrs: { name: 'DataSetName', activateoncreate: 'true' },
        cdata: 'select 1 from dual\n',
        cdataSchema: { caption: 'SQL' },
        properties: [
            { name: 'name',             caption: 'Name',             type: 'string', attr: true },
            { name: 'activateoncreate', caption: 'ActivateOnCreate', type: 'string', attr: true }
        ]
    });

})(window);
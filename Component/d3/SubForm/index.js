/* cmpSubForm — подключение другой формы по пути.

   Серверный контрол: SubFormCtrl.inc (class SubForm extends BaseCtrl).
   Клиентский контрол: нет.

   Серверный Show():
     1. Читает path из атрибутов (или из $_GET['SubFormPath']).
     2. Загружает содержимое .frm через getFormContent(path).
     3. Парсит его через FormParser.
     4. Вставляет результат в родителя через SetInnerText.
     5. Накапливает sysinfo (описание вложенной формы) в родителе.

   Атрибуты:
     name — идентификатор контрола (используется в sysinfo).
     path — путь к подключаемой форме без расширения .frm.
            Пример: 'Test/Fetch/Statistic/m2/add'.
            Обязателен (иначе компонент ничего не делает).

   Дети игнорируются — содержимое приходит из подключённой формы.

   В IDE: в canvas отображается placeholder — блок «SubForm: <path>»
   с подсказкой, что содержимое подгружается из указанной формы. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.subform', tagName: 'cmpSubForm', caption: 'SubForm',
        icon: 'images/icon.png',
        nameTemplate: 'subForm',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            path: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmpsubform');
            el.setAttribute('data-wb-tag', 'cmpSubForm');
            el.setAttribute('name', '');
            el.setAttribute('path', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-subform';

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var path = el.getAttribute('path') || '';
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            /* Заголовок с иконкой */
            var header = doc.createElement('div');
            header.className = 'd3-preview-subform-header';

            var icon = doc.createElement('span');
            icon.className = 'd3-preview-subform-icon';
            icon.textContent = '\u21B3'; /* ↳ */
            header.appendChild(icon);

            var title = doc.createElement('span');
            title.className = 'd3-preview-subform-title';
            title.textContent = 'SubForm';
            header.appendChild(title);

            wrap.appendChild(header);

            /* Путь */
            var pathEl = doc.createElement('div');
            pathEl.className = 'd3-preview-subform-path';
            if (path) {
                pathEl.textContent = path;
                pathEl.title = 'Форма: ' + path + '.frm';
            } else {
                pathEl.textContent = '(path не задан)';
                pathEl.classList.add('empty');
            }
            wrap.appendChild(pathEl);

            /* Плейсхолдер «содержимое подгружается» */
            var placeholder = doc.createElement('div');
            placeholder.className = 'd3-preview-subform-placeholder';
            placeholder.textContent = 'содержимое подгружается из формы';
            wrap.appendChild(placeholder);

            return wrap;
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
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- SubForm --- */
            { type: 'separator', caption: 'SubForm' },
            {
                name: 'path',
                caption: 'Path (форма без .frm)',
                type: 'string',
                attr: true
            }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
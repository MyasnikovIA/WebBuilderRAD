/* cmpUnitEditGenerate — генератор формы редактирования.

   Серверный контрол: UnitEditGenerateBase / UnitEditGenerate (по DBType).
   Клиентский контрол: нет.

   Серверный Show() читает конфигурацию метода
   (core.v_show_method_cols4bld) и генерирует:
     - <div cmptype="Form" …> (или с withUnitProps, если use_unitprop=1);
     - таблицу полей (Edit / CheckBox / ComboBox / TextArea / DateEdit /
       File / UnitEdit) по колонкам метода;
     - опционально <cmpInfoAboutRecord>;
     - <cmpPageControl> с вкладками «Главная» / «Дополнительно»;
     - <cmpUnitProps> на вкладке «Дополнительно»;
     - <cmpScript> с Form.onCreate / Form.OnShow / Form.OnButtonOk /
       Form.OnSuccess / Form.OnError / Form.onClose;
     - <cmpAction name="SelAct"> — SELECT по PRIMARY;
     - <cmpAction name="UpdAddAct"> — UPDATE / INSERT;
     - <cmpDependences> для обязательных полей;
     - <cmpMask> для числовых полей;
     - кнопки «ОК» и «Отмена».

   Всё содержимое динамическое, зависит от БД. В IDE показываем
   «скелет» — карточку формы с примером структуры.

   Атрибуты:
     name   — имя контрола (необязательно).
     unit   — код раздела (или $_GET['unit']).
     method — код метода показа (или $_GET['method']).

   Если указан `unit` — сервер использует его как «якорь», иначе
   берёт из $_GET. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.uniteditgenerate', tagName: 'cmpUnitEditGenerate',
        caption: 'UnitEditGenerate',
        subCategory: 'Controls',
        icon: 'images/icon.png',
        nameTemplate: 'unitEditGenerate',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            unit: '',
            method: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmpuniteditgenerate');
            el.setAttribute('data-wb-tag', 'cmpUnitEditGenerate');
            el.setAttribute('name', '');
            el.setAttribute('unit', '');
            el.setAttribute('method', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-uniteditgenerate';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            var unit = el.getAttribute('unit') || '';
            var method = el.getAttribute('method') || '';

            /* Заголовок карточки */
            var header = doc.createElement('div');
            header.className = 'd3-preview-uniteditgenerate-header';

            var icon = doc.createElement('span');
            icon.className = 'd3-preview-uniteditgenerate-icon';
            icon.textContent = '\u2699'; /* ⚙ */
            header.appendChild(icon);

            var title = doc.createElement('span');
            title.className = 'd3-preview-uniteditgenerate-title';
            title.textContent = 'Form (generate)';
            header.appendChild(title);

            wrap.appendChild(header);

            /* Параметры */
            var params = doc.createElement('div');
            params.className = 'd3-preview-uniteditgenerate-params';

            var unitRow = doc.createElement('div');
            unitRow.className = 'd3-preview-uniteditgenerate-param';
            unitRow.innerHTML = '<span class="lbl">unit:</span> ' +
                (unit ? escapeHtml(unit) : '<span class="empty">(из $_GET)</span>');
            params.appendChild(unitRow);

            var methodRow = doc.createElement('div');
            methodRow.className = 'd3-preview-uniteditgenerate-param';
            methodRow.innerHTML = '<span class="lbl">method:</span> ' +
                (method ? escapeHtml(method) : '<span class="empty">(из $_GET)</span>');
            params.appendChild(methodRow);

            wrap.appendChild(params);

            /* Скелет таблицы полей */
            var table = doc.createElement('table');
            table.className = 'd3-preview-uniteditgenerate-table';

            var tbody = doc.createElement('tbody');
            for (var i = 0; i < 3; i++) {
                var tr = doc.createElement('tr');

                var tdCap = doc.createElement('td');
                tdCap.className = 'caption';
                tdCap.textContent = 'Поле ' + (i + 1) + ':';
                tr.appendChild(tdCap);

                var tdVal = doc.createElement('td');
                tdVal.className = 'value';
                var inp = doc.createElement('input');
                inp.type = 'text';
                inp.readOnly = true;
                inp.disabled = true;
                inp.placeholder = '\u2026';
                tdVal.appendChild(inp);
                tr.appendChild(tdVal);

                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            wrap.appendChild(table);

            /* Полоска вкладок (PageControl) */
            var tabs = doc.createElement('div');
            tabs.className = 'd3-preview-uniteditgenerate-tabs';
            ['Главная', 'Дополнительно'].forEach(function (name, idx) {
                var t = doc.createElement('span');
                t.className = 'd3-preview-uniteditgenerate-tab' + (idx === 0 ? ' active' : '');
                t.textContent = name;
                tabs.appendChild(t);
            });
            wrap.appendChild(tabs);

            /* Кнопки */
            var btns = doc.createElement('div');
            btns.className = 'd3-preview-uniteditgenerate-buttons';

            var ok = doc.createElement('span');
            ok.className = 'd3-preview-uniteditgenerate-btn primary';
            ok.textContent = 'ОК';
            btns.appendChild(ok);

            var cancel = doc.createElement('span');
            cancel.className = 'd3-preview-uniteditgenerate-btn';
            cancel.textContent = 'Отмена';
            btns.appendChild(cancel);

            wrap.appendChild(btns);

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

            /* --- UnitEditGenerate --- */
            { type: 'separator', caption: 'UnitEditGenerate' },
            { name: 'unit',   caption: 'Unit (код раздела)',   type: 'string', attr: true },
            { name: 'method', caption: 'Method (код метода)',  type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

    /* Локальный хелпер escapeHtml — без зависимостей. */
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})(window);
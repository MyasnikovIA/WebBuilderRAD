/* cmpStoredValues — сохранённые значения параметров формы.

   Серверный контрол: StoredValuesCtrl.inc (class StoredValues extends BaseCtrl).
   Клиентский контрол: StoredValues.js (D3Api.StoredValuesCtrl).

   Серверный Show() генерирует:
     <div cmptype="StoredValues">
       <cmpDataSet name="ds_svc_<name>">       — сохранённые значения из core.v_paramval_data
       <cmpAction  name="action_svc_<name>_save"> — сохранение
       <cmpAction  name="action_svc_<name>_del">  — удаление
       <cmpExpander name="svc_exp_<name>" caption="Сохраненные значения">
         <cmpComboBox name="svc_combobox_<name>" onchange="…setParamVals(…)" initIndex="0" anyvalue="true">
           <cmpComboItem dataset="ds_svc_<name>" repeat="0" data="value:id;caption:caption"/>
         </cmpComboBox>
         <cmpCheckBox name="svc_chk_<name>" hint="По-умолчанию"/>
         <cmpButton   name="svc_button_<name>"  caption="Сохранить" onclick="…saveParamVals(…, '<params>')"/>
         <cmpButton   name="svc_buttonx_<name>" icon="~Icon/x" onclick="executeAction('action_svc_<name>_del');"/>
         <cmpDependences required="svc_combobox_<name>:caption" depend="svc_button_<name>"/>
       </cmpExpander>
     </div>

   Атрибуты:
     name        — имя компонента (используется в сгенерированных именах:
                   svc_combobox_<name>, svc_chk_<name>, ds_svc_<name>, …).
     entity_name — имя сущности в core.v_paramval_data (по этому ключу
                   хранятся сохранённые значения).
     params      — опциональный ';'-список имён контролов, значения
                   которых нужно сохранять. Если пусто — сохраняются все
                   Edit/TextArea/ComboBox/DateEdit/CheckBox/RadioGroup
                   формы.

   В IDE: рисуем «скелет» — Expander с ComboBox, чекбоксом и кнопками.
   Реальная серверная разметка (DataSet, Actions, ComboItem) в canvas
   не воспроизводится. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.storedvalues', tagName: 'cmpStoredValues', caption: 'StoredValues',
        icon: 'images/icon.png',
        nameTemplate: 'storedValues',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            entity_name: '',
            params: ''
        },

        create: function (doc) {
            var el = doc.createElement('cmpstoredvalues');
            el.setAttribute('data-wb-tag', 'cmpStoredValues');
            el.setAttribute('name', '');
            el.setAttribute('entity_name', '');
            el.setAttribute('params', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-storedvalues';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            var w = el.getAttribute('width');
            if (w) wrap.style.width = w;

            /* Шапка Expander-а */
            var header = doc.createElement('div');
            header.className = 'd3-preview-storedvalues-header';
            header.textContent = 'Сохраненные значения';
            wrap.appendChild(header);

            /* Тело: combo + checkbox + кнопки */
            var body = doc.createElement('div');
            body.className = 'd3-preview-storedvalues-body';

            /* ComboBox */
            var comboWrap = doc.createElement('div');
            comboWrap.className = 'd3-preview-storedvalues-combo';
            var combo = doc.createElement('div');
            combo.className = 'd3-preview-storedvalues-combo-input';
            combo.textContent = '(выбрать)';
            var comboBtn = doc.createElement('span');
            comboBtn.className = 'd3-preview-storedvalues-combo-btn';
            comboBtn.textContent = '\u25BE'; /* ▾ */
            comboWrap.appendChild(combo);
            comboWrap.appendChild(comboBtn);
            body.appendChild(comboWrap);

            /* CheckBox "По-умолчанию" */
            var chkWrap = doc.createElement('label');
            chkWrap.className = 'd3-preview-storedvalues-check';
            var chk = doc.createElement('input');
            chk.type = 'checkbox';
            chk.disabled = true;
            chkWrap.appendChild(chk);
            var chkLbl = doc.createElement('span');
            chkLbl.textContent = 'По-умолчанию';
            chkWrap.appendChild(chkLbl);
            body.appendChild(chkWrap);

            /* Кнопки */
            var btns = doc.createElement('div');
            btns.className = 'd3-preview-storedvalues-buttons';

            var saveBtn = doc.createElement('span');
            saveBtn.className = 'd3-preview-storedvalues-btn d3-preview-storedvalues-btn-primary';
            saveBtn.textContent = 'Сохранить';
            btns.appendChild(saveBtn);

            var delBtn = doc.createElement('span');
            delBtn.className = 'd3-preview-storedvalues-btn d3-preview-storedvalues-btn-icon';
            delBtn.textContent = '\u2715'; /* ✕ */
            delBtn.title = 'Удалить';
            btns.appendChild(delBtn);

            body.appendChild(btns);
            wrap.appendChild(body);

            /* Бейдж — маркер компонента */
            var badge = doc.createElement('div');
            badge.className = 'd3-preview-storedvalues-badge';
            badge.textContent = 'stored values';
            wrap.appendChild(badge);

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

            /* --- StoredValues --- */
            { type: 'separator', caption: 'StoredValues' },
            { name: 'entity_name', caption: 'Entity Name', type: 'string', attr: true },
            {
                name: 'params',
                caption: 'Params (control names via ;)',
                type: 'string',
                attr: true
            }
        ],

        /* ---------------- Events ---------------- */
        events: [],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);
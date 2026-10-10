/* ComponentTab — вкладка "Root: component".

   Подвкладки: JS / CSS / PreViewIDE(html) / Component Properties / Component Events.

   В Component Properties и Component Events для каждого поля задаётся
   имя JS-функции (onChangeFunc / handlerFunc). Двойной клик по полю:
     • пусто  → генерируется имя + шаблон функции, пишется в поле;
     • задано → ищется в JS-коде; если нет — генерируется и дописывается;
     • редактор переключается на подвкладку JS, курсор ставится
       в начало тела функции (после открывающей {). */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    var PREDEFINED_EDITORS = [
        { id: '',                   caption: '— не выбрано —' },
        { id: 'text',               caption: 'Текст (Plain Text)' },
        { id: 'code-editor-xml',    caption: 'Code Editor: XML/HTML' },
        { id: 'code-editor-js',     caption: 'Code Editor: JavaScript' },
        { id: 'code-editor-css',    caption: 'Code Editor: CSS' },
        { id: 'code-editor-json',   caption: 'Code Editor: JSON' },
        { id: 'code-editor-sql',    caption: 'Code Editor: SQL' },
        { id: 'image-preview',      caption: 'Просмотр изображения' },
        { id: 'file-picker',        caption: 'Выбор файла из проекта' }
    ];

    var PROPERTY_TYPES = [
        { id: 'string',  caption: 'string' },
        { id: 'number',  caption: 'number' },
        { id: 'boolean', caption: 'boolean' },
        { id: 'enum',    caption: 'enum' },
        { id: 'color',   caption: 'color' },
        { id: 'length',  caption: 'length (число + единица)' },
        { id: 'text',    caption: 'text (textarea)' }
    ];

    var NESTING_MODES = [
        { id: 'all',  caption: 'Разрешено (любые элементы)' },
        { id: 'list', caption: 'Только указанные' },
        { id: 'none', caption: 'Запрещено (самозакрывающийся)' }
    ];

    function capitalize(s) {
        s = String(s || '');
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function safeIdent(s) {
        return String(s || '').replace(/[^A-Za-z0-9_$]/g, '');
    }

    function ComponentTab(paneEl) {
        this.pane = $(paneEl);
        this.active = false;
        this._build();
    }

    ComponentTab.prototype._build = function () {
        var self = this;

        var wrap = $('<div class="wb-component-tab"></div>');
        var form = $('<div class="wb-comp-form"></div>');

        form.append(self._field('name',        'Имя компонента',             'text'));
        form.append(self._fileField('icon',    'Иконка (URL или файл проекта)'));
        form.append(self._field('tagName',     'Тег корня',                  'text'));
        form.append(self._field('cmptype',     'cmptype',                    'text'));
        form.append(self._textarea('description', 'Описание компонента'));
        form.append(self._libsField('jsLibs',  'JS-ресурсы'));
        form.append(self._libsField('cssLibs', 'CSS-ресурсы'));

        var nestingRow = self._selectField(
            'nestingMode',
            'Разрешить вложения',
            NESTING_MODES,
            'all'
        );
        form.append(nestingRow);

        var rulesRow = $(
            '<div class="wb-row wb-comp-nesting-row" style="display:none;">' +
            '<div class="wb-row-name">Разрешённые вложения</div>' +
            '<div class="wb-row-value wb-comp-nesting-value">' +
            '<div class="wb-comp-nesting-rules"></div>' +
            '<button type="button" class="wb-code-btn wb-comp-nesting-add">+</button>' +
            '</div>' +
            '</div>'
        );
        form.append(rulesRow);

        wrap.append(form);

        var subTabs = $(
            '<div class="wb-comp-subtabs">' +
            '<div class="wb-comp-subtab wb-active" data-sub="js">JS</div>' +
            '<div class="wb-comp-subtab" data-sub="css">CSS</div>' +
            '<div class="wb-comp-subtab" data-sub="preview">PreViewIDE(html)</div>' +
            '<div class="wb-comp-subtab" data-sub="props">Component Properties</div>' +
            '<div class="wb-comp-subtab" data-sub="events">Component Events</div>' +
            '</div>'
        );
        wrap.append(subTabs);

        var editors = $('<div class="wb-comp-editors"></div>');
        var jsBox   = $('<div class="wb-comp-editor-box" data-sub="js"></div>');
        var cssBox  = $('<div class="wb-comp-editor-box" data-sub="css" style="display:none;"></div>');
        var prevBox = $('<div class="wb-comp-editor-box" data-sub="preview" style="display:none;"></div>');
        var propBox = $('<div class="wb-comp-editor-box wb-comp-props-box" data-sub="props" style="display:none;"></div>');
        var evtBox  = $('<div class="wb-comp-editor-box wb-comp-events-box" data-sub="events" style="display:none;"></div>');

        this.jsEditor      = new global.CodeEditor({ value: '', language: 'javascript' });
        this.cssEditor     = new global.CodeEditor({ value: '', language: 'css' });
        this.previewEditor = new global.CodeEditor({ value: '', language: 'xml' });

        jsBox.append(this.jsEditor.el);
        cssBox.append(this.cssEditor.el);
        prevBox.append(this.previewEditor.el);
        propBox.append(self._buildPropsTable());
        evtBox.append(self._buildEventsTable());

        editors.append(jsBox).append(cssBox).append(prevBox).append(propBox).append(evtBox);
        wrap.append(editors);

        var toolbar = $('<div class="wb-comp-toolbar"></div>');
        var newBtn  = $('<button type="button" class="wb-code-btn">Новый</button>');
        var saveBtn = $('<button type="button" class="wb-code-btn">Сохранить как компонент</button>');
        var status  = $('<span class="wb-comp-status"></span>');
        toolbar.append(newBtn).append(saveBtn).append(status);
        wrap.append(toolbar);

        this.pane.empty().append(wrap);
        this.statusEl = status;
        this._subTabs = subTabs;
        this._editors = editors;

        subTabs.find('.wb-comp-subtab').click(function () {
            self._activateSubTab($(this).attr('data-sub'));
        });

        newBtn.click(function () { self.newComponent(); });
        saveBtn.click(function () { self.saveAsComponent(); });

        this._form = {
            name:        form.find('[name="wbcomp-name"]'),
            icon:        form.find('[name="wbcomp-icon"]'),
            tagName:     form.find('[name="wbcomp-tagName"]'),
            cmptype:     form.find('[name="wbcomp-cmptype"]'),
            description: form.find('[name="wbcomp-description"]'),
            nestingMode: form.find('[name="wbcomp-nestingMode"]')
        };
        this._libs = {
            js:  form.find('.wb-comp-libs[data-kind="js"]'),
            css: form.find('.wb-comp-libs[data-kind="css"]')
        };
        this._propsTbody  = propBox.find('.wb-comp-props-tbody');
        this._eventsTbody = evtBox.find('.wb-comp-events-tbody');
        this._nestingRow  = rulesRow;
        this._nestingList = rulesRow.find('.wb-comp-nesting-rules');
        this._nestingAdd  = rulesRow.find('.wb-comp-nesting-add');

        this._nestingAdd.click(function () { self._addNestingRuleRow(); });

        var syncNestingUI = function () {
            var mode = self._form.nestingMode.val();
            rulesRow.toggle(mode === 'list');
        };
        this._form.nestingMode.change(syncNestingUI);
        this._syncNestingUI = syncNestingUI;

        this.newComponent();
    };

    ComponentTab.prototype._activateSubTab = function (name) {
        this._subTabs.find('.wb-comp-subtab').removeClass('wb-active');
        this._subTabs.find('.wb-comp-subtab[data-sub="' + name + '"]').addClass('wb-active');
        this._editors.find('.wb-comp-editor-box').hide();
        this._editors.find('.wb-comp-editor-box[data-sub="' + name + '"]').show();
    };

    /* ---------- вспомогательные конструкторы полей ---------- */

    ComponentTab.prototype._field = function (name, label, type) {
        return $(
            '<div class="wb-row">' +
            '<div class="wb-row-name"></div>' +
            '<div class="wb-row-value"><input type="' + (type || 'text') + '"></div>' +
            '</div>'
        ).find('.wb-row-name').text(label).end()
            .find('input').attr('name', 'wbcomp-' + name).end();
    };

    ComponentTab.prototype._selectField = function (name, label, options, defVal) {
        var row = $(
            '<div class="wb-row">' +
            '<div class="wb-row-name"></div>' +
            '<div class="wb-row-value"><select></select></div>' +
            '</div>'
        );
        row.find('.wb-row-name').text(label);
        var sel = row.find('select').attr('name', 'wbcomp-' + name);
        for (var i = 0; i < options.length; i++) {
            sel.append($('<option></option>').val(options[i].id).text(options[i].caption));
        }
        if (defVal != null) sel.val(defVal);
        return row;
    };

    ComponentTab.prototype._textarea = function (name, label) {
        return $(
            '<div class="wb-row">' +
            '<div class="wb-row-name"></div>' +
            '<div class="wb-row-value"><textarea rows="3"></textarea></div>' +
            '</div>'
        ).find('.wb-row-name').text(label).end()
            .find('textarea').attr('name', 'wbcomp-' + name).end();
    };

    ComponentTab.prototype._fileField = function (name, label) {
        var row = this._field(name, label, 'text');
        var box = row.find('.wb-row-value');
        var btn = $('<button type="button" class="wb-file-btn" title="Выбрать файл">…</button>');
        btn.click(function () {
            if (global.ProjectFilePicker) {
                global.ProjectFilePicker.open({
                    value: row.find('input').val() || '',
                    onPick: function (p) { row.find('input').val(p); }
                });
            }
        });
        box.append(btn);
        box.addClass('wb-comp-file-row');
        return row;
    };

    ComponentTab.prototype._libsField = function (kind, label) {
        var self = this;
        var row = $(
            '<div class="wb-row wb-comp-libs-row">' +
            '<div class="wb-row-name"></div>' +
            '<div class="wb-row-value">' +
            '<div class="wb-comp-libs" data-kind="' + kind + '"></div>' +
            '<button type="button" class="wb-code-btn wb-comp-lib-add">+</button>' +
            '</div>' +
            '</div>'
        );
        row.find('.wb-row-name').text(label);
        var list = row.find('.wb-comp-libs');
        row.find('.wb-comp-lib-add').click(function () { self._addLib(list, kind); });
        return row;
    };

    ComponentTab.prototype._addLib = function (listEl, kind, value, type) {
        var item = $(
            '<div class="wb-comp-lib">' +
            '<select class="wb-comp-lib-type">' +
            '<option value="url">URL</option>' +
            '<option value="project">Файл проекта</option>' +
            '</select>' +
            '<input type="text" class="wb-comp-lib-value">' +
            '<button type="button" class="wb-row-del" title="Удалить">×</button>' +
            '</div>'
        );
        item.find('.wb-comp-lib-type').val(type || 'url');
        item.find('.wb-comp-lib-value').val(value || '');
        item.find('.wb-row-del').click(function () { item.remove(); });
        listEl.append(item);
    };

    ComponentTab.prototype._collectLibs = function (kind) {
        var out = [];
        this._libs[kind].find('.wb-comp-lib').each(function () {
            var t = $(this).find('.wb-comp-lib-type').val();
            var v = $(this).find('.wb-comp-lib-value').val();
            if (v) out.push({ type: t, value: v });
        });
        return out;
    };

    ComponentTab.prototype._setLibs = function (kind, arr) {
        var list = this._libs[kind]; list.empty();
        arr = arr || [];
        for (var i = 0; i < arr.length; i++) this._addLib(list, kind, arr[i].value, arr[i].type);
    };

    /* ---------- Nesting rules ---------- */

    ComponentTab.prototype._addNestingRuleRow = function (data) {
        data = data || {};
        var row = $(
            '<div class="wb-comp-nesting-rule">' +
            '<select class="wb-cn-kind">' +
            '<option value="tag">Тег</option>' +
            '<option value="cmptype">cmptype</option>' +
            '</select>' +
            '<input type="text" class="wb-cn-value" placeholder="div / my.component">' +
            '<button type="button" class="wb-row-del" title="Удалить">×</button>' +
            '</div>'
        );
        row.find('.wb-cn-kind').val(data.kind === 'cmptype' ? 'cmptype' : 'tag');
        row.find('.wb-cn-value').val(data.value || '');
        row.find('.wb-row-del').click(function () { row.remove(); });
        this._nestingList.append(row);
    };

    ComponentTab.prototype._collectNestingRules = function () {
        var out = [];
        this._nestingList.find('.wb-comp-nesting-rule').each(function () {
            var kind = $(this).find('.wb-cn-kind').val() || 'tag';
            var value = $(this).find('.wb-cn-value').val();
            if (!value) return;
            out.push({ kind: kind, value: String(value) });
        });
        return out;
    };

    ComponentTab.prototype._setNestingRules = function (arr) {
        this._nestingList.empty();
        arr = arr || [];
        for (var i = 0; i < arr.length; i++) this._addNestingRuleRow(arr[i]);
    };

    /* ---------- Properties ---------- */
    ComponentTab.prototype._buildPropsTable = function () {
        var self = this;

        var box = $('<div class="wb-comp-props"></div>');
        var head = $(
            '<div class="wb-comp-props-head">' +
            '<button type="button" class="wb-code-btn wb-comp-prop-add">+ Свойство</button>' +
            '<span class="wb-comp-props-hint">Двойной клик по полю «JS onChange» — переход ' +
            'в JS и создание/навигация по функции.</span>' +
            '</div>'
        );
        box.append(head);

        var table = $(
            '<table class="wb-comp-props-table">' +
            '<thead><tr>' +
            '<th>Имя</th>' +
            '<th>Заголовок</th>' +
            '<th>Тип</th>' +
            '<th>Варианты (enum)</th>' +
            '<th>Ед. изм.</th>' +
            '<th>Редактор</th>' +
            '<th>URL редактора</th>' +
            '<th>Просмотрщик</th>' +
            '<th title="JS-функция, вызываемая при изменении свойства">JS onChange</th>' +
            '<th></th>' +
            '</tr></thead>' +
            '<tbody class="wb-comp-props-tbody"></tbody>' +
            '</table>'
        );
        box.append(table);
        head.find('.wb-comp-prop-add').click(function () { self._addPropRow(); });
        return box;
    };

    ComponentTab.prototype._addPropRow = function (data) {
        data = data || {};
        var self = this;
        var tr = $('<tr class="wb-comp-prop-row"></tr>');

        tr.append($('<td></td>').append($('<input type="text" class="wb-cp-name">').val(data.name || '')));
        tr.append($('<td></td>').append($('<input type="text" class="wb-cp-caption">').val(data.caption || '')));

        var typeSel = $('<select class="wb-cp-type"></select>');
        for (var i = 0; i < PROPERTY_TYPES.length; i++) {
            typeSel.append($('<option></option>').val(PROPERTY_TYPES[i].id).text(PROPERTY_TYPES[i].caption));
        }
        typeSel.val(data.type || 'string');
        tr.append($('<td></td>').append(typeSel));

        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-cp-values">').val(data.values || '').attr('placeholder', 'a,b,c')
        ));
        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-cp-unit">').val(data.unit || '').attr('placeholder', 'px')
        ));

        var ftSel = $(
            '<select class="wb-cp-fieldtype">' +
            '<option value="none">— нет —</option>' +
            '<option value="url">URL редактора</option>' +
            '<option value="predefined">Предустановленный</option>' +
            '</select>'
        ).val(data.fieldType || 'none');
        tr.append($('<td></td>').append(ftSel));

        var urlTd = $('<td></td>');
        var urlInp = $('<input type="text" class="wb-cp-fieldurl">')
            .val(data.fieldUrl || '')
            .attr('placeholder', 'editor.html');
        urlTd.append(urlInp);
        tr.append(urlTd);

        var pdSel = $('<select class="wb-cp-fieldpredefined"></select>');
        for (var j = 0; j < PREDEFINED_EDITORS.length; j++) {
            pdSel.append($('<option></option>')
                .val(PREDEFINED_EDITORS[j].id)
                .text(PREDEFINED_EDITORS[j].caption));
        }
        pdSel.val(data.fieldPredefined || '');
        var pdTd = $('<td></td>').append(pdSel);
        tr.append(pdTd);

        /* --- JS onChange function field --- */
        var funcInp = $('<input type="text" class="wb-cp-onchange">')
            .val(data.onChangeFunc || '')
            .attr('placeholder', 'onColorChange');
        var funcTd = $('<td></td>').append(funcInp);
        tr.append(funcTd);

        funcInp.dblclick(function () {
            var name = funcInp.val();
            if (!name) {
                var cName = safeIdent(self._form.name.val() || 'Component');
                var pName = safeIdent(tr.find('.wb-cp-name').val() || 'Property');
                name = 'on' + capitalize(cName) + capitalize(pName) + 'Change';
                funcInp.val(name);
            }
            var template = 'function ' + name + '(ctx) {\n' +
                '    // ctx.name        — имя свойства\n' +
                '    // ctx.value       — новое значение\n' +
                '    // ctx.oldValue    — предыдущее значение\n' +
                '    // ctx.component   — экземпляр компонента\n' +
                '    // ctx.el          — корневой DOM-элемент компонента\n' +
                '\n    \n}';
            self._gotoOrCreateFunction(name, template);
        });

        var delTd = $('<td></td>');
        var del = $('<button type="button" class="wb-row-del" title="Удалить">×</button>');
        del.click(function () { tr.remove(); });
        delTd.append(del);
        tr.append(delTd);

        function syncEditorCells() {
            var ft = ftSel.val();
            urlTd.toggle(ft === 'url');
            pdTd.toggle(ft === 'predefined');
        }
        ftSel.change(syncEditorCells);
        syncEditorCells();

        this._propsTbody.append(tr);
    };

    ComponentTab.prototype._collectProps = function () {
        var out = [];
        this._propsTbody.find('.wb-comp-prop-row').each(function () {
            var tr = $(this);
            var name = tr.find('.wb-cp-name').val();
            if (!name) return;
            out.push({
                name:            name,
                caption:         tr.find('.wb-cp-caption').val() || name,
                type:            tr.find('.wb-cp-type').val() || 'string',
                values:          tr.find('.wb-cp-values').val() || '',
                unit:            tr.find('.wb-cp-unit').val() || '',
                fieldType:       tr.find('.wb-cp-fieldtype').val() || 'none',
                fieldUrl:        tr.find('.wb-cp-fieldurl').val() || '',
                fieldPredefined: tr.find('.wb-cp-fieldpredefined').val() || '',
                onChangeFunc:    tr.find('.wb-cp-onchange').val() || ''
            });
        });
        return out;
    };

    ComponentTab.prototype._setProps = function (arr) {
        this._propsTbody.empty();
        arr = arr || [];
        for (var i = 0; i < arr.length; i++) this._addPropRow(arr[i]);
    };

    /* ---------- Component Events ---------- */
    ComponentTab.prototype._buildEventsTable = function () {
        var self = this;

        var box = $('<div class="wb-comp-events"></div>');
        var head = $(
            '<div class="wb-comp-props-head">' +
            '<button type="button" class="wb-code-btn wb-comp-event-add">+ Событие</button>' +
            '<span class="wb-comp-props-hint">Двойной клик по полю «Handler» — переход ' +
            'в JS и создание/навигация по функции.</span>' +
            '</div>'
        );
        box.append(head);

        var table = $(
            '<table class="wb-comp-events-table">' +
            '<thead><tr>' +
            '<th>Имя события</th>' +
            '<th>Заголовок</th>' +
            '<th>Обработчик (JS)</th>' +
            '<th></th>' +
            '</tr></thead>' +
            '<tbody class="wb-comp-events-tbody"></tbody>' +
            '</table>'
        );
        box.append(table);
        head.find('.wb-comp-event-add').click(function () { self._addEventRow(); });
        return box;
    };

    ComponentTab.prototype._addEventRow = function (data) {
        data = data || {};
        var self = this;
        var tr = $('<tr class="wb-comp-event-row"></tr>');

        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-ce-name">')
                .val(data.name || '')
                .attr('placeholder', 'myEvent')
        ));
        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-ce-caption">')
                .val(data.caption || '')
                .attr('placeholder', 'Моё событие')
        ));

        var funcInp = $('<input type="text" class="wb-ce-handler">')
            .val(data.handlerFunc || '')
            .attr('placeholder', 'onMyEventHandler');
        tr.append($('<td></td>').append(funcInp));

        funcInp.dblclick(function () {
            var name = funcInp.val();
            if (!name) {
                var cName = safeIdent(self._form.name.val() || 'Component');
                var eName = safeIdent(tr.find('.wb-ce-name').val() || 'Event');
                name = 'on' + capitalize(cName) + capitalize(eName);
                funcInp.val(name);
            }
            var template = 'function ' + name + '(ctx) {\n' +
                '    // ctx.type           — имя события\n' +
                '    // ctx.originalEvent  — оригинальное DOM-событие\n' +
                '    // ctx.data           — detail из CustomEvent\n' +
                '    // ctx.component      — экземпляр компонента\n' +
                '    // ctx.el             — корневой DOM-элемент компонента\n' +
                '\n    \n}';
            self._gotoOrCreateFunction(name, template);
        });

        var delTd = $('<td></td>');
        var del = $('<button type="button" class="wb-row-del" title="Удалить">×</button>');
        del.click(function () { tr.remove(); });
        delTd.append(del);
        tr.append(delTd);

        this._eventsTbody.append(tr);
    };

    ComponentTab.prototype._collectEvents = function () {
        var out = [];
        this._eventsTbody.find('.wb-comp-event-row').each(function () {
            var tr = $(this);
            var name = tr.find('.wb-ce-name').val();
            if (!name) return;
            out.push({
                name:        name,
                caption:     tr.find('.wb-ce-caption').val() || name,
                handlerFunc: tr.find('.wb-ce-handler').val() || ''
            });
        });
        return out;
    };

    ComponentTab.prototype._setEvents = function (arr) {
        this._eventsTbody.empty();
        arr = arr || [];
        for (var i = 0; i < arr.length; i++) this._addEventRow(arr[i]);
    };

    /* ---------- Навигация к функции в JS ---------- */
    ComponentTab.prototype._gotoOrCreateFunction = function (funcName, template) {
        this._activateSubTab('js');

        var code = this.jsEditor.getValue() || '';
        var esc = String(funcName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        /* Ищем объявление: `function name(` либо `name = function`. */
        var declRe = new RegExp(
            '(?:\\bfunction\\s+' + esc + '\\s*\\(|\\b' + esc + '\\s*=\\s*function\\s*\\()'
        );
        var exists = declRe.test(code);

        if (!exists) {
            var tpl = template || ('function ' + funcName + '(ctx) {\n    // TODO\n}');
            if (code && !/\n\s*$/.test(code)) code += '\n';
            code += '\n' + tpl + '\n';
            this.jsEditor.setValue(code);
        }

        /* Ищем начало тела функции: позиция после `{`. */
        var m = new RegExp(
            '(?:function\\s+' + esc + '\\s*\\([^)]*\\)\\s*\\{' +
            '|' + esc + '\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{)'
        ).exec(code);

        if (m) {
            var pos = m.index + m[0].length;
            this.jsEditor.ta.focus();
            this.jsEditor.ta.setSelectionRange(pos, pos);
            this.jsEditor.revealOffset(pos);
        }
    };

    /* ---------- Форма ---------- */
    ComponentTab.prototype.newComponent = function () {
        this._form.name.val('MyComponent');
        this._form.icon.val('');
        this._form.tagName.val('div');
        this._form.cmptype.val('my.component');
        this._form.description.val('');
        this._form.nestingMode.val('all');
        this._setLibs('js', []);
        this._setLibs('css', []);
        this._setProps([]);
        this._setEvents([]);
        this._setNestingRules([]);
        if (this._syncNestingUI) this._syncNestingUI();

        this.jsEditor.setValue('// JS\n');
        this.cssEditor.setValue('/* CSS */\n');
        this.previewEditor.setValue('<div class="my-component">\n    My Component\n</div>');
        this.statusEl.text('').css('color', '');
    };

    ComponentTab.prototype.getFormData = function () {
        return {
            name:        this._form.name.val() || 'Component',
            icon:        this._form.icon.val() || '',
            tagName:     this._form.tagName.val() || 'div',
            cmptype:     this._form.cmptype.val() || '',
            description: this._form.description.val() || '',
            jsLibs:      this._collectLibs('js'),
            cssLibs:     this._collectLibs('css'),
            js:          this.jsEditor.getValue(),
            css:         this.cssEditor.getValue(),
            previewIdeHtml: this.previewEditor.getValue(),
            customProperties: this._collectProps(),
            customEvents:     this._collectEvents(),
            nestingMode:  this._form.nestingMode.val() || 'all',
            nestingRules: this._collectNestingRules()
        };
    };

    ComponentTab.prototype.saveAsComponent = function () {
        var data = this.getFormData();
        if (!data.name) { alert('Укажите имя компонента.'); return; }
        if (!data.previewIdeHtml) { alert('PreViewIDE(html) пуст.'); return; }
        data.html = data.previewIdeHtml;

        var dup = data.cmptype ? global.ComponentStorage.findByCmptype(data.cmptype) : null;
        if (dup) {
            var ok = confirm(
                'Компонент с cmptype="' + data.cmptype + '" уже существует (' +
                dup.name + ').\n\nПерезаписать его?'
            );
            if (!ok) return;
            global.ComponentStorage.updateComponent(dup.id, data);
            var c = global.ComponentStorage.getComponent(dup.id);
            this.statusEl.text('Перезаписано: ' + c.name).css('color', '#1565c0');
            bus.emit('palette:refresh');
            alert('Компонент перезаписан: ' + c.name);
            return;
        }

        var created = global.ComponentStorage.createComponent(data);
        this.statusEl.text('Сохранено: ' + created.name).css('color', '#2e7d32');
        bus.emit('component:added', { component: created });
        bus.emit('palette:refresh');
        alert('Компонент сохранён в палитру: ' + created.name);
    };

    ComponentTab.prototype.setComponent = function (c) {
        if (!c) return;
        this._form.name.val(c.name || '');
        this._form.icon.val(c.icon || '');
        this._form.tagName.val(c.tagName || 'div');
        this._form.cmptype.val(c.cmptype || '');
        this._form.description.val(c.description || '');
        this._form.nestingMode.val(c.nestingMode || 'all');
        this._setLibs('js',  c.jsLibs || []);
        this._setLibs('css', c.cssLibs || []);
        this._setProps(c.customProperties || []);
        this._setEvents(c.customEvents || []);
        this._setNestingRules(c.nestingRules || []);
        if (this._syncNestingUI) this._syncNestingUI();

        this.jsEditor.setValue(c.js || '');
        this.cssEditor.setValue(c.css || '');
        this.previewEditor.setValue(c.previewIdeHtml || '');
    };

    ComponentTab.prototype.setActive = function (on) { this.active = !!on; };

    ComponentTab.PREDEFINED_EDITORS = PREDEFINED_EDITORS;
    ComponentTab.PROPERTY_TYPES     = PROPERTY_TYPES;
    ComponentTab.NESTING_MODES      = NESTING_MODES;

    global.ComponentTab = ComponentTab;
})(window, jQuery);
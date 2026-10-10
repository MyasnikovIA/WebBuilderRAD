/* ComponentTab — вкладка "Root: component".
   Подвкладки: JS / CSS / PreViewIDE(html) / Component Properties. */
(function (global, $) {
    'use strict';
    var bus = global.EventBus;

    /* Предопределённые редакторы/просмотрщики значений custom-полей. */
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

        wrap.append(form);

        var subTabs = $(
            '<div class="wb-comp-subtabs">' +
            '<div class="wb-comp-subtab wb-active" data-sub="js">JS</div>' +
            '<div class="wb-comp-subtab" data-sub="css">CSS</div>' +
            '<div class="wb-comp-subtab" data-sub="preview">PreViewIDE(html)</div>' +
            '<div class="wb-comp-subtab" data-sub="props">Component Properties</div>' +
            '</div>'
        );
        wrap.append(subTabs);

        var editors = $('<div class="wb-comp-editors"></div>');
        var jsBox   = $('<div class="wb-comp-editor-box" data-sub="js"></div>');
        var cssBox  = $('<div class="wb-comp-editor-box" data-sub="css" style="display:none;"></div>');
        var prevBox = $('<div class="wb-comp-editor-box" data-sub="preview" style="display:none;"></div>');
        var propBox = $('<div class="wb-comp-editor-box wb-comp-props-box" data-sub="props" style="display:none;"></div>');

        this.jsEditor      = new global.CodeEditor({ value: '', language: 'javascript' });
        this.cssEditor     = new global.CodeEditor({ value: '', language: 'css' });
        this.previewEditor = new global.CodeEditor({ value: '', language: 'xml' });

        jsBox.append(this.jsEditor.el);
        cssBox.append(this.cssEditor.el);
        prevBox.append(this.previewEditor.el);

        /* Properties-таблица. */
        propBox.append(self._buildPropsTable());

        editors.append(jsBox).append(cssBox).append(prevBox).append(propBox);
        wrap.append(editors);

        var toolbar = $('<div class="wb-comp-toolbar"></div>');
        var newBtn  = $('<button type="button" class="wb-code-btn">Новый</button>');
        var saveBtn = $('<button type="button" class="wb-code-btn">Сохранить как компонент</button>');
        var status  = $('<span class="wb-comp-status"></span>');
        toolbar.append(newBtn).append(saveBtn).append(status);
        wrap.append(toolbar);

        this.pane.empty().append(wrap);
        this.statusEl = status;

        subTabs.find('.wb-comp-subtab').click(function () {
            subTabs.find('.wb-comp-subtab').removeClass('wb-active');
            $(this).addClass('wb-active');
            var sub = $(this).attr('data-sub');
            editors.find('.wb-comp-editor-box').hide();
            editors.find('.wb-comp-editor-box[data-sub="' + sub + '"]').show();
        });

        newBtn.click(function () { self.newComponent(); });
        saveBtn.click(function () { self.saveAsComponent(); });

        this._form = {
            name:        form.find('[name="wbcomp-name"]'),
            icon:        form.find('[name="wbcomp-icon"]'),
            tagName:     form.find('[name="wbcomp-tagName"]'),
            cmptype:     form.find('[name="wbcomp-cmptype"]'),
            description: form.find('[name="wbcomp-description"]')
        };
        this._libs = {
            js:  form.find('.wb-comp-libs[data-kind="js"]'),
            css: form.find('.wb-comp-libs[data-kind="css"]')
        };
        this._propsTbody = propBox.find('.wb-comp-props-tbody');

        this.newComponent();
    };

    ComponentTab.prototype._field = function (name, label, type) {
        return $(
            '<div class="wb-row">' +
            '<div class="wb-row-name"></div>' +
            '<div class="wb-row-value"><input type="' + (type || 'text') + '"></div>' +
            '</div>'
        ).find('.wb-row-name').text(label).end()
            .find('input').attr('name', 'wbcomp-' + name).end();
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

    /* ---------- Properties ---------- */
    ComponentTab.prototype._buildPropsTable = function () {
        var self = this;

        var box = $('<div class="wb-comp-props"></div>');
        var head = $(
            '<div class="wb-comp-props-head">' +
            '<button type="button" class="wb-code-btn wb-comp-prop-add">+ Свойство</button>' +
            '<span class="wb-comp-props-hint">Пользовательские свойства компонента. ' +
            'Имя — имя HTML-атрибута, которое появится в инспекторе.</span>' +
            '</div>'
        );
        box.append(head);

        var table = $(
            '<table class="wb-comp-props-table">' +
            '<thead><tr>' +
            '<th>Имя</th>' +
            '<th>Заголовок</th>' +
            '<th>Тип значения</th>' +
            '<th>Варианты (enum, через запятую)</th>' +
            '<th>Ед. изм.</th>' +
            '<th>Тип редактора</th>' +
            '<th>URL редактора</th>' +
            '<th>Просмотрщик</th>' +
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
        var tr = $('<tr class="wb-comp-prop-row"></tr>');

        /* Name */
        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-cp-name">').val(data.name || '')
        ));
        /* Caption */
        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-cp-caption">').val(data.caption || '')
        ));
        /* Type */
        var typeSel = $('<select class="wb-cp-type"></select>');
        for (var i = 0; i < PROPERTY_TYPES.length; i++) {
            typeSel.append($('<option></option>').val(PROPERTY_TYPES[i].id).text(PROPERTY_TYPES[i].caption));
        }
        typeSel.val(data.type || 'string');
        tr.append($('<td></td>').append(typeSel));
        /* Values */
        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-cp-values">')
                .val(data.values || '')
                .attr('placeholder', 'a,b,c')
        ));
        /* Unit */
        tr.append($('<td></td>').append(
            $('<input type="text" class="wb-cp-unit">')
                .val(data.unit || '')
                .attr('placeholder', 'px')
        ));
        /* FieldType */
        var ftSel = $(
            '<select class="wb-cp-fieldtype">' +
            '<option value="none">— нет —</option>' +
            '<option value="url">URL редактора</option>' +
            '<option value="predefined">Предустановленный</option>' +
            '</select>'
        ).val(data.fieldType || 'none');
        tr.append($('<td></td>').append(ftSel));
        /* FieldUrl */
        var urlTd = $('<td></td>');
        var urlInp = $('<input type="text" class="wb-cp-fieldurl">')
            .val(data.fieldUrl || '')
            .attr('placeholder', 'editor.html');
        urlTd.append(urlInp);
        tr.append(urlTd);
        /* FieldPredefined */
        var pdSel = $('<select class="wb-cp-fieldpredefined"></select>');
        for (var j = 0; j < PREDEFINED_EDITORS.length; j++) {
            pdSel.append($('<option></option>')
                .val(PREDEFINED_EDITORS[j].id)
                .text(PREDEFINED_EDITORS[j].caption));
        }
        pdSel.val(data.fieldPredefined || '');
        tr.append($('<td></td>').append(pdSel));
        /* Delete */
        var delTd = $('<td></td>');
        var del = $('<button type="button" class="wb-row-del" title="Удалить">×</button>');
        del.click(function () { tr.remove(); });
        delTd.append(del);
        tr.append(delTd);

        /* Показываем нужное поле редактора в зависимости от FieldType. */
        function syncEditorCells() {
            var ft = ftSel.val();
            urlTd.toggle(ft === 'url');
            pdSel.parent().toggle(ft === 'predefined');
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
                fieldPredefined: tr.find('.wb-cp-fieldpredefined').val() || ''
            });
        });
        return out;
    };

    ComponentTab.prototype._setProps = function (arr) {
        this._propsTbody.empty();
        arr = arr || [];
        for (var i = 0; i < arr.length; i++) this._addPropRow(arr[i]);
    };

    /* ---------- Форма ---------- */
    ComponentTab.prototype.newComponent = function () {
        this._form.name.val('MyComponent');
        this._form.icon.val('');
        this._form.tagName.val('div');
        this._form.cmptype.val('my.component');
        this._form.description.val('');
        this._setLibs('js', []);
        this._setLibs('css', []);
        this._setProps([]);
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
            customProperties: this._collectProps()
        };
    };

    ComponentTab.prototype.saveAsComponent = function () {
        var data = this.getFormData();
        if (!data.name) { alert('Укажите имя компонента.'); return; }
        if (!data.previewIdeHtml) { alert('PreViewIDE(html) пуст.'); return; }
        data.html = data.previewIdeHtml;

        /* Уникальность по cmptype. */
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
        this._setLibs('js',  c.jsLibs || []);
        this._setLibs('css', c.cssLibs || []);
        this._setProps(c.customProperties || []);
        this.jsEditor.setValue(c.js || '');
        this.cssEditor.setValue(c.css || '');
        this.previewEditor.setValue(c.previewIdeHtml || '');
    };

    ComponentTab.prototype.setActive = function (on) { this.active = !!on; };

    ComponentTab.PREDEFINED_EDITORS = PREDEFINED_EDITORS;
    ComponentTab.PROPERTY_TYPES     = PROPERTY_TYPES;

    global.ComponentTab = ComponentTab;
})(window, jQuery);
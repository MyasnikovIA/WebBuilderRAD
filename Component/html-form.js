(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;
    function schema(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    R.register({ id: 'form.form', category: 'Forms', caption: 'Form', tagName: 'form',
        create: function (doc) {
            var el = doc.createElement('form');
            el.style.padding = '8px'; el.style.border = '1px dashed #ccc';
            return el;
        }, schema: schema([
            { name: 'action', caption: 'Action', type: 'string', attr: true },
            { name: 'method', caption: 'Method', type: 'enum', attr: true, values: ['get', 'post'] }
        ]) });

    R.register({ id: 'form.input', category: 'Forms', caption: 'Input', tagName: 'input',
        create: function (doc) { var el = doc.createElement('input'); el.type = 'text'; return el; },
        schema: schema([
            { name: 'type',        caption: 'Type',        type: 'enum', attr: true,
                values: ['text','password','email','number','tel','url','search','date','time','color','file','checkbox','radio','range','hidden'] },
            { name: 'name',        caption: 'Name',        type: 'string', attr: true },
            { name: 'value',       caption: 'Value',       type: 'string', attr: true },
            { name: 'placeholder', caption: 'Placeholder', type: 'string', attr: true },
            { name: 'checked',     caption: 'Checked',     type: 'boolean' },
            { name: 'disabled',    caption: 'Disabled',    type: 'boolean' },
            { name: 'readonly',    caption: 'Read Only',   type: 'boolean' },
            { name: 'required',    caption: 'Required',    type: 'boolean' }
        ]) });

    R.register({ id: 'form.textarea', category: 'Forms', caption: 'TextArea', tagName: 'textarea',
        create: function (doc) { var el = doc.createElement('textarea'); el.rows = 4; return el; },
        schema: schema([
            { name: 'name',        caption: 'Name',        type: 'string', attr: true },
            { name: 'placeholder', caption: 'Placeholder', type: 'string', attr: true },
            { name: 'rows',        caption: 'Rows',        type: 'number', attr: true },
            { name: 'cols',        caption: 'Cols',        type: 'number', attr: true },
            { name: 'disabled',    caption: 'Disabled',    type: 'boolean' },
            { name: 'required',    caption: 'Required',    type: 'boolean' }
        ]) });

    R.register({ id: 'form.button', category: 'Forms', caption: 'Button', tagName: 'button',
        create: function (doc) { var el = doc.createElement('button'); el.textContent = 'Button'; return el; },
        schema: schema([
            { name: 'type',     caption: 'Type',     type: 'enum', attr: true, values: ['button','submit','reset'] },
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'disabled', caption: 'Disabled', type: 'boolean' }
        ]) });

    R.register({ id: 'form.select', category: 'Forms', caption: 'Select', tagName: 'select',
        create: function (doc) { return doc.createElement('select'); },
        schema: schema([
            { name: 'name',     caption: 'Name',     type: 'string', attr: true },
            { name: 'multiple', caption: 'Multiple', type: 'boolean' },
            { name: 'disabled', caption: 'Disabled', type: 'boolean' }
        ]) });

    R.register({ id: 'form.option', category: 'Forms', caption: 'Option', tagName: 'option',
        create: function (doc) { var el = doc.createElement('option'); el.textContent = 'Option'; return el; },
        schema: schema([
            { name: 'value',    caption: 'Value',    type: 'string', attr: true },
            { name: 'selected', caption: 'Selected', type: 'boolean' },
            { name: 'disabled', caption: 'Disabled', type: 'boolean' }
        ]) });

    R.register({ id: 'form.label', category: 'Forms', caption: 'Label', tagName: 'label',
        create: function (doc) { var el = doc.createElement('label'); el.textContent = 'Label'; return el; },
        schema: schema([{ name: 'for', caption: 'For', type: 'string', attr: true }]) });
})(window);
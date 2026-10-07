/* Общие наборы свойств/стилей/событий. Компоненты их переиспользуют. */
(function (global) {
    'use strict';

    var STYLE_FIELDS = [
        { name: 'display',         caption: 'Display',        type: 'enum',   values: ['', 'block','inline','inline-block','flex','inline-flex','grid','none'] },
        { name: 'position',        caption: 'Position',       type: 'enum',   values: ['', 'static','relative','absolute','fixed','sticky'] },
        { name: 'width',           caption: 'Width',          type: 'length' },
        { name: 'height',          caption: 'Height',         type: 'length' },
        { name: 'minWidth',        caption: 'Min Width',      type: 'length' },
        { name: 'minHeight',       caption: 'Min Height',     type: 'length' },
        { name: 'maxWidth',        caption: 'Max Width',      type: 'length' },
        { name: 'maxHeight',       caption: 'Max Height',     type: 'length' },
        { name: 'top',             caption: 'Top',            type: 'length' },
        { name: 'left',            caption: 'Left',           type: 'length' },
        { name: 'right',           caption: 'Right',          type: 'length' },
        { name: 'bottom',          caption: 'Bottom',         type: 'length' },
        { name: 'margin',          caption: 'Margin',         type: 'string' },
        { name: 'padding',         caption: 'Padding',        type: 'string' },
        { name: 'backgroundColor', caption: 'Background',     type: 'color'  },
        { name: 'color',           caption: 'Text Color',     type: 'color'  },
        { name: 'fontFamily',      caption: 'Font Family',    type: 'string' },
        { name: 'fontSize',        caption: 'Font Size',      type: 'length' },
        { name: 'fontWeight',      caption: 'Font Weight',    type: 'enum',   values: ['', 'normal','bold','100','200','300','400','500','600','700','800','900'] },
        { name: 'fontStyle',       caption: 'Font Style',     type: 'enum',   values: ['', 'normal','italic','oblique'] },
        { name: 'textAlign',       caption: 'Text Align',     type: 'enum',   values: ['', 'left','right','center','justify'] },
        { name: 'textDecoration',  caption: 'Text Decoration',type: 'enum',   values: ['', 'none','underline','overline','line-through'] },
        { name: 'lineHeight',      caption: 'Line Height',    type: 'string' },
        { name: 'border',          caption: 'Border',         type: 'string' },
        { name: 'borderRadius',    caption: 'Border Radius',  type: 'length' },
        { name: 'boxShadow',       caption: 'Box Shadow',     type: 'string' },
        { name: 'opacity',         caption: 'Opacity',        type: 'number' },
        { name: 'overflow',        caption: 'Overflow',       type: 'enum',   values: ['', 'visible','hidden','scroll','auto'] },
        { name: 'zIndex',          caption: 'Z-Index',        type: 'number' },
        { name: 'cursor',          caption: 'Cursor',         type: 'enum',   values: ['', 'default','pointer','text','move','crosshair','not-allowed','wait','help'] }
    ];

    var EVENT_FIELDS = [
        { name: 'onclick',      caption: 'OnClick',      type: 'code' },
        { name: 'ondblclick',   caption: 'OnDblClick',   type: 'code' },
        { name: 'onmousedown',  caption: 'OnMouseDown',  type: 'code' },
        { name: 'onmouseup',    caption: 'OnMouseUp',    type: 'code' },
        { name: 'onmouseover',  caption: 'OnMouseOver',  type: 'code' },
        { name: 'onmouseout',   caption: 'OnMouseOut',   type: 'code' },
        { name: 'onmousemove',  caption: 'OnMouseMove',  type: 'code' },
        { name: 'onkeydown',    caption: 'OnKeyDown',    type: 'code' },
        { name: 'onkeyup',      caption: 'OnKeyUp',      type: 'code' },
        { name: 'onkeypress',   caption: 'OnKeyPress',   type: 'code' },
        { name: 'onchange',     caption: 'OnChange',     type: 'code' },
        { name: 'oninput',      caption: 'OnInput',      type: 'code' },
        { name: 'onfocus',      caption: 'OnFocus',      type: 'code' },
        { name: 'onblur',       caption: 'OnBlur',       type: 'code' }
    ];

    var PROPERTY_FIELDS = [
        { name: 'id',          caption: 'Id',    type: 'string', attr: true },
        { name: 'className',   caption: 'Class', type: 'string' },
        { name: 'title',       caption: 'Title', type: 'string', attr: true },
        { name: 'textContent', caption: 'Text',  type: 'text' }
    ];

    function defaultSchema() {
        return {
            properties: PROPERTY_FIELDS.slice(),
            styles:     STYLE_FIELDS.slice(),
            events:     EVENT_FIELDS.slice()
        };
    }

    global.CommonSchema = {
        STYLE_FIELDS:     STYLE_FIELDS,
        EVENT_FIELDS:     EVENT_FIELDS,
        PROPERTY_FIELDS:  PROPERTY_FIELDS,
        defaultSchema:    defaultSchema
    };
})(window);
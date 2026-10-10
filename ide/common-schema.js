/* Общие наборы свойств/стилей/событий. Компоненты их переиспользуют.

   Поля могут иметь свойство `suggest` — массив подсказок для datalist.
   Ввод при этом остаётся свободным: пользователь может выбрать из списка
   или набрать произвольное значение. */
(function (global) {
    'use strict';

    var STYLE_FIELDS = [
        { name: 'display',         caption: 'Display',        type: 'enum',
            values: ['', 'block','inline','inline-block','flex','inline-flex','grid','none'] },

        { name: 'position',        caption: 'Position',       type: 'enum',
            values: ['', 'static','relative','absolute','fixed','sticky'] },

        { name: 'width',           caption: 'Width',          type: 'length',
            suggest: ['auto', '100%', '50%', 'fit-content', 'min-content', 'max-content'] },

        { name: 'height',          caption: 'Height',         type: 'length',
            suggest: ['auto', '100%', '100vh', '50vh', 'fit-content'] },

        { name: 'minWidth',        caption: 'Min Width',      type: 'length' },
        { name: 'minHeight',       caption: 'Min Height',     type: 'length' },
        { name: 'maxWidth',        caption: 'Max Width',      type: 'length' },
        { name: 'maxHeight',       caption: 'Max Height',     type: 'length' },

        { name: 'top',             caption: 'Top',            type: 'length' },
        { name: 'left',            caption: 'Left',           type: 'length' },
        { name: 'right',           caption: 'Right',          type: 'length' },
        { name: 'bottom',          caption: 'Bottom',         type: 'length' },

        { name: 'margin',          caption: 'Margin',         type: 'string',
            suggest: [
                '0', 'auto', '0 auto',
                '2px', '4px', '5px', '8px', '10px', '12px', '15px', '20px', '30px',
                '5px 10px', '10px 20px', '10px 20px 30px', '10px 20px 30px 40px',
                '0 auto 10px', '10px auto',
                'inherit', 'initial'
            ] },

        { name: 'padding',         caption: 'Padding',        type: 'string',
            suggest: [
                '0', 'auto',
                '2px', '4px', '5px', '6px', '8px', '10px', '12px', '15px', '20px', '30px',
                '5px 10px', '10px 20px', '10px 20px 30px', '10px 20px 30px 40px',
                'inherit', 'initial'
            ] },

        { name: 'backgroundColor', caption: 'Background',     type: 'color',
            suggest: ['transparent', 'inherit', 'initial'] },

        { name: 'color',           caption: 'Text Color',     type: 'color',
            suggest: ['inherit', 'initial', 'currentColor'] },

        { name: 'fontFamily',      caption: 'Font Family',    type: 'string',
            suggest: [
                'inherit',
                'Arial, sans-serif',
                'Helvetica, Arial, sans-serif',
                "'Segoe UI', Tahoma, sans-serif",
                'Verdana, sans-serif',
                'Tahoma, sans-serif',
                'Georgia, serif',
                "'Times New Roman', serif",
                "'Courier New', monospace",
                'Consolas, monospace',
                'system-ui, sans-serif'
            ] },

        { name: 'fontSize',        caption: 'Font Size',      type: 'length',
            suggest: ['11px', '12px', '13px', '14px', '16px', '18px', '20px', '24px',
                '0.75em', '1em', '1.25em', '1.5em', 'inherit'] },

        { name: 'fontWeight',      caption: 'Font Weight',    type: 'enum',
            values: ['', 'normal','bold','100','200','300','400','500','600','700','800','900','inherit'] },

        { name: 'fontStyle',       caption: 'Font Style',     type: 'enum',
            values: ['', 'normal','italic','oblique','inherit'] },

        { name: 'textAlign',       caption: 'Text Align',     type: 'enum',
            values: ['', 'left','right','center','justify','inherit'] },

        { name: 'textDecoration',  caption: 'Text Decoration',type: 'enum',
            values: ['', 'none','underline','overline','line-through','underline dotted','underline wavy','inherit'] },

        { name: 'letterSpacing',   caption: 'Letter Spacing', type: 'string',
            suggest: ['normal', '0', '0.5px', '1px', '1.5px', '2px', '-0.5px', 'inherit'] },

        { name: 'lineHeight',      caption: 'Line Height',    type: 'string',
            suggest: [
                'inherit', 'normal',
                '1', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.8', '2',
                '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px'
            ] },

        { name: 'border',          caption: 'Border',         type: 'string',
            suggest: [
                'none', '0',
                '1px solid #c0c0c0',
                '1px solid #000000',
                '1px solid #1e88e5',
                '1px solid #e0e0e0',
                '1px solid transparent',
                '1px dashed #999999',
                '1px dotted #999999',
                '2px solid #c0c0c0',
                '2px solid #1e88e5',
                'inherit'
            ] },

        { name: 'borderRadius',    caption: 'Border Radius',  type: 'length',
            suggest: ['0', '2px', '3px', '4px', '6px', '8px', '12px', '50%', '999px', 'inherit'] },

        { name: 'boxShadow',       caption: 'Box Shadow',     type: 'string',
            suggest: [
                'none',
                '0 1px 2px rgba(0,0,0,0.10)',
                '0 2px 4px rgba(0,0,0,0.15)',
                '0 4px 8px rgba(0,0,0,0.20)',
                '0 8px 16px rgba(0,0,0,0.25)',
                'inset 0 1px 2px rgba(0,0,0,0.10)',
                '0 0 0 1px #1e88e5',
                '0 0 8px rgba(30,136,229,0.5)',
                'inherit'
            ] },

        { name: 'opacity',         caption: 'Opacity',        type: 'number',
            suggest: ['0', '0.1', '0.25', '0.5', '0.75', '0.9', '1'] },

        { name: 'overflow',        caption: 'Overflow',       type: 'enum',
            values: ['', 'visible','hidden','scroll','auto','clip','inherit'] },

        { name: 'zIndex',          caption: 'Z-Index',        type: 'number',
            suggest: ['0', '1', '2', '10', '100', '1000', '9999'] },

        { name: 'cursor',          caption: 'Cursor',         type: 'enum',
            values: ['', 'default','pointer','text','move','crosshair','not-allowed','wait','help',
                'grab','grabbing','col-resize','row-resize','zoom-in','zoom-out','inherit'] },

        { name: 'whiteSpace',      caption: 'White Space',    type: 'enum',
            values: ['', 'normal','nowrap','pre','pre-wrap','pre-line','inherit'] },

        { name: 'textOverflow',    caption: 'Text Overflow',  type: 'enum',
            values: ['', 'clip','ellipsis','inherit'] },

        { name: 'verticalAlign',   caption: 'Vertical Align', type: 'enum',
            values: ['', 'baseline','middle','top','bottom','text-top','text-bottom','sub','super','inherit'] },

        { name: 'boxSizing',       caption: 'Box Sizing',     type: 'enum',
            values: ['', 'content-box','border-box','inherit'] }
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
# cmpScript

Служебный контрол для JavaScript-кода формы. В рантайме
оборачивается в `<textarea style="display:none;">…</textarea>`;
при парсинге формы сервер извлекает содержимое и включает его
в общий скрипт-блок.

В IDE невидим, доступен только в дереве и инспекторе.

---

## Расположение

```
Component/d3/Script/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `ScriptCtrl.inc` | class `Script extends BaseCtrl` |
| (клиентский контрол отсутствует) | |

---

## Тег и ID

- **XML-тег:** `cmpScript`
- **Регистрация в IDE:** `id: 'd3.script'`
- **Категория:** D3
- **Вид в палитре:** `Script`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)

---

## Разметка в рантайме

Серверный `Script::Show()` выводит:

```html
<textarea style="display:none;">
<![CDATA[
Form.save = function() {
    executeAction('ACT_SAVE', function() { close(); });
};
]]>
</textarea>
```

Внешняя обёртка — `<textarea>`, содержимое — CDATA-блок с
JavaScript. Открывающий тег пишет `BaseCtrl::Show()`, закрывающий —
`Script::Show()`.

При парсинге формы сервер (FormParser) извлекает содержимое
`<textarea>` и включает его в скрипт-блок формы.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name` — идентификатор контрола (опционально)

### Script
- **`cdata`** — тип `code`. JavaScript-код в CDATA.

### Events
Пусто.

### Styles
Пусто.

---

## Примеры использования

### 1. Простой скрипт

```xml
<cmpScript name="">
<![CDATA[
Form.save = function() {
    executeAction('ACT_SAVE', function() {
        close();
    });
};
]]>
</cmpScript>
```

### 2. Обработчик `oncreate`

```xml
<cmpForm oncreate="Form.OnCreate();">
    <cmpScript name="">
    <![CDATA[
    Form.OnCreate = function() {
        setVar('LPU', 10903);
        executeAction('ACT_LOAD');
    };
    ]]>
    </cmpScript>
</cmpForm>
```

### 3. Несколько блоков

```xml
<cmpScript name="">
<![CDATA[
Form.addPC = function() { … };
]]>
</cmpScript>

<cmpScript name="">
<![CDATA[
Form.editPC = function() { … };
]]>
</cmpScript>
```

Сервер объединит все `<cmpScript>` в один скрипт-блок формы.

### 4. Совместно с `Action`

```xml
<cmpScript name="">
<![CDATA[
Form.save = function() {
    executeAction('ACT_SAVE', function(res) {
        if (res && res.newid) setVar('id', res.newid);
    });
};
]]>
</cmpScript>

<cmpAction name="ACT_SAVE">
    <![CDATA[
    begin
        D_PKG_ITEMS.ADD(pnNAME => :name, pnD_INSERT_ID => :id);
    end;
    ]]>
    <cmpActionVar name="name" src="name" srctype="ctrl" put="name"/>
    <cmpActionVar name="id"   src="id"   srctype="var"  put="id"/>
</cmpAction>
```

### 5. Обёртка над внешним вызовом

```xml
<cmpScript name="">
<![CDATA[
Form.refresh = function() {
    refreshDataSet('DS_HH', function() {
        console.log('Data refreshed');
    });
};

Form.openEdit = function(id) {
    openD3Form('Items/Edit', true, {
        width: 640,
        height: 480,
        vars: { id: id },
        onclose: function(res) {
            if (res && res.newid) Form.refresh();
        }
    });
};
]]>
</cmpScript>
```

---

## Поведение в IDE

Компонент **невидимый**. После вставки ничего не появится.

### В дереве

```
cmpScript name=""
```

Одна строка — детей нет.

### В инспекторе

Все атрибуты доступны. `cdata` — тип `code`, открывается модальный
редактор с подсветкой JS.

### Ограничения

- **Не отображается в canvas** — только в дереве.
- **Без содержимого бесполезен** — пустой скрипт-блок ничего не
  делает.
- **`name` не обязателен** — задаётся для идентификации.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 data**:

```html
<script src="Component/d3/Script/index.js"></script>
```

### Правки в `ide/canvas.js`

**`_injectIdeStyle`:**

```js
'cmpaction, cmpdataset, cmpscript, cmpmask, cmpbroker, ' +
'cmpcomment, cmpcompleter, cmpdependences, cmpfetch, ' +
'cmpfetchvar, cmplocate, cmpmodule, cmpmodulevar, ' +
'cmprepeaterstyler {' +
'  display: none !important; visibility: hidden !important;' +
'  pointer-events: none !important; user-select: none !important;' +
'}'
```

**`CDATA_CONTAINERS`:**

```js
var CDATA_CONTAINERS = {
    cmpaction:1, cmpdataset:1, cmpscript:1, cmpsubaction:1,
    cmprepeaterstyler:1
};
```

**`CMP_TAGS`:**

```js
'cmpscript': 'cmpScript',
```

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpscript': 'cmpScript',
```

### `XML_SELF_CLOSE` и `PARENT_ONLY`

Не трогаем — `Script` контейнерный и не ограничен по родителю.

---

## Известные ограничения

1. **Содержимое — CDATA**, без неё символы `<`, `>`, `&`, `"`
   сломают XML. IDE оборачивает автоматически благодаря
   `CDATA_CONTAINERS`.

2. **`Script` не выполняется в IDE** — только сохраняется в XML.
   Реальное выполнение — на сервере при загрузке формы.

3. **`name` игнорируется сервером** — `Script::__construct` читает
   только `style` и `printTag`. Поле в инспекторе — для
   идентификации в дереве.

4. **Подсветка JS зависит от Highlight.js** — если в проекте нет
   language pack `javascript`, код отобразится как plain text.

5. **Несколько `<cmpScript>`** объединяются в один скрипт-блок
   формы. Порядок — как в XML.

6. **`style="display:none"`** — сервер добавляет атрибут в
   `__construct`. IDE тоже ставит `style.display = 'none'` в
   `create()`, чтобы `<textarea>` не мешал.

7. **Взаимодействие с `Action`/`DataSet`/`Module`** — `Script`
   обычно содержит JS-функции, которые вызывают `executeAction`,
   `executeModule`, `refreshDataSet` и т. п.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → Script**.
2. В инспекторе задать `name` (опционально).
3. Открыть поле `cdata` и написать JavaScript-код.
4. Проверить в дереве: `cmpScript` — одна строка.
5. При сохранении убедиться, что CDATA-блок не поломал XML.

---

## См. также

- `Component/d3/Action/README.md` — Action, часто вызываемый из скрипта
- `Component/d3/DataSet/README.md` — DataSet для получения данных
- `Component/d3/Module/README.md` — Module для вызова серверной логики
- `ScriptCtrl.inc` — серверный код `Script`

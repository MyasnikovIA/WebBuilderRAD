# cmpServerScript

Служебный контрол для серверного скрипта. Содержимое исполняется
на сервере через `eval()`, вывод парсится как D3-разметка и
вставляется в родителя. То есть это **серверный генератор HTML**,
а не просто скрипт.

В IDE невидим. Содержимое редактируется в модальном окне с
подсветкой синтаксиса (Highlight.js). Язык подсветки выбирается
в инспекторе через атрибут `language`.

---

## Расположение

```
Component/d3/ServerScript/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `ServerScriptCtrl.inc` | class `ServerScript extends BaseCtrl` |
| (клиентский контрол отсутствует) | |

---

## Тег и ID

- **XML-тег:** `cmpServerScript`
- **Регистрация в IDE:** `id: 'd3.serverscript'`
- **Категория:** D3
- **Вид в палитре:** `ServerScript`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)

---

## Разметка в рантайме

Серверный `ServerScript::Show()`:

1. Запускает буферизацию вывода: `ob_start()`.
2. Выполняет `eval($this->script)`.
3. Ловит вывод через `ob_get_clean()`.
4. Оборачивает результат в `<dummy>…</dummy>` и парсит через
   `FormParser` — результат вставляется в родителя.

`ServerScript` не рендерит HTML сам — он **генерирует** HTML,
который затем проходит через FormParser (как обычная D3-форма).

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name` — идентификатор контрола

### ServerScript
- **`language`** — `php | javascript | sql | xml | css | json | text`.
  Используется для подсветки синтаксиса в IDE. Сервер в текущей
  версии всегда выполняет PHP.
- **`script`** — тип `code-editor`. Открывается модальное окно
  с подсветкой. Язык подсветки берётся из атрибута `language`.

### Events
Пусто.

### Styles
Пусто.

---

## Примеры использования

### 1. Простой скрипт

```xml
<cmpServerScript name="" language="php">
<![CDATA[
echo "<cmpLabel caption=\"Hello, world!\"/>";
]]>
</cmpServerScript>
```

На месте компонента появится `<cmpLabel caption="Hello, world!"/>`.

### 2. Условный вывод

```xml
<cmpServerScript name="" language="php">
<![CDATA[
$items = D3Api::getFormVar('items', []);
$count = count($items);
if ($count > 0) {
    echo "<cmpLabel caption=\"Всего: " . $count . " записей\"/>";
} else {
    echo "<cmpLabel caption=\"Список пуст\"/>";
}
]]>
</cmpServerScript>
```

### 3. Генерация формы

```xml
<cmpServerScript name="" language="php">
<![CDATA[
$fields = ['name', 'code', 'date'];
echo "<table>";
foreach ($fields as $f) {
    echo "<tr>";
    echo "<td><cmpLabel caption=\"" . $f . ":\"/></td>";
    echo "<td><cmpEdit name=\"" . $f . "\"/></td>";
    echo "</tr>";
}
echo "</table>";
]]>
</cmpServerScript>
```

### 4. Включение фрагмента формы

```xml
<cmpServerScript name="" language="php">
<![CDATA[
$part = 'Includes/common_header';
echo getFormContent($part);
]]>
</cmpServerScript>
```

### 5. Вставка данных из БД

```xml
<cmpServerScript name="" language="php">
<![CDATA[
$q = getQuery('select count(*) cnt from d_items where lpu = :lpu');
$q->BindValue('lpu', $_SESSION['LPU']);
$q->Execute();
$r = $q->FetchAssoc();
echo "<cmpLabel caption=\"Записей в базе: " . $r['cnt'] . "\"/>";
]]>
</cmpServerScript>
```

### 6. Скрипт с подсветкой JavaScript

Атрибут `language` влияет только на подсветку в IDE. Сервер всё
равно выполнит код как PHP. Если хочется подсветить JavaScript
(например, для наглядности в редакторе), задайте
`language="javascript"`:

```xml
<cmpServerScript name="" language="javascript">
<![CDATA[
// Этот код на самом деле PHP, но в IDE подсвечивается как JS
$config = ['debug' => false, 'verbose' => true];
echo "<cmpLabel caption=\"" . json_encode($config) . "\"/>";
]]>
</cmpServerScript>
```

### 7. SQL-подсветка

```xml
<cmpServerScript name="" language="sql">
<![CDATA[
$q = getQuery('select id, name from d_users where active = 1');
$q->Execute();
while ($r = $q->FetchAssoc()) {
    echo "<cmpLabel caption=\"" . $r['name'] . "\"/>";
}
]]>
</cmpServerScript>
```

---

## Поведение в IDE

Компонент **невидимый**. После вставки ничего не появится —
результат зависит от серверного `eval`.

### В дереве

```
cmpServerScript name="" language="php"
```

Одна строка — детей нет (в IDE).

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`
- ServerScript: `language` (enum), `script` (поле типа `code-editor`)
- Events: пусто
- Styles: пусто

Кнопка **Edit…** рядом с полем `script` открывает модальное окно
с подсветкой Highlight.js. Язык подсветки соответствует значению
атрибута `language`.

### Ограничения

- **Не отображается в canvas** — только в дереве.
- **Не выполняется в IDE** — только в рантайме (серверный `eval`).
- **Подсветка зависит от Highlight.js** — если в проекте нет
  language pack для выбранного языка, редактор покажет plain text.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 data**:

```html
<script src="Component/d3/ServerScript/index.js"></script>
```

### Правки в `ide/canvas.js`

**`_injectIdeStyle` — скрыть компонент в canvas:**

```js
'cmpaction, cmpdataset, cmpscript, cmpmask, cmpbroker, ' +
'cmpcomment, cmpcompleter, cmpdependences, cmpfetch, ' +
'cmpfetchvar, cmplocate, cmpmodule, cmpmodulevar, ' +
'cmprepeaterstyler, cmpserverscript {' +
'  display: none !important; visibility: hidden !important;' +
'  pointer-events: none !important; user-select: none !important;' +
'}'
```

**`CDATA_CONTAINERS` — оборачивать содержимое в CDATA:**

```js
var CDATA_CONTAINERS = {
    cmpaction:1, cmpdataset:1, cmpscript:1, cmpsubaction:1,
    cmprepeaterstyler:1, cmpserverscript:1
};
```

**`CMP_TAGS`:**

```js
'cmpserverscript': 'cmpServerScript',
```

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpserverscript': 'cmpServerScript',
```

### Правки в `ide/panels.js` — тип поля `code-editor`

В методе `_editor` (или `_buildEditor`) добавлен новый тип
`code-editor`, использующий `CodeEditor` вместо plain textarea:

```js
if (t === 'code-editor') {
    var btn2 = $('<button type="button" class="wb-code-btn">Edit…</button>');
    btn2.click(function () {
        var current = self._getValue(tab, f);
        var lang = 'xml';
        if (typeof f.language === 'function') {
            lang = f.language(self.element) || 'xml';
        } else if (typeof f.language === 'string') {
            lang = f.language;
        }
        var editor = new CodeEditor({ value: current, language: lang });
        Modal.open({
            title: f.caption || f.name,
            content: editor.el,
            onOk: function () { commit(editor.getValue()); }
        });
        setTimeout(function () { editor.focus(); }, 50);
    });
    return btn2;
}
```

### `XML_SELF_CLOSE` и `PARENT_ONLY`

Не трогаем:
- `XML_SELF_CLOSE` — `ServerScript` содержит текст (CDATA);
- `PARENT_ONLY` — без ограничений.

---

## Известные ограничения

1. **CDATA обязательна.** PHP-код содержит `<`, `>`, `&`, `"`.
   IDE оборачивает автоматически.

2. **Язык `language` — служебный.** Серверный `ServerScriptCtrl.inc`
   его не читает — всегда выполняет PHP через `eval()`. Атрибут
   сохраняется в XML на будущее.

3. **`eval()` — небезопасно.** Любой код, введённый в
   `ServerScript`, выполняется с полными правами сервера.
   Ограничивайте доступ к редактированию `.frm`-файлов.

4. **Вывод парсится через FormParser.** Это значит, что
   сгенерированный HTML должен быть валидной D3-разметкой.
   Обычный HTML без `cmp*`-тегов тоже сработает, но не получит
   клиентской логики D3.

5. **Ошибки `eval()` ловятся, но показываются в вывод.** Если
   код выбросит `Exception`, его сообщение попадёт в `_showtext`
   и вставится в форму как текст.

6. **Подсветка зависит от Highlight.js.** Если в проекте
   Highlight.js без нужного language pack (например, без `php`),
   редактор отобразит plain text.

7. **`code-editor` — новый тип поля**, требующий правки в
   `panels.js`. Без правки поле отобразится как обычная
   `<textarea>` (fallback на `type: 'string'` не сработает —
   нужно добавить ветку явно).

8. **`script` вместо `cdata`** — имя поля выбрано для
   читаемости в инспекторе. В XML содержимое хранится в CDATA.

9. **`ServerScript` не имеет клиентского контрола.** Все
   взаимодействия — на сервере в момент рендера формы.

10. **Генерация `<dummy>`-обёртки.** FormParser парсит вывод
    как фрагмент D3-формы. Если вывод содержит незакрытые теги,
    парсер может выбросить исключение.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → ServerScript**.
2. В инспекторе задать:
    - `name` — для идентификации (опционально);
    - `language` — язык подсветки в IDE;
    - `script` — открыть **Edit…** и ввести код.
3. Проверить в дереве: `cmpServerScript` — одна строка.
4. При сохранении убедиться, что CDATA-блок не поломал XML.
5. В рантайме: результат серверного `eval` должен корректно
   распарситься как D3-разметка.

---

## См. также

- `Component/d3/Script/README.md` — клиентский `Script` (JS)
- `Component/d3/Action/README.md` — серверный PL/SQL Action
- `Component/d3/Module/README.md` — серверный модуль
- `ServerScriptCtrl.inc` — серверный код
- `ide/code-editor.js` — редактор с подсветкой
- `ide/panels.js` — Inspector, где добавлен тип `code-editor`

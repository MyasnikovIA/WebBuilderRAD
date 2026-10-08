# cmpTextArea

Многострочное поле ввода. В рантайме оборачивается в `div.textArea`
с `<textarea>` внутри. Управляется клиентским контролом
`D3Api.TextAreaCtrl`: значение, обрезка пробелов (`trim`),
placeholder, readonly, `maxlength`, `disabled`.

---

## Расположение

```
Component/d3/TextArea/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `TextAreaCtrl.inc` | class `TextArea extends BaseCtrl` |
| `TextArea.js` | `D3Api.TextAreaCtrl` |
| `TextArea.css` | стили `.textArea`, `.textArea textarea` |

---

## Тег и ID

- **XML-тег:** `cmpTextArea`
- **Регистрация в IDE:** `id: 'd3.textarea'`
- **Категория:** D3
- **Вид в палитре:** `TextArea`
- **Видимость:** видимый (рендерит разметку в canvas)

---

## Разметка в рантайме

Серверный `TextArea::Show()` собирает:

```html
<div class="textArea box-sizing-force editControl"
     name="comment" style="…" …attrs…>
  <textarea cmpparse="TextArea"
            [maxlength="500"]
            [placeholder="Введите комментарий"]
            [readonly="readonly"]
            [disabled="disabled"]
            …events…>value или text</textarea>
</div>
```

Особенности:

- `<textarea>` рендерится с атрибутом `cmpparse="TextArea"` —
  маркер, по которому `D3Form` находит контрол.
- Значение берётся из `$this->value` (атрибут `value`), а если
  пусто — из `$this->text` (накопленный `SetInnerText`).
- `readonly` и `disabled` пишутся как стандартные HTML-атрибуты.
- `placeholder` и `maxlength` передаются, только если заданы.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `title`

### D3 Base
- `name` — имя контрола
- `value` — значение
- `enabled`, `visible`, `hint`, `width`, `height`

### TextArea
- **`placeholder`** — подсказка внутри поля
- **`maxlength`** — максимальная длина (число)
- **`rows`** — количество строк (число)
- **`cols`** — количество колонок (число)
- **`readonly`** — `true` — только для чтения
- **`trim`** — `true` — обрезать пробелы при чтении `value`
- **`hint-autofill`** — `true` — авто-подсказка по значению

### Events
- `onchange` — изменение значения
- `oninput` — ввод (в реальном времени)
- `onfocus`, `onblur`
- `onclick`, `ondblclick`
- `onkeydown`, `onkeyup`, `onkeypress`

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `name` | string | Имя контрола для `getControl` / `getValue` |
| `value` | string | Значение textarea. При пустом `value` используется текст внутри `<textarea>` |
| `placeholder` | string | Подсказка внутри поля (HTML5) |
| `maxlength` | number | Максимальная длина ввода |
| `readonly` | boolean | `true` — только для чтения |
| `trim` | boolean | `true` — обрезать пробелы в начале и конце при чтении |
| `hint-autofill` | boolean | `true` — tooltip автоматически обновляется по значению |
| `enabled` | boolean | `false` — поле отключено |
| `visible` | boolean | `false` — поле скрыто |
| `rows`, `cols` | number | Размеры textarea (в серверном коде не читаются, попадают в XML) |

---

## Логика работы

### Инициализация

`D3Api.TextAreaCtrl.init(dom)`:

1. Находит `<textarea>` внутри `<div>`.
2. Навешивает `change` — при вводе обновляет значение контрола:
   ```js
   D3Api.setControlPropertyByDom(dom, 'value', TextAreaCtrl.getValue(dom));
   ```
3. Инициализирует фокус через `init_focus(ta)`.
4. Читает `trim` из атрибутов в `_dom.D3Store.trim`.
5. Инициализирует `onchange`.
6. Если задан `hint-autofill` — подписывается на изменение
   `value` и обновляет tooltip.
7. Подписывается на `onchange_property`: при изменении `value`
   вызывает `onchange`.

### Управление значением

- **`getValue(dom)`** — читает `ta.value`, при `trim=true` обрезает
  через `D3Api.stringTrim`.
- **`setValue(dom, value)`** — пишет в `ta.value` и `ta.innerHTML`.
  `null` превращается в `''`.

### Включение / отключение

- **`setEnabled(dom, value)`** — `value=true` снимает `disabled`
  с `<textarea>`, `value=false` ставит.

### Получение input-элемента

- **`getInput(dom)`** — возвращает `<textarea>` (для инспектора
  и внутренних операций).

---

## Примеры использования

### 1. Простое поле

```xml
<cmpTextArea name="comment" placeholder="Введите комментарий"/>
```

### 2. С ограничением длины

```xml
<cmpTextArea name="description"
             placeholder="Краткое описание"
             maxlength="500"/>
```

### 3. Поле только для чтения

```xml
<cmpTextArea name="log"
             readonly="true"
             value="Текст лога…"/>
```

Пользователь не может изменить значение, но может его прочитать
и скопировать.

### 4. С обрезкой пробелов

```xml
<cmpTextArea name="code" trim="true"/>
```

При чтении `getValue` обрежет пробелы в начале и конце.

### 5. С авто-подсказкой

```xml
<cmpTextArea name="search" hint-autofill="true"/>
```

При вводе tooltip будет содержать текущее значение.

### 6. Программное чтение и запись

```js
// Прочитать значение
var v = getValue('comment');

// Или через API контрола
var ta = getControl('comment');
var v2 = D3Api.TextAreaCtrl.getValue(ta);

// Записать значение
setControlProperty('comment', 'value', 'Новый текст');
```

### 7. Отключение в рантайме

```js
setControlProperty('comment', 'enabled', false);
```

### 8. Скрытие

```xml
<cmpTextArea name="hidden" visible="false"/>
```

Показать позже:

```js
setControlProperty('hidden', 'visible', true);
```

### 9. Обработка ввода

```xml
<cmpTextArea name="comment"
             oninput="Form.onCommentInput(getValue('comment'));"/>
```

```js
Form.onCommentInput = function(value) {
    console.log('Текущий текст:', value);
};
```

### 10. Многострочное значение

```xml
<cmpTextArea name="notes">
<![CDATA[
Первая строка
Вторая строка
Третья строка
]]>
</cmpTextArea>
```

Содержимое между тегами попадёт в `<textarea>` как начальное
значение. Для многострочного текста используйте CDATA — иначе
XML-парсер схлопнет переносы.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается `<textarea>`
с placeholder или значением.

```
┌──────────────────────────────────┐
│ Введите текст…                   │
│                                  │
│                                  │
└──────────────────────────────────┘
```

- Если задан `value` — отображается он.
- Если `value` пусто, но есть `placeholder` — отображается
  placeholder серым.
- `readonly="true"` — серый фон.
- `enabled="false"` — серый фон, серый текст.
- `visible="false"` — скрыт.

Поле в IDE **неинтерактивно** (`textarea.disabled = true`) —
пользователь не может редактировать текст в canvas, только через
инспектор.

### В дереве

```
cmpTextArea name="comment" value="" placeholder="Введите комментарий"
```

Одна строка — детей нет.

### В инспекторе

Все атрибуты доступны для редактирования. Изменения `value`,
`placeholder`, `readonly`, `enabled`, `visible` немедленно
отражаются в canvas (через `refreshPreviewAndParent`).

### Ограничения

- **Поле не редактируется в canvas** — только через инспектор.
- **Многострочное `value` в инспекторе** — однострочное поле
  `type: 'string'`. Для многострочного значения редактируйте
  через **Edit InnerHTML…** или вставляйте CDATA в XML.
- **`rows` / `cols`** — в серверном коде не читаются. В превью
  IDE `rows` учитывается (влияет на высоту), `cols` — нет.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/TextArea/index.js"></script>
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmptextarea': 'cmpTextArea',
```

`_injectIdeStyle` не трогаем — компонент видим.

`XML_SELF_CLOSE` не трогаем — контейнерный (в рантайме содержит
`<textarea>`).

`CDATA_CONTAINERS` не трогаем — нет CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmptextarea': 'cmpTextArea',
```

### `PARENT_ONLY`

Не трогаем — `TextArea` вставляется в любое место формы.

---

## Известные ограничения

1. **`value` приоритетнее `text`.** Сервер в `Show()` использует
   `$this->value ? $this->value : $this->text`. Если задан
   атрибут `value`, содержимое внутри тега игнорируется.

2. **`trim` — клиентское свойство.** Сервер не обрезает пробелы;
   это делает `D3Api.TextAreaCtrl.getValue` через
   `D3Api.stringTrim`.

3. **`hint-autofill` работает по `value`.** При любом изменении
   значения (в т.ч. программном) tooltip обновляется. Если
   значение пустое — tooltip тоже будет пустым.

4. **`rows` и `cols` не читаются сервером.** В `<textarea>` они
   не передаются. Размер поля задаётся через `width`/`height`
   или через стили в `Styles`. В превью IDE `rows` учитывается
   для наглядности.

5. **`readonly` и `disabled` — разные.** `readonly="true"` —
   пользователь не может изменить значение, но может его
   прочитать и скопировать. `enabled="false"` — поле полностью
   выключено (нет фокуса, нет выделения).

6. **`maxlength` не предотвращает программный ввод.** Атрибут
   ограничивает только ввод с клавиатуры. Если установить
   `value` через `setValue` с более длинной строкой — она
   отобразится полностью.

7. **`change` срабатывает на blur**, не на каждый ввод. Для
   реакции на ввод в реальном времени используйте `oninput`.

8. **`onchange_property` вызывается при любом изменении `value`** —
   в т.ч. программном. Это может привести к рекурсии, если
   обработчик `onchange` меняет `value`. Используйте
   `D3Api.isUserEvent()` для фильтрации.

9. **Многострочное значение в XML требует CDATA.** Без CDATA
   XML-парсер схлопнет переносы строк и пробелы. IDE оборачивает
   содержимое в CDATA при редактировании через **Edit InnerHTML…**,
   но только если вы явно вставили `<![CDATA[…]]>` вручную.

10. **`cmpparse="TextArea"`** — служебный атрибут на `<textarea>`.
    По нему `D3Form` находит контрол при инициализации. Если
    удалить его через **Edit HTML…** — контрол не заработает.

11. **`value` в инспекторе — однострочное.** Для длинного
    текста (SQL, HTML, многострочные заметки) удобнее
    редактировать через **Edit InnerHTML…** или через
    CodeEditor, если он подключён к полю.

12. **`style` на `<div>` наследуется `<textarea>`** через
    CSS `height: 100%; width: 100%; padding: 3px 6px`. Если
    задать кастомный `padding` через Styles — он применится
    к `<div>`, а не к `<textarea>`.

13. **`title`** — стандартный HTML-атрибут, появляется как
    системный tooltip браузера. Не путать с `hint` (D3 Base) и
    `placeholder`.

14. **`id`** — если задан, по нему можно получить контрол через
    `document.getElementById`. Внутренний `<textarea>` не имеет
    своего id.

15. **`hint-autofill` использует `value.trim()`** — обрезает
    пробелы перед установкой tooltip. Если значение содержит
    многострочный текст, tooltip покажет его в одну строку.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → TextArea**.
2. В инспекторе задать:
    - `name` — имя контрола (для `getControl` / `getValue`);
    - `value` — начальное значение (если нужно);
    - `placeholder` — подсказка;
    - `maxlength` — ограничение длины;
    - `readonly="true"` — если поле только для чтения;
    - `trim="true"` — если нужно обрезать пробелы;
    - `hint-autofill="true"` — если нужна авто-подсказка.
3. При необходимости задать `width`, `height`, `visible`,
   `enabled`, `rows`.
4. При необходимости привязать события `onchange`, `oninput`,
   `onfocus`, `onblur`.
5. Проверить в canvas: должно отобразиться поле с placeholder
   или значением.
6. Проверить в дереве: `cmpTextArea` — одна строка.
7. В рантайме: ввод текста должен обновлять `value` контрола,
   `change` срабатывать на blur, `input` — на каждый символ.

---

## См. также

- `Component/d3/Edit/README.md` — однострочное поле ввода
- `Component/d3/CheckBox/README.md` — флажок
- `Component/d3/ComboBox/README.md` — выпадающий список
- `TextAreaCtrl.inc` — серверный код `TextArea`
- `TextArea.js` — клиентский `D3Api.TextAreaCtrl`
- `TextArea.css` — стили `.textArea`, `.textArea textarea`

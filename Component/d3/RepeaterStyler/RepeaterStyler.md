# cmpRepeaterStyler

Служебный контрол для динамической стилизации клонов репитера.
Подписывается на событие `onafter_clone` репитера и в зависимости
от условий (`cond`) навешивает CSS-классы на клон или на его
отдельные элементы.

В рантайме не рендерит видимого HTML — только скрытый `<div>` с
`<textarea>` (JSON) и сгенерированный `<style>`-блок с CSS.
Клиентских обработчиков событий нет: вся логика — в `init()` +
подписке на `onafter_clone`.

Поддерживает автоматическое преобразование дат в условиях через
специальный синтаксис `var::type` → `D3Api.dateToNum(...)`.

---

## Расположение

```
Component/d3/RepeaterStyler/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `RepeaterStylerCtrl.inc` | class `RepeaterStyler extends BaseCtrl` |
| `RepeaterStyler.js` | `D3Api.RepeaterStylerCtrl` |
| `RepeaterStyler.css` | Готовые классы `styler-blue`, `styler-yellow`, `styler-red`, `styler-pink`, `styler-green` |

---

## Тег и ID

- **XML-тег:** `cmpRepeaterStyler`
- **Регистрация в IDE:** `id: 'd3.repeaterstyler'`
- **Категория:** D3
- **Вид в палитре:** `RepeaterStyler`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)

---

## Разметка в рантайме

Серверный `RepeaterStyler::Show()` собирает:

```html
<div class="…" style="display:none;">
  <textarea>{"specs":[{"cond":"status == 'error'","class":"warning"}]}</textarea>
</div>
<style>
  .repeaterstyler.repItems_warning.active { background-color: #ff0; }
  .repeaterstyler.active .repeaterstyler.repItems_warning { background-color: #ff0; }
  …
</style>
```

Ключевые моменты:

- Скрытый `<div>` с `<textarea>` — внутри JSON **без** `classes`
  (сервер удаляет этот ключ и превращает его в CSS);
- `<style>` — генерируется из `classes`. Имена CSS-классов
  переименовываются из `<class>` в `<repeatername>_<class>`, чтобы
  изолировать CSS между разными RepeaterStyler-ами;
- Имена классов в `specs[i].class` тоже переименовываются.

Клиентский `D3Api.RepeaterStylerCtrl.init`:

1. Читает `repeatername` из атрибута.
2. Находит репитер через `D3Form.getRepeater(name)`.
3. Читает JSON из `firstChild.value` (это `<textarea>`).
4. Подписывается на `onafter_clone` репитера с функцией
   `setClass(data, clone, json)`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name` — идентификатор контрола

### RepeaterStyler
- **`repeatername`** — имя репитера, к которому привязан стилизатор.
  Обязательно должен совпадать с именем репитера из `repeatername`
  атрибута `GridRow`/`DataRow`/др.
- **`json`** — тип `code`. JSON с описанием классов и условий.

### Events
Пусто — RepeaterStyler не имеет собственных событий (все обработчики
навешиваются на репитер).

### Styles
Пусто — служебный контрол.

---

## Формат JSON

JSON состоит из двух ключей:

```json
{
  "classes": {
    "<имя_класса>": {
      "<состояние>": { "<css_свойство>": "<значение>" }
    }
  },
  "specs": [
    {
      "cond": "<JS-выражение>",
      "class": "<имя_класса>",
      "selector": "<CSS-селектор внутри клона>"
    }
  ]
}
```

### `classes`

Карта определений CSS-классов. Ключ верхнего уровня — имя класса
(в CSS превращается в `<repeatername>_<имя>`). Внутри — псевдосостояния:

| Псевдосостояние | CSS-селектор |
|---|---|
| `active` | `.active` |
| `hover` | `:hover` |
| `activehover` | `.active:hover` |

Для каждого псевдосостояния генерируются **два** CSS-правила:

```css
/* Прямое: элемент сам имеет оба класса */
.repeaterstyler.repItems_warning.active { … }

/* Каскадное: родитель .active, элемент — repeaterstyler */
.repeaterstyler.active .repeaterstyler.repItems_warning { … }
```

Это позволяет стилизовать и сам клон (когда он активен), и
подэлементы (когда активен родитель).

### `specs`

Массив условий. Для каждого клона репитера по порядку:

1. Вычисляется `cond(data)`. Если строка — оборачивается в
   `new Function(params.join(','), 'return ' + cond + ';')`.
2. Если `cond` вернул `true`:
    - если задан `selector` — ищутся все элементы по этому
      селектору внутри клона, им добавляются классы
      `repeaterstyler` и `<repeatername>_<class>`;
    - иначе — классы добавляются самому клону.

### Специальный синтаксис в `cond`

Перед компиляцией строка `cond` обрабатывается двумя регулярками:

1. **Даты в кавычках с типом:** `'01.01.2015'::d`, `"01.01.2015 15:45"::ms`
   → `D3Api.dateToNum('01.01.2015', 'd')`.
2. **Переменные с типом:** `ddate_bgn::ms`, `systemdate`
   → `D3Api.dateToNum(ddate_bgn, 'ms')` или `D3Api.dateToNum('systemdate', 'd')`.

Типы (`d`, `ms`, `m`, `y`, …) — псевдонимы форматов для
`D3Api.dateToNum`.

**Примеры условий:**

```
"status == 'error'"
"amount > 1000"
"ddate_bgn::ms > '01.01.2024'::ms"
"systemdate > ddate_end::ms"
```

---

## Примеры использования

### 1. Простая подсветка по статусу

```xml
<cmpRepeaterStyler name="" repeatername="repItems">
<![CDATA[
{
  "classes": {
    "warning": {
      "active": { "background-color": "#ffeecc" }
    },
    "success": {
      "active": { "background-color": "#dfffdf" }
    }
  },
  "specs": [
    { "cond": "status == 'error'", "class": "warning" },
    { "cond": "status == 'ok'",    "class": "success" }
  ]
}
]]>
</cmpRepeaterStyler>
```

Каждый клон репитера `repItems` получает класс
`repItems_warning` или `repItems_success` в зависимости от
`data.status`. CSS сгенерируется автоматически.

### 2. Стилизация подэлемента

```xml
<cmpRepeaterStyler name="" repeatername="repItems">
<![CDATA[
{
  "classes": {
    "critical": {
      "active": {
        "color": "#d32f2f",
        "font-weight": "bold"
      }
    }
  },
  "specs": [
    {
      "cond": "priority > 5",
      "class": "critical",
      "selector": ".itemName"
    }
  ]
}
]]>
</cmpRepeaterStyler>
```

Класс `repItems_critical` навешивается не на сам клон, а на
элементы `.itemName` внутри него.

### 3. Условие с датами

```xml
<cmpRepeaterStyler name="" repeatername="repItems">
<![CDATA[
{
  "classes": {
    "expired": {
      "active": { "background-color": "#fdd" }
    }
  },
  "specs": [
    {
      "cond": "ddate_end::ms < systemdate",
      "class": "expired"
    }
  ]
}
]]>
</cmpRepeaterStyler>
```

Клоны с прошедшей датой `ddate_end` получат класс
`repItems_expired`. Обе даты приводятся к миллисекундам через
`D3Api.dateToNum`.

### 4. Комбинированное условие

```xml
<cmpRepeaterStyler name="" repeatername="repItems">
<![CDATA[
{
  "classes": {
    "danger": {
      "active": { "background-color": "#fee", "border-left": "4px solid #d32f2f" }
    }
  },
  "specs": [
    {
      "cond": "status == 'error' && amount > 1000",
      "class": "danger"
    }
  ]
}
]]>
</cmpRepeaterStyler>
```

### 5. Использование готовых стилей

Компонент поставляется с готовыми классами
`styler-blue`, `styler-yellow`, `styler-red`, `styler-pink`,
`styler-green` (см. `RepeaterStyler.css`). Их можно указать прямо
в `classes`:

```xml
<cmpRepeaterStyler name="" repeatername="repItems">
<![CDATA[
{
  "classes": {
    "blue": {
      "active": {
        "background-color": "#def8fa"
      }
    },
    "yellow": {
      "active": {
        "background-color": "#fcf8de"
      }
    }
  },
  "specs": [
    { "cond": "type == 'info'",  "class": "blue" },
    { "cond": "type == 'alert'", "class": "yellow" }
  ]
}
]]>
</cmpRepeaterStyler>
```

Либо использовать **имя класса** из готового CSS напрямую — оно
всё равно будет переименовано в `<repeatername>_<имя>`, а CSS-правило
не подхватится. Поэтому проще явно описать нужные стили в `classes`.

### 6. Множественные условия на один класс

```xml
<cmpRepeaterStyler name="" repeatername="repItems">
<![CDATA[
{
  "classes": {
    "highlight": {
      "active": { "background-color": "#ffc" }
    }
  },
  "specs": [
    { "cond": "status == 'new'",       "class": "highlight" },
    { "cond": "status == 'updated'",   "class": "highlight" },
    { "cond": "status == 'important'", "class": "highlight" }
  ]
}
]]>
</cmpRepeaterStyler>
```

Один и тот же класс навешивается при выполнении любого из условий.

### 7. Программное изменение JSON

```js
var rs = getControl('<repeaterstyler_name>');
var json = D3Api.getControlPropertyByDom(rs, 'json');
// … правка json …
D3Api.setControlPropertyByDom(rs, 'json', JSON.stringify(newJson));
```

Изменения вступят в силу только после следующей перерисовки
репитера (или при явном вызове `repeater.repeat(true)`).

---

## Логика работы

### Инициализация (сервер)

`RepeaterStyler::__construct`:

1. Читает `repeatername` из атрибутов.

`RepeaterStyler::Show`:

1. Парсит `$this->text` (JSON, переданный через `SetInnerText`).
2. Извлекает `classes`.
3. Для каждого класса и каждого псевдосостояния генерирует CSS:

   ```css
   .repeaterstyler.<repeatername>_<class>.active { … }
   .repeaterstyler.active .repeaterstyler.<repeatername>_<class> { … }
   ```

4. Переименовывает имена классов в `specs[i].class` из `<class>`
   в `<repeatername>_<class>`.
5. Удаляет `classes` из JSON.
6. Рендерит `<div style="display:none"><textarea>JSON</textarea></div>`
    + `<style>…</style>`.

### Инициализация (клиент)

`D3Api.RepeaterStylerCtrl.init(dom)`:

1. Читает `repeatername` из атрибута.
2. Находит репитер через `D3Form.getRepeater(name)`.
3. Читает JSON из первого дочернего `<textarea>`.
4. Подписывается на `onafter_clone` репитера функцией
   `setClass(data, clone, json)`.

### Применение стилей (`setClass`)

1. Из `data` извлекаются все ключи и значения (`params` и `args`).
2. Для каждого элемента `json.specs`:
    1. Если `cond` ещё не функция — компилируется через `new Function`
       с предварительной обработкой дат.
    2. Вызывается `cond.apply(null, args)`.
    3. Если `true`:
        - если задан `selector` — ищутся все элементы по селектору
          внутри клона, им добавляются классы `repeaterstyler` и
          `<class>`;
        - иначе — классы добавляются самому клону.

### Специальная обработка дат

В `setClass` при первой компиляции `cond`:

1. Первая регулярка ищет строки в кавычках с типом:
   `/(['"])(.+?)\1::(\w+)/ig`
   Например `'01.01.2015'::d` → `D3Api.dateToNum('01.01.2015', 'd')`.
2. Вторая регулярка ищет переменные с типом:
   `/([a-z]\w*)::(\w+)|(systemdate)/ig`
   Например `ddate_bgn::ms` → `D3Api.dateToNum(ddate_bgn, 'ms')`,
   `systemdate` → `D3Api.dateToNum('systemdate', 'd')`.
3. Строка `cond` модифицируется, затем компилируется в функцию.

Кэширование: после первой компиляции `cond` заменяется на функцию
(поле `specs[i].cond` в JSON), при следующих клонах переиспользуется.

---

## Поведение в IDE

Компонент **невидимый**. После вставки на холст ничего не появится —
это правильно, потому что в рантайме он тоже невидим.

### В дереве

```
cmpRepeaterStyler name="" repeatername=""
```

Одна строка — детей нет.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`
- RepeaterStyler: `repeatername`, `json` (тип `code`)
- Events: пусто
- Styles: пусто

`json` — тип `code`. Открывается модальный редактор, в котором
удобно править структуру. При сохранении JSON оборачивается в CDATA
(см. `CDATA_CONTAINERS` в `canvas.js`).

### Ограничения

- **Без `repeatername` не работает** — `getRepeater(name)` вернёт
  `null`, инициализация упадёт в рантайме. В IDE это не валидируется.
- **Собственный preview отсутствует** — компонент невидим.
- **Редактор JSON** — без подсветки (Highlight.js по умолчанию без
  language pack `json`), но редактирование работает.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/RepeaterStyler/index.js"></script>
```

### Правки в `ide/canvas.js`

**`_injectIdeStyle` — скрыть компонент в canvas:**

```js
'cmpaction, cmpdataset, cmpscript, cmpmask, cmpbroker, ' +
'cmpcomment, cmpcompleter, cmpdependences, cmpfetch, ' +
'cmpfetchvar, cmplocate, cmpmodule, cmpmodulevar, ' +
'cmprepeaterstyler {' +
'  display: none !important; visibility: hidden !important;' +
'  pointer-events: none !important; user-select: none !important;' +
'}'
```

**`CDATA_CONTAINERS` — оборачивать JSON в CDATA при сохранении:**

```js
var CDATA_CONTAINERS = {
    cmpaction:1, cmpdataset:1, cmpscript:1, cmpsubaction:1,
    cmprepeaterstyler:1
};
```

**`CMP_TAGS`:**

```js
'cmprepeaterstyler': 'cmpRepeaterStyler',
```

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmprepeaterstyler': 'cmpRepeaterStyler',
```

### `XML_SELF_CLOSE` и `PARENT_ONLY`

Не трогаем:
- `XML_SELF_CLOSE` — `cmpRepeaterStyler` содержит текст (JSON в CDATA),
  не самозакрывающийся;
- `PARENT_ONLY` — у компонента нет ограничений на родителя.

---

## Известные ограничения

1. **JSON должен быть валидным.** Если структура сломана, серверный
   `json_decode` вернёт `null`, и `classes`/`specs` будут пустыми.
   Клиентский `init` упадёт на `JSON.parse(_dom.firstChild.value)`.

2. **`cond` — строка, а не функция.** В JSON всегда строка. На
   клиенте она компилируется в функцию через `new Function`.
   Ошибка в синтаксисе выявится только при первом клоне репитера
   (в рантайме).

3. **Специальный синтаксис `::` для дат** — если переменная
   начинается с маленькой буквы и содержит `::` (например
   `var::something`), она будет интерпретирована как дата-преобразование.
   Избегайте символа `::` в обычных выражениях.

4. **`systemdate` подставляется как `'systemdate'`** — сервер
   ожидает `D3Api.dateToNum('systemdate', 'd')`. Если использовать
   `systemdate` без `::`, будет подставлено именно так.

5. **Классы навешиваются только при `onafter_clone`.** Если данные
   клона меняются после создания (без пересоздания), классы не
   пересчитываются. Для пересчёта нужно вызвать
   `repeater.repeat(true)`.

6. **Автопереименование классов** — в CSS классы превращаются в
   `<repeatername>_<имя>`. Если два RepeaterStyler-а используют
   одинаковое имя класса (`"warning"`), а `repeatername` разные —
   конфликтов не будет (классы изолированы). Если `repeatername`
   одинаковые — CSS может перезаписаться.

7. **`classes` удаляется из JSON перед рендером `<textarea>`** —
   клиент видит только `specs`. Это значит, что программно изменить
   CSS-стили классов на клиенте нельзя — только через новый
   RepeaterStyler или перерисовку формы.

8. **`selector` — CSS-селектор**, ищется через `querySelectorAll`
   внутри клона. Не поддерживает `:scope` и другие экзотические
   псевдоклассы, зависящие от контекста.

9. **`style="display:none"` на `<div>`** — на случай, если
   CSS-правило `_injectIdeStyle` не сработает. Серверный `Show()`
   сам ставит `style="display:none"` в разметке.

10. **Готовые классы `styler-blue`, `styler-yellow`, и др. в
    `RepeaterStyler.css`** — в рантайме они доступны, но
    RepeaterStyler переименовывает классы, поэтому напрямую их
    использовать нельзя. Стили нужно описывать в `classes` JSON-а
    заново. Готовый CSS-файл можно использовать как шаблон для
    копирования значений.

11. **CDATA в XML обязателен** — без него `"`, `<`, `>` и `&` в
    JSON сломают парсинг. IDE оборачивает автоматически благодаря
    `CDATA_CONTAINERS`.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → RepeaterStyler**.
2. В инспекторе задать `name` (для `getControl`).
3. Задать `repeatername` — имя репитера, к которому привязывается
   стилизатор (обязательно).
4. В поле `json` открыть модальный редактор и заполнить структуру:
    - `classes` — карта CSS-классов с псевдосостояниями;
    - `specs` — массив условий с `cond`, `class` и (опционально)
      `selector`.
5. Убедиться, что JSON валиден (закрыты все скобки и кавычки).
6. Проверить в дереве: `cmpRepeaterStyler` — одна строка.
7. В рантайме (после сохранения формы): репитер при создании клонов
   должен навешивать правильные CSS-классы.
8. Для пересчёта классов после смены данных — вызвать
   `repeater.repeat(true)`.

---

## См. также

- `Component/d3/Grid/README.md` — Grid, использующий репитеры
  (типовое место применения RepeaterStyler)
- `Component/d3/CustomFilter/README.md` — аналогичный по структуре
  контрол с JSON-содержимым
- `RepeaterStylerCtrl.inc` — серверный код
- `RepeaterStyler.js` — клиентский контрол
- `RepeaterStyler.css` — готовые цветовые схемы
  (`styler-blue`, `styler-yellow`, `styler-red`, `styler-pink`,
  `styler-green`)

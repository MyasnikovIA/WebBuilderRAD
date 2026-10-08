# cmpMask

Служебный контрол для применения масок ввода к другим контролам формы.
В рантайме не рендерит видимого HTML — только скрытый `<div>`, через который
клиент находит целевые контролы и навешивает на их input-ы обработчики
`keydown`, `keypress`, `paste`, `focus`, `blur`.

Маска задаётся одним из двух способов:

1. **Готовый тип** (`mask_type="date"`, `mask_type="number"`, …) — сервер
   хранит палитру предустановок в `Mask.js`.
2. **Набор параметров** (`mask_template`, `mask_check_regular`,
   `mask_check_function`, …) — задаётся прямо на целевом контроле.

---

## Расположение

| Файл | Роль |
|---|---|
| `Component/d3/Mask/index.js` | Регистрация компонента в IDE (D3.register) |
| `Component/d3/Mask/css/preview.css` | Заглушка стилей превью (в рантайме не используется) |
| `Component/d3/Mask/images/icon.png` | Иконка 14×14 для палитры |
| `Component/d3/Mask/js/` | Пусто (зарезервировано) |

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `MaskCtrl.inc` | class `Mask extends BaseCtrl` |
| `Mask.js` | `D3Api.MaskCtrl` — палитра масок и логика навешивания |
| `Mask.css` | Стили `.ctrl_mask`, `.ctrl_mask_warning` |

---

## Тег и ID

- **XML-тег:** `cmpMask`
- **Регистрация в IDE:** `id: 'd3.mask'`
- **Категория:** D3
- **Вид в палитре:** `Mask`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)

---

## Разметка в рантайме

Серверный код (`Mask::Show()`) генерирует:

```html
<div cmptype="Mask" name="m1" controls="edit1;edit2" style="display:none"></div>
```

Клиентский `D3Api.MaskCtrl.init(dom)` читает `controls` (`;`-разделённый
список имён), находит каждый контрол через `D3Form.getControl(name)`,
читает его `mask_*`-атрибуты и вызывает `registerControl(...)`.

Далее на `<input>` целевого контрола навешиваются обработчики, а сам
контрол получает флаги `ctrl_mask` / `ctrl_mask_warning` при
фокусе / ошибке.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style` — стандартные HTML-атрибуты

### D3 Base
- `name` — идентификатор контрола маски (не обязателен, но нужен для
  отладки и вызова `setParam`)

### Mask
- **`controls`** — строка вида `edit1;edit2;edit3`. Имена целевых
  контролов, к которым применяется маска. Читается в `init()`.

### Events
Пусто — Mask не инициализирует клиентских событий.

### Styles
Пусто — служебный контрол.

---

## Формат `controls`

Разделённые `;` имена контролов. Для каждого:

1. `D3Form.getControl(name)` находит контрол.
2. Если у контрола уже есть `D3Store.D3MaskParams` — пропускается
   (нельзя навесить две маски на один input).
3. Иначе читаются `mask_*`-атрибуты и вызывается `registerControl`.

**Пример:**

```
controls="headerPrintingRef;detailGenerationRef;dateFillingRef"
```

Все три Edit-контрола получат одну маску (в данном случае — числовую,
если у каждого стоит `mask_type="number"`).

---

## Палитра `mask_type`

Значения из `Mask.js` (`maskTypes`):

| `mask_type` | Что делает | Пример значения |
|---|---|---|
| `time` | Время `чч:мм` | `14:30` |
| `hoursminutes` | Интервал `чч:мм` (часы и минуты) | `1:30` |
| `date` | Дата `дд.мм.гггг` | `01.01.2025` |
| `datetime` | Дата и время `дд.мм.гггг чч:мм` | `01.01.2025 14:30` |
| `number` | Натуральное число (с нулём) | `0`, `42`, `100` |
| `naturalnumber` | Натуральное число (> 0) | `1`, `42`, `100` |
| `signnumber` | Знаковое целое | `-42`, `0`, `42` |
| `fnumber` | Дробное с точкой/запятой | `3.14`, `3,14` |
| `signfnumber` | Знаковое дробное | `-3.14`, `3.14` |
| `fnumberlocal` | Дробное с локальным разделителем | `1 234,56` (ru) |
| `signfnumberlocal` | Знаковое с локальным разделителем | `-1 234,56` |
| `alpha` | Только буквы | `Привет`, `Hello` |
| `alphanumber` | Буквы и цифры | `ABC123` |
| `string` | Любая строка (без валидации) | `что угодно` |
| `numberlen:min,max` | Целое заданной длины | `numberlen:3,5` → `12345` |
| `signnumberlen:min,max` | Знаковое заданной длины | `signnumberlen:1,3` → `-100` |
| `fnumberlen:maxBefore,maxAfter` | Дробное с ограничением | `fnumberlen:10,2` |
| `maxlen:max` | Ограничение по длине в символах | `maxlen:20` |

Составные типы (`numberlen:3,5`) парсятся в `registerControl` через
`split(':')`, аргументы — `split(',')`.

---

## Формат параметров маски

Если `mask_type` не используется, параметры задаются прямо на целевом
контроле. Все атрибуты имеют префикс `mask_`:

| Атрибут | Назначение |
|---|---|
| `mask_template` | Шаблон: `9` — цифра, `a` — буква, `x` — цифра или буква. Например `99.99.9999` |
| `mask_original` | Значение для сверки в шаблоне. По умолчанию = `mask_template` |
| `mask_check_regular` | Регулярка для полной проверки значения (при blur) |
| `mask_check_function` | Функция для полной проверки |
| `mask_template_regular` | Регулярка для промежуточной проверки (при вводе) |
| `mask_template_function` | Функция для промежуточной проверки |
| `mask_char_replace` | Автозамена символов при вводе/вставке. Формат: `старый1новый1старый2новый2` |
| `mask_empty` | `true` (по умолчанию) — пустое значение допустимо |
| `mask_strip` | `false` (по умолчанию) — очищать шаблонные символы из результата |
| `mask_fill_first` | `false` (по умолчанию) — заполнять первые позиции |
| `mask_clear` | `false` (по умолчанию) — не возвращать очищенное значение |

**Пример на Edit:**

```xml
<cmpEdit name="birthDate"
         mask_template="99.99.9999"
         mask_original="00.00.0000"
         mask_check_regular="^([0-2]\d|3[01])\.(0\d|1[012])\.\d{4}$"
         mask_replace_space="true"/>
<cmpMask controls="birthDate"/>
```

Но обычно проще использовать готовый тип:

```xml
<cmpEdit name="birthDate" mask_type="date"/>
<cmpMask controls="birthDate"/>
```

---

## Логика работы

Клиент (`D3Api.MaskCtrl.registerControl`) выполняет:

1. Определяет `input` целевого контрола через `getInput()`.
2. Определяет свойство-носитель значения через `getMaskProperty()`.
3. Резолвит `mask_type` в объект параметров (`maskTypes[type]`).
4. Вызывает `maskInit(control, input)`.

`maskInit` устанавливает на input:

| Событие | Обработчик | Что делает |
|---|---|---|
| `click` | `onClick` | Переход к следующей позиции шаблона |
| `keydown` | `onKeyDown` | Обработка Backspace, Del, стрелок, PgUp/PgDn |
| `keypress` | `onKeyPress` | Замена символов по `maskCharReplace`, вставка в шаблон |
| `focus` | `onFocus` | Подсветка `.ctrl_mask`, разворачивание шаблона |
| `blur` | `onBlur` | Стрип шаблона, валидация, снятие подсветки |
| `paste` | `onPaste` | Обработка вставки из буфера |

Плюс на контрол навешиваются:

- `onchange_property` → `onChangeProperty` — валидация при изменении
  значения извне;
- `onget_property` → `onGetProperty` — стрип значения при чтении.

### Визуальная обратная связь

- **В фокусе**: контрол получает класс `.ctrl_mask` (`background: #E3FADE`
  — светло-зелёный).
- **Ошибка ввода**: добавляется `.ctrl_mask_warning` (`background: #FF8888`
  — красный).
- **Успешный blur**: классы снимаются, свойство `error` сбрасывается
  в `false`.
- **Ошибка на blur**: классы снимаются, свойство `error` устанавливается
  в `true`.

---

## Примеры использования

### 1. Числовое поле

```xml
<cmpEdit name="amount" mask_type="number"/>
<cmpMask name="mask_amount" controls="amount"/>
```

`amount` примет только цифры. При попытке ввести букву — подсветка
станет красной, при корректном вводе — зелёной.

### 2. Дата

```xml
<cmpDateEdit name="beginDate" mask_type="date"/>
<cmpMask name="mask_dates" controls="beginDate;endDate"/>
```

Одна маска на два поля: `DateEdit` сам по себе без маски, но с
`mask_type="date"` получит шаблон `дд.мм.гггг`.

### 3. Дробное с локальным разделителем

```xml
<cmpEdit name="cost" mask_type="fnumberlocal"/>
<cmpMask name="mask_cost" controls="cost"/>
```

В русской локали пользователь вводит `1 234,56` — маска сама
нормализует разделители.

### 4. Составной тип с параметрами

```xml
<cmpEdit name="code" mask_type="numberlen:3,5"/>
<cmpMask name="mask_code" controls="code"/>
```

Допустимы только целые числа длиной от 3 до 5 знаков.

### 5. Без `mask_type`, только параметры

```xml
<cmpEdit name="phone"
         mask_template="+7 (999) 999-99-99"
         mask_original="+7 (000) 000-00-00"
         mask_replace_space="true"/>
<cmpMask name="mask_phone" controls="phone"/>
```

Пользователь вводит цифры — маска сама расставляет `+7 (...) ...`.

### 6. Динамическая смена типа

Через `setParam`:

```js
D3Api.MaskCtrl.setParam(
    getControl('amount'),
    'mask_type',
    'signfnumber'
);
```

Это переключит маску с натурального числа на знаковое дробное.

---

## Поведение в IDE

Компонент **невидимый**. После вставки на холст ничего не появится —
это правильно, потому что в рантайме он тоже невидим.

### В дереве

Отображается одной строкой:

```
cmpMask name="" controls=""
```

### В инспекторе

- `controls` — строковый список имён через `;`.
- Остальные атрибуты — HTML/D3 Base.

### Ограничения

- **Drag&drop** в компонент не ограничен, но вкладывать в него
  что-либо смысла нет — он не рендерит детей.
- **Events** и **Styles** пустые.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

```html
<script src="Component/d3/Mask/index.js"></script>
```

### Правки в `ide/canvas.js`

**`_injectIdeStyle`:**

```js
'cmpaction, cmpdataset, cmpscript, cmpmask, cmpbroker, ' +
'cmpcomment, cmpcompleter, cmpdependences, cmpfetch, ' +
'cmpfetchvar, cmplocate {' +
'  display: none !important; visibility: hidden !important;' +
'  pointer-events: none !important; user-select: none !important;' +
'}'
```

**`CMP_TAGS`:**

```js
'cmpmask': 'cmpMask',
```

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpmask': 'cmpMask',
```

### `XML_SELF_CLOSE` и `CDATA_CONTAINERS`

Не трогаем — Mask не самозакрывающийся и не содержит CDATA.

---

## Известные ограничения

1. **Одна маска на контрол** — если у контрола уже есть `D3Store.D3MaskParams`,
   `init()` пропустит его. Вторая маска на тот же input не навесится.

2. **`getInput()` обязателен** — если у целевого контрола нет метода
   `getInput`, маска не применится и в консоль уйдёт debug-сообщение.

3. **`mask_type` не проверяется на существование** — если указать
   `mask_type="foobar"`, будет debug-сообщение, и маска не навесится.

4. **Регулярки компилируются один раз** — при `setParam('mask_check_regular', value)`
   создаётся новый `RegExp(value)`. Если нужно поменять регулярку на
   лету, старый объект затирается.

5. **`mask_check_function` / `mask_template_function` — строки с JS-кодом** —
   сервер передаёт их как строки, а `execDomEventFunc` компилирует в
   момент регистрации. Если в строке опечатка — ошибка всплывёт в
   рантайме, а не при сохранении.

6. **Локаль-зависимые маски** — `fnumberlocal`, `signfnumberlocal`
   вычисляют разделители через `toLocaleString()`. На разных машинах
   поведение может отличаться (например, `1.234,56` vs `1,234.56`).

7. **Валидация при вводе ≠ валидация при blur** — `maskCheckRegular`
   применяется только на blur, а `maskTemplateRegular` — при вводе.
   Если задать только `maskCheckRegular`, `maskParamsInit` автоматически
   продублирует его в `maskTemplateRegular`.

8. **Автодубликат `maskOriginal`** — если `mask_original` не задан,
   он приравнивается к `mask_template`. Это работает для типовых
   масок, но для сложных шаблонов лучше задавать явно.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → Mask**.
2. В инспекторе задать `name` (для отладки).
3. Заполнить `controls` — `;`-список имён целевых контролов.
4. На каждом целевом контроле задать `mask_type` или набор `mask_*`
   атрибутов.
5. Проверить, что целевой контрол имеет метод `getInput()` (у Edit,
   DateEdit, ComboBox — есть; у Label, Button — нет).
6. Убедиться, что на контрол не навешена другая маска.
7. При необходимости — задать `mask_empty="true"` для опциональных полей.

---

## См. также

- `Component/d3/Edit/README.md` — Edit, на который чаще всего навешивают маску
- `Component/d3/DateEdit/README.md` — DateEdit с `mask_type="date"`
- `Component/d3/ComboBox/README.md` — ComboBox тоже поддерживает `getInput()`
- `MaskCtrl.inc` — серверный класс
- `Mask.js` — палитра `maskTypes` и логика
- `Mask.css` — стили `.ctrl_mask` и `.ctrl_mask_warning`

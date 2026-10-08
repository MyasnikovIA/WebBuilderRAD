# cmpPageControl

Контейнер закладок (вкладок). В рантайме рендерит горизонтальную или
вертикальную панель с табами и переключаемыми страницами. Каждая
закладка — дочерний `cmpTabSheet`.

Серверный `Show()` собирает структуру:

- `<ul>` с кнопками табов (в горизонтальном режиме — с кнопками
  скролла `ScrollNext` / `ScrollPrior`);
- скрытые `<div>` страниц, из которых видима только активная.

Клиент (`D3Api.PageControlCtrl`) управляет переключением, скроллом
табов, реакцией на клавиатуру (`←/→/↑/↓/PgUp/PgDn`), событиями
`onpagechange` / `onpageshow` / `onpagehide`.

---

## Расположение

```
Component/d3/PageControl/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)

Component/d3/TabSheet/
index.js               (см. Component/d3/TabSheet/README.md)
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `PageControlCtrl.inc` | class `PageControl extends BaseCtrl` и class `TabSheet extends BaseCtrl` |
| `PageControl.js` | `D3Api.PageControlCtrl` и `D3Api.TabSheetCtrl` |
| `PageControl.css` | Стили `.ctrl_pageControl`, `.ctrl_pageControlTabs`, `.button_scroll` |

---

## Тег и ID

- **XML-тег:** `cmpPageControl`
- **Регистрация в IDE:** `id: 'd3.pagecontrol'`
- **Категория:** D3
- **Вид в палитре:** `PageControl`
- **Видимость:** видимый (рендерит разметку в canvas)
- **Дочерние компоненты:** `cmpTabSheet`

---

## Разметка в рантайме

### Горизонтальный режим (по умолчанию)

```html
<div class="ctrl_pageControl bg box-sizing-force"
     uniqid="pc5f1a2b3c4d" mode="horizontal">
  <div cont="div_ul" class="div_ul">
    <ul cont="PageControl_head" class="ctrl_pageControlTabs bg">
      <li class="ctrl_pageControlTabBtn tab0_pc5f1a2b3c4d" pageindex="0">
        <a class="centerTB" cont="tabcaption">Tab1</a>
      </li>
      <li class="ctrl_pageControlTabBtn tab1_pc5f1a2b3c4d" pageindex="1">
        <a class="centerTB" cont="tabcaption">Tab2</a>
      </li>
    </ul>
    <div cont="ScrollNext"  class="button_scroll next_scroll"
         onclick="D3Api.PageControlCtrl.ScrollNext(this);"></div>
    <div cont="ScrollPrior" class="button_scroll prior_scroll"
         onclick="D3Api.PageControlCtrl.ScrollPrior(this);"></div>
  </div>
  <div cont="page0_pc5f1a2b3c4d"
       class="ctrl_pageControlTabPage page0_pc5f1a2b3c4d">…дети Tab1…</div>
  <div cont="page1_pc5f1a2b3c4d"
       class="ctrl_pageControlTabPage page1_pc5f1a2b3c4d">…дети Tab2…</div>
</div>
```

### Вертикальный режим (`mode="vertical"`)

```html
<div class="ctrl_pageControl bg box-sizing-force"
     uniqid="pc5f1a2b3c4d" mode="vertical">
  <div cont="div_ul" class="div_ul">
    <ul cont="PageControl_head" class="ctrl_pageControlTabs bg">
      …такие же <li>, но без кнопок скролла…
    </ul>
  </div>
  <div class="pageControl-content">
    <div cont="page0_pc5f1a2b3c4d" class="ctrl_pageControlTabPage …">…</div>
    <div cont="page1_pc5f1a2b3c4d" class="ctrl_pageControlTabPage …">…</div>
  </div>
</div>
```

Порядок `<ul>` и страниц различается в двух режимах: в горизонтальном
табы сверху, страницы снизу; в вертикальном — табы слева, страницы справа.

**Уникальный `uniqid`** генерируется сервером (`uniqid('pc')`) и подставляется
в имена CSS-классов (`tab0_<uniqid>`, `page0_<uniqid>`). Через эти классы
клиент находит нужный таб/страницу при переключении.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style` — стандартные HTML-атрибуты

### D3 Base
- `name`, `enabled`, `visible`, `hint`, `width`, `height`

### PageControl
- **`mode`** — `horizontal` (по умолчанию) или `vertical`
- **`nobg`** — `true` — не рисовать фон табов и нижнюю границу
- **`activeindex`** — индекс активной закладки (0..N-1)

### Events
- `onpagechange` — смена активной закладки (аргументы: `showIndex`, `hideIndex`)
- `onpageshow` — закладка показана (аргумент: `pageIndex`)
- `onpagehide` — закладка скрыта (аргумент: `pageIndex`)
- `onclick`, `ondblclick` — стандартные

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Дочерние компоненты

Внутрь `PageControl` можно вкладывать `TabSheet` — каждая закладка
описывается одним `TabSheet`.

**parentOnly:** `cmppagecontrol` — `TabSheet` не может быть вставлен вне
`PageControl`. В IDE ограничение реализовано через `PARENT_ONLY` в
`panels.js`.

**Пример полной структуры:**

```xml
<cmpPageControl name="pc1" mode="horizontal" activeindex="0">
    <cmpTabSheet name="" caption="Общие" active="true">
        <cmpLabel name="" caption="Основные настройки"/>
        <cmpEdit name="title"/>
    </cmpTabSheet>
    <cmpTabSheet name="" caption="Дополнительно">
        <cmpEdit name="extra"/>
    </cmpTabSheet>
    <cmpTabSheet name="" caption="О программе">
        <cmpLabel name="" caption="Версия 1.0"/>
    </cmpTabSheet>
</cmpPageControl>
```

Подробное описание `TabSheet` — см. `Component/d3/TabSheet/README.md`.

---

## Логика работы

### Инициализация

`D3Api.PageControlCtrl.init(dom)`:

1. Сохраняет `uniqid` из атрибута.
2. Устанавливает активную закладку через `setActiveIndex(dom, activeindex)`.
3. Инициализирует события `onpagechange`, `onpageshow`, `onpagehide`.
4. Подписывается на `onResize` формы для пересчёта позиций.
5. Вызывает `CalckTabSheetHead()` — считает суммарную ширину видимых табов.
6. Вызывает `resize()` — показывает/скрывает кнопки скролла.

### Переключение закладки

`setActiveIndex(dom, index)`:

1. Снимает `active` с текущего таба, скрывает текущую страницу.
2. Вызывает `onpagehide` со старым индексом.
3. Устанавливает `active` на новый таб, показывает новую страницу.
4. Вызывает `onpageshow` с новым индексом.
5. Вызывает `onpagechange` с `(newIndex, oldIndex)`.

### Скролл (горизонтальный режим)

`ScrollNext` / `ScrollPrior` — сдвигают `<ul>` с табами на ширину,
покрывающую примерно половину видимой области. Кнопки показываются
автоматически, когда суммарная ширина табов превышает ширину `div_ul`.

### Клавиатура

В `CtrlKeyDown`:

- `PageUp` / `↑` / `←` — переход к предыдущей видимой закладке;
- `PageDown` / `↓` / `→` — переход к следующей видимой закладке.

### Видимость

Если `TabSheet` имеет `visible="false"`, его таб и страница скрываются.
`CalckTabSheetHead()` учитывает это при подсчёте ширины.

---

## Примеры использования

### 1. Простой горизонтальный PageControl

```xml
<cmpPageControl name="tabs" mode="horizontal" activeindex="0">
    <cmpTabSheet name="" caption="Tab 1" active="true">
        <cmpLabel name="" caption="Содержимое первой вкладки"/>
    </cmpTabSheet>
    <cmpTabSheet name="" caption="Tab 2">
        <cmpLabel name="" caption="Содержимое второй вкладки"/>
    </cmpTabSheet>
</cmpPageControl>
```

### 2. Вертикальный PageControl

```xml
<cmpPageControl name="sidebar" mode="vertical" activeindex="0">
    <cmpTabSheet name="" caption="Профиль" active="true">
        <cmpEdit name="username"/>
    </cmpTabSheet>
    <cmpTabSheet name="" caption="Настройки">
        <cmpCheckBox name="notifications" caption="Уведомления"/>
    </cmpTabSheet>
</cmpPageControl>
```

### 3. Программное переключение

```js
setControlProperty('tabs', 'activeIndex', 2);
```

Или через прямой вызов:

```js
var pc = getControl('tabs');
D3Api.PageControlCtrl.setActiveIndex(pc, 2);
```

### 4. Реакция на смену закладки

```xml
<cmpPageControl name="tabs" activeindex="0"
                onpagechange="Form.onTabChange(arguments[0], arguments[1]);">
    …
</cmpPageControl>
```

```js
Form.onTabChange = function(newIndex, oldIndex) {
    console.log('Переключение с', oldIndex, 'на', newIndex);
};
```

### 5. Условная видимость закладок

```xml
<cmpPageControl name="tabs">
    <cmpTabSheet name="" caption="Основное" active="true">
        …
    </cmpTabSheet>
    <cmpTabSheet name="" caption="Администрирование" visible="false">
        …
    </cmpTabSheet>
</cmpPageControl>
```

Вторая закладка не появится, пока `visible` не станет `true`:

```js
setControlProperty('tabs_TabSheet1', 'visible', true);
```

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается статичный «скелет»:

**Горизонтальный режим:**

```
┌──────────────────────────────────────────────┐
│  Tab1    Tab2    Tab3                        │
│  ────────                                    │  ← активный таб (чёрное подчёркивание)
├──────────────────────────────────────────────┤
│                                              │
│   Tab1 (content)                             │
│                                              │
└──────────────────────────────────────────────┘
```

**Вертикальный режим:**

```
┌──────────┬───────────────────────────────────┐
│  Tab1    │                                   │
│  Tab2    │   Tab1 (content)                  │
│  Tab3    │                                   │
└──────────┴───────────────────────────────────┘
```

При добавлении `TabSheet` через палитру `preview()` перечитывает
детей и обновляет бар. Меняешь `caption` в инспекторе — таб
обновляется. Меняешь `activeindex` — меняется подсветка и заголовок
placeholder-страницы.

### В дереве

```
cmpPageControl name="" mode="horizontal" activeindex="0"
  cmpTabSheet name="" caption="Tab1" active="true"
    <дочерние компоненты>
  cmpTabSheet name="" caption="Tab2"
    <дочерние компоненты>
```

`TabSheet` можно перетащить только в `PageControl` — ограничение
`PARENT_ONLY.cmptabsheet = 'cmppagecontrol'`.

### Ограничения

- **`TabSheet` не отображается отдельно** — только в `preview()`
  родителя. В canvas его дети не видны, они рендерятся в активной
  странице.
- **Скролл (‹ ›)** в IDE не воспроизводится — placeholder-обёртка
  не эмулирует прокрутку.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/PageControl/index.js"></script>
<script src="Component/d3/TabSheet/index.js"></script>
```

Порядок: `PageControl` до `TabSheet`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmppagecontrol': 'cmpPageControl',
'cmptabsheet':    'cmpTabSheet',
```

`_injectIdeStyle` и `XML_SELF_CLOSE` не трогаем — `PageControl`
видимый и контейнерный.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmppagecontrol': 'cmpPageControl',
'cmptabsheet':    'cmpTabSheet',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmptabsheet: 'cmppagecontrol',
```

---

## Известные ограничения

1. **`activeindex` vs `active`** — серверный `TabSheet::__construct` при
   `active="true"` пишет `$parent->attrs['activeindex']`. То есть в XML
   у `PageControl` есть `activeindex`, а у активного `TabSheet` —
   `active="true"`. В `preview()` учитываются оба: сначала
   `activeindex` на корне, потом `active` на первом найденном
   `TabSheet`.

2. **`uniqid` генерируется на сервере** — в IDE он не моделируется.
   В сохранённый XML не попадает. Если в форме несколько
   `PageControl`-ов, у каждого свой `uniqid` — это нужно, чтобы
   CSS-классы `tab0_<uniqid>` не пересекались.

3. **Кнопки скролла в горизонтальном режиме** — показываются, когда
   табы не влезают по ширине. В IDE не воспроизводятся (placeholder
   не эмулирует переполнение).

4. **`nobg="true"`** — убирает фон табов и нижнюю границу. В IDE
   отражается лёгким изменением стиля бара. В рантайме — удаление
   класса `bg` у корня и `<ul>`.

5. **Скрытие невидимых `TabSheet`** — если у закладки
   `visible="false"`, её таб и страница не показываются. При
   переключении клавиатурой такие табы пропускаются (в
   `CtrlKeyDown` — цикл `while (!flag)`).

6. **События `onpagechange` / `onpageshow` / `onpagehide`** —
   вызываются через `D3Base.callEvent`. Аргументы:
    - `onpagechange` — `(newIndex, oldIndex)`
    - `onpageshow` / `onpagehide` — `(pageIndex)`

7. **`button_class` / `content_class`** у `TabSheet` — доп. CSS-классы
   на `<li>` таба и `<div>` страницы. В IDE-превью не отражаются,
   но сохраняются в XML.

8. **Клавиатурная навигация** — работает, когда фокус на
   `PageControl` (у корня `tabindex="0"`). В IDE-превью фокус
   не перехватывается — это ответственность рантайма.

9. **Вертикальный режим — flex-контейнер** — `PageControl.css`
   задаёт `display: flex; flex-direction: row` для корня с
   `mode="vertical"`. Это отступление от «табличного» позиционирования
   горизонтального режима.

10. **`CalckTabSheetHead` вызывается при инициализации** — считает
    суммарную ширину видимых табов. Если табы добавляются/удаляются
    динамически (например, через `visible`), нужно вызывать
    `CalckTabSheetHead()` вручную или через `setVisible` у `TabSheet`
    (это делает `TabSheetCtrl.setVisible`).

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → PageControl**.
2. В инспекторе задать:
    - `name` (для доступа через `getControl(name)`);
    - `mode` — `horizontal` или `vertical`;
    - `activeindex` — индекс активной закладки;
    - при необходимости `nobg="true"`.
3. Добавить внутрь `PageControl` нужное количество `TabSheet`
   через палитру.
4. У каждого `TabSheet` задать:
    - `caption` — текст на табе;
    - `active="true"` — если закладка активна при открытии (только
      у одной);
    - `visible="false"` — если закладка должна быть скрыта;
    - при необходимости `button_class` / `content_class`.
5. Внутрь каждого `TabSheet` положить нужные D3-компоненты.
6. При необходимости привязать события:
    - `onpagechange` — для реакции на смену закладки;
    - `onpageshow` / `onpagehide` — для реакций на показ/скрытие.
7. Для программного переключения:
   ```js
   setControlProperty('<pc_name>', 'activeIndex', <index>);
   ```

---

## См. также

- `Component/d3/TabSheet/README.md` — описание дочерней закладки
- `Component/d3/Grid/README.md` — аналогичная пара «родитель → дочерний»
  (`cmpGrid` → `cmpColumn`)
- `PageControlCtrl.inc` — серверный код `PageControl` и `TabSheet`
- `PageControl.js` — клиентские контролы `D3Api.PageControlCtrl`
  и `D3Api.TabSheetCtrl`
- `PageControl.css` — стили `.ctrl_pageControl`, `.ctrl_pageControlTabs`,
  `.button_scroll`

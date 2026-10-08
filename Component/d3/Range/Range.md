# cmpRange

Контрол постраничной навигации (пагинации). В рантайме рендерит
панель с кнопками `←`/`→`, номерами страниц, селектором «по N
записей» и полем «стр. X из Y».

Работает в связке с `cmpDataSet`: переключение страниц вызывает
`dataset.setRange(page, amount)`, что приводит к обновлению
данных. Поддерживает два режима:

- **`count="true"`** (по умолчанию) — точное количество страниц
  (DataSet делает `count`-запрос);
- **`count="false"`** — без счётчика: страницы подсчитываются
  «на ходу», добавляется кнопка `»` (последняя страница) и
  отображается «N+» вместо точного числа.

Также поддерживает иерархический режим (`tree_dataset` /
`parentfield` / `childsfield`) и привязку к `SelectList`
(`selectlist` — «Отмечено: N»).

---

## Расположение

```
Component/d3/Range/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `RangeCtrl.inc` | class `Range extends BaseCtrl` |
| `Range.js` | `D3Api.RangeCtrl` |
| `Range.css` | Стили `.ctrl_range`, `.ctrl_range_page`, `.ctrl_range_amount` |

---

## Тег и ID

- **XML-тег:** `cmpRange`
- **Регистрация в IDE:** `id: 'd3.range'`
- **Категория:** D3
- **Вид в палитре:** `Range`
- **Видимость:** видимый (рендерит разметку в canvas)

---

## Разметка в рантайме

Серверный `Range::Show()` собирает:

```html
<div class="ctrl_range" uniqid="r5f1a2b3c4d" …attrs…>
  <div class="ctrl_range_go_prior"
       onclick="D3Api.RangeCtrl.go(this,-1)"></div>

  <ul class="ctrl_range_pages" cont="btnpagecont">
    <li class="ctrl_range_page" cont="btnpage"></li>
  </ul>

  <div class="ctrl_range_go_next ctrl_range_last_bt"
       onclick="D3Api.RangeCtrl.go(this,1)"></div>

  <div class="ctrl_range_go_last ctrl_range_last_bt"
       cont="range_go_last"
       onclick="D3Api.RangeCtrl.goLastPage(this);"
       title="На последнюю страницу"></div>

  <div class="ctrl_range_cont" name="range_count_r5f1a2b3c4d" cmptype="Base"></div>
  <div class="ctrl_range_cont" name="range_select_r5f1a2b3c4d" cmptype="Base"></div>

  <div class="ctrl_range_nav">
    по&nbsp;
    <div class="ctrl_range_amount" cont="range_amount">
      <span title="записей"></span>
      <div class="ctrl_range_amount_tip">
        <div class="ctrl_range_amount_item" cont="tip_value"
             onclick="D3Api.RangeCtrl.onChangeAmount(event,this,10)">10</div>
        <div class="ctrl_range_amount_item" cont="tip_value"
             onclick="D3Api.RangeCtrl.onChangeAmount(event,this,20)">20</div>
        …
        <cmpEdit name="range_amount_r5f1a2b3c4d"
                 onkeypress="D3Api.RangeCtrl.onKeyPressAmount(this);" width="50"/>
      </div>
    </div>&nbsp;записей&nbsp;…

    стр.&nbsp;
    <div class="ctrl_range_go" cont="range_go">
      <span title="перейти на страницу..."></span>
      <div class="ctrl_range_go_tip">
        <cmpEdit name="range_page_r5f1a2b3c4d"
                 onkeypress="D3Api.RangeCtrl.onKeyPressPage(this);" width="50"/>
      </div>
    </div>&nbsp;из <span cont="range_pages"></span>
  </div>
</div>
```

Особенности:

- `<ul cont="btnpagecont">` — контейнер для кнопок страниц. Первый
  `<li cont="btnpage">` служит шаблоном и удаляется из DOM в
  `init()`; `addPage` клонирует его для каждой страницы.
- Два `<div cont="range_count_<uid>">` и `<div cont="range_select_<uid>">` —
  служебные контейнеры, в которые `D3Form.setCaption` пишет
  «Всего: N» / «Отмечено: N».
- `<cmpEdit>` внутри tip-блоков — для ввода количества записей и
  номера страницы вручную.
- `uniqid` (`r5f1a2b3c4d`) генерируется сервером и подставляется в
  имена служебных контролов.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`, `width`, `height`

### Range
- **`dataset`** — имя DataSet, к которому привязан Range
- **`default_amount`** — количество записей на странице (по
  умолчанию `10`)
- **`amounts`** — варианты количества через запятую:
  `"10,20,30,40,50"`. Если пусто — используются значения по
  умолчанию
- **`pages`** — количество видимых номеров страниц (по умолчанию `3`)
- **`count`** — `true` (по умолчанию) — точный счётчик страниц.
  `false` — без счётчика, добавляется кнопка `»` и «N+»
- **`show_count`** — `true` — показывать «Всего: N» рядом с
  пагинатором
- **`selectlist`** — имя `SelectList`-контрола. Если задано —
  Range показывает «Отмечено: N» и подписывается на его
  `onupdate`
- **`keyfield`** — имя ключевого поля (используется DataSet-ом при
  `setRange`)
- **`not_append_ds`** — `true` — не добавлять `Range`-фильтр
  (`dsstart` / `dscount`) к DataSet
- **`locate`** — формат `field:control:property`. Если задано —
  Range будет автоматически позиционировать DataSet на запись
  перед обновлением

### Tree (для иерархического режима)
- **`tree_dataset`** — имя DataSet-дерева
- **`parentfield`** — поле-родитель в дереве
- **`childsfield`** — поле-потомок

### Events
- **`onamount`** — изменение количества записей на странице.
  Аргумент: новое значение `amount`. Вызывается до `setRange`
- `onclick`, `ondblclick` — стандартные HTML-события

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `dataset` | string | Обязательно. Имя DataSet, которым управляет Range |
| `default_amount` | number | Записей на странице по умолчанию. Если пусто — `amounts[0]` |
| `amounts` | string | Список через запятую: `"5,10,20,50,100"` |
| `pages` | number | Сколько номеров страниц показывать вокруг активной |
| `count` | boolean | Точный счётчик страниц (через `refreshByMode('count')`) |
| `show_count` | boolean | Показывать «Всего: N» |
| `selectlist` | string | Имя SelectList-контрола для отображения счётчика выбранных |
| `keyfield` | string | Имя ключевого поля DataSet |
| `not_append_ds` | boolean | Не передавать `dsstart`/`dscount` в DataSet |
| `locate` | string | `field:control:property` — авто-позиционирование |
| `tree_dataset` | string | DataSet-дерево (иерархический режим) |
| `parentfield` | string | Поле-родитель |
| `childsfield` | string | Поле-потомок |

---

## Логика работы

### Инициализация (`D3Api.RangeCtrl.init`)

1. Сохраняет `uniqid`.
2. Инициализирует `D3Range`: `page=1`, `pages=1`, `amount=default_amount`,
   `viewPages`, `count`, `show_count`, `selectlist`, `keyfield`,
   `tree_dataset`, `parentfield`, `childsfield`.
3. Находит DataSet через `D3Form.getDataSet(dataset)`.
4. Если `show_select` — связывается с SelectList, ставит
   `onupdate` → обновление счётчика «Отмечено: N».
5. Иначе — скрывает контейнер `range_select_<uid>`.
6. Навешивает `onamount` на `D3Base`.
7. Если задан `locate` — разбирает `field:control:property`, вешает
   `onbefore_refresh` на DataSet.
8. Вешает `onbefore_refresh` на DataSet — при любом обновлении
   сбрасывает страницу на 1.
9. Вешает `onrefresh` на DataSet — вызывает `paint()`.
10. Находит `btnPage`, `btnsCont`, `amCont`, `goCont`, `psCont` —
    служебные DOM-узлы. Удаляет `btnPage` (шаблон).
11. Навешивает `showTip` на `amCont` и `goCont` — открытие
    подсказки с полем ввода.
12. Устанавливает начальное `amount` в `amCont.firstChild.innerHTML`.
13. Вызывает `setRange(page=1)` для загрузки первой страницы.

### Управление страницами

- **`go(dom, delta)`** — перейти на `page + delta`.
- **`page(dom, page, showOnly)`** — перейти на конкретную страницу.
  Если `showOnly=true` — только перерисовать (`paint`), не
  перезагружать DataSet.
- **`setRange(dom, page, amount, refresh)`** — основной метод.
  Проверяет границы, обновляет `amount`, при необходимости
  пересчитывает `pages`, затем вызывает
  `dataset.setRange(page-1, amount, refresh, keyfield, count, not_append_ds, oldPageLocateValue)`.
- **`goLastPage(dom)`** — сначала `getCountRows` (запрос `count`),
  потом `setRange(pages)`.

### Смена количества

- **`amount(dom, amount)`** — установить количество записей на
  странице. Вызывает `onamount`, затем `setRange(page=1, amount)`.
- **`onChangeAmount(event, dom, amount)`** — обработчик клика по
  пункту из `amounts`.
- **`onKeyPressAmount(ed)`** — обработчик Enter в `<cmpEdit>` для
  ручного ввода количества.

### Перерисовка (`paint`)

1. Проверяет `norange` — если DataSet отключил range, выходит.
2. Пересчитывает `page` и `pages`.
3. Очищает контейнер кнопок страниц.
4. Если `pages > viewPages + 4` — рисует «сжатую» пагинацию
   (`1 … p-1 p p+1 … N`), иначе — все страницы подряд.
5. Обновляет «стр. X из Y».
6. Если `count=false` и есть ещё страницы — рисует «N+» с
   обработчиком клика (запрос `count` через `getCountRows`).
7. Вызывает `showCount` — счётчик «Всего: N», если `show_count`.

### Авто-позиционирование (`locate`)

Если задан `locate = "field:control:property"`:

1. Перед каждым обновлением DataSet вызывает `setLocate(dom)`.
2. Читает значение из `control.property` (по умолчанию — свойство
   `locate`).
3. Вызывает `dataset.setLocate(field, value)` — DataSet сам
   спозиционируется на нужную запись и пересчитает страницу.

### Взаимодействие с профилем Grid

`profileRangeShowCount(dom, profile)` — вызывается из `Grid` при
изменении профиля. Переопределяет `show_count` и вызывает
`showCount`. Если `profile` не задан — восстанавливает прежнее
значение.

---

## Примеры использования

### 1. Простой Range в GridFooter

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH">
    <cmpColumn name="" field="id"   caption="ID"/>
    <cmpColumn name="" field="name" caption="Наименование"/>
    <cmpGridFooter separate="false">
        <cmpRange dataset="DS_HH" default_amount="5"/>
    </cmpGridFooter>
</cmpGrid>
```

Range появится в подвале Grid и будет управлять страницами DataSet
`DS_HH`.

### 2. Range с кнопкой «последняя страница»

```xml
<cmpRange dataset="DS_HH" default_amount="10" count="false"/>
```

Так как `count="false"`, появится кнопка `»` (переход на последнюю
страницу) и счётчик страниц будет показываться как «N+».

### 3. Range со счётчиком записей

```xml
<cmpRange dataset="DS_HH" default_amount="20" show_count="true"/>
```

Рядом с пагинатором появится «Всего: N».

### 4. Range с кастомными вариантами количества

```xml
<cmpRange dataset="DS_HH" default_amount="5"
          amounts="5,10,25,50,100"/>
```

В выпадающем списке «по N записей» будут эти варианты.

### 5. Range с SelectList

```xml
<cmpGrid name="GRID_HH" dataset="DS_HH" selectlist="id">
    …
</cmpGrid>

<cmpRange dataset="DS_HH" selectlist="GRID_HH_SelectList"/>
```

Range покажет «Отмечено: N» — количество выбранных записей.

### 6. Range с авто-позиционированием

```xml
<cmpEdit name="selectedId" value="42"/>

<cmpRange dataset="DS_HH"
          locate="id:selectedId:value"/>
```

Перед каждым обновлением DataSet Range возьмёт `value` из
`selectedId` и вызовет `dataset.setLocate('id', value)` —
откроется страница с записью `id=42`.

### 7. Реакция на смену количества

```xml
<cmpRange dataset="DS_HH" onamount="Form.onAmountChange(arguments[0]);"/>
```

```js
Form.onAmountChange = function(newAmount) {
    console.log('Записей на странице:', newAmount);
};
```

### 8. Программное переключение

```js
var range = getControl('rng');
D3Api.RangeCtrl.page(range, 3);            // на страницу 3
D3Api.RangeCtrl.amount(range, 50);         // по 50 записей
D3Api.RangeCtrl.goLastPage(range);         // на последнюю
D3Api.RangeCtrl.setRange(range, 1, 20);    // на первую, по 20
```

### 9. Ручной ввод номера страницы

Стандартный Range уже содержит `<cmpEdit>` внутри tip-блока
«стр. X из Y». Пользователь может ввести номер и нажать Enter —
сработает `onKeyPressPage`.

Аналогично для количества записей — `onKeyPressAmount`.

### 10. Отключение Range-фильтра

```xml
<cmpRange dataset="DS_HH" not_append_ds="true"/>
```

Range не будет передавать `dsstart`/`dscount` в DataSet. Полезно,
если DataSet сам управляет пагинацией.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается статичный «скелет»
пагинатора:

```
┌──┬──┬──┬──┬──┬──┬──┐                    ┌────────────┐  ┌────────────┐
│‹ │1 │2 │3 │4 │5 │› │  по 10 записей     │ стр. 1 из 5│  │    range   │
└──┴──┴──┴──┴──┴──┴──┘                    └────────────┘  └────────────┘
```

- Кнопки `‹`, `›` — переходы на предыдущую/следующую страницу;
- Номера `1..5` — активная страница подсвечена голубым;
- «по N записей» — селектор количества (`default_amount`);
- «стр. 1 из 5» — текущая позиция;
- Кнопка `»` — если `count="false"`;
- Бейдж `range` в углу — маркер компонента.

Реальная пагинация зависит от `dataset` и его данных — в IDE не
воспроизводится.

### В дереве

```
cmpRange name="" dataset="DS_HH" default_amount="10" pages="3" count="true"
```

Одна строка — детей нет.

### В инспекторе

Все атрибуты доступны для редактирования. Разделы:
- HTML attributes
- D3 Base
- Range
- Tree
- Events
- Styles

### Ограничения

- **Детей нет** — Range не принимает вложенные компоненты.
- **Реальная пагинация не работает** — превью статично.
- **`uniqid` не отображается** — внутренний идентификатор.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/Range/index.js"></script>
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmprange': 'cmpRange',
```

`_injectIdeStyle` не трогаем — Range видим.

`XML_SELF_CLOSE` не трогаем — `cmpRange` контейнерный.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmprange': 'cmpRange',
```

---

## Известные ограничения

1. **`count="true"` требует отдельного `count`-запроса** — при
   каждой смене страницы DataSet делает дополнительный
   `refreshByMode('count')`, чтобы узнать общее количество.
   Если этого не нужно — используйте `count="false"`.

2. **`amounts` — строка через запятую, а не массив.** В
   `RangeCtrl.inc` она парсится через `explode(',', $amounts)`.
   Пример: `amounts="5,10,20,50,100"`.

3. **`uniqid` — внутренний.** Сервер генерирует `uniqid()` и
   подставляет в имена `range_amount_<uid>`, `range_page_<uid>`,
   `range_count_<uid>`, `range_select_<uid>`. В сохранённый XML он
   не попадает; при повторной загрузке формы сервер создаёт новый
   `uniqid`.

4. **`locate` — формат `field:control:property`.** Если указать
   только `field:control`, свойство по умолчанию — `'locate'`.
   Пример: `locate="id:selectedId"` → `id:selectedId:locate`.

5. **`show_count="true"` требует поддержки DataSet.** Счётчик
   «Всего: N» отображается только если DataSet умеет отдавать
   `getAllCount()`. При `count="false"` значение вычисляется
   приблизительно: `(pages-1) * amount + lastAmount`.

6. **`profileRangeShowCount`** — вызывается из Grid при смене
   профиля. Если Range используется вне Grid, эта логика не
   сработает, и `show_count` не будет меняться через профиль.

7. **Кнопка `»` появляется только при `count="false"`.** В режиме
   `count="true"` она не нужна — номер последней страницы известен.

8. **`onKeyPressAmount` / `onKeyPressPage`** — реагируют только
   на `Enter` (`keyCode === 13`). Esc и другие клавиши игнорируются.

9. **`Range` может быть отключён DataSet-ом** — если
   `dataset.range.norange === true`, метод `paint()` немедленно
   выходит. Это используется, когда DataSet работает в режиме
   без постраничной навигации.

10. **`onclick` / `ondblclick` не навешиваются сервером.** В
    `Range::Show()` в корневой `<div>` пишется `implode(' ', $this->events)`,
    но Range не вызывает `extendEvent`, поэтому пользовательские
    обработчики попадут в разметку как есть, если заданы вручную.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → Range**.
2. В инспекторе задать:
    - `name` — имя контрола (для `getControl`);
    - `dataset` — обязательный, имя управляемого DataSet;
    - `default_amount` — количество записей на странице
      (по умолчанию `10`);
    - `amounts` — варианты через запятую
      (`"5,10,20,50,100"`);
    - `pages` — сколько номеров страниц показывать (`3` по умолчанию);
    - `count` — `true` для точного счётчика, `false` для «N+»;
    - `show_count` — `true` для отображения «Всего: N»;
    - `selectlist` — имя SelectList для «Отмечено: N»;
    - `locate` — если нужно авто-позиционирование.
3. При необходимости — привязать событие `onamount`.
4. Проверить в canvas: должен отобразиться «скелет» пагинатора.
5. Проверить в дереве: `cmpRange` — одна строка без детей.
6. Для программного управления использовать:
   ```js
   var range = getControl('<name>');
   D3Api.RangeCtrl.page(range, <page>);
   D3Api.RangeCtrl.amount(range, <amount>);
   D3Api.RangeCtrl.goLastPage(range);
   ```

---

## См. также

- `Component/d3/Grid/README.md` — `GridFooter` — типовое место
  размещения Range
- `Component/d3/DataSet/README.md` — DataSet, к которому
  привязывается Range
- `RangeCtrl.inc` — серверный код `Range`
- `Range.js` — клиентский `D3Api.RangeCtrl`
- `Range.css` — стили `.ctrl_range`, `.ctrl_range_page`,
  `.ctrl_range_amount`, `.ctrl_range_go`, `.ctrl_range_nav`

# cmpStatSumm

Определение итоговой суммы в колонке аналитического Grid
(`cmpStatGridColumn`). Задаёт, какие агрегаты считать по колонке
(`sum`, `count`, `avg`, `max`, `min`) и как их отображать
(подпись, префикс, постфикс, точность).

В рантайме `StatSumm` не рендерит видимой разметки — сервер
вставляет скрытый `<div style="display:none;">` внутрь HTML-сумм
колонки (`columns_summ`), где сохраняются атрибуты (`summ_type`,
`summ_caption`, `summ_before`, `summ_after`, `summ_fixed`) и
значения `field` / `index`, унаследованные от родительской
`StatGridColumn`.

Клиент (`D3Api.StatGridCtrl`) собирает все такие `<div>` в
`dom.D3StatGrid.summ[]` и при подсчёте данных:
- добавляет `addGroupSumm(field, type, fixed)` в DataSet —
  чтобы сервер вернул агрегаты в ответе;
- выводит значения с префиксом / постфиксом в подвал StatGrid и в
  итоговые строки групп.

Без `StatGridColumn` не работает: `Show()` молча выходит, если
родитель не `StatGridColumn`.

---

## Расположение

```
Component/d3/StatSumm/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Role |
|---|---|
| `StatGridCtrl.inc` | class `StatSumm extends BaseCtrl` |
| `StatGrid.js` | клиентская логика в `D3Api.StatGridCtrl` |
| `StatGrid.css` | стили `tr.groupsumm td.column_data` (жёлтая подсветка итогов) |

---

## Тег и ID

- **XML-тег:** `cmpStatSumm`
- **Регистрация в IDE:** `id: 'd3.statgridsumm'`
- **Категория:** D3
- **Вид в палитре:** `StatSumm`
- **Видимость:** видимый (рендерится родителем через скрытый `<div>`)
- **parentOnly:** `cmpstatgridcolumn` — можно вставить только
  внутрь `StatGridColumn`

---

## Разметка в рантайме

`StatSumm::Show()` формирует скрытый `<div>` и передаёт его в
родительскую колонку через `setSumm(...)`. Родитель накапливает
эти `<div>` в `$parent->columns_summ`, который затем вставляется в
`statgrid_columns` (после шапки колонок):

```html
<div class="statgrid_columns" cont="statgridcolumnscont">
  <table class="statgrid_columns" cont="statgridcolumns">
    <colgroup>…</colgroup>
    <tbody>…шапка колонок…</tbody>
  </table>

  <!-- СЮДА ПОПАДАЕТ columns_summ -->
  <div style="display: none;"
       summ_type="sum"
       summ_caption="Итого"
       summ_before="≈ "
       summ_after=" руб."
       summ_fixed="2"
       field="amount"
       index="2"> </div>
</div>
```

Особенности:

- `<div style="display: none;">` — сам не виден в DOM, но
  клиент его находит через `[summ_type]`.
- Атрибуты `field` и `index` подставляются сервером из
  родительской колонки (`$this->parent->field`, `$this->parent->index`).
  Задавать их вручную в XML не нужно.
- Пользовательские атрибуты (`summ_type`, `summ_caption`,
  `summ_before`, `summ_after`, `summ_fixed`, `summ_postfix`)
  пробрасываются через `GetAttrString()`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### StatSumm
- **`field`** — имя поля DataSet. **Заполняется автоматически из
  родительской колонки**, но в IDE доступно для явного указания
  (полезно, если нужно посчитать сумму по другому полю, чем
  поле колонки).
- **`index`** — индекс колонки. **Заполняется автоматически** из
  родителя. Не рекомендуется менять.
- **`summ_type`** — тип агрегата: `sum | count | avg | max | min`.
  Обязательный, без него агрегат не сработает.
- **`summ_caption`** — подпись перед значением. По умолчанию —
  заголовок колонки (берётся из `td.caption` в шапке).
- **`summ_before`** — строка перед значением (например `≈ `).
- **`summ_after`** — строка после значения (например ` руб.`).
- **`summ_fixed`** — количество знаков после запятой
  (округление). Передаётся в `addGroupSumm` третьим аргументом.
- **`summ_postfix`** — зарезервировано. Читается из DOM на
  клиенте, но не используется в текущей версии.

### Events
Пусто.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`. Впрочем,
они применяются к `cmpStatSumm` (который не рендерится в DOM),
а не к скрытому `<div>`. Практически не влияют на внешний вид.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `field` | string | Имя поля DataSet. Если пусто — берётся из родительской колонки |
| `index` | number | Индекс колонки. Заполняется сервером автоматически |
| `summ_type` | enum | `sum` (сумма), `count` (кол-во), `avg` (среднее), `max` (наибольшее), `min` (наименьшее) |
| `summ_caption` | string | Подпись перед суммой. Пример: `Итого` |
| `summ_before` | string | Префикс значения. Пример: `≈ `, `≈> `, `[` |
| `summ_after` | string | Постфикс значения. Пример: ` руб.`, `%`, `]` |
| `summ_fixed` | number | Количество знаков после запятой при округлении |
| `summ_postfix` | string | Зарезервировано, не используется |

---

## Логика работы

### Сервер

`StatSumm::__construct`:

1. Устанавливает `CmpType = 'StatSumm'`.
2. Вызывает `parent::__construct`.

`StatSumm::Show()`:

1. Проверяет `parent->CmpType == 'StatGridColumn'`. Если нет —
   выходит молча.
2. Формирует строку:
   ```php
   '<div style="display: none;" ' . $this->GetAttrString()
   . ' field="' . $this->parent->field . '"'
   . ' index="' . $this->parent->index . '"> </div>'
   ```
3. Передаёт её в `$this->parent->setSumm(...)` — родитель
   накапливает HTML в `$parent->columns_summ`.

Родитель (`StatGridColumn::Show`) добавляет `columns_summ` в
разметку аналитического Grid после шапки колонок.

### Клиент

`D3Api.StatGridCtrl.init`:

1. Находит все элементы `[summ_type]` внутри `dom`:
   ```js
   var summs = D3Api.getAllDomBy(dom, '[summ_type]');
   ```
2. Для каждого читает:
    - `summ_type` — в `type`
    - `field` — в `field`
    - `summ_caption` — в `caption` (по умолчанию — заголовок колонки)
    - `summ_before` — в `before` (по умолчанию `''`)
    - `summ_after` — в `after` (по умолчанию `''`)
    - `summ_fixed` — в `fixed`
    - `summ_postfix` — в `postfix`
3. Кладёт объект в `dom.D3StatGrid.summ[index]` (массив, потому
   что в одной колонке может быть несколько сумм).
4. Устанавливает `dom.D3StatGrid.haveSumm = true`.

### Подсчёт

В `refreshData` → `addEvent('onbefore_refresh')` клиент для каждой
суммы вызывает:

```js
dom.D3Store.dataSet.addGroupSumm(
    summ[i].field,
    summ[i].type,
    summ[i].fixed
);
```

DataSet добавляет агрегат в запрос (тип `count`/`sum`/…), и
сервер возвращает значения полей вида `SUM_AMOUNT`, `AVG_AMOUNT`,
`COUNT_FIELD` и т.п.

### Отображение

В `setStatGridData`:

- для итоговых строк групп (`tr.groupsumm`) — значения
  собираются как `before + value + after` и выводятся через `<br/>`;
- для общей итоговой строки в подвале (`cont="statgridfootersumm"`)
  — собирается «ИТОГО: caption1: value1, value2; caption2: …».

Значения по умолчанию:

- `value` при отсутствии — `'0'`;
- `caption` — из `summ_caption` или заголовка колонки;
- `before` / `after` — если не заданы, пустые.

---

## Примеры использования

### 1. Простая сумма

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма" align="right">
    <cmpStatSumm field="amount" index="2" summ_type="sum"/>
</cmpStatGridColumn>
```

В подвале StatGrid появится «Всего: N ИТОГО: Сумма: <значение>».
В строках групп (при группировке) — подытог по каждому полю.

### 2. Сумма с подписью

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма">
    <cmpStatSumm field="amount" index="2" summ_type="sum"
                 summ_caption="Итого по колонке"/>
</cmpStatGridColumn>
```

В подвале: «ИТОГО: Итого по колонке: <значение>».

### 3. Сумма с префиксом и постфиксом

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма">
    <cmpStatSumm field="amount" index="2" summ_type="sum"
                 summ_before="≈ "
                 summ_after=" руб."/>
</cmpStatGridColumn>
```

Значение отобразится как «≈ 12345.67 руб.».

### 4. Сумма с округлением

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма">
    <cmpStatSumm field="amount" index="2" summ_type="sum"
                 summ_fixed="2"/>
</cmpStatGridColumn>
```

Значение округлится до двух знаков после запятой.

### 5. Несколько сумм в одной колонке

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма">
    <cmpStatSumm field="amount" index="2" summ_type="sum"   summ_caption="Итого"/>
    <cmpStatSumm field="amount" index="2" summ_type="avg"   summ_caption="Среднее"/>
    <cmpStatSumm field="amount" index="2" summ_type="count" summ_caption="Кол-во"/>
</cmpStatGridColumn>
```

В подвале отобразится три значения через запятую:
«Итого: …, Среднее: …, Кол-во: …».

### 6. Сумма по другому полю

```xml
<cmpStatGridColumn name="" field="category" caption="Категория">
    <cmpStatSumm field="amount" index="0" summ_type="sum"/>
</cmpStatGridColumn>
```

Колонка отображает `category`, но сумма считается по полю
`amount` (указано в `field` у `StatSumm`).

### 7. Комбинированная колонка

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма" align="right">
    <cmpStatSumm field="amount" index="2" summ_type="sum"
                 summ_caption="Всего"
                 summ_before="["
                 summ_after="]"
                 summ_fixed="2"/>
    <cmpStatSumm field="amount" index="2" summ_type="max"
                 summ_caption="Макс."
                 summ_before="max = "/>
</cmpStatGridColumn>
```

В подвале: «ИТОГО: Всего: [12345.67]; Макс.: max = 5000».

### 8. Только количество

```xml
<cmpStatGridColumn name="" field="id" caption="ID">
    <cmpStatSumm field="id" index="0" summ_type="count"
                 summ_caption="Записей"/>
</cmpStatGridColumn>
```

Полезно для подсчёта количества строк в колонке.

### 9. Минимум / максимум

```xml
<cmpStatGridColumn name="" field="date" caption="Дата">
    <cmpStatSumm field="date" index="1" summ_type="min"
                 summ_caption="Первая дата"/>
    <cmpStatSumm field="date" index="1" summ_type="max"
                 summ_caption="Последняя дата"/>
</cmpStatGridColumn>
```

Диапазон дат в колонке.

### 10. Программное чтение сумм

```js
var sg = getControl('SG1');

// Список сумм по колонкам
var summ = sg.D3StatGrid.summ;
// summ[2] — массив сумм для колонки с index=2

for (var ind in summ) {
    for (var i = 0; i < summ[ind].length; i++) {
        console.log('Колонка ' + ind, summ[ind][i]);
        // { field, type, caption, before, after, fixed, postfix }
    }
}
```

---

## Поведение в IDE

`StatSumm` — видимый только через родителя (`StatGridColumn` →
`StatGrid`). Отдельного `preview()` у него нет: визуализация
появляется как часть StatGrid в виде подвала с суммой «Всего: 0».

### В canvas

В превью StatGrid подвал всегда отображается как:

```
┌──────────────────────────────────────────┐
│ Статистика                               │
├──────────────────────────────────────────┤
│ Код   │ Наименование │ Сумма              │
├───────┼──────────────┼────────────────────┤
│       │              │                    │
├───────┴──────────────┴────────────────────┤
│ Всего: 0                                 │
└──────────────────────────────────────────┘
```

Реальные значения сумм в превью **не отображаются** — только
заглушка. Формат и стиль итоговых строк (жёлтый фон
`tr.groupsumm`) видны только в рантайме.

### В дереве

```
cmpStatGrid name="SG1" dataset="DS_STAT"
  cmpStatGridColumn name="" field="amount" caption="Сумма"
    cmpStatSumm field="amount" index="2" summ_type="sum"
    cmpStatSumm field="amount" index="2" summ_type="avg"
```

`StatSumm` — узел внутри колонки. Может быть несколько на одну
колонку.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- StatSumm: `field`, `index`, `summ_type`, `summ_caption`,
  `summ_before`, `summ_after`, `summ_fixed`, `summ_postfix`
- Events: пусто
- Styles: полный набор CSS-свойств

Изменения атрибутов в инспекторе отражаются только при сохранении
формы (в рантайме). В canvas суммы не отображаются.

### Ограничения

- **Без `StatGridColumn` не работает.**
- **В превью StatGrid итоги не видны** — только заглушка.
- **`summ_postfix` не используется** — читается, но игнорируется.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/StatGrid/index.js"></script>
<script src="Component/d3/StatGridColumn/index.js"></script>
<script src="Component/d3/StatGridColumnHeader/index.js"></script>
<script src="Component/d3/StatGridFooter/index.js"></script>
<script src="Component/d3/StatSumm/index.js"></script>
```

Порядок: `StatSumm` после `StatGridColumn`.

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmpstatsumm: 'cmpstatgridcolumn',
```

Это включает проверку drag&drop — `StatSumm` не сможет улететь
вне `StatGridColumn`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpstatsumm': 'cmpStatSumm',
```

`_injectIdeStyle` не трогаем — компонент видим через родителя.

`XML_SELF_CLOSE` не трогаем — контейнерный компонент (в рантайме
рендерит `<div>`).

`CDATA_CONTAINERS` не трогаем — `StatSumm` не содержит CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpstatsumm': 'cmpStatSumm',
```

---

## Известные ограничения

1. **`parentOnly: cmpstatgridcolumn`.** Вне колонки не рендерится.

2. **`summ_type` обязателен.** Без него `addGroupSumm` на клиенте
   вызовется с пустым типом — DataSet не посчитает агрегат.

3. **`field` и `index` заполняются сервером.** Если задать их
   вручную — это может привести к рассинхрону с родительской
   колонкой. Задавайте `field` только если сумма считается по
   другому полю.

4. **`summ_postfix` — зарезервировано.** В текущей реализации
   значение сохраняется в `dom.D3StatGrid.summ[i].postfix`, но
   нигде не используется. Оставлено для будущих доработок.

5. **`summ_before` / `summ_after`** — строки без экранирования.
   Если нужно использовать `<`, `>`, `&`, `"` — экранируйте
   их вручную или задавайте через `&lt;`, `&gt;` и т.п.

6. **`summ_fixed` передаётся в `addGroupSumm`.** Округление
   делает сам DataSet на сервере, не клиент. Если сервер не
   поддерживает параметр — он игнорируется.

7. **`summ_caption` по умолчанию — заголовок колонки.** Клиент
   читает его из `td.caption` в шапке. Если у колонки
   `caption` пустой и `summ_caption` не задан — подпись будет
   пустой.

8. **Несколько `StatSumm` в одной колонке** — допустимо, но
   важно: у всех должен быть одинаковый `index` (клиент
   группирует по индексу). Если `index` разный — часть сумм
   может не отобразиться в итоговой строке.

9. **Итоговые строки групп** — жёлтый фон (`tr.groupsumm
   td.column_data` — `#FEFEE1`). Стиль задан в `StatGrid.css`
   и не переопределяется через инспектор.

10. **Общая итоговая строка в подвале** — `cont="statgridfootersumm"`.
    Формат вывода: `Всего: N ИТОГО: caption1: value1, value2;
    caption2: …`. Задаётся в `setStatGridData` и не настраивается
    через атрибуты `StatSumm`.

11. **`text` в `StatSumm` не используется.** Класс имеет
    `var $text`, но `SetInnerText` в текущей версии не
    переопределён, а `Show()` использует только
    `$this->parent->setSumm(...)`. Вложенный HTML внутрь
    `cmpStatSumm` игнорируется.

12. **`count` вместо `sum` для пустой колонки.** Если в колонке
    нет чисел (`field` — строковое поле), `sum` вернёт `0`.
    Для подсчёта строк используйте `summ_type="count"`.

13. **Клиентский контрол отсутствует.** Все взаимодействия —
    через `D3Api.StatGridCtrl` и `dom.D3StatGrid.summ`.

14. **Скрытый `<div>` от `StatSumm` рендерится только в
    `statgrid_columns`.** В `statgrid_data` и `statgrid_filters`
    его нет. Клиент ищет суммы через `getAllDomBy(dom, '[summ_type]')`
    по всему StatGrid.

15. **Кол-во знаков после запятой (`summ_fixed`)** — работает
    только если серверный DataSet поддерживает параметр.
    В текущей версии `addGroupSumm(field, type, fixed)` —
    третий аргумент передаётся в серверный метод.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `StatSumm` добавляется **внутрь
   `cmpStatGridColumn`** — иначе IDE не даст вставить (через
   `PARENT_ONLY`).
2. В инспекторе задать:
    - `summ_type` — тип агрегата (`sum` / `count` / `avg` /
      `max` / `min`). Обязательно;
    - `field` — только если сумма считается по другому полю
      (обычно берётся из родительской колонки);
    - `summ_caption` — подпись (по умолчанию — заголовок
      колонки);
    - `summ_before`, `summ_after` — префикс / постфикс значения;
    - `summ_fixed` — количество знаков после запятой.
3. Если нужны несколько агрегатов в одной колонке — добавить
   несколько `StatSumm` с одинаковым `index`.
4. Убедиться, что у родительской колонки задан `field` (иначе
   `field` в `StatSumm` не подставится автоматически).
5. Проверить в дереве: `cmpStatSumm` должен быть ребёнком
   `cmpStatGridColumn`.
6. В рантайме: итоговые значения появятся в подвале StatGrid и в
   строках групп (при группировке).

---

## См. также

- `Component/d3/StatGrid/README.md` — родительский аналитический Grid
- `Component/d3/StatGridColumn/README.md` — колонка, внутри которой
  рендерится сумма
- `Component/d3/StatGridColumnHeader/README.md` — заголовок колонки
- `Component/d3/StatGridFooter/README.md` — подвал StatGrid
- `Component/d3/Grid/README.md` — обычный Grid
- `StatGridCtrl.inc` — серверный код `StatSumm`
- `StatGrid.js` — клиентский `D3Api.StatGridCtrl` (сбор сумм,
  подсчёт, отображение)
- `StatGrid.css` — стили `tr.groupsumm td.column_data`

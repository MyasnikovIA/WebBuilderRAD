# Документация `Component/d3/LinksViewer/README.md`

Добавляем файл описания к компоненту. Он не участвует в сборке IDE (не подключается в `index.html`), но служит справкой для разработчиков.

---

## 1. Структура папки после добавления

```
Component/d3/LinksViewer/
    index.js
    README.md              ← новый файл
    images/icon.png
    css/preview.css
    js/                    (пусто)
```

---

## 2. `Component/d3/LinksViewer/README.md`

```markdown
# cmpLinksViewer

Контрол для визуализации графа связей (force-directed layout).
Рендерит `<svg>` с узлами-кружками, дугами-стрелками и подписями.

---

## Расположение

| Файл | Роль |
|---|---|
| `Component/d3/LinksViewer/index.js` | Регистрация компонента в IDE (D3.register) |
| `Component/d3/LinksViewer/css/preview.css` | Стили превью (подключаются в iframe IDE) |
| `Component/d3/LinksViewer/images/icon.png` | Иконка 14×14 для палитры |
| `Component/d3/LinksViewer/js/` | Пусто (зарезервировано под preview.js) |

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `LinksViewerCtrl.inc` | class `LinksViewer extends BaseCtrl` |
| `LinksViewer.js` | `D3Api.LinksViewerCtrl` — построение графа на D3 v3 |
| `LinksViewer.css` | Стили корневого div и SVG |
| `links_shapes.css` | Стили линий, кружков и текста |
| `d3v3.5.6.js` | D3 v3, подгружается асинхронно |

---

## Тег и ID

- **XML-тег:** `cmpLinksViewer`
- **Регистрация в IDE:** `id: 'd3.linksviewer'`
- **Категория:** D3
- **Вид в палитре:** `LinksViewer`

---

## Разметка в рантайме

Серверный код (`LinksViewer::Show()`) генерирует:

```html
<div class="linkviewver-div">
  <svg class="linkviewver-svg"></svg>
</div>
```

Плюс сервер подключает CSS через `SetSysInfo(include_css(...))`:

```
Components/LinksViewer/css/links_shapes.css
Components/LinksViewer/css/LinksViewer.css
```

Клиентский `D3Api.LinksViewerCtrl.init()` асинхронно подгружает `d3v3.5.6.js`. Пока D3 не готов, `isReady = false`, а `setValue` ретраится через `setTimeout(…, 100)`.

После готовности `setValue(array)`:

1. Строит карту узлов из `source`/`target`.
2. Создаёт force-layout с `linkDistance(150)` и `charge(-1200)`.
3. Рендерит:
    - `svg > defs > marker[id=link_type]` — по одной стрелке на каждый уникальный `link_type`;
    - `svg > g > path` — дуги с `marker-end=url(#link_type)` и `class="link link_type"`;
    - `svg > g > circle` — узлы с `r=6`, `class="circle source_type"` (или `target_type`);
    - `svg > g > text` — подписи с `x=8`, `y=".31em"`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `title`

### D3 Base
- `name` — идентификатор контрола
- `enabled` — boolean (в рантайме не используется активно, но обрабатывается BaseCtrl)
- `visible` — boolean
- `hint` — tooltip
- `width`, `height` — размеры (в рантайме задают размер SVG)

### LinksViewer
- **`value`** — тип `code`. JSON-массив объектов, описывающих рёбра графа.

### Events
- `onclick`, `ondblclick`, `onmouseover`, `onmouseout`

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат `value`

Массив объектов. Каждый объект описывает одно направленное ребро:

```json
[
  {
    "source": "Microsoft",
    "target": "Amazon",
    "link_type": "licensing",
    "source_type": "",
    "target_type": ""
  },
  {
    "source": "Samsung",
    "target": "Apple",
    "link_type": "suit",
    "source_type": "",
    "target_type": ""
  }
]
```

| Поле | Обязательное | Назначение |
|---|---|---|
| `source` | да | Имя исходного узла |
| `target` | да | Имя целевого узла |
| `link_type` | нет | CSS-класс линии и ID стрелки. Если пусто — рисуется дефолтная стрелка |
| `source_type` | нет | CSS-класс кружка для `source` |
| `target_type` | нет | CSS-класс кружка для `target` |

**Узлы формируются автоматически** из уникальных значений `source` и `target`. Дубликаты схлопываются.

**Направление:** стрелка идёт от `source` к `target`.

---

## Стилизация

### Линии

Для `link_type = "licensing"`:

```css
/* Стиль самой линии */
path.link.licensing {
  stroke: #3498db;
  stroke-width: 2px;
}

/* Стиль стрелки (только треугольник) */
#licensing path {
  fill: #3498db;
  stroke: #3498db;
}
```

Если `link_type` пустой или не задан — рисуется дефолтный `<path class="link">` с общим стилем `.link` из `links_shapes.css`.

### Узлы

Для `source_type = "person"`:

```css
circle.person {
  fill: #f39c12;
  stroke: #e67e22;
}
```

Если тип не задан — берётся дефолтный `circle { fill: #ccc; stroke: #333; }`.

### Текст

Подписи рендерятся как `<text>` с общим стилем:

```css
text {
  font: 10px sans-serif;
  pointer-events: none;
  text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;
}
```

---

## Примеры использования

### 1. Минимальный XML в `.frm`

```xml
<cmpLinksViewer name="lv" width="600" height="400"/>
```

Пустой `value` → пустой SVG. Реальные данные обычно приходят из `ActionVar` или `setValue`.

### 2. Заполнение через ActionVar

В `.frm`:

```xml
<cmpLinksViewer name="lv" width="600" height="400"/>

<cmpAction name="ACT_LOAD_GRAPH">
  <![CDATA[
    select source, target, link_type
      from v_graph_edges
     where group_id = :groupId
  ]]>
  <cmpActionVar name="groupId" src="groupId" srctype="var"/>
  <cmpActionVar name="lv"      src="lv"      srctype="ctrl" put=""/>
</cmpAction>
```

`Action` вернёт массив объектов, который через `put=""` автоматически уйдёт в `setValue(lv, array)`.

### 3. Через JS

```js
var links = [
  { source: 'Microsoft', target: 'Amazon', link_type: 'licensing' },
  { source: 'Samsung',   target: 'Apple',  link_type: 'suit' }
];
setControlProperty('lv', 'value', links);
```

### 4. Статичный JSON в атрибуте

```xml
<cmpLinksViewer name="lv"
    value='[{"source":"A","target":"B","link_type":"licensing"}]'/>
```

Кавычки экранируются автоматически при сохранении из IDE.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается статичный SVG-скелет:

- Без `value` — демо-граф из 3 узлов (`A`, `B`, `C`) и 3 стрелок по кругу, с меткой `demo` в углу.
- С `value` — узлы берутся из `source`/`target`, дуги — из `link_type`, позиции фиксированные (равномерно по кругу).

Force-layout **не запускается** в IDE — D3 v3 не подключается в iframe редактора. Это сделано сознательно:

1. D3 v3 — ~150 КБ, не нужен для превью.
2. Force-раскладка «плавает» и мешала бы позиционированию компонента на холсте.

Если нужен реальный force-граф в IDE — добавьте `previewJs: ['js/preview.js']` в регистрацию и положите в `js/preview.js` код, который подгрузит `d3v3.5.6.js` и построит граф. Но это выходит за рамки штатной работы.

### Ограничения
- **В дереве** компонент отображается одной строкой (`cmpLinksViewer name=""`). Детей нет — SVG строится динамически.
- **Drag&drop** в компонент не ограничен (`parentOnly` не задан), но обычно `LinksViewer` — листовой контрол, и вкладывать в него что-либо смысла нет.
- **Styles** в инспекторе применяются к корню `cmpLinksViewer` (в рантайме это `div.linkviewver-div`), а не к SVG напрямую. Размеры (`width`, `height`) пробрасываются на preview-узел.

---

## Интеграция с платформой

### Подключение в `index.html`

```html
<script src="Component/d3/LinksViewer/index.js"></script>
```

### Правки в ядре IDE

**`ide/canvas.js` → `CMP_TAGS`:**

```js
'cmplinksviewer': 'cmpLinksViewer',
```

**`ide/app.js` → `CMP_TAGS`:**

```js
'cmplinksviewer': 'cmpLinksViewer',
```

`_injectIdeStyle` и `XML_SELF_CLOSE` не трогаем — компонент видим и контейнерный.

### Связанные файлы на сервере

- `LinksViewerCtrl.inc` — серверный класс
- `LinksViewer.js` — клиентский контрол
- `LinksViewer.css`, `links_shapes.css` — стили
- `d3v3.5.6.js` — D3 v3 (подгружается через `D3Api.include_js`)

---

## Известные ограничения

1. **D3 v3** — устаревшая версия (2016). Апи `d3.layout.force()` отличается от современного `d3-force`. Обновление потребует переписать `setValue` в `LinksViewer.js`.

2. **`setValue` ретраит через `setTimeout(…, 100)`** — если D3 так и не загрузился, ретрай будет повторяться бесконечно. Нет таймаута и нет уведомления об ошибке.

3. **`force.drag`** — в рантайме узлы можно перетаскивать мышью. В IDE это не воспроизводится (превью статично).

4. **Размеры при инициализации** — `width = _dom.clientWidth, height = _dom.clientHeight` читаются в момент `setValue`. Если контейнер ещё не отрисован (например, форма скрыта), размеры будут 0, и граф не появится. Решается вызовом `setValue` после `onShow` формы.

5. **Переключение данных** — при повторном `setValue` старый SVG удаляется (`_dom.removeChild(svg)`), строится заново. Force-layout стартует с нуля, без анимации из предыдущего состояния.

6. **CSS из `links_shapes.css` глобальный** — селекторы `circle`, `text`, `.link` без префикса. Если на форме несколько SVG, стили применяются ко всем. На сервере это решается скоупом через `include_css` в `<head>` документа, но конфликты возможны.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → LinksViewer**.
2. В инспекторе задать `name` (обязательно для `ActionVar`).
3. Задать `width` и `height` (иначе SVG будет 0×0).
4. Заполнить `value` (JSON-массив) — либо вручную, либо через `Action`.
5. При необходимости стилизовать: добавить CSS-классы в `link_type` / `source_type` / `target_type` и определить их стили в форме.
6. Привязать события (`onclick`, `ondblclick`) — если нужна реакция на клик по графу.
```

---

## 3. Замечания по файлу

1. **Не подключается в `index.html`** — `README.md` это справка, её не нужно грузить в браузер.

2. **Структура разделов** повторяет подход, использованный в документации других компонентов (`CheckBox`, `Grid`, `Fetch`):
   - расположение файлов,
   - тег и ID,
   - разметка в рантайме,
   - свойства из инспектора,
   - формат значения,
   - примеры использования,
   - поведение в IDE,
   - интеграция с ядром,
   - известные ограничения.

3. **Примеры кода** — рабочие. Скопированы из реального API `D3Api.LinksViewerCtrl` и серверного `LinksViewerCtrl.inc`. Если в вашей версии есть расхождения (например, другие дефолтные `linkDistance`/`charge`), поправьте.

4. **Раздел «Известные ограничения»** — полезен для новых разработчиков. Ошибки с `setTimeout` и глобальным CSS реально встречаются в проекте, и предупреждение сэкономит время.

5. **Стилизация** — самый полезный раздел для пользователя: показывает, как через `link_type` / `source_type` / `target_type` управлять внешним видом. Без него эти атрибуты выглядят загадочно.

6. **Чек-лист в конце** — короткая шпаргалка. Помогает не забыть про `width`/`height` (частая ошибка — граф не появляется из-за 0×0 контейнера).
# cmpLocate

Служебный контрол для позиционирования записей в связанных DataSet-ах
по иерархической структуре «Master → Detail → SubDetail».

В рантайме не рендерит видимого HTML — только скрытый `<div>`, через
который клиент общается с сервером.

---

## Расположение

| Файл | Роль |
|---|---|
| `Component/d3/Locate/index.js` | Регистрация компонента в IDE (D3.register) |
| `Component/d3/Locate/css/preview.css` | Заглушка стилей превью (в рантайме не используется) |
| `Component/d3/Locate/images/icon.png` | Иконка 14×14 для палитры |
| `Component/d3/Locate/js/` | Пусто (зарезервировано) |

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `LocateCtrl.inc` | class `Locate extends BaseCtrl`, обработчик `ShowXML()` |
| `Locate.js` | `D3Api.LocateCtrl` — отправка запроса и обновление DataSet |

---

## Тег и ID

- **XML-тег:** `cmpLocate`
- **Регистрация в IDE:** `id: 'd3.locate'`
- **Категория:** D3
- **Вид в палитре:** `Locate`
- **Видимость:** невидимый (скрыт в canvas через `_injectIdeStyle`)

---

## Разметка в рантайме

Серверный код (`Locate::Show()`) генерирует:

```html
<div cmptype="Locate"
     name="locate1"
     structure="DS_MAIN;DS_DETAIL:DS_MAIN:pid=id"
     primary="DS_MAIN"
     locate="DS_DETAIL"
     locate_value="42"
     locate_field="id"
     style="display:none"></div>
```

Видимой разметки нет — контрол полностью служебный. Клиентский
`D3Api.LocateCtrl.init(dom)` читает атрибуты и складывает их в
`dom.D3Locate`:

```js
dom.D3Locate = {
  structure:    'DS_MAIN;DS_DETAIL:DS_MAIN:pid=id',
  locate:       'DS_DETAIL',
  locate_field: 'id',
  locate_value: '42',
  primary:      'DS_MAIN'
};
```

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style` — стандартные HTML-атрибуты

### D3 Base
- `name` — идентификатор контрола (обязателен: по нему вызывается `locate()`)

### Locate
- **`structure`** — тип `code`. Строка, описывающая структуру зависимостей DataSet-ов.
- **`primary`** — имя основного DataSet, который обновляется.
- **`locate`** — имя DataSet, который надо позиционировать.
- **`locate_value`** — значение для позиционирования.
- **`locate_field`** — поле в `locate`, по которому ищется запись.

### Events
Пусто — Locate не инициализирует клиентских событий.

### Styles
Пусто — служебный контрол, стили не имеют смысла.

---

## Формат `structure`

Строка из блоков, разделённых `;`. Каждый блок описывает связь
«родитель → потомок»:

```
Master[:Detail[:var1[=detail_field1]=master_field1[:var2=field2…]]]
```

| Элемент | Назначение |
|---|---|
| `Master` | Имя основного (родительского) DataSet |
| `Detail` | Имя подчинённого DataSet |
| `var` | Имя переменной в SQL-запросе (`:var`) |
| `detail_field` | Поле в Detail, значение которого передаётся в запрос |
| `master_field` | Поле в Master, с которым сравнивается `detail_field` |

**Пример 1.** Простая иерархия из двух DataSet-ов:

```
DS_MAIN;DS_DETAIL:DS_MAIN:pid=id
```

Расшифровка:
- `DS_MAIN` — корень.
- `DS_DETAIL` — потомок `DS_MAIN`.
- `pid` — переменная в SQL-запросе `DS_DETAIL`.
- `id` — поле, значение которого берётся из `DS_MAIN` и передаётся в `:pid`.

**Пример 2.** Три уровня:

```
DS1;DS2:DS1:pid=id;DS3:DS2:pid=id:pid2=uid
```

- `DS1` — корень.
- `DS2` — потомок `DS1`, связь по `pid = id`.
- `DS3` — потомок `DS2`, две связи: `pid = id` и `pid2 = uid`.

---

## Логика работы

Клиент (`D3Api.LocateCtrl.locate`) выполняет:

```js
this.locate = function(dom) {
    dom.D3Form.beginRequest();
    dom.D3Form.sendRequest(
        D3Api.getProperty(dom, 'name'),
        { type: 'Locate', params: dom.D3Locate }
    );
    dom.D3Form.refreshDataSet(
        dom.D3Locate.primary,
        undefined, undefined, false, true, true
    );
    dom.D3Form.endRequest(true);
};
```

Сервер в `ShowXML()`:

1. Разбирает `structure` (`;` — блоки, `:` — поля внутри блока).
2. Строит карту `LOCATE_STRUCTURE`:
   ```php
   $this->LOCATE_STRUCTURE[$name] = [
       'parent'  => $parent_name,
       'fields'  => ['var1=field1=master_field1', …]
   ];
   ```
3. Устанавливает для целевого `locate` значения `locate_field`, `locate_value`.
4. Вычисляет порядок прохода (`pass_order`) от `locate` вверх по родителям.
5. Складывает всё в глобальную `$GLOBALS['DataSetLocateStructure']`.

Клиент после ответа вызывает `refreshDataSet(primary)`. Сам DataSet
при обновлении использует `LOCATE_STRUCTURE` для позиционирования
записей по всей иерархии.

---

## Примеры использования

### 1. Простая связь Master → Detail

Форма с двумя DataSet-ами:

```xml
<cmpDataSet name="DS_MAIN" activateoncreate="true">
  <![CDATA[ select id, name from t_main ]]>
</cmpDataSet>

<cmpDataSet name="DS_DETAIL" activateoncreate="false">
  <![CDATA[ select id, pid, name from t_detail where pid = :pid ]]>
  <cmpDataSetVar name="pid" src="pid" srctype="var"/>
</cmpDataSet>

<cmpLocate name="locate_detail"
           structure="DS_MAIN;DS_DETAIL:DS_MAIN:pid=id"
           primary="DS_MAIN"
           locate="DS_DETAIL"
           locate_field="id"
           locate_value=""/>
```

Затем в действии/скрипте:

```js
setControlProperty('locate_detail', 'locate_value', 42);
D3Api.LocateCtrl.locate(getControl('locate_detail'));
```

Сервер разберёт структуру, найдёт запись `id=42` в `DS_DETAIL`,
по `pid` поднимется до `DS_MAIN` и спозиционирует его на нужной записи.

### 2. Три уровня

```xml
<cmpLocate name="locate_sub"
           structure="DS1;DS2:DS1:pid=id;DS3:DS2:pid=id:pid2=uid"
           primary="DS1"
           locate="DS3"
           locate_field="id"
           locate_value="777"/>
```

Сервер вычислит порядок `DS3 → DS2 → DS1` и последовательно
спозиционирует все три DataSet-а.

### 3. Связь с внешним URL

Если форма открывается по ссылке с `?id=777`, можно передать
значение через `setVar` и вызвать `locate()` в `oncreate`:

```xml
<cmpForm oncreate="Form.onLoad()">
  <cmpScript>
    <![CDATA[
    Form.onLoad = function() {
      setControlProperty('locate_detail', 'locate_value', getVar('id'));
      D3Api.LocateCtrl.locate(getControl('locate_detail'));
    }
    ]]>
  </cmpScript>
  <cmpLocate name="locate_detail"
             structure="DS_MAIN;DS_DETAIL:DS_MAIN:pid=id"
             primary="DS_MAIN"
             locate="DS_DETAIL"
             locate_field="id"
             locate_value=""/>
</cmpForm>
```

---

## Поведение в IDE

Компонент **невидимый**. После вставки на холст ничего не появится —
это правильно, потому что в рантайме он тоже невидим.

### В дереве

Отображается одной строкой:

```
cmpLocate name="" structure="" primary="" locate="" locate_value="" locate_field=""
```

### В инспекторе

Все атрибуты доступны для редактирования. `structure` — тип `code`,
открывается модальный редактор с подсветкой.

### Ограничения

- **Drag&drop** в компонент не ограничен, но вкладывать в него
  что-либо смысла нет — он не рендерит детей.
- **Events** и **Styles** пустые — служебный контрол.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

```html
<script src="Component/d3/Locate/index.js"></script>
```

### Правки в `ide/canvas.js`

**`_injectIdeStyle` — скрыть компонент в canvas:**

```js
'cmpaction, cmpdataset, cmpscript, cmpmask, cmpbroker, ' +
'cmpcomment, cmpcompleter, cmpdependences, cmpfetch, ' +
'cmpfetchvar, cmplocate {' +
'  display: none !important; visibility: hidden !important;' +
'  pointer-events: none !important; user-select: none !important;' +
'}'
```

**`CMP_TAGS` — восстановление camelCase:**

```js
'cmplocate': 'cmpLocate',
```

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmplocate': 'cmpLocate',
```

### `XML_SELF_CLOSE` и `CDATA_CONTAINERS`

Не трогаем — Locate не самозакрывающийся и не содержит CDATA.

---

## Известные ограничения

1. **Нет валидации `structure`** — если строка синтаксически
   некорректна, сервер молча вернётся из `ShowXML()`. В IDE
   атрибут можно сохранить с любой строкой, ошибка проявится только
   в рантайме.

2. **`locate_value` в XML часто пустое** — заполняется через
   `setControlProperty(...)` перед вызовом `locate()`. Если задать
   значение прямо в атрибуте, оно будет проставлено в `D3Locate`
   при `init()`, но реально используется только при явном вызове.

3. **Не работает без `primary`** — если `primary` пустой,
   `refreshDataSet(undefined)` ничего не сделает. Проверяйте, что
   `primary` задан.

4. **Только направленный проход** — `ShowXML()` строит `pass_order`
   от `locate` вверх по родителям. Обратное позиционирование
   (Master → Detail) выполняется на уровне DataSet-ов при
   `refreshDataSet`.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → Locate**.
2. В инспекторе задать `name` (обязательно).
3. Заполнить `structure` — как минимум один блок `Master:Detail:var=field`.
4. Задать `primary` — DataSet, который будет обновляться.
5. Задать `locate` — DataSet для позиционирования.
6. Задать `locate_field` — поле поиска.
7. Оставить `locate_value` пустым — заполнится в рантайме.
8. В нужном месте формы вызвать:
   ```js
   setControlProperty('<name>', 'locate_value', <id>);
   D3Api.LocateCtrl.locate(getControl('<name>'));
   ```

---

## См. также

- `Component/d3/DataSet/README.md` — устройство DataSet-ов, которые позиционирует Locate
- `Component/d3/Action/README.md` — Action, часто вызывающий locate после сохранения
- `LocateCtrl.inc` — серверный код разбора `structure` и `ShowXML()`
- `Locate.js` — клиентский контрол, единственный метод `locate(dom)`
```
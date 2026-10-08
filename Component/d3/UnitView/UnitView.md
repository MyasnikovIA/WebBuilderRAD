# cmpUnitView

Универсальный контрол отображения раздела. В рантайме сервер на
этапе `Show()` читает настройки метода показа из БД и разворачивается
в **Grid** / **Tree** / **StatGrid** с автоматически сгенерированными
`DataSet`, `Action`-ами, `PopupMenu`, `Script`, `Filter`,
`CustomFilter`, `RepeaterStyler` и, при необходимости, `SubForm`.

Пользовательские дети в XML **не используются** (`supresschild = true`):
всё содержимое — колонки, элементы ячеек, агрегаты, пункты меню,
скрипты — генерируется сервером по метаданным.

Компонент — «одна строка в .frm → целый экран с гридом и логикой».
Это ключевой строительный блок для типовых экранов WebBuilder RAD.

---

## Расположение

```
Component/d3/UnitView/
    index.js               ← регистрация D3.register
    README.md              ← этот файл
    images/icon.png        ← иконка палитры (14×14)
    css/preview.css        ← стили превью
    js/                    ← (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `UnitViewCtrl.inc` | `class UnitViewBase extends BaseCtrl` + `class UnitView extends UnitViewBase` (в `UnitViewPDO.inc`) |
| `UnitViewPDO.inc` | Итоговый класс `UnitView`, подключается по типу БД |
| `UnitView.js` | `D3Api.UnitViewCtrl`, `D3Api.UnitViewBaseCtrl` — клиентские контролы |
| `UnitView.css` | Стили `.unitView`, `.unitViewPopup` |

**Дополнительные классы в том же файле:**

| Класс | Роль |
|---|---|
| `UnitViewDataSetBeforeSelect` | `<cmpBeforeSelect>` внутри сгенерированного `DataSet` |
| `UnitViewDataSetMoreSelect` | `<cmpMoreSelect>` |
| `UnitViewDataSetMoreFrom` | `<cmpMoreFrom>` |
| `UnitViewDataSetMoreWhere` | `<cmpMoreWhere>` |
| `UnitViewDataSetVar` | `<cmpDataSetVar>` |

Все — `BaseNoName`, используются как псевдо-теги внутри
`UnitViewDataSetXxx`-массивов.

---

## Тег и ID

- **XML-тег:** `cmpUnitView`
- **Регистрация в IDE:** `id: 'd3.unitview'`
- **Категория:** D3
- **Вид в палитре:** `UnitView`
- **Видимость:** видимый (в canvas отображается скелет сетки)
- **Самозакрывающийся:** нет (в рантайме разворачивается в `Grid`/`Tree`/`StatGrid`)
- **Содержит CDATA:** нет (собственного CDATA-контента не имеет)
- **Дочерние компоненты:** нет (`supresschild = true`)

---

## Разметка в рантайме

Разворачивается в один из трёх вариантов в зависимости от
`show_method` из БД.

### Grid (по умолчанию)

```html
<cmpDataSet name="DS_<unit>_<method>" ...>
  <cmpDataSetVar .../>
</cmpDataSet>

<cmpAction name="AutoDelete<unit><method>"> ... </cmpAction>
<cmpAction name="<unit>AutoMove">            ... </cmpAction>
<cmpAction name="<name>_popup_rights">       ... </cmpAction>

<cmpScript><![CDATA[ ... Form.<name>_add_script ... ]]></cmpScript>

<cmpPopupMenu name="<name>_popup" popupobject="<name>"
              oncreate="..." onpopup="Form.checkPopupRights_<name>(show);">
    <cmpPopupItem name="refresh" caption="Обновить" .../>
    <cmpPopupItem caption="-"/>
    <cmpPopupItem name="<name>_popup_add"      caption="Добавить"      .../>
    <cmpPopupItem name="<name>_popup_view"     caption="Просмотр"      .../>
    <cmpPopupItem name="<name>_popup_copy"     caption="Копировать"    .../>
    <cmpPopupItem name="<name>_popup_edit"     caption="Редактировать" .../>
    <cmpPopupItem name="<name>_popup_move"     caption="Переместить"   .../>
    <cmpPopupItem name="<name>_popup_del"      caption="Удалить"       .../>
    <cmpPopupItem name="service" caption="Сервис">
        <cmpPopupItem name="<name>_popup_import" caption="Выгрузить" .../>
    </cmpPopupItem>
</cmpPopupMenu>

<cmpGrid name="<name>" dataset="DS_<unit>_<method>"
         keyfield="…" popupmenu="<name>_popup"
         settings_method="D3Api.UnitViewCtrl.showSettings(<id>)"
         width="100%" height="100%">
    <cmpColumn name="<name>_COLUMN_<field>" caption="…" field="…"
               filter="…" sort="…" width="…">
        <cmpCheckBox .../>  <!-- элементы ячейки: из v_smc_elements4bld -->
    </cmpColumn>
    ...
    <cmpGridFooter>
        <cmpRange dataset="DS_<unit>_<method>" default_amount="10"/>
    </cmpGridFooter>
</cmpGrid>
```

### Tree (`show_method = 1`, `3`, `4`)

Тот же набор, но вместо `Grid` — `<cmpTree>` с `<cmpTreeColumn>`,
`keyfield`, `parentfield`, `parentvar`, `childsfield`,
`returnfield`, `selectlist`. При `show_method = 3` дополнительно
`fulldata="true"`.

### StatGrid (`show_method = 2`)

`<cmpStatGrid>` с `<cmpStatGridColumn>`, каждая колонка содержит
`<cmpStatSumm>` (агрегаты из `v_smc_aggregations4bld`). Скрытые
колонки всё равно создаются (`visible="false"`) — в них живут агрегаты.

### Дополнительно, независимо от типа

- `<cmpFilter>` — если в `Metainf/ShowMethods/<unit>_<method>.json`
  есть секция `filter`;
- `<cmpRepeaterStyler>` — если есть секция `style`;
- `<cmpCustomFilter>` — если есть секция `custom_filter`;
- `<cmpSubForm path="…">` — если `popup_type = 0/1` и задан
  `popup_form` (замещающее меню или встроенная форма).

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name` — имя контрола (используется в `DS_<name>`, `<name>_popup`,
  `Form.<name>_*_script`; если не задано — сервер генерирует из
  `unit + '_' + show_method`)
- `enabled`, `visible`, `hint`, `width`, `height`

### UnitView
- **`unit`** — код раздела. Если не задан, берётся из `$_GET['unit']`
- **`show_method`** — код метода показа. Если не задан —
  `$_GET['show_method']`. Из БД (`core.v_show_method4bld`) читается
  конфигурация
- **`default_show_method`** — значение по умолчанию для
  `show_method` в дочерних вызовах (по умолчанию `'default'`)
- **`parent`** — имя parent-контрола (для detail-связей)
- **`calc_height`** — CSS-выражение для расчёта высоты
  (`parent-#.filter_window#-10` и подобные)

### Display
- **`excel`** — `true` — включить выгрузку в Excel (у каждой колонки
  генерируется `excelfield`)
- **`show_hint`** — `true` — показывать подсказки колонок (`data="hint:…"`)
- **`show_range`** — `true` — показывать `cmpRange` в футере
- **`line_break`** — `true` — `white_space_nowrap="true"` (запрет
  переноса в ячейках)
- **`filter_expand_def`** — `true` — раскрыть фильтр по умолчанию
  (`showfilter="true"`)

### Selection
- **`selectlist`** — `true` — показать чекбоксы слева от записей
  (генерируется `selectlist="<primary>,<return>"`)
- **`select_childs`** — `true` (при `selectlist`) — выбирать
  дочерние записи у Tree

### Range
- **`range_type`** — тип Range (0 — с номерами, 1 — без)
- **`range_show_count`** — показывать счётчик записей
- **`range_selectlist`** — привязать Range к `selectlist`
- **`range_count`** — количество записей по умолчанию (по умолчанию `10`)

### Catalog
- **`catalog_unitcode`** — код юнита-каталога (для работы с каталогами)
- **`default_catalog`** — каталог по умолчанию
- **`cid_object`** — контрол, содержащий текущий CID
  (для проверки прав). По умолчанию — имя самого `UnitView`, если
  `unit == 'catalogs'`
- **`is_container_main`** — `true` — открывать формы в `D3Api.MainDom`
  (а не в родительском контейнере)
- **`detailcomponents`** — список детальных компонентов (только
  для каталогов — загрузка/выгрузка)
- **`detaildataset`** — `';'`-список датасетов, которые надо
  обновлять при наличии мастер-детейл-связи

### List
- **`list`** — `true` — показать кнопку «Список» в popup-меню
  (для Tree)
- **`listunit`** — юнит для list-режима
- **`listmethod`** — метод показа для list-режима
- **`listctrl`** — контрол для list-режима

### Popup Menu
- **`popupmenu`** — имя внешнего `PopupMenu` (используется вместо
  автоматически сгенерированного)
- **`genpopupmenu`** — `true` (по умолчанию) — генерировать `PopupMenu`
- **`show_log_popup`** — `true` — добавлять пункт «Журнал изменений»,
  если у пользователя есть права на юнит `log`
- **`use_list_btn`** — имя функции для пункта «Список», переключающей
  переменную `<name>s_lftf`

### Filters
- **`custom_filter`** — JSON `CustomFilter` (в некоторых сценариях)
- **`admissible_filter`** — `';'`-строка с параметрами допустимого
  фильтра. Парсится как массив, где элемент `[5]` — имя переменной

### Scripts
- **`edit_script`** — JS-код кнопки «Редактировать». `'auto'` —
  сгенерировать автоматически (`openForm('UniversalEditForm/…')`),
  `'none'` — отключить, иначе — inline-код
- **`view_script`** — код кнопки «Просмотр». Аналогично
- **`add_script`** — код кнопки «Добавить». `'auto'` — сгенерировать
- **`copy_script`** — код кнопки «Копировать»
- **`del_script`** — код кнопки «Удалить». `'auto'` — сгенерировать
  (использует `AutoDelete<unit><method>`)
- **`move_script`** — код кнопки «Переместить». `'auto'` — сгенерировать
  (использует `<unit>AutoMove`)
- **`report_script`** — код кнопки «Отчёт»

### Events
- **`onchange`** — inline-JS, вызывается при смене выделения. Если
  задан `detaildataset`, к нему добавляется вызов
  `D3Api.RefreshDataSets(...)`
- **`onpopup`** — inline-JS, вызывается перед показом PopupMenu

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Примеры использования

### 1. Простой экран со списком раздела

```xml
<cmpUnitView name="UH_HH" unit="HH" show_method="default"/>
```

Сервер сгенерирует `DS_HH_default`, `cmpGrid` с колонками из
`v_show_method_cols4bld` для метода `default`, `AutoDelete` и
`PopupMenu` с пунктами «Обновить / Добавить / Редактировать / …».

### 2. Экран с выгрузкой в Excel и чекбоксами

```xml
<cmpUnitView name="UH_HH" unit="HH" show_method="list"
             excel="true"
             selectlist="true"
             show_range="true"
             range_count="50"/>
```

### 3. Дерево с раскрытыми уровнями

```xml
<cmpUnitView name="UH_TREE" unit="TREE_UNIT" show_method="tree"
             height="100%"
             selectlist="true"
             select_childs="true"
             list="true"/>
```

Если серверный метод `tree` имеет `show_method = 3`, генерируется
`cmpTree` с `fulldata="true"`.

### 4. Внутри detail-связи

```xml
<cmpUnitView name="UH_HH_DETAIL"
             unit="HH_DETAIL"
             show_method="default"
             parent="UH_HH"
             detaildataset="DS_HH_DETAIL;DS_ATTACH"/>
```

При смене записи в `UH_HH` сервер сгенерирует `onchange`, обновляющий
`DS_HH_DETAIL` и `DS_ATTACH` через `D3Api.RefreshDataSets`.

### 5. С внешним PopupMenu

```xml
<cmpUnitView name="UH_HH" unit="HH" show_method="default"
             popupmenu="ctxGridExtra"
             genpopupmenu="false"/>
```

Сервер не создаст свой `PopupMenu`, а привяжет контрол к внешнему
`ctxGridExtra`.

### 6. Отключение автоскриптов

```xml
<cmpUnitView name="UH_VIEWONLY" unit="HH" show_method="view"
             add_script="none"
             edit_script="none"
             copy_script="none"
             del_script="none"
             move_script="none"/>
```

Пункты меню «Добавить / Редактировать / …» не генерируются.

### 7. Кастомные скрипты

```xml
<cmpUnitView name="UH_HH" unit="HH" show_method="default"
             edit_script="Form.customEdit();"
             add_script="Form.customAdd();"/>
```

Сервер подставит указанный код как `onclick` соответствующих
пунктов `PopupMenu`.

### 8. Отключение журнала изменений

```xml
<cmpUnitView name="UH_HH" unit="HH" show_method="default"
             show_log_popup="false"/>
```

Пункт «Журнал изменений записи» не будет добавлен, даже если у
пользователя есть права.

### 9. Каталог

```xml
<cmpUnitView name="UH_CATALOGS" unit="catalogs"
             show_method="default"
             catalog_unitcode="HH"
             cid_object="UH_CATALOGS"/>
```

При `unit == 'catalogs'` сервер по умолчанию использует
`cid_object = componentname`. CID-контрол передаётся в Action прав
`<name>_popup_rights`.

### 10. Кастомный inline-onchange

```xml
<cmpUnitView name="UH_HH" unit="HH" show_method="default"
             onchange="Form.onRowChanged(getControlProperty(this, 'value'));"/>
```

Сервер добавит этот код к сгенерированному обработчику `onchange`
(после автоматических вызовов для `detaildataset`).

---

## Логика работы (серверная)

### `Show()`

1. Извлекает `unit` и `show_method` из атрибутов или `$_GET`.
2. Формирует `$dsname` — по умолчанию `DS_<unit>_<show_method>`,
   либо берёт из `cont_attrs['dataset']`.
3. Формирует `$componentname` — по умолчанию `unit + '_' + show_method`,
   либо `_name`.
4. Читает `sm_invisible_menu_items` из `core.f_options8get` — режим
   скрытия/блокировки недоступных пунктов меню.
5. Читает строку из `core.v_show_method4bld` по
   `(code = show_method, unitcode = unit)`. Если записи нет —
   выводит «Метод показа не определен».
6. Читает JSON из `Metainf/ShowMethods/<unit>_<method>.json` —
   если есть, парсит `filter` / `style` / `custom_filter` /
   `window_function` / `format` и генерирует соответствующие
   компоненты.
7. Строит `<cmpDataSet>`:
    - обычный или с `activateoncreate="false"`;
    - с `<cmpBeforeSelect>` / `<cmpMoreSelect>` / `<cmpMoreFrom>` /
      `<cmpMoreWhere>` из соответствующих массивов;
    - с `<cmpDataSetVar>` для `lpu`, `version`, `admissible_filter`.
8. Читает строки колонок из `core.v_show_method_cols4bld` по
   `pid = row['id']`, сортирует по `cols_order`.
9. Для каждой видимой колонки:
    - выравнивание (`gridalign` → `left/center/right`);
    - параметры фильтра (`filter` / `filter_field` / `filter_upper` /
      `like` / `condition` / `filterkind` / `fdefault` / `fcontent` /
      `funit` / `fmethod` / `fcomposition`);
    - сортировка (`sort` / `sorting`);
    - Excel (`excelfield` при `excel = true`);
    - подсказка (`data="hint:…"`);
    - группировка (`group` / `grouporder`);
    - окно-функция (`wf` / `wf_field` из JSON);
    - формат (`format` из JSON);
    - ширина (`gridlen`).
10. Для колонок с `is_coded` — читает элементы ячеек из
    `core.v_smc_elements4bld`:
    - `CheckBox` → `<cmpCheckBox valuechecked="1" valueunchecked="0" …>`;
    - `ImageLink` → `<cmpImage …>` с иконкой из `~CmpPopupMenu/Icons/…`;
    - прочие типы → соответствующий компонент;
    - `File` (при `ef_fillmethod = 4` или `5`).
11. Для `show_method = 2` — читает агрегаты из
    `core.v_smc_aggregations4bld` и генерирует `<cmpStatSumm>`.
12. Запоминает поля разметки:
    - `is_primary` — главный ключ;
    - `is_parent` — ключ мастер-таблицы;
    - `is_hierarhy` — поле иерархии;
    - `is_haschild` — поле «есть потомки»;
    - `is_return` — поле результата.
13. Формирует `<cmpGrid>` / `<cmpTree>` / `<cmpStatGrid>` c
    атрибутами (`keyfield`, `parentfield`, `childsfield`,
    `returnfield`, `selectlist`, `excel`, `width`, `height`,
    `popupmenu`, `settings_method`, `showfilter`, `caption`, …).
14. При `del_script = 'auto'` и найденном `is_primary` — генерирует
    `<cmpAction name="AutoDelete<unit><method>">`.
15. При `move_script = 'auto'` — генерирует
    `<cmpAction name="<unit>AutoMove">` с логикой `move` или
    `move_out`.
16. Формирует PopupMenu (если `has_popupMenu`):
    - пункт `refresh`;
    - разделитель;
    - пункты по `add_script` / `view_script` / `copy_script` /
      `edit_script` / `move_script` / `del_script`
      (только если соответствующий `form_xxx` != `'none'`);
    - опционально — пункт «Список» (при `use_list_btn`);
    - опционально — «Сервис → Выгрузить» (если есть EI-схемы);
    - опционально — «Журнал изменений записи».
17. Генерирует `Action <name>_popup_rights` — SQL для проверки прав
    пользователя (`f_urprivs8get_standart_privs` /
    `f_urprivs8get_catalog_privs`).
18. Генерирует `<cmpScript>` с `Form.<name>_add_script`,
    `_edit_script`, `_view_script`, `_copy_script`, `_del_script`,
    `_move_script`, `_add_script_root`,
    `Form.checkPopupRights_<name>`, `Form.disableOnEmpty_<name>`,
    `Form._setStateExistsControl`.
19. При `popup_type = 1` (замещающее) — вместо PopupMenu вставляет
    `<cmpSubForm path="<popup_form>"/>`.
20. При `popup_type = 0` и `popup_form` != `'none'` — добавляет
    `<cmpSubForm>` для встроенной формы.
21. Оборачивает всё в `<div cmptype="Base" oncreate="…">`.
22. Возвращает HTML родителю через `SetInnerText` или печатает.

### `prepareView()`

Hook — переопределяется в потомках (например, в кастомном
`UnitView` конкретного раздела) для добавления собственной разметки
до основного блока.

---

## Клиентский контрол `D3Api.UnitViewCtrl`

Единственный публичный метод:

```js
D3Api.UnitViewCtrl.showSettings(showMethodId);
```

Открывает форму `System/composition` с параметрами:
- `request.unit = 'show_method_cols'`
- `request.composition = 'settings'`
- `request.parent_var = 'METHOD_ID'`
- `vars.METHOD_ID = showMethodId`

Используется атрибутом `settings_method` (генерируется сервером):
```html
settings_method="D3Api.UnitViewCtrl.showSettings(<id>)"
```

Вызывается, например, двойным кликом по заголовку грида.

Кроме `UnitViewCtrl`, файл `UnitView.js` регистрирует:
- `D3Api.ShowMethodSettingsCtrl` — контрол для формы настроек
  метода показа; в `init()` удаляет себя, если
  `SHOWMETPRIV != 1` (нет прав на настройку метода показа).

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается «скелет» сетки:

```
┌──────────────────────────────────────────────┐
│ ▦ UnitView (HH.default)              [Grid]  │
├──────────────────────────────────────────────┤
│ Колонка 1 │ Колонка 2 │ Колонка 3 │ Колонка 4│
├───────────┼───────────┼───────────┼──────────┤
│           │           │           │          │
│           │           │           │          │
│           │           │           │          │
│           │           │           │          │
├──────────────────────────────────────────────┤
│ [DataSet: DS_HH_default] [Action: auto]      │
│ [PopupMenu] [AutoMenu] [Range] [Excel]       │
└──────────────────────────────────────────────┘
```

- **Шапка** — `▦ UnitView (unit.method) [Grid|Tree|StatGrid]`.
  Тип вычисляется эвристически из атрибута `show_method`:
  `1/3/4` → Tree, `2` → StatGrid, иначе → Grid.
- **Таблица** — статический скелет 4×4 с placeholder-заголовками.
  Реальный список колонок недоступен без БД.
- **Футер** — бейджи сгенерированных сущностей, определяемые по
  атрибутам: `DataSet: …`, `Action: auto`, `PopupMenu`,
  `AutoMenu`, `Range`, `Excel`, `SelectList`.

### В дереве

```
cmpUnitView name="UH_HH" unit="HH" show_method="default"
cmpUnitView name="UH_TREE" unit="TREE_UNIT" show_method="tree"
  width="100%" height="100%" selectlist="true"
```

Дочерних компонентов нет — всё генерирует сервер (`supresschild`).

### В инспекторе

8 групп свойств:

| Группа | Ключевые поля |
|---|---|
| HTML attributes | `id`, `class`, `style` |
| D3 Base | `name`, `enabled`, `visible`, `hint`, `width`, `height` |
| UnitView | `unit`, `show_method`, `default_show_method`, `parent`, `calc_height` |
| Display | `excel`, `show_hint`, `show_range`, `line_break`, `filter_expand_def` |
| Selection | `selectlist`, `select_childs` |
| Range | `range_type`, `range_show_count`, `range_selectlist`, `range_count` |
| Catalog | `catalog_unitcode`, `default_catalog`, `cid_object`, `is_container_main`, `detailcomponents`, `detaildataset` |
| List | `list`, `listunit`, `listmethod`, `listctrl` |
| Popup Menu | `popupmenu`, `genpopupmenu`, `show_log_popup`, `use_list_btn` |
| Filters | `custom_filter`, `admissible_filter` |
| Scripts | `edit_script`, `view_script`, `add_script`, `copy_script`, `del_script`, `move_script`, `report_script` |

Вкладка **Events**: `onchange`, `onpopup`.
Вкладка **Styles**: полный набор CSS-свойств.

### Ограничения IDE-превью

1. **Реальный тип (Grid/Tree/StatGrid) неизвестен** — определяется
   сервером по методу показа из БД.
2. **Колонки не читаются** — нет доступа к `v_show_method_cols4bld`.
3. **Сгенерированные сущности (DataSet, Action, PopupMenu, Script)
   не отображаются** в дереве и canvas — о них напоминает только
   футер.
4. **`settings_method`** — генерируется сервером, в IDE недоступен;
   кнопка открытия настроек появится только в рантайме.
5. **JSON-настройки (`Metainf/ShowMethods/<unit>_<method>.json`)**
   — серверные, IDE их не читает.
6. **`supresschild = true`** — если пользователь попробует вложить
   что-то внутрь, сервер проигнорирует; IDE отрисует это поверх
   скелета (может запутать).

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 form-контейнеры**:

```html
<script src="Component/d3/UnitProps/index.js"></script>
<script src="Component/d3/UnitView/index.js"></script>
```

Порядок не критичен.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpunitview': 'cmpUnitView',
```

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpunitview': 'cmpUnitView',
```

### Что НЕ трогаем

| Словарь | Причина |
|---|---|
| `XML_SELF_CLOSE` | Контейнер, пустое тело допустимо (`<cmpUnitView></cmpUnitView>`) |
| `_injectIdeStyle` | Видимый |
| `CDATA_CONTAINERS` | Нет собственного CDATA-контента |
| `PARENT_ONLY` | Ограничений на родителя нет |

---

## Известные ограничения

1. **`supresschild = true`** — компонент «листовой» по своей природе.
   Дочерние узлы в XML игнорируются сервером. Все колонки, скрипты,
   меню генерируются по БД.

2. **Метод показа обязателен.** Если в `core.v_show_method4bld` нет
   записи для пары `(unit, show_method)`, сервер выведет «Метод
   показа „X" раздела „Y" не определен» и пустой контрол.

3. **`name` опционален.** Если не задан, сервер формирует из
   `unit + '_' + show_method`. Тогда все генерируемые скрипты и
   PopupMenu используют это сгенерированное имя.

4. **`show_method` и `unit` могут браться из `$_GET`.** Если в
   `.frm` не заданы явно, сервер ищет их в параметрах запроса.

5. **`popup_type = 1`** — замещающее меню: вместо стандартного
   PopupMenu подключается `<cmpSubForm path="<popup_form>">`.
   Генерация прав и скриптов `Form.checkPopupRights_<name>`
   отключается.

6. **`popup_type = 0`** — стандартное меню + встроенная форма
   `<cmpSubForm>`.

7. **AutoDelete / AutoMove** — генерируются только при
   `del_script = 'auto'` / `move_script = 'auto'`. Имена:
   `AutoDelete<unit><show_method>` и `<unit>AutoMove`. В рантайме
   вызываются через `executeAction(name)`.

8. **`<name>_popup_rights`** — Action с SQL для проверки прав
   пользователя. Вызывается один раз (или при смене `cid`) в
   `Form.checkPopupRights_<name>` перед показом меню. Проверяет
   `_can_add`, `_can_upd`, `_can_del`, `_can_move` и
   `_setStateExistsControl` для соответствующих пунктов.

9. **`detaildataset`** — только через автоматический `onchange`.
   Если пользователь задаёт свой `onchange`, автоматический вызов
   `D3Api.RefreshDataSets` добавляется к нему через `;`.

10. **`Metainf/ShowMethods/<unit>_<method>.json`** — читается на
    сервере с диска; секции `filter`, `style`, `custom_filter`
    разворачиваются в отдельные компоненты. Секции `window_function`
    и `format` используются при построении колонок.

11. **`cid_object`** — только для `unit == 'catalogs'` заполняется
    автоматически; для других — надо задавать вручную, если
    планируется проверка прав по CID.

12. **`ShowMethodSettingsCtrl`** — удаляет себя в `init()`, если
    у пользователя нет прав (`SHOWMETPRIV != 1`). В дереве и canvas
    IDE компонент виден, но в рантайме — самоудаляется.

13. **`action="auto"` для `edit_script`** — если `form_upd = 'none'`
    и `view_script = 'auto'`, генерируется отдельный `_view_script`
    (просмотр без кнопки OK).

14. **Клиентские контролы `D3Api.UnitViewCtrl` / `UnitViewBaseCtrl`**
    публикуют минимум методов — реальная логика в
    `cmpGrid` / `cmpTree` / `cmpStatGrid`, генерируемых сервером.

---

## Чек-лист добавления нового экземпляра

1. Палитра **D3 → UnitView**.
2. В инспекторе задать:
    - `name` — имя контрола (опционально);
    - `unit` — код раздела (обязателен);
    - `show_method` — код метода показа (обязателен);
    - `default_show_method` — на случай fallback;
    - `width` / `height` — размеры (по умолчанию `100%`);
    - `parent` — если внутри detail-связи;
    - `excel`, `show_range`, `selectlist`, `select_childs`,
      `line_break`, `filter_expand_def` — по необходимости;
    - `edit_script`, `add_script`, `copy_script`, `del_script`,
      `move_script`, `view_script`, `report_script` — `'auto'`
      для генерации, `'none'` для отключения, иначе — JS-код;
    - `popupmenu` — имя внешнего `PopupMenu` (если не генерировать свой);
    - `genpopupmenu="false"` — если совсем без PopupMenu;
    - `cid_object`, `catalog_unitcode` — для каталогов;
    - `custom_filter`, `admissible_filter` — при необходимости.
3. Вкладка **Events** — `onchange`, `onpopup` (inline JS).
4. Вкладка **Styles** — при необходимости.
5. Убедиться, что в БД есть запись в `core.v_show_method4bld` для
   пары `(unit, show_method)`.
6. Проверить в canvas: скелет сетки с правильной подписью `unit.method`.
7. Сохранить и убедиться, что XML содержит один самодостаточный
   тег `<cmpUnitView …></cmpUnitView>` без вложенных узлов.
8. Открыть в рантайме: должен появиться реальный Grid/Tree/StatGrid
   с колонками, PopupMenu и рабочими кнопками.

---

## См. также

- `Component/d3/Grid/README.md` — основной режим (show_method вне 1–4)
- `Component/d3/Tree/README.md` — режимы 1, 3, 4
- `Component/d3/StatGrid/README.md` — режим 2
- `Component/d3/DataSet/README.md` — `DS_<unit>_<method>`
- `Component/d3/DataSetVar/README.md` — `lpu` / `version` / `admissible_filter`
- `Component/d3/Action/README.md` — `AutoDelete…`, `…AutoMove`, `…_popup_rights`
- `Component/d3/PopupMenu/README.md` — `<name>_popup`
- `Component/d3/PopupItem/README.md` — пункты меню
- `Component/d3/Script/README.md` — `Form.<name>_*_script`
- `Component/d3/Filter/README.md` — из JSON-секции `filter`
- `Component/d3/CustomFilter/README.md` — из JSON-секции `custom_filter`
- `Component/d3/RepeaterStyler/README.md` — из JSON-секции `style`
- `Component/d3/SubForm/README.md` — при `popup_type` 0/1
- `Component/d3/Column/README.md` — колонки Grid
- `Component/d3/TreeColumn/README.md` — колонки Tree
- `Component/d3/StatGridColumn/README.md`, `StatSumm/README.md` —
  колонки и агрегаты StatGrid
- `Component/d3/Range/README.md` — футер с постраничной навигацией
- `UnitViewCtrl.inc` — серверная логика (`UnitViewBase`, `UnitView`)
- `UnitViewPDO.inc` — итоговый класс `UnitView`
- `UnitView.js` — `D3Api.UnitViewCtrl`, `D3Api.ShowMethodSettingsCtrl`
- `Инструкция по созданию компонетов.md` — общая архитектура
  
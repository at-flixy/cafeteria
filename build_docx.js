const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, WidthType, ShadingType,
  TableOfContents, PageBreak
} = require("docx");

// ---------- Style helpers ----------
const FONT = "Times New Roman";
const COLOR_TEXT = "111111";
const COLOR_HEAD_BG = "FFE4B5"; // moccasin/amber tint
const COLOR_HEAD_TEXT = "5C3A00";
const COLOR_BORDER = "CCCCCC";

const border = { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };
const cellBorders = { top: border, bottom: border, left: border, right: border };

// Content width for A4 portrait with 1-inch margins ≈ 9026 DXA
const CONTENT_WIDTH = 9026;

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    ...opts.paragraph,
    children: (Array.isArray(text) ? text : [text]).map(t =>
      typeof t === "string"
        ? new TextRun({ text: t, font: FONT, size: 24, color: COLOR_TEXT, bold: opts.bold, italics: opts.italic })
        : t
    ),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    pageBreakBefore: false,
    children: [new TextRun({ text, font: FONT, size: 36, bold: true, color: "3B2300" })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 30, bold: true, color: "5C3A00" })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: "5C3A00" })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 24, color: COLOR_TEXT })],
  });
}

function checkbox(text) {
  return new Paragraph({
    numbering: { reference: "checks", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 24, color: COLOR_TEXT })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { after: 60 },
    shading: { fill: "F4F0E8", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Consolas", size: 20, color: "222222" })],
  });
}

function makeCell(text, opts = {}) {
  const width = opts.width || Math.floor(CONTENT_WIDTH / (opts.cols || 2));
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: opts.header ? { fill: COLOR_HEAD_BG, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          text: String(text ?? ""),
          font: FONT,
          size: 22,
          bold: opts.header,
          color: opts.header ? COLOR_HEAD_TEXT : COLOR_TEXT,
        })],
      }),
    ],
  });
}

function table(headers, rows, columnWidths) {
  const cols = headers.length;
  const widths = columnWidths || new Array(cols).fill(Math.floor(CONTENT_WIDTH / cols));
  // Adjust last column to make sure total equals CONTENT_WIDTH
  const sum = widths.reduce((a, b) => a + b, 0);
  if (sum !== CONTENT_WIDTH) widths[widths.length - 1] += (CONTENT_WIDTH - sum);

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => makeCell(h, { header: true, width: widths[i] })),
      }),
      ...rows.map(r => new TableRow({
        children: r.map((c, i) => makeCell(c, { width: widths[i] })),
      })),
    ],
  });
}

// ---------- Content ----------
const titlePage = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 200 },
    children: [new TextRun({ text: "Cafeteria Pre-order System", font: FONT, size: 56, bold: true, color: "3B2300" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Финальная документация продукта", font: FONT, size: 36, color: "5C3A00" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: "Техническое задание автоматизированной системы", font: FONT, size: 28, italics: true, color: "5C3A00" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Проект курса Business Systems Requirements Engineering", font: FONT, size: 24, color: COLOR_TEXT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Студент: Жанбалаева Алима, SE(eng)-2-23, КГТУ", font: FONT, size: 24, color: COLOR_TEXT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Бишкек, 2026", font: FONT, size: 24, color: COLOR_TEXT })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

const tocPage = [
  new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Оглавление", font: FONT, size: 36, bold: true, color: "3B2300" })],
  }),
  new TableOfContents("Оглавление", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),
];

const sec1 = [
  h1("1. Резюме (Executive Summary)"),
  p([
    new TextRun({ text: "Cafeteria Pre-order System", font: FONT, size: 24, bold: true, color: COLOR_TEXT }),
    new TextRun({ text: " — веб-приложение для университетской столовой, которое позволяет студентам и сотрудникам заранее выбирать блюда из ежедневного меню, бронировать тайм-слот выдачи и оплачивать заказ онлайн или на кассе. Менеджер столовой публикует меню, задаёт лимиты слотов и стоп-листы, видит сводку нагрузки и формирует отчёты. Кассир находит заказ по номеру/QR и подтверждает выдачу.", font: FONT, size: 24, color: COLOR_TEXT }),
  ]),
  h2("Целевой эффект"),
  bullet("Сокращение среднего ожидания в очереди ≥ 70%"),
  bullet("Снижение пищевых отходов ≥ 30% за счёт прогноза спроса"),
  bullet("Прозрачный учёт заказов, оплат и выдачи"),
  h2("Основа документа"),
  p("ЛР-1 (проблема и домен), ЛР-2 (бизнес-требования), ЛР-3 (UR / use cases), ЛР-4 (приоритизация MoSCoW/Kano/RICE/WSJF), ЛР-5 (функциональные требования FR-001 — FR-021), ЛР-7 (модель данных и системные требования), ЛР-8 (TS по ГОСТ 34.602-2020 / ISO/IEC/IEEE 29148-2018)."),
];

const sec2 = [
  h1("2. Постановка задачи"),
  table(
    ["Элемент", "Описание"],
    [
      ["Проблема", "Очереди 10-20 мин в пиковые часы, нет гарантии наличия блюд, неточный прогноз спроса"],
      ["Затронутые стороны", "Студенты, сотрудники, кассиры, кухня, менеджер столовой, администрация вуза"],
      ["Причины", "Нет цифрового предзаказа, ручной учёт остатков, нет контроля емкости слотов, слабая аналитика"],
      ["Целевое состояние", "Клиент выбирает блюда и слот заранее → система резервирует порции и место → персонал видит план → выдача без очереди"],
      ["Ожидаемый эффект", "Снижение очереди, корректное планирование закупок и приготовления, прозрачный учёт"],
    ],
    [2200, 6826]
  ),
];

const sec3 = [
  h1("3. Заинтересованные стороны (Stakeholders)"),
  table(
    ["Сторона", "Интерес"],
    [
      ["Клиент (студент/сотрудник)", "Экономия времени, гарантия блюда, учёт КБЖУ/аллергенов"],
      ["Кассир / администратор выдачи", "Быстрый поиск заказа, минимум ошибок"],
      ["Менеджер столовой", "Управление меню/слотами/стоп-листом, аналитика спроса"],
      ["Кухня", "Прогнозируемая нагрузка, равномерное планирование"],
      ["Администрация вуза", "Удовлетворённость пользователей, снижение издержек"],
      ["Платёжная система (внешний актор)", "Обработка онлайн-платежей"],
    ],
    [3200, 5826]
  ),
];

const sec4 = [
  h1("4. Бизнес-требования (BR)"),
  table(
    ["ID", "Бизнес-требование", "MoSCoW"],
    [
      ["BR-001", "Сократить время ожидания в столовой в пиковые часы", "Must"],
      ["BR-002", "Повысить предсказуемость спроса для кухни и менеджера", "Must"],
      ["BR-003", "Уменьшить количество выбора недоступных блюд (актуальное меню в реальном времени)", "Must"],
      ["BR-004", "Поддержка прозрачного учёта заказов, оплат и статусов выдачи", "Must"],
      ["BR-005", "Дать менеджеру данные для планирования меню и закупок", "Should"],
      ["BR-006", "Лимиты количества заказов на тайм-слот по пропускной способности кухни", "Must"],
      ["BR-007", "Ежедневные и еженедельные отчёты о продажах и загрузке", "Could"],
      ["BR-008", "Стоп-лист с автоматическим уведомлением затронутых клиентов", "Should"],
    ],
    [1100, 6700, 1226]
  ),
];

const sec5 = [
  h1("5. Пользовательские требования (UR)"),
  table(
    ["ID", "User story", "Приоритет"],
    [
      ["UR-001", "Как клиент, я хочу видеть актуальное меню дня с остатками, КБЖУ и аллергенами", "High"],
      ["UR-002", "Как клиент, я хочу оформить предзаказ и выбрать тайм-слот выдачи", "High"],
      ["UR-003", "Как клиент, я хочу выбрать способ оплаты (онлайн или на кассе)", "High"],
      ["UR-004", "Как клиент, я хочу видеть и отменять активные неоплаченные заказы", "High"],
      ["UR-005", "Как кассир, я хочу быстро находить заказ по номеру / ID / QR и подтверждать выдачу", "High"],
      ["UR-006", "Как менеджер, я хочу видеть сводную очередь по слотам и блюдам", "High"],
      ["UR-007", "Как менеджер, я хочу управлять меню, ценами, КБЖУ, остатками, стоп-листом, лимитами слотов", "High"],
      ["UR-008", "Как менеджер, я хочу формировать отчёты о продажах и популярности блюд", "Medium"],
    ],
    [1100, 6700, 1226]
  ),
];

const sec6 = [
  h1("6. Бизнес-правила (BRL)"),
  table(
    ["ID", "Правило"],
    [
      ["BRL-001", "Заказ создаётся только для опубликованного меню дня"],
      ["BRL-002", "reserved_qty не должен превышать available_qty"],
      ["BRL-003", "Слот становится недоступным при достижении order_limit"],
      ["BRL-004", "Оплаченный заказ нельзя отменить после начала выбранного слота"],
      ["BRL-005", "Блюдо со стоп-листом не показывается в новых заказах"],
      ["BRL-006", "Менять меню/стоп-лист/лимиты могут только авторизованные роли (manager/admin)"],
      ["BRL-007", "Лимит слота можно изменить только до приёма первого заказа на слот (или увеличить в любой момент; снижение — только до брони)"],
      ["BRL-008", "Отмена неоплаченного заказа возвращает зарезервированные порции и место в слот"],
    ],
    [1200, 7826]
  ),
];

const sec7 = [
  h1("7. Use Cases (UC) — основные"),

  h2("UC-1. Просмотр меню дня"),
  p([new TextRun({ text: "Актор: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Клиент", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Основной поток: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Открыть страницу → система загружает опубликованное меню → отображаются блюда (фото, цена, КБЖУ, аллергены, остатки) → фильтрация/поиск.", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Альтернативный: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Блюда из стоп-листа помечаются как недоступные.", font: FONT, size: 24 })]),

  h2("UC-2. Оформление предзаказа"),
  p([new TextRun({ text: "Актор: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Клиент", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Основной поток: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Выбор блюда и количества → проверка остатков → выбор тайм-слота из доступных → расчёт суммы → выбор способа оплаты → подтверждение.", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Альтернативный: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Слот заполнен — система предлагает ближайший доступный.", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Исключение: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Онлайн-оплата отклонена — система предлагает другой способ.", font: FONT, size: 24 })]),

  h2("UC-3. Отмена неоплаченного заказа"),
  p([new TextRun({ text: "Актор: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Клиент", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Поток: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Открыть «Мои заказы» → выбрать неоплаченный заказ → подтвердить отмену → возврат порций и места в слот.", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Исключение: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Оплаченные заказы и заказы с начатым слотом — отмена через приложение запрещена.", font: FONT, size: 24 })]),

  h2("UC-4. Подтверждение выдачи заказа"),
  p([new TextRun({ text: "Акторы: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Клиент, Кассир", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Поток: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Кассир вводит номер заказа или сканирует QR → система показывает состав, сумму, статус оплаты → при необходимости принимает оплату на кассе → подтверждает выдачу → статус ISSUED, фиксируется кассир и время.", font: FONT, size: 24 })]),

  h2("UC-5. Просмотр очереди по слотам"),
  p([new TextRun({ text: "Актор: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Менеджер", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Поток: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Открыть сводку → для каждого слота показывается количество заказов и сумма порций по блюдам → можно пометить слот «Готов к выдаче».", font: FONT, size: 24 })]),

  h2("UC-6. Управление меню и стоп-листом"),
  p([new TextRun({ text: "Актор: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Менеджер", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Поток: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Создать/опубликовать DailyMenu → добавить блюда (цена, КБЖУ, остатки, фото) → при необходимости включить stop_list_flag → система скрывает блюдо и уведомляет клиентов с активными заказами.", font: FONT, size: 24 })]),

  h2("UC-7. Отчёты"),
  p([new TextRun({ text: "Актор: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Менеджер", font: FONT, size: 24 })]),
  p([new TextRun({ text: "Поток: ", font: FONT, size: 24, bold: true }), new TextRun({ text: "Выбрать период (день/неделя) → сформировать отчёт (топ блюд, выручка, загрузка слотов) → сохранить ReportSnapshot.", font: FONT, size: 24 })]),
];

const sec8 = [
  h1("8. Функциональные требования (FR-001 — FR-021)"),
  p([new TextRun({ text: "Шаблон: «При условии X система должна Y».", font: FONT, size: 24, italics: true })]),

  h2("8.1 Клиентский контур"),
  table(["ID", "Приоритет", "Требование"], [
    ["FR-001", "Must", "Показывать опубликованное меню с названием, ценой, КБЖУ, аллергенами, количеством порций."],
    ["FR-002", "Must", "Разрешать добавлять в заказ только доступные позиции в доступном количестве."],
    ["FR-003", "Must", "Показывать только открытые тайм-слоты с оставшейся ёмкостью."],
    ["FR-004", "Should", "При конфликте слота отклонить бронь и предложить ближайший доступный."],
    ["FR-005", "Must", "Создавать предзаказ с уникальным номером, составом, суммой и слотом."],
    ["FR-006", "Should", "Отправлять клиенту подтверждение (in-app уведомление) с номером, временем, составом, статусом оплаты."],
  ], [1100, 1100, 6826]),

  h2("8.2 Платежи"),
  table(["ID", "Приоритет", "Требование"], [
    ["FR-007", "Should", "Передавать заказ во внешнюю платёжную систему (mock) и сохранять результат."],
    ["FR-008", "Should", "При оплате на кассе регистрировать заказ со статусом PENDING_PAYMENT."],
  ], [1100, 1100, 6826]),

  h2("8.3 Остатки и ёмкость"),
  table(["ID", "Приоритет", "Требование"], [
    ["FR-009", "Must", "Пересчитывать остатки блюд и ёмкость слота после создания/оплаты/отмены."],
  ], [1100, 1100, 6826]),

  h2("8.4 Управление заказами клиентом"),
  table(["ID", "Приоритет", "Требование"], [
    ["FR-010", "Should", "Показывать клиенту список активных и завершённых заказов."],
    ["FR-011", "Should", "Разрешать клиенту отменить неоплаченный заказ до начала слота."],
    ["FR-012", "Should", "Менять статус CANCELLED и возвращать порции и место в слот."],
  ], [1100, 1100, 6826]),

  h2("8.5 Кассир"),
  table(["ID", "Приоритет", "Требование"], [
    ["FR-013", "Must", "Поиск заказа по номеру/ID клиента/QR."],
    ["FR-014", "Must", "Подтверждение выдачи — статус ISSUED, фиксация времени и кассира."],
  ], [1100, 1100, 6826]),

  h2("8.6 Менеджер"),
  table(["ID", "Приоритет", "Требование"], [
    ["FR-015", "Should", "Сводка по слотам — количество заказов и суммарные порции по блюдам."],
    ["FR-016", "Must", "Редактировать и публиковать меню (цены, КБЖУ, аллергены, порции, фото)."],
    ["FR-017", "Should", "При добавлении в стоп-лист скрыть блюдо из новых заказов."],
    ["FR-018", "Should", "При добавлении в стоп-лист уведомить клиентов с активными заказами."],
    ["FR-019", "Must", "Задавать/изменять лимит слота до приёма заказов."],
    ["FR-020", "Must", "Блокировать новые заказы при достижении лимита слота."],
    ["FR-021", "Could", "Формировать ежедневный/еженедельный отчёт о продажах, популярности, загрузке."],
  ], [1100, 1100, 6826]),
];

const sec9 = [
  h1("9. Нефункциональные требования (NFR)"),
  table(["ID", "Категория", "Требование"], [
    ["NFR-PF-01", "Performance", "95% запросов меню — < 2 сек при штатной нагрузке"],
    ["NFR-PF-02", "Performance", "Создание заказа и резервирование — < 3 сек при пиковой нагрузке"],
    ["NFR-RL-01", "Reliability", "Никакого двойного резервирования при сбое; транзакционность"],
    ["NFR-AV-01", "Availability", "≥ 99.5% в рабочие часы столовой"],
    ["NFR-SE-01", "Security", "Доступ к функциям ограничен по ролям (Client / Cashier / Manager / Admin)"],
    ["NFR-SE-02", "Payment security", "Не хранить полных реквизитов карт; только статусы и provider_ref"],
    ["NFR-US-01", "Usability", "Адаптивный UI, понятный без обучения"],
    ["NFR-CP-01", "Compatibility", "Последние 3 мажорных версии Chrome/Edge/Firefox/Safari, iOS 14+ / Android 10+"],
    ["NFR-SC-01", "Scalability", "Расти по числу пользователей и заказов без изменения базовой модели"],
    ["NFR-OB-01", "Observability", "AuditLog критичных действий персонала"],
    ["NFR-MT-01", "Maintainability", "Чистая структура кода, типизация, миграции БД"],
  ], [1500, 1900, 5626]),
];

const sec10 = [
  h1("10. Модель данных (логическая)"),

  h2("Сущности"),
  bullet("User — пользователь (CLIENT / CASHIER / MANAGER / ADMIN)"),
  bullet("Dish — справочник блюд с КБЖУ и аллергенами"),
  bullet("DailyMenu — меню на дату (DRAFT / PUBLISHED / CLOSED)"),
  bullet("MenuItem — позиция меню дня (цена, available_qty, reserved_qty, stop_list_flag)"),
  bullet("TimeSlot — интервал выдачи (start_time, end_time, order_limit, reserved_count)"),
  bullet("Order — заказ (order_number, status, total_amount, slot, client)"),
  bullet("OrderItem — строка заказа (menu_item, quantity, unit_price)"),
  bullet("Payment — оплата (method, status, provider_ref)"),
  bullet("Notification — уведомления пользователю"),
  bullet("AuditLog — журнал действий персонала"),
  bullet("ReportSnapshot — сохранённый отчёт"),

  h2("Ключевые атрибуты"),
  code("User(user_id PK, full_name, email UQ, password_hash, role ENUM, status ENUM, created_at)"),
  code("Dish(dish_id PK, name, description, price DEC(10,2), calories, proteins_g, fats_g, carbs_g, allergens, photo_url)"),
  code("DailyMenu(menu_id PK, menu_date UQ, status ENUM[DRAFT|PUBLISHED|CLOSED], published_at)"),
  code("MenuItem(menu_item_id PK, menu_id FK, dish_id FK, price, available_qty, reserved_qty, stop_list_flag)"),
  code("TimeSlot(slot_id PK, slot_date, start_time, end_time, order_limit, reserved_count)"),
  code("Order(order_id PK, order_number UQ, client_id FK, slot_id FK, status ENUM, total_amount, created_at, issued_at, issued_by FK)"),
  code("OrderItem(order_item_id PK, order_id FK, menu_item_id FK, quantity, unit_price)"),
  code("Payment(payment_id PK, order_id FK UQ, method ENUM, status ENUM, provider_ref, paid_at)"),
  code("Notification(notification_id PK, user_id FK, message, type, read_at, created_at)"),
  code("AuditLog(log_id PK, actor_id FK, action, entity, entity_id, payload_json, created_at)"),
  code("ReportSnapshot(report_id PK, period_from, period_to, type, payload_json, created_at)"),

  h2("Статусы заказа"),
  p("CREATED → PENDING_PAYMENT → PAID → READY → ISSUED"),
  p("Альтернативные ветки: CANCELLED (от CREATED/PENDING_PAYMENT/PAID до начала слота)."),

  h2("Правила валидации (DV)"),
  table(["ID", "Правило"], [
    ["DV-01", "Email уникален, формат name@domain.zone"],
    ["DV-02", "Хранить только bcrypt-хэш пароля"],
    ["DV-03", "Цены и суммы — DEC(10,2), > 0"],
    ["DV-04", "КБЖУ — неотрицательные значения"],
    ["DV-05", "reserved_qty ≤ available_qty, без отрицательных"],
    ["DV-06", "reserved_count ≤ order_limit"],
    ["DV-07", "Заказ должен содержать ≥ 1 OrderItem"],
    ["DV-08", "Статусы — только из ENUM"],
    ["DV-09", "Отмена — только для неоплаченного до начала слота"],
    ["DV-10", "Сумма успешной оплаты == total_amount"],
    ["DV-11", "На одну дату — одно опубликованное меню"],
    ["DV-12", "stop_list_flag=true ⇒ не показывать в новых заказах"],
    ["DV-13", "AuditLog — append-only, не удаляется"],
  ], [1100, 7926]),
];

const sec11 = [
  h1("11. Системные требования (для production-варианта)"),
  table(["Компонент", "Минимум", "Рекомендация"], [
    ["App server", "2 cores, 8 GB RAM", "4-8 cores, 16 GB+"],
    ["DB storage", "100 GB SSD", "500 GB NVMe"],
    ["DBMS", "PostgreSQL 14", "PostgreSQL 16+"],
    ["Runtime", "Node.js 20 LTS", "Node.js 22 LTS"],
    ["Контейнеризация", "Docker 24+", "Docker 25+ / k8s"],
    ["Сеть/TLS", "100 Mbps / TLS 1.2", "1 Gbps / TLS 1.3"],
    ["Браузеры", "Последние 3 мажора Chrome/Edge/Firefox/Safari", "Последние 2 мажора"],
    ["Мобильные", "iOS 14+ / Android 10+", "iOS 16+ / Android 13+"],
  ], [2400, 3300, 3326]),
  p([new TextRun({ text: "Для MVP-демо: Node.js 20+, SQLite, без Docker.", font: FONT, size: 24, italics: true })]),
];

const sec12 = [
  h1("12. AS-IS → TO-BE"),
  h2("AS-IS (текущее состояние)"),
  p("Клиент идёт в столовую → стоит 10-20 мин → выбирает из оставшегося → оплачивает → ждёт приготовления."),
  h2("TO-BE (целевое состояние)"),
  p("Клиент открывает приложение → видит актуальное меню с остатками → выбирает блюда и слот → платит онлайн или резервирует кассу → приходит к слоту → кассир выдаёт по номеру/QR без очереди."),
];

const sec13 = [
  h1("13. UI / страницы MVP"),

  h2("Клиент"),
  bullet("/ — Меню дня (карточки блюд, фильтр по категориям/аллергенам, бейдж «Стоп-лист», корзина)"),
  bullet("/cart — Корзина → выбор тайм-слота → итог"),
  bullet("/checkout — Выбор способа оплаты (онлайн mock / на кассе) → подтверждение"),
  bullet("/orders — Мои заказы (активные/завершённые), QR-код, кнопка отмены, статусы"),
  bullet("/orders/[id] — Детали заказа + QR"),
  bullet("/notifications — Уведомления"),

  h2("Кассир"),
  bullet("/cashier — Поиск заказа (номер / email клиента / QR)"),
  bullet("/cashier/order/[id] — Карточка заказа: состав, статус оплаты, кнопки «Принять оплату» и «Подтвердить выдачу»"),

  h2("Менеджер"),
  bullet("/manager — Дашборд: продажи дня, активные заказы, загрузка слотов"),
  bullet("/manager/menu — Меню дня: создать/опубликовать, список блюд с inline-редактированием, флаг стоп-листа"),
  bullet("/manager/dishes — Справочник блюд (CRUD)"),
  bullet("/manager/slots — Тайм-слоты на день (CRUD, лимиты)"),
  bullet("/manager/queue — Сводка по слотам (количество заказов, агрегаты блюд)"),
  bullet("/manager/reports — Отчёты: день/неделя; графики топ-блюд, выручки, загрузки"),

  h2("Общие"),
  bullet("/login, /register"),
  bullet("Header с переключением темы (опц.), бейдж уведомлений, имя/роль/выход"),
];

const sec14 = [
  h1("14. Acceptance criteria (для приёмки MVP)"),
  checkbox("Сид-аккаунты client/cashier/manager входят с паролем demo"),
  checkbox("Регистрация нового клиента работает"),
  checkbox("Менеджер публикует меню дня → клиент видит блюда"),
  checkbox("Клиент оформляет заказ с выбором слота → статус CREATED/PENDING_PAYMENT"),
  checkbox("Mock-онлайн-оплата за 2 сек переводит заказ в PAID"),
  checkbox("При создании заказа available_qty и reserved_count пересчитываются"),
  checkbox("Слот блокируется при достижении order_limit (FR-020)"),
  checkbox("Стоп-лист скрывает блюдо в меню; клиент с активным заказом получает уведомление (FR-017/018)"),
  checkbox("Кассир находит заказ по номеру/email/QR → подтверждает выдачу → статус ISSUED"),
  checkbox("Клиент отменяет неоплаченный заказ → ресурсы возвращаются (FR-011/012)"),
  checkbox("Менеджер видит сводку по слотам и отчёт за день"),
  checkbox("AuditLog фиксирует publish_menu, stop_list_toggle, slot_limit_change, order_issued, order_cancelled"),
  checkbox("UI адаптивен (mobile/desktop), русский язык, единый стиль"),
];

const sec15 = [
  h1("15. Глоссарий"),
  table(["Термин", "Описание"], [
    ["Предзаказ", "Резервирование блюд клиентом до прихода в столовую"],
    ["Тайм-слот", "Фиксированный интервал выдачи заказа"],
    ["Стоп-лист", "Список временно скрытых блюд"],
    ["MVP", "Минимально жизнеспособный продукт"],
    ["BR / UR / FR / NFR", "Business / User / Functional / Non-functional Requirement"],
    ["AuditLog", "Журнал критичных действий персонала"],
    ["ReportSnapshot", "Сохранённый расчёт отчёта"],
    ["КБЖУ", "Калории, белки, жиры, углеводы"],
    ["PK / FK", "Primary key / Foreign key"],
    ["ENUM", "Тип с заранее заданным набором значений"],
    ["TLS", "Протокол шифрования соединения"],
    ["RPO", "Максимально допустимый объём потери данных при восстановлении"],
  ], [2400, 6626]),
];

const sec16 = [
  h1("16. Источники"),
  bullet("ЛР-1 — Problem Definition, Domain Analysis"),
  bullet("ЛР-2 — Business Requirements"),
  bullet("ЛР-3 — User Requirements, Use Cases, Scenarios"),
  bullet("ЛР-4 — Prioritization (Kano / MoSCoW / RICE / WSJF)"),
  bullet("ЛР-5 — Functional Requirements, Traceability"),
  bullet("ЛР-7 — Data Requirements, System Requirements"),
  bullet("ЛР-8 — Technical Specification (ГОСТ 34.602-2020, ISO/IEC/IEEE 29148-2018)"),
  bullet("BABOK Guide"),
  bullet("IEEE 830"),
  bullet("UML 2.5"),
];

// ---------- Build document ----------
const doc = new Document({
  creator: "Cafeteria Pre-order System",
  title: "Cafeteria Pre-order System — Документация",
  description: "Финальная документация (ТЗ) системы предзаказа блюд в столовой",
  styles: {
    default: { document: { run: { font: FONT, size: 24, color: COLOR_TEXT } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: "3B2300" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: "5C3A00" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: "5C3A00" },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "checks",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "☐", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4 portrait in DXA
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [
      ...titlePage,
      ...tocPage,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5,
      ...sec6,
      ...sec7,
      ...sec8,
      ...sec9,
      ...sec10,
      ...sec11,
      ...sec12,
      ...sec13,
      ...sec14,
      ...sec15,
      ...sec16,
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = "C:\\Users\\Lenovo\\Desktop\\Requirements\\Cafeteria_Preorder_Documentation.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("OK:", outPath, "size:", buffer.length, "bytes");
}).catch(err => {
  console.error("ERR:", err);
  process.exit(1);
});

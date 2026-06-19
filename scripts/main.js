import {
  computed,
  createApp,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from "vue";

const FILTERS = ["All", "Work", "Play", "Contact"];
const BREAKPOINT = 768;
const ASSETS = {
  logo: "assets/my-logo.svg",
  fullBody: "assets/profile-full-body.png"
};

const cards = [
  {
    key: "about",
    type: "about",
    filter: "Work",
    className: "hero-card",
    col: "1 / 3",
    row: "1",
    delay: "0s"
  },
  {
    key: "email",
    type: "link",
    filter: "Contact",
    className: "contact-card",
    label: "Email",
    title: "hello@example.com",
    text: "Написать о проекте",
    href: "mailto:hello@example.com",
    col: "3",
    row: "1",
    delay: "0.1s"
  },
  {
    key: "linkedin",
    type: "link",
    filter: "Contact",
    className: "social-card linkedin",
    label: "Social",
    title: "LinkedIn",
    text: "Профиль и опыт",
    href: "https://linkedin.com/",
    col: "4",
    row: "1",
    delay: "0.2s"
  },
  {
    key: "system",
    type: "case",
    filter: "Work",
    className: "case-card design-system",
    label: "Case study",
    title: "Дизайн-система для быстрого запуска продуктовых экранов",
    text: "Токены, компоненты и правила, которые помогают команде двигаться быстрее.",
    col: "1 / 3",
    row: "2 / 4",
    delay: "0.3s"
  },
  {
    key: "pixel",
    type: "static",
    filter: "Play",
    className: "pixel-card",
    title: "MAKE\nIT\nCLEAR",
    col: "3",
    row: "2",
    delay: "0.4s"
  },
  {
    key: "photo",
    type: "photo",
    filter: "Work",
    className: "photo-card",
    title: "Alexandr Scorolitnii",
    col: "4",
    row: "2 / 4",
    delay: "0.5s"
  },
  {
    key: "quote",
    type: "quote",
    filter: "Play",
    className: "quote-card",
    title: "Хороший интерфейс не объясняет себя. Он просто ведёт пользователя дальше.",
    col: "3",
    row: "3",
    delay: "0.6s"
  },
  {
    key: "research",
    type: "case",
    filter: "Work",
    className: "case-card research",
    label: "Research",
    title: "Как исследование поменяло исходный продуктовый бриф",
    text: "Интервью, карта сценариев и новый путь к более сильному решению.",
    col: "1 / 3",
    row: "4",
    delay: "0.7s"
  },
  {
    key: "github",
    type: "link",
    filter: "Contact",
    className: "social-card github",
    label: "Code",
    title: "GitHub",
    text: "Проекты и эксперименты",
    href: "https://github.com/",
    col: "3",
    row: "4",
    delay: "0.8s"
  },
  {
    key: "tools",
    type: "case",
    filter: "Work",
    className: "case-card tools",
    label: "Tools",
    title: "Автоматизация рутины для дизайн-команды",
    text: "Проверки макетов, подготовка обложек и единый workflow ревью.",
    col: "4",
    row: "4",
    delay: "0.9s"
  },
  {
    key: "metric",
    type: "metric",
    filter: "Work",
    className: "metric-card",
    label: "Impact",
    title: "32%",
    text: "меньше времени на подготовку повторяющихся экранов",
    col: "1",
    row: "5",
    delay: "1s"
  },
  {
    key: "principle",
    type: "quote",
    filter: "Play",
    className: "quote-card",
    title: "Сначала сценарий. Потом экран. Потом визуальный эффект.",
    col: "2 / 5",
    row: "5",
    delay: "1.1s"
  }
];

function caseBody(card) {
  return [
    `Это демо-страница кейса для "${card.title}". Текст здесь намеренно заменяемый: сюда можно вставить настоящую задачу, роль, ограничения и результат.`,
    "Технически карточка раскрывается в overlay поверх страницы, фон размывается, а панель появляется через spring-like CSS transition. Это имитирует паттерн интерактивных портфолио, где кейсы открываются без ухода со страницы.",
    "Дальше можно добавить реальные изображения, видео, before/after, метрики и ссылки на прототипы."
  ];
}

const App = defineComponent({
  name: "PortfolioApp",
  setup() {
    const activeFilter = ref("All");
    const isLazy = ref(true);
    const isDark = ref(false);
    const navHidden = ref(false);
    const showBackToTop = ref(false);
    const openedCase = ref(null);
    const preloaderPhase = ref("intro");
    const showPreloader = ref(true);
    const contentReady = ref(false);
    const pointer = reactive({ x: -80, y: -80, tx: -80, ty: -80, active: false, text: false });
    const tooltip = reactive({ text: "", visible: false, x: -80, y: -80 });
    const slotEls = {};
    const pillEls = {};
    const navState = reactive({
      indicatorLeft: 4,
      indicatorWidth: 0,
      ghostLeft: 4,
      ghostWidth: 0,
      ghostVisible: false
    });

    let lastScrollY = window.scrollY;
    let cursorRaf = 0;
    let removeSmooth = () => {};
    let removeCursor = () => {};
    const preloaderTimers = [];

    const visibleCards = computed(() => cards.map((card) => ({
      ...card,
      dim: activeFilter.value !== "All" && card.filter !== activeFilter.value
    })));

    function updatePill(target = activeFilter.value) {
      nextTick(() => {
        const el = pillEls[target];
        const parent = el?.parentElement;
        if (!el || !parent) return;
        const rect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        navState.indicatorLeft = rect.left - parentRect.left;
        navState.indicatorWidth = rect.width;
      });
    }

    async function changeFilter(filter) {
      if (filter === activeFilter.value) return;

      const prevRects = {};
      for (const key in slotEls) {
        const el = slotEls[key];
        if (el) prevRects[key] = el.getBoundingClientRect();
      }

      activeFilter.value = filter;
      updatePill(filter);
      await nextTick();

      const movers = [];
      for (const key in slotEls) {
        const el = slotEls[key];
        const oldRect = prevRects[key];
        if (!el || !oldRect) continue;
        const newRect = el.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        movers.push(el);
      }

      if (!movers.length) return;
      movers.forEach((el) => {
        el.style.willChange = "transform";
      });
      movers[0].getBoundingClientRect();
      requestAnimationFrame(() => {
        movers.forEach((el) => {
          el.style.transition = "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease";
          el.style.transform = "none";
          el.addEventListener("transitionend", () => {
            el.style.transition = "";
            el.style.transform = "";
            el.style.willChange = "";
          }, { once: true });
        });
      });
    }

    function onNavMousemove(event) {
      const target = event.target.closest(".nav-pill");
      const parent = event.currentTarget;
      if (!target || !parent) return;
      const rect = target.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      navState.ghostLeft = rect.left - parentRect.left;
      navState.ghostWidth = rect.width;
      navState.ghostVisible = true;
    }

    function onScroll() {
      const y = window.scrollY;
      navHidden.value = y > 160 && y > lastScrollY;
      showBackToTop.value = y > 520;
      lastScrollY = y;
    }

    function installSmoothScroll() {
      let current = window.scrollY;
      let target = window.scrollY;
      let raf = 0;

      function tick() {
        const distance = target - current;
        if (Math.abs(distance) < 0.5) {
          current = target;
          window.scrollTo(0, Math.round(current));
          raf = 0;
          return;
        }
        current += distance * 0.09;
        window.scrollTo(0, current);
        raf = requestAnimationFrame(tick);
      }

      function onWheel(event) {
        if (!isLazy.value || openedCase.value) return;
        event.preventDefault();
        let delta = event.deltaY;
        if (event.deltaMode === 1) delta *= 40;
        if (event.deltaMode === 2) delta *= window.innerHeight;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        target = Math.max(0, Math.min(target + delta, maxScroll));
        if (!raf) raf = requestAnimationFrame(tick);
      }

      function sync() {
        if (!raf) {
          current = window.scrollY;
          target = window.scrollY;
        }
      }

      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("scroll", sync, { passive: true });
      return () => {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("scroll", sync);
        if (raf) cancelAnimationFrame(raf);
      };
    }

    function installCursor() {
      const finePointer = matchMedia("(pointer: fine) and (min-width: 769px)");
      if (!finePointer.matches) return () => {};

      function move(event) {
        pointer.tx = event.clientX;
        pointer.ty = event.clientY;
        tooltip.x = event.clientX + 18;
        tooltip.y = event.clientY + 18;
      }

      function over(event) {
        const interactive = event.target.closest("a, button, .bento-card");
        const text = event.target.closest("p, h1, h2, blockquote, li");
        pointer.active = Boolean(interactive);
        pointer.text = !interactive && Boolean(text);
        const hint = event.target.closest("[data-tooltip]");
        tooltip.text = hint?.dataset.tooltip || "";
        tooltip.visible = Boolean(tooltip.text);
      }

      function animate() {
        pointer.x += (pointer.tx - pointer.x) * 0.22;
        pointer.y += (pointer.ty - pointer.y) * 0.22;
        cursorRaf = requestAnimationFrame(animate);
      }

      window.addEventListener("mousemove", move);
      document.addEventListener("mouseover", over);
      document.addEventListener("mouseout", over);
      cursorRaf = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener("mousemove", move);
        document.removeEventListener("mouseover", over);
        document.removeEventListener("mouseout", over);
        cancelAnimationFrame(cursorRaf);
      };
    }

    function openCase(card) {
      openedCase.value = card;
      document.body.style.overflow = "hidden";
    }

    function closeCase() {
      openedCase.value = null;
      document.body.style.overflow = "";
    }

    function schedulePreloader() {
      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.body.classList.add("is-preloading");

      if (reduceMotion) {
        contentReady.value = true;
        showPreloader.value = false;
        document.body.classList.remove("is-preloading");
        return;
      }

      preloaderTimers.push(setTimeout(() => {
        preloaderPhase.value = "exit";
        contentReady.value = true;
      }, 950));

      preloaderTimers.push(setTimeout(() => {
        showPreloader.value = false;
        document.body.classList.remove("is-preloading");
      }, 1850));
    }

    onMounted(() => {
      updatePill();
      document.documentElement.dataset.theme = isDark.value ? "dark" : "light";
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", updatePill);
      removeSmooth = installSmoothScroll();
      removeCursor = installCursor();
      schedulePreloader();
    });

    onUnmounted(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updatePill);
      removeSmooth();
      removeCursor();
      preloaderTimers.forEach((timer) => clearTimeout(timer));
      document.body.classList.remove("is-preloading");
    });

    watch(isDark, (value) => {
      document.documentElement.dataset.theme = value ? "dark" : "light";
    });

    function renderCard(card) {
      const attrs = {
        class: ["bento-card", card.className],
        style: { "--delay": card.delay },
        "data-tooltip": card.type === "case" ? "Открыть кейс" : card.type === "link" ? "Открыть ссылку" : ""
      };

      const action = h("span", { class: "action-icon", "aria-hidden": "true" }, "↗");

      if (card.type === "about") {
        return h("article", attrs, [
          h("div", { class: "card-content" }, [
            h("div", { class: "hero-copy" }, [
              h("span", { class: "card-label" }, "Product Designer"),
              h("h1", "Alexandr Scorolitnii"),
              h("p", "Создаю понятные цифровые продукты, дизайн-системы и интерактивные интерфейсы.")
            ])
          ])
        ]);
      }

      if (card.type === "link") {
        return h("a", { ...attrs, href: card.href, target: "_blank", rel: "noreferrer" }, [
          action,
          h("div", { class: "card-content" }, [
            h("span", { class: "card-label" }, card.label),
            h("h2", card.title),
            h("p", card.text)
          ])
        ]);
      }

      if (card.type === "case") {
        return h("button", { ...attrs, type: "button", onClick: () => openCase(card) }, [
          action,
          h("div", { class: "card-content" }, [
            h("span", { class: "card-label" }, card.label),
            h("h2", card.title),
            h("p", card.text)
          ])
        ]);
      }

      if (card.type === "photo") {
        return h("article", {
          ...attrs,
          "data-tooltip": "Alexandr Scorolitnii"
        }, [
          h("img", {
            class: "full-body-photo",
            src: ASSETS.fullBody,
            alt: card.title,
            loading: "lazy",
            draggable: "false"
          })
        ]);
      }

      if (card.type === "metric") {
        return h("article", attrs, [
          h("div", { class: "card-content" }, [
            h("span", { class: "card-label" }, card.label),
            h("span", { class: "metric-number" }, card.title),
            h("p", card.text)
          ])
        ]);
      }

      if (card.type === "quote") {
        return h("article", attrs, [
          h("div", { class: "card-content" }, [
            h("blockquote", card.title)
          ])
        ]);
      }

      return h("article", attrs, [
        h("div", { class: "card-content" }, [
          h("h2", card.title)
        ])
      ]);
    }

    function renderPreloader() {
      return h("div", {
        class: ["preloader", preloaderPhase.value === "exit" ? "preloader--exit" : ""],
        "aria-label": "Загрузка сайта"
      }, [
        h("div", { class: "preloader-cut preloader-cut--one" }),
        h("div", { class: "preloader-cut preloader-cut--two" }),
        h("div", { class: "preloader-cut preloader-cut--three" }),
        h("div", { class: "preloader-logo-wrap" }, [
          h("img", {
            class: "preloader-logo",
            src: ASSETS.logo,
            alt: "Alexandr Scorolitnii logo",
            draggable: "false"
          }),
          h("span", { class: "preloader-line preloader-line--one" }),
          h("span", { class: "preloader-line preloader-line--two" })
        ])
      ]);
    }

    return () => h("div", {
      class: ["app-shell", contentReady.value ? "app-shell--ready" : ""]
    }, [
      showPreloader.value ? renderPreloader() : null,
      h("div", {
        class: [
          "cursor-shape",
          pointer.active ? "cursor-shape--active" : "",
          pointer.text ? "cursor-shape--text" : ""
        ],
        style: { transform: `translate3d(${pointer.x - 11}px, ${pointer.y - 11}px, 0)` }
      }),
      h("div", {
        class: ["cursor-tooltip", tooltip.visible ? "cursor-tooltip--visible" : ""],
        style: { transform: `translate3d(${tooltip.x}px, ${tooltip.y}px, 0)` }
      }, tooltip.text),
      h("nav", { class: ["nav", navHidden.value ? "nav--hidden" : ""] }, [
        h("a", { class: "nav-logo", href: "#", "aria-label": "На главную" }, [
          h("img", { src: ASSETS.logo, alt: "Alexandr Scorolitnii logo", draggable: "false" })
        ]),
        h("div", {
          class: "nav-pills",
          onMousemove: onNavMousemove,
          onMouseleave: () => { navState.ghostVisible = false; }
        }, [
          h("span", {
            class: "nav-ghost",
            style: {
              left: `${navState.ghostLeft}px`,
              width: `${navState.ghostWidth}px`,
              opacity: navState.ghostVisible ? 1 : 0
            }
          }),
          h("span", {
            class: "nav-indicator",
            style: {
              left: `${navState.indicatorLeft}px`,
              width: `${navState.indicatorWidth}px`
            }
          }),
          ...FILTERS.map((filter) => h("button", {
            class: ["nav-pill", activeFilter.value === filter ? "nav-pill--active" : ""],
            ref: (el) => { pillEls[filter] = el; },
            type: "button",
            onClick: () => changeFilter(filter)
          }, filter))
        ]),
        h("div", { class: "nav-actions" }, [
          h("button", {
            class: "effect-toggle",
            type: "button",
            "data-tooltip": isLazy.value ? "Плавный режим включён" : "Быстрый режим",
            onClick: () => { isLazy.value = !isLazy.value; }
          }, [
            h("span", {
              class: ["effect-toggle-icon", isLazy.value ? "effect-toggle-icon--lazy" : "effect-toggle-icon--fast"],
              "aria-hidden": "true"
            }),
            h("span", isLazy.value ? "Lazy" : "Fast")
          ]),
          h("button", {
            class: "theme-toggle",
            type: "button",
            "aria-label": "Переключить тему",
            "data-tooltip": "Сменить тему",
            onClick: () => { isDark.value = !isDark.value; }
          }, isDark.value ? "☾" : "☼")
        ])
      ]),
      h("button", {
        class: ["back-to-top", showBackToTop.value ? "back-to-top--visible" : ""],
        type: "button",
        "aria-label": "Наверх",
        onClick: () => window.scrollTo({ top: 0, behavior: isLazy.value ? "smooth" : "instant" })
      }, "↑"),
      h("main", { class: "main" }, [
        h("div", { class: "grid" }, visibleCards.value.map((card) => h("div", {
          key: card.key,
          class: ["grid-slot", card.dim ? "grid-slot--dim" : ""],
          style: {
            gridColumn: card.col,
            gridRow: card.row
          },
          ref: (el) => { slotEls[card.key] = el; }
        }, [renderCard(card)])))
      ]),
      openedCase.value ? h("section", { class: "case-overlay", role: "dialog", "aria-modal": "true" }, [
        h("button", { class: "case-backdrop", type: "button", "aria-label": "Закрыть", onClick: closeCase }),
        h("article", { class: "case-panel" }, [
          h("div", { class: "case-panel-inner" }, [
            h("button", { class: "case-close", type: "button", onClick: closeCase }, "×"),
            h("span", { class: "card-label" }, openedCase.value.label),
            h("h2", openedCase.value.title),
            ...caseBody(openedCase.value).map((text) => h("p", text)),
            h("ul", [
              h("li", "Vue 3 рендерит интерактивные карточки и overlay."),
              h("li", "CSS grid задаёт bento-композицию и адаптивные размеры."),
              h("li", "requestAnimationFrame используется для smooth scroll и кастомного курсора.")
            ])
          ])
        ])
      ]) : null
    ]);
  }
});

createApp(App).mount("#app");

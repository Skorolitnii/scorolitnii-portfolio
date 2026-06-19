# Personal Portfolio Site

Статический проект личного сайта-портфолио без внешних зависимостей.
Структура вдохновлена минималистичными портфолио с фокусом на короткое
позиционирование и список кейсов, но тексты и оформление сделаны как заменяемый
шаблон под ваш профиль.

## Запуск

```bash
cd portfolio-site
npm run dev
```

После запуска откройте `http://localhost:4173`.

Можно также открыть `index.html` напрямую в браузере.

## Проверка

```bash
npm run check
```

## Деплой на Vercel

Рекомендуемый вариант: импортировать проект из GitHub в Vercel и указать
`portfolio-site` как Root Directory.

Настройки проекта:

- Framework Preset: `Other`
- Root Directory: `portfolio-site`
- Build Command: `npm run build`
- Output Directory: `.`

Через Vercel CLI:

```bash
cd portfolio-site
npx vercel
```

Для production-деплоя:

```bash
npx vercel --prod
```

## Что заменить под себя

- `index.html`: имя, описание, проекты, контакты и ссылки на соцсети.
- `styles/main.css`: цвета, типографику и визуальный стиль.
- `scripts/main.js`: поведение меню или формы, если понадобится логика сложнее.

Форма сейчас использует `mailto:hello@example.com`. Для продакшена лучше подключить
Formspree, Netlify Forms, серверный endpoint или другой обработчик заявок.

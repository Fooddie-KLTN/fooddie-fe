# Fooddie Frontend

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
  - [Project Structure Rundown](#project-structure-rundown)
- [Getting Started](#getting-started)
- [TODO List](#todo-list)

---

## Overview

The Fooddie Frontend project is a food delivery website frontend built using Next.js. The project is structured for maintainability and scalability, with a clear separation of concerns across different components and modules.  
This website is designed with responsive design in mind. Each component is carefully adjusted to fit common screen sizes, including iPhone 13 Mini (375x812) and Desktop (1920x1080).

## Project Structure

```
src/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── home/
│   │   ├── benefit.tsx
│   │   ├── blog.tsx
│   │   ├── coaching.tsx
│   │   ├── collection.tsx
│   │   ├── combo.tsx
│   │   ├── cta.tsx
│   │   ├── experience.tsx
│   │   ├── incoming.tsx
│   │   ├── promotion.tsx
│   │   ├── sticky-banner.tsx
│   │   ├── testimonial.tsx
│   │   └── ...
│   ├── ui/
│   │   ├── brand.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   └── ...
│   ├── footer.tsx
│   ├── icon.tsx
│   ├── navigation.tsx
│   └── section-wrapper.tsx
├── lib/
│   ├── utils.tsx
│   └── ...
└── types.ts
```

### Project Structure Rundown

- `/src/` - Contains all source code, including pages, components, and utilities.
- `/src/app/` - Global styles, layout, and main page components. All pages are rendered from `page.tsx`.
- `/src/components/` - All reusable and page-specific React components.
  - `/src/components/ui/` - Shared UI components (e.g., Button, Card, Input).
  - `/src/components/footer.tsx` - Footer component.
  - `/src/components/icon.tsx` - Icon component.
  - `/src/components/navigation.tsx` - Navigation bar component.
  - `/src/components/section-wrapper.tsx` - Pre-styled section wrapper component.
  - `/src/components/home/` - Homepage section components.
    - `benefit.tsx` - Benefits section.
    - `blog.tsx` - Blog section.
    - `coaching.tsx` - Coaching section.
    - `collection.tsx` - Collection section.
    - `combo.tsx` - Combo section.
    - `cta.tsx` - Call-to-action section.
    - `experience.tsx` - Experience section.
    - `incoming.tsx` - Incoming program section.
    - `promotion.tsx` - Promotion section.
    - `sticky-banner.tsx` - Sticky banner section.
    - `testimonial.tsx` - Testimonial section.
- `/src/lib/` - Utility functions and helpers.
- `/src/types.ts` - TypeScript type definitions.

## Getting Started

To run the Fooddie frontend app locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## TODO List

### Homepage

- [ ] Implement the homepage with the following sections:
  - [x] Hero section
  - [x] Collection section
  - [x] Combo section
  - [x] Coaching section
  - [x] Promotion section
  - [x] Testimonial section
  - [x] Blog section
  - [x] Benefit section
  - [ ] Experience section
  - [x] CTA section
  - [x] Sticky banner
  - [x] Incoming program section
  - [x] Footer section

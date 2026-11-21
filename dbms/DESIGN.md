# Design System & UI Specifications: `dbms/` Study Guide

> **Purpose**: This design document serves as an exact reference and styleguide for coding agents and engineers creating or extending study guides, documentation modules, or educational sites matching the visual language and structure found in the [`dbms/`](file:///home/aswin/projects/ohaswin.github.io/dbms/) directory.

---

## 1. Visual Identity & Aesthetic Philosophy

The design is an **academic editorial meets modern developer handbook** aesthetic:
- **Paper Warmth**: High-legibility warm background tones (neutral off-white / newsprint / beige) rather than sterile `#ffffff` or dark mode by default.
- **High Contrast Typography**: Stark near-black (`#1a1a1a` or `--ink: #0a0a0f`) text with punchy, purposeful primary accents.
- **Structured Density**: Information-dense, modular layout optimized for quick scanning, revision, and revision cards (flashcards, callouts, tables, badges).
- **Minimalist Chrome**: Flat bordered cards (`border: 1px solid #ddd8cc`), sticky black navigation bar, micro-badges ("pills"), and monospaced accents.

---

## 2. Color Palette & Tokens

### Primary Theme Colors
| Token / Name | Value | Description / Usage |
| :--- | :--- | :--- |
| **Canvas / Paper (Default)** | `#f8f7f4` | Page background (`body`) used in index, Module 1, 2, and 3 |
| **Canvas / Paper (Module 4)** | `#f5f2eb` (`--paper`) | Slightly deeper parchment tone in Module 4 |
| **Ink / Text** | `#1a1a1a` / `#0a0a0f` | Primary headings, body copy, and header bar backgrounds |
| **Card Surface** | `#ffffff` / `#fffef9` | Container backgrounds for sections, questions, and notes |
| **Border Neutral** | `#ddd8cc` / `#d4c9b0` | Subtle, warm separator lines on cards, rows, and footers |
| **Row Alternation** | `#f0ede5` / `#f0ebe0` | Even-row background in summary tables |
| **Code Surface** | `#1e1e2e` (Catppuccin Macchiato) | Code and syntax block background |

### Accent System & Semantic Callouts
Accent badges (`.pill` or `.tag`) and callouts (`.tip`, `.info`, `.good`, `.warn`) share a cohesive color code:

| Semantic State | Pill Class | Border / Accent HEX | Light Tint Background (Callouts) | Common Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary / Action** | `.blue` / `.tag-blue` | `#1d4ed8` / `#457b9d` | `#eff6ff` (`.info`) | Core concepts, informational notes, relational models |
| **Alert / Danger** | `.red` / `.tag-red` | `#dc2626` / `#e63946` | `#fff5f5` (`.tip`) | Exam tips, pitfalls, constraints, Module 2 badges |
| **Success / Valid** | `.green` / `.tag-green` | `#15803d` / `#2d6a4f` | `#f0fdf4` (`.good`) | Definitions, best practices, valid states |
| **Warning / Notice** | `.orange` / `.warn` | `#b45309` | `#fffbeb` (`.warn`) | Gotchas, warnings, edge cases |
| **Neutral / Index** | `.gray` / `.tag-gray` | `#374151` / `#555555` | N/A | Subsections, numbering, flashcard counters |
| **Secondary Accents** | `.purple`, `.teal`, `.pink` | `#7c3aed`, `#0f766e`, `#be185d` | N/A | Topic specialization tags |

---

## 3. Typography & Font Stacks

### Font Families
- **System Sans (Modules 1, 2, 3 & Home)**:
  ```css
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  ```
- **Editorial / Expressive (Module 4)**:
  - Body: `'Syne', sans-serif`
  - Headings: `'Space Grotesk', sans-serif`
  - Code & Counters: `'JetBrains Mono', monospace`
- **Code & Monospace**:
  ```css
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  ```

### Hierarchy & Scale
- **Section Indicator Numbers (`.secnum` / `.section-num`)**:
  - Size: `2.5rem` to `3rem` (40px - 48px)
  - Weight: `800`
  - Color: `#ddd` or `var(--border)` (subtle muted background watermarks)
  - Numeric alignment: `font-variant-numeric: tabular-nums`
- **Module & Page Titles**: `font-size: 1.4rem` to `1.6rem`, `font-weight: 800`, line height tight.
- **Section Subheadings (`h3`)**: `font-size: 1.0rem` to `1.05rem`, `font-weight: 700`.
- **Body Text**: `15px` to `16px`, `line-height: 1.6` to `1.7`.
- **Micro Copy / Tags / Meta (`.tiny`, `.tag`, `.pill`)**: `11px` to `12px`, `font-weight: 700`, uppercase with `letter-spacing: .06em` to `.1em`.

---

## 4. Layout & Component Architecture

### 4.1 Sticky Header Navigation
A persistent top bar present across all module pages and index:
```html
<header class="sticky top-0 z-50 bg-[#1a1a1a] text-white px-3 py-2">
  <div class="text-xs text-gray-400 font-mono">MODULE 01</div>
  <div class="font-black text-sm tracking-wide mb-1">PAGE TITLE — SUBTITLE</div>
  <nav class="flex flex-wrap gap-1">
    <a href="#s1">Core Concepts</a>
    <a href="#s2">Next Topic</a>
  </nav>
</header>
```
**Nav Links (`nav a`)**:
- Text: `12px`, uppercase, `font-weight: 600`, `letter-spacing: .05em`.
- Border: `1px solid #555` or `#ccc`.
- Hover behavior: Inverts colors (`background: #fff; color: #1a1a1a; border-color: #fff`).

### 4.2 Containers & Grid System
- **Hub / Index Page (`.module-wrap`)**: `max-width: 960px; margin: 0 auto; padding: 24px 12px;`
  - Single column on mobile, 2 columns on `sm` (`grid-template-columns: 1fr 1fr`).
- **Module Content Wrapper (`main`)**: `max-width: 48rem` (`max-w-3xl`) centered (`mx-auto`), `padding: 1.5rem 0.75rem`.

### 4.3 Content Cards (`.card`)
The fundamental surface building block:
```css
.card {
  background: #ffffff;
  border: 1px solid #ddd8cc;
  border-radius: 6px;
  padding: 14px;
}
```
**Interactive Module Cards (`.module-link`)**:
- On hover: `transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.08); border-color: #bfb7a6;`

### 4.4 Callout Box System
Callout notes use a 3px solid left accent bar with soft tinted backgrounds:
- **Tip (`.tip`)**: `border-left: 3px solid #dc2626; background: #fff5f5;`
- **Info (`.info`)**: `border-left: 3px solid #1d4ed8; background: #eff6ff;`
- **Good / Definition (`.good`)**: `border-left: 3px solid #15803d; background: #f0fdf4;`
- **Warning (`.warn`)**: `border-left: 3px solid #b45309; background: #fffbeb;`

### 4.5 Data Tables
Tables are designed for high information density:
```css
table { border-collapse: collapse; width: 100%; }
th { background: #1a1a1a; color: #fff; padding: 8px 10px; text-align: left; font-size: 13px; }
td { padding: 7px 10px; font-size: 13px; border-bottom: 1px solid #e5e0d5; }
tr:nth-child(even) td { background: #f0ede5; }
```
Wrapped in `.scroll-x` container for responsive horizontal scrolling on mobile viewports.

### 4.6 Interactive 3D Flashcards (`.fc-wrap`)
Flip cards for exam practice and retention:
- Container with perspective: `perspective: 700px;` (or `800px`).
- Card inner wrapper: `transform-style: preserve-3d; transition: transform .35s;`.
- Flipping toggle via JavaScript: `.classList.toggle('flipped')`.
- Front face: White card with question, number badge, and subtle helper prompt (`"tap to flip"`).
- Back face: Inverted dark background (`background: #1a1a1a; color: #fff; transform: rotateY(180deg);`).

### 4.7 Standard Footer
A quiet, elegant footer placed at the end of index/module documents:
```html
<footer class="text-center py-8 text-xs text-gray-500 border-t border-[#ddd8cc] mt-12">
  Check out <a href="https://ohaswin.com" class="text-[#1a1a1a] font-semibold underline underline-offset-2 hover:text-blue-700 transition-colors">ohaswin.com</a> for more cool notes
</footer>
```

---

## 5. Rules & Guidelines for Coding Agents

When generating new pages or modifying existing ones in `dbms/` or sibling directories:

1. **Keep Zero-Build Portability**: Use CDN Tailwind (`<script src="https://cdn.tailwindcss.com"></script>`) paired with an embedded `<style>` block for page-specific component overrides. Avoid bundler or build-step dependencies.
2. **Preserve Background Warmth**: Always set `background: #f8f7f4;` (or `#f5f2eb`) on `body`. Never fall back to raw `#ffffff` for page backgrounds.
3. **Sticky Dark Navigation**: Header should always remain `sticky top-0 z-50 bg-[#1a1a1a] text-white` with pill/chip style anchors.
4. **Use Color Accents Sparingly for Semantic Significance**:
   - Red = Exam tips, critical constraints, errors.
   - Blue = Core theory, information definitions.
   - Green = Examples, correct queries, validations.
   - Yellow/Orange = Warnings, performance trade-offs.
5. **Mobile Accessibility**:
   - Always wrap code blocks and data tables in horizontal overflow containers (`.scroll-x`).
   - Use min-height / relative heights on interactive flashcard items so that flipped text does not clip or trigger layout shift.
   - Set adequate touch target sizes for nav elements (`min 36px` to `44px`).
6. **Footer Attribution**: Always maintain the footer linking back to `ohaswin.com` with the consistent phrasing and styling.

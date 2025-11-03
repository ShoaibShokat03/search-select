# 🔍 Search Select

A lightweight **vanilla JavaScript** plugin that transforms your regular `<select>` element into a **searchable, multi-select dropdown** — no dependencies, no frameworks, pure JS.

It automatically waits for options to load dynamically (like an image `onload`), and supports live filtering, keyboard shortcuts, and multiple selection.

---

## 🚀 Features

✅ No dependencies (pure JS)  
✅ Multi-select support  
✅ Real-time filtering  
✅ Smart auto-initialization (waits until options load)  
✅ Refresh support when you update options dynamically  
✅ Fully styleable and responsive  
✅ Works in all modern browsers

---

## 💡 Usage

### 1. Include the script (via CDN or locally)

use this cdn to include in your website or web app

```html
<script src="https://cdn.jsdelivr.net/gh/ShoaibShokat03/search-select/search-select.js"></script>
```

## Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Search Select Demo</title>
    <script src="https://cdn.jsdelivr.net/gh/ShoaibShokat03/search-select/search-select.js"></script>
  </head>
  <body>
    <select id="countrySelect">
      <option value="pk">Pakistan</option>
      <option value="us">United States</option>
      <option value="uk">United Kingdom</option>
      <option value="in">India</option>
    </select>

    <script>
      new searchSelect("#countrySelect");
    </script>
  </body>
</html>
```

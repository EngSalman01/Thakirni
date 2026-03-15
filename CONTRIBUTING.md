# Contributing to Thakirni ذكرني

First off — thank you for considering contributing! 🙏

Every contribution matters, whether it's a bug report, a new feature, a typo fix, or a translation. **Your name will be added to the README contributors table** for every meaningful contribution.

---

## 🚀 Quick Start

1. **Fork** the repo on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Thakirni.git
   cd Thakirni
   ```
3. **Install** dependencies:
   ```bash
   pnpm install
   ```
4. **Create** a branch from `dev`:
   ```bash
   git checkout dev
   git checkout -b feature/your-feature-name
   ```
5. **Make** your changes and test locally
6. **Push** and open a PR into `dev` (not `main`)

---

## 📋 What We Need Help With

### 🎨 Design & Frontend
- UI/UX improvements across all pages
- Mobile responsiveness fixes
- Animation polish
- Accessibility improvements (ARIA, keyboard navigation)

### 🤖 AI & Backend
- Vector search for memories using pgvector
- Improving AI tool accuracy
- Adding new AI tools
- Performance optimizations

### 📱 Mobile
- React Native app (iOS + Android)
- PWA improvements

### 🌐 Internationalization
- More Arabic dialect support
- French (for North Africa)
- Additional language support

### 🧪 Testing
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests with Playwright

### 📖 Documentation
- Code comments
- API documentation
- Video tutorials

### 🐛 Bug Fixes
- Check the [Issues](https://github.com/EngSalman01/Thakirni/issues) tab
- Any issue labeled `good first issue` is a great place to start

---

## 📝 Pull Request Guidelines

- PRs go into `dev` branch, never directly into `main`
- Keep PRs focused — one feature or fix per PR
- Include a clear description of what you changed and why
- If your PR fixes an issue, reference it: `Fixes #123`
- Screenshots or screen recordings help for UI changes

---

## 🐛 Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/device if relevant
- Screenshots if helpful

---

## 💡 Suggesting Features

Open an issue with the `enhancement` label and describe:
- The problem you're solving
- Your proposed solution
- Why it would benefit Thakirni users

---

## 🌐 Translation Guide

Thakirni uses a simple `t(ar, en)` helper for all strings. To add support for a new language or improve Arabic translations:

1. Search for `t("` in the codebase to find all translatable strings
2. The pattern is always `t("Arabic text", "English text")`
3. Open a PR with your translation improvements

---

## 🎖 Recognition

Every contributor gets:
- ✅ Their name and GitHub profile in the README contributors table
- ✅ Listed by contribution type
- ✅ Eternal gratitude from the Saudi dev community 🇸🇦

---

## 📞 Questions?

Open an issue or reach out at support@thakirni.com

---

*Thank you for helping make Thakirni better for everyone!* 🧠

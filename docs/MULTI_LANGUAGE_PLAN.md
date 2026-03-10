# Multi-Language Support Plan (English, Hindi, Marathi)

## Overview

Add language preference for the entire web application. Users can select **English**, **Hindi**, or **Marathi** at registration and change it later from their profile. The full interface (labels, buttons, placeholders, messages) will switch to the selected language.

---

## 1. Supported Languages

| Code   | Language |
|--------|----------|
| `en`   | English  |
| `hi`   | Hindi (हिंदी) |
| `mr`   | Marathi (मराठी) |

---

## 2. User Flow

### 2.1 New User (Registration)

- **Screen:** Login page in "Create account" (signup) mode
- **Change:** Add a **Language** dropdown/selector before or after the role selection
- **Options:** English | हिंदी (Hindi) | मराठी (Marathi)
- **Default:** English
- **Storage:** Selected language is sent with the registration payload and saved in the user's profile

### 2.2 Existing User (Profile)

- **Screen:** Profile page (`/user/profile`)
- **Change:** Add a **Preferred Language** section with the same 3 options
- **Behavior:** On change, call API to update user preference → refresh app language → optionally reload or update context so all components re-render in the new language

### 2.3 Guest / Not Logged In

- **Landing & Login:** Use browser locale or default to English until user selects a language (e.g. small language switcher in header/footer)
- **After login:** Use the user's stored preference

---

## 3. Technical Approach

### 3.1 i18n Library

**Recommended:** `react-i18next` + `i18next`

- Industry standard for React i18n
- Supports namespaces, lazy loading, interpolation
- Works well with Vite

**Alternative:** Custom context + JSON translation files (lighter, no extra dependency)

### 3.2 Translation File Structure

```
frontend/src/
├── locales/
│   ├── en.json      # English
│   ├── hi.json      # Hindi
│   └── mr.json      # Marathi
```

Each file contains keys for all UI strings, e.g.:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  },
  "auth": {
    "login": "Sign in",
    "signup": "Create account",
    "email": "Email",
    "password": "Password"
  },
  "sidebar": {
    "aiChat": "AI Chat",
    "quickStart": "Quick Start",
    "browseMedicines": "Browse Medicines",
    "orderHistory": "Order History"
  }
}
```

### 3.3 Backend Changes

| Area | Change |
|------|--------|
| **User model** | Add `preferred_language` column (e.g. `String(10)`, default `'en'`) |
| **Migration** | New Alembic migration to add the column |
| **RegisterRequest** | Add optional `preferred_language: str \| None` |
| **ProfileUpdate** | Add `preferred_language: str \| None` |
| **UserProfile** | Add `preferred_language: str \| None` |
| **Auth service** | Save `preferred_language` on register and profile update |
| **GET /auth/me** | Return `preferred_language` in user object |

### 3.4 Frontend Changes

| Area | Change |
|------|--------|
| **AuthContext** | Store `preferredLanguage` from user; provide `setPreferredLanguage` and `t` (translate function) |
| **LanguageProvider** | Wrap app with i18n provider; initialize language from user preference or localStorage |
| **Login.jsx** | Add language selector in signup form; send `preferred_language` in register payload |
| **ProfilePage.jsx** | Add "Preferred Language" dropdown; on change → PATCH profile → update context → re-render |
| **All pages/components** | Replace hardcoded strings with `t('key')` or `t('namespace.key')` |
| **Sidebar, Header** | Use `t()` for nav labels |
| **Landing** | Use `t()` for hero, features, CTA |
| **Toasts, errors** | Use `t()` for messages |

---

## 4. Scope of Translation

### 4.1 High Priority (User-Facing)

- Login / Register form (labels, buttons, placeholders, errors)
- Sidebar navigation (Quick Start, AI Chat, Browse Medicines, Order History, etc.)
- Profile page (labels, save/cancel, success/error messages)
- Chat UI (welcome message, input placeholder, buttons)
- Landing page (hero, features, CTAs)
- Quick Start page
- Order History, Notifications, Prescriptions, Contact Us
- Cart drawer, medicine cards, order forms
- Common UI: Loader, Modal, Pagination, ErrorState

### 4.2 Admin (Optional for Phase 1)

- Admin sidebar, dashboard, tables, modals
- Can be done in a later phase

### 4.3 Out of Scope (For Now)

- AI chat responses (already support multiple languages via `lang` param)
- Dynamic content from DB (medicine names, order details) — keep as-is
- Email templates (can be a separate task)

---

## 5. Implementation Phases

### Phase 1: Foundation

1. Add `preferred_language` to User model + migration
2. Update RegisterRequest, ProfileUpdate, UserProfile schemas
3. Update auth service (register, profile update, me)
4. Install and configure `react-i18next` + `i18next`
5. Create `en.json`, `hi.json`, `mr.json` with a minimal set of keys (auth, common)
6. Add LanguageProvider and wrap App
7. Add language selector to Login (signup mode) and ProfilePage

### Phase 2: Core Pages

1. Translate Login, Landing, Sidebar, Header
2. Translate ProfilePage, QuickStartPage, Dashboard
3. Translate ChatPage / UnifiedChatShell (static UI only)
4. Translate Cart, Order History, Notifications

### Phase 3: Remaining Pages

1. Translate Prescriptions, Contact Us, Manual Order
2. Translate all modals, toasts, error messages
3. Test all flows in all 3 languages

### Phase 4 (Optional): Admin

1. Translate admin layout, dashboard, tables, modals

---

## 6. File Checklist

### Backend

- [ ] `app/models/user.py` — add `preferred_language`
- [ ] `alembic/versions/add_preferred_language.py` — migration
- [ ] `app/schemas/auth.py` — RegisterRequest, ProfileUpdate, UserProfile
- [ ] `app/services/auth_service.py` — register, update_profile, me

### Frontend

- [ ] `package.json` — add `react-i18next`, `i18next`
- [ ] `src/locales/en.json`, `hi.json`, `mr.json`
- [ ] `src/context/LanguageContext.jsx` or i18n config
- [ ] `src/App.jsx` — wrap with I18nextProvider
- [ ] `src/pages/Login.jsx` — language selector in signup
- [ ] `src/pages/user/ProfilePage.jsx` — language selector
- [ ] All pages/components — replace strings with `t()`

---

## 7. Language Selector UI

### Registration (Signup)

- Place after role selection or before form fields
- Label: "Preferred Language" / "भाषा" / "भाषा"
- Dropdown or 3 buttons: English | हिंदी | मराठी

### Profile

- New section: "Preferred Language"
- Same 3 options
- On change: call `PATCH /auth/me` with `preferred_language` → update AuthContext → `i18n.changeLanguage(code)` → components re-render

---

## 8. Persistence & Sync

- **DB:** `users.preferred_language` (source of truth for logged-in users)
- **AuthContext:** Read from user on login/me; update on profile change
- **i18next:** `i18n.changeLanguage(user.preferred_language)` when user logs in or changes language
- **Guest:** Use `localStorage` key e.g. `preferred_language` for landing/login until they register

---

## 9. Edge Cases

- **New user without selection:** Default to `en`
- **Invalid value in DB:** Fallback to `en`
- **Profile update fails:** Keep current language; show error toast
- **RTL:** Hindi and Marathi are LTR; no RTL changes needed

---

## 10. Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1 (Foundation) | 2–3 hours |
| Phase 2 (Core pages) | 3–4 hours |
| Phase 3 (Remaining) | 2–3 hours |
| Phase 4 (Admin, optional) | 1–2 hours |
| **Total** | ~8–12 hours |

---

## 11. Dependencies

- `react-i18next` (^14.x)
- `i18next` (^23.x)
- `i18next-browser-languagedetector` (optional, for guest detection)

---

## 12. Next Steps

1. Review and approve this plan
2. Create a feature branch, e.g. `feature/multi-language`
3. Execute Phase 1
4. Test registration and profile language change
5. Proceed with Phases 2 and 3

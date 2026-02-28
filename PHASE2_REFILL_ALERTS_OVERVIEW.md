# Phase 2: Refill Alerts Full UI — Overview

---

## 1. What Are Refill Alerts?

Refill alerts remind users when to reorder medicines based on their last purchase date. For example:

- **Medicine:** Metformin 500mg  
- **Last purchased:** Jan 26, 2025  
- **Suggested refill:** Feb 26, 2025  

The system shows this so users don’t run out of medication.

---

## 2. Where They Fit in the Project

```
User flow:
┌─────────────────┐     ┌─────────────────────┐
│ Dashboard       │ ──► │ Notifications Page  │
│ "X refill       │     │ - Refill Alerts     │
│  alerts"        │     │ - Notifications     │
└─────────────────┘     └─────────────────────┘
         │                        │
         │                        ├── View alerts
         │                        ├── Create new alert
         │                        ├── Mark complete
         │                        └── Delete alert
         │
         └── Shows count of active alerts
```

---

## 3. Why We're Doing This

### Current State (Read-Only)

| Capability        | Status |
|-------------------|--------|
| View alerts       | ✅ Via `notificationService.getRefillAlerts()` |
| Create alert      | ❌ No UI |
| Mark complete     | ❌ No UI |
| Delete alert      | ❌ No UI |
| Dashboard count   | ❌ Uses `MOCK_REFILL_ALERTS.length` |

### Target State (Full CRUD)

| Capability        | Status |
|-------------------|--------|
| View alerts       | ✅ From `refillAlertService.getAll()` |
| Create alert      | ✅ Form with medicine, dates |
| Mark complete     | ✅ Button on each card |
| Delete alert      | ✅ Button on each card |
| Dashboard count   | ✅ From API |

### Benefits

1. **Use backend fully** — Backend already has CRUD; frontend was read-only.
2. **Better UX** — Users can create, complete, and remove alerts.
3. **Accurate counts** — Dashboard shows real refill alert count.
4. **Less mock data** — Remove `MOCK_REFILL_ALERTS` usage.

---

## 4. Backend API (Already Implemented)

| Method | Path                          | Purpose                    |
|--------|-------------------------------|----------------------------|
| POST   | `/refill-alerts`              | Create alert               |
| GET    | `/refill-alerts`              | List alerts (paginated)     |
| PATCH  | `/refill-alerts/{id}/complete`| Mark as completed          |
| DELETE | `/refill-alerts/{id}`         | Delete alert               |

### Create payload

```json
{
  "medicine_id": "uuid",
  "last_purchase_date": "2025-01-26",
  "suggested_refill_date": "2025-02-26"
}
```

### Alert object (from API)

```json
{
  "id": "uuid",
  "medicine_id": "uuid",
  "medicine_name": "Metformin 500mg",
  "last_purchase_date": "2025-01-26",
  "suggested_refill_date": "2025-02-26",
  "is_completed": false,
  "is_due": true
}
```

---

## 5. Implementation Plan

### Step 1: Create `refillAlertService.js`

- `create(payload)` → `POST /refill-alerts`
- `getAll(params)` → `GET /refill-alerts?page=&limit=&include_completed=`
- `complete(id)` → `PATCH /refill-alerts/{id}/complete`
- `delete(id)` → `DELETE /refill-alerts/{id}`

### Step 2: Update `NotificationsPage.jsx`

- Replace `notificationService.getRefillAlerts()` with `refillAlertService.getAll()`
- Add `fetchAlerts()` and call it after create/complete/delete
- Add "Create Refill Alert" form (medicine dropdown, last purchase date, suggested refill date)
- Pass `onComplete` and `onDelete` to `AlertPanel`

### Step 3: Update `AlertPanel.jsx` and `RefillAlertCard.jsx`

- Add "Mark complete" and "Delete" buttons
- Use `alert.id` for `key` instead of index
- Style completed alerts (e.g. dimmed, strikethrough)
- Wire `onComplete` and `onDelete` to `refillAlertService`

### Step 4: Update `Dashboard.jsx`

- Fetch refill count from `refillAlertService.getAll()`
- Replace `MOCK_REFILL_ALERTS.length` with real count
- Handle loading/error states

### Step 5: Improve "Reorder" (Optional)

- Navigate to `/user/medicines` with search for that medicine, or add to cart
- Can be done in a later polish phase

---

## 6. File Changes Summary

| File                     | Action   |
|--------------------------|----------|
| `refillAlertService.js`  | Create   |
| `NotificationsPage.jsx`   | Modify   |
| `AlertPanel.jsx`         | Modify   |
| `Dashboard.jsx`          | Modify   |
| `notificationService.js` | Modify   | Remove `getRefillAlerts` (optional; can keep for backward compat) |

---

## 7. UI Sketch

### Create form (on NotificationsPage)

```
┌─────────────────────────────────────────┐
│ + Create Refill Alert                   │
├─────────────────────────────────────────┤
│ Medicine:     [Dropdown: Metformin ▼]   │
│ Last purchase: [2025-01-26]            │
│ Suggested refill: [2025-02-26]          │
│                    [Create]             │
└─────────────────────────────────────────┘
```

### Alert card (updated)

```
┌─────────────────────────────────────────┐
│ 🕐 Metformin 500mg                      │
│    Last ordered: Jan 26, 2025          │
│    Suggested refill: Feb 26, 2025       │
│    [Reorder] [✓ Complete] [🗑 Delete]   │
└─────────────────────────────────────────┘
```

---

## 8. Edge Cases

| Case                    | Handling                                      |
|-------------------------|-----------------------------------------------|
| No medicines in dropdown| Fetch from `medicineService.getAll()`         |
| Invalid dates            | Validate: suggested ≥ last_purchase          |
| API error on create      | Show toast, keep form open                    |
| Completed alerts         | Filter by default; optional "Show completed"  |
| User not logged in       | Refill alerts require auth; show empty or login|

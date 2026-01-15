# Bug Fix Specification

## Issue 1: Calculation Mismatch Between Trips-Lab and Operator Feed

**Status:** LIKELY FIXED (by Issue 3 fix)

**Problem:**
- Profit/loss and realised profit/loss values in trips-lab did not match the sum of events shown in the operator feed
- Cross-referencing the operator feed with trips-lab creator showed different values

**Root Cause:**
The graph calculation in `calculateProfitLossForTrip()` was using `tripCreationCost` as the baseline for the first outcome, instead of the server-calculated `tripValueChange`. This caused mismatches when:
1. Manual funding was added between trip creation and first visit
2. The first outcome's value change was compared to `tripCreationCost` instead of actual pre-outcome balance

**Fix Applied:**
- Changed `helpers.ts` to use `outcome.tripValueChange` directly instead of recalculating
- This aligns the graph with the stores.ts calculations and operator feed values

**Files Changed:**
- `packages/client/src/lib/components/Admin/helpers.ts`

---

## Issue 2: Operator Feed Scroll Not Working

**Status:** FIXED

**Problem:**
- Cannot scroll up in the operator feed
- Scroll gesture was completely ignored (nothing happened)
- Desktop only, `/operator-feed` route

**Root Cause:**
The "initial scroll to bottom" `$effect` in `FeedMessages.svelte` was running continuously whenever `$visibleMessages` changed, not just on mount. This kept scrolling to bottom, fighting user's scroll attempts.

**Fix Applied:**
- Added `hasInitiallyScrolled` flag to ensure the initial scroll effect only runs once
- The scroll-to-bottom now only triggers on mount, not on every message update

**Files Changed:**
- `packages/client/src/lib/components/OperatorFeed/Feed/FeedMessages.svelte`

---

## Issue 3: Manual Funding Shows as Profit

**Status:** FIXED

**Problem:**
- When adding funds to a trip via the admin panel, the added amount incorrectly appeared as profit in trips-lab graph

**Root Cause:**
In `calculateProfitLossForTrip()` (helpers.ts), the code was calculating `valueChange` as:
```typescript
const previousOutcomeValue = previousOutcome?.tripValue || Number(trip.tripCreationCost)
const valueChange = currentTripValue - previousOutcomeValue
```

For the first outcome, this used `tripCreationCost` as baseline instead of the actual trip balance. When manual funding was added, the difference showed as profit.

Example:
- Trip created with 1000 tokens
- Manual funding adds 500 → balance = 1500
- Rat visits, trip loses 300 → balance = 1200
- Old calculation: 1200 - 1000 = +200 (WRONG - shows profit!)
- Correct calculation: outcome.tripValueChange = -300 (shows loss)

**Fix Applied:**
- Changed `helpers.ts` to use `outcome.tripValueChange` directly:
```typescript
const valueChange = outcome.tripValueChange ?? 0
```

This matches the server-calculated value which correctly accounts for the actual balance before each outcome.

**Files Changed:**
- `packages/client/src/lib/components/Admin/helpers.ts`

---

## Summary of Fixes

| Issue | Status | File Changed |
|-------|--------|--------------|
| Issue 1 | Fixed (via Issue 3) | helpers.ts |
| Issue 2 | Fixed | FeedMessages.svelte |
| Issue 3 | Fixed | helpers.ts |

All three issues have been addressed. Issue 1 was likely caused by the same root cause as Issue 3 (the graph miscalculation).

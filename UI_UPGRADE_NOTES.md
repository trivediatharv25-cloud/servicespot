# UI/UX upgrade notes

Drop these files over your existing project (same paths), then `npm install` is NOT needed -
no new dependencies were added.

## New files
- client/src/utils/format.js            date/time/currency helpers (en-IN)
- client/src/components/ui.jsx          StatCard, Tabs, EmptyState, DateBlock, StatusBadge, skeletons
- client/src/components/BrowseFilters.jsx  filter panel (desktop sidebar) + mobile bottom sheet

## Rewritten
- components/Navbar.jsx        mobile drawer, account dropdown (clicking your name no longer logs you out)
- pages/BrowseServices.jsx     sort, price + rating filters, removable filter chips, result count,
                               sticky search bar, shimmer skeletons, error state, slots grouped by day,
                               select-then-confirm booking, slots shown above reviews on mobile
- pages/UserDashboard.jsx      stat cards, Upcoming/Past/Cancelled tabs, inline cancel confirmation,
                               hides Cancel inside the 2-hour window
- pages/ProviderDashboard.jsx  stat cards, Bookings/Manage/Calendar tabs, "Your services" list,
                               end time auto-fills from service duration, success/error messages
- components/ProviderCalendar.jsx  legend, day view by default on phones, taller responsive height
- components/SlotCard.jsx      now a selectable time pill

## Edited
- components/ServiceCard.jsx   "Free" label + duration
- components/ReviewsList.jsx   removed outer top margin (grid gap handles spacing)
- tailwind.config.js           added ink-200 / ink-400 / ink-600 (these classes were used in the
                               old code but never defined, so they silently did nothing)
- index.css                    skeleton, sheet/drawer animations, live dot (all respect reduced motion)
- index.html                   theme-color meta

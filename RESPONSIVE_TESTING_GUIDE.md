# Responsive Design Testing Guide

## Quick Testing in Browser

### Chrome DevTools
1. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
2. Click the device toggle icon (or press `Cmd+Shift+M`)
3. Test these preset devices:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad Mini (768px)
   - iPad Air (820px)
   - Desktop (1280px+)

### Manual Breakpoint Testing
In DevTools responsive mode, test these specific widths:
- **320px**: Smallest phones
- **375px**: iPhone SE, small phones
- **390px**: iPhone 12/13/14
- **640px**: Tailwind `sm` breakpoint
- **768px**: Tailwind `md` breakpoint (tablets)
- **1024px**: Tailwind `lg` breakpoint (desktops)
- **1280px**: Tailwind `xl` breakpoint

---

## What to Look For

### Landing Page (`/`)
- [ ] Hero text scales properly (not too small, not overlapping)
- [ ] Avatars and stars display correctly
- [ ] Feature sections stack on mobile, side-by-side on desktop
- [ ] Stats cards don't wrap awkwardly
- [ ] Images resize and maintain aspect ratio
- [ ] Badges and buttons are centered on mobile

### Navigation (Header)
- [ ] Logo visible on all sizes
- [ ] Desktop nav shows on screens ≥ 768px
- [ ] Hamburger menu appears on screens < 768px
- [ ] Mobile menu slides down smoothly
- [ ] Mobile menu closes when clicking a link
- [ ] No layout shift when toggling menu

### Dashboard (`/dashboard`)
- [ ] Metric cards arrange: 1 col (mobile), 2 cols (tablet), 4 cols (desktop)
- [ ] "Filters" floating button appears on mobile
- [ ] Sidebar slides in from left on mobile
- [ ] Backdrop overlay appears behind sidebar on mobile
- [ ] Tabs scroll horizontally on small screens
- [ ] Tab labels shorten on mobile (e.g., "List" vs "Property List")
- [ ] Property cards stack nicely on mobile
- [ ] Map view fills screen appropriately

### Laws (`/laws`)
- [ ] Jurisdictions button visible and toggles sidebar on mobile
- [ ] Sidebar slides in/out smoothly
- [ ] Backdrop appears behind sidebar on mobile
- [ ] Page title and description wrap properly
- [ ] Filter bar stacks on mobile (search on top, dropdown below)
- [ ] Topic cards arrange: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- [ ] Detail modal fits on small screens without scrolling header
- [ ] Modal content is readable and not cramped

---

## Common Issues to Check

### Typography
- ✅ All text is readable (not too small)
- ✅ Headings scale appropriately
- ✅ No text overflow or truncation (unless intended)
- ✅ Line heights provide good readability

### Layout
- ✅ No horizontal scrolling (unless intentional, like tabs)
- ✅ Elements don't overlap
- ✅ Proper spacing between sections
- ✅ Cards and containers have adequate padding

### Interactions
- ✅ Buttons are large enough to tap (44x44px minimum)
- ✅ Sidebars open/close smoothly
- ✅ Animations don't lag or stutter
- ✅ Hover states work on desktop
- ✅ Touch targets don't conflict

### Images & Icons
- ✅ Images scale proportionally
- ✅ Icons remain visible and centered
- ✅ SVG animations work on all sizes
- ✅ Images don't appear stretched or pixelated

---

## Testing Commands

### Start Development Server
```bash
cd leasewise-app
npm run dev
```

### Access from Mobile Device (same network)
1. Find your computer's local IP:
   - Mac: `ifconfig | grep "inet "` (look for 192.168.x.x)
   - Windows: `ipconfig` (look for IPv4 Address)
2. On mobile browser, visit: `http://YOUR_IP:3000`

---

## Lighthouse Testing (Performance & Accessibility)

### Run Lighthouse Audit
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Select "Mobile" device
4. Run audit for:
   - Performance
   - Accessibility
   - Best Practices

### Target Scores
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90

---

## Quick Fixes Reference

### If text is too small on mobile:
- Increase base font size: `text-sm md:text-base`
- Use responsive typography: `text-xs sm:text-sm md:text-base`

### If elements overlap:
- Add flex wrapping: `flex-wrap`
- Use responsive flex direction: `flex-col md:flex-row`
- Increase gap: `gap-4 md:gap-6`

### If sidebar doesn't hide on mobile:
- Check for `fixed md:relative`
- Ensure `translate-x-full` is applied when closed
- Verify `z-index` is high enough (z-30+)

### If buttons are too small to tap:
- Increase padding: `px-4 py-3`
- Use minimum height: `min-h-[44px]`
- Add touch-friendly spacing

---

## Browser-Specific Testing

### iOS Safari
- Test with physical device if possible
- Check for rubber-band scrolling issues
- Verify fixed elements behave correctly
- Test tap/click delays

### Android Chrome
- Test on various Android devices (different screen sizes)
- Check keyboard behavior with input fields
- Verify bottom nav doesn't overlap content

### Desktop Browsers
- Test hover states (they don't work on touch)
- Check for sufficient spacing between interactive elements
- Verify keyboard navigation works

---

## Regression Testing Checklist

After any CSS changes, quickly verify:
- [ ] Landing page hero section
- [ ] Dashboard metrics grid
- [ ] Laws page topic cards
- [ ] All mobile menus/sidebars
- [ ] Modal dialogs
- [ ] Forms and inputs

---

## Pro Tips

1. **Use DevTools Throttling**: Simulate slow 3G to test loading states
2. **Test in Portrait & Landscape**: Tablets especially
3. **Check Dark Mode** (if implemented): Colors should adapt
4. **Test with Real Content**: Use actual data, not placeholders
5. **Zoom In/Out**: Some users increase browser zoom (150%, 200%)

---

## Resources

- [Tailwind Breakpoints](https://tailwindcss.com/docs/responsive-design)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)


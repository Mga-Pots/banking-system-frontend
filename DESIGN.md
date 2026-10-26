---
name: sinop
description: A calm, exact digital bank that keeps your money in order, in deep pine green with one fresh-mint signal.
colors:
  deep-pine: "#0b4a3b"
  deeper-pine: "#063b30"
  pine-green: "#0f6f59"
  night-pine: "#04241c"
  fresh-mint: "#1fd88e"
  mint-wash: "#d8f2e6"
  paper-cool: "#f3f6f5"
  field-wash: "#f5faf7"
  field-edge: "#739586"
  hairline: "#e2e9e6"
  midnight-slate: "#0f172a"
  label-slate: "#334155"
  quiet-slate: "#5b6475"
  placeholder-gray: "#6b7280"
  alert-red: "#b91c1c"
  sea-glass: "#a4e0cb"
  mist-mint: "#d3f0e4"
  ground-mist: "#eef7f3"
  bright-jade: "#2bb38a"
  line-sage: "#d3e2d9"
  pending-wash: "#fbeccb"
  pending-ink: "#7a4a05"
  completed-ink: "#0d5a46"
  failed-wash: "#fee2e2"
  cancelled-wash: "#f1f5f9"
  cancelled-ink: "#475569"
  flagged-wash: "#ffedd5"
  flagged-ink: "#9a3412"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  numeric:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "0.05em"
  wordmark:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.8px"
rounded:
  input: "12px"
  card: "16px"
  panel: "20px"
  dialog: "24px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.deep-pine}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.deeper-pine}"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "{colors.deep-pine}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-accent:
    backgroundColor: "{colors.fresh-mint}"
    textColor: "{colors.deeper-pine}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.10)"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  panel-balance:
    backgroundColor: "{colors.deep-pine}"
    textColor: "#ffffff"
    rounded: "{rounded.panel}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.field-wash}"
    textColor: "{colors.midnight-slate}"
    rounded: "{rounded.input}"
    height: "48px"
    padding: "0 16px"
  nav-item:
    textColor: "{colors.label-slate}"
    rounded: "{rounded.input}"
    height: "48px"
    padding: "0 14px"
  nav-item-active:
    backgroundColor: "{colors.mint-wash}"
    textColor: "{colors.deep-pine}"
  badge-completed:
    backgroundColor: "{colors.mint-wash}"
    textColor: "{colors.completed-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-pending:
    backgroundColor: "{colors.pending-wash}"
    textColor: "{colors.pending-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-failed:
    backgroundColor: "{colors.failed-wash}"
    textColor: "{colors.alert-red}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: sinop

## Overview

**Creative North Star: "The Tidy Ledger"**

sinop's name comes from *masinop sa pera*: careful, thrifty, orderly with money. The interface behaves like a well-kept ledger turned into software. Everything is accounted for, every figure sits where you expect it, and nothing is there to impress. The mood is crisp, modern and confident: a flat, cool page, white panels held by hairlines, and a single deep-green banner that carries the balance. Numbers are the heroes, set in a geometric face and aligned so a column of amounts reads at a glance.

The system is deliberately quiet so that meaning can come from the few things that do speak: green for money coming in, red for money going out, gray and struck through for money that never moved, and one fresh-mint signal for "go" and "active". Warmth does not come from decoration. It comes from small touches of Filipino voice (a *Magandang gabi* greeting, a woven-mat pattern behind the balance) set inside an otherwise precise frame.

It is an Operate surface: people check a balance, move money and review history. Scanability, consistency and trust outrank expression, and brand lives in precise details.

**Key Characteristics:**
- Flat, cool near-white page; white panels with hairline borders; no resting shadows.
- One deep-green banner as the anchor, with a faint woven diamond pattern fading in from the right.
- Money digits in Sora; the peso sign and the centavos set smaller and lighter, like a printed ledger.
- Color carries meaning (in, out, never moved), never decoration.
- Pill-shaped actions; softly rounded containers; circular avatars and icons.
- Light Taglish voice in warm moments only; money rules and errors stay in plain English.

## Colors

A deep pine-teal family (not a stock green scale) on a cool near-white page, with one bright mint accent and a small set of status colors.

### Primary
- **Deep Pine** (#0b4a3b): the anchor. The balance banner, primary buttons, headings, the selected recipient, and the logo tile. White text on it is 10.2:1.
- **Deeper Pine** (#063b30): the darker step of the same family. Button hover, the toast background, and the text color placed on Fresh Mint.
- **Pine Green** (#0f6f59): the working mid-green. Links, incoming amounts, and focus outlines on light surfaces. It is 6.1:1 on white and 5.2:1 on Mint Wash.
- **Night Pine** (#04241c): the darkest stop, used only inside the details-dialog card back.

### Secondary
- **Fresh Mint** (#1fd88e): the one bright signal. The Transfer button on the banner, the ACTIVE pill outline, focus rings and the check on dark surfaces. It is 5.5:1 on Deep Pine, but only about 1.9:1 on white, so it never appears as text or a line on white.

### Neutral
- **Paper Cool** (#f3f6f5): the page behind the cards. A very light gray with a faint green cast.
- **Mint Wash** (#d8f2e6): the quiet green tint. Active navigation item, recipient circles, the avatar, the completed badge.
- **Field Wash** (#f5faf7): the fill of inputs and row hover.
- **Field Edge** (#739586): input and secondary-button borders, set at 3:1 against the field fill and white so form boundaries are visible.
- **Hairline** (#e2e9e6): borders on cards, header buttons, the sidebar and row dividers. Decorative separation only.
- **Midnight Slate** (#0f172a): body text and outgoing-neutral text. **Label Slate** (#334155) for greetings and nav; **Quiet Slate** (#5b6475) for meta lines and hints; **Placeholder Gray** (#6b7280) at 4.6:1 on the field fill.
- **Alert Red** (#b91c1c): errors and money going out (6.5:1 on white).

### Status
- **Completed**: Mint Wash with Completed Ink (#0d5a46). **Pending**: Pending Wash (#fbeccb) with Pending Ink (#7a4a05), a warm yellow that also marks "on hold". **Failed**: Failed Wash (#fee2e2) with Alert Red. **Cancelled**: Cancelled Wash (#f1f5f9) with Cancelled Ink (#475569). **Flagged / frozen**: Flagged Wash (#ffedd5) with Flagged Ink (#9a3412).

### Sign-in surface
The sign-in and register pages keep a softer palette: Sea Glass (#a4e0cb), Mist Mint (#d3f0e4) and Ground Mist (#eef7f3) in a pale brand panel gradient, Bright Jade (#2bb38a) for input focus, and Line Sage (#d3e2d9) for borders. They share Deep Pine, the logo and the mint accent with the dashboard.

### Named Rules
**The Signal Rule.** Fresh Mint is a fill, or a line on dark green. It is never text or a border on white. Its rarity is what makes "go" and "active" readable.

**The Meaning-by-Color Rule.** Green means money in, red means money out, gray with a strikethrough means money that never moved (failed or cancelled, no sign). Color is never used to decorate an amount.

**The Cool Paper Rule.** The page behind the cards is a cool near-white. Warm or cream page backgrounds were tried and rejected.

## Typography

**Display and numerals font:** Sora (with ui-sans-serif, system-ui, sans-serif). Loaded at weights 500, 600 and 700.
**Body font:** Plus Jakarta Sans (with the same fallbacks). Loaded at 400 to 800.

**Character:** a geometric, slightly wide numeral face for money against a friendly humanist sans for everything else. Sora makes figures feel measured and exact; Plus Jakarta keeps the words approachable.

### Hierarchy
- **Display** (Sora 700, 38px, line-height 1, tracking -0.01em): the available balance only. The peso sign and the centavos are set at 0.62em, weight 500.
- **Headline** (Plus Jakarta Sans 700, 28px, line-height 1.25): the first name in the greeting; page titles on placeholder pages.
- **Title** (Plus Jakarta Sans 700, 20px, line-height 1.4): card and section headings such as "Recent transactions" and the Period value.
- **Numeric** (Sora 600, 20px for totals and the review amount at larger sizes; 15px for transaction row amounts): money in tables and summaries.
- **Body** (Plus Jakarta Sans 400 to 600, 15px, line-height 1.5): row titles at 600; meta lines (date, reference) at 14px in Quiet Slate; input text at 15px. Measure is short; nothing wraps past a card.
- **Label** (Plus Jakarta Sans 700, 12px, tracking 0.05em, uppercase): PERIOD, MONEY OUT, MONEY IN, the ACTIVE and FROZEN pills.
- **Wordmark** (Sora 700, 28px, tracking -0.8px): "sinop", lowercase, always beside the logo tile.

### Named Rules
**The Ledger Numerals Rule.** Every peso amount that matters is tabular and in Sora, with the ₱ and the centavos smaller and lighter than the pesos. Never set money in the body face.

**The Weight Restraint Rule.** The dashboard stops at weight 700. Only the sign-in pages still use 800 for their headings; do not copy that.

## Layout

A fixed 232px sidebar on the left (from 768px up) and a fluid main column. Main padding is 16px, then 24px from 640px, then 32px from 1024px. The dashboard is a two-column grid from 1024px: a flexible left column and a 320px right column, with 24px between every card. Below 1024px the right column drops under the left. Below 768px the sidebar becomes a top bar with a menu button that opens the same navigation in a left drawer (280px, at most 85% of the screen).

The balance banner is itself a two-column grid from 768px (balance and actions on the left, the account tile on the right) and stacks below it. Spacing runs on a small scale: 8px inside groups, 16px between related blocks, 24px for card padding and gaps between cards. Rows are about 72px tall, and every interactive control reaches 44px (the hit area is enlarged with padding or an invisible overlay when the visible control is smaller). Density is comfortable, not compact.

## Elevation & Depth

Flat by default. Resting surfaces never carry a shadow: white cards are separated from the cool page by a 1px Hairline border, and the sidebar and top bar by a single hairline rule. Shadows appear only on things that float above the page, and the frosted account tile is the one deliberate exception to flat.

### Shadow Vocabulary
- **Dialog** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`, over a 40% black backdrop): centered dialogs for account details, transaction details and transfer review.
- **Popover** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` plus a 1px Hairline ring): the profile menu.
- **Toast** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): the confirmation toast.
- **Frosted tile** (`backdrop-filter: blur(4px)`, a 1px border at 15% white, and a gradient from 15% to 5% white): the account card on the banner. Frozen accounts desaturate it to 30%.

### Named Rules
**The Float-Only Shadow Rule.** A shadow means "this sits above the page". If a surface rests on the page, it gets a hairline, not a shadow.

## Shapes

A soft but disciplined radius scale, with circles for people and pills for actions. Containers: cards 16px, the balance banner and the verify card 20px, centered dialogs 24px, inputs and navigation items 12px. Buttons, badges, status pills, header buttons, avatars, recipient circles and transaction icons are fully round. Transaction direction icons sit in a 40px circle with a 1px Hairline ring (no tinted squares). The "New" recipient is a dashed circle in Pine Green.

A subtle diamond lattice, inspired by woven banig and inabel mats, is the one recurring texture. It sits behind the balance banner at about 10% white, strongest on the right and fading out, and as a faint radial pattern in the empty state. It is abstract and never carries a flag color.

## Components

### Buttons
Pill-shaped, bold, 14px at 44px high or 15px at 52px high. The focus outline is 2px with a 2px offset, and its color is part of each variant so it stays visible on its surface.
- **Primary:** Deep Pine fill, white text, Deeper Pine on hover. Used for Review transfer, Confirm and Try again.
- **Secondary:** white fill, a 1.5px Field Edge border, Deep Pine text. Used for Cancel and Go back.
- **White:** white fill, Deep Pine text; used on tinted or dark panels such as "Review profile".
- **Accent (on dark green only):** Fresh Mint fill with Deeper Pine text; used for Transfer on the banner. Pine Green focus outline is replaced by a Fresh Mint outline.
- **Ghost (on dark green only):** 10% white fill and a 25% white border; used for Cash in on the banner.
- Disabled buttons drop to 50% opacity and lose their pressed state.

### Status badges and pills
Small pills (12px, bold, 4px by 12px padding) in the status color pairs. Account status uses the same shape in uppercase with wide tracking: ACTIVE on the dark tile is an outlined Fresh Mint pill; FROZEN and CLOSED are filled.

### Cards / Containers
- **Corner Style:** 16px; the banner 20px.
- **Background:** white on the cool page.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px Hairline.
- **Internal Padding:** 24px.

### Inputs / Fields
- **Style:** Field Wash fill, 1.5px Field Edge border, 12px radius, 48px high, 15px text; a bold 14px label above and the hint or error below, linked for screen readers. The peso prefix sits inside the field.
- **Focus:** border turns Pine Green with a 4px Pine Green ring at 20%.
- **Error / Disabled:** the border turns Alert Red; the message is red, 12px, bold; disabled fields drop to 50% opacity.

### Navigation
- **Sidebar:** 232px, white, a hairline on its right edge. The logo and wordmark sit on top with a quiet lowercase tagline, *masinop sa pera*, beneath. Items are 48px high with an icon and 14px semibold text; the active item is a Mint Wash fill with Deep Pine text. The verify card sits at the bottom until staff verify the customer.
- **Header:** the greeting (a small Filipino salutation above the first name) on the left; on the right three 44px circular buttons with a hairline border: notifications with an unread badge, an avatar with initials, and settings. The avatar opens a small popover.
- **Mobile:** a top bar with a menu button and the logo; the sidebar opens as a left drawer.

### Dialogs
Native `<dialog>` elements, centered, up to 440px wide, 24px radius, a 24px padded body and a 44px close button. They trap focus, close on Esc or a click on the backdrop, and restore focus to what opened them.

### Account tile (signature)
A frosted glass tile on the deep-green banner: the sinop wordmark and the account status pill on top, the 12-digit account number in the middle with a copy button, the holder name and a "View Details" link at the bottom. The number can be hidden by the privacy switch, which masks it to its last four digits. The back (Valid thru, CVC, number, holder, status, date opened) appears in a dialog and uses a darker gradient card.

### Transaction row (signature)
A full-width button: a hairline-ringed direction icon, a semibold title ("To Pedro G.", "From Luis S.", "Cash in"), a meta line with the date (and the reference number from 640px up), a status badge, and a right-aligned Sora amount. Incoming amounts are Pine Green with a plus; outgoing are Alert Red with a minus; failed and cancelled are Quiet Slate, struck through, with no sign.

## Do's and Don'ts

### Do:
- **Do** set money in Sora with tabular numerals, and the ₱ and centavos at 0.62em.
- **Do** wrap balances, account numbers and totals in the privacy component so one switch hides them all.
- **Do** keep green for money in, red for money out, and gray with a strikethrough for money that never moved.
- **Do** use Pine Green outlines on light surfaces and Fresh Mint outlines on dark green.
- **Do** give every control a 44px target; enlarge the hit area instead of the visible control when needed.
- **Do** separate resting surfaces with a 1px Hairline, and keep Field Edge for form fields.
- **Do** keep Filipino words in warm moments only (greeting, success, empty state, a few labels), marked with `lang="fil"`.

### Don't:
- **Don't** use Fresh Mint as text or a line on white.
- **Don't** put a warm or cream tint behind the cards.
- **Don't** add shadows to resting cards.
- **Don't** show a minus sign, or a colored amount, on a failed or cancelled transaction.
- **Don't** use tinted rounded-square icon tiles, colored side stripes, or gradient text.
- **Don't** reintroduce stock Tailwind greens or the original lime and gold accents.
- **Don't** make money rules, errors, or frozen and held states cute or bilingual; keep them in plain English.
- **Don't** use weight 800 in new work.

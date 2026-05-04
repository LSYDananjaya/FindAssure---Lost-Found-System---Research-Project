# FindAssure Mobile App

FindAssure is a React Native and Expo mobile application for lost-and-found recovery. The interface is designed around trust, clarity, and calm guided flows so users can report found items, search for lost items, and complete ownership verification without exposing sensitive handoff details too early.

## Stack

- Expo Router with React Native
- TypeScript
- React Navigation
- `expo-linear-gradient` for brand surfaces
- `react-native-reanimated` for button and entrance motion
- Theme context with light, dark, and system preference support

## Design Direction

The visual language is intentionally clean and reassurance-focused:

- Trust-first visual tone built around blue accents rather than loud promotional colors
- Soft iOS-style neutrals for backgrounds and elevated cards
- Rounded cards and pill controls to reduce visual harshness
- Glass-style surfaces for hero sections and elevated content blocks
- Clear status signaling using success, warning, and danger tones
- Short guided copy and step-based flows for reporting, matching, and verification

## Theme System

The main design tokens live in [src/theme/designSystem.ts](/C:/Users/USER/Documents/SE%20Projects/RP/Final%20Implementation/FindAssure---Lost-Found-System---Research-Project/FindAssure/src/theme/designSystem.ts) and are exposed through [src/context/ThemeContext.tsx](/C:/Users/USER/Documents/SE%20Projects/RP/Final%20Implementation/FindAssure---Lost-Found-System---Research-Project/FindAssure/src/context/ThemeContext.tsx).

### Theme behavior

- Supports `light`, `dark`, and `system`
- Stores the user preference in AsyncStorage under `findassure.themePreference`
- Syncs the app background with the active theme via `expo-system-ui`
- Updates React Navigation colors from the same token source

### Typography

Current runtime fonts use platform system families for consistency and reliability:

- Hero: `System` / `sans-serif-medium`
- Display: `System` / `sans-serif-medium`
- Body: `System` / `sans-serif`

Requested brand-facing font direction captured in the token file:

- Hero: `Monument Extended`
- Display: `Clash Display`
- Body: `Syne`

### Spacing scale

- `xs`: 6
- `sm`: 8
- `md`: 12
- `lg`: 16
- `xl`: 20
- `xxl`: 28
- `xxxl`: 36

### Radius scale

- `sm`: 12
- `md`: 18
- `lg`: 24
- `xl`: 28
- `pill`: 999

### Motion

- Primary spring: damping `18`, stiffness `180`, mass `0.8`
- Soft spring: damping `20`, stiffness `140`, mass `0.9`
- Durations: `180ms`, `320ms`, `520ms`

## Theme Palette

### Light palette

| Token | Value |
| --- | --- |
| Background | `#F2F2F7` |
| Background muted | `#F7F8FA` |
| Background elevated | `#EEF1F5` |
| Card | `#FFFFFF` |
| Card muted | `#F7F8FA` |
| Text | `#111827` |
| Text strong | `#0F172A` |
| Text muted | `#64748B` |
| Text subtle | `#6B7280` |
| Border | `rgba(60, 60, 67, 0.12)` |
| Border strong | `rgba(60, 60, 67, 0.18)` |
| Primary / Accent | `#007AFF` |
| Primary deep | `#005FCC` |
| Primary soft | `#EAF3FF` |
| Success | `#16A34A` |
| Success soft | `#DCFCE7` |
| Warning | `#D97706` |
| Warning soft | `#FEF3C7` |
| Danger | `#D92D20` |
| Danger soft | `#FEE2E2` |
| On tint | `#FFFFFF` |
| Glass | `rgba(255,255,255,0.94)` |
| Glass strong | `#FFFFFF` |

### Dark palette

| Token | Value |
| --- | --- |
| Background | `#0E1117` |
| Background muted | `#141923` |
| Background elevated | `#1A2230` |
| Card | `#151B26` |
| Card muted | `#111722` |
| Text | `#F5F7FB` |
| Text strong | `#FFFFFF` |
| Text muted | `#CBD5E1` |
| Text subtle | `#94A3B8` |
| Border | `rgba(148, 163, 184, 0.18)` |
| Border strong | `rgba(148, 163, 184, 0.3)` |
| Primary / Accent | `#4C9BFF` |
| Primary deep | `#7DB7FF` |
| Primary soft | `rgba(76, 155, 255, 0.18)` |
| Success | `#34D399` |
| Success soft | `rgba(52, 211, 153, 0.18)` |
| Warning | `#F59E0B` |
| Warning soft | `rgba(245, 158, 11, 0.18)` |
| Danger | `#F87171` |
| Danger soft | `rgba(248, 113, 113, 0.18)` |
| On tint | `#FFFFFF` |
| Glass | `rgba(21,27,38,0.92)` |
| Glass strong | `#151B26` |

### Gradient palette

| Gradient | Light | Dark |
| --- | --- | --- |
| App background | `#F7F8FB -> #F2F4F8 -> #F7F8FB` | `#0B1018 -> #111722 -> #0E1117` |
| Hero | `#0E5ADB -> #3882F2 -> #71B7FF` | `#143A73 -> #1C5BB5 -> #3C84E6` |
| Hero alt | `#1C64E7 -> #4C8DFE -> #8EC6FF` | `#15345E -> #2A5D95 -> #4897D8` |
| Success | `#1B9C57 -> #4EBC7D -> #7BDAA2` | `#146B4A -> #1B9C57 -> #41C27F` |
| Warning | `#D97706 -> #E9A74B -> #F1BF72` | `#9A5A00 -> #C77C16 -> #E4A645` |
| Violet feature | `#4D84F0 -> #7BA8FA -> #A8C9FF` | `#253C77 -> #415FB1 -> #7696E8` |

## Component Styling Notes

### Core patterns

- `GlassCard`: rounded elevated surface with border and soft shadow
- `PrimaryButton`: pill button with `primary`, `secondary`, `ghost`, and `danger` variants
- `FeatureCard`: gradient promotional card with tinted icon capsule
- Hero sections: layered gradients, glow shapes, status pills, and high-contrast white-on-blue text

### Home screen direction

The home screen uses a blue gradient hero, compact trust badges, calm action cards, and a simple three-step recovery explanation:

1. Report
2. Match
3. Verify

This keeps the app aligned with its core promise: proof-first recovery with less friction and less exposure of personal contact details.

### Admin tone

The admin area reuses the same base theme but shifts emphasis toward moderation cues:

- Danger red is used as the admin accent
- Warning highlights moderation and pending-review states
- Role and status chips reuse the shared semantic palette for consistency

## Source of Truth

If you update the design system, keep these files aligned:

- [src/theme/designSystem.ts](/C:/Users/USER/Documents/SE%20Projects/RP/Final%20Implementation/FindAssure---Lost-Found-System---Research-Project/FindAssure/src/theme/designSystem.ts)
- [constants/theme.ts](/C:/Users/USER/Documents/SE%20Projects/RP/Final%20Implementation/FindAssure---Lost-Found-System---Research-Project/FindAssure/constants/theme.ts)
- [src/context/ThemeContext.tsx](/C:/Users/USER/Documents/SE%20Projects/RP/Final%20Implementation/FindAssure---Lost-Found-System---Research-Project/FindAssure/src/context/ThemeContext.tsx)
- [src/screens/admin/adminTheme.ts](/C:/Users/USER/Documents/SE%20Projects/RP/Final%20Implementation/FindAssure---Lost-Found-System---Research-Project/FindAssure/src/screens/admin/adminTheme.ts)

## Run

```bash
npm install
npx expo start
```

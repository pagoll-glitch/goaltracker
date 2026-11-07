# Goal It Up — Personal Life & Productivity OS

A personal life-management operating system combining Notion, a habit tracker, a goal planner, an interactive calendar, a Pomodoro focus timer, visual analytics, and a daily reflection journal.

Built with an editorial aesthetic featuring soft cream backgrounds, sage green accents, pastel color coding, and typography pairing of serif headings with modern sans-serif body text.

---

## 🌟 Key Features

### 1. Main Dashboard
- **Dynamic Greeting & Time**: Adapts to the time of day with a live calendar date indicator.
- **Productivity Score (0–100%)**: Dynamically calculated in real-time from completed tasks, checked habits, focus session minutes, and journal entries. Rendered as a smooth SVG circular progress ring.
- **Quick Metric Counters**: Tasks done today, habit completion percentage, focus hours logged, and active goals.
- **Daily Motivational Quote**: Hand-curated inspiring affirmations with a one-click shuffle button.
- **Priority Tasks & Daily Habits**: Immediate check-off widgets right from the dashboard.
- **Upcoming Deadlines**: Countdown schedule for tasks due within the next 7 days.

### 2. To-Do List & Task Manager
- **Clean Slate for First-Time Users**: Starts with zero pre-filled tasks; prompts the user with inviting onboarding cards and one-click quick starter ideas (*Plan weekly schedule, 1-hr study session, 30-min workout, Personal catch-up*).
- Full CRUD: Add, edit, delete, and toggle tasks with audio feedback.
- Priorities: High (*Rose*), Medium (*Amber*), Low (*Blue*).
- Categories: Personal, Work, Study, Health, Other.
- Search & Filter: Filter by All, Today, Pending, Completed, Overdue, or Category. Sort by Due Date, Priority, or Title.
- Dual View Modes: Standard List view or 3-column Kanban board (*Upcoming*, *In Progress*, *Completed*).
- Dynamic progress bar tracking task completion percentage.

### 3. Habit Tracker
- **Weekly Matrix**: Mon–Sun grid with interactive check circles for every habit.
- **Streaks & Consistency**: Automatic calculation of current consecutive streak, best streak, and weekly consistency percentage.
- **30-Day Heatmap**: Visual consistency history matrix.
- Preloaded with 7 sample habits: *Read 10 pages*, *Exercise for 30 minutes*, *Drink 2.5L water*, *Study for 2 hours*, *Practice coding*, *Sleep before 11:30 PM*, *Meditate for 10 min*.

### 4. Goals & Target Planner
- **Clean Slate for First-Time Users**: No pre-filled or forced goals; users start with a clean slate to define whatever goals matter to them.
- **Short-Term & Long-Term Goals**: Category tags across Career, Skill, Learning, Finance, Health, and Personal.
- **Measurable Targets**: Numeric units (*books*, *km*, *\$*, *problems*) or percentage (*%*).
- **Sub-Milestones Roadmap**: Break down big objectives into granular checklists that update goal progress.
- **Quick `+` and `-` manual progress adjustment buttons.

### 5. Calendar & Daily Planner
- **3 View Modes**:
  - *Month View*: Full calendar grid with color-coded event markers and due task indicators.
  - *Week View*: 7-day planner column breakdown.
  - *Day View*: Hourly time-blocking schedule (7:00 AM – 9:00 PM) for deep work planning.
- Add and manage scheduled calendar events and meetings.

### 6. Focus & Study Tracker
- **Pomodoro Timer**: Work (25 min default), Short Break (5 min), and Long Break (15 min). Customizable in Settings.
- **Focus Tags**: Categorize focus sprints into *Deep Work*, *Coding*, *Study*, *Writing*, or *Reading*.
- **Offline Audio**: Peaceful Web Audio API synthesized completion chime and rain/pink noise ambient sound generator.
- **Session History & Analytics**: Log of completed focus blocks and daily focus hours vs daily targets.

### 7. Progress & Analytics
- **7-Day Productivity Trend**: Visual bar graph tracking daily composite productivity scores.
- **Focus Time Allocation**: SVG donut chart showing percentage distribution across activities.
- **Habit Consistency Rates**: Per-habit 7-day completion rates with progress tracks.
- **Long-term Goal Completion**: Category-by-category milestone completion progress.

### 8. Journal & Notes
- **Daily Reflection Prompts**: Daily thoughts, 3 daily wins & accomplishments, gratitude log, and key lessons.
- **Mood Tracker**: Select between *Great*, *Good*, *Neutral*, *Tired*, and *Stressed*.
- **Quick Notes / Scratchpad**: Sticky cards with category chips and pin/unpin toggles.

### 9. Smart Daily Planner
- **Available Hours Input**: Slider allows configuring 1 to 12 available hours and start time.
- **Deterministic Prioritization Algorithm**: Evaluates overdue urgency, same-day deadlines, priority levels, and goal linkages (no fake AI; real mathematical scoring).
- **Interactive Schedule Generation**: Builds a time-blocked timeline with cognitive buffer breaks and habit review sprints.
- **1-Click Calendar Commitment**: Accept all or individual blocks directly into the interactive calendar.

### 10. Life Balance Dashboard (Wheel of Life)
- **7 Life Dimensions**: Academics, Career, Health, Fitness, Relationships, Personal development, and Hobbies.
- **Mathematical SVG Radar Chart**: Trigonometric coordinate mapping with concentric polygon levels (2, 4, 6, 8, 10).
- **Interactive Sliders**: Move sliders (1–10) to reshape the polygon in real-time.
- **Balance Harmony Score & History**: Calculates standard deviation variance and stores historical snapshots over time.

### 11. Guided Weekly Reset
- **5-Step Reflection Ritual**:
  1. *What did I accomplish?* (Auto-pulled from completed tasks & focus hours).
  2. *What did I miss?* (Auto-detects overdue tasks and postponed backlog).
  3. *Which habits improved?* (Analyzes streak gains and weekly consistency rates).
  4. *What distracted me?* (Energy leaks and context switching reflection).
  5. *What should I focus on next week?* (Committed goals auto-added to tasks).
- Awards +100 XP upon completion with celebratory chime.

### 12. Achievement & Rewards (Real XP Engine)
- **Real Activity XP**: Earn XP by completing tasks (+15–40 XP), checking habits (+15 XP), logging focus sessions (+1 XP/min), completing milestones (+35 XP), and finishing resets (+100 XP).
- **Level Tiers**: 8 progressive architecture levels with animated progress bars.
- **Badges Catalog**: 8 unlockable milestone badges based on genuine user consistency.
- **Weekly Challenges**: Dynamic challenges tracking focus minutes, priority tasks, and consistency with claimable XP.
- **Personal Records**: Longest focus session, max habit streak, all-time tasks done, and peak score.

### 13. Future Self & Vision Board
- **Vision Statement & Horizons**: 1-Year, 3-Year, and 5-Year timeline horizons.
- **Aspiration Cards**: Visual inspiration cards with image URL presets or custom file uploads (base64).
- **Direct Goal Linkage**: Connects aspirations to measurable goals from the Goal Planner.
- **Vision Realization Percentage**: Aggregate progress automatically calculated from connected goals.

### 14. Overwhelmed Mode (De-Clutter & Single-Task Spotlight)
- **Overload Detection**: Highlights when user has 5+ pending tasks.
- **Zen Triage**: Strips away dashboard noise and isolates the **Top 3 Most Critical Priorities**.
- **Box Breathing Widget**: Guided 4-4-4-4 visual breathing circle to restore cognitive calm.
- **Single-Task Spotlight**: Focuses exclusively on ONE task at a time with a built-in countdown focus timer and step-by-step advance button.

### 15. Settings & Personalization
- **Profile Customization**: Name, tagline, avatar emoji, and daily target focus hours.
- **Theme Switcher**: Soft Cream & Sage (*Light Mode*) vs Dark Slate & Sage (*Dark Mode*).
- **Audio Toggle**: Enable or mute Web Audio API chimes and clicks.
- **Pomodoro Intervals**: Custom durations for work and break blocks.
- **Data Backup & Restore**: Export full state as JSON, import previous backup file, or reset to realistic demo data.

---

## 🚀 How to Run

Because Goal It Up is built with zero runtime dependencies and pure standard web technologies, it can be run instantly in any web browser:

### Option A: Local Python Server
```bash
python3 -m http.server 3000
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B: Direct File Open
Double-click `index.html` or open it directly in Safari, Chrome, Edge, or Firefox.

---

## 🎨 Design System & Color Tokens

- **Foundations**: Soft Cream (`#FAF8F5` / `#F7F5F0`), Card Surfaces (`#FFFFFF`), Dark Mode Surface (`#1D2622`).
- **Sage Palette**: Primary Brand (`#4D6B53`), Sage 100 (`#E3EDE5`), Sage Deep (`#314435`).
- **Pastel Accents**:
  - Pastel Blue: `#EAF2F9` / `#216298`
  - Pastel Rose: `#FDF0F3` / `#B83050`
  - Pastel Amber: `#FEF7E8` / `#AA6507`
  - Pastel Teal: `#EAF8F4` / `#0E7B68`
  - Pastel Purple: `#F4EFFE` / `#663AC4`
- **Typography**: `Playfair Display` serif for editorial headings paired with `Plus Jakarta Sans` for clean UI body text.


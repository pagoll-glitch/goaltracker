/**
 * Storage Manager & State Store
 * Handles persistence with LocalStorage, reactive subscriber updates, and default demo seeds
 */
const Storage = (() => {
  const STORAGE_KEY = 'goal_it_up_os_v5';

  // Helper to format ISO date string (YYYY-MM-DD)
  function getTodayDateStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getPastDateStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getFutureDateStr(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function generateDefaultState() {
    const today = getTodayDateStr();

    return {
      settings: {
        userName: 'Sara',
        userTitle: 'Lifelong Learner & Architect',
        avatar: '🌿',
        theme: 'light', // 'light' or 'dark'
        soundEnabled: true,
        pomodoroWork: 25,
        pomodoroBreak: 5,
        pomodoroLongBreak: 15,
        dailyTargetHours: 6,
        motivationalQuotes: [
          { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
          { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
          { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
          { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
          { quote: "Clarity precedes success. Plan with calm and execute with grace.", author: "Goal It Up Principle" },
          { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" }
        ]
      },
      tasks: [],
      habits: [
        {
          id: 'h-1',
          name: 'Read 10 pages',
          icon: '📖',
          category: 'Study',
          color: 'teal',
          targetFrequency: 'Daily',
          history: {},
          streak: 0,
          bestStreak: 0,
          createdAt: today
        },
        {
          id: 'h-2',
          name: 'Exercise for 30 minutes',
          icon: '🏃',
          category: 'Health',
          color: 'rose',
          targetFrequency: 'Daily',
          history: {},
          streak: 0,
          bestStreak: 0,
          createdAt: today
        },
        {
          id: 'h-3',
          name: 'Drink 2.5L water',
          icon: '💧',
          category: 'Health',
          color: 'blue',
          targetFrequency: 'Daily',
          history: {},
          streak: 0,
          bestStreak: 0,
          createdAt: today
        },
        {
          id: 'h-4',
          name: 'Study for 2 hours',
          icon: '🧠',
          category: 'Study',
          color: 'purple',
          targetFrequency: 'Daily',
          history: {},
          streak: 0,
          bestStreak: 0,
          createdAt: today
        },
        {
          id: 'h-5',
          name: 'Practice coding',
          icon: '💻',
          category: 'Work',
          color: 'amber',
          targetFrequency: 'Daily',
          history: {},
          streak: 0,
          bestStreak: 0,
          createdAt: today
        },
        {
          id: 'h-6',
          name: 'Sleep before 11:30 PM',
          icon: '🌙',
          category: 'Health',
          color: 'blue',
          targetFrequency: 'Daily',
          history: {},
          streak: 0,
          bestStreak: 0,
          createdAt: today
        },
        {
          id: 'h-7',
          name: 'Meditate for 10 min',
          icon: '🧘',
          category: 'Health',
          color: 'teal',
          targetFrequency: 'Daily',
          history: {},
          streak: 0,
          bestStreak: 0,
          createdAt: today
        }
      ],
      goals: [],
      focusSessions: [],
      calendarEvents: [],
      journalEntries: [],
      notes: [],
      lifeBalance: {
        dimensions: {
          'Academics': 7,
          'Career': 7,
          'Health': 7,
          'Fitness': 7,
          'Relationships': 7,
          'Personal development': 7,
          'Hobbies': 7
        },
        history: []
      },
      weeklyResets: [],
      rewards: {
        xp: 0,
        unlockedBadgeIds: [],
        challenges: [
          {
            id: 'c-1',
            title: 'Deep Focus Master',
            desc: 'Log at least 3 hours (180 mins) of focus sprints this week',
            target: 180,
            current: 0,
            unit: 'mins',
            rewardXP: 100,
            completed: false
          },
          {
            id: 'c-2',
            title: 'Priority Finisher',
            desc: 'Complete 5 High-Priority tasks',
            target: 5,
            current: 0,
            unit: 'tasks',
            rewardXP: 80,
            completed: false
          },
          {
            id: 'c-3',
            title: 'Habit Consistency Champion',
            desc: 'Maintain 80% or higher weekly habit consistency',
            target: 80,
            current: 0,
            unit: '%',
            rewardXP: 120,
            completed: false
          }
        ],
        records: {
          longestFocusMins: 0,
          maxHabitStreak: 0,
          maxTasksDay: 0,
          highestProductivityScore: 0
        }
      },
      visionBoard: {
        visionStatement: 'To architect elegant and impactful systems, cultivate deep presence and physical vibrancy, and lead a balanced, authentic life.',
        horizons: {
          oneYear: 'Master cloud & full-stack architecture, publish 3 technical essays, and run a half-marathon.',
          threeYear: 'Attain location-independent engineering leadership, mentor emerging developers, and maintain a resilient emergency fund.',
          fiveYear: 'Build an indie software lab, invest in community projects, and travel for 2 months annually.'
        },
        aspirations: [
          {
            id: 'asp-1',
            title: 'Master Full-Stack Systems & Architecture',
            category: 'Career',
            horizon: '1-Year',
            description: 'Develop deep intuition for scalable distributed design, responsive UI craft, and async state patterns.',
            imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
            linkedGoalIds: []
          },
          {
            id: 'asp-2',
            title: 'Mindful Library & Broad Intellectual Depth',
            category: 'Personal development',
            horizon: '1-Year',
            description: 'Immerse in timeless non-fiction on systems thinking, history, philosophy, and cognitive science.',
            imageUrl: 'https://images.unsplash.com/photo-1507842229451-7f01be44c067?w=600&auto=format&fit=crop&q=80',
            linkedGoalIds: []
          },
          {
            id: 'asp-3',
            title: 'Financial Sovereignty & Emergency Resilience',
            category: 'Finance',
            horizon: '3-Year',
            description: 'Achieve zero consumer debt, robust multi-month liquidity, and autonomous peace of mind.',
            imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80',
            linkedGoalIds: []
          },
          {
            id: 'asp-4',
            title: 'High-Energy Athletic Vitality & Endurance',
            category: 'Fitness',
            horizon: '1-Year',
            description: 'Cultivate lean strength, cardiovascular power through 5K/10K runs, and restorative sleep habits.',
            imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
            linkedGoalIds: []
          }
        ]
      },
      smartPlanner: {
        availableHours: 6,
        startTime: '09:00',
        includeHabits: true,
        includeFocusBlocks: true,
        suggestedSchedule: []
      },
      overwhelmed: {
        active: false,
        selectedTaskIds: [],
        spotlightIndex: 0
      }
    };
  }

  let state = null;
  const subscribers = [];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
        // Ensure all required collections exist if upgrading
        const def = generateDefaultState();
        for (const key in def) {
          if (state[key] === undefined) state[key] = def[key];
        }
      } else {
        state = generateDefaultState();
        saveState();
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, using defaults', e);
      state = generateDefaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      notifySubscribers();
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  function notifySubscribers() {
    subscribers.forEach(fn => {
      try { fn(state); } catch (err) { console.error('Subscriber callback error', err); }
    });
  }

  // Initialize immediately
  loadState();

  return {
    getState() {
      if (!state) loadState();
      return state;
    },

    subscribe(fn) {
      if (typeof fn === 'function') {
        subscribers.push(fn);
      }
    },

    // Tasks CRUD
    addTask(taskData) {
      const task = {
        id: 't-' + Date.now(),
        title: taskData.title || 'Untitled Task',
        category: taskData.category || 'Personal',
        priority: taskData.priority || 'Medium',
        dueDate: taskData.dueDate || getTodayDateStr(),
        dueTime: taskData.dueTime || '12:00',
        completed: false,
        notes: taskData.notes || '',
        createdAt: getTodayDateStr()
      };
      state.tasks.unshift(task);
      saveState();
      return task;
    },

    updateTask(id, updates) {
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        state.tasks[idx] = { ...state.tasks[idx], ...updates };
        saveState();
        return state.tasks[idx];
      }
      return null;
    },

    toggleTask(id) {
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? getTodayDateStr() : null;
        if (task.completed) {
          const xpGain = task.priority === 'High' ? 40 : task.priority === 'Medium' ? 25 : 15;
          this.addXP(xpGain, `Completed task: ${task.title}`);
          this.checkChallengeProgress('tasks', 1, task.priority);
        }
        saveState();
        return task;
      }
      return null;
    },

    deleteTask(id) {
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveState();
    },

    // Habits CRUD
    addHabit(habitData) {
      const habit = {
        id: 'h-' + Date.now(),
        name: habitData.name || 'New Habit',
        icon: habitData.icon || '🌱',
        category: habitData.category || 'Health',
        color: habitData.color || 'teal',
        targetFrequency: habitData.targetFrequency || 'Daily',
        history: {},
        streak: 0,
        bestStreak: 0,
        createdAt: getTodayDateStr()
      };
      state.habits.push(habit);
      saveState();
      return habit;
    },

    updateHabit(id, updates) {
      const idx = state.habits.findIndex(h => h.id === id);
      if (idx !== -1) {
        state.habits[idx] = { ...state.habits[idx], ...updates };
        saveState();
        return state.habits[idx];
      }
      return null;
    },

    toggleHabitDate(id, dateStr) {
      const habit = state.habits.find(h => h.id === id);
      if (habit) {
        if (!habit.history) habit.history = {};
        habit.history[dateStr] = !habit.history[dateStr];
        this.recalculateHabitStreak(habit);
        if (habit.history[dateStr]) {
          const bonus = (habit.streak >= 5) ? 10 : 0;
          this.addXP(15 + bonus, `Completed habit: ${habit.name}`);
        }
        saveState();
        return habit;
      }
      return null;
    },

    recalculateHabitStreak(habit) {
      if (!habit.history) {
        habit.streak = 0;
        return;
      }
      let currentStreak = 0;
      let checkDate = new Date();
      // If today is checked, count today; else start checking yesterday
      const todayStr = getTodayDateStr();
      if (habit.history[todayStr]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Check if yesterday was completed
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const y = checkDate.getFullYear();
        const m = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${day}`;
        if (habit.history[dStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      habit.streak = currentStreak;
      if (currentStreak > (habit.bestStreak || 0)) {
        habit.bestStreak = currentStreak;
      }
    },

    deleteHabit(id) {
      state.habits = state.habits.filter(h => h.id !== id);
      saveState();
    },

    // Goals CRUD
    addGoal(goalData) {
      const goal = {
        id: 'g-' + Date.now(),
        title: goalData.title || 'New Goal',
        type: goalData.type || 'Percentage',
        current: Number(goalData.current) || 0,
        target: Number(goalData.target) || 100,
        unit: goalData.unit || (goalData.type === 'Percentage' ? '%' : 'units'),
        category: goalData.category || 'Career',
        timeframe: goalData.timeframe || 'Short-term',
        targetDate: goalData.targetDate || getFutureDateStr(60),
        description: goalData.description || '',
        milestones: goalData.milestones || []
      };
      state.goals.push(goal);
      saveState();
      return goal;
    },

    updateGoal(id, updates) {
      const idx = state.goals.findIndex(g => g.id === id);
      if (idx !== -1) {
        state.goals[idx] = { ...state.goals[idx], ...updates };
        saveState();
        return state.goals[idx];
      }
      return null;
    },

    toggleMilestone(goalId, milestoneId) {
      const goal = state.goals.find(g => g.id === goalId);
      if (goal && goal.milestones) {
        const m = goal.milestones.find(ms => ms.id === milestoneId);
        if (m) {
          m.completed = !m.completed;
          // If goal is percentage-based, calculate completion from milestones
          if (goal.type === 'Percentage') {
            const completedCount = goal.milestones.filter(ms => ms.completed).length;
            goal.current = Math.round((completedCount / goal.milestones.length) * 100);
          }
          if (m.completed) {
            this.addXP(35, `Milestone reached: ${m.title}`);
          }
          saveState();
          return goal;
        }
      }
      return null;
    },

    deleteGoal(id) {
      state.goals = state.goals.filter(g => g.id !== id);
      saveState();
    },

    // Focus sessions
    addFocusSession(session) {
      const entry = {
        id: 'fs-' + Date.now(),
        date: getTodayDateStr(),
        durationMinutes: session.durationMinutes || 25,
        tag: session.tag || 'Deep Work',
        notes: session.notes || ''
      };
      state.focusSessions.unshift(entry);
      this.addXP(entry.durationMinutes, `Completed ${entry.durationMinutes}m focus sprint`);
      this.checkChallengeProgress('focus', entry.durationMinutes);
      saveState();
      return entry;
    },

    // Calendar Events CRUD
    addCalendarEvent(eventData) {
      const event = {
        id: 'ce-' + Date.now(),
        title: eventData.title || 'Scheduled Event',
        date: eventData.date || getTodayDateStr(),
        startTime: eventData.startTime || '10:00',
        endTime: eventData.endTime || '11:00',
        category: eventData.category || 'Personal',
        color: eventData.color || 'teal',
        description: eventData.description || ''
      };
      state.calendarEvents.push(event);
      saveState();
      return event;
    },

    deleteCalendarEvent(id) {
      state.calendarEvents = state.calendarEvents.filter(e => e.id !== id);
      saveState();
    },

    // Journal CRUD
    saveJournalEntry(entryData) {
      const date = entryData.date || getTodayDateStr();
      const existingIdx = state.journalEntries.findIndex(j => j.date === date);
      const entry = {
        id: existingIdx !== -1 ? state.journalEntries[existingIdx].id : 'j-' + Date.now(),
        date: date,
        mood: entryData.mood || 'good',
        reflection: entryData.reflection || '',
        wins: entryData.wins || '',
        gratitude: entryData.gratitude || '',
        lessons: entryData.lessons || ''
      };

      if (existingIdx !== -1) {
        state.journalEntries[existingIdx] = entry;
      } else {
        state.journalEntries.unshift(entry);
      }
      saveState();
      return entry;
    },

    // Notes CRUD
    addNote(noteData) {
      const note = {
        id: 'n-' + Date.now(),
        title: noteData.title || 'Untitled Note',
        category: noteData.category || 'General',
        color: noteData.color || 'cream',
        content: noteData.content || '',
        pinned: false,
        updatedAt: getTodayDateStr()
      };
      state.notes.unshift(note);
      saveState();
      return note;
    },

    updateNote(id, updates) {
      const idx = state.notes.findIndex(n => n.id === id);
      if (idx !== -1) {
        state.notes[idx] = { ...state.notes[idx], ...updates, updatedAt: getTodayDateStr() };
        saveState();
        return state.notes[idx];
      }
      return null;
    },

    deleteNote(id) {
      state.notes = state.notes.filter(n => n.id !== id);
      saveState();
    },

    // XP & Rewards System
    addXP(amount, reason = '') {
      if (!state.rewards) {
        state.rewards = { xp: 0, unlockedBadgeIds: [], challenges: [], records: {} };
      }
      const oldXP = state.rewards.xp || 0;
      const newXP = oldXP + amount;
      state.rewards.xp = newXP;

      // Calculate levels: Level = Math.floor(Math.sqrt(newXP / 100)) + 1
      const oldLevel = Math.floor(Math.sqrt(oldXP / 100)) + 1;
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

      if (newLevel > oldLevel) {
        if (typeof App !== 'undefined' && App.launchConfetti) {
          App.launchConfetti();
        }
        if (typeof AudioEngine !== 'undefined' && AudioEngine.playBell) {
          AudioEngine.playBell();
        }
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`🎉 LEVEL UP! You reached Level ${newLevel}!`);
        }
      }

      this.checkBadgeUnlocks();
      saveState();
      return { oldXP, newXP, newLevel };
    },

    checkChallengeProgress(type, amount, meta) {
      if (!state.rewards || !state.rewards.challenges) return;
      state.rewards.challenges.forEach(ch => {
        if (ch.completed) return;
        if (type === 'focus' && ch.id === 'c-1') {
          ch.current = Math.min(ch.target, ch.current + amount);
        } else if (type === 'tasks' && ch.id === 'c-2' && meta === 'High') {
          ch.current = Math.min(ch.target, ch.current + 1);
        }
        if (ch.current >= ch.target) {
          ch.completed = true;
          this.addXP(ch.rewardXP, `Completed Challenge: ${ch.title}`);
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(`🏆 Challenge Completed: ${ch.title} (+${ch.rewardXP} XP)`);
          }
        }
      });
      saveState();
    },

    checkBadgeUnlocks() {
      if (!state.rewards) return;
      if (!state.rewards.unlockedBadgeIds) state.rewards.unlockedBadgeIds = [];
      const unlocked = state.rewards.unlockedBadgeIds;

      const completedTasks = state.tasks.filter(t => t.completed).length;
      if (completedTasks >= 1 && !unlocked.includes('first_task')) {
        unlocked.push('first_task');
      }
      if (completedTasks >= 25 && !unlocked.includes('task_master_25')) {
        unlocked.push('task_master_25');
      }

      const maxStreak = Math.max(0, ...state.habits.map(h => h.streak || 0));
      if (maxStreak >= 7 && !unlocked.includes('habit_streak_7')) {
        unlocked.push('habit_streak_7');
      }
      if (maxStreak >= 14 && !unlocked.includes('habit_streak_14')) {
        unlocked.push('habit_streak_14');
      }

      const totalFocusMins = (state.focusSessions || []).reduce((a, b) => a + (b.durationMinutes || 0), 0);
      if (totalFocusMins >= 100 && !unlocked.includes('focus_centurion')) {
        unlocked.push('focus_centurion');
      }

      if (state.lifeBalance && state.lifeBalance.history && state.lifeBalance.history.length >= 1 && !unlocked.includes('life_wheel')) {
        unlocked.push('life_wheel');
      }

      if (state.weeklyResets && state.weeklyResets.length >= 1 && !unlocked.includes('weekly_reset_first')) {
        unlocked.push('weekly_reset_first');
      }
    },

    // Life Balance CRUD
    saveLifeBalance(dimensions, notes = '') {
      if (!state.lifeBalance) {
        state.lifeBalance = { dimensions: {}, history: [] };
      }
      state.lifeBalance.dimensions = { ...dimensions };

      // Compute balance score: 100 - (stdDev * 10)
      const values = Object.values(dimensions);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const balanceScore = Math.max(20, Math.min(100, Math.round(100 - (stdDev * 12))));

      const snapshot = {
        date: getTodayDateStr(),
        ratings: { ...dimensions },
        balanceScore,
        notes
      };

      if (!state.lifeBalance.history) state.lifeBalance.history = [];
      state.lifeBalance.history.unshift(snapshot);

      this.addXP(50, 'Life Balance Review completed');
      this.checkBadgeUnlocks();
      saveState();
      return snapshot;
    },

    // Weekly Reset CRUD
    saveWeeklyReset(resetData) {
      if (!state.weeklyResets) state.weeklyResets = [];
      const entry = {
        id: 'wr-' + Date.now(),
        date: getTodayDateStr(),
        weekNumber: Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), 0, 1).getDay()) / 7),
        accomplishments: resetData.accomplishments || '',
        missedItems: resetData.missedItems || '',
        improvedHabits: resetData.improvedHabits || '',
        distractions: resetData.distractions || '',
        nextWeekFocus: resetData.nextWeekFocus || '',
        committedGoals: resetData.committedGoals || []
      };
      state.weeklyResets.unshift(entry);

      // If user added committed goals, optionally create them in tasks or goals
      if (resetData.createdTasks && Array.isArray(resetData.createdTasks)) {
        resetData.createdTasks.forEach(tTitle => {
          if (tTitle.trim()) {
            this.addTask({
              title: tTitle.trim(),
              category: 'Work',
              priority: 'High',
              dueDate: getFutureDateStr(2)
            });
          }
        });
      }

      this.addXP(100, 'Weekly Reset completed');
      this.checkBadgeUnlocks();
      saveState();
      return entry;
    },

    // Vision Board CRUD
    saveVisionStatement(data) {
      if (!state.visionBoard) state.visionBoard = { visionStatement: '', horizons: {}, aspirations: [] };
      if (data.visionStatement !== undefined) state.visionBoard.visionStatement = data.visionStatement;
      if (data.horizons) state.visionBoard.horizons = { ...state.visionBoard.horizons, ...data.horizons };
      saveState();
    },

    addAspiration(aspData) {
      if (!state.visionBoard) state.visionBoard = { visionStatement: '', horizons: {}, aspirations: [] };
      const asp = {
        id: 'asp-' + Date.now(),
        title: aspData.title || 'New Aspiration',
        category: aspData.category || 'Career',
        horizon: aspData.horizon || '1-Year',
        description: aspData.description || '',
        imageUrl: aspData.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        linkedGoalIds: aspData.linkedGoalIds || []
      };
      state.visionBoard.aspirations.unshift(asp);
      this.addXP(30, `Added aspiration: ${asp.title}`);
      saveState();
      return asp;
    },

    updateAspiration(id, updates) {
      if (!state.visionBoard || !state.visionBoard.aspirations) return null;
      const idx = state.visionBoard.aspirations.findIndex(a => a.id === id);
      if (idx !== -1) {
        state.visionBoard.aspirations[idx] = { ...state.visionBoard.aspirations[idx], ...updates };
        saveState();
        return state.visionBoard.aspirations[idx];
      }
      return null;
    },

    deleteAspiration(id) {
      if (!state.visionBoard || !state.visionBoard.aspirations) return;
      state.visionBoard.aspirations = state.visionBoard.aspirations.filter(a => a.id !== id);
      saveState();
    },

    // Smart Planner Schedule
    saveSmartSchedule(scheduleData) {
      if (!state.smartPlanner) state.smartPlanner = {};
      state.smartPlanner.availableHours = scheduleData.availableHours || 6;
      state.smartPlanner.startTime = scheduleData.startTime || '09:00';
      state.smartPlanner.suggestedSchedule = scheduleData.suggestedSchedule || [];
      saveState();
    },

    commitScheduleBlockToCalendar(block) {
      const today = getTodayDateStr();
      const event = this.addCalendarEvent({
        title: block.title,
        date: today,
        startTime: block.startTime,
        endTime: block.endTime,
        category: block.category || 'Work',
        color: block.priority === 'High' ? 'rose' : 'teal',
        description: `Scheduled via Smart Planner (${block.reason || 'Priority focus'})`
      });
      return event;
    },

    // Overwhelmed Mode State
    setOverwhelmedState(active, selectedTaskIds = [], spotlightIndex = 0) {
      if (!state.overwhelmed) state.overwhelmed = {};
      state.overwhelmed.active = active;
      state.overwhelmed.selectedTaskIds = selectedTaskIds;
      state.overwhelmed.spotlightIndex = spotlightIndex;
      saveState();
    },

    // Settings & Profile
    updateSettings(newSettings) {
      state.settings = { ...state.settings, ...newSettings };
      saveState();
    },

    // Data Export / Import / Reset
    exportJSON() {
      return JSON.stringify(state, null, 2);
    },

    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.settings && parsed.tasks && parsed.habits && parsed.goals) {
          state = parsed;
          saveState();
          return { success: true };
        } else {
          return { success: false, error: 'Invalid data format' };
        }
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    resetToDemo() {
      state = generateDefaultState();
      saveState();
    },

    clearAll() {
      state = {
        settings: {
          userName: 'Sara',
          userTitle: 'Personal Life Dashboard',
          avatar: '🌱',
          theme: 'light',
          soundEnabled: true,
          pomodoroWork: 25,
          pomodoroBreak: 5,
          pomodoroLongBreak: 15,
          dailyTargetHours: 6,
          motivationalQuotes: generateDefaultState().settings.motivationalQuotes
        },
        tasks: [],
        habits: [],
        goals: [],
        focusSessions: [],
        calendarEvents: [],
        journalEntries: [],
        notes: []
      };
      saveState();
    },

    getTodayStr: getTodayDateStr,
    getPastStr: getPastDateStr,
    getFutureStr: getFutureDateStr
  };
})();


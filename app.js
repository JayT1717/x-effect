// X Effect Habit Tracker - Main App
const app = {
  habits: [],
  draggedHabit: null,

  init() {
    this.loadHabits();
    this.loadTheme();
    this.setupEventListeners();
    this.render();
    this.registerServiceWorker();
  },

  // LocalStorage Management
  loadHabits() {
    const stored = localStorage.getItem('xeffect-habits');
    this.habits = stored ? JSON.parse(stored) : [];
  },

  saveHabits() {
    localStorage.setItem('xeffect-habits', JSON.stringify(this.habits));
  },

  loadTheme() {
    const theme = localStorage.getItem('xeffect-theme') || 'light';
    this.setTheme(theme);
  },

  saveTheme(theme) {
    localStorage.setItem('xeffect-theme', theme);
  },

  setTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    this.updateThemeToggleButton();
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    this.setTheme(newTheme);
    this.saveTheme(newTheme);
  },

  updateThemeToggleButton() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = isDark ? '☀️' : '🌙';
    }
  },

  getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  },

  // Event Listeners
  setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    document.getElementById('habitForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createHabit();
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });
  },

  // Tab Navigation
  switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'dashboard') {
      this.renderDashboard();
    }
  },

  // Habit CRUD Operations
  createHabit() {
    const name = document.getElementById('habitName').value.trim();
    const color = document.getElementById('habitColor').value;

    if (!name) return;

    const habit = {
      id: Date.now(),
      name,
      color,
      completions: {},
      createdDate: new Date().toISOString()
    };

    this.habits.push(habit);
    this.saveHabits();
    document.getElementById('habitForm').reset();
    this.render();
  },

  deleteHabit(id) {
    if (confirm('Are you sure you want to delete this habit?')) {
      this.habits = this.habits.filter(h => h.id !== id);
      this.saveHabits();
      this.render();
    }
  },

  toggleToday(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (habit) {
      const today = this.getTodayDate();
      if (habit.completions[today]) {
        delete habit.completions[today];
      } else {
        habit.completions[today] = Date.now();
      }
      this.saveHabits();
      this.render();
    }
  },

  // Rendering
  render() {
    this.renderLog();
  },

  renderLog() {
    const container = document.getElementById('habitsContainer');
    container.innerHTML = '';

    if (this.habits.length === 0) {
      container.innerHTML = '<p class="empty-state">No habits yet. Create one to get started!</p>';
      return;
    }

    const today = this.getTodayDate();
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    const dateHeader = document.createElement('div');
    dateHeader.style.marginBottom = '1.5rem';
    dateHeader.style.fontSize = '1.1rem';
    dateHeader.style.fontWeight = '600';
    dateHeader.style.color = 'var(--text)';
    dateHeader.textContent = todayFormatted;
    container.appendChild(dateHeader);

    this.habits.forEach(habit => {
      const card = this.createLogCard(habit, today);
      container.appendChild(card);
    });
  },

  createLogCard(habit, today) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.draggable = true;
    card.dataset.habitId = habit.id;

    const header = document.createElement('div');
    header.className = 'habit-header';

    const headerContent = document.createElement('div');
    headerContent.style.display = 'flex';
    headerContent.style.alignItems = 'center';
    headerContent.style.gap = '0.75rem';
    headerContent.style.flex = '1';

    const colorIndicator = document.createElement('div');
    colorIndicator.className = 'habit-color-indicator';
    colorIndicator.style.background = habit.color;

    const name = document.createElement('span');
    name.className = 'habit-name';
    name.textContent = habit.name;

    headerContent.appendChild(colorIndicator);
    headerContent.appendChild(name);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => this.deleteHabit(habit.id));

    header.appendChild(headerContent);
    header.appendChild(deleteBtn);

    const content = document.createElement('div');
    const isCompleted = !!habit.completions[today];

    if (!isCompleted) {
      const checkboxContainer = document.createElement('div');
      checkboxContainer.style.display = 'flex';
      checkboxContainer.style.alignItems = 'center';
      checkboxContainer.style.gap = '1rem';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `habit-${habit.id}`;
      checkbox.className = 'habit-checkbox';
      checkbox.addEventListener('change', () => this.toggleToday(habit.id));

      const label = document.createElement('label');
      label.htmlFor = `habit-${habit.id}`;
      label.style.cursor = 'pointer';
      label.style.fontWeight = '500';
      label.textContent = 'Mark complete';

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      content.appendChild(checkboxContainer);
    } else {
      const completedDiv = document.createElement('div');
      completedDiv.style.display = 'flex';
      completedDiv.style.alignItems = 'center';
      completedDiv.style.justifyContent = 'space-between';
      completedDiv.style.padding = '0.75rem';
      completedDiv.style.background = 'rgba(67, 233, 123, 0.1)';
      completedDiv.style.borderRadius = '6px';
      completedDiv.style.borderLeft = '4px solid var(--primary)';

      const timestamp = habit.completions[today];
      const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const completionText = document.createElement('div');
      completionText.style.color = 'var(--primary)';
      completionText.style.fontWeight = '500';
      completionText.textContent = `✓ Completed at ${time}`;

      const undoBtn = document.createElement('button');
      undoBtn.className = 'btn-undo';
      undoBtn.textContent = '✕';
      undoBtn.addEventListener('click', () => this.toggleToday(habit.id));

      completedDiv.appendChild(completionText);
      completedDiv.appendChild(undoBtn);
      content.appendChild(completedDiv);
    }

    card.appendChild(header);
    card.appendChild(content);

    card.addEventListener('dragstart', (e) => this.handleDragStart(e, habit.id));
    card.addEventListener('dragover', (e) => this.handleDragOver(e));
    card.addEventListener('drop', (e) => this.handleDrop(e, habit.id));
    card.addEventListener('dragend', (e) => this.handleDragEnd(e));

    return card;
  },

  handleDragStart(e, habitId) {
    this.draggedHabit = habitId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  },

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const draggingCard = document.querySelector('.dragging');
    const container = document.getElementById('habitsContainer');
    const card = e.target.closest('.habit-card');

    if (card) {
      const rect = card.getBoundingClientRect();
      const midpoint = rect.y + rect.height / 2;
      if (e.clientY > midpoint) {
        card.parentNode.insertBefore(draggingCard, card.nextSibling);
      } else {
        card.parentNode.insertBefore(draggingCard, card);
      }
    }
  },

  handleDrop(e, targetHabitId) {
    e.preventDefault();
    if (this.draggedHabit !== targetHabitId) {
      this.reorderHabits(this.draggedHabit, targetHabitId);
    }
  },

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    this.draggedHabit = null;
  },

  reorderHabits(draggedId, targetId) {
    const draggedIndex = this.habits.findIndex(h => h.id === draggedId);
    const targetIndex = this.habits.findIndex(h => h.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedHabit] = this.habits.splice(draggedIndex, 1);
    this.habits.splice(targetIndex, 0, draggedHabit);
    this.saveHabits();
  },

  renderDashboard() {
    const container = document.getElementById('dashboardContainer');
    container.innerHTML = '';

    if (this.habits.length === 0) {
      container.innerHTML = '<p class="empty-state">No habits to display. Create one first!</p>';
      return;
    }

    this.habits.forEach(habit => {
      const card = this.createDashboardCard(habit);
      container.appendChild(card);
    });
  },

  getLast49Days() {
    const days = [];
    const today = new Date();
    for (let i = 48; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days.reverse();
  },

  calculateStats(habit) {
    const allDays = this.getLast49Days();
    const completedDays = allDays.filter(day => habit.completions[day]);
    const completed = completedDays.length;
    const total = allDays.length;
    const percentage = Math.round((completed / total) * 100);

    let currentStreak = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
      if (habit.completions[allDays[i]]) {
        currentStreak++;
      } else {
        break;
      }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < allDays.length; i++) {
      if (habit.completions[allDays[i]]) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      completed,
      total,
      percentage,
      currentStreak,
      longestStreak
    };
  },

  createDashboardCard(habit) {
    const card = document.createElement('div');
    card.className = 'stats-card';

    const header = document.createElement('div');
    header.className = 'stats-header';

    const headerContent = document.createElement('div');
    headerContent.style.display = 'flex';
    headerContent.style.alignItems = 'center';
    headerContent.style.gap = '0.75rem';

    const colorIndicator = document.createElement('div');
    colorIndicator.className = 'habit-color-indicator';
    colorIndicator.style.background = habit.color;

    const title = document.createElement('span');
    title.className = 'stats-title';
    title.textContent = habit.name;

    headerContent.appendChild(colorIndicator);
    headerContent.appendChild(title);
    header.appendChild(headerContent);

    const stats = this.calculateStats(habit);

    const statsContent = document.createElement('div');

    const streakRow = document.createElement('div');
    streakRow.className = 'stat-row';
    streakRow.innerHTML = `
      <span class="stat-label">Current Streak</span>
      <span class="stat-value">${stats.currentStreak}</span>
    `;

    const longestRow = document.createElement('div');
    longestRow.className = 'stat-row';
    longestRow.innerHTML = `
      <span class="stat-label">Longest Streak</span>
      <span class="stat-value">${stats.longestStreak}</span>
    `;

    const completionDiv = document.createElement('div');
    completionDiv.className = 'stat-row';
    completionDiv.style.marginBottom = '1rem';
    completionDiv.innerHTML = `
      <span class="stat-label">Completion</span>
      <span class="stat-value">${stats.percentage}%</span>
    `;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${stats.percentage}%`;
    progressFill.style.background = habit.color;

    progressBar.appendChild(progressFill);

    statsContent.appendChild(streakRow);
    statsContent.appendChild(longestRow);
    statsContent.appendChild(completionDiv);
    statsContent.appendChild(progressBar);

    const gridLabel = document.createElement('div');
    gridLabel.style.marginTop = '1.5rem';
    gridLabel.style.marginBottom = '1rem';
    gridLabel.style.fontSize = '0.95rem';
    gridLabel.style.color = 'var(--text-light)';
    gridLabel.style.fontWeight = '500';
    gridLabel.textContent = 'Last 49 days';

    const grid = document.createElement('div');
    grid.className = 'days-grid';

    const allDays = this.getLast49Days();
    allDays.forEach(day => {
      const cell = document.createElement('div');
      cell.className = 'day-cell-dashboard';
      if (habit.completions[day]) {
        cell.classList.add('completed');
        cell.textContent = '✕';
        cell.style.background = habit.color;
        cell.style.color = 'white';
      }
      grid.appendChild(cell);
    });

    card.appendChild(header);
    card.appendChild(statsContent);
    card.appendChild(gridLabel);
    card.appendChild(grid);
    return card;
  },

  // Service Worker Registration
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
      });
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());

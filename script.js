// FocusFlow Web App - 中文版 - Main JavaScript
class FocusFlowApp {
    constructor() {
        this.currentView = 'timer';
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 90 * 60; // 90 minutes in seconds
        this.totalTime = 90 * 60;
        this.breaksTaken = 0;
        this.microBreakInterval = 5 * 60; // 5 minutes
        this.microBreakDuration = 10; // 10 seconds
        this.nextMicroBreak = this.microBreakInterval;
        this.isMicroBreak = false;
        this.microBreakTimeRemaining = 0;
        this.isRandomizedInterval = true;
        this.minInterval = 3 * 60;
        this.maxInterval = 5 * 60;
        
        // Statistics
        this.completedSessions = 0;
        this.totalFocusTime = 0;
        this.currentStreak = 0;
        this.lastSessionDate = null;
        
        // Language
        this.currentLanguage = 'en';
        
        this.timer = null;
        this.microBreakTimer = null;
        this.sessionStartTime = null;
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.loadStatistics();
        this.loadLanguage();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateProgressRing();
        this.updateLanguage();
    }
    
    setupEventListeners() {
        // Timer controls
        document.getElementById('playPauseBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
        
        // Navigation
        document.getElementById('statsBtn').addEventListener('click', () => this.showView('stats'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.showView('settings'));
        document.getElementById('closeStatsBtn').addEventListener('click', () => this.showView('timer'));
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.showView('timer'));
        
        // Settings
        document.getElementById('sessionDurationSlider').addEventListener('input', (e) => this.updateSessionDuration(e.target.value));
        document.getElementById('intervalSlider').addEventListener('input', (e) => this.updateInterval(e.target.value));
        
        // Toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleIntervalType(e.target.dataset.value));
        });
        
        // Reset statistics
        document.getElementById('resetStatsBtn').addEventListener('click', () => this.resetStatistics());
        
        // Language switcher
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLanguage(e.target.dataset.lang));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR') {
                this.resetTimer();
            }
        });
    }
    
    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        document.getElementById(viewName + 'View').classList.add('active');
        this.currentView = viewName;
        
        // Update view-specific content
        if (viewName === 'stats') {
            this.updateStatsDisplay();
        } else if (viewName === 'settings') {
            this.updateSettingsDisplay();
        }
    }
    
    toggleTimer() {
        if (!this.isRunning) {
            this.startTimer();
        } else {
            this.pauseTimer();
        }
    }
    
    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.sessionStartTime = new Date();
            this.scheduleNextMicroBreak();
            
            this.timer = setInterval(() => this.updateTimer(), 1000);
            this.updatePlayPauseButton();
        }
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.timer);
        this.timer = null;
        this.updatePlayPauseButton();
    }
    
    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.isMicroBreak = false;
        this.breaksTaken = 0;
        this.timeRemaining = this.totalTime;
        this.nextMicroBreak = this.microBreakInterval;
        this.microBreakTimeRemaining = 0;
        
        clearInterval(this.timer);
        clearInterval(this.microBreakTimer);
        this.timer = null;
        this.microBreakTimer = null;
        
        this.updateDisplay();
        this.updateProgressRing();
        this.updatePlayPauseButton();
    }
    
    updateTimer() {
        if (this.isMicroBreak) {
            this.microBreakTimeRemaining--;
            if (this.microBreakTimeRemaining <= 0) {
                this.endMicroBreak();
            }
        } else {
            this.timeRemaining--;
            this.nextMicroBreak--;
            
            if (this.timeRemaining <= 0) {
                this.completeSession();
            } else if (this.nextMicroBreak <= 0) {
                this.startMicroBreak();
            }
        }
        
        this.updateDisplay();
        this.updateProgressRing();
    }
    
    startMicroBreak() {
        this.isMicroBreak = true;
        this.microBreakTimeRemaining = this.microBreakDuration;
        this.breaksTaken++;
        this.playSound(true);
        
        // Switch to micro break timer
        clearInterval(this.timer);
        this.microBreakTimer = setInterval(() => this.updateTimer(), 1000);
    }
    
    endMicroBreak() {
        this.isMicroBreak = false;
        this.microBreakTimeRemaining = 0;
        this.playSound(false);
        this.scheduleNextMicroBreak();
        
        clearInterval(this.microBreakTimer);
        this.microBreakTimer = null;
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }
    
    scheduleNextMicroBreak() {
        if (this.isRandomizedInterval) {
            const randomInterval = Math.random() * (this.maxInterval - this.minInterval) + this.minInterval;
            this.nextMicroBreak = randomInterval;
        } else {
            this.nextMicroBreak = this.microBreakInterval;
        }
    }
    
    completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        this.isMicroBreak = false;
        
        clearInterval(this.timer);
        clearInterval(this.microBreakTimer);
        this.timer = null;
        this.microBreakTimer = null;
        
        this.completedSessions++;
        this.totalFocusTime += this.totalTime;
        this.updateStreak();
        this.saveStatistics();
        
        this.updateDisplay();
        this.updateProgressRing();
        this.updatePlayPauseButton();
        
        // Show completion notification
        if (this.currentLanguage === 'zh') {
            this.showNotification('会话完成！做得很好！');
        } else {
            this.showNotification('Session completed! Great job!');
        }
    }
    
    updateDisplay() {
        const timeDisplay = document.getElementById('timeDisplay');
        const breaksTaken = document.getElementById('breaksTaken');
        
        if (this.isMicroBreak) {
            timeDisplay.textContent = this.formatTime(this.microBreakTimeRemaining);
            timeDisplay.style.color = 'rgba(251, 146, 60, 0.9)'; // Orange for micro break
        } else {
            timeDisplay.textContent = this.formatTime(this.timeRemaining);
            timeDisplay.style.color = 'rgba(59, 130, 246, 0.9)'; // Blue for focus time
        }
        
        breaksTaken.textContent = this.breaksTaken;
    }
    
    updateProgressRing() {
        const progressFill = document.querySelector('.progress-fill');
        
        let progress;
        if (this.isMicroBreak) {
            progress = 1 - (this.microBreakTimeRemaining / this.microBreakDuration);
        } else {
            progress = 1 - (this.timeRemaining / this.totalTime);
        }
        
        const circumference = 2 * Math.PI * 150;
        const offset = circumference - (progress * circumference);
        
        progressFill.style.strokeDashoffset = offset;
    }
    
    updatePlayPauseButton() {
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        
        if (this.isRunning) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    formatTotalTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (this.currentLanguage === 'zh') {
            if (hours > 0) {
                return `${hours}小时${minutes}分钟`;
            } else {
                return `${minutes}分钟`;
            }
        } else {
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        }
    }
    
    updateSessionDuration(minutes) {
        this.totalTime = minutes * 60;
        this.timeRemaining = this.totalTime;
        document.getElementById('durationValue').textContent = minutes;
        this.updateDisplay();
        this.updateProgressRing();
        this.saveSettings();
    }
    
    updateInterval(minutes) {
        this.microBreakInterval = minutes * 60;
        document.getElementById('intervalValue').textContent = minutes;
        this.saveSettings();
    }
    
    toggleIntervalType(type) {
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.isRandomizedInterval = type === 'random';
        this.saveSettings();
    }
    
    updateStatsDisplay() {
        document.getElementById('completedSessions').textContent = this.completedSessions;
        document.getElementById('currentStreak').textContent = this.currentStreak;
        document.getElementById('totalFocusTime').textContent = this.formatTotalTime(this.totalFocusTime);
        
        const averageTime = this.completedSessions > 0 ? 
            Math.floor(this.totalFocusTime / this.completedSessions / 60) : 0;
        if (this.currentLanguage === 'zh') {
            document.getElementById('averageTime').textContent = `${averageTime}分钟`;
        } else {
            document.getElementById('averageTime').textContent = `${averageTime}m`;
        }
        
        if (this.lastSessionDate) {
            const date = new Date(this.lastSessionDate);
            if (this.currentLanguage === 'zh') {
                const options = { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                document.getElementById('lastSessionDate').textContent = date.toLocaleDateString('zh-CN', options);
            } else {
                document.getElementById('lastSessionDate').textContent = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        } else {
            if (this.currentLanguage === 'zh') {
                document.getElementById('lastSessionDate').textContent = '从未';
            } else {
                document.getElementById('lastSessionDate').textContent = 'Never';
            }
        }
        
        if (this.currentLanguage === 'zh') {
            document.getElementById('currentSessionDuration').textContent = `${Math.floor(this.totalTime / 60)}分钟`;
        } else {
            document.getElementById('currentSessionDuration').textContent = `${Math.floor(this.totalTime / 60)} minutes`;
        }
    }
    
    updateSettingsDisplay() {
        document.getElementById('settingsCompletedSessions').textContent = this.completedSessions;
        if (this.currentLanguage === 'zh') {
            document.getElementById('settingsCurrentStreak').textContent = `${this.currentStreak}天`;
        } else {
            document.getElementById('settingsCurrentStreak').textContent = `${this.currentStreak} days`;
        }
        document.getElementById('settingsTotalTime').textContent = this.formatTotalTime(this.totalFocusTime);
    }
    
    updateStreak() {
        const today = new Date().toDateString();
        
        if (this.lastSessionDate) {
            const lastDate = new Date(this.lastSessionDate).toDateString();
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
            
            if (lastDate === yesterday) {
                this.currentStreak++;
            } else if (lastDate !== today) {
                this.currentStreak = 1;
            }
        } else {
            this.currentStreak = 1;
        }
        
        this.lastSessionDate = new Date().toISOString();
    }
    
    resetStatistics() {
        const message = this.currentLanguage === 'zh' ? 
            '确定要重置所有统计数据吗？此操作无法撤销。' : 
            'Are you sure you want to reset all statistics? This cannot be undone.';
            
        if (confirm(message)) {
            this.completedSessions = 0;
            this.totalFocusTime = 0;
            this.currentStreak = 0;
            this.lastSessionDate = null;
            this.saveStatistics();
            this.updateStatsDisplay();
            this.updateSettingsDisplay();
        }
    }
    
    playSound(isBreakStart) {
        // Create audio context for sound feedback
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(isBreakStart ? 800 : 1200, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 300;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    saveSettings() {
        const settings = {
            sessionDuration: this.totalTime,
            microBreakInterval: this.microBreakInterval,
            isRandomizedInterval: this.isRandomizedInterval,
            minInterval: this.minInterval,
            maxInterval: this.maxInterval
        };
        localStorage.setItem('focusFlowSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('focusFlowSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.totalTime = settings.sessionDuration || 90 * 60;
            this.timeRemaining = this.totalTime;
            this.microBreakInterval = settings.microBreakInterval || 5 * 60;
            this.isRandomizedInterval = settings.isRandomizedInterval !== undefined ? settings.isRandomizedInterval : true;
            this.minInterval = settings.minInterval || 3 * 60;
            this.maxInterval = settings.maxInterval || 5 * 60;
            
            // Update UI
            document.getElementById('sessionDurationSlider').value = Math.floor(this.totalTime / 60);
            document.getElementById('durationValue').textContent = Math.floor(this.totalTime / 60);
            document.getElementById('intervalSlider').value = Math.floor(this.microBreakInterval / 60);
            document.getElementById('intervalValue').textContent = Math.floor(this.microBreakInterval / 60);
            
            // Update toggle buttons
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.value === (this.isRandomizedInterval ? 'random' : 'fixed')) {
                    btn.classList.add('active');
                }
            });
        }
    }
    
    saveStatistics() {
        const stats = {
            completedSessions: this.completedSessions,
            totalFocusTime: this.totalFocusTime,
            currentStreak: this.currentStreak,
            lastSessionDate: this.lastSessionDate
        };
        localStorage.setItem('focusFlowStats', JSON.stringify(stats));
    }
    
    loadStatistics() {
        const saved = localStorage.getItem('focusFlowStats');
        if (saved) {
            const stats = JSON.parse(saved);
            this.completedSessions = stats.completedSessions || 0;
            this.totalFocusTime = stats.totalFocusTime || 0;
            this.currentStreak = stats.currentStreak || 0;
            this.lastSessionDate = stats.lastSessionDate || null;
        }
    }
    
    // Language Management
    switchLanguage(lang) {
        this.currentLanguage = lang;
        this.saveLanguage();
        this.updateLanguage();
        
        // Update button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-lang="${lang}"]`).classList.add('active');
    }
    
    updateLanguage() {
        const elements = document.querySelectorAll('[data-en][data-zh]');
        elements.forEach(element => {
            if (this.currentLanguage === 'zh') {
                element.textContent = element.getAttribute('data-zh');
            } else {
                element.textContent = element.getAttribute('data-en');
            }
        });
        
        // Update button titles
        const buttons = document.querySelectorAll('[data-en-title][data-zh-title]');
        buttons.forEach(button => {
            if (this.currentLanguage === 'zh') {
                button.title = button.getAttribute('data-zh-title');
            } else {
                button.title = button.getAttribute('data-en-title');
            }
        });
        
        // Update document language
        document.documentElement.lang = this.currentLanguage === 'zh' ? 'zh-CN' : 'en';
        
        // Update specific elements that need special handling
        this.updateStatsDisplay();
        this.updateSettingsDisplay();
    }
    
    saveLanguage() {
        localStorage.setItem('focusFlowLanguage', this.currentLanguage);
    }
    
    loadLanguage() {
        const saved = localStorage.getItem('focusFlowLanguage');
        this.currentLanguage = saved || 'en';
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FocusFlowApp();
}); 
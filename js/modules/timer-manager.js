// js/modules/timer-manager.js - Timer management for session, question, and stopwatch timers

import { appState } from '../state-manager.js';
import { domManager } from '../dom-manager.js';
import { formatTime } from '../ui.js';

/**
 * TimerManager - Handles all timer functionality including session, question, and stopwatch timers
 */
export class TimerManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the timer manager
     */
    initialize() {
        if (this.initialized) {
            console.warn('TimerManager already initialized');
            return;
        }

        this.setupTimerSettings();
        this.updateTimerVisibility();
        
        this.initialized = true;
        console.log('TimerManager initialized');
    }

    /**
     * Set up timer settings from UI elements
     */
    setupTimerSettings() {
        // Get timer settings from DOM elements
        const sessionTimerEnabled = domManager.get('enableSessionTimer')?.checked || false;
        const questionTimerEnabled = domManager.get('enableQuestionTimer')?.checked || false;
        const stopwatchEnabled = domManager.get('enableStopwatch')?.checked !== false; // Default true

        const sessionTimeLimitMinutes = parseInt(domManager.get('sessionTimeLimit')?.value, 10) || 60;
        const questionTimeLimit = parseInt(domManager.get('questionTimeLimit')?.value, 10) || 90;
        const questionLimit = parseInt(domManager.get('questionLimit')?.value, 10) || 50;

        // Update state with timer settings
        appState.update({
            'timers.sessionTimerEnabled': sessionTimerEnabled,
            'timers.questionTimerEnabled': questionTimerEnabled,
            'timers.stopwatchEnabled': stopwatchEnabled,
            'timers.sessionTimeLimit': sessionTimeLimitMinutes * 60, // Convert to seconds
            'timers.questionTimeLimit': questionTimeLimit,
            'timers.questionLimit': questionLimit,
            'timers.sessionTimeRemaining': sessionTimeLimitMinutes * 60,
            'timers.questionTimeRemaining': 0,
            'timers.stopwatchTime': 0
        });

        console.log('Timer settings initialized');
    }

    /**
     * Start the session timer
     */
    startSessionTimer() {
        const timers = appState.get('timers');
        
        if (!timers.sessionTimerEnabled) {
            return;
        }

        // Clear any existing session timer
        this.pauseSessionTimer();

        const interval = setInterval(() => {
            const currentTime = appState.get('timers.sessionTimeRemaining');
            
            if (currentTime <= 0) {
                this.pauseSessionTimer();
                this.handleSessionTimeExpired();
                return;
            }

            appState.set('timers.sessionTimeRemaining', currentTime - 1);
        }, 1000);

        appState.set('timers.sessionTimerInterval', interval);
        console.log('Session timer started');
    }

    /**
     * Pause the session timer
     */
    pauseSessionTimer() {
        const interval = appState.get('timers.sessionTimerInterval');
        if (interval) {
            clearInterval(interval);
            appState.set('timers.sessionTimerInterval', null);
            console.log('Session timer paused');
        }
    }

    /**
     * Start the question timer
     */
    startQuestionTimer() {
        const timers = appState.get('timers');
        
        if (!timers.questionTimerEnabled) {
            return;
        }

        // Clear any existing question timer
        this.pauseQuestionTimer();

        // Reset question timer to limit
        appState.set('timers.questionTimeRemaining', timers.questionTimeLimit);

        const interval = setInterval(() => {
            const currentTime = appState.get('timers.questionTimeRemaining');
            
            if (currentTime <= 0) {
                this.pauseQuestionTimer();
                this.handleQuestionTimeExpired();
                return;
            }

            appState.set('timers.questionTimeRemaining', currentTime - 1);
        }, 1000);

        appState.set('timers.questionTimerInterval', interval);
        console.log('Question timer started');
    }

    /**
     * Pause the question timer
     */
    pauseQuestionTimer() {
        const interval = appState.get('timers.questionTimerInterval');
        if (interval) {
            clearInterval(interval);
            appState.set('timers.questionTimerInterval', null);
            console.log('Question timer paused');
        }
    }

    /**
     * Start the stopwatch
     */
    startStopwatch() {
        const timers = appState.get('timers');
        
        if (!timers.stopwatchEnabled) {
            return;
        }

        // Clear any existing stopwatch
        this.pauseStopwatch();

        const interval = setInterval(() => {
            const currentTime = appState.get('timers.stopwatchTime');
            appState.set('timers.stopwatchTime', currentTime + 1);
        }, 1000);

        appState.set('timers.stopwatchInterval', interval);
        console.log('Stopwatch started');
    }

    /**
     * Pause the stopwatch
     */
    pauseStopwatch() {
        const interval = appState.get('timers.stopwatchInterval');
        if (interval) {
            clearInterval(interval);
            appState.set('timers.stopwatchInterval', null);
            console.log('Stopwatch paused');
        }
    }

    /**
     * Reset the stopwatch to zero
     */
    resetStopwatch() {
        this.pauseStopwatch();
        appState.set('timers.stopwatchTime', 0);
        console.log('Stopwatch reset');
    }

    /**
     * Update timer display visibility based on settings
     */
    updateTimerVisibility() {
        const timers = appState.get('timers');
        
        // Update session timer display
        const sessionTimerDisplay = domManager.get('sessionTimerDisplay');
        if (sessionTimerDisplay) {
            sessionTimerDisplay.style.display = timers.sessionTimerEnabled ? 'block' : 'none';
        }

        // Update question timer display
        const questionTimerDisplay = domManager.get('questionTimerDisplay');
        if (questionTimerDisplay) {
            questionTimerDisplay.style.display = timers.questionTimerEnabled ? 'block' : 'none';
        }

        // Update stopwatch display
        const stopwatchDisplay = domManager.get('stopwatchDisplay');
        if (stopwatchDisplay) {
            stopwatchDisplay.style.display = timers.stopwatchEnabled ? 'block' : 'none';
        }

        console.log('Timer visibility updated');
    }

    /**
     * Update session timer display
     */
    updateSessionTimerDisplay() {
        const sessionTimerDisplay = domManager.get('sessionTimerDisplay');
        if (!sessionTimerDisplay) return;

        const timeRemaining = appState.get('timers.sessionTimeRemaining');
        const timers = appState.get('timers');
        
        if (timers.sessionTimerEnabled) {
            sessionTimerDisplay.textContent = `Session: ${formatTime(timeRemaining)}`;
            
            // Add warning styling if time is running low
            if (timeRemaining <= 300) { // 5 minutes
                sessionTimerDisplay.classList.add('timer-warning');
            } else {
                sessionTimerDisplay.classList.remove('timer-warning');
            }
            
            if (timeRemaining <= 60) { // 1 minute
                sessionTimerDisplay.classList.add('timer-critical');
            } else {
                sessionTimerDisplay.classList.remove('timer-critical');
            }
        }
    }

    /**
     * Update question timer display
     */
    updateQuestionTimerDisplay() {
        const questionTimerDisplay = domManager.get('questionTimerDisplay');
        if (!questionTimerDisplay) return;

        const timeRemaining = appState.get('timers.questionTimeRemaining');
        const timers = appState.get('timers');
        
        if (timers.questionTimerEnabled) {
            questionTimerDisplay.textContent = `Question: ${formatTime(timeRemaining)}`;
            
            // Add warning styling if time is running low
            if (timeRemaining <= 30) { // 30 seconds
                questionTimerDisplay.classList.add('timer-warning');
            } else {
                questionTimerDisplay.classList.remove('timer-warning');
            }
            
            if (timeRemaining <= 10) { // 10 seconds
                questionTimerDisplay.classList.add('timer-critical');
            } else {
                questionTimerDisplay.classList.remove('timer-critical');
            }
        }
    }

    /**
     * Update stopwatch display
     */
    updateStopwatchDisplay() {
        const stopwatchDisplay = domManager.get('stopwatchDisplay');
        if (!stopwatchDisplay) return;

        const elapsed = appState.get('timers.stopwatchTime');
        const timers = appState.get('timers');
        
        if (timers.stopwatchEnabled) {
            stopwatchDisplay.textContent = `Elapsed: ${formatTime(elapsed)}`;
        }
    }

    /**
     * Handle session time expiration
     */
    handleSessionTimeExpired() {
        console.log('Session time expired');
        
        // Show alert to user
        alert('Session time has expired! The quiz will now end.');
        
        // End the quiz session
        this.endQuizDueToTimeout('session');
    }

    /**
     * Handle question time expiration
     */
    handleQuestionTimeExpired() {
        console.log('Question time expired');
        
        // Auto-submit current question or move to next
        this.handleQuestionTimeout();
    }

    /**
     * Handle question timeout by auto-submitting or moving to next question
     */
    handleQuestionTimeout() {
        const currentQuestion = appState.get('currentQuestionObject');
        if (!currentQuestion) return;

        // Check if question was already answered
        const sessionAttempts = appState.get('sessionAttempts');
        if (sessionAttempts.has(currentQuestion.question_id)) {
            // Question already answered, just move to next
            this.moveToNextQuestion();
            return;
        }

        // Auto-submit with no answer
        this.autoSubmitQuestion();
    }

    /**
     * Auto-submit current question with no answer due to timeout
     */
    autoSubmitQuestion() {
        const currentQuestion = appState.get('currentQuestionObject');
        if (!currentQuestion) return;

        const attempt = {
            chosen_answer: null, // No answer selected
            time_submitted: new Date().toISOString(),
            time_spent_seconds: appState.get('timers.questionTimeLimit'), // Full time used
            notes: 'Auto-submitted due to time limit'
        };

        // Add to session attempts
        const sessionAttempts = appState.get('sessionAttempts');
        sessionAttempts.set(currentQuestion.question_id, {
            question: currentQuestion,
            attempt: attempt
        });

        // Save to database
        if (!currentQuestion.user_attempts) {
            currentQuestion.user_attempts = [];
        }
        currentQuestion.user_attempts.push(attempt);

        console.log('Question auto-submitted due to timeout');
        
        // Move to next question
        this.moveToNextQuestion();
    }

    /**
     * Move to next question after timeout
     */
    moveToNextQuestion() {
        // This would trigger the quiz manager to move to next question
        console.log('Moving to next question after timeout');
        
        // Emit event or call quiz manager method
        // For now, just log - this would be implemented with proper integration
    }

    /**
     * End quiz due to timeout
     * @param {string} timeoutType - Type of timeout ('session' or 'question')
     */
    endQuizDueToTimeout(timeoutType) {
        // Pause all timers
        this.pauseAllTimers();
        
        // Save current state
        appState.saveSessionState();
        
        // Show timeout message
        const endOfQuizMessage = domManager.get('endOfQuizMessage');
        if (endOfQuizMessage) {
            endOfQuizMessage.innerHTML = `
                <h2>Quiz Ended - Time Expired</h2>
                <p>The ${timeoutType} time limit has been reached.</p>
                <p>Your progress has been saved.</p>
            `;
            endOfQuizMessage.style.display = 'block';
        }

        // Hide quiz area
        const quizArea = domManager.get('quizArea');
        if (quizArea) {
            quizArea.style.display = 'none';
        }

        console.log(`Quiz ended due to ${timeoutType} timeout`);
    }

    /**
     * Pause all active timers
     */
    pauseAllTimers() {
        this.pauseSessionTimer();
        this.pauseQuestionTimer();
        this.pauseStopwatch();
        console.log('All timers paused');
    }

    /**
     * Resume all enabled timers
     */
    resumeAllTimers() {
        const timers = appState.get('timers');
        
        if (timers.sessionTimerEnabled) {
            this.startSessionTimer();
        }
        
        if (timers.questionTimerEnabled) {
            this.startQuestionTimer();
        }
        
        if (timers.stopwatchEnabled) {
            this.startStopwatch();
        }
        
        console.log('Enabled timers resumed');
    }

    /**
     * Get current timer status
     * @returns {Object} Timer status information
     */
    getTimerStatus() {
        const timers = appState.get('timers');
        
        return {
            session: {
                enabled: timers.sessionTimerEnabled,
                timeRemaining: timers.sessionTimeRemaining,
                timeLimit: timers.sessionTimeLimit,
                isRunning: timers.sessionTimerInterval !== null,
                formatted: formatTime(timers.sessionTimeRemaining)
            },
            question: {
                enabled: timers.questionTimerEnabled,
                timeRemaining: timers.questionTimeRemaining,
                timeLimit: timers.questionTimeLimit,
                isRunning: timers.questionTimerInterval !== null,
                formatted: formatTime(timers.questionTimeRemaining)
            },
            stopwatch: {
                enabled: timers.stopwatchEnabled,
                elapsed: timers.stopwatchTime,
                isRunning: timers.stopwatchInterval !== null,
                formatted: formatTime(timers.stopwatchTime)
            }
        };
    }

    /**
     * Update timer settings from UI
     */
    updateTimerSettings() {
        this.setupTimerSettings();
        this.updateTimerVisibility();
        console.log('Timer settings updated from UI');
    }

    /**
     * Reset all timers to their initial state
     */
    resetAllTimers() {
        this.pauseAllTimers();
        
        const timers = appState.get('timers');
        appState.update({
            'timers.sessionTimeRemaining': timers.sessionTimeLimit,
            'timers.questionTimeRemaining': 0,
            'timers.stopwatchTime': 0
        });
        
        console.log('All timers reset');
    }

    /**
     * Get time spent on current question
     * @returns {number} Time spent in seconds
     */
    getCurrentQuestionTimeSpent() {
        const questionStartTime = appState.get('questionStartTime');
        if (!questionStartTime) return 0;
        
        return Math.floor((Date.now() - questionStartTime) / 1000);
    }

    /**
     * Clean up timer manager (stop all timers)
     */
    cleanup() {
        this.pauseAllTimers();
        this.initialized = false;
        console.log('TimerManager cleaned up');
    }
}

// Create singleton instance
export const timerManager = new TimerManager();
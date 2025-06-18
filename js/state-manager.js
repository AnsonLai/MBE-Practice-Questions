// js/state-manager.js - Centralized state management system

import { domManager, settingsManager } from './dom-manager.js';
import { saveAppState, loadAppState } from './db.js';

/**
 * AppState - Centralized state management for the quiz application
 * Solves the issue of scattered state variables and UI/storage synchronization
 */
class AppState {
    constructor() {
        this.state = {
            // Quiz Data
            quizData: { questions: [], groups: [], fileName: null },
            
            // Quiz Session State
            masterQuestionList: [],
            currentQuestionIndex: -1,
            currentQuestionObject: null,
            questionStartTime: null,
            lastDisplayedGroupId: null,
            hideAnswerMode: false,
            sessionAttempts: new Map(),
            
            // Filter State (source of truth)
            filters: {
                attempts: 'unattempted',
                notes: 'all',
                scramble: true,
                categories: [],
                providers: []
            },
            
            // Timer State
            timers: {
                sessionTimerEnabled: false,
                questionTimerEnabled: false,
                stopwatchEnabled: true,
                sessionTimeLimit: 60 * 60, // seconds
                questionTimeLimit: 90, // seconds
                questionLimit: 50,
                sessionTimeRemaining: 0,
                questionTimeRemaining: 0,
                stopwatchTime: 0,
                sessionTimerInterval: null,
                questionTimerInterval: null,
                stopwatchInterval: null
            },
            
            // Annotation State
            annotation: {
                isActive: false,
                isDrawing: false,
                currentTool: 'pen',
                lastX: 0,
                lastY: 0,
                penColor: '#0000FF',
                penWidth: 2,
                highlighterColor: 'rgba(60, 255, 131, 0.03)',
                highlighterWidth: 15,
                eraserWidth: 25
            },
            
            // UI State
            ui: {
                performanceButton: null
            }
        };
        
        this.listeners = new Map(); // Event listeners for state changes
        this.initialized = false;
    }

    /**
     * Initialize the state manager
     */
    initialize() {
        if (this.initialized) {
            console.warn('AppState already initialized');
            return;
        }
        
        this.initialized = true;
        console.log('AppState initialized');
    }

    /**
     * Get current state or a specific part of state
     * @param {string} path - Dot notation path to state property (e.g., 'timers.sessionTimeLimit')
     * @returns {any} State value
     */
    get(path = null) {
        if (!path) return this.state;
        
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Set state and trigger listeners
     * @param {string} path - Dot notation path to state property
     * @param {any} value - New value
     * @param {boolean} silent - If true, don't trigger listeners
     */
    set(path, value, silent = false) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);
        
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        if (!silent && oldValue !== value) {
            this.notifyListeners(path, value, oldValue);
        }
    }

    /**
     * Update multiple state properties at once
     * @param {Object} updates - Object with path-value pairs
     * @param {boolean} silent - If true, don't trigger listeners
     */
    update(updates, silent = false) {
        Object.entries(updates).forEach(([path, value]) => {
            this.set(path, value, true); // Silent during batch update
        });
        
        if (!silent) {
            // Trigger a general update event
            this.notifyListeners('*', updates, null);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} path - Path to watch (use '*' for all changes)
     * @param {Function} callback - Callback function
     */
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
        
        return () => this.unsubscribe(path, callback);
    }

    /**
     * Unsubscribe from state changes
     */
    unsubscribe(path, callback) {
        const pathListeners = this.listeners.get(path);
        if (pathListeners) {
            pathListeners.delete(callback);
        }
    }

    /**
     * Notify listeners of state changes
     */
    notifyListeners(path, newValue, oldValue) {
        // Notify specific path listeners
        const pathListeners = this.listeners.get(path);
        if (pathListeners) {
            pathListeners.forEach(callback => callback(newValue, oldValue, path));
        }
        
        // Notify global listeners
        const globalListeners = this.listeners.get('*');
        if (globalListeners && path !== '*') {
            globalListeners.forEach(callback => callback(newValue, oldValue, path));
        }
    }

    /**
     * Sync current UI state to internal state (solves the filter sync issue)
     * This ensures the state reflects what the user actually sees
     */
    syncFromUI() {
        if (!domManager.initialized) {
            console.warn('Cannot sync from UI: DOM manager not initialized');
            return;
        }

        try {
            // Get current settings from UI
            const currentUISettings = settingsManager.getCurrentSettings();
            
            // Update filter state to match UI
            this.update({
                'filters.attempts': currentUISettings.attempts || 'unattempted',
                'filters.notes': currentUISettings.notes || 'all',
                'filters.scramble': currentUISettings.scramble || false,
                'filters.categories': currentUISettings.categories || [],
                'filters.providers': currentUISettings.providers || [],
                'timers.sessionTimeLimit': parseInt(currentUISettings.sessionTimeLimit) * 60 || 3600,
                'timers.questionLimit': parseInt(currentUISettings.questionLimit) || 50,
                'timers.sessionTimerEnabled': currentUISettings.enableSessionTimer || false,
                'timers.questionTimerEnabled': currentUISettings.enableQuestionTimer || false,
                'timers.stopwatchEnabled': currentUISettings.enableStopwatch !== false, // default true
                'timers.questionTimeLimit': parseInt(currentUISettings.questionTimeLimit) || 90,
                'hideAnswerMode': currentUISettings.hideAnswer || false
            }, true); // Silent update to avoid loops
            
            console.log('State synced from UI:', this.get('filters'));
        } catch (error) {
            console.error('Error syncing state from UI:', error);
        }
    }

    /**
     * Sync internal state to UI (when loading saved state)
     */
    syncToUI() {
        if (!domManager.initialized) {
            console.warn('Cannot sync to UI: DOM manager not initialized');
            return;
        }

        try {
            const filters = this.get('filters');
            const timers = this.get('timers');
            const hideAnswerMode = this.get('hideAnswerMode');
            
            const settingsToApply = {
                attempts: filters.attempts,
                notes: filters.notes,
                scramble: filters.scramble,
                categories: filters.categories,
                providers: filters.providers,
                sessionTimeLimit: Math.floor(timers.sessionTimeLimit / 60),
                questionLimit: timers.questionLimit,
                enableSessionTimer: timers.sessionTimerEnabled,
                enableQuestionTimer: timers.questionTimerEnabled,
                enableStopwatch: timers.stopwatchEnabled,
                questionTimeLimit: timers.questionTimeLimit,
                hideAnswer: hideAnswerMode
            };
            
            settingsManager.applySettings(settingsToApply);
            console.log('UI synced from state');
        } catch (error) {
            console.error('Error syncing state to UI:', error);
        }
    }

    /**
     * Get current filter settings (always from UI to ensure accuracy)
     */
    getCurrentFilters() {
        this.syncFromUI(); // Ensure state is current
        return this.get('filters');
    }

    /**
     * Save current session state to database
     */
    async saveSessionState() {
        try {
            const sessionState = {
                masterQuestionList: this.get('masterQuestionList'),
                currentQuestionIndex: this.get('currentQuestionIndex'),
                filters: this.getCurrentFilters(), // Always get fresh from UI
                hideAnswerMode: this.get('hideAnswerMode'),
                questionLimit: this.get('timers.questionLimit'),
                sessionTimeRemaining: this.get('timers.sessionTimeRemaining'),
                stopwatchTime: this.get('timers.stopwatchTime'),
                sessionAttempts: Array.from(this.get('sessionAttempts').entries()),
                // Timer settings
                sessionTimerEnabled: this.get('timers.sessionTimerEnabled'),
                questionTimerEnabled: this.get('timers.questionTimerEnabled'),
                stopwatchEnabled: this.get('timers.stopwatchEnabled'),
                sessionTimeLimit: this.get('timers.sessionTimeLimit'),
                questionTimeLimit: this.get('timers.questionTimeLimit')
            };

            await Promise.all([
                saveAppState('activeMasterQuestionList', sessionState.masterQuestionList),
                saveAppState('activeCurrentQuestionIndex', sessionState.currentQuestionIndex),
                saveAppState('activeFilters', sessionState.filters),
                saveAppState('activeHideAnswerMode', sessionState.hideAnswerMode),
                saveAppState('activeQuestionLimit', sessionState.questionLimit),
                saveAppState('activeSessionTimeRemaining', sessionState.sessionTimeRemaining),
                saveAppState('activeStopwatchTime', sessionState.stopwatchTime),
                saveAppState('activeSessionAttempts', sessionState.sessionAttempts),
                saveAppState('activeSessionTimerEnabled', sessionState.sessionTimerEnabled),
                saveAppState('activeQuestionTimerEnabled', sessionState.questionTimerEnabled),
                saveAppState('activeStopwatchEnabled', sessionState.stopwatchEnabled),
                saveAppState('activeSessionTimeLimit', sessionState.sessionTimeLimit),
                saveAppState('activeQuestionTimeLimit', sessionState.questionTimeLimit)
            ]);

            console.log('Session state saved to database');
        } catch (error) {
            console.error('Error saving session state:', error);
        }
    }

    /**
     * Load session state from database
     */
    async loadSessionState() {
        try {
            const [
                masterQuestionList,
                currentQuestionIndex,
                filters,
                hideAnswerMode,
                questionLimit,
                sessionTimeRemaining,
                stopwatchTime,
                sessionAttempts,
                sessionTimerEnabled,
                questionTimerEnabled,
                stopwatchEnabled,
                sessionTimeLimit,
                questionTimeLimit
            ] = await Promise.all([
                loadAppState('activeMasterQuestionList'),
                loadAppState('activeCurrentQuestionIndex'),
                loadAppState('activeFilters'),
                loadAppState('activeHideAnswerMode'),
                loadAppState('activeQuestionLimit'),
                loadAppState('activeSessionTimeRemaining'),
                loadAppState('activeStopwatchTime'),
                loadAppState('activeSessionAttempts'),
                loadAppState('activeSessionTimerEnabled'),
                loadAppState('activeQuestionTimerEnabled'),
                loadAppState('activeStopwatchEnabled'),
                loadAppState('activeSessionTimeLimit'),
                loadAppState('activeQuestionTimeLimit')
            ]);

            if (masterQuestionList && masterQuestionList.length > 0) {
                this.update({
                    'masterQuestionList': masterQuestionList,
                    'currentQuestionIndex': currentQuestionIndex || 0,
                    'filters': filters || this.get('filters'),
                    'hideAnswerMode': hideAnswerMode !== null ? hideAnswerMode : false,
                    'timers.questionLimit': questionLimit || 50,
                    'timers.sessionTimeRemaining': sessionTimeRemaining || this.get('timers.sessionTimeLimit'),
                    'timers.stopwatchTime': stopwatchTime || 0,
                    'timers.sessionTimerEnabled': sessionTimerEnabled || false,
                    'timers.questionTimerEnabled': questionTimerEnabled || false,
                    'timers.stopwatchEnabled': stopwatchEnabled !== false,
                    'timers.sessionTimeLimit': sessionTimeLimit || 3600,
                    'timers.questionTimeLimit': questionTimeLimit || 90
                });

                if (sessionAttempts && Array.isArray(sessionAttempts)) {
                    this.set('sessionAttempts', new Map(sessionAttempts));
                }

                console.log('Session state loaded from database');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error loading session state:', error);
            return false;
        }
    }

    /**
     * Reset quiz state
     */
    resetQuizState(keepQuizData = false) {
        const updates = {
            'masterQuestionList': [],
            'currentQuestionIndex': -1,
            'currentQuestionObject': null,
            'questionStartTime': null,
            'lastDisplayedGroupId': null,
            'sessionAttempts': new Map()
        };

        if (!keepQuizData) {
            updates['quizData'] = { questions: [], groups: [], fileName: null };
        }

        // Reset filters to defaults
        updates['filters'] = {
            attempts: 'unattempted',
            notes: 'all',
            scramble: true,
            categories: [],
            providers: []
        };

        // Reset timers
        updates['timers.sessionTimeRemaining'] = this.get('timers.sessionTimeLimit');
        updates['timers.questionTimeRemaining'] = 0;
        updates['timers.stopwatchTime'] = 0;

        // Clear timer intervals
        const timers = this.get('timers');
        if (timers.sessionTimerInterval) clearInterval(timers.sessionTimerInterval);
        if (timers.questionTimerInterval) clearInterval(timers.questionTimerInterval);
        if (timers.stopwatchInterval) clearInterval(timers.stopwatchInterval);
        
        updates['timers.sessionTimerInterval'] = null;
        updates['timers.questionTimerInterval'] = null;
        updates['timers.stopwatchInterval'] = null;

        // Reset annotation state
        updates['annotation.isActive'] = false;
        updates['annotation.isDrawing'] = false;
        updates['annotation.currentTool'] = 'pen';

        this.update(updates);
        console.log('Quiz state reset');
    }

    /**
     * Debug method to log current state
     */
    debug() {
        console.log('Current AppState:', JSON.parse(JSON.stringify(this.state, (key, value) => {
            if (value instanceof Map) {
                return Array.from(value.entries());
            }
            return value;
        })));
    }
}

// Create singleton instance
export const appState = new AppState();

// Export class for potential additional instances
export { AppState };
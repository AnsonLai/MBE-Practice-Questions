// js/dom-manager.js - Centralized DOM element management and caching

/**
 * DOMManager - Handles caching and retrieval of DOM elements
 * Reduces repetitive queries and provides a centralized way to manage element references
 */
class DOMManager {
    constructor() {
        this.elements = new Map();
        this.initialized = false;
    }

    /**
     * Initialize all element references after DOM is ready
     * Should be called after HTML fragments are loaded
     */
    initialize() {
        
        if (this.initialized) {
            console.warn('DOMManager already initialized');
            return;
        }

        // Define all element selectors in one place
        const elementSelectors = {
            // File handling
            jsonFile: 'jsonFile',
            loadJsonButton: 'loadJsonButton',
            saveJsonButton: 'saveJsonButton',
            loadSampleButton: 'loadSampleButton',

            // Quiz area elements
            quizArea: 'quiz-area',
            quizProgress: 'quiz-progress',
            groupIntro: 'current-group-intro',
            questionText: 'question-text',
            choicesForm: 'choices-form',
            attemptNotes: 'attempt-notes',
            submitAnswerButton: 'submit-answer-button',
            feedbackArea: 'feedback-area',
            nextQuestionButton: 'next-question-button',
            previousQuestionButton: 'previous-question-button',
            showAnswerButton: 'show-answer-button',
            endOfQuizMessage: 'end-of-quiz-message',

            // Settings and filters
            filterScramble: 'filter-scramble',
            sessionTimeLimit: 'session-time-limit',
            questionLimit: 'question-limit',
            enableSessionTimer: 'enable-session-timer',
            enableQuestionTimer: 'enable-question-timer',
            enableStopwatch: 'enable-stopwatch',
            questionTimeLimit: 'question-time-limit',
            settingHideAnswer: 'setting-hide-answer',
            filterCategoriesList: 'filter-categories-list',
            filterProvidersList: 'filter-providers-list',

            // Sidebar elements
            settingsSidebar: 'settings-sidebar',
            sidebarToggleButton: 'sidebar-toggle-button',
            closeSidebarButton: 'close-sidebar-button',
            applyFiltersButton: 'apply-filters-button',
            clearCategoriesButton: 'clear-categories-filter',
            clearProvidersButton: 'clear-providers-filter',
            clearAttemptsFilter: 'clear-attempts-filter',
            clearNotesFilter: 'clear-notes-filter',

            // Review and modals
            reviewSessionButton: 'review-session-button',
            finalReviewArea: 'final-review-area',
            finalReviewContent: 'final-review-content',
            restartQuizButton: 'restart-quiz-button',
            backToSettingsButton: 'back-to-settings-button',
            reviewModal: 'review-modal',
            reviewModalContent: 'review-modal-content',
            closeReviewModalButton: 'close-review-modal',

            // Performance modal
            performanceModal: 'performance-modal',
            closePerformanceModalButton: 'close-performance-modal',
            performanceStatsContent: 'performance-stats-content',

            // Annotation elements
            toggleAnnotationButton: 'toggleAnnotationButton',
            annotationArea: 'annotation-area',
            annotationCanvas: 'annotationCanvas',
            annotationControls: 'annotation-controls',
            penButton: 'penButton',
            highlighterButton: 'highlighterButton',
            eraserButton: 'eraserButton',
            clearAnnotationButton: 'clearAnnotationButton',

            // Past attempts
            pastAttempts: 'past-attempts',

            // Timer displays
            sessionTimerDisplay: 'session-timer-display',
            questionTimerDisplay: 'question-timer-display',
            stopwatchDisplay: 'stopwatch-display'
        };

        // Cache all elements
        for (const [key, id] of Object.entries(elementSelectors)) {
            const element = document.getElementById(id);
            if (element) {
                this.elements.set(key, element);
                console.log(`Found element: ${key} (${id})`);
            } else {
                console.warn(`Element with ID '${id}' not found for key '${key}'`);
            }
        }

        // Cache complex selectors
        this.cacheComplexSelectors();
        
        this.initialized = true;
        console.log('DOMManager initialized with', this.elements.size, 'elements');
    }

    /**
     * Cache elements that require complex selectors
     */
    cacheComplexSelectors() {
        // Question meta container
        const questionMetaContainer = document.querySelector('.question-meta-container');
        if (questionMetaContainer) {
            this.elements.set('questionMetaContainer', questionMetaContainer);
        }

        // Meta tooltip content
        const metaTooltipContent = document.getElementById('meta-tooltip-content');
        if (metaTooltipContent) {
            this.elements.set('metaTooltipContent', metaTooltipContent);
        }

        // Past attempts accordion elements
        const pastAttemptsContainer = this.get('pastAttempts');
        if (pastAttemptsContainer) {
            const accordionToggle = pastAttemptsContainer.querySelector('.accordion-toggle');
            const accordionContent = pastAttemptsContainer.querySelector('.accordion-content');
            
            if (accordionToggle) this.elements.set('pastAttemptsAccordionToggle', accordionToggle);
            if (accordionContent) this.elements.set('pastAttemptsAccordionContent', accordionContent);
        }

        // Annotation context
        const annotationCanvas = this.get('annotationCanvas');
        if (annotationCanvas) {
            const ctx = annotationCanvas.getContext('2d', { alpha: true });
            if (ctx) this.elements.set('annotationCtx', ctx);
        }
    }

    /**
     * Get a cached element by key
     * @param {string} key - The element key
     * @returns {HTMLElement|null} The cached element or null if not found
     */
    get(key) {
        return this.elements.get(key) || null;
    }

    /**
     * Check if an element exists in cache
     * @param {string} key - The element key
     * @returns {boolean} True if element exists
     */
    has(key) {
        return this.elements.has(key);
    }

    /**
     * Get multiple elements at once
     * @param {string[]} keys - Array of element keys
     * @returns {Object} Object with key-element pairs
     */
    getMultiple(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = this.get(key);
        }
        return result;
    }

    /**
     * Refresh a specific element's cache (useful if DOM changes)
     * @param {string} key - The element key
     * @param {string} id - The element ID to re-query
     */
    refresh(key, id) {
        const element = document.getElementById(id);
        if (element) {
            this.elements.set(key, element);
        } else {
            this.elements.delete(key);
            console.warn(`Could not refresh element '${key}' with ID '${id}'`);
        }
    }

    /**
     * Clear all cached elements (useful for cleanup)
     */
    clear() {
        this.elements.clear();
        this.initialized = false;
    }
}

/**
 * SettingsManager - Handles form settings with cached DOM elements
 */
class SettingsManager {
    constructor(domManager) {
        this.dom = domManager;
    }

    /**
     * Get current settings from form elements
     * @returns {Object} Current settings object
     */
    getCurrentSettings() {
        if (!this.dom.initialized) {
            console.error('DOMManager not initialized');
            return {};
        }

        return {
            attempts: this.getRadioValue('filter-attempts'),
            notes: this.getRadioValue('filter-notes'),
            scramble: this.getCheckboxValue('filterScramble'),
            sessionTimeLimit: this.getInputValue('sessionTimeLimit'),
            questionLimit: this.getInputValue('questionLimit'),
            enableSessionTimer: this.getCheckboxValue('enableSessionTimer'),
            enableQuestionTimer: this.getCheckboxValue('enableQuestionTimer'),
            enableStopwatch: this.getCheckboxValue('enableStopwatch'),
            questionTimeLimit: this.getInputValue('questionTimeLimit'),
            hideAnswer: this.getCheckboxValue('settingHideAnswer'),
            categories: this.getCheckedValues('filterCategoriesList'),
            providers: this.getCheckedValues('filterProvidersList')
        };
    }

    /**
     * Apply settings to form elements
     * @param {Object} settings - Settings object to apply
     */
    applySettings(settings) {
        if (!this.dom.initialized) {
            console.warn('DOMManager not initialized - skipping settings application');
            return;
        }
        
        if (!settings) {
            console.warn('No settings provided to applySettings');
            return;
        }

        try {
            // Radio buttons
            this.setRadioValue('filter-attempts', settings.attempts);
            this.setRadioValue('filter-notes', settings.notes);

            // Checkboxes
            this.setCheckboxValue('filterScramble', settings.scramble);
            this.setCheckboxValue('enableSessionTimer', settings.enableSessionTimer);
            this.setCheckboxValue('enableQuestionTimer', settings.enableQuestionTimer);
            this.setCheckboxValue('enableStopwatch', settings.enableStopwatch);
            this.setCheckboxValue('settingHideAnswer', settings.hideAnswer);

            // Number inputs
            this.setInputValue('sessionTimeLimit', settings.sessionTimeLimit);
            this.setInputValue('questionLimit', settings.questionLimit);
            this.setInputValue('questionTimeLimit', settings.questionTimeLimit);

            // Dynamic checkboxes (these might not exist yet if called before populateFilterOptions)
            if (settings.categories && Array.isArray(settings.categories)) {
                this.setCheckedValues('filterCategoriesList', settings.categories);
            }
            if (settings.providers && Array.isArray(settings.providers)) {
                this.setCheckedValues('filterProvidersList', settings.providers);
            }
            
        } catch (error) {
            console.error('SettingsManager: Error applying settings:', error);
        }
    }

    /**
     * Helper methods for form element manipulation
     */
    getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio?.value || null;
    }

    setRadioValue(name, value) {
        if (value) {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
            } else {
                console.warn(`Radio button not found: name="${name}" value="${value}"`);
            }
        }
    }

    getCheckboxValue(elementKey) {
        const element = this.dom.get(elementKey);
        return element?.checked || false;
    }

    setCheckboxValue(elementKey, value) {
        const element = this.dom.get(elementKey);
        if (element && typeof value !== 'undefined') {
            element.checked = value;
        } else if (!element) {
            console.warn(`Checkbox element not found: ${elementKey}`);
        }
    }

    getInputValue(elementKey) {
        const element = this.dom.get(elementKey);
        return element?.value || '';
    }

    setInputValue(elementKey, value) {
        const element = this.dom.get(elementKey);
        if (element && typeof value !== 'undefined') {
            element.value = value;
        } else if (!element) {
            console.warn(`Input element not found: ${elementKey}`);
        }
    }

    getCheckedValues(containerKey) {
        const container = this.dom.get(containerKey);
        if (!container) return [];
        
        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    setCheckedValues(containerKey, values) {
        const container = this.dom.get(containerKey);
        if (!container) {
            console.warn(`Container not found for dynamic checkboxes: ${containerKey}`);
            return;
        }
        
        if (!Array.isArray(values)) {
            console.warn(`Invalid values for ${containerKey}:`, values);
            return;
        }

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        if (checkboxes.length === 0) {
            console.warn(`No checkboxes found in container: ${containerKey}`);
            return;
        }

        let checkedCount = 0;
        checkboxes.forEach(cb => {
            const shouldCheck = values.includes(cb.value);
            cb.checked = shouldCheck;
            if (shouldCheck) checkedCount++;
        });
        
    }
}

// Create singleton instances
export const domManager = new DOMManager();
export const settingsManager = new SettingsManager(domManager);

// Export classes for potential additional instances
export { DOMManager, SettingsManager };
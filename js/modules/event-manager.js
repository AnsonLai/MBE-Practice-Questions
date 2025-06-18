// js/modules/event-manager.js - Centralized event handling and listener management

import { domManager } from '../dom-manager.js';
import { saveCurrentSettingsToDB } from '../db.js';
import { toggleSidebar, openSidebar, closeSidebar, clearCheckboxes } from '../ui.js';
import { appState } from '../state-manager.js';

/**
 * EventManager - Handles all event listeners in an organized way
 */
export class EventManager {
    constructor() {
        this.initialized = false;
        this.eventHandlers = new Map(); // Store event handlers for cleanup
    }

    /**
     * Initialize all event listeners
     */
    initialize() {
        if (this.initialized) {
            console.warn('EventManager already initialized');
            return;
        }

        this.setupFileHandlers();
        this.setupSettingsHandlers();
        this.setupQuizHandlers();
        this.setupNavigationHandlers();
        this.setupModalHandlers();
        this.setupTimerHandlers();
        this.setupAnnotationHandlers();
        this.setupAccordionHandlers();
        this.setupPerformanceHandlers();
        this.setupWindowHandlers();

        this.initialized = true;
        console.log('EventManager initialized');
    }

    /**
     * Set up file handling events (load/save JSON)
     */
    setupFileHandlers() {
        this.addEventHandler('loadJsonButton', 'click', this.handleLoadJson.bind(this));
        this.addEventHandler('saveJsonButton', 'click', this.handleSaveJson.bind(this));
        this.addEventHandler('loadSampleButton', 'click', this.handleLoadSampleData.bind(this));
    }

    /**
     * Set up settings-related event handlers
     */
    setupSettingsHandlers() {
        // Radio button handlers
        const radioSelectors = [
            'input[name="filter-attempts"]',
            'input[name="filter-notes"]'
        ];

        radioSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(radio => {
                this.addEventListener(radio, 'change', saveCurrentSettingsToDB);
            });
        });

        // Checkbox and input handlers
        const settingsElements = [
            'filterScramble',
            'sessionTimeLimit', 
            'questionLimit',
            'enableSessionTimer',
            'enableQuestionTimer', 
            'enableStopwatch',
            'questionTimeLimit',
            'settingHideAnswer'
        ];

        settingsElements.forEach(elementKey => {
            this.addEventHandler(elementKey, 'change', saveCurrentSettingsToDB);
        });

        // Dynamic checkbox handlers (categories and providers)
        this.addEventHandler('filterCategoriesList', 'change', (event) => {
            if (event.target.type === 'checkbox') {
                saveCurrentSettingsToDB();
            }
        });

        this.addEventHandler('filterProvidersList', 'change', (event) => {
            if (event.target.type === 'checkbox') {
                saveCurrentSettingsToDB();
            }
        });

        // Clear filter buttons
        this.addEventHandler('clearCategoriesButton', 'click', () => {
            clearCheckboxes(domManager.get('filterCategoriesList'));
        });

        this.addEventHandler('clearProvidersButton', 'click', () => {
            clearCheckboxes(domManager.get('filterProvidersList'));
        });

        // Clear specific filter buttons
        this.addEventListener(
            document.getElementById('clear-attempts-filter'),
            'click',
            () => {
                const radio = document.querySelector('input[name="filter-attempts"][value="all"]');
                if (radio) radio.checked = true;
            }
        );

        this.addEventListener(
            document.getElementById('clear-notes-filter'),
            'click', 
            () => {
                const radio = document.querySelector('input[name="filter-notes"][value="all"]');
                if (radio) radio.checked = true;
            }
        );
    }

    /**
     * Set up quiz-related event handlers
     */
    setupQuizHandlers() {
        this.addEventHandler('submitAnswerButton', 'click', this.handleSubmitAnswer.bind(this));
        this.addEventHandler('showAnswerButton', 'click', this.showCurrentAnswer.bind(this));
        this.addEventHandler('applyFiltersButton', 'click', this.applyFiltersAndStartQuiz.bind(this));
    }

    /**
     * Set up navigation event handlers
     */
    setupNavigationHandlers() {
        this.addEventHandler('nextQuestionButton', 'click', this.handleNextQuestion.bind(this));
        this.addEventHandler('previousQuestionButton', 'click', this.handlePreviousQuestion.bind(this));
        
        // Sidebar navigation
        this.addEventHandler('sidebarToggleButton', 'click', toggleSidebar);
        this.addEventHandler('closeSidebarButton', 'click', closeSidebar);
    }

    /**
     * Set up modal event handlers
     */
    setupModalHandlers() {
        // Review modal
        this.addEventHandler('reviewSessionButton', 'click', this.showReviewModal.bind(this));
        this.addEventHandler('closeReviewModalButton', 'click', this.closeReviewModal.bind(this));
        this.addEventHandler('reviewModal', 'click', (event) => {
            if (event.target === domManager.get('reviewModal')) {
                this.closeReviewModal();
            }
        });

        // Final review handlers
        this.addEventHandler('restartQuizButton', 'click', this.handleRestartQuiz.bind(this));
        this.addEventHandler('backToSettingsButton', 'click', this.handleBackToSettings.bind(this));
    }

    /**
     * Set up timer-related event handlers
     */
    setupTimerHandlers() {
        // Timer enable/disable handlers
        this.addEventListener(
            document.getElementById('enable-session-timer'),
            'change',
            (e) => {
                appState.set('timers.sessionTimerEnabled', e.target.checked);
                this.updateTimerVisibility();
            }
        );

        this.addEventListener(
            document.getElementById('enable-question-timer'),
            'change',
            (e) => {
                appState.set('timers.questionTimerEnabled', e.target.checked);
                this.updateTimerVisibility();
            }
        );

        this.addEventListener(
            document.getElementById('enable-stopwatch'),
            'change',
            (e) => {
                appState.set('timers.stopwatchEnabled', e.target.checked);
                this.updateTimerVisibility();
            }
        );

        // Timer limit handlers
        this.addEventListener(
            document.getElementById('session-time-limit'),
            'change',
            (e) => {
                const minutes = Math.max(1, parseInt(e.target.value, 10) || 60);
                appState.set('timers.sessionTimeLimit', minutes * 60);
            }
        );

        this.addEventListener(
            document.getElementById('question-time-limit'),
            'change',
            (e) => {
                const seconds = Math.max(10, parseInt(e.target.value, 10) || 90);
                appState.set('timers.questionTimeLimit', seconds);
            }
        );

        this.addEventListener(
            document.getElementById('question-limit'),
            'change',
            (e) => {
                const limit = Math.max(1, parseInt(e.target.value, 10) || 50);
                appState.set('timers.questionLimit', limit);
            }
        );
    }

    /**
     * Set up annotation event handlers
     */
    setupAnnotationHandlers() {
        this.addEventHandler('toggleAnnotationButton', 'click', this.toggleAnnotationMode.bind(this));
        
        const annotationCanvas = domManager.get('annotationCanvas');
        if (annotationCanvas) {
            // Mouse events
            this.addEventListener(annotationCanvas, 'mousedown', this.startDrawing.bind(this));
            this.addEventListener(annotationCanvas, 'mousemove', this.draw.bind(this));
            this.addEventListener(annotationCanvas, 'mouseup', this.stopDrawing.bind(this));
            this.addEventListener(annotationCanvas, 'mouseout', this.stopDrawing.bind(this));

            // Touch events
            this.addEventListener(annotationCanvas, 'touchstart', this.startDrawing.bind(this), { passive: false });
            this.addEventListener(annotationCanvas, 'touchmove', this.draw.bind(this), { passive: false });
            this.addEventListener(annotationCanvas, 'touchend', this.stopDrawing.bind(this));
            this.addEventListener(annotationCanvas, 'touchcancel', this.stopDrawing.bind(this));
        }

        // Annotation tool buttons
        this.addEventHandler('penButton', 'click', () => this.setTool('pen'));
        this.addEventHandler('highlighterButton', 'click', () => this.setTool('highlighter'));
        this.addEventHandler('eraserButton', 'click', () => this.setTool('eraser'));
        this.addEventHandler('clearAnnotationButton', 'click', this.clearCanvas.bind(this));
    }

    /**
     * Set up accordion event handlers
     */
    setupAccordionHandlers() {
        const pastAttemptsAccordionToggle = domManager.get('pastAttemptsAccordionToggle');
        const pastAttemptsAccordionContent = domManager.get('pastAttemptsAccordionContent');
        
        if (pastAttemptsAccordionToggle && pastAttemptsAccordionContent) {
            this.addEventListener(pastAttemptsAccordionToggle, 'click', () => {
                const isExpanded = pastAttemptsAccordionToggle.getAttribute('aria-expanded') === 'true';
                pastAttemptsAccordionToggle.setAttribute('aria-expanded', String(!isExpanded));
                pastAttemptsAccordionContent.classList.toggle('open');
                
                if (!isExpanded) {
                    // Opening
                    pastAttemptsAccordionContent.style.display = 'block';
                    pastAttemptsAccordionContent.style.maxHeight = pastAttemptsAccordionContent.scrollHeight + "px";
                } else {
                    // Closing
                    pastAttemptsAccordionContent.style.maxHeight = '0';
                    pastAttemptsAccordionContent.addEventListener('transitionend', function handler() {
                        if (pastAttemptsAccordionToggle.getAttribute('aria-expanded') === 'false') {
                            pastAttemptsAccordionContent.style.display = 'none';
                        }
                        pastAttemptsAccordionContent.removeEventListener('transitionend', handler);
                    });
                }
            });
        }
    }

    /**
     * Set up performance dashboard handlers
     */
    setupPerformanceHandlers() {
        // Create and set up performance button
        const referenceButton = domManager.get('applyFiltersButton');
        if (referenceButton) {
            const performanceButton = document.createElement('button');
            performanceButton.id = 'show-performance-button';
            performanceButton.textContent = 'Performance Dashboard';
            performanceButton.disabled = true;
            
            appState.set('ui.performanceButton', performanceButton);
            
            referenceButton.parentNode?.insertBefore(performanceButton, referenceButton.nextSibling);
            performanceButton.style.marginTop = "1rem";
            
            this.addEventListener(performanceButton, 'click', this.showPerformanceModal.bind(this));
        }

        // Performance modal handlers
        this.addEventHandler('closePerformanceModalButton', 'click', this.closePerformanceModal.bind(this));
        this.addEventHandler('performanceModal', 'click', (event) => {
            if (event.target === domManager.get('performanceModal')) {
                this.closePerformanceModal();
            }
        });
    }

    /**
     * Set up window-level event handlers
     */
    setupWindowHandlers() {
        this.addEventListener(window, 'beforeunload', async () => {
            await this.saveNotesForCurrentAttempt();
            
            // Save active quiz session state if a quiz is in progress
            const masterQuestionList = appState.get('masterQuestionList');
            const currentQuestionIndex = appState.get('currentQuestionIndex');
            
            if (masterQuestionList && masterQuestionList.length > 0 && 
                currentQuestionIndex >= 0 && currentQuestionIndex < masterQuestionList.length) {
                await appState.saveSessionState();
            }
        });
    }

    /**
     * Helper method to add event handler with DOM manager
     * @param {string} elementKey - DOM manager element key
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     */
    addEventHandler(elementKey, event, handler, options = {}) {
        const element = domManager.get(elementKey);
        if (element) {
            this.addEventListener(element, event, handler, options);
        } else {
            console.warn(`Element not found for event handler: ${elementKey}`);
        }
    }

    /**
     * Helper method to add event listener and track for cleanup
     * @param {Element} element - DOM element
     * @param {string} event - Event type  
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) return;

        element.addEventListener(event, handler, options);
        
        // Store for potential cleanup
        const key = `${element.id || 'anonymous'}-${event}`;
        if (!this.eventHandlers.has(key)) {
            this.eventHandlers.set(key, []);
        }
        this.eventHandlers.get(key).push({ element, event, handler, options });
    }

    /**
     * Clean up all event listeners
     */
    cleanup() {
        this.eventHandlers.forEach((handlers) => {
            handlers.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        
        this.eventHandlers.clear();
        this.initialized = false;
        console.log('EventManager cleaned up');
    }

    // Placeholder methods for event handlers that will be implemented
    // These would be moved from the main.js file

    handleLoadJson() {
        console.log('Load JSON handler - to be implemented');
    }

    handleSaveJson() {
        console.log('Save JSON handler - to be implemented');
    }

    handleLoadSampleData() {
        console.log('Load sample data handler - to be implemented');
    }

    handleSubmitAnswer() {
        console.log('Submit answer handler - to be implemented');
    }

    showCurrentAnswer() {
        console.log('Show current answer handler - to be implemented');
    }

    applyFiltersAndStartQuiz() {
        console.log('Apply filters and start quiz handler - to be implemented');
    }

    handleNextQuestion() {
        console.log('Next question handler - to be implemented');
    }

    handlePreviousQuestion() {
        console.log('Previous question handler - to be implemented');
    }

    showReviewModal() {
        console.log('Show review modal handler - to be implemented');
    }

    closeReviewModal() {
        console.log('Close review modal handler - to be implemented');
    }

    handleRestartQuiz() {
        console.log('Restart quiz handler - to be implemented');
    }

    handleBackToSettings() {
        console.log('Back to settings handler - to be implemented');
    }

    updateTimerVisibility() {
        console.log('Update timer visibility - to be implemented');
    }

    toggleAnnotationMode() {
        console.log('Toggle annotation mode - to be implemented');
    }

    startDrawing() {
        console.log('Start drawing - to be implemented');
    }

    draw() {
        console.log('Draw - to be implemented');
    }

    stopDrawing() {
        console.log('Stop drawing - to be implemented');
    }

    setTool(tool) {
        console.log('Set tool - to be implemented:', tool);
    }

    clearCanvas() {
        console.log('Clear canvas - to be implemented');
    }

    showPerformanceModal() {
        console.log('Show performance modal - to be implemented');
    }

    closePerformanceModal() {
        console.log('Close performance modal - to be implemented');
    }

    async saveNotesForCurrentAttempt() {
        console.log('Save notes for current attempt - to be implemented');
    }
}

// Create singleton instance
export const eventManager = new EventManager();
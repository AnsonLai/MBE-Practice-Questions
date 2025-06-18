// js/modules/quiz-manager.js - Quiz session and question management

import { appState } from '../state-manager.js';
import { domManager } from '../dom-manager.js';
import { escapeHtml } from '../ui.js';
import { saveQuestionToDB } from '../db.js';

/**
 * QuizManager - Handles quiz session logic, question navigation, and quiz flow
 */
export class QuizManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the quiz manager
     */
    initialize() {
        if (this.initialized) {
            console.warn('QuizManager already initialized');
            return;
        }

        this.initialized = true;
        console.log('QuizManager initialized');
    }

    /**
     * Start a new quiz session with filtered questions
     * @param {Array} filteredQuestions - Questions to include in the quiz
     */
    async startQuizSession(filteredQuestions) {
        if (!filteredQuestions || filteredQuestions.length === 0) {
            throw new Error('No questions provided for quiz session');
        }

        // Update state with new quiz session
        appState.update({
            'masterQuestionList': filteredQuestions,
            'currentQuestionIndex': -1, // Will be incremented to 0 when first question loads
            'currentQuestionObject': null,
            'sessionAttempts': new Map(),
            'questionStartTime': null,
            'lastDisplayedGroupId': null
        });

        // Reset timers
        const timers = appState.get('timers');
        appState.update({
            'timers.sessionTimeRemaining': timers.sessionTimeLimit,
            'timers.questionTimeRemaining': 0,
            'timers.stopwatchTime': 0
        });

        // Clear any existing timer intervals
        this.clearTimerIntervals();

        // Save session state to database for restoration
        await appState.saveSessionState();

        // Update UI elements
        this.showQuizUI();

        // Start the quiz by displaying the first question
        await this.displayNextQuestion();

        console.log(`Quiz started with ${filteredQuestions.length} questions`);
    }

    /**
     * Display the next question in the quiz
     */
    async displayNextQuestion() {
        const masterQuestionList = appState.get('masterQuestionList');
        const currentIndex = appState.get('currentQuestionIndex');
        
        if (currentIndex + 1 >= masterQuestionList.length) {
            this.endQuiz();
            return;
        }

        const newIndex = currentIndex + 1;
        appState.set('currentQuestionIndex', newIndex);
        
        const question = masterQuestionList[newIndex];
        appState.set('currentQuestionObject', question);
        appState.set('questionStartTime', Date.now());

        await this.renderQuestion(question);
        this.updateQuizProgress();
    }

    /**
     * Display the previous question in the quiz
     */
    async displayPreviousQuestion() {
        const currentIndex = appState.get('currentQuestionIndex');
        
        if (currentIndex <= 0) {
            console.warn('Already at first question');
            return;
        }

        const newIndex = currentIndex - 1;
        appState.set('currentQuestionIndex', newIndex);
        
        const masterQuestionList = appState.get('masterQuestionList');
        const question = masterQuestionList[newIndex];
        appState.set('currentQuestionObject', question);

        await this.renderQuestion(question);
        this.updateQuizProgress();
    }

    /**
     * Render a question to the UI
     * @param {Object} question - Question object to render
     */
    async renderQuestion(question) {
        if (!question) {
            console.error('No question provided to render');
            return;
        }

        // Update quiz data with full question details
        const quizData = appState.get('quizData');
        const fullQuestion = quizData.questions.find(q => q.question_id === question.question_id);
        
        if (!fullQuestion) {
            console.error('Could not find full question data for ID:', question.question_id);
            return;
        }

        // Display group intro if needed
        this.displayGroupIntro(fullQuestion);

        // Display question metadata
        this.displayQuestionMetadata(fullQuestion);

        // Display question text
        this.displayQuestionText(fullQuestion);

        // Display answer choices
        this.displayAnswerChoices(fullQuestion);

        // Set up question UI state
        this.setupQuestionUIState(fullQuestion);

        // Display past attempts
        this.renderPastAttempts(fullQuestion);

        // Handle annotation mode
        this.handleAnnotationMode();
    }

    /**
     * Display group introduction if this is a new group
     * @param {Object} question - Question object
     */
    displayGroupIntro(question) {
        const groupIntro = domManager.get('groupIntro');
        if (!groupIntro) return;

        const lastDisplayedGroupId = appState.get('lastDisplayedGroupId');
        
        if (question.group_id && question.group_id !== lastDisplayedGroupId) {
            const quizData = appState.get('quizData');
            const group = quizData.groups?.find(g => g.group_id === question.group_id);
            
            if (group) {
                const h3 = groupIntro.querySelector('h3');
                const p = groupIntro.querySelector('p');
                
                if (h3) h3.textContent = group.group_name || 'Group';
                if (p) p.innerHTML = escapeHtml(group.group_instructions || '').replace(/\n/g, '<br>');
                
                groupIntro.classList.add('has-content');
                groupIntro.style.display = 'block';
                
                appState.set('lastDisplayedGroupId', question.group_id);
            }
        } else if (!question.group_id) {
            groupIntro.classList.remove('has-content');
            groupIntro.style.display = 'none';
        }
    }

    /**
     * Display question metadata (category, source, etc.)
     * @param {Object} question - Question object
     */
    displayQuestionMetadata(question) {
        const metaTooltipContent = domManager.get('metaTooltipContent');
        if (!metaTooltipContent) return;

        let metaHtml = '';
        if (question.category) {
            metaHtml += `<strong>Category:</strong> ${escapeHtml(question.category)}<br>`;
        }
        if (question.source?.provider) {
            metaHtml += `<strong>Source:</strong> ${escapeHtml(question.source.provider)}`;
            if (question.source.year) {
                metaHtml += ` (${escapeHtml(question.source.year)})`;
            }
            metaHtml += '<br>';
        }
        if (question.question_id) {
            metaHtml += `<strong>ID:</strong> ${escapeHtml(question.question_id)}`;
        }

        metaTooltipContent.innerHTML = metaHtml || "No metadata available.";
    }

    /**
     * Display question text
     * @param {Object} question - Question object
     */
    displayQuestionText(question) {
        const questionText = domManager.get('questionText');
        if (!questionText) return;

        questionText.innerText = question.question_text || 'Question text not available';
        
        // Handle annotation mode
        const isAnnotationActive = appState.get('annotation.isActive');
        if (!isAnnotationActive) {
            questionText.classList.remove('drawn-on-canvas');
            questionText.style.display = '';
        }
    }

    /**
     * Display answer choices
     * @param {Object} question - Question object
     */
    displayAnswerChoices(question) {
        const choicesForm = domManager.get('choicesForm');
        if (!choicesForm) return;

        choicesForm.innerHTML = ''; // Clear previous choices
        
        const choiceOrder = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        if (question.choices) {
            choiceOrder.forEach(key => {
                if (question.choices[key]) {
                    const choiceItemDiv = document.createElement('div');
                    choiceItemDiv.className = 'choice-item';

                    const choiceLabel = document.createElement('label');
                    const choiceInput = document.createElement('input');
                    choiceInput.type = 'radio';
                    choiceInput.name = 'answer';
                    choiceInput.value = key;
                    choiceInput.id = `choice-${key}`;

                    const choiceTextSpan = document.createElement('span');
                    choiceTextSpan.innerHTML = `<strong>${key}.</strong> ${escapeHtml(question.choices[key])}`;

                    choiceLabel.appendChild(choiceInput);
                    choiceLabel.appendChild(choiceTextSpan);
                    choiceItemDiv.appendChild(choiceLabel);
                    choicesForm.appendChild(choiceItemDiv);
                }
            });
        }
    }

    /**
     * Set up the UI state for the current question
     * @param {Object} question - Question object
     */
    setupQuestionUIState(question) {
        const feedbackArea = domManager.get('feedbackArea');
        const attemptNotes = domManager.get('attemptNotes');
        const submitAnswerButton = domManager.get('submitAnswerButton');
        const nextQuestionButton = domManager.get('nextQuestionButton');
        const previousQuestionButton = domManager.get('previousQuestionButton');
        const showAnswerButton = domManager.get('showAnswerButton');
        const reviewSessionButton = domManager.get('reviewSessionButton');

        // Default UI state
        if (feedbackArea) {
            feedbackArea.style.display = 'none';
            feedbackArea.innerHTML = '';
        }
        if (attemptNotes) attemptNotes.disabled = false;
        if (reviewSessionButton) reviewSessionButton.style.display = 'none';

        // Check if question was already answered in this session
        const sessionAttempts = appState.get('sessionAttempts');
        const currentIndex = appState.get('currentQuestionIndex');

        if (sessionAttempts.has(question.question_id)) {
            this.setupAnsweredQuestionState(question, sessionAttempts.get(question.question_id));
        } else {
            this.setupUnansweredQuestionState();
        }

        // Set up navigation buttons
        if (nextQuestionButton) nextQuestionButton.style.display = sessionAttempts.has(question.question_id) ? 'inline-block' : 'none';
        if (previousQuestionButton) {
            previousQuestionButton.style.display = currentIndex > 0 ? 'inline-block' : 'none';
        }
        if (showAnswerButton) showAnswerButton.style.display = 'none';
    }

    /**
     * Set up UI for a question that was already answered
     * @param {Object} question - Question object
     * @param {Object} sessionAttemptData - Session attempt data
     */
    setupAnsweredQuestionState(question, sessionAttemptData) {
        const choicesForm = domManager.get('choicesForm');
        const submitAnswerButton = domManager.get('submitAnswerButton');
        const attemptNotes = domManager.get('attemptNotes');

        const attempt = sessionAttemptData.attempt;

        // Pre-select the radio button
        if (choicesForm) {
            const chosenAnswerInput = choicesForm.querySelector(`input[type="radio"][value="${attempt.chosen_answer}"]`);
            if (chosenAnswerInput) chosenAnswerInput.checked = true;

            // Disable all choices
            choicesForm.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
        }

        // Disable submit button
        if (submitAnswerButton) {
            submitAnswerButton.disabled = true;
            submitAnswerButton.style.display = 'none';
        }

        // Populate notes
        if (attemptNotes) attemptNotes.value = attempt.notes || '';

        // Show answer feedback
        this.showAnswerFeedback(true);
    }

    /**
     * Set up UI for an unanswered question
     */
    setupUnansweredQuestionState() {
        const choicesForm = domManager.get('choicesForm');
        const submitAnswerButton = domManager.get('submitAnswerButton');
        const attemptNotes = domManager.get('attemptNotes');

        if (attemptNotes) attemptNotes.value = '';
        
        if (choicesForm) {
            choicesForm.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = false);
        }

        if (submitAnswerButton) {
            submitAnswerButton.disabled = false;
            submitAnswerButton.style.display = 'inline-block';
        }
    }

    /**
     * Show answer feedback for the current question
     * @param {boolean} showFeedback - Whether to show feedback
     */
    showAnswerFeedback(showFeedback) {
        // This method would contain the feedback display logic
        // Implementation would be moved from the existing showCurrentAnswerFeedback function
        console.log('Showing answer feedback:', showFeedback);
    }

    /**
     * Render past attempts for a question
     * @param {Object} question - Question object
     */
    renderPastAttempts(question) {
        // This method would contain the past attempts rendering logic
        // Implementation would be moved from the existing renderPastAttempts function
        console.log('Rendering past attempts for question:', question.question_id);
    }

    /**
     * Handle annotation mode for the current question
     */
    handleAnnotationMode() {
        const isAnnotationActive = appState.get('annotation.isActive');
        const questionText = domManager.get('questionText');
        const groupIntro = domManager.get('groupIntro');

        if (isAnnotationActive && questionText && groupIntro) {
            questionText.classList.add('drawn-on-canvas');
            groupIntro.classList.add('drawn-on-canvas');

            // Resize canvas for new content
            requestAnimationFrame(() => {
                // This would call the resizeCanvas function
                console.log('Resizing canvas for new question');
            });
        }
    }

    /**
     * Update quiz progress display
     */
    updateQuizProgress() {
        const quizProgress = domManager.get('quizProgress');
        if (!quizProgress) return;

        const currentIndex = appState.get('currentQuestionIndex');
        const masterQuestionList = appState.get('masterQuestionList');
        
        if (masterQuestionList && masterQuestionList.length > 0) {
            quizProgress.textContent = `Question ${currentIndex + 1} of ${masterQuestionList.length}`;
        }
    }

    /**
     * Show quiz UI elements
     */
    showQuizUI() {
        const quizArea = domManager.get('quizArea');
        const endOfQuizMessage = domManager.get('endOfQuizMessage');
        const finalReviewArea = domManager.get('finalReviewArea');
        const toggleAnnotationButton = domManager.get('toggleAnnotationButton');

        if (quizArea) quizArea.style.display = 'block';
        if (endOfQuizMessage) endOfQuizMessage.style.display = 'none';
        if (finalReviewArea) finalReviewArea.style.display = 'none';
        if (toggleAnnotationButton) toggleAnnotationButton.style.display = 'inline-block';

        const performanceButton = appState.get('ui.performanceButton');
        if (performanceButton) performanceButton.disabled = false;
    }

    /**
     * End the current quiz session
     */
    endQuiz() {
        console.log('Quiz session ended');
        
        // Clear timer intervals
        this.clearTimerIntervals();

        // Show end of quiz UI
        const quizArea = domManager.get('quizArea');
        const endOfQuizMessage = domManager.get('endOfQuizMessage');

        if (quizArea) quizArea.style.display = 'none';
        if (endOfQuizMessage) {
            endOfQuizMessage.style.display = 'block';
            endOfQuizMessage.innerHTML = '<h2>Quiz Complete!</h2><p>You have completed all questions in this session.</p>';
        }
    }

    /**
     * Clear all timer intervals
     */
    clearTimerIntervals() {
        const timers = appState.get('timers');
        
        if (timers.sessionTimerInterval) {
            clearInterval(timers.sessionTimerInterval);
            appState.set('timers.sessionTimerInterval', null);
        }
        
        if (timers.questionTimerInterval) {
            clearInterval(timers.questionTimerInterval);
            appState.set('timers.questionTimerInterval', null);
        }
        
        if (timers.stopwatchInterval) {
            clearInterval(timers.stopwatchInterval);
            appState.set('timers.stopwatchInterval', null);
        }
    }

    /**
     * Reset quiz state
     * @param {boolean} keepQuizData - Whether to keep loaded quiz data
     */
    resetQuiz(keepQuizData = false) {
        this.clearTimerIntervals();
        appState.resetQuizState(keepQuizData);
        
        // Reset UI elements
        const quizArea = domManager.get('quizArea');
        const endOfQuizMessage = domManager.get('endOfQuizMessage');
        const finalReviewArea = domManager.get('finalReviewArea');

        if (quizArea) quizArea.style.display = 'none';
        if (endOfQuizMessage) endOfQuizMessage.style.display = 'none';
        if (finalReviewArea) finalReviewArea.style.display = 'none';

        console.log('Quiz reset completed');
    }
}

// Create singleton instance
export const quizManager = new QuizManager();
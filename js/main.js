import { db, saveCurrentSettingsToDB, loadUserSettingsFromDB, loadQuizDataFromDB, saveQuestionToDB, saveAppState, loadAppState, clearActiveSessionState } from './db.js';
import { escapeHtml, formatTime, toggleSidebar, openSidebar, closeSidebar, populateCheckboxList, clearCheckboxes, loadHtmlFragments, populateCategorySubcategoryFilter, showNotification } from './ui.js';
import { getElement, querySelector, querySelectorAll, initializeElements, createElement } from './dom.js';
import { filterQuestions, prepareQuizQuestions } from './filterQuestions.js';
import { initializeFileControls, updateFileControlsVisibility } from './fileControls.js';

const mbe_categories_with_subcategories = {
    "Civil Procedure": [
        "Jurisdiction: Subject Matter & Personal",
        "Venue, Transfer & Forum Non Conveniens",
        "Service of Process & Law Applied by Federal Courts (Erie Doctrine)",
        "Pleadings, Rule 11 & Joinder (incl. Class Actions)",
        "Discovery, Disclosure & Pretrial Conferences/Orders",
        "Injunctions & Adjudication Without Trial (Summary Judgment, Dismissals)",
        "Jury Trials (Right to, Selection, Instructions)",
        "Motions (Pretrial, Judgment as a Matter of Law, Post-trial)",
        "Verdicts, Judgments & Preclusion (Claim & Issue)",
        "Appealability & Review",
        "Other Civil Procedure Issues"
    ],
    "Constitutional Law": [
        "The Nature of Judicial Review (Standing, Ripeness, Mootness, Political Questions)",
        "Separation of Powers: Congressional Powers (Commerce, Taxing, Spending)",
        "Separation of Powers: Presidential Powers & Interbranch Relations",
        "Federalism (Supremacy, Preemption, Dormant Commerce Clause, Intergovernmental Immunities)",
        "State Action Doctrine",
        "Due Process (Procedural & Substantive)",
        "Equal Protection",
        "First Amendment: Freedom of Speech & Press",
        "First Amendment: Freedom of Religion (Establishment & Free Exercise) & Association",
        "Takings Clause & Contracts Clause",
        "Other Individual Rights (Privileges & Immunities, Bills of Attainder, Ex Post Facto Laws)",
        "Eleventh Amendment & State Sovereign Immunity",
        "Other Constitutional Law Issues"
    ],
    "Contracts and Sales": [
        "Contract Formation: Mutual Assent (Offer & Acceptance, Implied-in-Fact)",
        "Contract Formation: Consideration & Enforceable Obligations without Consideration (Promissory Estoppel, Restitution)",
        "Defenses to Contract Enforceability (Incapacity, Duress, Mistake, Fraud, Illegality, Statute of Frauds)",
        "Contract Content & Meaning (Parol Evidence, Interpretation, Omitted/Implied Terms)",
        "UCC Article 2: Formation, Terms, Warranties & Risk of Loss",
        "Conditions (Express & Constructive) & Excuses for Non-Performance (Impossibility, Impracticability, Frustration)",
        "Breach of Contract (Material/Partial, Anticipatory Repudiation) & Obligations of Good Faith",
        "Contract Remedies: Monetary Damages (Expectation, Consequential, Incidental, Liquidated)",
        "Contract Remedies: Equitable Relief & Restitution (Specific Performance, Rescission, Reformation)",
        "Third-Party Rights (Beneficiaries, Assignment of Rights, Delegation of Duties)",
        "Discharge of Contractual Duties (Accord & Satisfaction, Substituted Contract, Novation, Rescission, Release)",
        "Modification of Contracts",
        "Other Contracts & Sales Issues"
    ],
    "Criminal Law and Procedure": [
        "Homicide (Intended Killings, Unintended Killings, Felony Murder)",
        "Other Crimes Against Persons & Property (Theft, Robbery, Burglary, Assault, Battery, Rape, Arson, Possession)",
        "Inchoate Offenses (Attempt, Conspiracy, Solicitation) & Parties to Crime",
        "General Principles of Criminal Liability (Actus Reus, Mens Rea, Strict Liability, Causation)",
        "Defenses to Crimes (Insanity, Intoxication, Justification, Excuse, Mistake)",
        "Fourth Amendment: Arrest, Search & Seizure",
        "Fifth Amendment: Confessions/Self-Incrimination (Miranda), Double Jeopardy, Due Process",
        "Sixth Amendment: Right to Counsel, Fair Trial (Speedy Trial, Jury, Confrontation), Identification Procedures",
        "Pre-Trial Procedures (Bail, Grand Juries) & Guilty Pleas",
        "Sentencing, Punishment (Eighth Amendment - Cruel & Unusual) & Appeals",
        "Burdens of Proof & Persuasion",
        "Jurisdiction in Criminal Cases",
        "Other Criminal Law & Procedure Issues"
    ],
    "Evidence": [
        "Presentation of Evidence: Introduction, Objections, Witness Competency & Examination",
        "Relevance & Reasons for Excluding Relevant Evidence (Unfair Prejudice, Confusion, Waste of Time)",
        "Authentication & Identification (incl. Best Evidence Rule for Writings, Recordings, Photos)",
        "Character Evidence, Habit & Similar Acts/Events",
        "Expert Testimony (Qualifications, Bases, Reliability, Subject Matter)",
        "Privileges (Spousal, Attorney-Client, Physician/Psychotherapist) & Other Policy Exclusions (Remedial Measures, Compromise)",
        "Hearsay: Definition & Non-Hearsay (Prior Statements by Witness, Statements Attributable to Party-Opponent)",
        "Hearsay Exceptions: Availability Immaterial (Present Sense Impression, Excited Utterance, State of Mind, Medical Diagnosis, Business Records, Public Records)",
        "Hearsay Exceptions: Declarant Unavailable (Former Testimony, Statements Against Interest, Dying Declarations, Forfeiture)",
        "Confrontation Clause & Its Impact on Hearsay",
        "Impeachment, Contradiction & Rehabilitation of Witnesses",
        "Judicial Notice & Presumptions",
        "Other Evidence Issues"
    ],
    "Real Property": [
        "Present Estates & Future Interests (incl. Rules Affecting These Interests like RAP)",
        "Co-tenancy (Tenancy in Common, Joint Tenancy) & Rights/Obligations of Co-tenants",
        "Landlord-Tenant Law (Types of Tenancies, Possession, Rent, Transfers, Termination, Habitability)",
        "Rights in Real Property: Easements, Profits & Licenses (Creation, Scope, Termination)",
        "Rights in Real Property: Restrictive Covenants & Equitable Servitudes (Nature, Creation, Transfer, Termination)",
        "Zoning, Land Use Regulation & Fixtures (incl. Fair Housing)",
        "Real Estate Contracts: Formation, Construction & Statute of Frauds",
        "Real Estate Contracts: Marketability of Title, Risk of Loss (Equitable Conversion) & Remedies for Breach",
        "Mortgages/Security Devices: Types, Security Relationships & Rights Prior to Foreclosure",
        "Mortgages/Security Devices: Transfers by Mortgagor/Mortgagee, Discharge & Foreclosure",
        "Titles: Adverse Possession & Transfer by Deed (Requirements, Types of Deeds)",
        "Title Assurance Systems: Recording Acts (Types, Chain of Title) & Title Insurance",
        "Other Real Property Issues (Including Conflicts of Law, Transfer by Will/Operation of Law)"
    ],
    "Torts": [
        "Intentional Torts (to Person & Property, and Defenses)",
        "Negligence - General Duty & Standard of Care (Reasonably Prudent Person, Special Classes)",
        "Negligence - Special Duty Rules (Failure to Act, Owners/Occupiers of Land, Statutory Standards)",
        "Negligence - Breach of Duty & Causation (Actual & Proximate Cause, Res Ipsa Loquitur, Multiple Causes)",
        "Negligence - Damages (incl. Pure Economic Loss, Emotional Distress) & Defenses (Contributory/Comparative Negligence, Assumption of Risk)",
        "Vicarious Liability & Joint Tortfeasor Liability (incl. Apportionment)",
        "Strict Liability (Common Law - Abnormally Dangerous Activities, Animals) & Nuisance",
        "Products Liability (Theories: Strict Liability, Negligence, Warranty; Defenses)",
        "Defamation & Invasion of Privacy (Defenses & Constitutional Limitations)",
        "Misrepresentation (Intentional/Fraudulent & Negligent)",
        "Intentional Interference with Business Relations",
        "Other Torts Issues"
    ]
};

document.addEventListener('DOMContentLoaded', () => {
            // --- Element Refs (will be initialized after HTML fragments load) ---
            let jsonFileElement, loadJsonButton, saveJsonButton, quizAreaElement, quizProgressElement;
            let groupIntroElement, questionMetaContainer, metaTooltipContentElement, questionTextElement;
            let choicesFormElement, attemptNotesElement, submitAnswerButton, feedbackAreaElement;
            let nextQuestionButton, previousQuestionButton, pastAttemptsContainer;
            let pastAttemptsAccordionToggle, pastAttemptsAccordionContent, endOfQuizMessageElement, loadSampleButton;
            let settingHideAnswerCheckbox, showAnswerButton, reviewSessionButton, finalReviewArea;
            let finalReviewContent, restartQuizButton, backToSettingsButton, reviewModal;
            let reviewModalContent, closeReviewModalButton, toggleAnnotationButton, annotationArea;
            let annotationCanvas, annotationControls, penButton, highlighterButton, eraserButton;
            let clearAnnotationButton, annotationCtx, sidebarElement, sidebarToggleButton;
            let closeSidebarButton, applyFiltersButton, filterCategoriesList, filterProvidersList;
            let filterScrambleCheckbox, clearCategoriesButton, clearProvidersButton;
            let performanceModal, closePerformanceModalButton, performanceStatsContent;

            // Element group definitions for reuse throughout the app
            const elementGroups = {
                // Main UI elements
                main: {
                    jsonFileElement: 'jsonFile',
                    loadJsonButton: 'loadJsonButton',
                    saveJsonButton: 'saveJsonButton',
                    loadSampleButton: 'loadSampleButton',
                    quizAreaElement: 'quiz-area',
                    quizProgressElement: 'quiz-progress',
                    endOfQuizMessageElement: 'end-of-quiz-message'
                },
                
                // Question display elements
                question: {
                    groupIntroElement: 'current-group-intro',
                    metaTooltipContentElement: 'meta-tooltip-content',
                    questionTextElement: 'question-text',
                    choicesFormElement: 'choices-form',
                    attemptNotesElement: 'attempt-notes',
                    submitAnswerButton: 'submit-answer-button',
                    feedbackAreaElement: 'feedback-area',
                    nextQuestionButton: 'next-question-button',
                    previousQuestionButton: 'previous-question-button',
                    pastAttemptsContainer: 'past-attempts'
                },
                
                // Settings and controls
                settings: {
                    settingHideAnswerCheckbox: 'setting-hide-answer',
                    showAnswerButton: 'show-answer-button',
                    reviewSessionButton: 'review-session-button',
                    sidebarElement: 'settings-sidebar',
                    sidebarToggleButton: 'sidebar-toggle-button',
                    closeSidebarButton: 'close-sidebar-button',
                    applyFiltersButton: 'apply-filters-button',
                    filterCategoriesList: 'filter-categories-list',
                    filterProvidersList: 'filter-providers-list',
                    filterScrambleCheckbox: 'filter-scramble',
                    clearCategoriesButton: 'clear-categories-filter',
                    clearProvidersButton: 'clear-providers-filter'
                },
                
                // Timer elements
                timer: {
                    questionLimit: 'question-limit',
                    enableSessionTimer: 'enable-session-timer',
                    enableQuestionTimer: 'enable-question-timer',
                    enableStopwatch: 'enable-stopwatch',
                    sessionTimeLimit: 'session-time-limit',
                    questionTimeLimit: 'question-time-limit',
                    sessionTimerDisplay: 'session-timer-display',
                    questionTimerDisplay: 'question-timer-display',
                    stopwatchDisplay: 'stopwatch-display'
                },
                
                // Review and annotation elements
                review: {
                    finalReviewArea: 'final-review-area',
                    finalReviewContent: 'final-review-content',
                    restartQuizButton: 'restart-quiz-button',
                    backToSettingsButton: 'back-to-settings-button',
                    reviewModal: 'review-modal',
                    reviewModalContent: 'review-modal-content',
                    closeReviewModalButton: 'close-review-modal',
                    toggleAnnotationButton: 'toggleAnnotationButton',
                    annotationArea: 'annotation-area',
                    annotationCanvas: 'annotationCanvas',
                    annotationControls: 'annotation-controls',
                    penButton: 'penButton',
                    highlighterButton: 'highlighterButton',
                    eraserButton: 'eraserButton',
                    clearAnnotationButton: 'clearAnnotationButton'
                },
                
                // Performance stats elements
                performance: {
                    performanceModal: 'performance-modal',
                    closePerformanceModalButton: 'close-performance-modal',
                    performanceStatsContent: 'performance-stats-content',
                    performanceButton: 'performance-button'
                }
            };
            
            // Cache for initialized element groups
            const initializedElementGroups = {};
            
            // Function to get an element group, initializing it if needed
            function getElementGroup(groupName) {
                if (!initializedElementGroups[groupName]) {
                    initializedElementGroups[groupName] = initializeElements(elementGroups[groupName]);
                }
                return initializedElementGroups[groupName];
            }
            
            // Function to initialize element references after HTML fragments are loaded
            function initializeElementReferences() {
                // Initialize all element groups
                const mainElements = getElementGroup('main');
                const questionElements = getElementGroup('question');
                const settingsElements = getElementGroup('settings');
                const timerElements = getElementGroup('timer');
                const reviewElements = getElementGroup('review');
                const performanceElements = getElementGroup('performance');
                
                // Combine all element groups
                const elements = {
                    ...mainElements,
                    ...questionElements,
                    ...settingsElements,
                    ...timerElements,
                    ...reviewElements,
                    ...performanceElements
                };
                
                // Assign all elements to their respective variables
                jsonFileElement = elements.jsonFileElement;
                loadJsonButton = elements.loadJsonButton;
                saveJsonButton = elements.saveJsonButton;
                quizAreaElement = elements.quizAreaElement;
                quizProgressElement = elements.quizProgressElement;
                groupIntroElement = elements.groupIntroElement;
                metaTooltipContentElement = elements.metaTooltipContentElement;
                questionTextElement = elements.questionTextElement;
                choicesFormElement = elements.choicesFormElement;
                attemptNotesElement = elements.attemptNotesElement;
                submitAnswerButton = elements.submitAnswerButton;
                feedbackAreaElement = elements.feedbackAreaElement;
                nextQuestionButton = elements.nextQuestionButton;
                previousQuestionButton = elements.previousQuestionButton;
                pastAttemptsContainer = elements.pastAttemptsContainer;
                endOfQuizMessageElement = elements.endOfQuizMessageElement;
                loadSampleButton = elements.loadSampleButton;
                settingHideAnswerCheckbox = elements.settingHideAnswerCheckbox;
                showAnswerButton = elements.showAnswerButton;
                reviewSessionButton = elements.reviewSessionButton;
                finalReviewArea = elements.finalReviewArea;
                finalReviewContent = elements.finalReviewContent;
                restartQuizButton = elements.restartQuizButton;
                backToSettingsButton = elements.backToSettingsButton;
                reviewModal = elements.reviewModal;
                reviewModalContent = elements.reviewModalContent;
                closeReviewModalButton = elements.closeReviewModalButton;
                toggleAnnotationButton = elements.toggleAnnotationButton;
                annotationArea = elements.annotationArea;
                annotationCanvas = elements.annotationCanvas;
                annotationControls = elements.annotationControls;
                penButton = elements.penButton;
                highlighterButton = elements.highlighterButton;
                eraserButton = elements.eraserButton;
                clearAnnotationButton = elements.clearAnnotationButton;
                sidebarElement = elements.sidebarElement;
                sidebarToggleButton = elements.sidebarToggleButton;
                closeSidebarButton = elements.closeSidebarButton;
                applyFiltersButton = elements.applyFiltersButton;
                filterCategoriesList = elements.filterCategoriesList;
                filterProvidersList = elements.filterProvidersList;
                filterScrambleCheckbox = elements.filterScrambleCheckbox;
                clearCategoriesButton = elements.clearCategoriesButton;
                clearProvidersButton = elements.clearProvidersButton;
                performanceModal = elements.performanceModal;
                closePerformanceModalButton = elements.closePerformanceModalButton;
                performanceStatsContent = elements.performanceStatsContent;
                
                // Handle special cases
                questionMetaContainer = querySelector('.question-meta-container');
                pastAttemptsAccordionToggle = pastAttemptsContainer?.querySelector('.accordion-toggle');
                pastAttemptsAccordionContent = pastAttemptsContainer?.querySelector('.accordion-content');
                annotationCtx = annotationCanvas?.getContext('2d', { alpha: true });
            }

            // --- State Vars ---
            let quizData = { questions: [], groups: [], fileName: null }; // Holds the in-memory quiz data, populated from Dexie
            let performanceButton = null;
            let masterQuestionList = [];
            let currentQuestionIndex = -1;
            let currentQuestionObject = null;
            let questionStartTime = null;
            let lastDisplayedGroupId = null;
            let hideAnswerMode = false;
            let sessionAttempts = new Map();

            // Annotation State
            let isAnnotationActive = false;
            let isDrawing = false;
            let currentTool = 'pen';
            let lastX = 0;
            let lastY = 0;
            let penColor = '#0000FF';
            let penWidth = 2;
            let highlighterColor = 'rgba(60, 255, 131, 0.03)';
            let highlighterWidth = 15;
            let eraserWidth = 25;

            // Timer State
            let sessionTimerEnabled = false;
            let questionTimerEnabled = false;
            let stopwatchEnabled = true;
            let sessionTimeLimit = 60 * 60;
            let questionTimeLimit = 90;
            let questionLimit = 50;
            let sessionTimeRemaining = 0;
            let questionTimeRemaining = 0;
            let stopwatchTime = 0;
            let sessionTimerInterval = null;
            let questionTimerInterval = null;
            let stopwatchInterval = null;

            // Function to setup event listeners after elements are initialized
            function setupEventListeners() {
                // --- Event Listeners ---
                loadJsonButton?.addEventListener('click', () => handleLoadJson());
                saveJsonButton?.addEventListener('click', handleSaveJson);
                loadSampleButton?.addEventListener('click', handleLoadSampleData);
                
                // Sidebar data controls
                const sidebarJsonFile = getElement('sidebar-jsonFile');
                const sidebarLoadJsonButton = getElement('sidebar-loadJsonButton');
                const sidebarLoadSampleButton = getElement('sidebar-loadSampleButton');
                
                if (sidebarLoadJsonButton && sidebarJsonFile) {
                    sidebarLoadJsonButton.addEventListener('click', () => handleLoadJson(sidebarJsonFile));
                }
                
                if (sidebarLoadSampleButton) {
                    sidebarLoadSampleButton.addEventListener('click', handleLoadSampleData);
                }

                // Event listeners for saving settings automatically
                querySelectorAll('input[name="filter-attempts"]').forEach(radio => radio.addEventListener('change', saveCurrentSettingsToDB));
                querySelectorAll('input[name="filter-notes"]').forEach(radio => radio.addEventListener('change', saveCurrentSettingsToDB));
                getElement('filter-scramble')?.addEventListener('change', saveCurrentSettingsToDB);
                getElement('session-time-limit')?.addEventListener('change', saveCurrentSettingsToDB);
                getElement('question-limit')?.addEventListener('change', saveCurrentSettingsToDB);
                getElement('enable-session-timer')?.addEventListener('change', saveCurrentSettingsToDB);
                getElement('enable-question-timer')?.addEventListener('change', saveCurrentSettingsToDB);
                getElement('enable-stopwatch')?.addEventListener('change', saveCurrentSettingsToDB);
                getElement('question-time-limit')?.addEventListener('change', saveCurrentSettingsToDB);
                getElement('setting-hide-answer')?.addEventListener('change', saveCurrentSettingsToDB);

                // Event delegation for dynamic checkboxes
                filterCategoriesList?.addEventListener('change', (event) => {
                    if (event.target.type === 'checkbox') {
                        saveCurrentSettingsToDB();
                    }
                });
                filterProvidersList?.addEventListener('change', (event) => {
                    if (event.target.type === 'checkbox') {
                        saveCurrentSettingsToDB();
                    }
                });
                submitAnswerButton?.addEventListener('click', handleSubmitAnswer);
                nextQuestionButton?.addEventListener('click', handleNextQuestion);
                sidebarToggleButton?.addEventListener('click', toggleSidebar);
                closeSidebarButton?.addEventListener('click', closeSidebar);
                applyFiltersButton?.addEventListener('click', applyFiltersAndStartQuiz);
                clearCategoriesButton?.addEventListener('click', () => clearCheckboxes(filterCategoriesList));
                clearProvidersButton?.addEventListener('click', () => clearCheckboxes(filterProvidersList));
                loadSampleButton?.addEventListener('click', handleLoadSampleData);
                showAnswerButton?.addEventListener('click', showCurrentAnswer);
                reviewSessionButton?.addEventListener('click', showReviewModal);
                restartQuizButton?.addEventListener('click', handleRestartQuiz);
                backToSettingsButton?.addEventListener('click', handleBackToSettings);
                closeReviewModalButton?.addEventListener('click', closeReviewModal);
                reviewModal?.addEventListener('click', (event) => { if (event.target === reviewModal) closeReviewModal(); });

                // Accordion for Past Attempts
                if (pastAttemptsAccordionToggle && pastAttemptsAccordionContent) {
                    pastAttemptsAccordionToggle.addEventListener('click', () => {
                        const isExpanded = pastAttemptsAccordionToggle.getAttribute('aria-expanded') === 'true';
                        pastAttemptsAccordionToggle.setAttribute('aria-expanded', String(!isExpanded));
                        pastAttemptsAccordionContent.classList.toggle('open');
                        if (!isExpanded) {
                            // Opening
                            pastAttemptsAccordionContent.style.display = 'block'; // Make it visible before calculating scrollHeight
                            pastAttemptsAccordionContent.style.maxHeight = pastAttemptsAccordionContent.scrollHeight + "px";
                        } else {
                            // Closing
                            pastAttemptsAccordionContent.style.maxHeight = '0';
                            // Listen for transition end to set display: none for accessibility and layout
                            pastAttemptsAccordionContent.addEventListener('transitionend', function handler() {
                                if (pastAttemptsAccordionToggle.getAttribute('aria-expanded') === 'false') { // Check again in case of rapid clicks
                                    pastAttemptsAccordionContent.style.display = 'none';
                                }
                                pastAttemptsAccordionContent.removeEventListener('transitionend', handler);
                            });
                        }
                    });
                }

                getElement('clear-attempts-filter')?.addEventListener('click', () => {
                    querySelector('input[name="filter-attempts"][value="all"]').checked = true;
                });
                getElement('clear-notes-filter')?.addEventListener('click', () => {
                    querySelector('input[name="filter-notes"][value="all"]').checked = true;
                });

                const referenceButtonForPerformance = applyFiltersButton;
                performanceButton = document.createElement('button');
                performanceButton.id = 'show-performance-button';
                performanceButton.textContent = 'Performance Dashboard';
                performanceButton.disabled = true;
                referenceButtonForPerformance?.parentNode?.insertBefore(performanceButton, referenceButtonForPerformance.nextSibling);
                performanceButton.style.marginTop = "1rem";
                if (applyFiltersButton) applyFiltersButton.style.marginBottom = "0";
                performanceButton?.addEventListener('click', showPerformanceModal);
                closePerformanceModalButton?.addEventListener('click', closePerformanceModal);
                performanceModal?.addEventListener('click', (event) => { if (event.target === performanceModal) closePerformanceModal(); });

                getElement('enable-session-timer')?.addEventListener('change', (e) => { sessionTimerEnabled = e.target.checked; updateTimerVisibility(); });
                getElement('enable-question-timer')?.addEventListener('change', (e) => { questionTimerEnabled = e.target.checked; updateTimerVisibility(); });
                getElement('enable-stopwatch')?.addEventListener('change', (e) => { stopwatchEnabled = e.target.checked; updateTimerVisibility(); });
                getElement('session-time-limit')?.addEventListener('change', (e) => { sessionTimeLimit = Math.max(1, parseInt(e.target.value, 10) || 60) * 60; });
                getElement('question-time-limit')?.addEventListener('change', (e) => { questionTimeLimit = Math.max(10, parseInt(e.target.value, 10) || 90); });
                getElement('question-limit')?.addEventListener('change', (e) => { questionLimit = Math.max(1, parseInt(e.target.value, 10) || 50); });

                toggleAnnotationButton?.addEventListener('click', toggleAnnotationMode);
                annotationCanvas?.addEventListener('mousedown', startDrawing);
                annotationCanvas?.addEventListener('mousemove', draw);
                annotationCanvas?.addEventListener('mouseup', stopDrawing);
                annotationCanvas?.addEventListener('mouseout', stopDrawing);
                annotationCanvas?.addEventListener('touchstart', startDrawing, { passive: false });
                annotationCanvas?.addEventListener('touchmove', draw, { passive: false });
                annotationCanvas?.addEventListener('touchend', stopDrawing);
                annotationCanvas?.addEventListener('touchcancel', stopDrawing);
                penButton?.addEventListener('click', () => setTool('pen'));
                highlighterButton?.addEventListener('click', () => setTool('highlighter'));
                eraserButton?.addEventListener('click', () => setTool('eraser'));
                clearAnnotationButton?.addEventListener('click', clearCanvas);

                previousQuestionButton?.addEventListener('click', handlePreviousQuestion);

                window.addEventListener('beforeunload', async () => {
                    await saveNotesForCurrentAttempt(); // Existing functionality

                    // Save active quiz session state if a quiz is in progress
                    if (masterQuestionList && masterQuestionList.length > 0 && currentQuestionIndex >= 0 && currentQuestionIndex < masterQuestionList.length) {
                        console.log("beforeunload: Saving active quiz session state.");
                        try {
                            await saveAppState('activeMasterQuestionList', masterQuestionList);
                            await saveAppState('activeCurrentQuestionIndex', currentQuestionIndex);
                            await saveAppState('activeFilters', getFilterSettings()); // Save current filter settings
                            await saveAppState('activeHideAnswerMode', hideAnswerMode);
                            await saveAppState('activeQuestionLimit', questionLimit); // Save the question limit used for this session
                            await saveAppState('activeSessionTimeRemaining', sessionTimeRemaining);
                            await saveAppState('activeStopwatchTime', stopwatchTime);
                            console.log("beforeunload: Active quiz session state saved.");

                            // Save sessionAttempts
                            if (sessionAttempts && sessionAttempts.size > 0) {
                                const serializableSessionAttempts = Array.from(sessionAttempts.entries());
                                await saveAppState('activeSessionAttempts', serializableSessionAttempts);
                                console.log("beforeunload: Active sessionAttempts saved.");
                            } else {
                                await db.appState.delete('activeSessionAttempts'); // Or saveAppState('activeSessionAttempts', null);
                                console.log("beforeunload: No active sessionAttempts to save, or it's empty. Cleared from DB.");
                            }
                        } catch (error) {
                            console.error("beforeunload: Error saving active quiz session state:", error);
                        }
                    } else {
                        // If no active quiz, ensure any lingering session state is cleared (optional, but good for consistency)
                        // This might be too aggressive if user just loaded data but hasn't started.
                        // Consider clearing only if a quiz was previously active but is now finished/reset.
                        // For now, only save if active. Clearing will be handled at specific points (new quiz, end quiz).
                        console.log("beforeunload: No active quiz session to save.");
                        // Also clear sessionAttempts from DB if no active quiz
                        await db.appState.delete('activeSessionAttempts');
                        console.log("beforeunload: No active quiz, ensuring activeSessionAttempts is cleared from DB.");
                    }
                });
            }

            // --- Sidebar Functions ---
            function populateFilterOptions() {
                // Check if quizData is loaded for enabling buttons and populating providers
                if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                    // Providers list will show 'Load data to see providers.'
                    filterProvidersList.innerHTML = '<p>Load data to see providers.</p>';
                    // Categories list will be populated by mbe_categories_with_subcategories, but buttons remain disabled
                    applyFiltersButton.disabled = true;
                    if (performanceButton) {
                        performanceButton.disabled = true;
                    }
                } else {
                    // Populate providers from quizData
                    const providers = new Set();
                    quizData.questions.forEach(q => {
                        if (q.source?.provider) providers.add(q.source.provider);
                    });
                    populateCheckboxList(filterProvidersList, [...providers].sort()); // Keep this for providers

                    applyFiltersButton.disabled = false;
                    if (performanceButton) {
                        performanceButton.disabled = false;
                    }
                }

                // Always populate categories and subcategories from the fixed list
                // Ensure mbe_categories_with_subcategories is accessible here
                if (typeof mbe_categories_with_subcategories !== 'undefined' && mbe_categories_with_subcategories) {
                    populateCategorySubcategoryFilter(filterCategoriesList, mbe_categories_with_subcategories);
                } else {
                    // Fallback or error if mbe_categories_with_subcategories is not defined
                    filterCategoriesList.innerHTML = '<p>Error: Category definitions are missing.</p>';
                    // Consider disabling buttons if categories can't be loaded
                    applyFiltersButton.disabled = true;
                    if (performanceButton) {
                        performanceButton.disabled = true;
                    }
                }
            }
            
            // Function to apply filters and start the quiz
            async function applyFiltersAndStartQuiz() {
                if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                    alert("No quiz data loaded. Please load a JSON file first.");
                    return;
                }

                await saveNotesForCurrentAttempt(); // Save any notes from current question

                // Get filter settings
                const filters = getFilterSettings();
                
                // Use our new filtering module to prepare the quiz questions
                const result = prepareQuizQuestions(
                    quizData.questions,
                    quizData.groups || [],
                    filters,
                    questionLimit,
                    filters.scramble
                );
                
                // Check if we have any questions after filtering
                if (!result.questions || result.questions.length === 0) {
                    alert("No questions match your filter criteria. Please adjust your filters and try again.");
                    return;
                }

                // Update the master question list with the filtered questions
                masterQuestionList = result.questions;
                
                // Reset session state
                currentQuestionIndex = -1;
                sessionAttempts = new Map();
                stopwatchTime = 0;
                sessionTimeRemaining = sessionTimeLimit;
                
                // Get hide answer mode setting
                hideAnswerMode = settingHideAnswerCheckbox?.checked || false;
                
                // Hide sidebar and show quiz area
                closeSidebar();
                sidebarElement.style.display = 'none';
                quizAreaElement.style.display = 'block';
                finalReviewArea.style.display = 'none';
                
                // Reset and start timers
                if (sessionTimerEnabled) {
                    sessionTimeRemaining = sessionTimeLimit;
                    startSessionTimer();
                }
                if (stopwatchEnabled) {
                    stopwatchTime = 0;
                    startStopwatch();
                }
                
                // Update quiz progress display
                updateQuizProgress();
                
                // Show the first question
                handleNextQuestion();
                
                // Save the current state
                await saveAppState('activeFilters', filters);
                await saveAppState('activeHideAnswerMode', hideAnswerMode);
                await saveAppState('activeMasterQuestionList', masterQuestionList);
                await saveAppState('activeCurrentQuestionIndex', currentQuestionIndex);
                await saveAppState('activeQuestionLimit', questionLimit);
                await saveAppState('activeSessionTimeRemaining', sessionTimeRemaining);
                await saveAppState('activeStopwatchTime', stopwatchTime);
            }

            function getFilterSettings() {
                const attemptsFilter = document.querySelector('input[name="filter-attempts"]:checked')?.value || 'all';
                const notesFilter = document.querySelector('input[name="filter-notes"]:checked')?.value || 'all';
                const scramble = filterScrambleCheckbox.checked;

                const selectedCategoriesAndSubcategories = {};
                const mainCategoryCheckboxes = filterCategoriesList.querySelectorAll('input[name="filter-main-category"]');
                
                // First, collect all selected subcategories, regardless of parent category selection
                const allSelectedSubcategories = new Map(); // Maps subcategory to parent category
                
                // Process each main category
                mainCategoryCheckboxes.forEach(cb => {
                    const mainCategoryName = cb.value;
                    const sanitizedMainCategoryName = mainCategoryName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
                    const subCategoryCheckboxes = filterCategoriesList.querySelectorAll(`input[name="filter-subcategory-${sanitizedMainCategoryName}"]:checked`);
                    
                    // If main category is checked or in indeterminate state, add it to the result object
                    if (cb.checked || cb.indeterminate) {
                        const selectedSubcategories = [];
                        
                        // Add all selected subcategories for this main category
                        subCategoryCheckboxes.forEach(subCb => {
                            selectedSubcategories.push(subCb.value);
                            allSelectedSubcategories.set(subCb.value, mainCategoryName);
                        });
                        
                        selectedCategoriesAndSubcategories[mainCategoryName] = selectedSubcategories;
                    } 
                    // If main category is not checked but has selected subcategories, 
                    // we still need to track those subcategories (this shouldn't happen with the new UI,
                    // but keeping for backward compatibility)
                    else if (subCategoryCheckboxes.length > 0) {
                        subCategoryCheckboxes.forEach(subCb => {
                            allSelectedSubcategories.set(subCb.value, mainCategoryName);
                            
                            // Add the parent category to the result with just this subcategory
                            if (!selectedCategoriesAndSubcategories[mainCategoryName]) {
                                selectedCategoriesAndSubcategories[mainCategoryName] = [];
                            }
                            selectedCategoriesAndSubcategories[mainCategoryName].push(subCb.value);
                        });
                    }
                });

                const selectedProviders = Array.from(filterProvidersList.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(cb => cb.value);

                return {
                    attempts: attemptsFilter,
                    notes: notesFilter,
                    categories: selectedCategoriesAndSubcategories,
                    providers: selectedProviders,
                    scramble: scramble,
                    // Include the map of all selected subcategories for easier filtering
                    allSelectedSubcategories: Object.fromEntries(allSelectedSubcategories)
                };
            }

            // --- Timer Functions ---
            function updateTimerVisibility() {
                document.getElementById('session-timer').style.display = sessionTimerEnabled ? 'flex' : 'none';
                document.getElementById('question-timer').style.display = questionTimerEnabled ? 'flex' : 'none';
                document.getElementById('stopwatch').style.display = stopwatchEnabled ? 'flex' : 'none';

                const timerContainer = document.getElementById('timer-container');
                if (sessionTimerEnabled || questionTimerEnabled || stopwatchEnabled) {
                    timerContainer.style.display = 'flex';
                } else {
                    timerContainer.style.display = 'none';
                }
            }
            function startSessionTimer() {
                if (!sessionTimerEnabled || !quizAreaElement.style.display || quizAreaElement.style.display === 'none') return;
                clearInterval(sessionTimerInterval);
                // sessionTimeRemaining is set from sessionTimeLimit in initialize or applyFilters
                updateSessionTimerDisplay(); // Initial display
                sessionTimerInterval = setInterval(() => {
                    sessionTimeRemaining--;
                    updateSessionTimerDisplay();
                    if (sessionTimeRemaining <= 0) {
                        clearInterval(sessionTimerInterval);
                        handleSessionTimeout();
                    }
                }, 1000);
            }
            function updateSessionTimerDisplay() {
                const timerValueEl = document.getElementById('session-timer').querySelector('.timer-value');
                const timerEl = document.getElementById('session-timer');
                timerValueEl.textContent = formatTime(sessionTimeRemaining);

                timerEl.classList.remove('warning', 'danger', 'flashing');
                if (sessionTimerEnabled && sessionTimeRemaining <= 0) {
                    timerEl.classList.add('danger', 'flashing');
                } else if (sessionTimerEnabled && sessionTimeRemaining <= 60) { // Last minute
                    timerEl.classList.add('danger');
                    if (sessionTimeRemaining <= 10) { // Last 10 seconds
                        timerEl.classList.add('flashing');
                    }
                } else if (sessionTimerEnabled && sessionTimeRemaining <= 300) { // Last 5 minutes
                    timerEl.classList.add('warning');
                }
            }
            function startQuestionTimer() {
                if (!questionTimerEnabled || !quizAreaElement.style.display || quizAreaElement.style.display === 'none') return;
                clearInterval(questionTimerInterval);
                questionTimeRemaining = questionTimeLimit; // Reset for each question
                updateQuestionTimerDisplay(); // Initial display
                questionTimerInterval = setInterval(() => {
                    questionTimeRemaining--;
                    updateQuestionTimerDisplay();
                    if (questionTimeRemaining <= 0) {
                        clearInterval(questionTimerInterval);
                        handleQuestionTimeout();
                    }
                }, 1000);
            }
            function updateQuestionTimerDisplay() {
                const timerValueEl = document.getElementById('question-timer').querySelector('.timer-value');
                const timerEl = document.getElementById('question-timer');
                timerValueEl.textContent = formatTime(questionTimeRemaining);

                timerEl.classList.remove('warning', 'danger', 'flashing');
                if (questionTimerEnabled && questionTimeRemaining <= 0) {
                    timerEl.classList.add('danger', 'flashing');
                } else if (questionTimerEnabled && questionTimeRemaining <= 10) { // Last 10 seconds
                    timerEl.classList.add('danger');
                    if (questionTimeRemaining <= 5) { // Flash in last 5 seconds
                        timerEl.classList.add('flashing');
                    }
                } else if (questionTimerEnabled && questionTimeRemaining <= 30) { // Warning in last 30 seconds
                    timerEl.classList.add('warning');
                }
            }
            function startStopwatch() {
                if (!stopwatchEnabled || !quizAreaElement.style.display || quizAreaElement.style.display === 'none') return;
                clearInterval(stopwatchInterval);
                // stopwatchTime is cumulative for the session, don't reset here unless specifically intended
                updateStopwatchDisplay(); // Initial display
                stopwatchInterval = setInterval(() => {
                    stopwatchTime++;
                    updateStopwatchDisplay();
                }, 1000);
            }
            function updateStopwatchDisplay() {
                const timerValueEl = document.getElementById('stopwatch').querySelector('.timer-value');
                timerValueEl.textContent = formatTime(stopwatchTime);
            }
            function pauseQuestionTimer() {
                clearInterval(questionTimerInterval);
            }
            function pauseSessionTimer() {
                clearInterval(sessionTimerInterval);
            }
            function pauseStopwatch() {
                clearInterval(stopwatchInterval);
            }
            function resetQuestionTimer() {
                clearInterval(questionTimerInterval);
                questionTimeRemaining = questionTimeLimit;
                updateQuestionTimerDisplay();
            }
            function resetSessionTimer() {
                clearInterval(sessionTimerInterval);
                sessionTimeRemaining = sessionTimeLimit;
                updateSessionTimerDisplay();
            }
            function resetStopwatch() {
                clearInterval(stopwatchInterval);
                stopwatchTime = 0;
                updateStopwatchDisplay();
            }
            async function handleSessionTimeout() {
                alert('Session time is up!');
                pauseQuestionTimer(); // Stop question timer if running
                pauseStopwatch();     // Stop stopwatch

                // Attempt to submit current question if an answer is selected and not yet submitted
                const selectedChoiceInput = choicesFormElement.querySelector('input[type="radio"]:checked');
                if (currentQuestionObject && selectedChoiceInput && !submitAnswerButton.disabled) {
                    await handleSubmitAnswer(); // This will save notes too
                } else if (currentQuestionObject) {
                    await saveNotesForCurrentAttempt(); // Save any pending notes for the current question
                }

                // Disable further interactions with the current question UI
                submitAnswerButton.disabled = true;
                choicesFormElement.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
                nextQuestionButton.style.display = 'none'; // No more questions

                // Display appropriate end message or review screen
                displayFinalReviewScreen();
                // Optionally, you might want to pass a specific message to the review screen indicating it was due to timeout.
                // For now, just calling it directly will show the standard review.
                // The endOfQuizMessageElement logic is removed as the review screen will now always show.
            }
            async function handleQuestionTimeout() {
                alert('Time for this question is up!');
                pauseQuestionTimer(); // Already stopped by interval, but good for clarity

                const selectedChoiceInput = choicesFormElement.querySelector('input[type="radio"]:checked');
                if (currentQuestionObject && !submitAnswerButton.disabled) { // Check if submission is still possible
                    if (selectedChoiceInput) {
                        await handleSubmitAnswer(); // Submit if an answer was selected
                    } else {
                        // If no answer selected, mark as "submitted with no choice" or just reveal answer
                        // Forcing a submit-like state:
                        await saveNotesForCurrentAttempt(); // Save any notes
                        deactivateAnnotationMode();
                        choicesFormElement.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
                        submitAnswerButton.style.display = 'none';
                        submitAnswerButton.disabled = true;
                        nextQuestionButton.style.display = 'inline-block';

                        if (hideAnswerMode) {
                            feedbackAreaElement.style.display = 'none';
                            showAnswerButton.style.display = 'inline-block';
                            reviewSessionButton.style.display = 'inline-block';
                            feedbackAreaElement.innerHTML = '<p>Time up! No answer selected. Click "Show Answer" or "Next Question".</p>';
                            feedbackAreaElement.className = 'feedback-area incorrect'; // Or neutral
                            // feedbackAreaElement.style.display = 'block'; // Keep hidden if showAnswerButton is primary
                        } else {
                            showCurrentAnswerFeedback(true); // Show feedback for "no answer"
                            showAnswerButton.style.display = 'none';
                            reviewSessionButton.style.display = 'none';
                        }
                        renderPastAttempts(currentQuestionObject); // Update past attempts if structure allows for "no choice"
                        pastAttemptsContainer.style.display = 'block';
                    }
                }
                // Ensure user can proceed
                if (nextQuestionButton.style.display === 'none' && submitAnswerButton.disabled) {
                    nextQuestionButton.style.display = 'inline-block';
                }
            }
            function initializeTimerSettings() {
                // Read initial values from HTML inputs
                sessionTimerEnabled = document.getElementById('enable-session-timer').checked;
                questionTimerEnabled = document.getElementById('enable-question-timer').checked;
                stopwatchEnabled = document.getElementById('enable-stopwatch').checked;

                sessionTimeLimit = Math.max(1, parseInt(document.getElementById('session-time-limit').value, 10) || 60) * 60; // Convert minutes to seconds
                questionTimeLimit = Math.max(10, parseInt(document.getElementById('question-time-limit').value, 10) || 90); // Seconds
                // questionLimit is read in applyFiltersAndStartQuiz

                // Update UI visibility and reset timer displays
                updateTimerVisibility();
                resetSessionTimer(); // Sets sessionTimeRemaining and updates display
                resetQuestionTimer(); // Sets questionTimeRemaining and updates display
                resetStopwatch();     // Sets stopwatchTime to 0 and updates display
            }


            // --- Core Quiz Logic (Modified for Dexie) ---

            async function handleLoadSampleData() { // <--- ENSURE THIS FUNCTION IS DEFINED
                const sampleUrl = 'https://ansonlai.github.io/MBE-Practice-Questions/ncbe-sample.json';
                loadSampleButton.disabled = true;
                loadSampleButton.textContent = 'Loading Sample...';
                loadJsonButton.disabled = true;

                try {
                    console.log(`Fetching sample data from ${sampleUrl}`);
                    const response = await fetch(sampleUrl);
                    if (!response.ok) {
                        console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
                        let errorBody = '';
                        try { errorBody = await response.text(); } catch (e) {/* ignore */ }
                        console.error("Response body (if any):", errorBody);
                        throw new Error(`Failed to fetch sample data. Status: ${response.status}`);
                    }
                    const sampleData = await response.json();
                    console.log("Sample data fetched and parsed successfully.");
                    await processLoadedData(sampleData, "NCBE Online Practice Exam 1 Sample"); // Ensure processLoadedData is async
                } catch (error) {
                    console.error('Error fetching or processing sample data:', error);
                    alert(`Failed to load sample data. Please check the browser console for details. Error: ${error.message}`);
                } finally {
                    loadSampleButton.disabled = false;
                    loadSampleButton.textContent = 'Load Sample Data';
                    loadJsonButton.disabled = false;
                }
            }

            async function handleLoadJson(fileInputElement = null) {
                const fileInput = fileInputElement || jsonFileElement;
                const file = fileInput.files[0];
                if (!file) {
                    showNotification('Please select a JSON file first.', 'warning');
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const loadedData = JSON.parse(e.target.result);
                        await processLoadedData(loadedData, file.name);
                        
                        // Move file controls to sidebar after data is loaded
                        moveFileControlsToSidebar();
                    } catch (error) {
                        showNotification(`Error parsing JSON: ${error.message}`, 'error');
                        console.error("Error parsing JSON from file:", error);
                        fileInput.value = '';
                    }
                };
                reader.onerror = () => {
                    showNotification('Error reading file.', 'error');
                    console.error("Error reading file:", reader.error);
                    fileInput.value = '';
                };
                reader.readAsText(file);
            }
            
            // Function to move file controls to sidebar after data is loaded
            function moveFileControlsToSidebar() {
                const initialFileControls = getElement('initial-file-controls');
                const sidebarDataControls = getElement('sidebar-data-controls');
                
                if (initialFileControls && sidebarDataControls) {
                    // Hide the initial file controls
                    initialFileControls.style.display = 'none';
                    
                    // Show the sidebar data controls
                    sidebarDataControls.style.display = 'block';
                }
            }

            async function processLoadedData(loadedData, sourceDescription) {
                try {
                    if (loadedData && Array.isArray(loadedData.questions)) {
                        console.log("Clearing existing data from DexieDB...");
                        await db.transaction('rw', db.questions, db.groups, db.appState, async () => {
                            await db.questions.clear();
                            await db.groups.clear();
                            // await db.appState.clear(); // Or specific keys
                        });
                        console.log("Existing data cleared.");

                        const questionsToSave = loadedData.questions.map(q => {
                            q.user_attempts = q.user_attempts || [];
                            q.answer = q.answer || {}; // Initialize if not present
                            q.source = q.source || {}; // CRITICAL for Dexie dot notation indexing
                            return q;
                        });
                        const groupsToSave = (loadedData.groups || []).map(g => g);

                        console.log(`Adding ${questionsToSave.length} questions and ${groupsToSave.length} groups to DexieDB...`);
                        await db.transaction('rw', db.questions, db.groups, async () => {
                            await db.questions.bulkPut(questionsToSave);
                            if (groupsToSave.length > 0) {
                                await db.groups.bulkPut(groupsToSave);
                            }
                        });
                        console.log("New data added to DexieDB.");

                        await saveAppState('lastLoadedFileName', sourceDescription);
                        quizData.fileName = sourceDescription;

                        const reloadedData = await loadQuizDataFromDB();
                        if (!reloadedData || !reloadedData.questions || reloadedData.questions.length === 0) {
                            throw new Error("Failed to reload data from DB after import.");
                        }
                        
                        // Update global quizData with reloaded data
                        quizData = reloadedData;
                        
                        await clearActiveSessionState(); // Clear any pending session if new data is loaded
                        populateFilterOptions();
                applyFiltersAndStartQuiz(); // This will start a new quiz with the loaded data
                        saveJsonButton.disabled = false;
                        if (performanceButton) {
                            performanceButton.disabled = !(quizData.questions.length === 0);
                        }
                        closeSidebar();
                        alert(`Successfully loaded and stored data from ${escapeHtml(sourceDescription)}. Previous data has been replaced.`);
                        jsonFileElement.value = '';
                    } else {
                        alert('Invalid JSON format. Expected an object with a "questions" array.');
                        jsonFileElement.value = '';
                    }
                } catch (error) {
                    alert(`Error processing and storing loaded data: ${error.message}`);
                    console.error("Error in processLoadedData:", error);
                    jsonFileElement.value = '';
                    await loadQuizDataFromDB();
                    populateFilterOptions();
                }
            }

            async function handleSaveJson() {
                await saveNotesForCurrentAttempt();
                try {
                    const questionsArray = await db.questions.toArray();
                    const groupsArray = await db.groups.toArray();
                    const appStateFileName = await db.appState.get('lastLoadedFileName');

                    if (questionsArray.length === 0) {
                        alert('No quiz data in the database to export.'); return;
                    }

                    const dataToExport = { questions: questionsArray, groups: groupsArray };
                    const jsonDataString = JSON.stringify(dataToExport, null, 2);
                    const blob = new Blob([jsonDataString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const baseName = (appStateFileName ? appStateFileName.value : null) || 'mbe_quiz_backup_dexie';
                    const cleanBaseName = baseName.replace(/\.json$/i, '');
                    const fn = `${cleanBaseName}_${new Date().toISOString().slice(0, 10)}.json`;
                    a.download = fn;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    alert('Current progress exported from database!');
                } catch (error) {
                    alert(`Error exporting JSON backup from database: ${error.message}`);
                    console.error(error);
                }
            }

            async function applyFiltersAndStartQuiz() {
                await clearActiveSessionState(); // Clear any previously saved session state before starting a new one
                sessionAttempts.clear(); // Clear session attempts for the new sprint
                console.log("applyFiltersAndStartQuiz: sessionAttempts cleared for new sprint.");
                initializeTimerSettings();
                hideAnswerMode = settingHideAnswerCheckbox.checked;
                // sessionAttempts.clear(); // Moved up

                if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                    alert("No quiz data loaded. Please load a JSON file or use sample data.");
                    return;
                }
                previousQuestionButton.style.display = 'none'; // Hide on new quiz start

                await saveNotesForCurrentAttempt();
                clearCanvas();

                const filters = getFilterSettings();
                console.log("Filters object in applyFiltersAndStartQuiz:", JSON.stringify(filters)); // DEBUG LINE

                if (!filters) { // Add an explicit check
                    console.error("CRITICAL: filters object is undefined in applyFiltersAndStartQuiz!");
                    alert("Critical error in filter settings. Please check console.");
                    return; // Stop further execution if filters is bad
                }

                const questionsToFilter = quizData.questions; // Use in-memory data for filtering

                const filteredQuestions = questionsToFilter.filter(q => {
                    // ... (filtering logic unchanged) ...
                    if (!q) return false; // Should not happen if quizData.questions is clean, but good guard
                    const hasAttempts = q.user_attempts && q.user_attempts.length > 0;

                    // Attempts filter
                    if (filters.attempts === 'attempted' && !hasAttempts) return false;
                    if (filters.attempts === 'unattempted' && hasAttempts) return false;
                    if (filters.attempts === 'incorrect') {
                        if (!hasAttempts) return false;
                        // If every attempt is correct, then this question does not have any incorrect attempts.
                        if (q.user_attempts.every(attempt => attempt.chosen_answer === q.answer?.correct_choice)) return false;
                    }
                if (filters.attempts === 'incorrect_only') {
                    if (!hasAttempts) return false; // Must have attempts
                    const lastAttempt = q.user_attempts[q.user_attempts.length - 1];
                    if (lastAttempt.chosen_answer === q.answer?.correct_choice) return false; // Last attempt must be incorrect
                    if (!lastAttempt.chosen_answer && lastAttempt.chosen_answer !== "0") return false; // Ensure an answer was actually chosen and it was incorrect
                    }


                    // Notes filter
                    if (filters.notes === 'with-notes') {
                        if (!hasAttempts) return false;
                        if (!q.user_attempts.some(attempt => attempt.notes && attempt.notes.trim() !== '')) return false;
                    }
                    if (filters.notes === 'without-notes') {
                        if (hasAttempts && q.user_attempts.every(attempt => attempt.notes && attempt.notes.trim() !== '')) return false;
                    }

                    // New Category/Subcategory Filter Logic
                    const questionCategory = q.category;
                    const questionSubCategory = q.sub_category; // Assuming q.sub_category exists
                    const selectedCategoriesMap = filters.categories; // This is the object from getFilterSettings

                    if (Object.keys(selectedCategoriesMap).length > 0) { // If any main category filters are active
                        if (!selectedCategoriesMap.hasOwnProperty(questionCategory)) {
                            return false; // Question's main category is not among the selected main categories.
                        }

                        // Main category is selected, now check subcategories.
                        const selectedSubcategories = selectedCategoriesMap[questionCategory]; // Array of selected subcategory names.

                        // If specific subcategories are selected for this main category, the question must match one of them.
                        if (selectedSubcategories.length > 0) {
                            if (!questionSubCategory || !selectedSubcategories.includes(questionSubCategory)) {
                                return false; // Question has no sub_category, or it's not in the selected list.
                            }
                        }
                        // If selectedSubcategories.length is 0, it means the main category is selected,
                        // and all its subcategories are implicitly included. So, no further sub_category check.
                    }

                    // Provider filter (existing logic)
                    if (filters.providers.length > 0 && (!q.source?.provider || !filters.providers.includes(q.source.provider))) return false;

                    return true;
                });
                // ... (rest of the filtering and shuffling logic unchanged from your original)
                const filteredQuestionsMap = new Map(filteredQuestions.map(q => [q.question_id, q]));
                let quizUnits = [];
                const processedQuestionIds = new Set();

                if (quizData.groups) {
                    quizData.groups.forEach(group => {
                        const groupQuestionIds = group.question_order || [];
                        const groupUnit = [];
                        groupQuestionIds.forEach(qId => {
                            if (filteredQuestionsMap.has(qId)) {
                                groupUnit.push(filteredQuestionsMap.get(qId));
                                processedQuestionIds.add(qId);
                            }
                        });
                        if (groupUnit.length > 0) {
                            quizUnits.push(groupUnit);
                        }
                    });
                }
                filteredQuestions.forEach(question => {
                    if (!processedQuestionIds.has(question.question_id)) {
                        quizUnits.push(question);
                        processedQuestionIds.add(question.question_id);
                    }
                });

                if (filters.scramble) {
                    quizUnits = shuffleArray(quizUnits);
                }
                masterQuestionList = [];
                quizUnits.forEach(unit => {
                    if (Array.isArray(unit)) masterQuestionList.push(...unit);
                    else masterQuestionList.push(unit);
                });

                if (questionLimit > 0 && masterQuestionList.length > questionLimit) {
                    masterQuestionList = masterQuestionList.slice(0, questionLimit);
                }


                if (masterQuestionList.length > 0) {
                    currentQuestionIndex = -1;
                    lastDisplayedGroupId = null;
                    quizAreaElement.style.display = 'block';
                    endOfQuizMessageElement.style.display = 'none';
                    finalReviewArea.style.display = 'none';
                    toggleAnnotationButton.style.display = 'inline-block';
                    resetSessionTimer(); resetQuestionTimer(); resetStopwatch();
                    startSessionTimer(); startStopwatch();
                    await displayNextQuestionInternal();
                    quizProgressElement.textContent = `Question 1 of ${masterQuestionList.length}`;
                    closeSidebar();
                    await saveCurrentSettingsToDB(); // Save settings after successful start
                } else {
                    quizAreaElement.style.display = 'none';
                    endOfQuizMessageElement.innerHTML = `<h2>No Questions Found</h2><p>No questions matched the selected filter criteria.</p>`;
                    endOfQuizMessageElement.style.display = 'block';
                    finalReviewArea.style.display = 'none';
                    quizProgressElement.textContent = '0 questions';
                    currentQuestionObject = null;
                    toggleAnnotationButton.style.display = 'none';
                    deactivateAnnotationMode();
                    pauseQuestionTimer(); pauseSessionTimer(); pauseStopwatch();
                    alert("No questions match your filter settings.");
                    closeSidebar();
                }
            }

            function shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]]; // ES6 destructuring swap
                }
                return array;
            }
            function renderQuestion(question) {
                if (!question) {
                    console.error("RenderQuestion called with null/undefined question object.");
                    questionTextElement.textContent = "Error: Could not load question.";
                    choicesFormElement.innerHTML = "";
                    // Disable buttons or show error state
                    submitAnswerButton.disabled = true;
                    attemptNotesElement.disabled = true;
                    return;
                }

                console.log('Rendering question:', question); // Temporary logging

                // Group Introduction
                if (question.group_id) {
                    const group = quizData.groups.find(g => g.group_id === question.group_id);
                    if (group) {
                        groupIntroElement.innerHTML = `<h3>${escapeHtml(group.text || 'Question Group')}</h3><p>${escapeHtml(group.intro_text || '').replace(/\n/g, '<br>')}</p>`;
                        groupIntroElement.style.display = 'block';
                        groupIntroElement.classList.add('has-content'); // Add class to indicate content exists
                    } else {
                        // Group not found, though group_id was present. Hide intro.
                        groupIntroElement.innerHTML = `<h3></h3><p></p>`;
                        groupIntroElement.style.display = 'none';
                        groupIntroElement.classList.remove('has-content');
                    }
                    lastDisplayedGroupId = question.group_id;
                } else if (!question.group_id) {
                    // Current question has no group, and a group intro was previously displayed
                    groupIntroElement.innerHTML = `<h3></h3><p></p>`;
                    groupIntroElement.style.display = 'none';
                    groupIntroElement.classList.remove('has-content');
                    lastDisplayedGroupId = null;
                }


                // Question Meta Tooltip
                let metaHtml = `<strong>ID:</strong> ${escapeHtml(question.question_id || 'N/A')}<br>`;
                if (question.category) metaHtml += `<strong>Category:</strong> ${escapeHtml(question.category)}<br>`;
                if (question.source) {
                    if (question.source.provider) metaHtml += `<strong>Provider:</strong> ${escapeHtml(question.source.provider)}<br>`;
                    if (question.source.year) metaHtml += `<strong>Year:</strong> ${escapeHtml(String(question.source.year))}<br>`; // Ensure year is string
                    if (question.source.exam_name) metaHtml += `<strong>Exam:</strong> ${escapeHtml(question.source.exam_name)}<br>`;
                    if (typeof question.source.question_number !== 'undefined') metaHtml += `<strong>Original #:</strong> ${escapeHtml(String(question.source.question_number))}<br>`;
                }
                if (question.answer?.ai_generated_explanation || question.ai_generated_explanation) { // Check both spots for legacy
                    metaHtml += `<span class="ai-generated-flag" style="font-weight:bold; background-color: #6c757d; color: white; padding: 2px 4px; border-radius: 3px;">AI Generated Explanation</span><br>`;
                }
                metaTooltipContentElement.innerHTML = metaHtml || "No metadata available.";

                // Question Text (handle potential drawing on canvas)
                console.log('questionTextElement classList before setting text:', questionTextElement.classList); // Temporary logging
                questionTextElement.innerText = question.question_text;
                console.log('questionTextElement classList after setting text:', questionTextElement.classList); // Temporary logging
                if (!isAnnotationActive) {
                    questionTextElement.classList.remove('drawn-on-canvas');
                    groupIntroElement.classList.remove('drawn-on-canvas');
                }

                // Protective measure for display style if annotation is not active
                if (!isAnnotationActive) {
                    questionTextElement.style.display = ''; // Reset to default (typically block for h2)
                    // For group intro, only reset style if it has content, otherwise let CSS rules handle hiding
                    if (groupIntroElement.classList.contains('has-content')) {
                        groupIntroElement.style.display = 'block'; // Ensure it's visible if it has content
                    }
                }


                // Choices
                choicesFormElement.innerHTML = ''; // Clear previous choices
                const choiceOrder = ['A', 'B', 'C', 'D', 'E', 'F']; // Extend if more choices are possible
                if (question.choices) {
                    choiceOrder.forEach(key => {
                        if (question.choices[key]) {
                            const choiceItemDiv = document.createElement('div');
                            choiceItemDiv.className = 'choice-item';

                            const choiceLabel = document.createElement('label');
                            const choiceInput = document.createElement('input');
                            choiceInput.type = 'radio';
                            choiceInput.name = 'answer'; // Group radio buttons
                            choiceInput.value = key;
                            choiceInput.id = `choice-${key}`; // For label 'for' attribute if used

                            const choiceTextSpan = document.createElement('span');
                            // Use innerHTML carefully, assuming choice text is trusted or simple HTML
                            choiceTextSpan.innerHTML = `<strong>${key}.</strong> ${escapeHtml(question.choices[key])}`;

                            choiceLabel.appendChild(choiceInput);
                            choiceLabel.appendChild(choiceTextSpan);
                            choiceItemDiv.appendChild(choiceLabel);
                            choicesFormElement.appendChild(choiceItemDiv);
                        }
                    });
                }

                // Default UI state for a question (can be overridden if already answered in session)
                feedbackAreaElement.style.display = 'none';
                feedbackAreaElement.innerHTML = '';
                attemptNotesElement.disabled = false;
                reviewSessionButton.style.display = 'none'; // Controlled by hideAnswerMode after submit


                if (sessionAttempts.has(question.question_id)) {
                    const sessionAttemptData = sessionAttempts.get(question.question_id);
                    const attempt = sessionAttemptData.attempt;

                    // Pre-select the radio button
                    const chosenAnswerInput = choicesFormElement.querySelector(`input[type="radio"][value="${attempt.chosen_answer}"]`);
                    if (chosenAnswerInput) {
                        chosenAnswerInput.checked = true;
                    }

                    showCurrentAnswerFeedback(true); // Display feedback and style choices

                    // Disable choices and submit button
                    choicesFormElement.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
                    submitAnswerButton.disabled = true;
                    submitAnswerButton.style.display = 'none';

                    // Show navigation buttons
                    nextQuestionButton.style.display = 'inline-block';
                    if (currentQuestionIndex > 0) {
                        previousQuestionButton.style.display = 'inline-block';
                    } else {
                        previousQuestionButton.style.display = 'none';
                    }

                    // Populate notes
                    attemptNotesElement.value = attempt.notes || '';
                    showAnswerButton.style.display = 'none'; // Answer is already shown
                } else {
                    // Question not answered in this session, set to unanswered state
                    attemptNotesElement.value = ''; // Clear notes for new question
                    choicesFormElement.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = false);

                    submitAnswerButton.disabled = false;
                    submitAnswerButton.style.display = 'inline-block';
                    nextQuestionButton.style.display = 'none';
                    showAnswerButton.style.display = 'none';
                }

                renderPastAttempts(question); // Display past attempts for this question
                // pastAttemptsContainer visibility is handled within renderPastAttempts

                // Annotation: clear previous canvas drawings & resize for new content
                // resizeCanvas will also handle drawing text if annotation is active
                if (isAnnotationActive) {
                    questionTextElement.classList.add('drawn-on-canvas');
                    // Always add drawn-on-canvas class to group intro when annotation is active
                    groupIntroElement.classList.add('drawn-on-canvas');

                    // Ensure proper positioning for both elements
                    questionTextElement.style.position = 'relative';
                    questionTextElement.style.zIndex = '1';
                    groupIntroElement.style.position = 'relative';
                    groupIntroElement.style.zIndex = '1';

                    // Resize canvas to cover both elements properly
                    requestAnimationFrame(() => {
                        resizeCanvas();
                    });
                } else {
                    clearCanvas(); // Ensure canvas is clear if not active
                }
            }
            function renderPastAttempts(question) {
                console.log('Rendering past attempts for question:', question); // Temporary logging
                // Ensure accordion content area (ul and its h4) is cleared
                // The h4 and ul are now static inside accordion-content, we just need to clear the ul
                const ul = pastAttemptsAccordionContent.querySelector('ul');
                // const h4 = pastAttemptsAccordionContent.querySelector('h4'); // To ensure it exists // h4 is static, no need to modify it here

                if (ul) {
                    ul.innerHTML = ''; // Clear only the list items
                } else {
                    console.error("Could not find UL element within pastAttemptsAccordionContent to clear.");
                    // If ul doesn't exist, the structure is broken.
                    // We might need to hide the container or avoid further processing.
                    // For now, just logging the error. If pastAttemptsAccordionContent itself is missing, that's a bigger issue.
                    if (!pastAttemptsAccordionContent) {
                        console.error("pastAttemptsAccordionContent is also missing. Cannot render past attempts.");
                        pastAttemptsContainer.style.display = 'none'; // Hide the whole thing if critically broken
                        return;
                    }
                }


                if (!question || !question.user_attempts || question.user_attempts.length === 0) {
                    pastAttemptsContainer.style.display = 'none'; // Hide the whole accordion section
                    // Ensure accordion is closed if there are no attempts
                    pastAttemptsAccordionToggle.setAttribute('aria-expanded', 'false');
                    pastAttemptsAccordionContent.classList.remove('open');
                    pastAttemptsAccordionContent.style.maxHeight = '0';
                    pastAttemptsAccordionContent.style.display = 'none';
                    return;
                }

                // If we reach here, there are attempts, so ensure the main container is visible
                pastAttemptsContainer.style.display = 'block';

                // The h4 is static in the HTML now, so we don't need to create/append it.
                // We just populate the ul.

                // Iterate in reverse to show the most recent attempt first
                question.user_attempts.slice().reverse().forEach(attempt => {
                    const li = document.createElement('li');
                    const chosen = escapeHtml(attempt.chosen_answer);
                    const correctAns = escapeHtml(question.answer?.correct_choice);
                    const isCorrect = chosen === correctAns;
                    const date = new Date(attempt.time_submitted).toLocaleString();
                    const timeSpent = attempt.time_spent_seconds !== undefined ? `${attempt.time_spent_seconds.toFixed(1)}s` : 'N/A';

                    let attemptClass = isCorrect ? 'attempt-correct' : 'attempt-incorrect';
                    let resultText = isCorrect ? 'Correct' : 'Incorrect';
                    if (!chosen && chosen !== "0") { // Handle unanswered attempts
                        resultText = "Unanswered";
                        attemptClass = 'attempt-unanswered'; // Add CSS for this if desired
                    }


                    li.innerHTML = `<span class="${attemptClass}"><strong>${resultText}</strong></span> ` +
                        (chosen ? `(Chosen: ${chosen}) ` : '') +
                        `on ${date}. Time: ${timeSpent}.`;

                    if (attempt.notes && attempt.notes.trim() !== "") {
                        li.innerHTML += `<br><em>Notes:</em> ${escapeHtml(attempt.notes).replace(/\n/g, '<br>')}`;
                    }
                    ul.appendChild(li);
                });
                // ul is already part of pastAttemptsAccordionContent, no need to append it again.

                // By default, when attempts are rendered, the accordion should be closed.
                // The user can click to open it.
                // If the accordion was already open for a previous question's attempts, this will keep it closed.
                // If you want it to open automatically if it was already open, you'd need to save state.
                // For now, default to closed.
                const isCurrentlyExpanded = pastAttemptsAccordionToggle.getAttribute('aria-expanded') === 'true';
                if (isCurrentlyExpanded) {
                    // If it's open, and we are re-rendering (e.g. after a new attempt), keep it open and adjust height
                    pastAttemptsAccordionContent.style.maxHeight = pastAttemptsAccordionContent.scrollHeight + "px";
                } else {
                    // If closed, ensure it's correctly styled as closed (maxHeight 0, display none handled by class/click)
                    // The click handler takes care of display:none after transition.
                    // Here, just ensure maxHeight is 0 if not open.
                    pastAttemptsAccordionContent.style.maxHeight = '0';
                    // pastAttemptsAccordionContent.style.display = 'none'; // This is now handled by the 'open' class and transitionend
                }
            }

            async function handleSubmitAnswer() {
                pauseQuestionTimer();
                const selectedChoiceInput = choicesFormElement.querySelector('input[type="radio"]:checked');
                if (!selectedChoiceInput) { alert('Please select an answer.'); return; }

                const chosenAnswer = selectedChoiceInput.value;
                const timeSpentSeconds = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 0;
                const currentNotes = attemptNotesElement.value.trim();

                // currentQuestionObject is from masterQuestionList, which is from quizData.questions (in-memory)
                // Find the definitive object in quizData.questions to ensure we save the right one to DB
                const questionToUpdate = quizData.questions.find(q => q.question_id === currentQuestionObject.question_id);

                if (!questionToUpdate) {
                    console.error("Fatal Error: Could not find question in quizData to record attempt!");
                    alert("Error: Could not save attempt due to data inconsistency.");
                    return;
                }
                if (!Array.isArray(questionToUpdate.user_attempts)) questionToUpdate.user_attempts = [];

                const newAttempt = {
                    attempt_id: questionToUpdate.user_attempts.length + 1,
                    chosen_answer: chosenAnswer,
                    time_submitted: new Date().toISOString(),
                    time_spent_seconds: parseFloat(timeSpentSeconds.toFixed(1)),
                    notes: currentNotes
                };
                questionToUpdate.user_attempts.push(newAttempt);

                // If currentQuestionObject is a distinct copy (it shouldn't be, but for safety):
                if (currentQuestionObject.question_id === questionToUpdate.question_id && currentQuestionObject !== questionToUpdate) {
                    if (!currentQuestionObject.user_attempts) currentQuestionObject.user_attempts = [];
                    currentQuestionObject.user_attempts.push({ ...newAttempt }); // push a copy if it's not a reference
                }


                sessionAttempts.set(questionToUpdate.question_id, { question: questionToUpdate, attempt: newAttempt });
                await saveQuestionToDB(questionToUpdate); // Save to Dexie

                // UI Updates (unchanged)
                deactivateAnnotationMode();
                choicesFormElement.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
                submitAnswerButton.style.display = 'none';
                submitAnswerButton.disabled = true;
                nextQuestionButton.style.display = 'inline-block';

                if (currentQuestionIndex > 0) {
                    previousQuestionButton.style.display = 'inline-block';
                } else {
                    previousQuestionButton.style.display = 'none';
                }

                if (hideAnswerMode) {
                    feedbackAreaElement.style.display = 'none';
                    showAnswerButton.style.display = 'inline-block';
                    reviewSessionButton.style.display = 'inline-block';
                } else {
                    showCurrentAnswerFeedback(true);
                    showAnswerButton.style.display = 'none';
                    reviewSessionButton.style.display = 'none';
                }
                renderPastAttempts(questionToUpdate); // Use the object that was updated
                pastAttemptsContainer.style.display = 'block';
                // attemptNotesElement.focus();
                if (!hideAnswerMode) feedbackAreaElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            function showCurrentAnswerFeedback(highlightChoices = true) {
                if (!currentQuestionObject || !currentQuestionObject.answer) {
                    console.error("Cannot show feedback: currentQuestionObject or its answer is missing.");
                    feedbackAreaElement.innerHTML = "<p>Error: Could not retrieve answer details for feedback.</p>";
                    feedbackAreaElement.className = 'feedback-area incorrect';
                    feedbackAreaElement.style.display = 'block';
                    return;
                }

                const correctAnswer = currentQuestionObject.answer.correct_choice;
                const explanation = currentQuestionObject.answer.explanation;
                const selectedChoiceInput = choicesFormElement.querySelector('input[type="radio"]:checked');
                const chosenAnswer = selectedChoiceInput ? selectedChoiceInput.value : null;

                let feedbackHtml = '';
                if (chosenAnswer === correctAnswer) {
                    feedbackAreaElement.className = 'feedback-area correct';
                    feedbackHtml += `<p><strong>Correct!</strong></p>`;
                } else if (chosenAnswer) { // An incorrect answer was selected
                    feedbackAreaElement.className = 'feedback-area incorrect';
                    feedbackHtml += `<p><strong>Incorrect.</strong> Your answer: ${escapeHtml(chosenAnswer)}. Correct answer: ${escapeHtml(correctAnswer)}.</p>`;
                } else { // No answer was selected (e.g., question timed out without selection)
                    feedbackAreaElement.className = 'feedback-area incorrect'; // Or a neutral class
                    feedbackHtml += `<p><strong>No answer selected.</strong> Correct answer: ${escapeHtml(correctAnswer)}.</p>`;
                }

                if (explanation) {
                    feedbackHtml += `<div class="explanation"><strong>Explanation:</strong><br>${escapeHtml(explanation).replace(/\n/g, '<br>')}</div>`;
                } else {
                    feedbackHtml += `<div class="explanation"><strong>Explanation:</strong><br>No explanation provided for this question.</div>`;
                }
                feedbackAreaElement.innerHTML = feedbackHtml;
                feedbackAreaElement.style.display = 'block';

                // Highlight choices on the form
                if (highlightChoices) {
                    choicesFormElement.querySelectorAll('label').forEach(label => {
                        const input = label.querySelector('input[type="radio"]');
                        if (!input) return;

                        label.classList.remove('correct-answer', 'selected-incorrect'); // Reset classes
                        if (input.value === correctAnswer) {
                            label.classList.add('correct-answer');
                        } else if (input.checked && input.value !== correctAnswer) { // If it's checked and incorrect
                            label.classList.add('selected-incorrect');
                        }
                    });
                }
            }
            function showCurrentAnswer() {
                if (!currentQuestionObject) {
                    alert("No current question to show answer for.");
                    return;
                }
                showCurrentAnswerFeedback(true); // This function handles displaying feedback and highlighting choices
                showAnswerButton.style.display = 'none'; // Hide the "Show Answer" button as it's now shown
                // If in hideAnswerMode, the reviewSessionButton might also be hidden here.
                // Next question button should be visible.
                if (nextQuestionButton.style.display === 'none') {
                    nextQuestionButton.style.display = 'inline-block';
                }
                feedbackAreaElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            async function saveNotesForCurrentAttempt() {
                if (currentQuestionObject && currentQuestionObject.question_id) {
                    const questionInQuizData = quizData.questions.find(q => q.question_id === currentQuestionObject.question_id);
                    if (questionInQuizData && Array.isArray(questionInQuizData.user_attempts) && questionInQuizData.user_attempts.length > 0) {
                        const lastAttempt = questionInQuizData.user_attempts[questionInQuizData.user_attempts.length - 1];
                        const notesValue = attemptNotesElement.value.trim();
                        if (lastAttempt.notes !== notesValue) {
                            lastAttempt.notes = notesValue;
                            // Update currentQuestionObject's attempt too if it's being directly used by render functions
                            if (currentQuestionObject.user_attempts && currentQuestionObject.user_attempts.length > 0) {
                                const currentLastAttempt = currentQuestionObject.user_attempts[currentQuestionObject.user_attempts.length - 1];
                                if (currentLastAttempt.attempt_id === lastAttempt.attempt_id) {
                                    currentLastAttempt.notes = notesValue;
                                }
                            }
                            await saveQuestionToDB(questionInQuizData);
                            // console.log(`Notes updated and saved to DB for question ${questionInQuizData.question_id}`);
                        }
                    }
                }
            }

            async function handleNextQuestion() {
                await saveNotesForCurrentAttempt();
                pauseQuestionTimer();
                showAnswerButton.style.display = 'none';
                if (!hideAnswerMode) reviewSessionButton.style.display = 'none';
                await displayNextQuestionInternal();
            }

            async function displayNextQuestionInternal() {
                clearCanvas();
                resetQuestionTimer();
                if (questionTimerEnabled) startQuestionTimer();

                if (questionLimit > 0 && (currentQuestionIndex + 1) >= questionLimit) {
                    quizAreaElement.style.display = 'none';
                    endOfQuizMessageElement.innerHTML = `<h2>Quiz Sprint Complete!</h2><p>You finished the ${questionLimit}-question session.</p>`;
                    endOfQuizMessageElement.style.display = 'block';
                    currentQuestionObject = null;
                    toggleAnnotationButton.style.display = 'none';
                    deactivateAnnotationMode();
                    pauseQuestionTimer(); pauseSessionTimer(); pauseStopwatch();
                    // Removed saveToLocalStorage()
                    displayFinalReviewScreen(); // Call unconditionally
                    await clearActiveSessionState(); // Quiz ended
                    await saveCurrentSettingsToDB(); // Save settings
                    return;
                }

                currentQuestionIndex++;
                if (currentQuestionIndex < masterQuestionList.length) {
                    currentQuestionObject = masterQuestionList[currentQuestionIndex];
                    if (!currentQuestionObject) {
                        console.error(`Error: Undefined question at index ${currentQuestionIndex}. Skipping.`);
                        await displayNextQuestionInternal(); return;
                    }
                    renderQuestion(currentQuestionObject);
                    quizProgressElement.textContent = `Question ${currentQuestionIndex + 1} of ${masterQuestionList.length}`;
                    questionStartTime = Date.now();

                    // Manage Previous/Next button visibility
                    if (currentQuestionIndex > 0) {
                        previousQuestionButton.style.display = 'inline-block';
                    } else {
                        previousQuestionButton.style.display = 'none';
                    }
                    // Next button is generally shown by renderQuestion/handleSubmit, this function primarily handles advancing.
                    // If it's the last question, nextQuestionButton might be hidden by logic within renderQuestion if it's the end.


                    // Reset accordion to closed for the new question
                    if (pastAttemptsAccordionToggle && pastAttemptsAccordionContent) {
                        pastAttemptsAccordionToggle.setAttribute('aria-expanded', 'false');
                        pastAttemptsAccordionContent.classList.remove('open');
                        pastAttemptsAccordionContent.style.maxHeight = '0';
                        pastAttemptsAccordionContent.style.display = 'none'; // Explicitly hide content
                    }

                    const groupIntro = document.getElementById('current-group-intro');
                    if (groupIntro?.textContent?.trim()) {
                        groupIntro.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        document.getElementById('current-question-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    quizAreaElement.style.display = 'none';
                    endOfQuizMessageElement.innerHTML = `<h2>Quiz Complete!</h2><p>You answered all ${masterQuestionList.length} questions in this filtered set.</p>`;
                    endOfQuizMessageElement.style.display = 'block';
                    currentQuestionObject = null;
                    toggleAnnotationButton.style.display = 'none';
                    deactivateAnnotationMode();
                    pauseQuestionTimer(); pauseSessionTimer(); pauseStopwatch();
                    // Removed saveToLocalStorage()
                    displayFinalReviewScreen(); // Call unconditionally
                    await clearActiveSessionState(); // Quiz ended
                    await saveCurrentSettingsToDB(); // Save settings
                }
            }

            async function handlePreviousQuestion() {
                await saveNotesForCurrentAttempt();
                pauseQuestionTimer(); // Pause timer for the current question

                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    currentQuestionObject = masterQuestionList[currentQuestionIndex];
                    renderQuestion(currentQuestionObject); // This will also handle attempt notes and feedback display
                    quizProgressElement.textContent = `Question ${currentQuestionIndex + 1} of ${masterQuestionList.length}`;

                    clearCanvas(); // Clear annotations from the question we are leaving
                    resetQuestionTimer(); // Reset timer for the new (previous) question
                    if (questionTimerEnabled) {
                        startQuestionTimer();
                    }
                    questionStartTime = Date.now();

                    document.getElementById('current-question-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Update button states
                    if (currentQuestionIndex === 0) {
                        previousQuestionButton.style.display = 'none';
                    } else {
                        previousQuestionButton.style.display = 'inline-block';
                    }
                    // Next question button should always be visible when navigating back from a question that wasn't the last.
                    // renderQuestion will manage the submit button. If the question was answered, submit is hidden.
                    // If it's the very first question, next button is handled by its own logic.
                    // Ensure next button is visible if we are not on the last question
                    if (currentQuestionIndex < masterQuestionList.length -1) {
                         nextQuestionButton.style.display = 'inline-block';
                    }


                    // Reset accordion to closed for the new question
                    if (pastAttemptsAccordionToggle && pastAttemptsAccordionContent) {
                        pastAttemptsAccordionToggle.setAttribute('aria-expanded', 'false');
                        pastAttemptsAccordionContent.classList.remove('open');
                        pastAttemptsAccordionContent.style.maxHeight = '0';
                        pastAttemptsAccordionContent.style.display = 'none';
                    }

                } else {
                    // Should not happen if button is correctly hidden, but as a safeguard:
                    previousQuestionButton.style.display = 'none';
                }
            }

            function restoreFilterUI(filters) {
                if (!filters) return;

                // Restore radio buttons
                document.querySelector(`input[name="filter-attempts"][value="${filters.attempts || 'all'}"]`).checked = true;
                document.querySelector(`input[name="filter-notes"][value="${filters.notes || 'all'}"]`).checked = true;

                // Restore checkboxes
                filterScrambleCheckbox.checked = filters.scramble || true;

                // Helper to check checkboxes in a list
                const restoreCheckboxList = (container, selectedItems) => {
                    if (!selectedItems) return;
                    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        // Handle both array and object types for selectedItems
                        if (Array.isArray(selectedItems)) {
                            cb.checked = selectedItems.includes(cb.value);
                        } else if (typeof selectedItems === 'object') {
                            // For objects (like categories), check if the key exists
                            cb.checked = selectedItems.hasOwnProperty(cb.value);
                        }
                    });
                };

                restoreCheckboxList(filterCategoriesList, filters.categories);
                restoreCheckboxList(filterProvidersList, filters.providers);

                // Restore Timer and Exam Mode settings from sidebar inputs if they were part of 'activeFilters'
                // For this implementation, getFilterSettings() does not include these.
                // So, if they were saved separately (e.g. activeHideAnswerMode, activeQuestionLimit),
                // those global variables would be set directly before initializeApp calls initializeTimerSettings.
                // If these settings *were* part of getFilterSettings, you'd set the input values here:
                // e.g., document.getElementById('session-time-limit').value = filters.sessionTimeLimitValue;
                // document.getElementById('question-limit').value = filters.questionLimitValue;
                // settingHideAnswerCheckbox.checked = filters.hideAnswerCheckboxState;
                console.log("Filter UI restored from saved state.");
            }

            function resetQuizState(keepLoadedData = false) {
                if (!keepLoadedData) {
                    quizData = { questions: [], groups: [], fileName: null };
                }
                masterQuestionList = [];
                currentQuestionIndex = -1;
                currentQuestionObject = null;
                lastDisplayedGroupId = null;

                quizAreaElement.style.display = 'none';
                endOfQuizMessageElement.style.display = 'none';
                endOfQuizMessageElement.innerHTML = '';
                finalReviewArea.style.display = 'none';
                finalReviewContent.innerHTML = '';
                quizProgressElement.textContent = '';
                groupIntroElement.innerHTML = `<h3></h3><p></p>`;
                groupIntroElement.style.display = 'none';
                feedbackAreaElement.innerHTML = '';
                feedbackAreaElement.style.display = 'none';
                // pastAttemptsContainer.innerHTML = ''; // Content is structured now
                if (pastAttemptsAccordionContent) {
                    pastAttemptsAccordionContent.querySelector('ul').innerHTML = ''; // Clear list
                    pastAttemptsAccordionToggle.setAttribute('aria-expanded', 'false');
                    pastAttemptsAccordionContent.classList.remove('open');
                    pastAttemptsAccordionContent.style.maxHeight = '0';
                    pastAttemptsAccordionContent.style.display = 'none';
                }
                pastAttemptsContainer.style.display = 'none'; // Hide the whole section

                attemptNotesElement.value = '';
                attemptNotesElement.disabled = true;
                choicesFormElement.innerHTML = '';
                questionTextElement.textContent = '';
                metaTooltipContentElement.innerHTML = '';

                pauseQuestionTimer(); pauseSessionTimer(); pauseStopwatch();
                updateSessionTimerDisplay(); updateQuestionTimerDisplay(); updateStopwatchDisplay();

                saveJsonButton.disabled = !(quizData && quizData.questions && quizData.questions.length > 0);
                jsonFileElement.value = '';

                populateFilterOptions(); // Will use current quizData
                document.querySelector('input[name="filter-attempts"][value="unattempted"]').checked = true;
                document.querySelector('input[name="filter-notes"][value="all"]').checked = true;
                filterScrambleCheckbox.checked = true;

                deactivateAnnotationMode();
                clearCanvas();
                setTool('pen');
                toggleAnnotationButton.style.display = 'none';
                showAnswerButton.style.display = 'none';
                reviewSessionButton.style.display = 'none';
                console.log('Quiz state reset.');
            }

            // --- Annotation Functions --- (updated for better group intro coverage)
            function resizeCanvas() {
                if (!annotationArea || !annotationCanvas) return;

                // Force a reflow to ensure accurate measurements after any content changes
                annotationArea.offsetHeight;

                const dpr = window.devicePixelRatio || 1;
                const areaWidth = annotationArea.clientWidth;
                const areaHeight = annotationArea.clientHeight;

                // Set canvas internal drawing surface size
                annotationCanvas.width = areaWidth * dpr;
                annotationCanvas.height = areaHeight * dpr;

                // Set canvas CSS size to match the annotation area
                annotationCanvas.style.width = `${areaWidth}px`;
                annotationCanvas.style.height = `${areaHeight}px`;

                // Set canvas position to cover the entire annotation area
                annotationCanvas.style.position = 'absolute';
                annotationCanvas.style.top = '0px';
                annotationCanvas.style.left = '0px';
                annotationCanvas.style.zIndex = '10';

                // Scale context for DPR
                annotationCtx.scale(dpr, dpr);

                // Clear the canvas
                annotationCtx.clearRect(0, 0, areaWidth, areaHeight); // Use areaWidth/Height for clearing post-scale

                // Restore line styles that might be changed by drawing text or scaling
                setTool(currentTool); // Re-apply current tool settings like lineCap, etc.
            }
            function activateAnnotationMode() {
                isAnnotationActive = true;
                annotationCanvas.style.display = 'block';
                annotationCanvas.style.pointerEvents = 'auto';
                annotationCanvas.classList.add('annotation-active');
                annotationControls.style.display = 'block';
                toggleAnnotationButton.classList.add('annotation-active');
                toggleAnnotationButton.textContent = 'View Question Text';
                questionTextElement.classList.add('drawn-on-canvas');

                // Always add drawn-on-canvas class to group intro when annotation is active
                // This ensures it's properly covered by the canvas
                groupIntroElement.classList.add('drawn-on-canvas');

                // Ensure both elements remain visible behind the canvas
                questionTextElement.style.position = 'relative';
                questionTextElement.style.zIndex = '1';
                groupIntroElement.style.position = 'relative';
                groupIntroElement.style.zIndex = '1';

                // Wait for next frame to ensure DOM updates are complete before resizing
                requestAnimationFrame(() => {
                    resizeCanvas();
                    setTool(currentTool);
                });
            }
            function deactivateAnnotationMode() {
                isAnnotationActive = false;
                annotationCanvas.style.display = 'none';
                annotationCanvas.classList.remove('annotation-active');
                annotationControls.style.display = 'none';
                toggleAnnotationButton.classList.remove('annotation-active');
                toggleAnnotationButton.textContent = 'Annotate Question';
                questionTextElement.classList.remove('drawn-on-canvas');
                groupIntroElement.classList.remove('drawn-on-canvas');

                // Reset positioning styles
                questionTextElement.style.position = '';
                questionTextElement.style.zIndex = '';
                groupIntroElement.style.position = '';
                groupIntroElement.style.zIndex = '';
            }
            function toggleAnnotationMode() {
                if (isAnnotationActive) {
                    deactivateAnnotationMode();
                } else {
                    activateAnnotationMode();
                }
            }
            function getCoords(e) {
                const rect = annotationCanvas.getBoundingClientRect();
                let clientX, clientY;

                if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                // Adjust for canvas scaling if style.{width/height} is different from canvas.{width/height}
                // This is simplified if canvas.style.width/height matches rect.width/height
                const scaleX = annotationCanvas.width / (rect.width * (window.devicePixelRatio || 1));
                const scaleY = annotationCanvas.height / (rect.height * (window.devicePixelRatio || 1));

                // The coordinates should be relative to the canvas element, not scaled by DPR here
                // as drawing operations will use the canvas's internal coordinate system.
                // The DPR scaling is handled in resizeCanvas for the context itself.
                return {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
            }
            function startDrawing(e) {
                if (!isAnnotationActive) return;
                e.preventDefault(); // Important for touch events to prevent page scroll
                isDrawing = true;
                const coords = getCoords(e);
                [lastX, lastY] = [coords.x, coords.y];

                // Set drawing properties based on current tool
                if (currentTool === 'eraser') {
                    annotationCtx.globalCompositeOperation = 'destination-out';
                    // For eraser, draw a small circle on click
                    annotationCtx.beginPath();
                    annotationCtx.arc(lastX, lastY, eraserWidth / 2, 0, Math.PI * 2, false);
                    annotationCtx.fillStyle = 'rgba(0,0,0,1)'; // Fully opaque black for hard erasing
                    annotationCtx.fill();
                } else {
                    annotationCtx.globalCompositeOperation = 'source-over';
                }
                annotationCtx.beginPath();
                annotationCtx.moveTo(lastX, lastY);
            }
            function draw(e) {
                if (!isDrawing || !isAnnotationActive) return;
                e.preventDefault();
                const coords = getCoords(e);

                if (currentTool === 'eraser') {
                    // For eraser, draw circles along the path
                    annotationCtx.beginPath();
                    annotationCtx.arc(coords.x, coords.y, eraserWidth / 2, 0, Math.PI * 2, false);
                    annotationCtx.fillStyle = 'rgba(0,0,0,1)'; // Fully opaque black for hard erasing
                    annotationCtx.fill();
                } else {
                    annotationCtx.lineTo(coords.x, coords.y);
                    annotationCtx.stroke(); // Draws the segment
                    // Start a new path for the next segment
                    annotationCtx.beginPath();
                    annotationCtx.moveTo(coords.x, coords.y);
                }

                // Update lastX, lastY for the next segment
                [lastX, lastY] = [coords.x, coords.y];
            }
            function stopDrawing() {
                if (!isAnnotationActive || !isDrawing) return;
                isDrawing = false;
                annotationCtx.closePath(); // End the current path
            }
            function setTool(toolName) {
                currentTool = toolName;

                // Update active button styling
                document.querySelectorAll('#annotation-controls button[data-tool]').forEach(btn => {
                    btn.classList.remove('active-tool');
                });
                const currentButton = document.querySelector(`#annotation-controls button[data-tool="${toolName}"]`);
                if (currentButton) {
                    currentButton.classList.add('active-tool');
                }

                // Set canvas cursor and drawing properties
                switch (toolName) {
                    case 'pen':
                        annotationCanvas.style.cursor = 'crosshair'; // Or a custom pen cursor
                        annotationCtx.strokeStyle = penColor;
                        annotationCtx.lineWidth = penWidth;
                        annotationCtx.lineCap = 'round';
                        annotationCtx.lineJoin = 'round';
                        annotationCtx.globalCompositeOperation = 'source-over';
                        break;
                    case 'highlighter':
                        annotationCanvas.style.cursor = 'crosshair'; // Or a custom highlighter cursor
                        annotationCtx.strokeStyle = highlighterColor;
                        annotationCtx.lineWidth = highlighterWidth;
                        annotationCtx.lineCap = 'square'; // Square cap for more uniform highlighting
                        annotationCtx.lineJoin = 'miter'; // Sharp corners for consistent thickness
                        annotationCtx.globalCompositeOperation = 'multiply'; // Better blending for highlights
                        break;
                    case 'eraser':
                        annotationCanvas.style.cursor = 'crosshair'; // Or a custom eraser cursor
                        annotationCtx.lineWidth = eraserWidth;
                        annotationCtx.lineCap = 'round';
                        annotationCtx.lineJoin = 'round';
                        annotationCtx.globalCompositeOperation = 'destination-out';
                        annotationCtx.fillStyle = 'rgba(0,0,0,1)'; // Ensure eraser is fully opaque
                        break;
                }
            }
            function clearCanvas() {
                annotationCtx.clearRect(0, 0, annotationCanvas.width / (window.devicePixelRatio || 1), annotationCanvas.height / (window.devicePixelRatio || 1));
                // If annotation mode is active, we need to redraw the base text content
                if (isAnnotationActive) {
                    resizeCanvas(); // This function also handles redrawing the text
                }
            }

            // --- Utility Functions ---

            // --- Performance Modal Functions ---
            async function showPerformanceModal() {
                if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                    alert("No quiz data loaded. Please load a JSON file first."); return;
                }
                await saveNotesForCurrentAttempt();
                performanceStatsContent.innerHTML = '<p>Calculating statistics...</p>';
                performanceModal.style.display = 'block';
                setTimeout(() => {
                    const stats = calculatePerformanceStats(quizData); // Uses in-memory quizData
                    displayPerformanceStats(stats);
                }, 10);
            }
            function calculatePerformanceStats(data) {
                if (!data || !data.questions || data.questions.length === 0) {
                    return { /* Return a default empty stats object */
                        totalQuestions: 0, uniqueQuestionsAttempted: 0, correctAttempts: 0,
                        incorrectAttempts: 0, accuracy: 0, averageTimePerAttempted: 0,
                        questionsWithNotes: 0, byCategory: {}, byProvider: {}, byYear: {}
                    };
                }

                let totalQuestionsInDB = data.questions.length;
                let attemptedQuestions = new Set(); // To count unique questions attempted
                let correctCount = 0;
                let incorrectCount = 0;
                let totalTimeSpentOnAllAttempts = 0;
                let totalIndividualAttempts = 0; // Count every single attempt click
                let questionsWithAnyNotes = new Set();

                const categoryStats = {}; // { categoryName: { total: 0, correct: 0, sumTime: 0, numAttempts: 0 } }
                const providerStats = {}; // Similar structure
                const yearStats = {};     // Similar structure

                data.questions.forEach(q => {
                    if (q.user_attempts && q.user_attempts.length > 0) {
                        attemptedQuestions.add(q.question_id);
                        const lastAttempt = q.user_attempts[q.user_attempts.length - 1];

                        if (lastAttempt.chosen_answer === q.answer?.correct_choice) {
                            correctCount++;
                        } else if (lastAttempt.chosen_answer) { // Count as incorrect only if an answer was chosen
                            incorrectCount++;
                        }

                        q.user_attempts.forEach(attempt => {
                            totalTimeSpentOnAllAttempts += (attempt.time_spent_seconds || 0);
                            totalIndividualAttempts++;
                            if (attempt.notes && attempt.notes.trim() !== '') {
                                questionsWithAnyNotes.add(q.question_id);
                            }
                        });

                        // Stats by category (based on last attempt of this question)
                        if (q.category) {
                            if (!categoryStats[q.category]) {
                                categoryStats[q.category] = {
                                    overall: { totalLastAttempts: 0, correctLastAttempts: 0, sumTimeAllAttempts: 0, numAllAttempts: 0 },
                                    subcategories: {}
                                };
                            }
                            // Update overall category stats
                            categoryStats[q.category].overall.totalLastAttempts++;
                            if (lastAttempt.chosen_answer === q.answer?.correct_choice) {
                                categoryStats[q.category].overall.correctLastAttempts++;
                            }
                            q.user_attempts.forEach(att => {
                                categoryStats[q.category].overall.sumTimeAllAttempts += (att.time_spent_seconds || 0);
                                categoryStats[q.category].overall.numAllAttempts++;
                            });

                            // Update subcategory stats if sub_category exists
                            if (q.sub_category) {
                                if (!categoryStats[q.category].subcategories[q.sub_category]) {
                                    categoryStats[q.category].subcategories[q.sub_category] = {
                                        totalLastAttempts: 0, correctLastAttempts: 0, sumTimeAllAttempts: 0, numAllAttempts: 0
                                    };
                                }
                                categoryStats[q.category].subcategories[q.sub_category].totalLastAttempts++;
                                if (lastAttempt.chosen_answer === q.answer?.correct_choice) {
                                    categoryStats[q.category].subcategories[q.sub_category].correctLastAttempts++;
                                }
                                q.user_attempts.forEach(att => {
                                    categoryStats[q.category].subcategories[q.sub_category].sumTimeAllAttempts += (att.time_spent_seconds || 0);
                                    categoryStats[q.category].subcategories[q.sub_category].numAllAttempts++;
                                });
                            }
                        }
                        // Stats by provider
                        if (q.source?.provider) {
                            if (!providerStats[q.source.provider]) providerStats[q.source.provider] = { totalLastAttempts: 0, correctLastAttempts: 0, sumTimeAllAttempts: 0, numAllAttempts: 0 };
                            providerStats[q.source.provider].totalLastAttempts++;
                            if (lastAttempt.chosen_answer === q.answer?.correct_choice) providerStats[q.source.provider].correctLastAttempts++;
                            q.user_attempts.forEach(att => {
                                providerStats[q.source.provider].sumTimeAllAttempts += (att.time_spent_seconds || 0);
                                providerStats[q.source.provider].numAllAttempts++;
                            });
                        }
                        // Stats by year
                        if (q.source?.year) {
                            const yearStr = String(q.source.year);
                            if (!yearStats[yearStr]) yearStats[yearStr] = { totalLastAttempts: 0, correctLastAttempts: 0, sumTimeAllAttempts: 0, numAllAttempts: 0 };
                            yearStats[yearStr].totalLastAttempts++;
                            if (lastAttempt.chosen_answer === q.answer?.correct_choice) yearStats[yearStr].correctLastAttempts++;
                            q.user_attempts.forEach(att => {
                                yearStats[yearStr].sumTimeAllAttempts += (att.time_spent_seconds || 0);
                                yearStats[yearStr].numAllAttempts++;
                            });
                        }
                    }
                });

                const uniqueQuestionsAttemptedCount = attemptedQuestions.size;
                const accuracy = uniqueQuestionsAttemptedCount > 0 ? (correctCount / uniqueQuestionsAttemptedCount) * 100 : 0;
                const averageTimePerSingleAttempt = totalIndividualAttempts > 0 ? totalTimeSpentOnAllAttempts / totalIndividualAttempts : 0;

                return {
                    totalQuestions: totalQuestionsInDB,
                    uniqueQuestionsAttempted: uniqueQuestionsAttemptedCount,
                    correctAttempts: correctCount,
                    incorrectAttempts: incorrectCount,
                    accuracy: parseFloat(accuracy.toFixed(1)),
                    averageTimePerAttempted: parseFloat(averageTimePerSingleAttempt.toFixed(1)),
                    questionsWithNotes: questionsWithAnyNotes.size,
                    byCategory: categoryStats,
                    byProvider: providerStats,
                    byYear: yearStats
                };
            }
            function displayPerformanceStats(stats) {
                if (!stats) {
                    performanceStatsContent.innerHTML = "<p>Error: Statistics could not be calculated or are unavailable.</p>";
                    return;
                }

                let html = '';

                // Last Session Stats (from sessionAttempts)
                if (sessionAttempts.size > 0) {
                    let sessionCorrect = 0;
                    sessionAttempts.forEach(attemptData => {
                        if (attemptData.attempt.chosen_answer === attemptData.question.answer?.correct_choice) {
                            sessionCorrect++;
                        }
                    });
                    const sessionAccuracy = ((sessionCorrect / sessionAttempts.size) * 100).toFixed(1);
                    html += '<div class="category-stats" style="background: #f5f5f5; padding: 1rem; border-radius: 5px;">';
                    html += '<h3>Last Session Performance</h3>';
                    html += '<ul>';
                    html += `<li><strong>Questions Attempted:</strong> ${sessionAttempts.size}</li>`;
                    html += `<li><strong>Correct Answers:</strong> ${sessionCorrect}</li>`;
                    html += `<li><strong>Session Accuracy:</strong> ${sessionAccuracy}%</li>`;
                    html += '</ul></div><br>';
                }

                // Overall Stats
                html += '<h3>Overall Statistics</h3><ul>';
                html += `<li><strong>Total Questions in Database:</strong> ${stats.totalQuestions}</li>`;
                html += `<li><strong>Unique Questions Attempted:</strong> ${stats.uniqueQuestionsAttempted}</li>`;
                html += `<li><strong>Correct:</strong> ${stats.correctAttempts}</li>`;
                html += `<li><strong>Incorrect:</strong> ${stats.incorrectAttempts}</li>`;
                html += `<li><strong>Overall Accuracy:</strong> ${stats.accuracy}%</li>`;
                html += `<li><strong>Avg. Time per Attempt:</strong> ${stats.averageTimePerAttempted} seconds</li>`;
                html += `<li><strong>Questions with Notes:</strong> ${stats.questionsWithNotes}</li>`;
                html += '</ul>';

                // Performance by Category (sorted by accuracy)
                if (Object.keys(stats.byCategory).length > 0) {
                    html += '<div class="category-stats"><h3>Performance by Category</h3><ul>';

                    // Convert to array, include category name, and sort by overall accuracy
                    const sortedCategories = Object.entries(stats.byCategory)
                        .map(([categoryName, categoryData]) => ({
                            categoryName, // Keep category name for display
                            overall: categoryData.overall,
                            subcategories: categoryData.subcategories,
                            // Calculate accuracy for sorting, using overall stats
                            accuracy: categoryData.overall.totalLastAttempts > 0 ? (categoryData.overall.correctLastAttempts / categoryData.overall.totalLastAttempts * 100) : 0
                        }))
                        .sort((a, b) => b.accuracy - a.accuracy);

                    sortedCategories.forEach(item => {
                        const categoryName = item.categoryName;
                        const overallStats = item.overall;
                        const subcategoriesMap = item.subcategories;

                        const overallAccuracy = item.accuracy; // Already calculated for sorting
                        const overallAvgTime = overallStats.numAllAttempts > 0 ? (overallStats.sumTimeAllAttempts / overallStats.numAllAttempts).toFixed(1) : '0.0';

                        html += `<li><strong>${escapeHtml(categoryName)} (Overall):</strong> ` +
                            `${overallStats.correctLastAttempts}/${overallStats.totalLastAttempts} correct (${overallAccuracy.toFixed(1)}%) - ` +
                            `Avg Time: ${overallAvgTime}s`;

                        if (subcategoriesMap && Object.keys(subcategoriesMap).length > 0) {
                            // Use a sanitized version of categoryName for the ID
                            const sanitizedCategoryName = categoryName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
                            html += `<button class="subcategory-performance-toggle" data-category-target="subs-for-${escapeHtml(sanitizedCategoryName)}">Show Subcategories [+]</button>`;
                            html += `<div class="subcategory-performance-details" id="subs-for-${escapeHtml(sanitizedCategoryName)}" style="display: none; margin-left: 20px;"><ul>`;

                            Object.entries(subcategoriesMap).forEach(([subName, subData]) => {
                                const subAccuracy = subData.totalLastAttempts > 0 ? (subData.correctLastAttempts / subData.totalLastAttempts * 100).toFixed(1) : '0.0';
                                const subAvgTime = subData.numAllAttempts > 0 ? (subData.sumTimeAllAttempts / subData.numAllAttempts).toFixed(1) : '0.0';
                                html += `<li><strong>${escapeHtml(subName)}:</strong> ` +
                                    `${subData.correctLastAttempts}/${subData.totalLastAttempts} correct (${subAccuracy}%) - ` +
                                    `Avg Time: ${subAvgTime}s</li>`;
                            });
                            html += `</ul></div>`;
                        }
                        html += `</li>`;
                    });
                    html += '</ul></div>';
                }

                performanceStatsContent.innerHTML = html;

                // After setting innerHTML, attach event listeners:
                document.querySelectorAll('.subcategory-performance-toggle').forEach(button => {
                    button.addEventListener('click', () => {
                        const targetId = button.dataset.categoryTarget;
                        const detailsDiv = document.getElementById(targetId);
                        if (detailsDiv) {
                            const isHidden = detailsDiv.style.display === 'none';
                            detailsDiv.style.display = isHidden ? 'block' : 'none';
                            button.textContent = isHidden ? `Hide Subcategories [-]` : `Show Subcategories [+]`;
                        }
                    });
                });
            }
            function closePerformanceModal() {
                performanceModal.style.display = 'none';
            }


            // --- Review Functions ---
            function generateReviewHtml() {
                if (sessionAttempts.size === 0 && masterQuestionList.length === 0) {
                    return "<p>No questions were attempted or included in this session.</p>";
                }

                let html = '<h3>Session Summary</h3>';
                let sessionCorrectCount = 0;
                let sessionTotalAttempted = 0; // Questions attempted *in this session*

                // Calculate session-specific summary
                sessionAttempts.forEach(attemptData => {
                    sessionTotalAttempted++;
                    if (attemptData.attempt.chosen_answer === attemptData.question.answer?.correct_choice) {
                        sessionCorrectCount++;
                    }
                });

                if (sessionTotalAttempted > 0) {
                    html += `<p>You answered ${sessionCorrectCount} out of ${sessionTotalAttempted} questions correctly in this session. (${((sessionCorrectCount / sessionTotalAttempted) * 100).toFixed(1)}%)</p>`;
                } else if (masterQuestionList.length > 0 && hideAnswerMode) {
                    // This case is for when hideAnswerMode is on, and the user might have gone through questions without "submitting" each one via the button
                    html += `<p>You reviewed ${masterQuestionList.length} questions. See details below.</p>`;
                }


                html += '<h4>Detailed Review:</h4><ul style="list-style: none; padding: 0;">';

                masterQuestionList.forEach((q_from_master, index) => {
                    // q_from_master might be a partial object if masterQuestionList was filtered.
                    // Get the full, definitive question object from quizData using its ID.
                    const question = quizData.questions.find(dbQ => dbQ.question_id === q_from_master.question_id);
                    if (!question) {
                        console.warn(`Could not find full question data for ID: ${q_from_master.question_id} during review.`);
                        return; // Skip if full data not found
                    }

                    const sessionAttemptData = sessionAttempts.get(question.question_id);

                    html += `<li style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">`;
                    let questionTextPreview = "[Question text not available]";
                    if (question && typeof question.text === 'string') {
                        questionTextPreview = escapeHtml(question.text.substring(0, 150)) + (question.text.length > 150 ? "..." : "");
                    } else if (question && question.text) { // Handle cases where question.text might exist but not be a string
                        questionTextPreview = escapeHtml(String(question.text).substring(0, 150)) + (String(question.text).length > 150 ? "..." : "");
                    }
                    html += `<p><strong>Q${index + 1} (ID: ${escapeHtml(question.question_id)}):</strong> ${questionTextPreview}</p>`;

                    if (sessionAttemptData) { // If the question was attempted in *this* session
                        const { attempt } = sessionAttemptData;
                        const isCorrect = attempt.chosen_answer === question.answer?.correct_choice;
                        html += `<p>Your Answer: ${escapeHtml(attempt.chosen_answer) || "<em>Not Answered</em>"} (${isCorrect ? '<span style="color:var(--success-color);">Correct</span>' : '<span style="color:var(--danger-color);">Incorrect</span>'})</p>`;
                        if (!isCorrect) {
                            html += `<p>Correct Answer: ${escapeHtml(question.answer?.correct_choice)}</p>`;
                        }
                        if (attempt.notes && attempt.notes.trim() !== '') {
                            html += `<p><em>Your Notes for this attempt:</em> ${escapeHtml(attempt.notes).replace(/\n/g, '<br>')}</p>`;
                        }
                    } else if (hideAnswerMode) { // Question was in list (masterQuestionList) but not formally "attempted" in this session
                        html += `<p><em>Not formally answered in this session.</em></p>`;
                        html += `<p>Correct Answer: ${escapeHtml(question.answer?.correct_choice)}</p>`;
                    } else {
                        html += `<p><em>This question was not attempted in the current session.</em></p>`;
                        html += `<p>Correct Answer: ${escapeHtml(question.answer?.correct_choice)}</p>`;
                    }
                    html += `<p><em>Explanation:</em> ${escapeHtml(question.answer?.explanation || 'N/A').replace(/\n/g, '<br>')}</p>`;
                    html += `</li>`;
                });

                html += '</ul>';
                return html;
            }
            async function displayFinalReviewScreen() {
                console.log("Displaying final review screen.");
                await saveNotesForCurrentAttempt();
                // Removed saveToLocalStorage()
                pauseQuestionTimer(); pauseSessionTimer(); pauseStopwatch();
                quizAreaElement.style.display = 'none';
                endOfQuizMessageElement.style.display = 'none';
                finalReviewArea.style.display = 'block';
                finalReviewContent.innerHTML = generateReviewHtml();
                finalReviewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            function showReviewModal() {
                reviewModalContent.innerHTML = "<p>Loading review...</p>"; // Placeholder
                reviewModal.style.display = 'block';
                // Generate HTML asynchronously if it's complex, or directly
                setTimeout(() => { // Simulate async or just defer to next tick
                    reviewModalContent.innerHTML = generateReviewHtml();
                }, 10);
            }
            function closeReviewModal() {
                reviewModal.style.display = 'none';
            }
            function handleRestartQuiz() {
                console.log("Restarting quiz with current filter settings.");
                finalReviewArea.style.display = 'none'; // Hide the final review area
                // applyFiltersAndStartQuiz will reset necessary states like currentQuestionIndex,
                // timers, and repopulate masterQuestionList based on current sidebar filters.
                // It also handles displaying the quiz area.
                applyFiltersAndStartQuiz(); // This will call saveCurrentSettingsToDB
            }
            async function handleBackToSettings() {
                console.log("Returning to settings.");
                await clearActiveSessionState(); // Clear session as the user is abandoning it
                finalReviewArea.style.display = 'none';
                quizAreaElement.style.display = 'none';
                endOfQuizMessageElement.style.display = 'none';
                // Timers should have been paused already.
                resetQuizState(true); // Reset UI but keep data loaded
                openSidebar(); // Show the sidebar for new settings.
            }


            // --- Initial Page Load Sequence ---
            async function initializeApp() {
                await loadHtmlFragments(); // Load HTML snippets first
                initializeElementReferences(); // Initialize element references after fragments are loaded
                setupEventListeners(); // Setup event listeners after elements are initialized
                registerServiceWorker();
                const loadedFromDB = await loadQuizDataFromDB();
                
                // Update global quizData first
                if (loadedFromDB && loadedFromDB.questions && loadedFromDB.questions.length > 0) {
                    quizData = loadedFromDB;
                }
                
                populateFilterOptions(); // Populate dynamic filter options after quizData is set
                await loadUserSettingsFromDB(); // Then load and apply saved settings

                let sessionRestored = false;

                if (loadedFromDB) {
                    // Attempt to load and restore an active session
                    // Note: Session restoration might override some of the general user settings loaded above,
                    // especially for filters, which is the intended behavior.
                    const savedMasterList = await loadAppState('activeMasterQuestionList');
                    const savedIndex = await loadAppState('activeCurrentQuestionIndex');
                    const savedFilters = await loadAppState('activeFilters');
                    const savedHideAnswerMode = await loadAppState('activeHideAnswerMode');
                    const savedQuestionLimit = await loadAppState('activeQuestionLimit');
                    const savedSessionTimeRemaining = await loadAppState('activeSessionTimeRemaining');
                    const savedStopwatchTime = await loadAppState('activeStopwatchTime');
                    const savedSerializableSessionAttempts = await loadAppState('activeSessionAttempts');

                    // Load timer settings from previous session
                    const savedSessionTimerEnabled = await loadAppState('activeSessionTimerEnabled');
                    const savedQuestionTimerEnabled = await loadAppState('activeQuestionTimerEnabled');
                    const savedStopwatchEnabled = await loadAppState('activeStopwatchEnabled');
                    const savedSessionTimeLimit = await loadAppState('activeSessionTimeLimit');
                    const savedQuestionTimeLimit = await loadAppState('activeQuestionTimeLimit');

                    if (savedSerializableSessionAttempts && Array.isArray(savedSerializableSessionAttempts)) {
                        sessionAttempts = new Map(savedSerializableSessionAttempts);
                        console.log("initializeApp: sessionAttempts restored from saved state.", sessionAttempts);
                    } else {
                        sessionAttempts = new Map(); // Ensure it's a fresh Map if nothing was restored
                        console.log("initializeApp: No saved sessionAttempts found or format error, initialized as new Map.");
                    }

                    if (savedMasterList && savedMasterList.length > 0 && savedIndex !== null && savedIndex >= 0 && savedIndex < savedMasterList.length) {
                        console.log("Found active session state. Attempting to restore.");
                        masterQuestionList = savedMasterList;
                        currentQuestionIndex = savedIndex - 1; // displayNextQuestionInternal will increment it
                        hideAnswerMode = savedHideAnswerMode !== null ? savedHideAnswerMode : settingHideAnswerCheckbox.checked;
                        
                        // Get timer elements using our cached element group
                        const timerElements = getElementGroup('timer');
                        
                        questionLimit = savedQuestionLimit !== null ? savedQuestionLimit : parseInt(timerElements.questionLimit.value, 10) || 50;

                        // Restore all timer settings using cached elements
                        timerElements.questionLimit.value = questionLimit;
                        timerElements.enableSessionTimer.checked = savedSessionTimerEnabled || false;
                        timerElements.enableQuestionTimer.checked = savedQuestionTimerEnabled || false;
                        timerElements.enableStopwatch.checked = savedStopwatchEnabled || false;
                        timerElements.sessionTimeLimit.value = savedSessionTimeLimit ? Math.floor(savedSessionTimeLimit / 60) : 60;
                        timerElements.questionTimeLimit.value = savedQuestionTimeLimit || 90;

                        // Restore filter UI before initializing timers
                        if (savedFilters) {
                            restoreFilterUI(savedFilters);
                        }

                        initializeTimerSettings(); // This will set up timer limits based on restored UI values

                        // Now, apply the saved remaining times
                        sessionTimeRemaining = savedSessionTimeRemaining !== null ? savedSessionTimeRemaining : sessionTimeLimit;
                        stopwatchTime = savedStopwatchTime !== null ? savedStopwatchTime : 0;
                        updateSessionTimerDisplay(); // Update display with restored time
                        updateStopwatchDisplay();   // Update display with restored time

                        quizAreaElement.style.display = 'block';
                        endOfQuizMessageElement.style.display = 'none';
                        finalReviewArea.style.display = 'none';
                        toggleAnnotationButton.style.display = 'inline-block';

                        populateFilterOptions(); // Ensure filter options are populated based on full quizData
                        if (savedFilters) restoreFilterUI(savedFilters); // Re-apply to ensure dynamic content is handled

                        await displayNextQuestionInternal(); // This will load currentQuestionObject, render, etc.
                                                           // and also increments currentQuestionIndex to the correct value.

                        startSessionTimer();
                        startStopwatch();
                        // quizProgressElement is updated in displayNextQuestionInternal

                        showNotification("Your previous quiz session has been restored.", "info");
                        sessionRestored = true;
                        // Only close sidebar if HTML fragments are fully loaded
                        try {
                            closeSidebar();
                        } catch (error) {
                            console.warn("Could not close sidebar, HTML fragments may not be fully loaded yet:", error);
                        }
                    } else {
                        console.log("No active session found or session data invalid. Initializing normally.");
                        resetQuizState(true); // Resets UI, keeps quizData loaded from DB
                        console.log("Data loaded from DB. User settings (if any) applied. No active session restored, or session data was invalid.");
                        
                        // Update file controls visibility when data is available
                        updateFileControlsVisibility();
                    }
                } else {
                    resetQuizState(false); // Full reset, quizData will be empty
                    // populateFilterOptions(); // Already called above
                    if (performanceButton) performanceButton.disabled = true;
                    console.log("No data in DB. UI reset. User settings (if any) applied.");
                    
                    // Update file controls visibility when no data is available
                    updateFileControlsVisibility();
                }

                if (!sessionRestored) { // If no session was restored, do default timer/UI setup
                    initializeTimerSettings();
                    setTool('pen');
                    // Only close sidebar if HTML fragments are fully loaded
                    try {
                        closeSidebar(); // ui.js
                    } catch (error) {
                        console.warn("Could not close sidebar, HTML fragments may not be fully loaded yet:", error);
                    }
                    updateTimerVisibility();
                }
            }

            function registerServiceWorker() {
                if ('serviceWorker' in navigator) {
                    window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js') // Corrected path
                            .then(registration => {
                                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                            })
                            .catch(error => {
                                console.log('ServiceWorker registration failed: ', error);
                            });
                    });
                }
            }

            // Initialize file controls
            async function setupApp() {
                try {
                    // First load HTML fragments
                    await loadHtmlFragments();
                    
                    // Initialize file controls
                    initializeFileControls();
                    
                    // Update file controls visibility based on data availability
                    updateFileControlsVisibility();
                    
                    // Start the application initialization
                    initializeApp();
                } catch (error) {
                    console.error('Error setting up app:', error);
                }
            }
            
            // Start the application setup
            setupApp();
        });

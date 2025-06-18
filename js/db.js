// js/db.js - DexieDB setup and interaction functions
export const db = new Dexie('MBEPracticeQuizDB');
db.version(1).stores({
    questions: 'question_id, category, source.provider, source.year, group_id', // question_id is PK. Others indexed.
    groups: 'group_id', // group_id is PK.
    appState: 'key'      // 'key' is PK. For storing 'lastLoadedFileName', etc.
});

export async function saveCurrentSettingsToDB() {
    try {
        const userSettings = {
            attempts: document.querySelector('input[name="filter-attempts"]:checked')?.value,
            notes: document.querySelector('input[name="filter-notes"]:checked')?.value,
            scramble: document.getElementById('filter-scramble')?.checked,
            sessionTimeLimit: document.getElementById('session-time-limit')?.value,
            questionLimit: document.getElementById('question-limit')?.value,
            enableSessionTimer: document.getElementById('enable-session-timer')?.checked,
            enableQuestionTimer: document.getElementById('enable-question-timer')?.checked,
            enableStopwatch: document.getElementById('enable-stopwatch')?.checked,
            questionTimeLimit: document.getElementById('question-time-limit')?.value,
            hideAnswer: document.getElementById('setting-hide-answer')?.checked,
            categories: Array.from(document.getElementById('filter-categories-list').querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value),
            providers: Array.from(document.getElementById('filter-providers-list').querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value),
        };
        await db.appState.put({ key: 'userQuizSettings', value: userSettings });
        console.log('User quiz settings saved to DexieDB.');
    } catch (error) {
        console.error('Error saving user quiz settings to DexieDB:', error);
    }
}

export async function loadUserSettingsFromDB() {
    try {
        const savedSettings = await db.appState.get('userQuizSettings');
        if (savedSettings && savedSettings.value) {
            const settings = savedSettings.value;
            console.log('Loading user quiz settings from DexieDB:', settings);

            // Radio buttons
            const attemptsRadio = document.querySelector(`input[name="filter-attempts"][value="${settings.attempts}"]`);
            if (attemptsRadio) attemptsRadio.checked = true;
            const notesRadio = document.querySelector(`input[name="filter-notes"][value="${settings.notes}"]`);
            if (notesRadio) notesRadio.checked = true;

            // Checkboxes
            if (document.getElementById('filter-scramble') && typeof settings.scramble !== 'undefined') document.getElementById('filter-scramble').checked = settings.scramble;
            if (document.getElementById('enable-session-timer') && typeof settings.enableSessionTimer !== 'undefined') document.getElementById('enable-session-timer').checked = settings.enableSessionTimer;
            if (document.getElementById('enable-question-timer') && typeof settings.enableQuestionTimer !== 'undefined') document.getElementById('enable-question-timer').checked = settings.enableQuestionTimer;
            if (document.getElementById('enable-stopwatch') && typeof settings.enableStopwatch !== 'undefined') document.getElementById('enable-stopwatch').checked = settings.enableStopwatch;
            if (document.getElementById('setting-hide-answer') && typeof settings.hideAnswer !== 'undefined') document.getElementById('setting-hide-answer').checked = settings.hideAnswer;

            // Number inputs
            if (document.getElementById('session-time-limit') && typeof settings.sessionTimeLimit !== 'undefined') document.getElementById('session-time-limit').value = settings.sessionTimeLimit;
            if (document.getElementById('question-limit') && typeof settings.questionLimit !== 'undefined') document.getElementById('question-limit').value = settings.questionLimit;
            if (document.getElementById('question-time-limit') && typeof settings.questionTimeLimit !== 'undefined') document.getElementById('question-time-limit').value = settings.questionTimeLimit;

            // Dynamic checkboxes (categories and providers)
            // These rely on populateCheckboxList having been called first.
            if (settings.categories && Array.isArray(settings.categories)) {
                document.getElementById('filter-categories-list').querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (settings.categories.includes(cb.value)) {
                        cb.checked = true;
                    }
                });
            }
            if (settings.providers && Array.isArray(settings.providers)) {
                document.getElementById('filter-providers-list').querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (settings.providers.includes(cb.value)) {
                        cb.checked = true;
                    }
                });
            }
            console.log('User quiz settings applied to UI.');
        } else {
            console.log('No user quiz settings found in DexieDB.');
        }
    } catch (error) {
        console.error('Error loading user quiz settings from DexieDB:', error);
    }
}

export async function loadQuizDataFromDB() {
    try {
        const questions = await db.questions.toArray();
        const groups = await db.groups.toArray();
        const appStateFileName = await db.appState.get('lastLoadedFileName');

        if (questions.length > 0) {
            const quizData = {
                questions: questions,
                groups: groups || [],
                fileName: appStateFileName ? appStateFileName.value : null
            };
            quizData.questions.forEach(q => {
                if (!q.user_attempts) q.user_attempts = [];
                q.answer = q.answer || {}; // Initialize if not present after loading
                q.source = q.source || {}; // Ensure source object exists for Dexie dot notation
            });
            console.log('Quiz data loaded from DexieDB.');
            return quizData; // Return the data
        } else {
            console.log('No quiz data found in DexieDB.');
            return { questions: [], groups: [], fileName: null }; // Return empty structure
        }
    } catch (error) {
        console.error('Error loading data from DexieDB:', error);
        return { questions: [], groups: [], fileName: null }; // Return empty structure on error
    }
}

export async function saveAppState(key, value) {
    try {
        await db.appState.put({ key: key, value: value });
        // console.log(`App state '${key}' saved to DexieDB.`);
    } catch (error) {
        console.error(`Error saving app state '${key}' to DexieDB:`, error);
    }
}

export async function loadAppState(key) {
    try {
        const state = await db.appState.get(key);
        return state ? state.value : null;
    } catch (error) {
        console.error(`Error loading app state '${key}' from DexieDB:`, error);
        return null;
    }
}

export async function clearActiveSessionState() {
    console.log("Clearing active session state from DexieDB.");
    try {
        await db.appState.bulkDelete([
            'activeMasterQuestionList',
            'activeCurrentQuestionIndex',
            'activeFilters',
            'activeHideAnswerMode',
            'activeQuestionLimit',
            'activeSessionTimeRemaining',
            'activeStopwatchTime',
            'activeSessionAttempts'
        ]);
    } catch (error) {
        console.error("Error clearing active session state:", error);
    }
}

export async function saveQuestionToDB(questionObject) {
    if (!questionObject || !questionObject.question_id) {
        console.error("Invalid question object provided to saveQuestionToDB", questionObject);
        return;
    }
    try {
        // Ensure source is an object before saving
        questionObject.source = questionObject.source || {};
        await db.questions.put(questionObject);
        // console.log(`Question ${questionObject.question_id} saved to DexieDB.`);
    } catch (error) {
        console.error(`Error saving question ${questionObject.question_id} to DexieDB:`, error);
        if (error.name === 'ConstraintError') {
            alert(`Error: Could not save question ${questionObject.question_id}. Data conflict or constraint violation.`);
        } else if (error.message.toLowerCase().includes('quota')) {
            alert('Could not save progress: Database quota exceeded. Please export your data or clear space.');
        } else {
            alert('An error occurred while saving progress for a question.');
        }
    }
}

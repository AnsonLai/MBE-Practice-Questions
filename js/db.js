// js/db.js - DexieDB setup and interaction functions
import { settingsManager } from './dom-manager.js';

export const db = new Dexie('MBEPracticeQuizDB');
db.version(1).stores({
    questions: 'question_id, category, source.provider, source.year, group_id', // question_id is PK. Others indexed.
    groups: 'group_id', // group_id is PK.
    appState: 'key'      // 'key' is PK. For storing 'lastLoadedFileName', etc.
});

export async function saveCurrentSettingsToDB() {
    try {
        const userSettings = settingsManager.getCurrentSettings();
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
            console.log('Loading user quiz settings from DexieDB:', JSON.stringify(settings, null, 2));
            
            settingsManager.applySettings(settings);
            console.log('User quiz settings applied to UI successfully.');
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

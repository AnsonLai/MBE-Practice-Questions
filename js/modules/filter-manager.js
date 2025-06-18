// js/modules/filter-manager.js - Quiz filtering and question selection logic

import { appState } from '../state-manager.js';
import { domManager } from '../dom-manager.js';
import { populateCheckboxList, populateCategorySubcategoryFilter } from '../ui.js';
import { saveCurrentSettingsToDB } from '../db.js';
import { quizManager } from './quiz-manager.js';

/**
 * FilterManager - Handles quiz filtering, question selection, and filter UI
 */
export class FilterManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the filter manager
     */
    initialize() {
        if (this.initialized) {
            console.warn('FilterManager already initialized');
            return;
        }

        this.initialized = true;
        console.log('FilterManager initialized');
    }

    /**
     * Apply current filters and start a new quiz session
     */
    async applyFiltersAndStartQuiz() {
        console.log("Starting quiz with filters - using state manager for synchronization");
        
        try {
            // CRITICAL: Sync current UI state to ensure we have the latest filter values
            // This solves the mobile browser caching issue
            appState.syncFromUI();
            
            // Get the current filters from state (now guaranteed to match UI)
            const currentFilters = appState.getCurrentFilters();
            console.log("Current filters from UI:", currentFilters);
            
            // Save current settings to database
            await saveCurrentSettingsToDB();
            
            // Get quiz data from state
            const quizData = appState.get('quizData');
            if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                alert('No quiz data loaded. Please load a JSON file first.');
                return;
            }
            
            // Apply filters to create filtered question list
            const filteredQuestions = this.filterQuestions(quizData.questions, currentFilters);
            
            if (filteredQuestions.length === 0) {
                alert('No questions match the current filter criteria. Please adjust your filters.');
                return;
            }
            
            // Apply question limit
            const questionLimit = appState.get('timers.questionLimit') || 50;
            let finalQuestions = filteredQuestions;
            if (filteredQuestions.length > questionLimit) {
                finalQuestions = filteredQuestions.slice(0, questionLimit);
            }
            
            // Scramble if enabled
            if (currentFilters.scramble) {
                finalQuestions = this.scrambleQuestions(finalQuestions);
            }
            
            // Start the quiz session
            await quizManager.startQuizSession(finalQuestions);
            
            console.log(`Quiz started with ${finalQuestions.length} questions`);
            
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('An error occurred while starting the quiz. Please try again.');
        }
    }

    /**
     * Filter questions based on current filter criteria
     * @param {Array} questions - Array of question objects
     * @param {Object} filters - Filter criteria object
     * @returns {Array} Filtered questions
     */
    filterQuestions(questions, filters) {
        return questions.filter(question => {
            // Filter by attempts
            if (!this.passesAttemptFilter(question, filters.attempts)) {
                return false;
            }
            
            // Filter by notes
            if (!this.passesNotesFilter(question, filters.notes)) {
                return false;
            }
            
            // Filter by categories
            if (!this.passesCategoryFilter(question, filters.categories)) {
                return false;
            }
            
            // Filter by providers
            if (!this.passesProviderFilter(question, filters.providers)) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Check if question passes attempt filter
     * @param {Object} question - Question object
     * @param {string} attemptFilter - Attempt filter type
     * @returns {boolean} Whether question passes filter
     */
    passesAttemptFilter(question, attemptFilter) {
        const hasAttempts = question.user_attempts && question.user_attempts.length > 0;
        
        switch (attemptFilter) {
            case 'attempted':
                return hasAttempts;
            case 'unattempted':
                return !hasAttempts;
            case 'all':
            default:
                return true;
        }
    }

    /**
     * Check if question passes notes filter
     * @param {Object} question - Question object
     * @param {string} notesFilter - Notes filter type
     * @returns {boolean} Whether question passes filter
     */
    passesNotesFilter(question, notesFilter) {
        const hasNotes = question.user_attempts && question.user_attempts.some(attempt => 
            attempt.notes && attempt.notes.trim() !== ''
        );
        
        switch (notesFilter) {
            case 'with-notes':
                return hasNotes;
            case 'without-notes':
                return !hasNotes;
            case 'all':
            default:
                return true;
        }
    }

    /**
     * Check if question passes category filter
     * @param {Object} question - Question object
     * @param {Array} categoryFilters - Array of selected categories
     * @returns {boolean} Whether question passes filter
     */
    passesCategoryFilter(question, categoryFilters) {
        if (!categoryFilters || categoryFilters.length === 0) {
            return true; // No category filter applied
        }
        
        return categoryFilters.includes(question.category);
    }

    /**
     * Check if question passes provider filter
     * @param {Object} question - Question object
     * @param {Array} providerFilters - Array of selected providers
     * @returns {boolean} Whether question passes filter
     */
    passesProviderFilter(question, providerFilters) {
        if (!providerFilters || providerFilters.length === 0) {
            return true; // No provider filter applied
        }
        
        if (!question.source || !question.source.provider) {
            return false; // Question has no provider info
        }
        
        return providerFilters.includes(question.source.provider);
    }

    /**
     * Scramble questions array
     * @param {Array} questions - Array of questions to scramble
     * @returns {Array} Scrambled questions array
     */
    scrambleQuestions(questions) {
        const scrambled = [...questions]; // Create a copy
        
        for (let i = scrambled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
        }
        
        return scrambled;
    }

    /**
     * Populate filter options based on loaded quiz data
     */
    populateFilterOptions() {
        const quizData = appState.get('quizData');
        if (!quizData || !quizData.questions) {
            console.warn('No quiz data available for filter options');
            return;
        }

        this.populateCategoryOptions(quizData.questions);
        this.populateProviderOptions(quizData.questions);
    }

    /**
     * Populate category filter options
     * @param {Array} questions - Array of question objects
     */
    populateCategoryOptions(questions) {
        const filterCategoriesList = domManager.get('filterCategoriesList');
        if (!filterCategoriesList) {
            console.warn('Categories filter container not found');
            return;
        }

        // Extract unique categories
        const categories = [...new Set(
            questions
                .map(q => q.category)
                .filter(category => category && category.trim() !== '')
        )].sort();

        if (categories.length === 0) {
            filterCategoriesList.innerHTML = '<p>No categories found in the loaded data.</p>';
            return;
        }

        // Check if we have subcategory data
        const hasSubcategories = this.hasSubcategoryData(questions);
        
        if (hasSubcategories) {
            // Use the advanced category/subcategory filter
            const categoriesWithSubcategories = this.buildCategorySubcategoryMap(questions);
            populateCategorySubcategoryFilter(filterCategoriesList, categoriesWithSubcategories);
        } else {
            // Use simple checkbox list
            populateCheckboxList(filterCategoriesList, categories);
        }

        console.log(`Populated ${categories.length} category options`);
    }

    /**
     * Populate provider filter options
     * @param {Array} questions - Array of question objects
     */
    populateProviderOptions(questions) {
        const filterProvidersList = domManager.get('filterProvidersList');
        if (!filterProvidersList) {
            console.warn('Providers filter container not found');
            return;
        }

        // Extract unique providers
        const providers = [...new Set(
            questions
                .map(q => q.source?.provider)
                .filter(provider => provider && provider.trim() !== '')
        )].sort();

        if (providers.length === 0) {
            filterProvidersList.innerHTML = '<p>No providers found in the loaded data.</p>';
            return;
        }

        populateCheckboxList(filterProvidersList, providers);
        console.log(`Populated ${providers.length} provider options`);
    }

    /**
     * Check if questions have subcategory data
     * @param {Array} questions - Array of question objects
     * @returns {boolean} Whether subcategory data exists
     */
    hasSubcategoryData(questions) {
        return questions.some(q => q.subcategory && q.subcategory.trim() !== '');
    }

    /**
     * Build category-subcategory mapping from questions
     * @param {Array} questions - Array of question objects
     * @returns {Object} Category-subcategory mapping
     */
    buildCategorySubcategoryMap(questions) {
        const categoryMap = {};

        questions.forEach(question => {
            const category = question.category;
            const subcategory = question.subcategory;

            if (category && category.trim() !== '') {
                if (!categoryMap[category]) {
                    categoryMap[category] = new Set();
                }

                if (subcategory && subcategory.trim() !== '') {
                    categoryMap[category].add(subcategory);
                }
            }
        });

        // Convert Sets to sorted arrays
        const result = {};
        Object.keys(categoryMap).sort().forEach(category => {
            result[category] = Array.from(categoryMap[category]).sort();
        });

        return result;
    }

    /**
     * Get current filter settings from UI
     * @returns {Object} Current filter settings
     */
    getCurrentFilterSettings() {
        // Ensure state is synced from UI
        appState.syncFromUI();
        return appState.getCurrentFilters();
    }

    /**
     * Apply filter settings to UI
     * @param {Object} filters - Filter settings to apply
     */
    applyFilterSettings(filters) {
        if (!filters) {
            console.warn('No filter settings provided');
            return;
        }

        // Update state
        appState.set('filters', filters);
        
        // Sync to UI
        appState.syncToUI();
        
        console.log('Filter settings applied:', filters);
    }

    /**
     * Reset all filters to default values
     */
    resetFilters() {
        const defaultFilters = {
            attempts: 'unattempted',
            notes: 'all',
            scramble: true,
            categories: [],
            providers: []
        };

        this.applyFilterSettings(defaultFilters);
        console.log('Filters reset to defaults');
    }

    /**
     * Get filter statistics for current quiz data
     * @returns {Object} Filter statistics
     */
    getFilterStatistics() {
        const quizData = appState.get('quizData');
        if (!quizData || !quizData.questions) {
            return null;
        }

        const questions = quizData.questions;
        const stats = {
            total: questions.length,
            attempted: 0,
            unattempted: 0,
            withNotes: 0,
            withoutNotes: 0,
            categories: {},
            providers: {}
        };

        questions.forEach(question => {
            // Attempt statistics
            const hasAttempts = question.user_attempts && question.user_attempts.length > 0;
            if (hasAttempts) {
                stats.attempted++;
            } else {
                stats.unattempted++;
            }

            // Notes statistics
            const hasNotes = question.user_attempts && question.user_attempts.some(attempt => 
                attempt.notes && attempt.notes.trim() !== ''
            );
            if (hasNotes) {
                stats.withNotes++;
            } else {
                stats.withoutNotes++;
            }

            // Category statistics
            if (question.category) {
                stats.categories[question.category] = (stats.categories[question.category] || 0) + 1;
            }

            // Provider statistics
            if (question.source?.provider) {
                stats.providers[question.source.provider] = (stats.providers[question.source.provider] || 0) + 1;
            }
        });

        return stats;
    }

    /**
     * Validate current filter settings
     * @returns {Object} Validation result with any issues
     */
    validateFilters() {
        const filters = this.getCurrentFilterSettings();
        const quizData = appState.get('quizData');
        const issues = [];

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            issues.push('No quiz data loaded');
            return { valid: false, issues };
        }

        // Test filter with current settings
        const filteredQuestions = this.filterQuestions(quizData.questions, filters);
        
        if (filteredQuestions.length === 0) {
            issues.push('Current filter settings result in no questions');
        }

        // Check for invalid category selections
        if (filters.categories && filters.categories.length > 0) {
            const availableCategories = [...new Set(quizData.questions.map(q => q.category).filter(Boolean))];
            const invalidCategories = filters.categories.filter(cat => !availableCategories.includes(cat));
            if (invalidCategories.length > 0) {
                issues.push(`Invalid categories selected: ${invalidCategories.join(', ')}`);
            }
        }

        // Check for invalid provider selections
        if (filters.providers && filters.providers.length > 0) {
            const availableProviders = [...new Set(quizData.questions.map(q => q.source?.provider).filter(Boolean))];
            const invalidProviders = filters.providers.filter(prov => !availableProviders.includes(prov));
            if (invalidProviders.length > 0) {
                issues.push(`Invalid providers selected: ${invalidProviders.join(', ')}`);
            }
        }

        return {
            valid: issues.length === 0,
            issues,
            resultCount: filteredQuestions.length
        };
    }
}

// Create singleton instance
export const filterManager = new FilterManager();
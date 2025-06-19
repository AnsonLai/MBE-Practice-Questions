// js/filterQuestions.js - Functions for filtering questions based on user selections

/**
 * Filter questions based on user-selected criteria
 * @param {Array} allQuestions - All available questions
 * @param {Object} filters - Filter settings object
 * @returns {Array} - Filtered questions
 */
export function filterQuestions(allQuestions, filters) {
    if (!allQuestions || !Array.isArray(allQuestions) || allQuestions.length === 0) {
        return [];
    }

    // Start with all questions
    let filteredQuestions = [...allQuestions];

    // Filter by attempts
    if (filters.attempts) {
        switch (filters.attempts) {
            case 'attempted':
                filteredQuestions = filteredQuestions.filter(q => q.user_attempts && q.user_attempts.length > 0);
                break;
            case 'unattempted':
                filteredQuestions = filteredQuestions.filter(q => !q.user_attempts || q.user_attempts.length === 0);
                break;
            case 'incorrect':
                filteredQuestions = filteredQuestions.filter(q => {
                    return q.user_attempts && q.user_attempts.some(attempt => 
                        attempt.chosen_answer !== q.answer?.correct_choice && attempt.chosen_answer !== null
                    );
                });
                break;
            case 'incorrect_only':
                filteredQuestions = filteredQuestions.filter(q => {
                    if (!q.user_attempts || q.user_attempts.length === 0) return false;
                    const lastAttempt = q.user_attempts[q.user_attempts.length - 1];
                    return lastAttempt.chosen_answer !== q.answer?.correct_choice && lastAttempt.chosen_answer !== null;
                });
                break;
            // case 'all' or default: no filtering needed
        }
    }

    // Filter by notes
    if (filters.notes) {
        switch (filters.notes) {
            case 'with-notes':
                filteredQuestions = filteredQuestions.filter(q => {
                    return q.user_attempts && q.user_attempts.some(attempt => 
                        attempt.notes && attempt.notes.trim() !== ''
                    );
                });
                break;
            case 'without-notes':
                filteredQuestions = filteredQuestions.filter(q => {
                    return !q.user_attempts || !q.user_attempts.some(attempt => 
                        attempt.notes && attempt.notes.trim() !== ''
                    );
                });
                break;
            // case 'all' or default: no filtering needed
        }
    }

    // Filter by providers
    if (filters.providers && filters.providers.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
            q.source && filters.providers.includes(q.source.provider)
        );
    }

    // Filter by categories and subcategories
    if (filters.categories && Object.keys(filters.categories).length > 0) {
        // Map to track which subcategories are selected for each category
        const categoryToSubcategories = new Map();
        // Set of all selected subcategories for quick lookup
        const allSelectedSubcategories = new Set();
        
        // Track which categories have explicitly selected subcategories
        Object.entries(filters.categories).forEach(([category, subcategories]) => {
            categoryToSubcategories.set(category, new Set(subcategories));
            subcategories.forEach(sub => allSelectedSubcategories.add(sub));
        });
        
        // Filter questions based on categories and subcategories
        filteredQuestions = filteredQuestions.filter(q => {
            // If the question doesn't have a category, it can't match our filters
            if (!q.category) return false;
            
            // Case 1: Question has a subcategory that's explicitly selected
            if (q.subcategory && allSelectedSubcategories.has(q.subcategory)) {
                return true;
            }
            
            // Case 2: The question's category is selected AND either:
            //   a) No subcategories are selected for this category, or
            //   b) The question doesn't have a subcategory
            const categorySubcategories = categoryToSubcategories.get(q.category);
            if (categorySubcategories) {
                // If no subcategories are selected for this category, include all questions in this category
                if (categorySubcategories.size === 0) {
                    return true;
                }
                
                // If subcategories are selected but this question doesn't have one,
                // include it only if we're not filtering by subcategories
                if (!q.subcategory) {
                    // For now, include questions without subcategories if their category is selected
                    // This is a reasonable default behavior
                    return true;
                }
                
                // Otherwise, this question has a subcategory that wasn't selected
                return false;
            }
            
            // The question's category isn't selected at all
            return false;
        });
    }

    return filteredQuestions;
}

/**
 * Apply filters and prepare questions for a quiz
 * @param {Array} allQuestions - All available questions
 * @param {Array} allGroups - All available question groups
 * @param {Object} filters - Filter settings object
 * @param {number} questionLimit - Maximum number of questions to include
 * @param {boolean} scramble - Whether to randomize the question order
 * @returns {Object} - Object containing filtered questions and groups
 */
export function prepareQuizQuestions(allQuestions, allGroups, filters, questionLimit, scramble) {
    // Apply filters
    let filteredQuestions = filterQuestions(allQuestions, filters);
    
    // Scramble if requested
    if (scramble) {
        filteredQuestions = shuffleArray(filteredQuestions);
    }
    
    // Apply question limit
    if (questionLimit && questionLimit > 0 && filteredQuestions.length > questionLimit) {
        filteredQuestions = filteredQuestions.slice(0, questionLimit);
    }
    
    // Get required groups for the filtered questions
    const groupIds = new Set(filteredQuestions.filter(q => q.group_id).map(q => q.group_id));
    const filteredGroups = allGroups.filter(g => groupIds.has(g.group_id));
    
    return {
        questions: filteredQuestions,
        groups: filteredGroups
    };
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
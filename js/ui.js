// js/ui.js - DOM manipulation and UI update functions
import { getElement, querySelector, querySelectorAll, initializeElements, initializeElementsBySelector } from './dom.js';

export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        // console.warn("escapeHtml called with non-string value:", unsafe);
        return String(unsafe); // Convert to string to prevent errors, or handle as error
    }
    return unsafe
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, '"')
            .replace(/'/g, "'");
}

export function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Sidebar elements definition
const sidebarElements = {
    sidebar: 'settings-sidebar',
    toggleButton: 'sidebar-toggle-button'
};

// Lazy initialization for sidebar elements
let sidebarElementsCache = null;

// Function to get sidebar elements, initializing them if needed
function getSidebarElements() {
    if (!sidebarElementsCache) {
        sidebarElementsCache = initializeElements(sidebarElements);
    }
    return sidebarElementsCache;
}

export function toggleSidebar() {
    const sidebar = getSidebarElements();
    // Check if elements exist before accessing them
    if (!sidebar.sidebar || !sidebar.toggleButton) {
        console.warn("Sidebar elements not found. Make sure HTML fragments are loaded.");
        return;
    }
    
    const isOpen = sidebar.sidebar.classList.contains('open');
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

export function openSidebar() {
    const sidebar = getSidebarElements();
    // Check if elements exist before accessing them
    if (!sidebar.sidebar || !sidebar.toggleButton) {
        console.warn("Sidebar elements not found. Make sure HTML fragments are loaded.");
        return;
    }
    
    sidebar.sidebar.classList.add('open');
    document.body.classList.add('sidebar-open');
    sidebar.toggleButton.setAttribute('aria-expanded', 'true');
    sidebar.toggleButton.innerHTML = '×';
}

export function closeSidebar() {
    const sidebar = getSidebarElements();
    // Check if elements exist before accessing them
    if (!sidebar.sidebar || !sidebar.toggleButton) {
        console.warn("Sidebar elements not found. Make sure HTML fragments are loaded.");
        return;
    }
    
    sidebar.sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
    sidebar.toggleButton.setAttribute('aria-expanded', 'false');
    sidebar.toggleButton.innerHTML = '☰';
}

export function populateCheckboxList(container, items) {
    container.innerHTML = ''; // Clear previous options
    if (!items || items.length === 0) {
        container.innerHTML = '<p>No items available for this filter.</p>';
        return;
    }
    items.forEach(item => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item;
        // Generate a somewhat unique name for checkbox groups if needed, or use a common one
        checkbox.name = container.id.replace('-list', ''); // e.g., 'filter-categories'
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${escapeHtml(String(item))}`)); // Ensure item is string and escaped
        container.appendChild(label);
    });
}

export function clearCheckboxes(container) {
    // Use the container's querySelectorAll directly since we have the container reference
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// HTML fragment containers
const fragmentContainers = {
    sidebarContainer: 'sidebar-container',
    modalsContainer: 'modals-container',
    quizAreaContainer: 'quiz-area-container'
};

// Function to load HTML fragments
export async function loadHtmlFragments() {
    // Initialize all fragment containers at once
    const containers = initializeElements(fragmentContainers);
    
    const loadFragment = async (fragmentPath, container) => {
        try {
            const response = await fetch(fragmentPath);
            if (!response.ok) throw new Error(`Failed to load ${fragmentPath}: ${response.status} ${response.statusText}`);
            const html = await response.text();
            if (container) {
                container.innerHTML = html;
            } else {
                console.warn(`Container not found for ${fragmentPath}.`);
            }
        } catch (error) {
            console.error(`Error loading HTML fragment ${fragmentPath}: ${error}`);
        }
    };

    // Load HTML fragments into their respective containers
    await loadFragment('html/sidebar.html', containers.sidebarContainer);
    await loadFragment('html/modals.html', containers.modalsContainer);
    await loadFragment('html/quiz_area.html', containers.quizAreaContainer);
    
    // Reset sidebar elements cache since we've just loaded new HTML
    sidebarElementsCache = null;
    
    // Set up sidebar toggle button event listener
    setupSidebarEventListeners();
    
    // Log that fragments have been loaded
    console.log("HTML fragments loaded successfully");
}

// Function to set up sidebar event listeners
function setupSidebarEventListeners() {
    try {
        const sidebar = getSidebarElements();
        
        if (sidebar.toggleButton) {
            console.log("Setting up sidebar toggle button event listener");
            sidebar.toggleButton.addEventListener('click', toggleSidebar);
        }
        
        if (sidebar.sidebar && sidebar.sidebar.querySelector('#close-sidebar-button')) {
            console.log("Setting up close sidebar button event listener");
            sidebar.sidebar.querySelector('#close-sidebar-button').addEventListener('click', closeSidebar);
        }
    } catch (error) {
        console.error("Error setting up sidebar event listeners:", error);
    }
}

export function populateCategorySubcategoryFilter(container, categoriesWithSubcategories) {
    if (!container) {
        console.error("Container element not provided for populateCategorySubcategoryFilter.");
        return;
    }
    if (!categoriesWithSubcategories || Object.keys(categoriesWithSubcategories).length === 0) {
        container.innerHTML = '<p>No categories available.</p>';
        return;
    }

    container.innerHTML = ''; // Clear previous options

    Object.entries(categoriesWithSubcategories).forEach(([category, subcategories]) => {
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'category-filter-item';

        const mainCategoryLine = document.createElement('div');
        mainCategoryLine.className = 'main-category-line';

        const categoryCheckbox = document.createElement('input');
        categoryCheckbox.type = 'checkbox';
        categoryCheckbox.value = category;
        categoryCheckbox.name = 'filter-main-category'; // Group main category checkboxes
        // Sanitize category name for ID: replace spaces and special characters
        const sanitizedCategoryId = category.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        categoryCheckbox.id = `main-cat-${sanitizedCategoryId}`;

        const categoryLabel = document.createElement('label');
        categoryLabel.htmlFor = categoryCheckbox.id;
        // categoryLabel.textContent = ` ${escapeHtml(category)}`; // Text next to checkbox

        const categoryLabelText = document.createElement('span');
        categoryLabelText.textContent = ` ${escapeHtml(category)}`;
        categoryLabel.appendChild(categoryLabelText);


        const toggleButton = document.createElement('span');
        toggleButton.className = 'subcategory-toggle';
        toggleButton.textContent = '[+]';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.marginLeft = '5px';
        toggleButton.setAttribute('aria-label', `Toggle subcategories for ${escapeHtml(category)}`);

        mainCategoryLine.appendChild(categoryCheckbox);
        mainCategoryLine.appendChild(categoryLabel); // Label contains the text span now
        mainCategoryLine.appendChild(toggleButton);
        categoryWrapper.appendChild(mainCategoryLine);

        const subcategoryList = document.createElement('ul');
        subcategoryList.className = 'subcategory-list';
        subcategoryList.style.display = 'none'; // Hidden by default
        subcategoryList.style.marginLeft = '20px'; // Indent subcategories
        subcategoryList.setAttribute('aria-labelledby', categoryCheckbox.id);


        if (subcategories && subcategories.length > 0) {
            subcategories.forEach(subcategory => {
                const subItem = document.createElement('li');
                const subCheckbox = document.createElement('input');
                subCheckbox.type = 'checkbox';
                subCheckbox.value = subcategory;
                 // Sanitize subcategory and category names for name attribute
                const sanitizedSubcategoryName = subcategory.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
                subCheckbox.name = `filter-subcategory-${sanitizedCategoryId}`; // Unique name per parent
                subCheckbox.dataset.parentCategory = category;
                subCheckbox.id = `sub-cat-${sanitizedCategoryId}-${sanitizedSubcategoryName}`;


                const subLabel = document.createElement('label');
                subLabel.htmlFor = subCheckbox.id;
                // subLabel.appendChild(subCheckbox); // Checkbox inside label for better click handling
                // subLabel.appendChild(document.createTextNode(` ${escapeHtml(subcategory)}`));

                // Append checkbox first, then text node for spacing
                subLabel.appendChild(subCheckbox);
                subLabel.appendChild(document.createTextNode(' ')); // Add space
                subLabel.appendChild(document.createTextNode(escapeHtml(subcategory)));


                subItem.appendChild(subLabel);
                subcategoryList.appendChild(subItem);
            });
        } else {
            const noSubItem = document.createElement('li');
            noSubItem.textContent = 'No subcategories';
            noSubItem.style.fontStyle = 'italic';
            subcategoryList.appendChild(noSubItem);
        }
        categoryWrapper.appendChild(subcategoryList);
        container.appendChild(categoryWrapper);

        toggleButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default action if wrapped in something clickable
            const isHidden = subcategoryList.style.display === 'none';
            subcategoryList.style.display = isHidden ? 'block' : 'none';
            toggleButton.textContent = isHidden ? '[-]' : '[+]';
            toggleButton.setAttribute('aria-expanded', String(isHidden));
        });

        // Optional: Clicking main category label also toggles subcategories
        // categoryLabelText.addEventListener('click', (e) => {
        //     // Avoid interfering with checkbox click
        //     if (e.target !== categoryCheckbox) {
        //        e.preventDefault();
        //        toggleButton.click(); // Simulate click on the toggle button
        //     }
        // });
    });
}

// js/ui.js - DOM manipulation and UI update functions

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

export function toggleSidebar() {
    const sidebarElement = document.getElementById('settings-sidebar');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
    const isOpen = sidebarElement.classList.contains('open');
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

export function openSidebar() {
    const sidebarElement = document.getElementById('settings-sidebar');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
    sidebarElement.classList.add('open');
    document.body.classList.add('sidebar-open');
    sidebarToggleButton.setAttribute('aria-expanded', 'true');
    sidebarToggleButton.innerHTML = '×';
}

export function closeSidebar() {
    const sidebarElement = document.getElementById('settings-sidebar');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
    sidebarElement.classList.remove('open');
    document.body.classList.remove('sidebar-open');
    sidebarToggleButton.setAttribute('aria-expanded', 'false');
    sidebarToggleButton.innerHTML = '☰';
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
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Function to load HTML fragments
export async function loadHtmlFragments() {
    const loadFragment = async (fragmentPath, placeholderId) => {
        try {
            const response = await fetch(fragmentPath);
            if (!response.ok) throw new Error(`Failed to load ${fragmentPath}: ${response.status} ${response.statusText}`);
            const html = await response.text();
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.innerHTML = html;
            } else {
                console.warn(`Placeholder ${placeholderId} not found for ${fragmentPath}.`);
            }
        } catch (error) {
            console.error(`Error loading HTML fragment ${fragmentPath}: ${error}`);
        }
    };

    // IMPORTANT: The actual HTML extraction and placeholder DIV creation in index.html
    // needs to be done carefully. This script assumes placeholders with these IDs exist.
    // The original HTML content should be REMOVED from index.html and replaced by these placeholders.

    // Example: Load sidebar into <div id="settings-sidebar-placeholder"></div>
    // The ID 'settings-sidebar' is used here because the original div has this ID.
    // If the plan is to replace the *entire* div, then the placeholder should be outside it,
    // or the function should replace the placeholder div itself.
    // For now,innerHTML is used, meaning the placeholder div should be empty.
    await loadFragment('html/sidebar.html', 'settings-sidebar');

    // Assuming a new placeholder div for all modals, e.g., <div id="modals-placeholder"></div>
    await loadFragment('html/modals.html', 'modals-placeholder');

    // Assuming the existing <div id="quiz-area"></div> will be the container for its dynamic content
    await loadFragment('html/quiz_area.html', 'quiz-area');
}

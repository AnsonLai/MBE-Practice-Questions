// Simple script to fix the sidebar toggle issue
document.addEventListener('DOMContentLoaded', function() {
    // Wait for a moment to ensure all HTML fragments are loaded
    setTimeout(function() {
        // Get all sidebar toggle buttons (there might be duplicates)
        const toggleButtons = document.querySelectorAll('#sidebar-toggle-button');
        
        // If there are multiple toggle buttons, keep only the first one
        if (toggleButtons.length > 1) {
            console.log('Found multiple sidebar toggle buttons. Keeping only the first one.');
            for (let i = 1; i < toggleButtons.length; i++) {
                toggleButtons[i].remove();
            }
        }
        
        // Make sure the remaining button has the correct event listener
        const toggleButton = document.querySelector('#sidebar-toggle-button');
        if (toggleButton) {
            // Remove any existing event listeners (not perfect but helps)
            const newToggleButton = toggleButton.cloneNode(true);
            toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);
            
            // Add the event listener
            newToggleButton.addEventListener('click', function() {
                const sidebar = document.getElementById('settings-sidebar');
                if (sidebar) {
                    const isOpen = sidebar.classList.contains('open');
                    if (isOpen) {
                        sidebar.classList.remove('open');
                        document.body.classList.remove('sidebar-open');
                        this.setAttribute('aria-expanded', 'false');
                        this.innerHTML = '☰';
                    } else {
                        sidebar.classList.add('open');
                        document.body.classList.add('sidebar-open');
                        this.setAttribute('aria-expanded', 'true');
                        this.innerHTML = '×';
                    }
                }
            });
        }
    }, 500); // Wait 500ms for everything to load
});
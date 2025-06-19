// js/fileControls.js - Handles the file loading/exporting controls

/**
 * Updates the visibility of file controls based on whether quiz data is available
 * Moves the controls from the front page to the sidebar when quiz data is available
 */
export function updateFileControlsVisibility() {
    // Get references to the file control elements
    const initialFileControls = document.getElementById('initial-file-controls');
    const sidebarDataControls = document.getElementById('sidebar-data-controls');
    
    // Check if quiz data is available in the database
    import('./db.js').then(({ db }) => {
        db.questions.count().then(count => {
            if (count > 0) {
                // Quiz data is available, hide initial controls
                if (initialFileControls) initialFileControls.style.display = 'none';
            } else {
                // No quiz data available, show initial controls
                if (initialFileControls) initialFileControls.style.display = 'block';
            }
            
            // Always show sidebar data controls
            if (sidebarDataControls) sidebarDataControls.style.display = 'block';
        });
    });
}

/**
 * Initializes the file controls by setting up event listeners
 * and ensuring the controls are in the correct location based on data availability
 */
export function initializeFileControls() {
    // Get references to all file control elements
    const initialJsonFile = document.getElementById('jsonFile');
    const initialLoadJsonButton = document.getElementById('loadJsonButton');
    const initialLoadSampleButton = document.getElementById('loadSampleButton');
    const initialSaveJsonButton = document.getElementById('saveJsonButton');
    
    const sidebarJsonFile = document.getElementById('sidebar-jsonFile');
    const sidebarLoadJsonButton = document.getElementById('sidebar-loadJsonButton');
    const sidebarLoadSampleButton = document.getElementById('sidebar-loadSampleButton');
    const sidebarSaveJsonButton = document.getElementById('sidebar-data-controls')?.querySelector('#saveJsonButton');
    
    // Update visibility based on data availability
    updateFileControlsVisibility();
    
    // Set up event listeners for the file controls in both locations
    // These will be set up regardless of visibility to ensure they work when controls are shown
    
    // Helper function to handle file loading
    const handleFileLoad = (fileInput) => {
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Please select a file first.');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Import the db module and process the data
                import('./db.js').then(({ processAndStoreQuizData }) => {
                    processAndStoreQuizData(jsonData).then(() => {
                        alert('Quiz data loaded successfully!');
                        // Update controls visibility after loading data
                        updateFileControlsVisibility();
                        // Reload the page to apply changes
                        window.location.reload();
                    });
                });
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    // Helper function to handle sample data loading
    const handleSampleLoad = () => {
        fetch('sample-questions.json')
            .then(response => response.json())
            .then(data => {
                // Import the db module and process the data
                import('./db.js').then(({ processAndStoreQuizData }) => {
                    processAndStoreQuizData(data).then(() => {
                        alert('Sample quiz data loaded successfully!');
                        // Update controls visibility after loading data
                        updateFileControlsVisibility();
                        // Reload the page to apply changes
                        window.location.reload();
                    });
                });
            })
            .catch(error => {
                alert('Error loading sample data: ' + error.message);
            });
    };
    
    // Helper function to handle data export
    const handleDataExport = () => {
        // Import the db module and export the data
        import('./db.js').then(({ exportQuizData }) => {
            exportQuizData().then(data => {
                const dataStr = JSON.stringify(data, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = 'quiz_data_backup.json';
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            });
        });
    };
    
    // Set up event listeners for initial file controls
    if (initialLoadJsonButton) {
        initialLoadJsonButton.addEventListener('click', () => handleFileLoad(initialJsonFile));
    }
    
    if (initialLoadSampleButton) {
        initialLoadSampleButton.addEventListener('click', handleSampleLoad);
    }
    
    if (initialSaveJsonButton) {
        initialSaveJsonButton.addEventListener('click', handleDataExport);
    }
    
    // Set up event listeners for sidebar file controls
    if (sidebarLoadJsonButton) {
        sidebarLoadJsonButton.addEventListener('click', () => handleFileLoad(sidebarJsonFile));
    }
    
    if (sidebarLoadSampleButton) {
        sidebarLoadSampleButton.addEventListener('click', handleSampleLoad);
    }
    
    if (sidebarSaveJsonButton) {
        sidebarSaveJsonButton.addEventListener('click', handleDataExport);
    }
}
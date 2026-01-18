// State management
const state = {
    imageData: null,
    imageFile: null,
    equipment: null,
    currentCoffeeAnalysis: null,
    currentBrewMethod: null,
    currentRecipe: null
};

// DOM elements
const elements = {
    uploadSection: document.getElementById('upload-section'),
    previewSection: document.getElementById('preview-section'),
    loadingSection: document.getElementById('loading-section'),
    resultsSection: document.getElementById('results-section'),
    errorSection: document.getElementById('error-section'),
    settingsSection: document.getElementById('settings-section'),

    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    cameraBtn: document.getElementById('camera-btn'),
    uploadBtn: document.getElementById('upload-btn'),

    previewImage: document.getElementById('preview-image'),
    removeImageBtn: document.getElementById('remove-image'),

    analyzeBtn: document.getElementById('analyze-btn'),

    analysisContent: document.getElementById('analysis-content'),
    methodContent: document.getElementById('method-content'),

    tryAgainBtn: document.getElementById('try-again-btn'),
    retryBtn: document.getElementById('retry-btn'),
    errorMessage: document.getElementById('error-message'),

    // Alternative brew method elements
    altBrewMethodSelect: document.getElementById('alt-brew-method'),
    altBrewBtn: document.getElementById('alt-brew-btn'),

    // Settings elements
    settingsToggleBtn: document.getElementById('settings-toggle-btn'),
    equipmentForm: document.getElementById('equipment-form'),
    clearEquipmentBtn: document.getElementById('clear-equipment-btn'),
    equipmentSummary: document.getElementById('equipment-summary'),
    equipmentSummaryContent: document.getElementById('equipment-summary-content'),
    equipmentFormContainer: document.getElementById('equipment-form-container'),
    editEquipmentBtn: document.getElementById('edit-equipment-btn'),

    // Auth elements
    authModal: document.getElementById('auth-modal'),
    authForm: document.getElementById('auth-form'),
    authUsername: document.getElementById('auth-username'),
    usernameGroup: document.getElementById('username-group'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    authError: document.getElementById('auth-error'),
    authSkipBtn: document.getElementById('auth-skip-btn'),
    tabSignin: document.getElementById('tab-signin'),
    tabSignup: document.getElementById('tab-signup'),
    userProfile: document.getElementById('user-profile'),
    userEmailDisplay: document.getElementById('user-email-display'),
    userMenuBtn: document.getElementById('user-menu-btn'),
    userDropdown: document.getElementById('user-dropdown'),
    logoutBtn: document.getElementById('logout-btn'),

    // Rating slider elements
    ratingSection: document.getElementById('rating-section'),
    tasteRating: document.getElementById('taste-rating'),
    ratingLabel: document.getElementById('rating-label'),
    adjustRecipeBtn: document.getElementById('adjust-recipe-btn'),
    adjustmentFeedback: document.getElementById('adjustment-feedback'),
    saveRecipeBtn: document.getElementById('save-recipe-btn')
};

// Initialize app
async function init() {
    setupEventListeners();

    console.log('=== App Initialization Started ===');

    // Initialize Supabase and Auth
    const supabaseConfigured = await window.initSupabase();
    console.log('Supabase configured:', supabaseConfigured);

    if (supabaseConfigured) {
        // Initialize auth
        const isAuthenticated = await window.auth.init();
        console.log('User authenticated:', isAuthenticated);

        if (isAuthenticated) {
            // User is logged in - load from database
            await loadEquipmentFromDatabase();
            showUserProfile();
        } else {
            // Try loading from localStorage first (migration path)
            loadEquipment();

            // Show auth modal on first visit (unless user has skipped before)
            const hasSkipped = localStorage.getItem('auth_skipped');
            console.log('Auth previously skipped:', hasSkipped);

            if (!hasSkipped) {
                console.log('Showing auth modal for first-time user');
                showAuthModal();
            } else {
                console.log('User previously skipped auth - using localStorage only');
            }
        }

        // Listen for auth state changes
        window.auth.onAuthStateChange(handleAuthStateChange);
    } else {
        // Supabase not configured - use localStorage only
        console.log('⚠️ Running in DEMO MODE - Supabase not configured');
        console.log('Equipment will only be saved in browser localStorage (not synced across devices)');

        loadEquipment();

        // Check if equipment was loaded
        if (!state.equipment || !hasEquipment()) {
            console.log('No equipment found - user needs to add equipment via settings');
        }
    }

    console.log('=== App Initialization Complete ===');

    // Update equipment button to show correct state
    updateEquipmentButton();
}

// Handle auth state changes
function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN') {
        hideAuthModal();
        showUserProfile();
        migrateLocalStorageToDatabase();
        loadEquipmentFromDatabase();
    } else if (event === 'SIGNED_OUT') {
        hideUserProfile();
        // Optionally show auth modal again
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Upload area click
    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // Drag and drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    // File input change
    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });

    // Camera button
    elements.cameraBtn.addEventListener('click', () => {
        elements.fileInput.setAttribute('capture', 'environment');
        elements.fileInput.click();
    });

    // Upload button
    elements.uploadBtn.addEventListener('click', () => {
        elements.fileInput.removeAttribute('capture');
        elements.fileInput.click();
    });

    // Remove image
    elements.removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetApp();
    });

    // Analyze button
    elements.analyzeBtn.addEventListener('click', analyzeImage);

    // Try again / Retry buttons
    elements.tryAgainBtn.addEventListener('click', resetApp);
    elements.retryBtn.addEventListener('click', () => {
        showSection('preview');
    });

    // Settings toggle
    elements.settingsToggleBtn.addEventListener('click', () => {
        const isHidden = elements.settingsSection.classList.contains('hidden');
        elements.settingsSection.classList.toggle('hidden');

        if (isHidden) {
            // Opening settings - show summary if equipment exists, otherwise show form
            console.log('Opening equipment settings...');
            updateEquipmentDisplay();
        }
    });

    // Edit equipment button
    elements.editEquipmentBtn.addEventListener('click', () => {
        showEquipmentForm();
    });

    // Equipment form submit
    elements.equipmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEquipment();
    });

    // Clear equipment
    elements.clearEquipmentBtn.addEventListener('click', () => {
        clearEquipment();
    });

    // Auth event listeners
    // Tab switching
    elements.tabSignin.addEventListener('click', () => {
        switchAuthTab('signin');
    });

    elements.tabSignup.addEventListener('click', () => {
        switchAuthTab('signup');
    });

    // Auth form submit
    elements.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAuthSubmit();
    });

    // Skip auth
    elements.authSkipBtn.addEventListener('click', () => {
        localStorage.setItem('auth_skipped', 'true');
        hideAuthModal();
    });

    // User menu toggle
    elements.userMenuBtn.addEventListener('click', () => {
        elements.userDropdown.classList.toggle('hidden');
    });

    // Logout
    elements.logoutBtn.addEventListener('click', async () => {
        await handleLogout();
    });

    // Alternative brew method dropdown
    elements.altBrewMethodSelect.addEventListener('change', () => {
        const method = elements.altBrewMethodSelect.value;
        elements.altBrewBtn.disabled = !method;
    });

    // Alternative brew method button
    elements.altBrewBtn.addEventListener('click', () => {
        const method = elements.altBrewMethodSelect.value;
        if (method) {
            analyzeWithSpecificMethod(method);
        }
    });

    // Rating slider
    elements.tasteRating.addEventListener('input', (e) => {
        const rating = parseFloat(e.target.value);
        updateRatingLabel(rating);

        // Show adjust button if not perfect, show save button if perfect
        if (rating === 0) {
            elements.adjustRecipeBtn.disabled = true;
            elements.saveRecipeBtn.classList.remove('hidden');
        } else {
            elements.adjustRecipeBtn.disabled = false;
            elements.saveRecipeBtn.classList.add('hidden');
        }
    });

    // Adjust recipe button
    elements.adjustRecipeBtn.addEventListener('click', async () => {
        const rating = parseFloat(elements.tasteRating.value);
        await adjustRecipeBasedOnRating(rating);
    });

    // Save recipe button
    elements.saveRecipeBtn.addEventListener('click', async () => {
        const rating = parseFloat(elements.tasteRating.value);
        await saveBrewSession(rating);
    });
}

// Handle image upload
function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please upload a valid image file.');
        return;
    }

    state.imageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        state.imageData = e.target.result;
        elements.previewImage.src = state.imageData;
        showSection('preview');
    };
    reader.readAsDataURL(file);
}

// Show specific section
function showSection(section) {
    elements.uploadSection.classList.add('hidden');
    elements.previewSection.classList.add('hidden');
    elements.loadingSection.classList.add('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');

    switch(section) {
        case 'upload':
            elements.uploadSection.classList.remove('hidden');
            break;
        case 'preview':
            elements.previewSection.classList.remove('hidden');
            break;
        case 'loading':
            elements.loadingSection.classList.remove('hidden');
            break;
        case 'results':
            elements.resultsSection.classList.remove('hidden');
            break;
        case 'error':
            elements.errorSection.classList.remove('hidden');
            break;
    }
}

// Convert image to base64 without data URL prefix
async function getBase64Image(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = e.target.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Analyze image using backend serverless function
async function analyzeImage(specificMethod = null) {
    if (!state.imageFile) {
        showError('Please upload an image first.');
        return;
    }

    showSection('loading');

    try {
        const base64Image = await getBase64Image(state.imageFile);
        const mediaType = state.imageFile.type;

        const equipmentDescription = getEquipmentDescription();

        const requestBody = {
            image: base64Image,
            mediaType: mediaType,
            equipment: equipmentDescription
        };

        // Add specific method if provided
        if (specificMethod) {
            requestBody.specificMethod = specificMethod;
        }

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const analysisText = data.content[0].text;

        // Parse the JSON response
        let analysisData;
        try {
            // Extract JSON from the response (might be wrapped in markdown code blocks)
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            // If JSON parsing fails, create a fallback structure
            analysisData = parseFallbackResponse(analysisText);
        }

        displayResults(analysisData);
        showSection('results');

    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Failed to analyze image: ${error.message}`);
    }
}

// Analyze with a specific brew method
async function analyzeWithSpecificMethod(method) {
    await analyzeImage(method);
}

// Parse fallback response if JSON parsing fails
function parseFallbackResponse(text) {
    return {
        coffee_analysis: {
            name: "Unable to parse details",
            roaster: "See analysis below",
            roast_level: "Unknown",
            origin: "Unknown",
            flavor_notes: [],
            bean_type: "Unknown",
            processing: "Unknown"
        },
        recommended_brew_method: {
            primary_method: "Pour Over",
            reasoning: text.substring(0, 200) + '...',
            alternative_methods: ["French Press", "Drip Coffee"]
        },
        brew_recipe: {
            coffee_amount: "20g",
            water_amount: "320ml",
            ratio: "1:16",
            water_temperature: "195-205°F (90-96°C)",
            grind_size: "Medium",
            brew_time: "3-4 minutes",
            instructions: [
                "Heat water to appropriate temperature",
                "Grind coffee to medium consistency",
                "Brew according to your chosen method",
                "Enjoy!"
            ]
        },
        raw_response: text
    };
}

// Get image URL for brew method
function getBrewMethodImage(techniqueName) {
    const technique = techniqueName.toLowerCase();

    // Map technique names to specific brew method images
    if (technique.includes('turbo')) {
        // Espresso shot - turbo shot
        return 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('lungo')) {
        // Lungo - longer espresso
        return 'https://images.unsplash.com/photo-1534687920214-dcab4b5da211?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('espresso')) {
        // Traditional espresso shot
        return 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('latte')) {
        // Latte with art in cup
        return 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('v60')) {
        // V60 pour over
        return 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('pour over')) {
        // Generic pour over
        return 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('chemex')) {
        // Chemex brewer
        return 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('french press')) {
        // French press
        return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('aeropress')) {
        // Aeropress
        return 'https://images.unsplash.com/photo-1611564154665-e64f686e0d3d?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('moka')) {
        // Moka pot
        return 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop&q=80';
    } else if (technique.includes('oxo') || technique.includes('soup')) {
        // Oxo/single cup brewer
        return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop&q=80';
    } else {
        // Default coffee cup image
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&q=80';
    }
}

// Display results
function displayResults(data) {
    const analysis = data.coffee_analysis;
    const techniques = data.recommended_techniques || [];

    // Save to state for rating adjustments
    state.currentCoffeeAnalysis = analysis;
    state.currentBrewMethod = techniques[0]?.technique_name || 'Unknown';
    state.currentRecipe = data;

    // Coffee Analysis
    let analysisHTML = '<div class="analysis-details">';

    if (analysis.name) {
        analysisHTML += `<p><strong>Coffee:</strong> ${analysis.name}</p>`;
    }
    if (analysis.roaster) {
        analysisHTML += `<p><strong>Roaster:</strong> ${analysis.roaster}</p>`;
    }
    if (analysis.roast_level) {
        analysisHTML += `<p><strong>Roast Level:</strong> ${analysis.roast_level}</p>`;
    }
    if (analysis.origin) {
        analysisHTML += `<p><strong>Origin:</strong> ${analysis.origin}</p>`;
    }
    if (analysis.processing) {
        analysisHTML += `<p><strong>Processing:</strong> ${analysis.processing}</p>`;
    }
    if (analysis.flavor_notes && analysis.flavor_notes.length > 0) {
        analysisHTML += `<p><strong>Flavor Notes:</strong> ${analysis.flavor_notes.join(', ')}</p>`;
    }

    analysisHTML += '</div>';
    elements.analysisContent.innerHTML = analysisHTML;

    // Brew Techniques with Tables
    let techniquesHTML = '';

    techniques.forEach((technique, index) => {
        const params = technique.parameters;
        const imageUrl = getBrewMethodImage(technique.technique_name);

        techniquesHTML += `
            <div class="technique-container">
                <div class="technique-content">
                    <div class="technique-header">
                        <h4><span class="technique-number">#${index + 1}</span>${technique.technique_name}</h4>
                    </div>

                    <p style="margin-bottom: 15px; line-height: 1.6;">${technique.reasoning}</p>

                    <table class="brew-parameters-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Dose</td>
                        <td>${params.dose}</td>
                    </tr>
                    <tr>
                        <td>Yield</td>
                        <td>${params.yield}</td>
                    </tr>
                    <tr>
                        <td>Ratio</td>
                        <td>${params.ratio}</td>
                    </tr>
                    <tr>
                        <td>Water Temp</td>
                        <td>${params.water_temp}</td>
                    </tr>
                    <tr>
                        <td>Grind Size</td>
                        <td>${params.grind_size}</td>
                    </tr>
                    <tr>
                        <td>Brew Time</td>
                        <td>${params.brew_time}</td>
                    </tr>
                    <tr>
                        <td>Pressure</td>
                        <td>${params.pressure}</td>
                    </tr>
                    <tr>
                        <td>Flow Control</td>
                        <td>${params.flow_control}</td>
                    </tr>
                </tbody>
            </table>

            ${technique.technique_notes ? `<div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-left: 3px solid var(--accent-color); border-radius: 4px;">
                <p style="margin: 0; line-height: 1.6; color: var(--secondary-color);">${technique.technique_notes}</p>
            </div>` : ''}
                </div>

                <div class="technique-image">
                    <img src="${imageUrl}" alt="${technique.technique_name}" loading="lazy" />
                </div>
            </div>
        `;
    });

    elements.methodContent.innerHTML = techniquesHTML;

    // If there's a raw response (fallback), show it
    if (data.raw_response) {
        elements.analysisContent.innerHTML += `
            <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <p><strong>Full Analysis:</strong></p>
                <p style="white-space: pre-wrap; font-size: 0.9rem; margin-top: 10px;">${data.raw_response}</p>
            </div>
        `;
    }
}

// Show error
function showError(message) {
    elements.errorMessage.textContent = message;
    showSection('error');
}

// Reset app
function resetApp() {
    state.imageData = null;
    state.imageFile = null;
    elements.fileInput.value = '';
    elements.previewImage.src = '';
    showSection('upload');
}

// Equipment management functions
async function saveEquipment() {
    const equipment = {
        espressoMachine: document.getElementById('espresso-machine').value.trim(),
        flowControl: document.getElementById('flow-control').checked,
        grinder: document.getElementById('grinder').value.trim(),
        pourOver: Array.from(document.querySelectorAll('input[name="pour-over"]:checked')).map(cb => cb.value),
        otherMethods: Array.from(document.querySelectorAll('input[name="other-methods"]:checked')).map(cb => cb.value),
        additionalEquipment: document.getElementById('additional-equipment').value.trim()
    };

    // Save to localStorage (always, as backup)
    try {
        localStorage.setItem('coffee_equipment', JSON.stringify(equipment));
        state.equipment = equipment;

        // If user is authenticated, also save to database
        if (window.auth && window.auth.isAuthenticated()) {
            await saveEquipmentToDatabase(equipment);
        }

        // Show success feedback
        const saveBtn = elements.equipmentForm.querySelector('button[type="submit"]');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.backgroundColor = 'var(--success-color)';

        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.backgroundColor = '';
            showEquipmentSummary();
            updateEquipmentButton();
        }, 1500);
    } catch (e) {
        console.error('Failed to save equipment:', e);
        showError('Failed to save equipment preferences');
    }
}

function loadEquipment() {
    try {
        const savedEquipment = localStorage.getItem('coffee_equipment');
        console.log('Loading equipment from localStorage:', savedEquipment);

        if (savedEquipment) {
            const equipment = JSON.parse(savedEquipment);
            state.equipment = equipment;
            console.log('✓ Parsed equipment object:', equipment);

            // Check if equipment is actually empty (all fields blank)
            const actuallyHasEquipment = !!(
                (equipment.espressoMachine && equipment.espressoMachine.trim()) ||
                (equipment.grinder && equipment.grinder.trim()) ||
                (equipment.pourOver && equipment.pourOver.length > 0) ||
                (equipment.otherMethods && equipment.otherMethods.length > 0) ||
                (equipment.additionalEquipment && equipment.additionalEquipment.trim())
            );

            if (!actuallyHasEquipment) {
                console.log('⚠️ Equipment object exists but all fields are empty - clearing');
                localStorage.removeItem('coffee_equipment');
                state.equipment = null;
            } else {
                console.log('✓ Equipment has data - loading into form');

                // Populate form fields
                if (equipment.espressoMachine) {
                    document.getElementById('espresso-machine').value = equipment.espressoMachine;
                }
                if (equipment.flowControl) {
                    document.getElementById('flow-control').checked = true;
                }
                if (equipment.grinder) {
                    document.getElementById('grinder').value = equipment.grinder;
                }
                if (equipment.additionalEquipment) {
                    document.getElementById('additional-equipment').value = equipment.additionalEquipment;
                }

                // Check appropriate checkboxes
                equipment.pourOver?.forEach(value => {
                    const checkbox = document.querySelector(`input[name="pour-over"][value="${value}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                equipment.otherMethods?.forEach(value => {
                    const checkbox = document.querySelector(`input[name="other-methods"][value="${value}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                // Show summary view if equipment is loaded
                showEquipmentSummary();
            }
        } else {
            console.log('⚠️ No saved equipment found in localStorage');
            console.log('→ Click "My Equipment" button to add your coffee gear');
            state.equipment = null;
        }
    } catch (e) {
        console.error('❌ Failed to load equipment:', e);
        state.equipment = null;
    }

    // Update the equipment button text
    updateEquipmentButton();
}

function clearEquipment() {
    if (confirm('Are you sure you want to clear all equipment preferences?')) {
        // Clear form
        document.getElementById('equipment-form').reset();

        // Clear localStorage
        localStorage.removeItem('coffee_equipment');
        state.equipment = null;

        // Show feedback
        const clearBtn = elements.clearEquipmentBtn;
        const originalText = clearBtn.textContent;
        clearBtn.textContent = '✓ Cleared!';

        setTimeout(() => {
            clearBtn.textContent = originalText;
            updateEquipmentButton();
        }, 1500);
    }
}

function getEquipmentDescription() {
    if (!state.equipment) return null;

    const parts = [];

    if (state.equipment.espressoMachine) {
        parts.push(`Espresso Machine: ${state.equipment.espressoMachine}${state.equipment.flowControl ? ' (with flow control)' : ''}`);
    }

    if (state.equipment.pourOver && state.equipment.pourOver.length > 0) {
        parts.push(`Pour Over: ${state.equipment.pourOver.join(', ')}`);
    }

    if (state.equipment.grinder) {
        parts.push(`Grinder: ${state.equipment.grinder}`);
    }

    if (state.equipment.otherMethods && state.equipment.otherMethods.length > 0) {
        parts.push(`Other Methods: ${state.equipment.otherMethods.join(', ')}`);
    }

    if (state.equipment.additionalEquipment) {
        parts.push(`Additional: ${state.equipment.additionalEquipment}`);
    }

    return parts.length > 0 ? parts.join('; ') : null;
}

function updateEquipmentDisplay() {
    console.log('updateEquipmentDisplay called');
    console.log('Current state.equipment:', state.equipment);

    if (state.equipment && hasEquipment()) {
        console.log('Showing equipment summary');
        showEquipmentSummary();
    } else {
        console.log('Showing equipment form (no equipment found)');
        showEquipmentForm();
    }
}

function hasEquipment() {
    if (!state.equipment) {
        console.log('hasEquipment: No equipment object in state');
        return false;
    }

    const hasAny = !!(
        (state.equipment.espressoMachine && state.equipment.espressoMachine.trim()) ||
        (state.equipment.grinder && state.equipment.grinder.trim()) ||
        (state.equipment.pourOver && state.equipment.pourOver.length > 0) ||
        (state.equipment.otherMethods && state.equipment.otherMethods.length > 0) ||
        (state.equipment.additionalEquipment && state.equipment.additionalEquipment.trim())
    );

    console.log('hasEquipment check:', hasAny, 'Equipment:', state.equipment);
    return hasAny;
}

function showEquipmentSummary() {
    console.log('showEquipmentSummary called with state.equipment:', state.equipment);
    elements.equipmentSummary.classList.remove('hidden');
    elements.equipmentFormContainer.classList.add('hidden');

    let summaryHTML = '';

    // Safety check
    if (!state.equipment) {
        console.log('No equipment in state, showing empty message');
        elements.equipmentSummaryContent.innerHTML = '<p style="color: var(--secondary-color);">No equipment saved yet.</p>';
        return;
    }

    if (state.equipment.espressoMachine) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Espresso Machine</strong>
                <span>${state.equipment.espressoMachine}${state.equipment.flowControl ? ' (with flow control)' : ''}</span>
            </div>
        `;
    }

    if (state.equipment.pourOver && state.equipment.pourOver.length > 0) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Pour Over Devices</strong>
                <span>${state.equipment.pourOver.join(', ')}</span>
            </div>
        `;
    }

    if (state.equipment.grinder) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Grinder</strong>
                <span>${state.equipment.grinder}</span>
            </div>
        `;
    }

    if (state.equipment.otherMethods && state.equipment.otherMethods.length > 0) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Other Brewing Methods</strong>
                <span>${state.equipment.otherMethods.join(', ')}</span>
            </div>
        `;
    }

    if (state.equipment.additionalEquipment) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Additional Equipment</strong>
                <span>${state.equipment.additionalEquipment}</span>
            </div>
        `;
    }

    // If no equipment was added to summary, show a message
    if (!summaryHTML) {
        summaryHTML = '<p style="color: var(--secondary-color);">No equipment saved yet.</p>';
    }

    console.log('Setting equipmentSummaryContent innerHTML to:', summaryHTML);
    elements.equipmentSummaryContent.innerHTML = summaryHTML;
    console.log('Equipment summary display updated');
}

function showEquipmentForm() {
    elements.equipmentSummary.classList.add('hidden');
    elements.equipmentFormContainer.classList.remove('hidden');
}

function updateEquipmentButton() {
    const hasEquipmentSaved = state.equipment && hasEquipment();

    console.log('updateEquipmentButton: hasEquipmentSaved =', hasEquipmentSaved);

    // Get the SVG element and preserve it
    const svg = elements.settingsToggleBtn.querySelector('svg');
    const svgHTML = svg ? svg.outerHTML : '';

    if (hasEquipmentSaved) {
        console.log('Setting button to "My Equipment"');
        elements.settingsToggleBtn.innerHTML = svgHTML + ' My Equipment';
    } else {
        console.log('Setting button to "Set Up Equipment ⚠️"');
        elements.settingsToggleBtn.innerHTML = svgHTML + ' Set Up Equipment ⚠️';
    }
}

// ========================================
// Authentication UI Functions
// ========================================

function showAuthModal() {
    elements.authModal.classList.remove('hidden');
}

function hideAuthModal() {
    elements.authModal.classList.add('hidden');
    elements.authError.classList.add('hidden');
    elements.authForm.reset();
}

function switchAuthTab(tab) {
    if (tab === 'signin') {
        elements.tabSignin.classList.add('active');
        elements.tabSignup.classList.remove('active');
        elements.authSubmitBtn.textContent = 'Sign In';
        document.getElementById('auth-title').textContent = 'Welcome Back';
        document.getElementById('auth-subtitle').textContent = 'Sign in to access your saved equipment and recipes';

        // Hide username field for sign in
        elements.usernameGroup.style.display = 'none';
        elements.authUsername.required = false;
    } else {
        elements.tabSignup.classList.add('active');
        elements.tabSignin.classList.remove('active');
        elements.authSubmitBtn.textContent = 'Sign Up';
        document.getElementById('auth-title').textContent = 'Create Account';
        document.getElementById('auth-subtitle').textContent = 'Sign up to save your equipment and recipes across devices';

        // Show username field for sign up
        elements.usernameGroup.style.display = 'block';
        elements.authUsername.required = true;
    }
}

async function handleAuthSubmit() {
    const email = elements.authEmail.value;
    const password = elements.authPassword.value;
    const isSignup = elements.tabSignup.classList.contains('active');

    try {
        elements.authSubmitBtn.disabled = true;
        elements.authSubmitBtn.textContent = isSignup ? 'Signing up...' : 'Signing in...';
        elements.authError.classList.add('hidden');

        if (isSignup) {
            const username = elements.authUsername.value.trim();

            // Validate username
            if (!username) {
                throw new Error('Username is required');
            }
            if (username.length < 3 || username.length > 20) {
                throw new Error('Username must be 3-20 characters');
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                throw new Error('Username can only contain letters, numbers, and underscores');
            }

            await window.auth.signUp(email, password, username);
        } else {
            await window.auth.signIn(email, password);
        }

        // Success - modal will be hidden by auth state change handler
    } catch (error) {
        elements.authError.textContent = error.message;
        elements.authError.classList.remove('hidden');
        elements.authSubmitBtn.disabled = false;
        elements.authSubmitBtn.textContent = isSignup ? 'Sign Up' : 'Sign In';
    }
}

async function handleLogout() {
    try {
        await window.auth.signOut();
        hideUserProfile();

        // Clear state but keep localStorage as backup
        state.equipment = null;

        // Optionally show auth modal again
        showAuthModal();
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to log out');
    }
}

async function showUserProfile() {
    const user = window.auth.getUser();
    if (user) {
        elements.userProfile.classList.remove('hidden');

        // Try to load username from profile
        const username = await loadUsername();
        elements.userEmailDisplay.textContent = username || user.email;
    }
}

async function loadUsername() {
    try {
        const supabase = window.getSupabase();
        const userId = window.auth.getUserId();

        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Failed to load username:', error);
            return null;
        }

        return data?.username || null;
    } catch (error) {
        console.error('Error loading username:', error);
        return null;
    }
}

function hideUserProfile() {
    elements.userProfile.classList.add('hidden');
    elements.userDropdown.classList.add('hidden');
}

// ========================================
// Database Functions
// ========================================

async function loadEquipmentFromDatabase() {
    const supabase = window.getSupabase();
    if (!supabase) return;

    const userId = window.auth.getUserId();
    if (!userId) return;

    try {
        const { data, error } = await supabase
            .from('equipment')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No equipment found - that's okay
                console.log('No equipment saved in database yet');
                return;
            }
            throw error;
        }

        if (data) {
            // Convert database format to app format
            state.equipment = {
                espressoMachine: data.espresso_machine || '',
                flowControl: data.flow_control || false,
                grinder: data.grinder || '',
                pourOver: data.pour_over || [],
                otherMethods: data.other_methods || [],
                additionalEquipment: data.additional_equipment || ''
            };

            // Populate the form
            if (state.equipment.espressoMachine) {
                document.getElementById('espresso-machine').value = state.equipment.espressoMachine;
            }
            if (state.equipment.flowControl) {
                document.getElementById('flow-control').checked = true;
            }
            if (state.equipment.grinder) {
                document.getElementById('grinder').value = state.equipment.grinder;
            }
            if (state.equipment.additionalEquipment) {
                document.getElementById('additional-equipment').value = state.equipment.additionalEquipment;
            }

            // Check boxes
            state.equipment.pourOver.forEach(value => {
                const checkbox = document.querySelector(`input[name="pour-over"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });

            state.equipment.otherMethods.forEach(value => {
                const checkbox = document.querySelector(`input[name="other-methods"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Show summary
            showEquipmentSummary();
            console.log('Equipment loaded from database');
        }
    } catch (error) {
        console.error('Failed to load equipment from database:', error);
    }

    // Update the equipment button text
    updateEquipmentButton();
}

async function saveEquipmentToDatabase(equipment) {
    const supabase = window.getSupabase();
    if (!supabase) return false;

    const userId = window.auth.getUserId();
    if (!userId) return false;

    try {
        // Convert app format to database format
        const dbEquipment = {
            user_id: userId,
            espresso_machine: equipment.espressoMachine,
            flow_control: equipment.flowControl,
            grinder: equipment.grinder,
            pour_over: equipment.pourOver,
            other_methods: equipment.otherMethods,
            additional_equipment: equipment.additionalEquipment,
            updated_at: new Date().toISOString()
        };

        // Try to update existing equipment first
        const { data: existing } = await supabase
            .from('equipment')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from('equipment')
                .update(dbEquipment)
                .eq('user_id', userId);

            if (error) throw error;
        } else {
            // Insert new
            const { error } = await supabase
                .from('equipment')
                .insert([dbEquipment]);

            if (error) throw error;
        }

        console.log('Equipment saved to database');
        return true;
    } catch (error) {
        console.error('Failed to save equipment to database:', error);
        return false;
    }
}

async function migrateLocalStorageToDatabase() {
    // Check if there's localStorage data to migrate
    const localData = localStorage.getItem('coffee_equipment');
    if (!localData) return;

    try {
        const equipment = JSON.parse(localData);
        const saved = await saveEquipmentToDatabase(equipment);

        if (saved) {
            console.log('Successfully migrated localStorage data to database');
            // Optionally clear localStorage after successful migration
            // localStorage.removeItem('coffee_equipment');
        }
    } catch (error) {
        console.error('Failed to migrate localStorage to database:', error);
    }
}

// Brew Session Tracking Functions
async function saveBrewSession(rating) {
    if (!window.auth || !window.auth.isAuthenticated()) {
        // Show message that they need to sign in to save
        elements.adjustmentFeedback.classList.remove('hidden');
        elements.adjustmentFeedback.querySelector('p').innerHTML =
            '⚠️ <a href="#" onclick="document.getElementById(\'auth-modal\').classList.remove(\'hidden\'); return false;">Sign in</a> to save your recipes across devices';
        return;
    }

    if (!state.currentCoffeeAnalysis || !state.currentRecipe) {
        console.error('No brew session to save');
        return;
    }

    const supabase = window.getSupabase();
    const userId = window.auth.getUserId();

    try {
        // Show loading state
        elements.saveRecipeBtn.disabled = true;
        elements.saveRecipeBtn.textContent = 'Saving...';

        const session = {
            user_id: userId,
            coffee_name: state.currentCoffeeAnalysis.name || 'Unknown',
            roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
            roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
            origin: state.currentCoffeeAnalysis.origin || 'Unknown',
            processing: state.currentCoffeeAnalysis.processing || 'Unknown',
            flavor_notes: state.currentCoffeeAnalysis.flavor_notes || [],
            brew_method: state.currentBrewMethod,
            original_recipe: state.currentRecipe,
            rating: rating === 0 ? 'perfect' : rating < 0 ? 'too_sour' : 'too_bitter'
        };

        const { error } = await supabase
            .from('brew_sessions')
            .insert([session]);

        if (error) throw error;

        // If rating is perfect, also save as preferred recipe
        if (rating === 0) {
            await saveAsPreferredRecipe();
        }

        // Show success feedback
        elements.adjustmentFeedback.classList.remove('hidden');
        elements.adjustmentFeedback.querySelector('p').textContent =
            '✓ Recipe saved! You can access it later from your brew history.';

        // Reset button
        elements.saveRecipeBtn.textContent = '✓ Saved!';
        setTimeout(() => {
            elements.saveRecipeBtn.classList.add('hidden');
            elements.saveRecipeBtn.textContent = '💾 Save This Recipe';
            elements.saveRecipeBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Failed to save brew session:', error);
        elements.adjustmentFeedback.classList.remove('hidden');
        elements.adjustmentFeedback.querySelector('p').textContent =
            '❌ Failed to save recipe. Please try again.';
        elements.saveRecipeBtn.textContent = '💾 Save This Recipe';
        elements.saveRecipeBtn.disabled = false;
    }
}

async function saveAsPreferredRecipe() {
    const supabase = window.getSupabase();
    const userId = window.auth.getUserId();

    // Create a hash from coffee characteristics
    const coffeeHash = createCoffeeHash(
        state.currentCoffeeAnalysis.name,
        state.currentCoffeeAnalysis.roaster,
        state.currentCoffeeAnalysis.roast_level,
        state.currentCoffeeAnalysis.origin
    );

    const preferredRecipe = {
        user_id: userId,
        coffee_hash: coffeeHash,
        coffee_name: state.currentCoffeeAnalysis.name || 'Unknown',
        roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
        brew_method: state.currentBrewMethod,
        recipe: state.currentRecipe,
        last_brewed: new Date().toISOString()
    };

    try {
        // Check if recipe already exists
        const { data: existing } = await supabase
            .from('saved_recipes')
            .select('id, times_brewed')
            .eq('user_id', userId)
            .eq('coffee_hash', coffeeHash)
            .eq('brew_method', state.currentBrewMethod)
            .single();

        if (existing) {
            // Update existing recipe
            const { error } = await supabase
                .from('saved_recipes')
                .update({
                    recipe: state.currentRecipe,
                    times_brewed: existing.times_brewed + 1,
                    last_brewed: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) throw error;
        } else {
            // Insert new preferred recipe
            const { error } = await supabase
                .from('saved_recipes')
                .insert([preferredRecipe]);

            if (error) throw error;
        }

        console.log('Saved as preferred recipe');
    } catch (error) {
        console.error('Failed to save preferred recipe:', error);
    }
}

function createCoffeeHash(name, roaster, roastLevel, origin) {
    // Simple hash function - concatenate and create a simple hash
    const str = `${name || ''}_${roaster || ''}_${roastLevel || ''}_${origin || ''}`.toLowerCase();
    return str.replace(/\s+/g, '_');
}

// Rating Slider Functions
function updateRatingLabel(value) {
    const rating = parseFloat(value);
    let label = '';

    if (rating === -2) {
        label = 'Very Sour 😖';
    } else if (rating === -1.5) {
        label = 'Quite Sour 😕';
    } else if (rating === -1) {
        label = 'Slightly Sour 🙁';
    } else if (rating === -0.5) {
        label = 'A Bit Sour 😐';
    } else if (rating === 0) {
        label = 'Perfect! 😊';
    } else if (rating === 0.5) {
        label = 'A Bit Bitter 😐';
    } else if (rating === 1) {
        label = 'Slightly Bitter 🙁';
    } else if (rating === 1.5) {
        label = 'Quite Bitter 😕';
    } else if (rating === 2) {
        label = 'Very Bitter 😖';
    }

    elements.ratingLabel.textContent = label;
}

async function adjustRecipeBasedOnRating(rating) {
    if (!state.currentCoffeeAnalysis || !state.currentBrewMethod) {
        console.error('No current coffee analysis or brew method available');
        return;
    }

    // Show loading state
    elements.adjustRecipeBtn.disabled = true;
    elements.adjustRecipeBtn.textContent = 'Adjusting Recipe...';

    try {
        // Prepare adjustment guidance based on rating
        let adjustmentGuidance = '';
        if (rating < 0) {
            // Too sour - need to increase extraction
            adjustmentGuidance = `The coffee was ${rating === -2 ? 'very' : rating === -1 ? 'slightly' : 'somewhat'} sour.
                To fix this, we need to INCREASE extraction. Provide specific numbered adjustments for:
                - Finer grind size (if applicable)
                - Higher water temperature (2-4°F increase)
                - Longer brew time
                - Higher pressure or different flow profile (for espresso)`;
        } else if (rating > 0) {
            // Too bitter - need to decrease extraction
            adjustmentGuidance = `The coffee was ${rating === 2 ? 'very' : rating === 1 ? 'slightly' : 'somewhat'} bitter.
                To fix this, we need to DECREASE extraction. Provide specific numbered adjustments for:
                - Coarser grind size (if applicable)
                - Lower water temperature (2-4°F decrease)
                - Shorter brew time
                - Lower pressure or different flow profile (for espresso)`;
        } else {
            elements.adjustmentFeedback.classList.remove('hidden');
            elements.adjustmentFeedback.querySelector('p').textContent = '✓ Perfect! No adjustments needed. Save this recipe!';
            elements.adjustRecipeBtn.textContent = 'Adjust Recipe Based on Rating';
            elements.adjustRecipeBtn.disabled = false;
            return;
        }

        // Make API call to get adjusted recipe
        const equipmentDescription = getEquipmentDescription();

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                equipment: equipmentDescription,
                adjustmentRequest: adjustmentGuidance,
                previousAnalysis: state.currentCoffeeAnalysis
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Extract the text from the API response
        const adjustmentText = result.content[0].text;

        // Convert markdown-style text to HTML (simple conversion for line breaks and bold)
        const htmlText = adjustmentText
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Update the method content with adjusted recipe
        elements.methodContent.innerHTML = `
            <div class="adjustment-notice" style="background: #FFF3CD; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                <strong>📊 Recipe Adjusted Based on Your Feedback</strong>
            </div>
            <div style="line-height: 1.6;"><p>${htmlText}</p></div>
        `;

        // Show feedback
        elements.adjustmentFeedback.classList.remove('hidden');
        const feedbackText = rating < 0
            ? '✓ Recipe adjusted to increase extraction (reduce sourness)'
            : '✓ Recipe adjusted to decrease extraction (reduce bitterness)';
        elements.adjustmentFeedback.querySelector('p').textContent = feedbackText;

        // Update state
        state.currentRecipe = adjustmentText;

        // Reset button
        elements.adjustRecipeBtn.textContent = 'Adjust Recipe Based on Rating';
        elements.adjustRecipeBtn.disabled = true;

        // Reset slider to center
        elements.tasteRating.value = 0;
        updateRatingLabel(0);

    } catch (error) {
        console.error('Failed to adjust recipe:', error);
        showError(`Failed to adjust recipe: ${error.message}`);
        elements.adjustRecipeBtn.textContent = 'Adjust Recipe Based on Rating';
        elements.adjustRecipeBtn.disabled = false;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

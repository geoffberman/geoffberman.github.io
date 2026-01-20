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

    brewMethodSelect: document.getElementById('brew-method-select'),
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
    signInSection: document.getElementById('sign-in-section'),
    showAuthBtn: document.getElementById('show-auth-btn'),
    userProfile: document.getElementById('user-profile'),
    userEmailDisplay: document.getElementById('user-email-display'),
    userMenuBtn: document.getElementById('user-menu-btn'),
    userDropdown: document.getElementById('user-dropdown'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    logoutBtn: document.getElementById('logout-btn'),

    // Edit profile modal elements
    editProfileModal: document.getElementById('edit-profile-modal'),
    editProfileForm: document.getElementById('edit-profile-form'),
    editUsername: document.getElementById('edit-username'),
    editProfileError: document.getElementById('edit-profile-error'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    cancelEditProfileBtn: document.getElementById('cancel-edit-profile-btn'),

    // Rating slider elements
    ratingSection: document.getElementById('rating-section'),
    tasteRating: document.getElementById('taste-rating'),
    ratingLabel: document.getElementById('rating-label'),
    userFeedback: document.getElementById('user-feedback'),
    submitFeedbackBtn: document.getElementById('submit-feedback-btn'),
    adjustRecipeBtn: document.getElementById('adjust-recipe-btn'),
    adjustmentFeedback: document.getElementById('adjustment-feedback'),
    saveRecipeBtn: document.getElementById('save-recipe-btn'),
    perfectRecipeBtn: document.getElementById('perfect-recipe-btn'),

    // Equipment validation elements
    noGrinder: document.getElementById('no-grinder'),
    otherEquipment: document.getElementById('other-equipment'),
    equipmentRequiredOverlay: document.getElementById('equipment-required-overlay'),
    goToEquipmentBtn: document.getElementById('go-to-equipment-btn')
};

// Utility: Escape HTML to prevent XSS and formatting issues
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
            hideSignInButton();
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
                showSignInButton();
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

    // Check if equipment meets requirements and show/hide overlay
    updateEquipmentRequiredOverlay();
}

// Handle auth state changes
function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN') {
        hideAuthModal();
        showUserProfile();
        hideSignInButton();
        migrateLocalStorageToDatabase();
        loadEquipmentFromDatabase();
    } else if (event === 'SIGNED_OUT') {
        hideUserProfile();
        showSignInButton();
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

    // Brew method select - update button text
    elements.brewMethodSelect.addEventListener('change', () => {
        const selectedMethod = elements.brewMethodSelect.value;
        if (selectedMethod) {
            elements.analyzeBtn.textContent = 'Get Recipe';
        } else {
            elements.analyzeBtn.textContent = 'Make Recommendations';
        }
    });

    // Analyze button
    elements.analyzeBtn.addEventListener('click', () => {
        const selectedMethod = elements.brewMethodSelect.value;
        analyzeImage(selectedMethod || null);
    });

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

    // Custom brew method toggle
    const otherBrewToggle = document.getElementById('other-brew-method-toggle');
    const customBrewInput = document.getElementById('custom-brew-method-input');
    const addCustomBrewBtn = document.getElementById('add-custom-brew-method');

    otherBrewToggle.addEventListener('change', () => {
        if (otherBrewToggle.checked) {
            customBrewInput.classList.remove('hidden');
            addCustomBrewBtn.classList.remove('hidden');
            customBrewInput.focus();
        } else {
            customBrewInput.classList.add('hidden');
            addCustomBrewBtn.classList.add('hidden');
            customBrewInput.value = '';
        }
    });

    // Add custom brew method
    addCustomBrewBtn.addEventListener('click', () => {
        const methodName = customBrewInput.value.trim();
        if (methodName) {
            addCustomBrewMethod(methodName);
            customBrewInput.value = '';
            otherBrewToggle.checked = false;
            customBrewInput.classList.add('hidden');
            addCustomBrewBtn.classList.add('hidden');
        }
    });

    // Allow Enter key to add custom brew method
    customBrewInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomBrewBtn.click();
        }
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
        showSignInButton();
    });

    // Show auth modal from sign in button
    elements.showAuthBtn.addEventListener('click', () => {
        showAuthModal();
    });

    // User menu toggle
    elements.userMenuBtn.addEventListener('click', () => {
        elements.userDropdown.classList.toggle('hidden');
    });

    // Edit Profile
    elements.editProfileBtn.addEventListener('click', () => {
        elements.userDropdown.classList.add('hidden');
        showEditProfileModal();
    });

    // Logout
    elements.logoutBtn.addEventListener('click', async () => {
        await handleLogout();
    });

    // Edit profile form submit
    elements.editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleProfileUpdate();
    });

    // Cancel edit profile
    elements.cancelEditProfileBtn.addEventListener('click', () => {
        hideEditProfileModal();
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

    // User feedback textarea - show submit button when text is entered
    elements.userFeedback.addEventListener('input', (e) => {
        const hasText = e.target.value.trim().length > 0;
        if (hasText) {
            elements.submitFeedbackBtn.classList.remove('hidden');
        } else {
            elements.submitFeedbackBtn.classList.add('hidden');
        }
    });

    // Submit feedback button (for standalone feedback without rating)
    elements.submitFeedbackBtn.addEventListener('click', async () => {
        await submitFeedbackOnly();
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

    // Perfect recipe button
    elements.perfectRecipeBtn.addEventListener('click', async () => {
        if (!state.currentCoffeeAnalysis || state.activeTechniqueIndex === undefined) {
            console.error('No active technique to save');
            return;
        }
        // Get the currently active technique from the displayed recommendations
        const techniques = state.currentCoffeeAnalysis.recommended_techniques;
        if (!techniques || !techniques[state.activeTechniqueIndex]) {
            console.error('Active technique not found');
            return;
        }
        const technique = techniques[state.activeTechniqueIndex];
        await savePerfectRecipe(technique, state.activeTechniqueIndex);
    });

    // Go to equipment button (from equipment-required overlay)
    elements.goToEquipmentBtn.addEventListener('click', () => {
        // Hide the overlay
        elements.equipmentRequiredOverlay.classList.add('hidden');
        // Open equipment settings
        elements.settingsSection.classList.remove('hidden');
        showEquipmentForm();
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

    // Check if equipment is properly configured
    if (!state.equipment || !hasEquipment()) {
        showError('Please set up your equipment first before analyzing coffee. Click "Set Up Equipment" below to get started.');
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

        // Check for saved recipes and integrate them into recommendations
        analysisData = await integrateSavedRecipes(analysisData);

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
        // V60 pour over setup - Hario cone dripper with gooseneck kettle
        return '/images/v60.png';
    } else if (technique.includes('pour over')) {
        // Generic pour over
        return 'https://images.unsplash.com/photo-1611564154665-e64f686e0d3d?w=400&h=300&fit=crop&q=80';
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
    state.currentCoffeeAnalysis.recommended_techniques = techniques; // Store techniques for later access
    state.currentBrewMethod = techniques[0]?.technique_name || 'Unknown';
    state.currentRecipe = data;

    // Coffee Analysis
    let analysisHTML = '';

    // Check for poor equipment and show warning
    const poorEquipmentWarning = checkForPoorEquipment();
    if (poorEquipmentWarning) {
        analysisHTML += `
            <div style="background: linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%); border: 2px solid #C74B50; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #8B0000; font-weight: bold; font-size: 0.95rem;">
                    ⚠️ ${poorEquipmentWarning}
                </p>
            </div>
        `;
    }

    // Show equipment upgrade suggestions if provided by AI (but not if user has flow control)
    if (data.equipment_suggestions && data.equipment_suggestions.trim() && !state.equipment?.flowControl) {
        analysisHTML += `
            <div style="background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; color: #0D47A1; font-weight: bold;">
                    💡 Equipment Recommendations
                </p>
                <p style="margin: 0; color: #1565C0; font-size: 0.9rem; line-height: 1.5;">
                    ${data.equipment_suggestions}
                </p>
            </div>
        `;
    }

    analysisHTML += '<div class="analysis-details">';

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
    let techniquesHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; align-items: center;">';

    techniques.forEach((technique, index) => {
        const params = technique.parameters;
        const imageUrl = getBrewMethodImage(technique.technique_name);

        console.log(`Rendering technique ${index}:`, technique.technique_name, 'is_saved_recipe:', technique.is_saved_recipe);

        techniquesHTML += `
            <div class="technique-card" style="border: 2px solid ${technique.is_saved_recipe ? 'var(--success-color)' : 'var(--border-color)'}; border-radius: 8px; padding: 20px; background: ${technique.is_saved_recipe ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'white'}; display: flex; flex-direction: column; justify-content: center;">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; font-size: 1rem;">${technique.technique_name}</h4>
                        ${technique.is_saved_recipe ? '<span style="display: inline-block; background: var(--success-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">💾 YOUR SAVED RECIPE</span>' : ''}
                    </div>
                    <img src="${imageUrl}" alt="${technique.technique_name}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" loading="lazy" />
                </div>
                <div id="active-indicator-${index}" class="hidden" style="margin-bottom: 10px; text-align: left; color: var(--primary-color); font-weight: bold; font-size: 0.9rem;">
                    ⭐ Currently Using This Recipe
                </div>

                <p style="margin-bottom: 15px; line-height: 1.5; font-size: 0.9rem; color: var(--secondary-color);">${technique.reasoning}</p>

                <button class="btn btn-primary use-this-show-recipe-btn" data-technique-index="${index}" style="width: 100%; padding: 10px; font-size: 0.9rem;">
                    📌 Use This and Show Recipe
                </button>

                <div id="recipe-details-${index}" class="hidden" style="margin-top: 20px;">
                    <table class="brew-parameters-table" id="recipe-table-${index}">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>Value</span>
                                    <button class="btn btn-secondary input-adjustments-btn" data-technique-index="${index}" style="padding: 4px 10px; font-size: 0.75rem; white-space: nowrap; margin-left: 10px;">
                                        ✏️ Input Adjustments
                                    </button>
                                </th>
                                <th class="adjustment-column hidden" style="width: 180px;">My Adjustments</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Dose</td>
                                <td>${params.dose}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="dose" placeholder="Your dose" value="${params.dose}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                            <tr>
                                <td>Yield</td>
                                <td>${params.yield}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="yield" placeholder="Your yield" value="${params.yield}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                            <tr>
                                <td>Ratio</td>
                                <td>${params.ratio}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="ratio" placeholder="Your ratio" value="${params.ratio}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                            <tr>
                                <td>Water Temp</td>
                                <td>${params.water_temp}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="water_temp" placeholder="Your temp" value="${params.water_temp}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                            <tr>
                                <td>Grind Size</td>
                                <td>${params.grind_size}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="grind_size" placeholder="Your grind" value="${params.grind_size}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                            <tr>
                                <td>Brew Time</td>
                                <td>${params.brew_time}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="brew_time" placeholder="Your time" value="${params.brew_time}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                            <tr>
                                <td>Pressure</td>
                                <td>${params.pressure}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="pressure" placeholder="Your pressure" value="${params.pressure}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                            <tr>
                                <td>Flow Control</td>
                                <td>${params.flow_control}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="flow_control" placeholder="Your profile" value="${params.flow_control}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                            </tr>
                        </tbody>
                    </table>

                    <div id="save-adjustments-${index}" class="hidden" style="margin-top: 20px; text-align: center;">
                        <button class="btn btn-primary save-adjustments-btn" data-technique-index="${index}" style="min-width: 200px;">
                            💾 Save My Adjustments
                        </button>
                    </div>

                    ${technique.technique_notes ? `<div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-left: 3px solid var(--accent-color); border-radius: 4px;">
                        <div style="margin: 0; line-height: 1.6; color: var(--secondary-color); font-size: 0.9rem;">${technique.technique_notes
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/^• (.*?)$/gm, '<li style="margin: 0; padding: 0; line-height: 1.3;">$1</li>')
                            .replace(/(<li.*?<\/li>\n?)+/gs, match => `<ul style="margin: 0; padding-left: 20px; list-style-position: outside;">${match.replace(/\n/g, '')}</ul>`)
                            .replace(/\n\n/g, '</p><p style="margin: 10px 0;">')
                            .replace(/\n/g, '<br>')
                            .replace(/<br>\s*<ul/g, '<ul')
                        }</div>
                    </div>` : ''}
                </div>
            </div>
        `;
    });

    techniquesHTML += '</div>';

    elements.methodContent.innerHTML = techniquesHTML;

    // Track active technique (default to first one)
    if (!state.activeTechniqueIndex && state.activeTechniqueIndex !== 0) {
        state.activeTechniqueIndex = 0;
    }

    // Add event listeners for "Use This and Show Recipe" buttons
    document.querySelectorAll('.use-this-show-recipe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const techniqueIndex = parseInt(this.getAttribute('data-technique-index'));
            showRecipeDetails(techniqueIndex, data.recommended_techniques);
        });
    });

    // Add event listeners for "Input Adjustments" buttons
    document.querySelectorAll('.input-adjustments-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const techniqueIndex = parseInt(this.getAttribute('data-technique-index'));
            const technique = data.recommended_techniques[techniqueIndex];
            setActiveTechnique(techniqueIndex, data.recommended_techniques);
            showAdjustmentColumn(techniqueIndex);
        });
    });

    // Add event listeners for "Save My Adjustments" buttons
    document.querySelectorAll('.save-adjustments-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const techniqueIndex = parseInt(this.getAttribute('data-technique-index'));
            const technique = data.recommended_techniques[techniqueIndex];
            await saveInlineAdjustments(technique, techniqueIndex);
        });
    });
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
        pourOver: Array.from(document.querySelectorAll('input[name="pour-over"]:checked')).map(cb => cb.value),
        podMachines: Array.from(document.querySelectorAll('input[name="pod-machines"]:checked')).map(cb => cb.value),
        grinder: document.getElementById('grinder').value.trim(),
        noGrinder: document.getElementById('no-grinder').checked,
        otherMethods: Array.from(document.querySelectorAll('input[name="other-methods"]:checked')).map(cb => cb.value),
        customBrewMethods: Array.from(document.querySelectorAll('input[name="custom-brew-methods"]:checked')).map(cb => cb.value),
        otherEquipment: document.getElementById('other-equipment').value.trim(),
        additionalEquipment: document.getElementById('additional-equipment').value.trim()
    };

    console.log('Saving equipment with customBrewMethods:', equipment.customBrewMethods);

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
            updateEquipmentRequiredOverlay();
            updateBrewMethodDropdown();
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
                equipment.noGrinder ||
                (equipment.pourOver && equipment.pourOver.length > 0) ||
                (equipment.podMachines && equipment.podMachines.length > 0) ||
                (equipment.otherMethods && equipment.otherMethods.length > 0) ||
                (equipment.otherEquipment && equipment.otherEquipment.trim()) ||
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
                if (equipment.noGrinder) {
                    document.getElementById('no-grinder').checked = true;
                }
                if (equipment.otherEquipment) {
                    document.getElementById('other-equipment').value = equipment.otherEquipment;
                }
                if (equipment.additionalEquipment) {
                    document.getElementById('additional-equipment').value = equipment.additionalEquipment;
                }

                // Check appropriate checkboxes
                equipment.pourOver?.forEach(value => {
                    const checkbox = document.querySelector(`input[name="pour-over"][value="${value}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                equipment.podMachines?.forEach(value => {
                    const checkbox = document.querySelector(`input[name="pod-machines"][value="${value}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                equipment.otherMethods?.forEach(value => {
                    const checkbox = document.querySelector(`input[name="other-methods"][value="${value}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                // Render and check custom brew methods
                if (equipment.customBrewMethods && equipment.customBrewMethods.length > 0) {
                    renderCustomBrewMethods(equipment.customBrewMethods);
                }

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

    // Update brew method dropdown
    updateBrewMethodDropdown();
}

// Populate brew method dropdown with standard options + user's custom equipment
function updateBrewMethodDropdown() {
    const dropdown = document.getElementById('brew-method-select');
    if (!dropdown) return;

    // Start with all standard brewing methods (same as before)
    const standardMethods = [
        'Espresso',
        'V60 Pour Over',
        'Chemex',
        'French Press',
        'Aeropress',
        'Moka Pot',
        'Cold Brew',
        'Kalita Wave'
    ];

    // Keep the "Search All Methods" option
    dropdown.innerHTML = '<option value="">Search All Methods</option>';

    const methods = [...standardMethods];

    // Add custom brew methods from user's equipment
    if (state.equipment && state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) {
        state.equipment.customBrewMethods.forEach(method => {
            methods.push(method);
        });
    }

    // Remove duplicates and sort
    const uniqueMethods = [...new Set(methods)].sort();

    // Add options to dropdown
    uniqueMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        dropdown.appendChild(option);
    });

    // Also update the alternative brew method dropdown
    updateAltBrewMethodDropdown();
}

// Populate alternative brew method dropdown
function updateAltBrewMethodDropdown() {
    const altDropdown = document.getElementById('alt-brew-method');
    if (!altDropdown) return;

    const standardMethods = [
        'V60 Pour Over',
        'Espresso (Traditional)',
        'Espresso Lungo',
        'Turbo Shot Espresso',
        'Latte',
        'French Press',
        'Aeropress',
        'Chemex',
        'Moka Pot'
    ];

    // Keep the "Choose Method" option
    altDropdown.innerHTML = '<option value="">-- Choose Method --</option>';

    const methods = [...standardMethods];

    // Add custom brew methods from user's equipment
    if (state.equipment && state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) {
        state.equipment.customBrewMethods.forEach(method => {
            methods.push(method);
        });
    }

    // Remove duplicates and sort
    const uniqueMethods = [...new Set(methods)].sort();

    // Add options to dropdown
    uniqueMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        altDropdown.appendChild(option);
    });
}

function clearEquipment() {
    if (confirm('Are you sure you want to clear all equipment preferences?')) {
        // Clear form
        document.getElementById('equipment-form').reset();

        // Clear custom brew methods display
        const customMethodsContainer = document.getElementById('custom-brew-methods');
        if (customMethodsContainer) {
            customMethodsContainer.innerHTML = '';
        }

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
            updateBrewMethodDropdown();
        }, 1500);
    }
}

// Add a custom brew method
function addCustomBrewMethod(methodName) {
    // Get current custom methods from localStorage or initialize empty array
    const savedEquipment = localStorage.getItem('coffee_equipment');
    const equipment = savedEquipment ? JSON.parse(savedEquipment) : {};

    if (!equipment.customBrewMethods) {
        equipment.customBrewMethods = [];
    }

    // Check if method already exists
    if (equipment.customBrewMethods.includes(methodName)) {
        alert('This brew method already exists!');
        return;
    }

    // Add the new method
    equipment.customBrewMethods.push(methodName);

    // Save to localStorage
    localStorage.setItem('coffee_equipment', JSON.stringify(equipment));
    state.equipment = equipment;

    // Render the updated list
    renderCustomBrewMethods(equipment.customBrewMethods);

    // Update brew method dropdown
    updateBrewMethodDropdown();

    console.log('Added custom brew method:', methodName);
}

// Render custom brew methods as checkboxes
function renderCustomBrewMethods(customMethods) {
    const container = document.getElementById('custom-brew-methods');
    if (!container) return;

    container.innerHTML = '';

    customMethods.forEach(method => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'custom-brew-methods';
        checkbox.value = method;
        checkbox.checked = true; // Auto-check newly added methods

        const text = document.createTextNode(method);

        // Add a small remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.style.cssText = 'margin-left: auto; padding: 2px 6px; font-size: 1.2rem; color: #C74B50; background: none; border: 1px solid #C74B50; border-radius: 3px; cursor: pointer; line-height: 1;';
        removeBtn.title = 'Remove this method';
        removeBtn.onclick = () => removeCustomBrewMethod(method);

        label.appendChild(checkbox);
        label.appendChild(text);
        label.appendChild(removeBtn);
        container.appendChild(label);
    });
}

// Remove a custom brew method
function removeCustomBrewMethod(methodName) {
    if (!confirm(`Remove "${methodName}" from your brew methods?`)) {
        return;
    }

    const savedEquipment = localStorage.getItem('coffee_equipment');
    const equipment = savedEquipment ? JSON.parse(savedEquipment) : {};

    if (equipment.customBrewMethods) {
        equipment.customBrewMethods = equipment.customBrewMethods.filter(m => m !== methodName);
        localStorage.setItem('coffee_equipment', JSON.stringify(equipment));
        state.equipment = equipment;
        renderCustomBrewMethods(equipment.customBrewMethods);
        updateBrewMethodDropdown();
        console.log('Removed custom brew method:', methodName);
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

    if (state.equipment.podMachines && state.equipment.podMachines.length > 0) {
        parts.push(`Pod/Capsule Machines: ${state.equipment.podMachines.join(', ')}`);
    }

    if (state.equipment.grinder) {
        parts.push(`Grinder: ${state.equipment.grinder}`);
    } else if (state.equipment.noGrinder) {
        parts.push(`Grinder: Pre-ground coffee (no grinder)`);
    }

    if (state.equipment.otherMethods && state.equipment.otherMethods.length > 0) {
        parts.push(`Other Methods: ${state.equipment.otherMethods.join(', ')}`);
    }

    if (state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) {
        parts.push(`Custom Methods: ${state.equipment.customBrewMethods.join(', ')}`);
    }

    if (state.equipment.otherEquipment) {
        parts.push(`Other Equipment: ${state.equipment.otherEquipment}`);
    }

    if (state.equipment.additionalEquipment) {
        parts.push(`Additional: ${state.equipment.additionalEquipment}`);
    }

    return parts.length > 0 ? parts.join('; ') : null;
}

function checkForPoorEquipment() {
    if (!state.equipment) return null;

    // Check if any pod machines are selected
    if (state.equipment.podMachines && state.equipment.podMachines.length > 0) {
        return 'Warning: Not an ideal brewing setup for specialty coffee. Consider upgrading to manual brewing methods for better results!';
    }

    return null;
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

    // Check if at least one brewing method is specified
    const hasBrewingMethod = !!(
        (state.equipment.espressoMachine && state.equipment.espressoMachine.trim()) ||
        (state.equipment.pourOver && state.equipment.pourOver.length > 0) ||
        (state.equipment.podMachines && state.equipment.podMachines.length > 0) ||
        (state.equipment.otherMethods && state.equipment.otherMethods.length > 0) ||
        (state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) ||
        (state.equipment.otherEquipment && state.equipment.otherEquipment.trim())
    );

    // Check if grinder requirement is met (either has grinder OR no-grinder checkbox is checked)
    const hasGrinderOrNoGrinder = !!(
        (state.equipment.grinder && state.equipment.grinder.trim()) ||
        state.equipment.noGrinder
    );

    console.log('hasEquipment check - brewing method:', hasBrewingMethod, 'grinder/no-grinder:', hasGrinderOrNoGrinder);
    console.log('Equipment:', state.equipment);

    return hasBrewingMethod && hasGrinderOrNoGrinder;
}

function showEquipmentSummary() {
    console.log('showEquipmentSummary called with state.equipment:', state.equipment);
    elements.equipmentSummary.classList.remove('hidden');
    elements.equipmentFormContainer.classList.add('hidden');

    let summaryHTML = '';

    // Check for poor equipment and show warning at the top
    const poorEquipmentWarning = checkForPoorEquipment();
    if (poorEquipmentWarning) {
        summaryHTML += `
            <div style="background: linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%); border: 2px solid #C74B50; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #8B0000; font-weight: bold; font-size: 0.9rem;">
                    ⚠️ ${poorEquipmentWarning}
                </p>
            </div>
        `;
    }

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

    if (state.equipment.podMachines && state.equipment.podMachines.length > 0) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Pod/Capsule Machines</strong>
                <span>${state.equipment.podMachines.join(', ')}</span>
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
    } else if (state.equipment.noGrinder) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Grinder</strong>
                <span>Using pre-ground coffee</span>
            </div>
        `;
    }

    if (state.equipment.otherMethods && state.equipment.otherMethods.length > 0) {
        const allOtherMethods = [...state.equipment.otherMethods];
        if (state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) {
            allOtherMethods.push(...state.equipment.customBrewMethods);
        }
        console.log('Displaying Other Brewing Methods:', allOtherMethods);
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Other Brewing Methods</strong>
                <span>${allOtherMethods.join(', ')}</span>
            </div>
        `;
    } else if (state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) {
        console.log('Displaying Custom Brewing Methods only:', state.equipment.customBrewMethods);
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Other Brewing Methods</strong>
                <span>${state.equipment.customBrewMethods.join(', ')}</span>
            </div>
        `;
    }

    if (state.equipment.otherEquipment) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Other Brewing Equipment</strong>
                <span>${state.equipment.otherEquipment}</span>
            </div>
        `;
    }

    if (state.equipment.additionalEquipment) {
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Additional Notes</strong>
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

function updateEquipmentRequiredOverlay() {
    const hasRequiredEquipment = state.equipment && hasEquipment();

    if (hasRequiredEquipment) {
        elements.equipmentRequiredOverlay.classList.add('hidden');
    } else {
        elements.equipmentRequiredOverlay.classList.remove('hidden');
    }
}

// ========================================
// Authentication UI Functions
// ========================================

function showAuthModal() {
    elements.authModal.classList.remove('hidden');
    // Ensure we're on the signin tab by default
    switchAuthTab('signin');
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

        // Hide and disable username field for sign in
        elements.usernameGroup.style.display = 'none';
        elements.authUsername.required = false;
        elements.authUsername.disabled = true;
    } else {
        elements.tabSignup.classList.add('active');
        elements.tabSignin.classList.remove('active');
        elements.authSubmitBtn.textContent = 'Sign Up';
        document.getElementById('auth-title').textContent = 'Create Account';
        document.getElementById('auth-subtitle').textContent = 'Sign up to save your equipment and recipes across devices';

        // Show and enable username field for sign up
        elements.usernameGroup.style.display = 'block';
        elements.authUsername.required = true;
        elements.authUsername.disabled = false;
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
        // Handle email confirmation required
        if (error.message === 'CONFIRMATION_REQUIRED') {
            elements.authError.innerHTML = `
                <strong>✓ Account created!</strong><br>
                Please check your email (${email}) and click the confirmation link to complete signup.
                <br><br>
                <small>Once confirmed, you can sign in with your credentials.</small>
            `;
            elements.authError.style.backgroundColor = '#d4edda';
            elements.authError.style.color = '#155724';
            elements.authError.classList.remove('hidden');
            elements.authSubmitBtn.disabled = false;
            elements.authSubmitBtn.textContent = 'Sign Up';

            // Clear form
            elements.authForm.reset();

            // Switch to sign-in tab after a delay
            setTimeout(() => {
                switchAuthTab('signin');
                elements.authError.classList.add('hidden');
                elements.authError.style.backgroundColor = '';
                elements.authError.style.color = '';
            }, 8000);
        } else {
            elements.authError.textContent = error.message;
            elements.authError.classList.remove('hidden');
            elements.authSubmitBtn.disabled = false;
            elements.authSubmitBtn.textContent = isSignup ? 'Sign Up' : 'Sign In';
        }
    }
}

async function handleLogout() {
    try {
        if (!window.auth) {
            throw new Error('Auth not initialized');
        }

        await window.auth.signOut();
        hideUserProfile();
        showSignInButton();

        // Clear state but keep localStorage as backup
        state.equipment = null;

        // Reload equipment from localStorage for demo mode
        loadEquipment();
        updateEquipmentDisplay();

        console.log('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to log out: ' + error.message);
    }
}

async function showUserProfile() {
    const user = window.auth.getUser();
    if (user) {
        elements.userProfile.classList.remove('hidden');

        // Try to get username from metadata first (immediate), then from database
        let username = user.user_metadata?.username;

        if (!username) {
            // Fallback to loading from profiles table
            username = await loadUsername();
        }

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

async function showEditProfileModal() {
    const user = window.auth.getUser();
    if (!user) return;

    // Load current username
    let currentUsername = user.user_metadata?.username;
    if (!currentUsername) {
        currentUsername = await loadUsername();
    }

    // Pre-fill the form
    elements.editUsername.value = currentUsername || '';
    elements.editProfileError.classList.add('hidden');

    // Show modal
    elements.editProfileModal.classList.remove('hidden');
}

function hideEditProfileModal() {
    elements.editProfileModal.classList.add('hidden');
    elements.editProfileError.classList.add('hidden');
    elements.editProfileForm.reset();
}

async function handleProfileUpdate() {
    const newUsername = elements.editUsername.value.trim();

    if (!newUsername) {
        elements.editProfileError.textContent = 'Username is required';
        elements.editProfileError.classList.remove('hidden');
        return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
        elements.editProfileError.textContent = 'Username must be 3-20 characters';
        elements.editProfileError.classList.remove('hidden');
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
        elements.editProfileError.textContent = 'Username can only contain letters, numbers, and underscores';
        elements.editProfileError.classList.remove('hidden');
        return;
    }

    try {
        elements.saveProfileBtn.disabled = true;
        elements.saveProfileBtn.textContent = 'Saving...';
        elements.editProfileError.classList.add('hidden');

        const supabase = window.getSupabase();
        const userId = window.auth.getUserId();

        // Update username in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                username: newUsername,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (profileError) {
            if (profileError.code === '23505') {
                throw new Error('Username already taken. Please choose another.');
            }
            throw new Error('Failed to update profile: ' + profileError.message);
        }

        // Update user metadata
        const { error: metadataError } = await supabase.auth.updateUser({
            data: {
                username: newUsername
            }
        });

        if (metadataError) {
            console.warn('Failed to update metadata:', metadataError);
            // Not critical - continue anyway
        }

        // Update the display
        elements.userEmailDisplay.textContent = newUsername;

        // Show success and close
        elements.saveProfileBtn.textContent = '✓ Saved!';
        setTimeout(() => {
            hideEditProfileModal();
            elements.saveProfileBtn.textContent = 'Save Changes';
            elements.saveProfileBtn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error('Failed to update profile:', error);
        elements.editProfileError.textContent = error.message;
        elements.editProfileError.classList.remove('hidden');
        elements.saveProfileBtn.textContent = 'Save Changes';
        elements.saveProfileBtn.disabled = false;
    }
}

function showSignInButton() {
    elements.signInSection.classList.remove('hidden');
}

function hideSignInButton() {
    elements.signInSection.classList.add('hidden');
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
                pourOver: data.pour_over || [],
                podMachines: data.pod_machines || [],
                grinder: data.grinder || '',
                noGrinder: data.no_grinder || false,
                otherMethods: data.other_methods || [],
                customBrewMethods: data.custom_brew_methods || [],
                otherEquipment: data.other_equipment || '',
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
            if (state.equipment.noGrinder) {
                document.getElementById('no-grinder').checked = true;
            }
            if (state.equipment.otherEquipment) {
                document.getElementById('other-equipment').value = state.equipment.otherEquipment;
            }
            if (state.equipment.additionalEquipment) {
                document.getElementById('additional-equipment').value = state.equipment.additionalEquipment;
            }

            // Check boxes
            state.equipment.pourOver.forEach(value => {
                const checkbox = document.querySelector(`input[name="pour-over"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });

            state.equipment.podMachines.forEach(value => {
                const checkbox = document.querySelector(`input[name="pod-machines"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });

            state.equipment.otherMethods.forEach(value => {
                const checkbox = document.querySelector(`input[name="other-methods"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Render and check custom brew methods
            if (state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) {
                renderCustomBrewMethods(state.equipment.customBrewMethods);
            }

            // Show summary
            showEquipmentSummary();
            console.log('Equipment loaded from database');
        }
    } catch (error) {
        console.error('Failed to load equipment from database:', error);
    }

    // Update the equipment button text
    updateEquipmentButton();

    // Update brew method dropdown
    updateBrewMethodDropdown();
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
            pour_over: equipment.pourOver,
            pod_machines: equipment.podMachines,
            grinder: equipment.grinder,
            no_grinder: equipment.noGrinder,
            other_methods: equipment.otherMethods,
            custom_brew_methods: equipment.customBrewMethods || [],
            other_equipment: equipment.otherEquipment,
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
    // Always save to localStorage as backup
    saveRecipeToLocalStorage(
        state.currentCoffeeAnalysis,
        state.currentBrewMethod,
        state.currentRecipe
    );

    // If authenticated, also save to database
    if (!window.auth || !window.auth.isAuthenticated()) {
        return;
    }

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
            .maybeSingle();

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

async function submitFeedbackOnly() {
    const userFeedback = elements.userFeedback.value.trim();

    if (!userFeedback) {
        return;
    }

    if (!state.currentCoffeeAnalysis || !state.currentBrewMethod) {
        console.error('No current coffee analysis or brew method available');
        return;
    }

    // Show loading state
    elements.submitFeedbackBtn.disabled = true;
    elements.submitFeedbackBtn.textContent = '...';

    try {
        const equipmentDescription = getEquipmentDescription();

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                equipment: equipmentDescription,
                adjustmentRequest: `User feedback: ${userFeedback}`,
                previousAnalysis: state.currentCoffeeAnalysis
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        // Display AI response
        const responseText = data.content?.[0]?.text || 'Thank you for your feedback!';

        elements.adjustmentFeedback.classList.remove('hidden');
        elements.adjustmentFeedback.querySelector('p').innerHTML = responseText.replace(/\n/g, '<br>');

        // Reset button
        elements.submitFeedbackBtn.textContent = '💬 Submit Feedback';
        elements.submitFeedbackBtn.disabled = false;

        // Clear feedback textarea
        elements.userFeedback.value = '';
        elements.submitFeedbackBtn.classList.add('hidden');

    } catch (error) {
        console.error('Failed to submit feedback:', error);
        elements.adjustmentFeedback.classList.remove('hidden');
        elements.adjustmentFeedback.querySelector('p').textContent = 'Failed to submit feedback. Please try again.';

        elements.submitFeedbackBtn.textContent = '💬 Submit Feedback';
        elements.submitFeedbackBtn.disabled = false;
    }
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
        // Get user feedback
        const userFeedback = elements.userFeedback.value.trim();

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

        // Add user feedback if provided
        if (userFeedback) {
            adjustmentGuidance += `\n\n⚠️ IMPORTANT USER FEEDBACK/CORRECTIONS:\n${userFeedback}\n\nPay special attention to this feedback. If the user is correcting information (like roast level, grinder settings, or taste notes), acknowledge and use the corrected information in your response.`;
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

        // Try to parse JSON from the response
        let adjustedData;
        console.log('Raw adjustment text:', adjustmentText);

        try {
            // Try direct JSON parse first
            adjustedData = JSON.parse(adjustmentText);
            console.log('✓ Parsed JSON directly');
        } catch (parseError1) {
            console.log('Direct parse failed, trying extraction...');

            try {
                // Remove markdown code blocks if present
                let cleanText = adjustmentText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

                // Find JSON object - match outermost braces
                const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    adjustedData = JSON.parse(jsonMatch[0]);
                    console.log('✓ Parsed JSON from extracted text');
                } else {
                    throw new Error('No JSON object found in text');
                }
            } catch (parseError2) {
                console.error('All JSON parsing attempts failed:', parseError2);

                // Final fallback - manual extraction from text
                try {
                    console.log('Attempting manual parameter extraction...');

                    // Extract parameters using regex
                    const doseMatch = adjustmentText.match(/"dose":\s*"([^"]+)"/);
                    const yieldMatch = adjustmentText.match(/"yield":\s*"([^"]+)"/);
                    const ratioMatch = adjustmentText.match(/"ratio":\s*"([^"]+)"/);
                    const tempMatch = adjustmentText.match(/"water_temp":\s*"([^"]+)"/);
                    const grindMatch = adjustmentText.match(/"grind_size":\s*"([^"]+)"/);
                    const timeMatch = adjustmentText.match(/"brew_time":\s*"([^"]+)"/);
                    const pressureMatch = adjustmentText.match(/"pressure":\s*"([^"]+)"/);
                    const flowMatch = adjustmentText.match(/"flow_control":\s*"([^"]+)"/);
                    const explanationMatch = adjustmentText.match(/"adjustments_explained":\s*"([^"]+(?:\\.[^"]+)*)"/);

                    if (doseMatch && yieldMatch && ratioMatch) {
                        adjustedData = {
                            adjusted_parameters: {
                                dose: doseMatch[1],
                                yield: yieldMatch[1],
                                ratio: ratioMatch[1],
                                water_temp: tempMatch ? tempMatch[1] : 'N/A',
                                grind_size: grindMatch ? grindMatch[1] : 'N/A',
                                brew_time: timeMatch ? timeMatch[1] : 'N/A',
                                pressure: pressureMatch ? pressureMatch[1] : 'N/A',
                                flow_control: flowMatch ? flowMatch[1] : 'N/A'
                            },
                            adjustments_explained: explanationMatch ? explanationMatch[1].replace(/\\n/g, '\n') : adjustmentText.split('"adjustments_explained":')[1] || 'See details below'
                        };
                        console.log('✓ Manually extracted parameters from text');
                    } else {
                        throw new Error('Could not extract parameters');
                    }
                } catch (manualError) {
                    console.error('Manual extraction failed:', manualError);

                    // Absolute final fallback - display formatted text
                    const htmlText = adjustmentText
                        .replace(/\{[\s\S]*?"adjustments_explained":\s*"/g, '')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\\n/g, '<br>')
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>');

                    elements.methodContent.innerHTML = `
                        <div class="adjustment-notice" style="background: #FFF3CD; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                            <strong>📊 Recipe Adjusted Based on Your Feedback</strong>
                        </div>
                        <p style="color: var(--secondary-color); font-size: 0.9rem; margin-bottom: 15px;">
                            ⚠️ Could not parse recipe format. Here are the recommendations:
                        </p>
                        <div style="line-height: 1.6;"><p>${htmlText}</p></div>
                    `;
                    elements.adjustmentFeedback.classList.remove('hidden');
                    elements.adjustmentFeedback.querySelector('p').textContent = rating < 0
                        ? '✓ Recipe adjusted to increase extraction (reduce sourness)'
                        : '✓ Recipe adjusted to decrease extraction (reduce bitterness)';
                    elements.adjustRecipeBtn.textContent = 'Adjust Recipe Based on Rating';
                    elements.adjustRecipeBtn.disabled = true;
                    elements.tasteRating.value = 0;
                    updateRatingLabel(0);
                    return;
                }
            }
        }

        // Display adjusted recipe with parameters table
        const params = adjustedData.adjusted_parameters;
        const explanations = adjustedData.adjustments_explained
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        elements.methodContent.innerHTML = `
            <div class="adjustment-notice" style="background: #FFF3CD; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                <strong>📊 Recipe Adjusted Based on Your Feedback</strong>
            </div>

            <h4 style="margin-top: 20px; margin-bottom: 15px;">Adjusted Recipe Parameters</h4>
            <p style="margin-bottom: 15px; color: var(--secondary-color); font-size: 0.9rem;">
                Review the adjusted parameters below and edit any values to match what you actually used.
            </p>
            <table class="brew-parameters-table editable-parameters">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Adjusted Recommendation</th>
                        <th style="width: 180px;">My Adjustments</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Dose</td>
                        <td>${params.dose}</td>
                        <td><input type="text" class="param-input" data-param="dose" placeholder="Your dose" value="${params.dose}"></td>
                    </tr>
                    <tr>
                        <td>Yield</td>
                        <td>${params.yield}</td>
                        <td><input type="text" class="param-input" data-param="yield" placeholder="Your yield" value="${params.yield}"></td>
                    </tr>
                    <tr>
                        <td>Ratio</td>
                        <td>${params.ratio}</td>
                        <td><input type="text" class="param-input" data-param="ratio" placeholder="Your ratio" value="${params.ratio}"></td>
                    </tr>
                    <tr>
                        <td>Water Temp</td>
                        <td>${params.water_temp}</td>
                        <td><input type="text" class="param-input" data-param="water_temp" placeholder="Your temp" value="${params.water_temp}"></td>
                    </tr>
                    <tr>
                        <td>Grind Size</td>
                        <td>${params.grind_size}</td>
                        <td><input type="text" class="param-input" data-param="grind_size" placeholder="Your grind" value="${params.grind_size}"></td>
                    </tr>
                    <tr>
                        <td>Brew Time</td>
                        <td>${params.brew_time}</td>
                        <td><input type="text" class="param-input" data-param="brew_time" placeholder="Your time" value="${params.brew_time}"></td>
                    </tr>
                    <tr>
                        <td>Pressure</td>
                        <td>${params.pressure}</td>
                        <td><input type="text" class="param-input" data-param="pressure" placeholder="Your pressure" value="${params.pressure}"></td>
                    </tr>
                    <tr>
                        <td>Flow Control</td>
                        <td>${params.flow_control}</td>
                        <td><input type="text" class="param-input" data-param="flow_control" placeholder="Your profile" value="${params.flow_control}"></td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 20px; text-align: center;">
                <button id="save-adjusted-recipe-btn" class="btn btn-primary" style="background: #28a745; min-width: 250px;">
                    💾 Save My Brew
                </button>
            </div>

            <h4 style="margin-top: 25px; margin-bottom: 15px;">What Changed and Why</h4>
            <div style="line-height: 1.6;"><p>${explanations}</p></div>
        `;

        // Show feedback
        elements.adjustmentFeedback.classList.remove('hidden');
        const feedbackText = rating < 0
            ? '✓ Recipe adjusted to increase extraction (reduce sourness)'
            : '✓ Recipe adjusted to decrease extraction (reduce bitterness)';
        elements.adjustmentFeedback.querySelector('p').textContent = feedbackText;

        // Update state with structured data
        state.currentRecipe = params;
        state.adjustedRecipeData = adjustedData;

        // Add event listeners for checkboxes and inputs
        setupAdjustedRecipeListeners();

        // Add event listener for save button
        const saveBtn = document.getElementById('save-adjusted-recipe-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveAdjustedBrew);
        }

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

// Setup event listeners for adjusted recipe inputs
function setupAdjustedRecipeListeners() {
    // Inputs are always editable, no checkbox logic needed
    document.querySelectorAll('.param-input').forEach(input => {
        input.disabled = false;
        input.style.opacity = '1';
    });
}

// Set which technique is actively being used
function setActiveTechnique(techniqueIndex, techniques) {
    state.activeTechniqueIndex = techniqueIndex;
    state.currentBrewMethod = techniques[techniqueIndex].technique_name;

    // Update visual indicators
    document.querySelectorAll('[id^="active-indicator-"]').forEach(indicator => {
        indicator.classList.add('hidden');
    });
    document.getElementById(`active-indicator-${techniqueIndex}`)?.classList.remove('hidden');

    console.log('Active technique set to:', state.currentBrewMethod);
}

// Show recipe details when "Use This and Show Recipe" is clicked
function showRecipeDetails(techniqueIndex, techniques) {
    // Set this as the active technique
    setActiveTechnique(techniqueIndex, techniques);

    // Show the recipe details for this technique
    const recipeDetails = document.getElementById(`recipe-details-${techniqueIndex}`);
    if (recipeDetails) {
        recipeDetails.classList.remove('hidden');
    }

    // Show the rating section now that a recipe is selected
    const ratingSection = document.getElementById('rating-section');
    if (ratingSection) {
        ratingSection.classList.remove('hidden');
    }

    // Change button text to indicate recipe is shown
    const btn = document.querySelector(`.use-this-show-recipe-btn[data-technique-index="${techniqueIndex}"]`);
    if (btn) {
        btn.textContent = '✓ Using This Recipe';
        btn.disabled = true;
        btn.style.backgroundColor = '#28a745';
    }

    // Hide all other technique cards and change grid to single column
    const allCards = document.querySelectorAll('.technique-card');
    allCards.forEach((card, index) => {
        if (index !== techniqueIndex) {
            card.style.display = 'none';
        }
    });

    // Change the grid container to full width
    const gridContainer = elements.methodContent.querySelector('div[style*="grid"]');
    if (gridContainer) {
        gridContainer.style.gridTemplateColumns = '1fr';
    }
}

// Show adjustment column in the existing recipe table
function showAdjustmentColumn(techniqueIndex) {
    // Find the table for this technique
    const table = document.getElementById(`recipe-table-${techniqueIndex}`);
    if (!table) return;

    // Show all adjustment columns
    const adjustmentColumns = table.querySelectorAll('.adjustment-column');
    adjustmentColumns.forEach(col => {
        col.classList.remove('hidden');
    });

    // Show the save button
    const saveBtn = document.getElementById(`save-adjustments-${techniqueIndex}`);
    if (saveBtn) {
        saveBtn.classList.remove('hidden');
    }

    // Hide the "Input Adjustments" button (it's been clicked)
    const inputAdjustmentsBtn = table.querySelector('.input-adjustments-btn');
    if (inputAdjustmentsBtn) {
        inputAdjustmentsBtn.style.display = 'none';
    }
}

// Save inline adjustments from the recipe table
async function saveInlineAdjustments(technique, techniqueIndex) {
    const btn = document.querySelector(`.save-adjustments-btn[data-technique-index="${techniqueIndex}"]`);
    if (!btn) return;

    try {
        btn.disabled = true;
        btn.textContent = 'Saving...';

        // Collect adjustments from the table inputs
        const table = document.getElementById(`recipe-table-${techniqueIndex}`);
        const adjustedParams = {};
        table.querySelectorAll('.param-input').forEach(input => {
            const param = input.getAttribute('data-param');
            adjustedParams[param] = input.value;
        });

        // Save as preferred recipe (handles both localStorage and database)
        await saveAsPreferredRecipeWithData(technique.technique_name, adjustedParams);

        // If authenticated, also save brew session
        if (window.auth && window.auth.isAuthenticated()) {
            const supabase = window.getSupabase();
            const userId = window.auth.getUserId();

            // Create brew session
            const session = {
                user_id: userId,
                coffee_name: state.currentCoffeeAnalysis.name || 'Unknown',
                roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
                roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
                origin: state.currentCoffeeAnalysis.origin || 'Unknown',
                processing: state.currentCoffeeAnalysis.processing || 'Unknown',
                flavor_notes: state.currentCoffeeAnalysis.flavor_notes || [],
                brew_method: technique.technique_name,
                original_recipe: technique.parameters,
                actual_brew: adjustedParams,
                rating: 'manual_adjustment'
            };

            const { error } = await supabase
                .from('brew_sessions')
                .insert([session]);

            if (error) throw error;
        }

        btn.textContent = '✓ Saved!';
        btn.style.backgroundColor = 'var(--success-color)';

        setTimeout(() => {
            btn.textContent = '💾 Save My Adjustments';
            btn.style.backgroundColor = '';
            btn.disabled = false;
        }, 2000);

        console.log('Inline adjustments saved successfully');

    } catch (error) {
        console.error('Failed to save inline adjustments:', error);
        btn.textContent = '❌ Failed';
        setTimeout(() => {
            btn.textContent = '💾 Save My Adjustments';
            btn.disabled = false;
        }, 2000);
    }
}

// Show manual adjustment table for user to input their own values
function showManualAdjustmentTable(technique) {
    const params = technique.parameters;

    // Build editable table
    let tableHTML = `
        <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #FFF8ED 0%, #FFEDDA 100%); border: 2px solid #D4A574; border-radius: 8px;">
            <h4 style="margin-top: 0; color: var(--primary-color);">Manual Recipe Adjustments</h4>
            <p style="color: var(--secondary-color); margin-bottom: 15px;">Edit the values below to match what you actually used:</p>

            <table class="brew-parameters-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Adjusted Recommendation</th>
                        <th>My Adjustments</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Dose</td>
                        <td>${params.dose}</td>
                        <td><input type="text" class="manual-input" data-param="dose" value="${params.dose}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                    <tr>
                        <td>Yield</td>
                        <td>${params.yield}</td>
                        <td><input type="text" class="manual-input" data-param="yield" value="${params.yield}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                    <tr>
                        <td>Ratio</td>
                        <td>${params.ratio}</td>
                        <td><input type="text" class="manual-input" data-param="ratio" value="${params.ratio}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                    <tr>
                        <td>Water Temp</td>
                        <td>${params.water_temp}</td>
                        <td><input type="text" class="manual-input" data-param="water_temp" value="${params.water_temp}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                    <tr>
                        <td>Grind Size</td>
                        <td>${params.grind_size}</td>
                        <td><input type="text" class="manual-input" data-param="grind_size" value="${params.grind_size}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                    <tr>
                        <td>Brew Time</td>
                        <td>${params.brew_time}</td>
                        <td><input type="text" class="manual-input" data-param="brew_time" value="${params.brew_time}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                    <tr>
                        <td>Pressure</td>
                        <td>${params.pressure}</td>
                        <td><input type="text" class="manual-input" data-param="pressure" value="${params.pressure}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                    <tr>
                        <td>Flow Control</td>
                        <td>${params.flow_control}</td>
                        <td><input type="text" class="manual-input" data-param="flow_control" value="${params.flow_control}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 20px; text-align: center;">
                <button id="save-manual-adjustments" class="btn btn-primary" style="min-width: 200px;">
                    💾 Save My Adjustments
                </button>
            </div>
        </div>
    `;

    // Display in adjustment feedback area
    elements.adjustmentFeedback.classList.remove('hidden');
    elements.adjustmentFeedback.querySelector('p').innerHTML = tableHTML;

    // Add save button listener
    document.getElementById('save-manual-adjustments')?.addEventListener('click', async () => {
        await saveManualAdjustments(technique);
    });
}

// Save manually adjusted recipe
async function saveManualAdjustments(technique) {
    if (!window.auth || !window.auth.isAuthenticated()) {
        showAuthModal();
        return;
    }

    const btn = document.getElementById('save-manual-adjustments');
    if (!btn) return;

    try {
        btn.disabled = true;
        btn.textContent = 'Saving...';

        // Collect manual adjustments
        const adjustedParams = {};
        document.querySelectorAll('.manual-input').forEach(input => {
            const param = input.getAttribute('data-param');
            adjustedParams[param] = input.value;
        });

        const supabase = window.getSupabase();
        const userId = window.auth.getUserId();

        // Create brew session
        const session = {
            user_id: userId,
            coffee_name: state.currentCoffeeAnalysis.name || 'Unknown',
            roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
            roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
            origin: state.currentCoffeeAnalysis.origin || 'Unknown',
            processing: state.currentCoffeeAnalysis.processing || 'Unknown',
            flavor_notes: state.currentCoffeeAnalysis.flavor_notes || [],
            brew_method: technique.technique_name,
            original_recipe: technique.parameters,
            actual_brew: adjustedParams,
            rating: 'manual_adjustment'
        };

        const { error } = await supabase
            .from('brew_sessions')
            .insert([session]);

        if (error) throw error;

        btn.textContent = '✓ Saved!';
        btn.style.backgroundColor = 'var(--success-color)';

        setTimeout(() => {
            btn.textContent = '💾 Save My Adjustments';
            btn.style.backgroundColor = '';
            btn.disabled = false;
        }, 2000);

        console.log('Manual adjustments saved successfully');

    } catch (error) {
        console.error('Failed to save manual adjustments:', error);
        btn.textContent = '❌ Failed';
        setTimeout(() => {
            btn.textContent = '💾 Save My Adjustments';
            btn.disabled = false;
        }, 2000);
    }
}

// Save a perfect recipe from original recommendations
async function savePerfectRecipe(technique, techniqueIndex) {
    if (!window.auth || !window.auth.isAuthenticated()) {
        showAuthModal();
        return;
    }

    const btn = document.querySelector(`.perfect-recipe-btn[data-technique-index="${techniqueIndex}"]`);
    if (!btn) return;

    try {
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const supabase = window.getSupabase();
        const userId = window.auth.getUserId();

        // Create brew session
        const session = {
            user_id: userId,
            coffee_name: state.currentCoffeeAnalysis.name || 'Unknown',
            roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
            roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
            origin: state.currentCoffeeAnalysis.origin || 'Unknown',
            processing: state.currentCoffeeAnalysis.processing || 'Unknown',
            flavor_notes: state.currentCoffeeAnalysis.flavor_notes || [],
            brew_method: technique.technique_name,
            original_recipe: technique.parameters,
            actual_brew: technique.parameters, // Used as-is
            rating: 'perfect'
        };

        const { error } = await supabase
            .from('brew_sessions')
            .insert([session]);

        if (error) throw error;

        // Save as preferred recipe
        await saveAsPreferredRecipeWithData(
            technique.technique_name,
            technique.parameters
        );

        btn.textContent = '✓ Saved!';
        btn.style.background = '#218838';

        setTimeout(() => {
            btn.textContent = '✓ Perfect As-Is';
            btn.style.background = '#28a745';
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Failed to save perfect recipe:', error);
        btn.textContent = '❌ Failed';
        setTimeout(() => {
            btn.textContent = '✓ Perfect As-Is';
            btn.disabled = false;
        }, 2000);
    }
}

// Save adjusted brew with user's actual parameters
async function saveAdjustedBrew() {
    if (!window.auth || !window.auth.isAuthenticated()) {
        showAuthModal();
        return;
    }

    const btn = document.getElementById('save-adjusted-recipe-btn');
    if (!btn) return;

    try {
        btn.disabled = true;
        btn.textContent = 'Saving...';

        // Collect actual brew parameters from inputs
        const actualBrew = {};
        document.querySelectorAll('.param-input').forEach(input => {
            const param = input.getAttribute('data-param');
            actualBrew[param] = input.value.trim();
        });

        const supabase = window.getSupabase();
        const userId = window.auth.getUserId();

        // Create brew session with both original and actual brew
        const session = {
            user_id: userId,
            coffee_name: state.currentCoffeeAnalysis.name || 'Unknown',
            roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
            roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
            origin: state.currentCoffeeAnalysis.origin || 'Unknown',
            processing: state.currentCoffeeAnalysis.processing || 'Unknown',
            flavor_notes: state.currentCoffeeAnalysis.flavor_notes || [],
            brew_method: state.currentBrewMethod,
            original_recipe: state.adjustedRecipeData?.adjusted_parameters || state.currentRecipe,
            actual_brew: actualBrew,
            adjusted_recipe: state.adjustedRecipeData?.adjusted_parameters || null,
            rating: 'perfect' // Assuming they used it, so it worked
        };

        const { error } = await supabase
            .from('brew_sessions')
            .insert([session]);

        if (error) throw error;

        // Save as preferred recipe using their actual values
        await saveAsPreferredRecipeWithData(
            state.currentBrewMethod,
            actualBrew
        );

        btn.textContent = '✓ Saved!';
        btn.style.background = '#218838';

        // Show success message
        elements.adjustmentFeedback.classList.remove('hidden');
        elements.adjustmentFeedback.querySelector('p').innerHTML =
            '✓ Your brew has been saved! These parameters will be used to improve future recommendations for similar coffees.';

        setTimeout(() => {
            btn.textContent = '💾 Save My Brew';
            btn.style.background = '#28a745';
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Failed to save adjusted brew:', error);
        elements.adjustmentFeedback.classList.remove('hidden');
        elements.adjustmentFeedback.querySelector('p').textContent =
            '❌ Failed to save brew. Please try again.';

        btn.textContent = '💾 Save My Brew';
        btn.disabled = false;
    }
}

// Helper function to save preferred recipe with specific data
async function saveAsPreferredRecipeWithData(brewMethod, recipeData) {
    // Always save to localStorage as backup
    saveRecipeToLocalStorage(
        state.currentCoffeeAnalysis,
        brewMethod,
        recipeData
    );

    // If authenticated, also save to database
    if (!window.auth || !window.auth.isAuthenticated()) {
        return;
    }

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
        brew_method: brewMethod,
        recipe: recipeData,
        last_brewed: new Date().toISOString()
    };

    try {
        // Check if recipe already exists
        const { data: existing } = await supabase
            .from('saved_recipes')
            .select('id, times_brewed')
            .eq('user_id', userId)
            .eq('coffee_hash', coffeeHash)
            .eq('brew_method', brewMethod)
            .maybeSingle();

        if (existing) {
            // Update existing recipe
            const { error } = await supabase
                .from('saved_recipes')
                .update({
                    recipe: recipeData,
                    times_brewed: existing.times_brewed + 1,
                    last_brewed: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) throw error;
            console.log('Updated existing preferred recipe');
        } else {
            // Insert new preferred recipe
            const { error } = await supabase
                .from('saved_recipes')
                .insert([preferredRecipe]);

            if (error) throw error;
            console.log('Inserted new preferred recipe');
        }

        console.log('Saved as preferred recipe');
    } catch (error) {
        console.error('Failed to save preferred recipe:', error);
    }
}

// Retrieve saved recipes for a coffee
async function getSavedRecipesForCoffee(coffeeAnalysis) {
    const coffeeHash = createCoffeeHash(
        coffeeAnalysis.name,
        coffeeAnalysis.roaster,
        coffeeAnalysis.roast_level,
        coffeeAnalysis.origin
    );

    const savedRecipes = [];
    const recipeMap = new Map(); // Use Map to deduplicate by brew_method

    // Try to get from Supabase if authenticated
    if (window.auth && window.auth.isAuthenticated()) {
        try {
            const supabase = window.getSupabase();
            const userId = window.auth.getUserId();

            const { data, error } = await supabase
                .from('saved_recipes')
                .select('*')
                .eq('user_id', userId)
                .eq('coffee_hash', coffeeHash)
                .order('times_brewed', { ascending: false });

            if (!error && data) {
                // Add Supabase recipes to map (these take priority)
                data.forEach(recipe => {
                    recipeMap.set(recipe.brew_method, recipe);
                });
            }
        } catch (error) {
            console.error('Failed to fetch saved recipes from database:', error);
        }
    }

    // Also check localStorage for saved recipes (fallback or for non-authenticated users)
    // Only add if not already in map from Supabase
    try {
        const localRecipes = localStorage.getItem('saved_recipes');
        if (localRecipes) {
            const recipes = JSON.parse(localRecipes);
            const matchingRecipes = recipes.filter(r => r.coffee_hash === coffeeHash);
            matchingRecipes.forEach(recipe => {
                // Only add if not already present from Supabase
                if (!recipeMap.has(recipe.brew_method)) {
                    recipeMap.set(recipe.brew_method, recipe);
                }
            });
        }
    } catch (error) {
        console.error('Failed to fetch saved recipes from localStorage:', error);
    }

    // Convert map values back to array
    return Array.from(recipeMap.values());
}

// Integrate saved recipes into AI recommendations
async function integrateSavedRecipes(analysisData) {
    if (!analysisData || !analysisData.coffee_analysis) {
        return analysisData;
    }

    try {
        const savedRecipes = await getSavedRecipesForCoffee(analysisData.coffee_analysis);

        if (savedRecipes.length === 0) {
            console.log('No saved recipes found for this coffee');
            return analysisData;
        }

        console.log(`Found ${savedRecipes.length} saved recipe(s) for this coffee`);

        // Get the recommended techniques from AI
        const aiTechniques = analysisData.recommended_techniques || [];
        const mergedTechniques = [];

        // Create a map of AI techniques by brew method for easy lookup
        const aiTechniqueMap = {};
        aiTechniques.forEach(tech => {
            aiTechniqueMap[tech.technique_name] = tech;
        });

        // Add saved recipes first (prioritized)
        savedRecipes.forEach(saved => {
            const brewMethod = saved.brew_method;
            const savedRecipe = saved.recipe;

            // Check if AI also recommended this method
            const aiTechnique = aiTechniqueMap[brewMethod];

            // Create a technique object based on saved recipe
            const technique = {
                technique_name: brewMethod,
                reasoning: aiTechnique?.reasoning ||
                    `You previously saved this recipe for this coffee (brewed ${saved.times_brewed || 1} time${saved.times_brewed > 1 ? 's' : ''}). Using your preferred parameters.`,
                parameters: savedRecipe,
                technique_notes: aiTechnique?.technique_notes || '',
                is_saved_recipe: true // Flag to indicate this is a saved recipe
            };

            console.log('Adding saved recipe to techniques:', brewMethod, 'is_saved_recipe:', technique.is_saved_recipe);
            mergedTechniques.push(technique);

            // Remove from AI map so we don't duplicate
            delete aiTechniqueMap[brewMethod];
        });

        // Add remaining AI techniques that weren't in saved recipes
        Object.values(aiTechniqueMap).forEach(tech => {
            mergedTechniques.push({
                ...tech,
                is_saved_recipe: false
            });
        });

        // Update the analysis data with merged techniques
        analysisData.recommended_techniques = mergedTechniques;

        console.log('Integrated saved recipes into recommendations:', mergedTechniques.length, 'total techniques');

    } catch (error) {
        console.error('Failed to integrate saved recipes:', error);
        // Return original data if integration fails
    }

    return analysisData;
}

// Save recipe to localStorage for non-authenticated users
function saveRecipeToLocalStorage(coffeeAnalysis, brewMethod, recipeData) {
    try {
        const coffeeHash = createCoffeeHash(
            coffeeAnalysis.name,
            coffeeAnalysis.roaster,
            coffeeAnalysis.roast_level,
            coffeeAnalysis.origin
        );

        let savedRecipes = [];
        const existing = localStorage.getItem('saved_recipes');
        if (existing) {
            savedRecipes = JSON.parse(existing);
        }

        // Find if this recipe already exists
        const existingIndex = savedRecipes.findIndex(
            r => r.coffee_hash === coffeeHash && r.brew_method === brewMethod
        );

        const recipe = {
            coffee_hash: coffeeHash,
            coffee_name: coffeeAnalysis.name || 'Unknown',
            roaster: coffeeAnalysis.roaster || 'Unknown',
            brew_method: brewMethod,
            recipe: recipeData,
            times_brewed: 1,
            last_brewed: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            // Update existing
            savedRecipes[existingIndex].recipe = recipeData;
            savedRecipes[existingIndex].times_brewed = (savedRecipes[existingIndex].times_brewed || 0) + 1;
            savedRecipes[existingIndex].last_brewed = new Date().toISOString();
        } else {
            // Add new
            savedRecipes.push(recipe);
        }

        localStorage.setItem('saved_recipes', JSON.stringify(savedRecipes));
        console.log('Recipe saved to localStorage');
    } catch (error) {
        console.error('Failed to save recipe to localStorage:', error);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

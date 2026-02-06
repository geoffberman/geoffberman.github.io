// State management
const state = {
    imageData: null,
    imageFile: null,
    equipment: null,
    currentCoffeeAnalysis: null,
    currentBrewMethod: null,
    currentRecipe: null,
    hiddenAiRecommendations: null,
    currentImageHash: null,
    analysisInProgress: false,
    selectedFilters: {},
    currentAbortController: null,
    selectedRecipeData: null,
    recentRecipes: []
};

// Equipment wizard state
let wizardStep = 1;
const WIZARD_TOTAL_STEPS = 4;

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
    // submitFeedbackBtn removed - feedback included with rating actions
    adjustRecipeBtn: document.getElementById('adjust-recipe-btn'),
    adjustmentFeedback: document.getElementById('adjustment-feedback'),
    saveRecipeBtn: document.getElementById('save-recipe-btn'),
    perfectRecipeBtn: document.getElementById('perfect-recipe-btn'),

    // Equipment validation elements
    noGrinder: document.getElementById('no-grinder'),
    otherEquipment: document.getElementById('other-equipment'),
    equipmentRequiredOverlay: document.getElementById('equipment-required-overlay'),
    goToEquipmentBtn: document.getElementById('go-to-equipment-btn'),

    // Saved recipes dropdown elements
    savedRecipesSection: document.getElementById('saved-recipes-section'),
    savedRecipesInput: document.getElementById('saved-recipes-input'),
    savedRecipesDropdown: document.getElementById('saved-recipes-dropdown'),
    loadSavedRecipeBtn: document.getElementById('load-saved-recipe-btn'),
    savedRecipesLoginPrompt: document.getElementById('saved-recipes-login-prompt'),
    signinForRecipesBtn: document.getElementById('signin-for-recipes-btn'),

    // Cancel button
    cancelAnalysisBtn: document.getElementById('cancel-analysis-btn')
};

// Grinder settings mappings
const GRINDER_MAPPINGS = {
    'ceado': {
        patterns: ['ceado', 'e37', 'e37s', 'e37sd', '37sd'],
        scale: '0-8',
        name: 'Ceado 37SD',
        settings: {
            'extra fine': '0-1',
            'fine': '1-2',
            'medium-fine': '2.5-4',
            'medium': '4-5',
            'medium-coarse': '5.5-6.5',
            'coarse': '7-8'
        }
    },
    'baratza-encore': {
        patterns: ['baratza encore', 'encore'],
        scale: '1-40',
        name: 'Baratza Encore',
        settings: {
            'extra fine': '1-8',
            'fine': '8-12',
            'medium-fine': '12-18',
            'medium': '18-24',
            'medium-coarse': '24-28',
            'coarse': '28-32',
            'extra coarse': '32-40'
        }
    },
    'baratza-virtuoso': {
        patterns: ['baratza virtuoso', 'virtuoso'],
        scale: '1-40',
        name: 'Baratza Virtuoso',
        settings: {
            'extra fine': '1-8',
            'fine': '8-12',
            'medium-fine': '12-18',
            'medium': '18-24',
            'medium-coarse': '24-28',
            'coarse': '28-32',
            'extra coarse': '32-40'
        }
    },
    'comandante': {
        patterns: ['comandante'],
        scale: '0-50 clicks',
        name: 'Comandante',
        settings: {
            'extra fine': '10-15',
            'fine': '15-20',
            'medium-fine': '20-25',
            'medium': '25-30',
            'medium-coarse': '30-35',
            'coarse': '35-40',
            'extra coarse': '40-50'
        }
    },
    '1zpresso': {
        patterns: ['1zpresso', 'zpresso', 'jx', 'j-max', 'k-max'],
        scale: '0-90 clicks',
        name: '1Zpresso',
        settings: {
            'extra fine': '10-20',
            'fine': '20-30',
            'medium-fine': '30-45',
            'medium': '45-55',
            'medium-coarse': '55-65',
            'coarse': '65-75',
            'extra coarse': '75-90'
        }
    }
};

// Function to detect grinder type from user's grinder name
function detectGrinderType(grinderName) {
    if (!grinderName) return null;

    const lowerName = grinderName.toLowerCase();

    for (const [key, config] of Object.entries(GRINDER_MAPPINGS)) {
        if (config.patterns.some(pattern => lowerName.includes(pattern))) {
            return config;
        }
    }

    return null;
}

// Function to format grind size with specific grinder setting
function formatGrindSize(grindSize, userGrinder) {
    if (!grindSize) return '';

    // If grind size already contains a parenthetical grinder setting, return as-is
    if (grindSize.includes('(') && grindSize.includes(')')) {
        return grindSize;
    }

    const grinderConfig = detectGrinderType(userGrinder);
    if (!grinderConfig) {
        return grindSize; // Return original if no grinder mapping found
    }

    // Extract the descriptive grind size from the input
    // Handle cases like "Medium-fine" or "Medium-fine, setting 15"
    const lowerGrindSize = grindSize.toLowerCase();

    // Try to match known grind descriptors
    let matchedDescriptor = null;
    let setting = null;

    for (const descriptor of Object.keys(grinderConfig.settings)) {
        if (lowerGrindSize.includes(descriptor)) {
            matchedDescriptor = descriptor;
            setting = grinderConfig.settings[descriptor];
            break;
        }
    }

    if (matchedDescriptor && setting) {
        // Use original case from input, removing any trailing grinder-specific text
        const displayDescriptor = grindSize.split(',')[0].trim();
        return `${displayDescriptor} (${grinderConfig.name}: ${setting})`;
    }

    return grindSize; // Return original if no match found
}

// Utility: Escape HTML to prevent XSS and formatting issues
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fetch user's most recent saved recipes (across all coffees)
async function getRecentSavedRecipes(limit = 5) {
    let allRecipes = [];

    // Try Supabase if authenticated
    if (window.auth && window.auth.isAuthenticated()) {
        try {
            const supabase = window.getSupabase();
            const userId = window.auth.getUserId();

            // Fetch more recipes than limit to ensure we get unique coffee+method combos
            const { data, error } = await supabase
                .from('saved_recipes')
                .select('*')
                .eq('user_id', userId)
                .order('last_brewed', { ascending: false })
                .limit(limit * 5); // Fetch more to account for duplicates

            if (!error && data) {
                allRecipes.push(...data);
            }
        } catch (error) {
            console.error('Failed to fetch recent recipes from database:', error);
        }
    }

    // Also load localStorage recipes (may have more recent data if Supabase save failed)
    let localRecipeMap = new Map();
    try {
        const localRecipes = localStorage.getItem('saved_recipes');
        if (localRecipes) {
            const parsed = JSON.parse(localRecipes);
            parsed.forEach(r => {
                const key = `${r.coffee_hash}_${r.brew_method}`;
                localRecipeMap.set(key, r);
            });
            // If no Supabase results, use localStorage as primary source
            if (allRecipes.length === 0) {
                parsed.sort((a, b) => new Date(b.last_brewed) - new Date(a.last_brewed));
                allRecipes.push(...parsed);
            }
        }
    } catch (error) {
        console.error('Failed to fetch recent recipes from localStorage:', error);
    }

    // Deduplicate by coffee_hash + brew_method, keeping only the most recent
    const uniqueRecipes = new Map();
    for (const recipe of allRecipes) {
        const key = `${recipe.coffee_hash}_${recipe.brew_method}`;
        if (!uniqueRecipes.has(key)) {
            // Merge notes from localStorage if Supabase recipe is missing them
            const localRecipe = localRecipeMap.get(key);
            if (localRecipe) {
                const recipeParams = recipe.recipe || {};
                const localParams = localRecipe.recipe || {};
                // If Supabase recipe params don't have notes but localStorage does, merge them
                if (!recipeParams.notes && localParams.notes) {
                    if (typeof recipe.recipe === 'object' && recipe.recipe !== null) {
                        recipe.recipe.notes = localParams.notes;
                    }
                }
                // Also check top-level notes field (old format)
                if (!recipeParams.notes && !recipe.notes && localRecipe.notes) {
                    if (typeof recipe.recipe === 'object' && recipe.recipe !== null) {
                        recipe.recipe.notes = localRecipe.notes;
                    }
                }
            }
            uniqueRecipes.set(key, recipe);
        }
    }

    // Convert Map values to array, sort by last_brewed, and limit
    const recipes = Array.from(uniqueRecipes.values())
        .sort((a, b) => new Date(b.last_brewed) - new Date(a.last_brewed))
        .slice(0, limit);

    return recipes;
}

// Populate the saved recipes dropdown with recent recipes
async function populateSavedRecipesDropdown() {
    const section = elements.savedRecipesSection;
    const loginPrompt = elements.savedRecipesLoginPrompt;

    // Check if user is logged in
    if (!window.auth || !window.auth.isAuthenticated()) {
        // Check localStorage for recipes
        const localRecipes = localStorage.getItem('saved_recipes');
        if (!localRecipes || JSON.parse(localRecipes).length === 0) {
            section.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
            return;
        }
    }

    // Fetch recent recipes
    const recipes = await getRecentSavedRecipes(5);

    if (recipes.length === 0) {
        section.classList.add('hidden');
        loginPrompt.classList.add('hidden');
        return;
    }

    // Store recent recipes for quick access on focus
    state.recentRecipes = recipes;

    // Show the dropdown section
    section.classList.remove('hidden');
    loginPrompt.classList.add('hidden');
}

// Search saved recipes by coffee name
async function searchSavedRecipes(query) {
    // Try Supabase first
    if (window.auth && window.auth.isAuthenticated()) {
        try {
            const supabase = window.getSupabase();
            const userId = window.auth.getUserId();
            const { data, error } = await supabase
                .from('saved_recipes')
                .select('*')
                .eq('user_id', userId)
                .ilike('coffee_name', `%${query}%`)
                .order('last_brewed', { ascending: false })
                .limit(1000);
            if (!error && data && data.length > 0) return data;
        } catch (err) {
            console.error('Search failed:', err);
        }
    }

    // Fallback to localStorage
    try {
        const localRecipes = localStorage.getItem('saved_recipes');
        if (localRecipes) {
            const parsed = JSON.parse(localRecipes);
            return parsed.filter(r =>
                r.coffee_name && r.coffee_name.toLowerCase().includes(query.toLowerCase())
            ).sort((a, b) => new Date(b.last_brewed) - new Date(a.last_brewed));
        }
    } catch (err) {
        console.error('Local search failed:', err);
    }
    return [];
}

// Render recipe items in the searchable dropdown
function renderRecipeDropdownItems(recipes) {
    const dropdown = elements.savedRecipesDropdown;
    if (!recipes || recipes.length === 0) {
        dropdown.innerHTML = '<div style="padding: 12px; color: var(--secondary-color); font-size: 0.85rem; text-align: center;">No recipes found</div>';
        return;
    }

    dropdown.innerHTML = recipes.map((recipe, index) => {
        let label = recipe.coffee_name && recipe.coffee_name !== 'Unknown'
            ? recipe.coffee_name : 'Coffee Recipe';
        label += ` - ${recipe.brew_method}`;

        let meta = '';
        if (recipe.roaster && recipe.roaster !== 'Unknown') {
            meta += recipe.roaster;
        }
        if (recipe.times_brewed && recipe.times_brewed > 1) {
            meta += meta ? ` · ${recipe.times_brewed}x brewed` : `${recipe.times_brewed}x brewed`;
        }

        return `<div class="recipe-option" data-recipe-index="${index}">
            <div>${label}</div>
            ${meta ? `<div class="recipe-meta">${meta}</div>` : ''}
        </div>`;
    }).join('');

    // Add click handlers
    dropdown.querySelectorAll('.recipe-option').forEach((el, idx) => {
        el.addEventListener('click', () => {
            const recipe = recipes[idx];
            let label = recipe.coffee_name && recipe.coffee_name !== 'Unknown'
                ? recipe.coffee_name : 'Coffee Recipe';
            label += ` - ${recipe.brew_method}`;
            elements.savedRecipesInput.value = label;
            state.selectedRecipeData = recipe;
            elements.loadSavedRecipeBtn.disabled = false;
            elements.savedRecipesDropdown.classList.add('hidden');
        });
    });
}

// Load a saved recipe directly without uploading a photo
async function loadSavedRecipeDirectly(recipeData) {
    try {
        // Reconstruct the coffee analysis from saved data
        // Preserve the original coffee_hash so re-saves update the same entry
        const coffeeAnalysis = {
            coffee_hash: recipeData.coffee_hash,
            name: recipeData.coffee_name || 'Unknown',
            roaster: recipeData.roaster || 'Unknown',
            roast_level: recipeData.roast_level || 'Unknown',
            origin: recipeData.origin || 'Unknown',
            processing: recipeData.processing || 'Unknown',
            flavor_notes: recipeData.flavor_notes || []
        };

        // Ensure notes are inside recipe params (migrate from old separate notes field)
        const recipeParams = recipeData.recipe || {};
        if (!recipeParams.notes && recipeData.notes) {
            recipeParams.notes = recipeData.notes;
        }

        console.log('[LOAD] Loading saved recipe:', recipeData.coffee_name, '-', recipeData.brew_method);
        console.log('[LOAD] recipeData.recipe:', JSON.stringify(recipeData.recipe));
        console.log('[LOAD] recipeParams.notes:', JSON.stringify(recipeParams.notes));
        console.log('[LOAD] recipeData.notes (top-level):', JSON.stringify(recipeData.notes));

        // Ensure recipe field is parsed if it was stored as a string
        if (typeof recipeData.recipe === 'string') {
            try {
                const parsed = JSON.parse(recipeData.recipe);
                Object.assign(recipeParams, parsed);
                console.log('[LOAD] Parsed recipe string into object, notes:', parsed.notes);
            } catch (e) {
                console.error('[LOAD] Failed to parse recipe string:', e);
            }
        }

        // Create analysis data structure matching API response format
        const analysisData = {
            coffee_analysis: coffeeAnalysis,
            recommended_techniques: [
                {
                    technique_name: recipeData.brew_method,
                    reasoning: `This is your saved recipe for this coffee. You've brewed it ${recipeData.times_brewed || 1} time${recipeData.times_brewed > 1 ? 's' : ''}.`,
                    parameters: recipeParams,
                    technique_notes: '',
                    is_saved_recipe: true
                }
            ]
        };

        // Update state
        state.currentCoffeeAnalysis = coffeeAnalysis;
        state.currentBrewMethod = recipeData.brew_method;
        state.currentRecipe = recipeData.recipe;
        state.imageData = null; // No image for saved recipes
        state.imageFile = null;

        // Display results
        displayResults(analysisData);
        showSection('results');

        console.log('Loaded saved recipe:', recipeData.coffee_name, '-', recipeData.brew_method);
    } catch (error) {
        console.error('Failed to load saved recipe:', error);
        showError('Failed to load saved recipe. Please try again.');
    }
}

// Initialize app
async function init() {
    setupEventListeners();
    initWizard();

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

    // Load saved recipes dropdown
    await populateSavedRecipesDropdown();

}

// Handle auth state changes
function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN') {
        hideAuthModal();
        showUserProfile();
        hideSignInButton();
        migrateLocalStorageToDatabase();
        loadEquipmentFromDatabase();
        // Refresh saved recipes dropdown after sign in
        populateSavedRecipesDropdown();
    } else if (event === 'SIGNED_OUT') {
        hideUserProfile();
        showSignInButton();
        // Update saved recipes dropdown after sign out
        populateSavedRecipesDropdown();
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

    // Custom filter toggle
    const otherFilterToggle = document.getElementById('other-filter-toggle');
    const customFilterInput = document.getElementById('custom-filter-input');
    const addCustomFilterBtn = document.getElementById('add-custom-filter');

    otherFilterToggle.addEventListener('change', () => {
        if (otherFilterToggle.checked) {
            customFilterInput.classList.remove('hidden');
            addCustomFilterBtn.classList.remove('hidden');
            customFilterInput.focus();
        } else {
            customFilterInput.classList.add('hidden');
            addCustomFilterBtn.classList.add('hidden');
            customFilterInput.value = '';
        }
    });

    // Add custom filter
    addCustomFilterBtn.addEventListener('click', () => {
        const filterName = customFilterInput.value.trim();
        if (filterName) {
            addCustomFilter(filterName);
            customFilterInput.value = '';
            otherFilterToggle.checked = false;
            customFilterInput.classList.add('hidden');
            addCustomFilterBtn.classList.add('hidden');
        }
    });

    // Allow Enter key to add custom filter
    customFilterInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomFilterBtn.click();
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

    // Saved recipes searchable input
    let searchDebounceTimer = null;
    elements.savedRecipesInput.addEventListener('focus', () => {
        if (state.recentRecipes.length > 0) {
            renderRecipeDropdownItems(state.recentRecipes);
            elements.savedRecipesDropdown.classList.remove('hidden');
        }
    });

    elements.savedRecipesInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchDebounceTimer);
        state.selectedRecipeData = null;
        elements.loadSavedRecipeBtn.disabled = true;

        if (query.length < 2) {
            renderRecipeDropdownItems(state.recentRecipes);
            elements.savedRecipesDropdown.classList.remove('hidden');
            return;
        }

        searchDebounceTimer = setTimeout(async () => {
            const results = await searchSavedRecipes(query);
            renderRecipeDropdownItems(results);
            elements.savedRecipesDropdown.classList.remove('hidden');
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#saved-recipes-input') && !e.target.closest('#saved-recipes-dropdown')) {
            elements.savedRecipesDropdown.classList.add('hidden');
        }
    });

    elements.loadSavedRecipeBtn.addEventListener('click', () => {
        if (state.selectedRecipeData) {
            loadSavedRecipeDirectly(state.selectedRecipeData);
        }
    });

    // Cancel analysis button
    elements.cancelAnalysisBtn.addEventListener('click', () => {
        if (state.currentAbortController) {
            state.currentAbortController.abort();
        }
    });

    elements.signinForRecipesBtn.addEventListener('click', () => {
        showAuthModal();
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

// Compress image client-side before upload to reduce payload size
async function compressImage(file, maxDimension = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        // Skip compression for small files (under 500KB)
        if (file.size < 500 * 1024) {
            console.log(`[IMG] File is ${(file.size / 1024).toFixed(0)}KB, skipping compression`);
            resolve(file);
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;

            // Scale down if larger than maxDimension
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round(height * (maxDimension / width));
                    width = maxDimension;
                } else {
                    width = Math.round(width * (maxDimension / height));
                    height = maxDimension;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                const compressed = new File([blob], file.name, { type: 'image/jpeg' });
                const ratio = ((1 - compressed.size / file.size) * 100).toFixed(0);
                console.log(`[IMG] Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (${ratio}% reduction, ${width}x${height})`);
                resolve(compressed);
            }, 'image/jpeg', quality);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            console.warn('[IMG] Compression failed, using original');
            resolve(file);
        };
        img.src = url;
    });
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

    // Prevent duplicate requests
    if (state.analysisInProgress) {
        console.log('Analysis already in progress, ignoring duplicate request');
        return;
    }

    // Check if equipment is properly configured
    if (!state.equipment || !hasEquipment()) {
        showError('Please set up your equipment first before analyzing coffee. Click "Set Up Equipment" below to get started.');
        return;
    }

    state.analysisInProgress = true;
    showSection('loading');

    try {
        // Compress image before upload to reduce payload
        const compressedFile = await compressImage(state.imageFile);
        const base64Image = await getBase64Image(compressedFile);
        const mediaType = compressedFile.type;

        // Create image hash for caching
        const imageHash = await createImageHash(base64Image);

        // Store image hash in state for saving recipes later (must be set before early return)
        state.currentImageHash = imageHash;

        // Check if we have cached analysis for this exact image
        const cachedData = await checkCachedAnalysis(imageHash);
        if (cachedData && !specificMethod) {
            console.log('Using cached analysis for this image');
            displayResults(cachedData);
            showSection('results');
            return;
        }

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

        // Add selected filter type if available (for pour-over recipe tailoring)
        const filterType = getSelectedFilterType();
        if (filterType) {
            requestBody.selectedFilterType = filterType;
        }

        state.currentAbortController = new AbortController();

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: safeJsonStringify(requestBody),
            signal: state.currentAbortController.signal
        });

        await handleApiResponse(response);

        const data = await response.json();
        const analysisText = data.content[0].text;

        console.log('Raw AI response:', analysisText);

        // Parse the JSON response
        let analysisData;
        try {
            // Try multiple extraction methods
            let jsonStr = null;

            // Method 1: Extract from markdown code blocks
            const codeBlockMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1];
                console.log('Extracted JSON from code block');
            }

            // Method 2: Find JSON object directly
            if (!jsonStr) {
                const directMatch = analysisText.match(/\{[\s\S]*\}/);
                if (directMatch) {
                    jsonStr = directMatch[0];
                    console.log('Extracted JSON directly');
                }
            }

            // Method 3: Try parsing the entire response as JSON
            if (!jsonStr) {
                jsonStr = analysisText.trim();
                console.log('Attempting to parse entire response as JSON');
            }

            if (jsonStr) {
                analysisData = JSON.parse(jsonStr);
                console.log('Successfully parsed JSON:', analysisData);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            // If JSON parsing fails, create a fallback structure
            console.error('JSON parsing failed:', parseError);
            console.error('Failed text:', analysisText);
            analysisData = parseFallbackResponse(analysisText);
        }

        // Cache the analysis data (in localStorage for now)
        if (!specificMethod) {
            try {
                const cacheKey = `analysis_cache_${imageHash}`;
                const cacheData = {
                    coffee_analysis: analysisData.coffee_analysis,
                    recommended_techniques: analysisData.recommended_techniques,
                    timestamp: Date.now()
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            } catch (error) {
                console.error('Failed to cache analysis:', error);
            }
        }

        // Check for saved recipes and integrate them into recommendations
        analysisData = await integrateSavedRecipes(analysisData);

        displayResults(analysisData);
        showSection('results');

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Analysis cancelled by user');
            showSection('preview');
            return;
        }
        console.error('Analysis error:', error);
        showError(`Failed to analyze image: ${error.message}`);
    } finally {
        state.analysisInProgress = false;
        state.currentAbortController = null;
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
    state.currentRecipe = techniques[0]?.parameters || {};

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
            <div class="technique-card" data-technique-index="${index}" style="border: 2px solid ${technique.is_saved_recipe ? 'var(--success-color)' : 'var(--border-color)'}; border-radius: 8px; padding: 20px; background: ${technique.is_saved_recipe ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'white'}; display: flex; flex-direction: column; justify-content: center;">
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

                ${isPourOver(technique.technique_name) && hasFilters() ? `
                    <div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border: 2px solid var(--success-color); border-radius: 8px;">
                        <label style="display: block; font-weight: bold; color: var(--primary-color); margin-bottom: 6px; font-size: 0.85rem;">Filter Type:</label>
                        <select class="filter-selector" data-technique-index="${index}" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem;">
                            ${getFilterOptions(params.filter_type || null)}
                        </select>
                        <small style="display: block; margin-top: 6px; color: var(--secondary-color); font-size: 0.75rem;">Filter type affects extraction and flavor profile</small>
                    </div>
                ` : ''}

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
                                <td>${formatGrindSize(params.grind_size, state.equipment?.grinder)}</td>
                                <td class="adjustment-column hidden"><input type="text" class="param-input" data-param="grind_size" placeholder="Your grind" value="${formatGrindSize(params.grind_size, state.equipment?.grinder)}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
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
                            ${isPourOver(technique.technique_name) && hasFilters() ? `<tr>
                                <td>Filter Type</td>
                                <td>${params.filter_type || 'Not set'}</td>
                                <td class="adjustment-column hidden">
                                    <select class="param-input" data-param="filter_type" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;">
                                        <option value="">Select filter...</option>
                                        ${getFilterOptions(params.filter_type || null)}
                                    </select>
                                </td>
                            </tr>` : ''}
                            <tr>
                                <td>Notes</td>
                                <td style="white-space: pre-wrap;">${params.notes || ''}</td>
                                <td class="adjustment-column hidden"><textarea class="param-input" data-param="notes" rows="3" placeholder="How did it taste? Any observations..." style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; resize: vertical;">${params.notes || ''}</textarea></td>
                            </tr>
                        </tbody>
                    </table>

                    <div id="save-adjustments-${index}" class="hidden" style="margin-top: 20px;">
                        <div style="text-align: center;">
                            <button class="btn btn-primary save-adjustments-btn" data-technique-index="${index}" style="min-width: 200px;">
                                💾 Save My Adjustments
                            </button>
                        </div>
                    </div>

                    ${technique.technique_notes ? `<div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-left: 3px solid var(--accent-color); border-radius: 4px;">
                        <div style="margin: 0; line-height: 1.6; color: var(--secondary-color); font-size: 0.9rem;">${technique.technique_notes
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/^• (.*?)$/gm, '<li style="margin: 0; padding: 0; line-height: 1.0;">$1</li>')
                            .replace(/(<li.*?<\/li>\n?)+/gs, match => `<ul style="margin: 0; margin-bottom: 0; padding-left: 20px; list-style-position: outside; line-height: 1.0;">${match.replace(/\n/g, '')}</ul>`)
                            .replace(/\n\n/g, '</p><p style="margin: 10px 0;">')
                            .replace(/\n/g, '<br>')
                            .replace(/<br>\s*<ul/g, '<ul')
                        }</div>
                    </div>` : ''}
                </div>
            </div>
        `;
    });

    // Add button to reveal AI recommendations if they were hidden
    if (data.has_hidden_ai_recommendations) {
        techniquesHTML += `
            <div id="reveal-ai-btn-container" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                <div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border: 2px solid var(--success-color); border-radius: 12px; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <p style="margin: 0 0 15px 0; color: var(--secondary-color); font-size: 0.95rem; line-height: 1.5;">
                        💾 <strong>Using your saved recipe${techniques.length > 1 ? 's' : ''}!</strong><br>
                        Want to try a different brew method? We can generate AI recommendations.
                    </p>
                    <button id="reveal-ai-recommendations-btn" class="btn btn-primary" style="font-size: 0.95rem; padding: 12px 24px;">
                        🤖 Show AI Recommendations
                    </button>
                </div>
            </div>
        `;
    }

    techniquesHTML += '</div>';

    elements.methodContent.innerHTML = techniquesHTML;

    // Store hidden AI recommendations in state for later reveal
    if (data.has_hidden_ai_recommendations) {
        state.hiddenAiRecommendations = data.hidden_ai_recommendations;
    }

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

    // Add event listeners for filter selectors
    document.querySelectorAll('.filter-selector').forEach(select => {
        select.addEventListener('change', function() {
            const techniqueIndex = parseInt(this.getAttribute('data-technique-index'));
            const selectedFilter = this.value;
            console.log(`Filter selected for technique ${techniqueIndex}: ${selectedFilter}`);
            // Store in state for later use
            if (!state.selectedFilters) {
                state.selectedFilters = {};
            }
            state.selectedFilters[techniqueIndex] = selectedFilter;
            // Also update the param-input filter select in the adjustment table
            const paramInput = document.querySelector(`#recipe-table-${techniqueIndex} .param-input[data-param="filter_type"]`);
            if (paramInput) {
                paramInput.value = selectedFilter;
            }
            // Show prompt to update recipe for this filter
            showFilterUpdatePrompt(techniqueIndex, selectedFilter);
        });
    });

    // Add event listener for reveal AI recommendations button
    const revealBtn = document.getElementById('reveal-ai-recommendations-btn');
    if (revealBtn) {
        revealBtn.addEventListener('click', () => {
            revealAiRecommendations();
        });
    }
}

// Reveal hidden AI recommendations
function revealAiRecommendations() {
    if (!state.hiddenAiRecommendations || state.hiddenAiRecommendations.length === 0) {
        console.log('No hidden AI recommendations to reveal');
        return;
    }

    console.log(`Revealing ${state.hiddenAiRecommendations.length} hidden AI recommendation(s)`);

    // Get current techniques (saved recipes) and append hidden AI recommendations
    const currentTechniques = state.currentCoffeeAnalysis.recommended_techniques || [];
    const allTechniques = [...currentTechniques, ...state.hiddenAiRecommendations];

    // Update state with all techniques
    state.currentCoffeeAnalysis.recommended_techniques = allTechniques;
    state.currentRecipe.recommended_techniques = allTechniques;

    // Clear hidden recommendations from state
    delete state.hiddenAiRecommendations;

    // Re-render the results with all techniques
    const updatedData = {
        coffee_analysis: state.currentCoffeeAnalysis,
        recommended_techniques: allTechniques,
        has_hidden_ai_recommendations: false // No longer hiding anything
    };

    displayResults(updatedData);
}

// Show error
function showError(message) {
    elements.errorMessage.textContent = message;
    showSection('error');
}

// Reusable API response handler with rate limit parsing
// Recursively sanitize all string values to remove control characters before JSON.stringify
function sanitizeValue(val) {
    if (typeof val === 'string') {
        // Remove all control characters (0x00-0x1F) except tab, newline, carriage return
        // Then replace remaining whitespace chars with spaces
        return val.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
                  .replace(/[\t\n\r]+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
    }
    if (Array.isArray(val)) {
        return val.map(sanitizeValue);
    }
    if (val && typeof val === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(val)) {
            result[k] = sanitizeValue(v);
        }
        return result;
    }
    return val;
}

function safeJsonStringify(obj) {
    return JSON.stringify(sanitizeValue(obj));
}

async function handleApiResponse(response) {
    if (response.ok) return response;
    if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const minutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 5;
        throw new Error(`Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed (${response.status})`);
}

// Reset app
function resetApp() {
    // Reload the page to ensure proper initialization and saved recipe detection
    window.location.reload();
}

// Equipment management functions
async function saveEquipment() {
    const equipment = {
        espressoMachine: document.getElementById('espresso-machine').value.trim(),
        flowControl: document.getElementById('flow-control').checked,
        pourOver: Array.from(document.querySelectorAll('input[name="pour-over"]:checked')).map(cb => cb.value),
        filters: Array.from(document.querySelectorAll('input[name="filters"]:checked')).map(cb => cb.value),
        customFilters: Array.from(document.querySelectorAll('input[name="custom-filters"]:checked')).map(cb => cb.value),
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
                (equipment.customBrewMethods && equipment.customBrewMethods.length > 0) ||
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

                equipment.filters?.forEach(value => {
                    const checkbox = document.querySelector(`input[name="filters"][value="${value}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                // Render and check custom filters
                if (equipment.customFilters && equipment.customFilters.length > 0) {
                    renderCustomFilters(equipment.customFilters);
                }

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
        'Latte',
        'V60 Pour Over',
        'Chemex',
        'French Press',
        'Aeropress',
        'Moka Pot',
        'Cold Brew',
        'Kalita Wave',
        'Oxo Rapid Brew Cup (Soup)'
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
        'Moka Pot',
        'Oxo Rapid Brew Cup (Soup)'
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

        // Clear custom filters display
        const customFiltersContainer = document.getElementById('custom-filters');
        if (customFiltersContainer) {
            customFiltersContainer.innerHTML = '';
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

function addCustomFilter(filterName) {
    // Get current custom filters from localStorage or initialize empty array
    const savedEquipment = localStorage.getItem('coffee_equipment');
    const equipment = savedEquipment ? JSON.parse(savedEquipment) : {};

    if (!equipment.customFilters) {
        equipment.customFilters = [];
    }

    // Check if filter already exists
    if (equipment.customFilters.includes(filterName)) {
        alert('This filter type already exists!');
        return;
    }

    // Add the new filter
    equipment.customFilters.push(filterName);

    // Save to localStorage
    localStorage.setItem('coffee_equipment', JSON.stringify(equipment));
    state.equipment = equipment;

    // Render the updated list
    renderCustomFilters(equipment.customFilters);

    console.log('Added custom filter:', filterName);
}

// Render custom filters as checkboxes
function renderCustomFilters(customFilters) {
    const container = document.getElementById('custom-filters');
    if (!container) return;

    container.innerHTML = '';

    customFilters.forEach(filter => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'custom-filters';
        checkbox.value = filter;
        checkbox.checked = true; // Auto-check newly added filters

        const text = document.createTextNode(filter);

        // Add a small remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.style.cssText = 'margin-left: auto; padding: 2px 6px; font-size: 1.2rem; color: #C74B50; background: none; border: 1px solid #C74B50; border-radius: 3px; cursor: pointer; line-height: 1;';
        removeBtn.title = 'Remove this filter';
        removeBtn.onclick = () => removeCustomFilter(filter);

        label.appendChild(checkbox);
        label.appendChild(text);
        label.appendChild(removeBtn);
        container.appendChild(label);
    });
}

// Remove a custom filter
function removeCustomFilter(filterName) {
    if (!confirm(`Remove "${filterName}" from your filters?`)) {
        return;
    }

    const savedEquipment = localStorage.getItem('coffee_equipment');
    const equipment = savedEquipment ? JSON.parse(savedEquipment) : {};

    if (equipment.customFilters) {
        equipment.customFilters = equipment.customFilters.filter(f => f !== filterName);
        localStorage.setItem('coffee_equipment', JSON.stringify(equipment));
        state.equipment = equipment;
        renderCustomFilters(equipment.customFilters);
        console.log('Removed custom filter:', filterName);
    }
}

// Helper function to check if a technique is pour over
function isPourOver(techniqueName) {
    const pourOverKeywords = ['v60', 'chemex', 'kalita', 'pour over', 'bee house', 'melitta'];
    return pourOverKeywords.some(keyword => techniqueName.toLowerCase().includes(keyword));
}

// Helper function to check if user has filters
function hasFilters() {
    return state.equipment && ((state.equipment.filters && state.equipment.filters.length > 0) || (state.equipment.customFilters && state.equipment.customFilters.length > 0));
}

// Helper function to get filter options HTML
function getFilterOptions(selectedValue = null) {
    const allFilters = [...(state.equipment?.filters || []), ...(state.equipment?.customFilters || [])];
    if (allFilters.length === 0) return '<option>No filters configured</option>';

    let options = '';
    allFilters.forEach(filter => {
        const selected = selectedValue && filter === selectedValue ? ' selected' : '';
        options += `<option value="${filter}"${selected}>${filter}</option>`;
    });
    return options;
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

    if ((state.equipment.filters && state.equipment.filters.length > 0) || (state.equipment.customFilters && state.equipment.customFilters.length > 0)) {
        const allFilters = [...(state.equipment.filters || []), ...(state.equipment.customFilters || [])];
        parts.push(`Filters: ${allFilters.join(', ')}`);
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

function getSelectedFilterType() {
    // Get filter from the active technique's filter selector dropdown
    const idx = state.activeTechniqueIndex;
    if (idx != null) {
        const selector = document.querySelector(`.filter-selector[data-technique-index="${idx}"]`);
        if (selector && selector.value) return selector.value;
        if (state.selectedFilters && state.selectedFilters[idx]) return state.selectedFilters[idx];
    }
    // Fallback: check if any filter selector has a value
    const anySelector = document.querySelector('.filter-selector');
    if (anySelector && anySelector.value) return anySelector.value;
    return null;
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

    if ((state.equipment.filters && state.equipment.filters.length > 0) || (state.equipment.customFilters && state.equipment.customFilters.length > 0)) {
        const allFilters = [...(state.equipment.filters || []), ...(state.equipment.customFilters || [])];
        summaryHTML += `
            <div class="equipment-summary-item">
                <strong>Coffee Filters</strong>
                <span>${allFilters.join(', ')}</span>
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
    wizardStep = 1;
    updateWizardUI();
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
                filters: data.filters || [],
                customFilters: data.custom_filters || [],
                podMachines: data.pod_machines || [],
                grinder: data.grinder || '',
                noGrinder: data.no_grinder || false,
                otherMethods: data.other_methods || [],
                customBrewMethods: data.custom_brew_methods || [],
                otherEquipment: data.other_equipment || '',
                additionalEquipment: data.additional_equipment || ''
            };

            // Merge filter data from localStorage if database doesn't have it
            // (handles case where database schema doesn't have filters/custom_filters columns yet)
            try {
                const localEquipment = JSON.parse(localStorage.getItem('coffee_equipment') || '{}');
                if ((!state.equipment.filters || state.equipment.filters.length === 0) && localEquipment.filters && localEquipment.filters.length > 0) {
                    state.equipment.filters = localEquipment.filters;
                }
                if ((!state.equipment.customFilters || state.equipment.customFilters.length === 0) && localEquipment.customFilters && localEquipment.customFilters.length > 0) {
                    state.equipment.customFilters = localEquipment.customFilters;
                }
            } catch (e) {
                console.error('Failed to merge localStorage filter data:', e);
            }

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

            state.equipment.filters.forEach(value => {
                const checkbox = document.querySelector(`input[name="filters"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Render and check custom brew methods
            if (state.equipment.customBrewMethods && state.equipment.customBrewMethods.length > 0) {
                renderCustomBrewMethods(state.equipment.customBrewMethods);
            }

            // Render and check custom filters
            if (state.equipment.customFilters && state.equipment.customFilters.length > 0) {
                renderCustomFilters(state.equipment.customFilters);
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
            filters: equipment.filters || [],
            custom_filters: equipment.customFilters || [],
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

// Thin wrapper — delegates to saveAsPreferredRecipeWithData using current state
async function saveAsPreferredRecipe(notes = null) {
    return saveAsPreferredRecipeWithData(state.currentBrewMethod, state.currentRecipe, notes);
}

function createCoffeeHash(name, roaster, roastLevel, origin) {
    // Simple hash function - concatenate and create a simple hash
    const str = `${name || ''}_${roaster || ''}_${roastLevel || ''}_${origin || ''}`.toLowerCase();
    return str.replace(/\s+/g, '_');
}

// Create a hash from image data for caching
async function createImageHash(base64Image) {
    // Use SubtleCrypto to create SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(base64Image.substring(0, 10000)); // Use first 10k chars for performance
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Check if we have cached analysis for this image
async function checkCachedAnalysis(imageHash) {
    // Check Supabase if authenticated
    if (window.auth && window.auth.isAuthenticated()) {
        try {
            const supabase = window.getSupabase();
            const userId = window.auth.getUserId();

            const { data, error } = await supabase
                .from('saved_recipes')
                .select('*')
                .eq('user_id', userId)
                .eq('image_hash', imageHash)
                .order('updated_at', { ascending: false })
                .limit(10); // Get up to 10 recipes for this image

            if (!error && data && data.length > 0) {
                console.log(`Found ${data.length} saved recipe(s) for this image`);

                // Reconstruct analysis data from saved recipes
                const firstRecipe = data[0];
                const coffeeAnalysis = {
                    name: firstRecipe.coffee_name,
                    roaster: firstRecipe.roaster,
                    roast_level: firstRecipe.roast_level,
                    origin: firstRecipe.origin,
                    flavor_notes: firstRecipe.flavor_notes || [],
                    processing: firstRecipe.processing || 'Unknown'
                };

                // Convert saved recipes to technique format
                const techniques = data.map(recipe => ({
                    technique_name: recipe.brew_method,
                    reasoning: `You previously saved this recipe for this coffee (brewed ${recipe.times_brewed || 1} time${recipe.times_brewed > 1 ? 's' : ''}).`,
                    parameters: recipe.recipe,
                    technique_notes: '',
                    is_saved_recipe: true
                }));

                return {
                    coffee_analysis: coffeeAnalysis,
                    recommended_techniques: techniques
                };
            }
        } catch (error) {
            console.error('Failed to check cached analysis:', error);
        }
    }

    // Check localStorage as fallback
    try {
        const cacheKey = `analysis_cache_${imageHash}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log('Found cached analysis in localStorage');
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Failed to check localStorage cache:', error);
    }

    return null;
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
            body: safeJsonStringify({
                equipment: equipmentDescription,
                currentBrewMethod: state.currentBrewMethod,
                selectedFilterType: getSelectedFilterType(),
                adjustmentRequest: adjustmentGuidance,
                previousAnalysis: {
                    name: state.currentCoffeeAnalysis.name || 'Unknown',
                    roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
                    roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
                    origin: state.currentCoffeeAnalysis.origin || 'Unknown',
                    processing: state.currentCoffeeAnalysis.processing || 'Unknown'
                }
            })
        });

        await handleApiResponse(response);

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
                        <td>${formatGrindSize(params.grind_size, state.equipment?.grinder)}</td>
                        <td><input type="text" class="param-input" data-param="grind_size" placeholder="Your grind" value="${formatGrindSize(params.grind_size, state.equipment?.grinder)}"></td>
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

            <div style="margin-top: 20px;">
                <div style="margin-bottom: 15px;">
                    <label for="adjusted-recipe-notes" style="display: block; font-weight: bold; color: var(--primary-color); margin-bottom: 8px; font-size: 0.9rem;">Notes (optional)</label>
                    <textarea id="adjusted-recipe-notes" rows="3" placeholder="What changed? How did it taste? Any observations..." style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; resize: vertical; font-size: 0.85rem;"></textarea>
                    <small style="color: var(--secondary-color); font-size: 0.75rem; display: block; margin-top: 4px;">These notes will appear when you load this recipe in the future</small>
                </div>
                <div style="text-align: center;">
                    <button id="save-adjusted-recipe-btn" class="btn btn-primary" style="background: #28a745; min-width: 250px;">
                        💾 Save My Brew
                    </button>
                </div>
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

        // Collect adjustments from the table inputs (includes notes as a param row)
        const table = document.getElementById(`recipe-table-${techniqueIndex}`);
        const adjustedParams = {};
        table.querySelectorAll('.param-input').forEach(input => {
            const param = input.getAttribute('data-param');
            adjustedParams[param] = input.tagName === 'TEXTAREA' ? input.value : input.value;
        });

        // DEBUG: Log all param-input elements found
        console.log('[SAVE-DEBUG] Found param-inputs:',
            Array.from(table.querySelectorAll('.param-input')).map(el => ({
                param: el.getAttribute('data-param'),
                tagName: el.tagName,
                value: el.value
            }))
        );

        // Capture filter_type - try multiple sources with explicit checks
        // 1. First check param-input in adjustment column (user's direct selection)
        const paramFilterInput = table.querySelector('.param-input[data-param="filter_type"]');
        const paramFilterValue = paramFilterInput ? paramFilterInput.value : null;
        console.log('[SAVE-DEBUG] paramFilterInput element:', paramFilterInput);
        console.log('[SAVE-DEBUG] paramFilterInput.value:', paramFilterValue);

        // 2. Check filter-selector dropdown (top of card)
        const filterSelector = document.querySelector(`.filter-selector[data-technique-index="${techniqueIndex}"]`);
        const filterSelectorValue = filterSelector ? filterSelector.value : null;
        console.log('[SAVE-DEBUG] filterSelector element:', filterSelector);
        console.log('[SAVE-DEBUG] filterSelector.value:', filterSelectorValue);

        // 3. Check state
        const stateFilterValue = state.selectedFilters ? state.selectedFilters[techniqueIndex] : null;
        console.log('[SAVE-DEBUG] state.selectedFilters[' + techniqueIndex + ']:', stateFilterValue);

        // Priority: param-input > filter-selector > state
        if (paramFilterValue && paramFilterValue.trim() !== '') {
            adjustedParams.filter_type = paramFilterValue;
            console.log('[SAVE-DEBUG] Using paramFilterValue:', paramFilterValue);
        } else if (filterSelectorValue && filterSelectorValue.trim() !== '') {
            adjustedParams.filter_type = filterSelectorValue;
            console.log('[SAVE-DEBUG] Using filterSelectorValue:', filterSelectorValue);
        } else if (stateFilterValue) {
            adjustedParams.filter_type = stateFilterValue;
            console.log('[SAVE-DEBUG] Using stateFilterValue:', stateFilterValue);
        }

        console.log('[SAVE-DEBUG] Final filter_type:', adjustedParams.filter_type);

        console.log('[SAVE] Collected adjustedParams:', JSON.stringify(adjustedParams));
        console.log('[SAVE] Notes value:', JSON.stringify(adjustedParams.notes));
        console.log('[SAVE] Filter type:', adjustedParams.filter_type || 'none');

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

        // Update the static notes cell in the table to show saved value
        const notesCell = table.querySelector('tr:last-child td:nth-child(2)');
        if (notesCell && adjustedParams.notes) {
            notesCell.textContent = adjustedParams.notes;
            notesCell.style.whiteSpace = 'pre-wrap';
        }

        btn.textContent = '✓ Saved!';
        btn.style.backgroundColor = 'var(--success-color)';

        setTimeout(() => {
            btn.textContent = '💾 Save My Adjustments';
            btn.style.backgroundColor = '';
            btn.disabled = false;
        }, 2000);

        // Refresh the saved recipes dropdown so it has the latest data
        populateSavedRecipesDropdown();

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
                        <td>${formatGrindSize(params.grind_size, state.equipment?.grinder)}</td>
                        <td><input type="text" class="manual-input" data-param="grind_size" value="${formatGrindSize(params.grind_size, state.equipment?.grinder)}" style="width: 100%; padding: 5px; border: 1px solid var(--border-color); border-radius: 4px;"></td>
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
        const feedbackText = elements.userFeedback ? elements.userFeedback.value.trim() : '';
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
            rating: 'perfect',
            ...(feedbackText && { user_notes: feedbackText })
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

        // Capture selected filter type if available
        const filterSelector = document.querySelector('.filter-selector');
        if (filterSelector && filterSelector.value) {
            actualBrew.filter_type = filterSelector.value;
        } else if (state.selectedFilters) {
            // Fall back to state if dropdown not found
            const idx = Object.keys(state.selectedFilters)[0];
            if (idx && state.selectedFilters[idx]) {
                actualBrew.filter_type = state.selectedFilters[idx];
            }
        }

        // Collect notes
        const notesTextarea = document.getElementById('adjusted-recipe-notes');
        const notes = notesTextarea ? notesTextarea.value.trim() : null;

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

        // Save as preferred recipe using their actual values with notes
        await saveAsPreferredRecipeWithData(
            state.currentBrewMethod,
            actualBrew,
            notes
        );

        // Clear the notes textarea after successful save
        if (notesTextarea) {
            notesTextarea.value = '';
        }

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
async function saveAsPreferredRecipeWithData(brewMethod, recipeData, notes = null) {
    console.log('[SAVE-PREF] Saving preferred recipe:', brewMethod);
    console.log('[SAVE-PREF] recipeData.notes:', recipeData?.notes);
    console.log('[SAVE-PREF] coffee_hash:', state.currentCoffeeAnalysis?.coffee_hash);

    // Always save to localStorage as backup
    saveRecipeToLocalStorage(
        state.currentCoffeeAnalysis,
        brewMethod,
        recipeData,
        notes
    );

    // If authenticated, also save to database
    if (!window.auth || !window.auth.isAuthenticated()) {
        return;
    }

    const supabase = window.getSupabase();
    const userId = window.auth.getUserId();

    // Use preserved hash if available (from loaded saved recipes), otherwise compute
    const coffeeHash = state.currentCoffeeAnalysis.coffee_hash || createCoffeeHash(
        state.currentCoffeeAnalysis.name,
        state.currentCoffeeAnalysis.roaster,
        state.currentCoffeeAnalysis.roast_level,
        state.currentCoffeeAnalysis.origin
    );

    const preferredRecipe = {
        user_id: userId,
        coffee_hash: coffeeHash,
        image_hash: state.currentImageHash,
        coffee_name: state.currentCoffeeAnalysis.name || 'Unknown',
        roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
        roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
        origin: state.currentCoffeeAnalysis.origin || 'Unknown',
        flavor_notes: state.currentCoffeeAnalysis.flavor_notes || [],
        processing: state.currentCoffeeAnalysis.processing || 'Unknown',
        brew_method: brewMethod,
        recipe: recipeData,
        last_brewed: new Date().toISOString()
    };

    try {
        // Check if recipe already exists (use limit(1) instead of maybeSingle to handle duplicates gracefully)
        const { data: existingArr } = await supabase
            .from('saved_recipes')
            .select('id, times_brewed, notes')
            .eq('user_id', userId)
            .eq('coffee_hash', coffeeHash)
            .eq('brew_method', brewMethod)
            .order('last_brewed', { ascending: false })
            .limit(1);
        const existing = existingArr && existingArr.length > 0 ? existingArr[0] : null;

        if (existing) {
            // Update existing recipe and append notes
            const updateData = {
                recipe: recipeData,
                times_brewed: existing.times_brewed + 1,
                last_brewed: new Date().toISOString()
            };

            // Append new notes to existing notes if provided
            if (notes && notes.trim()) {
                const timestamp = new Date().toLocaleString();
                const newNote = `[${timestamp}] ${notes.trim()}`;
                updateData.notes = existing.notes
                    ? `${existing.notes}\n\n${newNote}`
                    : newNote;
            }

            const { error } = await supabase
                .from('saved_recipes')
                .update(updateData)
                .eq('id', existing.id);

            if (error) throw error;
            console.log('[SAVE-DB] Updated existing preferred recipe, id:', existing.id);
            console.log('[SAVE-DB] Update data recipe.notes:', recipeData?.notes);
        } else {
            // Insert new preferred recipe
            if (notes && notes.trim()) {
                const timestamp = new Date().toLocaleString();
                preferredRecipe.notes = `[${timestamp}] ${notes.trim()}`;
            }

            const { error } = await supabase
                .from('saved_recipes')
                .insert([preferredRecipe]);

            if (error) throw error;
            console.log('[SAVE-DB] Inserted new preferred recipe');
        }

        console.log('[SAVE-DB] Saved as preferred recipe successfully');
    } catch (error) {
        console.error('[SAVE-DB] Failed to save preferred recipe:', error);
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

    console.log('Looking for saved recipes with coffee hash:', coffeeHash);
    console.log('Coffee details:', {
        name: coffeeAnalysis.name,
        roaster: coffeeAnalysis.roaster,
        roast_level: coffeeAnalysis.roast_level,
        origin: coffeeAnalysis.origin
    });

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
        const savedTechniques = [];

        // Create a map of AI techniques by brew method for easy lookup
        const aiTechniqueMap = {};
        aiTechniques.forEach(tech => {
            aiTechniqueMap[tech.technique_name] = tech;
        });

        // Add saved recipes first (prioritized)
        savedRecipes.forEach(saved => {
            const brewMethod = saved.brew_method;
            const savedRecipe = saved.recipe || {};

            // Ensure notes are inside recipe params (migrate from old separate notes field)
            if (!savedRecipe.notes && saved.notes) {
                savedRecipe.notes = saved.notes;
            }

            // Check if AI also recommended this method
            const aiTechnique = aiTechniqueMap[brewMethod];

            // Create a technique object based on saved recipe
            const technique = {
                technique_name: brewMethod,
                reasoning: aiTechnique?.reasoning ||
                    `You previously saved this recipe for this coffee (brewed ${saved.times_brewed || 1} time${saved.times_brewed > 1 ? 's' : ''}). Using your preferred parameters.`,
                parameters: savedRecipe,
                technique_notes: aiTechnique?.technique_notes || '',
                is_saved_recipe: true
            };

            console.log('Adding saved recipe to techniques:', brewMethod, 'is_saved_recipe:', technique.is_saved_recipe);
            savedTechniques.push(technique);

            // Remove from AI map so we don't duplicate
            delete aiTechniqueMap[brewMethod];
        });

        // Store remaining AI techniques that weren't in saved recipes
        const hiddenAiTechniques = Object.values(aiTechniqueMap).map(tech => ({
            ...tech,
            is_saved_recipe: false
        }));

        // ONLY show saved recipes initially (hide AI recommendations)
        analysisData.recommended_techniques = savedTechniques;

        // Store hidden AI recommendations for later reveal
        if (hiddenAiTechniques.length > 0) {
            analysisData.hidden_ai_recommendations = hiddenAiTechniques;
            analysisData.has_hidden_ai_recommendations = true;
            console.log(`Hiding ${hiddenAiTechniques.length} AI recommendation(s) - showing only saved recipes`);
        }

        console.log('Showing saved recipes only:', savedTechniques.length, 'technique(s)');

    } catch (error) {
        console.error('Failed to integrate saved recipes:', error);
        // Return original data if integration fails
    }

    return analysisData;
}

// Save recipe to localStorage for non-authenticated users
function saveRecipeToLocalStorage(coffeeAnalysis, brewMethod, recipeData, notes = null) {
    try {
        // Use preserved hash if available (from loaded saved recipes), otherwise compute
        const coffeeHash = coffeeAnalysis.coffee_hash || createCoffeeHash(
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
            roast_level: coffeeAnalysis.roast_level || 'Unknown',
            origin: coffeeAnalysis.origin || 'Unknown',
            processing: coffeeAnalysis.processing || 'Unknown',
            flavor_notes: coffeeAnalysis.flavor_notes || [],
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

            // Append new notes to existing notes if provided
            if (notes && notes.trim()) {
                const timestamp = new Date().toLocaleString();
                const newNote = `[${timestamp}] ${notes.trim()}`;
                savedRecipes[existingIndex].notes = savedRecipes[existingIndex].notes
                    ? `${savedRecipes[existingIndex].notes}\n\n${newNote}`
                    : newNote;
            }
        } else {
            // Add new
            if (notes && notes.trim()) {
                const timestamp = new Date().toLocaleString();
                recipe.notes = `[${timestamp}] ${notes.trim()}`;
            }
            savedRecipes.push(recipe);
        }

        localStorage.setItem('saved_recipes', JSON.stringify(savedRecipes));
        console.log('[SAVE-LS] Recipe saved to localStorage');
        console.log('[SAVE-LS] Hash:', coffeeHash, 'Method:', brewMethod);
        console.log('[SAVE-LS] recipe.notes inside recipeData:', recipeData?.notes);
        console.log('[SAVE-LS] Existing index:', existingIndex);
    } catch (error) {
        console.error('Failed to save recipe to localStorage:', error);
    }
}

// ============ Equipment Wizard ============

function initWizard() {
    document.getElementById('wizard-next')?.addEventListener('click', wizardNext);
    document.getElementById('wizard-prev')?.addEventListener('click', wizardPrev);
    updateWizardUI();
}

function wizardNext() {
    let nextStep = wizardStep + 1;
    // Skip filters step if no pour-over devices selected
    if (nextStep === 2 && !hasPourOverSelected()) {
        nextStep = 3;
    }
    if (nextStep <= WIZARD_TOTAL_STEPS) {
        wizardStep = nextStep;
        updateWizardUI();
    }
}

function wizardPrev() {
    let prevStep = wizardStep - 1;
    // Skip filters step if no pour-over devices selected
    if (prevStep === 2 && !hasPourOverSelected()) {
        prevStep = 1;
    }
    if (prevStep >= 1) {
        wizardStep = prevStep;
        updateWizardUI();
    }
}

function hasPourOverSelected() {
    return document.querySelectorAll('input[name="pour-over"]:checked').length > 0;
}

function updateWizardUI() {
    // Update step content visibility
    document.querySelectorAll('.wizard-step-content').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.step) === wizardStep);
    });

    // Update progress indicators
    document.querySelectorAll('.wizard-progress .wizard-step').forEach(el => {
        const step = parseInt(el.dataset.step);
        el.classList.toggle('active', step === wizardStep);
        el.classList.toggle('completed', step < wizardStep);
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('wizard-prev');
    const nextBtn = document.getElementById('wizard-next');
    const saveBtn = document.getElementById('wizard-save');

    if (prevBtn) prevBtn.style.display = wizardStep > 1 ? '' : 'none';
    if (nextBtn) nextBtn.style.display = wizardStep < WIZARD_TOTAL_STEPS ? '' : 'none';
    if (saveBtn) saveBtn.style.display = wizardStep === WIZARD_TOTAL_STEPS ? '' : 'none';
}

// ============================================
// Filter Update Functions
// ============================================

function showFilterUpdatePrompt(techniqueIndex, filterType) {
    // Remove any existing filter update buttons
    const existing = document.querySelectorAll('.filter-update-prompt');
    existing.forEach(el => el.remove());

    if (!filterType) return;

    // Find the filter selector and insert button after it
    const filterSelector = document.querySelector(`.filter-selector[data-technique-index="${techniqueIndex}"]`);
    if (!filterSelector) return;

    const promptDiv = document.createElement('div');
    promptDiv.className = 'filter-update-prompt';
    promptDiv.style.cssText = 'margin-top: 8px; text-align: center;';
    promptDiv.innerHTML = `
        <button class="btn btn-primary filter-update-btn" style="font-size: 0.85rem; padding: 6px 14px;"
                data-technique-index="${techniqueIndex}" data-filter-type="${filterType}">
            Update recipe for ${filterType}
        </button>
    `;

    filterSelector.parentNode.insertBefore(promptDiv, filterSelector.nextSibling);

    // Add click handler
    promptDiv.querySelector('.filter-update-btn').addEventListener('click', async function() {
        const idx = parseInt(this.getAttribute('data-technique-index'));
        const filter = this.getAttribute('data-filter-type');

        if (state.imageFile) {
            // Re-analyze with the new filter - analyzeImage already reads selectedFilters
            const techniques = state.currentCoffeeAnalysis?.recommended_techniques;
            if (techniques && techniques[idx]) {
                promptDiv.innerHTML = '<span style="font-size: 0.85rem; color: var(--secondary-color);">Updating recipe...</span>';
                await updateRecipeForFilter(idx, filter);
                promptDiv.remove();
            }
        } else {
            // No image (loaded from saved recipe) - send adjustment request
            promptDiv.innerHTML = '<span style="font-size: 0.85rem; color: var(--secondary-color);">Updating recipe...</span>';
            await updateRecipeForFilter(idx, filter);
            promptDiv.remove();
        }
    });
}

async function updateRecipeForFilter(techniqueIndex, filterType) {
    if (!state.currentCoffeeAnalysis) {
        console.error('No current coffee analysis available');
        return;
    }

    const techniques = state.currentCoffeeAnalysis.recommended_techniques;
    if (!techniques || !techniques[techniqueIndex]) {
        console.error('No technique found at index', techniqueIndex);
        return;
    }

    const technique = techniques[techniqueIndex];

    try {
        const equipmentDescription = getEquipmentDescription();

        // Build a flat, single-line adjustment guidance string to avoid control chars
        const paramParts = [];
        if (technique.parameters && typeof technique.parameters === 'object') {
            for (const [key, value] of Object.entries(technique.parameters)) {
                if (value != null && typeof value !== 'object') {
                    paramParts.push(key + ': ' + String(value).replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim());
                }
            }
        }

        const adjustmentGuidance = 'The user changed their filter to "' + filterType + '". Please adjust the recipe parameters (especially grind size, brew time, and pour schedule/technique) to optimize for this filter type. Keep the same coffee, dose, and brew method but adjust extraction parameters for the filter characteristics. ' +
            'Filter info: Paper filters (Sibarist Fast, standard white) = clean cup, fast-flow allows finer grinds. Metal/mesh = fuller body, slightly coarser grind. Cloth = between paper and metal. ' +
            'Current recipe parameters: ' + paramParts.join('; ');

        // Only send the fields the server actually uses from previousAnalysis
        const slimAnalysis = {
            name: state.currentCoffeeAnalysis.name || 'Unknown',
            roaster: state.currentCoffeeAnalysis.roaster || 'Unknown',
            roast_level: state.currentCoffeeAnalysis.roast_level || 'Unknown',
            origin: state.currentCoffeeAnalysis.origin || 'Unknown',
            processing: state.currentCoffeeAnalysis.processing || 'Unknown'
        };

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: safeJsonStringify({
                equipment: equipmentDescription,
                currentBrewMethod: technique.technique_name,
                selectedFilterType: filterType,
                adjustmentRequest: adjustmentGuidance,
                previousAnalysis: slimAnalysis
            })
        });

        await handleApiResponse(response);

        const result = await response.json();
        const adjustmentText = result.content[0].text;

        // Parse JSON response
        let adjustedData;
        try {
            adjustedData = JSON.parse(adjustmentText);
        } catch (e) {
            let cleanText = adjustmentText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                adjustedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not parse filter adjustment response');
            }
        }

        if (adjustedData && adjustedData.adjusted_parameters) {
            // Update the technique's parameters in state
            technique.parameters = {
                ...technique.parameters,
                ...adjustedData.adjusted_parameters,
                filter_type: filterType
            };

            // Re-render the results to show updated parameters
            if (state.currentRecipe && state.currentRecipe.recommended_techniques) {
                state.currentRecipe.recommended_techniques[techniqueIndex] = technique;
            }

            // Re-render just the recipe table for this technique
            const techniqueCard = document.querySelector(`.technique-card[data-technique-index="${techniqueIndex}"]`);
            if (techniqueCard) {
                const tableBody = techniqueCard.querySelector('.brew-parameters-table tbody');
                if (tableBody) {
                    updateRecipeTableBody(tableBody, adjustedData.adjusted_parameters, technique.technique_name);
                }
            }

            // Show success message
            const card = document.querySelector(`.technique-card[data-technique-index="${techniqueIndex}"]`);
            if (card) {
                const notice = document.createElement('div');
                notice.style.cssText = 'background: #d4edda; color: #155724; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 0.85rem;';
                notice.textContent = `✓ Recipe updated for ${filterType} filter`;
                const firstChild = card.querySelector('.brew-parameters-table');
                if (firstChild) {
                    firstChild.parentNode.insertBefore(notice, firstChild);
                    setTimeout(() => notice.remove(), 3000);
                }
            }
        }

    } catch (error) {
        console.error('Failed to update recipe for filter:', error);
        alert(error.message || 'Failed to update recipe for the selected filter. Please try again.');
    }
}

function updateRecipeTableBody(tableBody, params, techniqueName) {
    if (!tableBody || !params) return;

    // Update existing rows in-place rather than replacing them,
    // to preserve the adjustment column, notes textarea, and other interactive elements
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        // Find which param this row represents by checking the input/textarea data-param
        const input = row.querySelector('.param-input');
        const paramKey = input ? input.getAttribute('data-param') : null;

        if (paramKey && params[paramKey] !== undefined) {
            let value = params[paramKey];
            if (paramKey === 'grind_size') {
                value = formatGrindSize(value, state.equipment?.grinder);
            }
            // Update the display cell (second td)
            if (paramKey === 'notes') {
                cells[1].innerHTML = value || '';
            } else {
                cells[1].textContent = value;
            }
            // Update the input/textarea value too
            if (input) {
                input.value = value || '';
            }
        }
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

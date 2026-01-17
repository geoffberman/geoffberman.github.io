// State management
const state = {
    imageData: null,
    imageFile: null
};

// DOM elements
const elements = {
    uploadSection: document.getElementById('upload-section'),
    previewSection: document.getElementById('preview-section'),
    loadingSection: document.getElementById('loading-section'),
    resultsSection: document.getElementById('results-section'),
    errorSection: document.getElementById('error-section'),

    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    cameraBtn: document.getElementById('camera-btn'),
    uploadBtn: document.getElementById('upload-btn'),

    previewImage: document.getElementById('preview-image'),
    removeImageBtn: document.getElementById('remove-image'),

    analyzeBtn: document.getElementById('analyze-btn'),

    analysisContent: document.getElementById('analysis-content'),
    methodContent: document.getElementById('method-content'),
    recipeContent: document.getElementById('recipe-content'),

    tryAgainBtn: document.getElementById('try-again-btn'),
    retryBtn: document.getElementById('retry-btn'),
    errorMessage: document.getElementById('error-message')
};

// Initialize app
function init() {
    setupEventListeners();
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
async function analyzeImage() {
    if (!state.imageFile) {
        showError('Please upload an image first.');
        return;
    }

    showSection('loading');

    try {
        const base64Image = await getBase64Image(state.imageFile);
        const mediaType = state.imageFile.type;

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Image,
                mediaType: mediaType
            })
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

// Display results
function displayResults(data) {
    const analysis = data.coffee_analysis;
    const method = data.recommended_brew_method;
    const recipe = data.brew_recipe;

    // Coffee Analysis
    let analysisHTML = '<div class="analysis-details">';

    if (analysis.name && analysis.name !== "Unknown") {
        analysisHTML += `<p><strong>Coffee:</strong> ${analysis.name}</p>`;
    }
    if (analysis.roaster && analysis.roaster !== "Unknown") {
        analysisHTML += `<p><strong>Roaster:</strong> ${analysis.roaster}</p>`;
    }
    if (analysis.roast_level && analysis.roast_level !== "Unknown") {
        analysisHTML += `<p><strong>Roast Level:</strong> ${analysis.roast_level}</p>`;
    }
    if (analysis.origin && analysis.origin !== "Unknown") {
        analysisHTML += `<p><strong>Origin:</strong> ${analysis.origin}</p>`;
    }
    if (analysis.bean_type && analysis.bean_type !== "Unknown") {
        analysisHTML += `<p><strong>Bean Type:</strong> ${analysis.bean_type}</p>`;
    }
    if (analysis.processing && analysis.processing !== "Unknown") {
        analysisHTML += `<p><strong>Processing:</strong> ${analysis.processing}</p>`;
    }
    if (analysis.flavor_notes && analysis.flavor_notes.length > 0) {
        analysisHTML += `<p><strong>Flavor Notes:</strong> ${analysis.flavor_notes.join(', ')}</p>`;
    }

    analysisHTML += '</div>';
    elements.analysisContent.innerHTML = analysisHTML;

    // Brew Method
    let methodHTML = `
        <div class="method-details">
            <p class="method-name" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 15px;">
                ${method.primary_method}
            </p>
            <p><strong>Why this method:</strong></p>
            <p style="margin-bottom: 15px;">${method.reasoning}</p>
    `;

    if (method.alternative_methods && method.alternative_methods.length > 0) {
        methodHTML += `
            <p><strong>Alternative methods:</strong></p>
            <p>${method.alternative_methods.join(', ')}</p>
        `;
    }

    methodHTML += '</div>';
    elements.methodContent.innerHTML = methodHTML;

    // Brew Recipe
    let recipeHTML = `
        <div class="recipe-details">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div>
                    <p><strong>Coffee:</strong></p>
                    <p style="font-size: 1.3rem; color: var(--primary-color);">${recipe.coffee_amount}</p>
                </div>
                <div>
                    <p><strong>Water:</strong></p>
                    <p style="font-size: 1.3rem; color: var(--primary-color);">${recipe.water_amount}</p>
                </div>
                <div>
                    <p><strong>Ratio:</strong></p>
                    <p style="font-size: 1.3rem; color: var(--primary-color);">${recipe.ratio}</p>
                </div>
            </div>

            <p><strong>Water Temperature:</strong> ${recipe.water_temperature}</p>
            <p><strong>Grind Size:</strong> ${recipe.grind_size}</p>
            <p><strong>Brew Time:</strong> ${recipe.brew_time}</p>

            <div style="margin-top: 20px;">
                <p><strong>Instructions:</strong></p>
                <ol style="margin-left: 20px; margin-top: 10px;">
    `;

    recipe.instructions.forEach(instruction => {
        recipeHTML += `<li style="margin-bottom: 8px;">${instruction}</li>`;
    });

    recipeHTML += `
                </ol>
            </div>
        </div>
    `;
    elements.recipeContent.innerHTML = recipeHTML;

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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

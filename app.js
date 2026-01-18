// State management
const state = {
    imageData: null,
    imageFile: null,
    equipment: null
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
    editEquipmentBtn: document.getElementById('edit-equipment-btn')
};

// Initialize app
function init() {
    setupEventListeners();
    loadEquipment();
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
            updateEquipmentDisplay();
        }
    });

    // Edit equipment button
    elements.editEquipmentBtn.addEventListener('click', () => {
        showEquipmentForm();
    });

    // Equipment form submit
    elements.equipmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEquipment();
    });

    // Clear equipment
    elements.clearEquipmentBtn.addEventListener('click', () => {
        clearEquipment();
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

// Display results
function displayResults(data) {
    const analysis = data.coffee_analysis;
    const techniques = data.recommended_techniques || [];

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

        techniquesHTML += `
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
function saveEquipment() {
    const equipment = {
        espressoMachine: document.getElementById('espresso-machine').value.trim(),
        flowControl: document.getElementById('flow-control').checked,
        grinder: document.getElementById('grinder').value.trim(),
        pourOver: Array.from(document.querySelectorAll('input[name="pour-over"]:checked')).map(cb => cb.value),
        otherMethods: Array.from(document.querySelectorAll('input[name="other-methods"]:checked')).map(cb => cb.value),
        additionalEquipment: document.getElementById('additional-equipment').value.trim()
    };

    // Save to localStorage
    try {
        localStorage.setItem('coffee_equipment', JSON.stringify(equipment));
        state.equipment = equipment;

        // Show success feedback
        const saveBtn = elements.equipmentForm.querySelector('button[type="submit"]');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.backgroundColor = 'var(--success-color)';

        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.backgroundColor = '';
            showEquipmentSummary();
        }, 1500);
    } catch (e) {
        console.error('Failed to save equipment:', e);
        showError('Failed to save equipment preferences');
    }
}

function loadEquipment() {
    try {
        const savedEquipment = localStorage.getItem('coffee_equipment');
        if (savedEquipment) {
            const equipment = JSON.parse(savedEquipment);
            state.equipment = equipment;

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
    } catch (e) {
        console.error('Failed to load equipment:', e);
    }
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
    if (state.equipment && hasEquipment()) {
        showEquipmentSummary();
    } else {
        showEquipmentForm();
    }
}

function hasEquipment() {
    if (!state.equipment) return false;

    return !!(
        state.equipment.espressoMachine ||
        state.equipment.grinder ||
        (state.equipment.pourOver && state.equipment.pourOver.length > 0) ||
        (state.equipment.otherMethods && state.equipment.otherMethods.length > 0) ||
        state.equipment.additionalEquipment
    );
}

function showEquipmentSummary() {
    elements.equipmentSummary.classList.remove('hidden');
    elements.equipmentFormContainer.classList.add('hidden');

    let summaryHTML = '';

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

    elements.equipmentSummaryContent.innerHTML = summaryHTML;
}

function showEquipmentForm() {
    elements.equipmentSummary.classList.add('hidden');
    elements.equipmentFormContainer.classList.remove('hidden');
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

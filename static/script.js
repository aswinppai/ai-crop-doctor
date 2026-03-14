document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const imagePreview = document.getElementById('image-preview');
    const btnCancel = document.getElementById('btn-cancel');
    const btnScan = document.getElementById('btn-scan');
    
    const loadingState = document.getElementById('loading-state');
    const uploadSection = document.getElementById('upload-section');
    const resultsSection = document.getElementById('results-section');
    const btnNewScan = document.getElementById('btn-new-scan');

    // Result Elements
    const elDiseaseName = document.getElementById('disease-name');
    const elConfidenceFill = document.getElementById('confidence-fill');
    const elConfidenceText = document.getElementById('confidence-text');
    const elTreatmentList = document.getElementById('treatment-list');
    const elStatusIndicator = document.querySelector('.status-indicator');

    let currentFile = null;

    // --- Upload Handlers ---
    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropZone.classList.add('hidden');
            previewArea.classList.remove('hidden');
        };
        
        reader.readAsDataURL(file);
    };

    // Click to upload
    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Drag and Drop Events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });

    // --- Action Handlers ---
    btnCancel.addEventListener('click', () => {
        currentFile = null;
        imagePreview.src = '';
        fileInput.value = '';
        previewArea.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    btnNewScan.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        btnCancel.click(); // Reset upload state
        uploadSection.classList.remove('hidden');
    });

    // --- Simulate Scan ---
    btnScan.addEventListener('click', async () => {
        if (!currentFile) return;

        // UI State transition
        uploadSection.classList.add('hidden');
        loadingState.classList.remove('hidden');

        try {
            const formData = new FormData();
            formData.append('image', currentFile);

            // Fetch request to backend
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (response.ok) {
                if (result.error) {
                    alert(`Prediction Error: ${result.error}`);
                    btnNewScan.click();
                } else {
                    displayResults(result);
                }
            } else {
                alert(`Error: ${result.error || 'Server failed'}`);
                btnNewScan.click();
            }

        } catch (error) {
            alert(`Connection Error: Make sure backend is running. Details: ${error}`);
            btnNewScan.click();
        } finally {
            loadingState.classList.add('hidden');
        }
    });

    // --- Render Results ---
    const displayResults = async (result) => {
        const { disease, confidence } = result;

        elDiseaseName.textContent = disease;
        
        // Confidence bar animation
        const percent = Math.round(confidence * 100);
        elConfidenceText.textContent = percent;
        
        // Timeout for CSS transition effect
        setTimeout(() => {
            elConfidenceFill.style.width = `${percent}%`;
        }, 100);

        // Fetch treatments from local database (JSON)
        await loadTreatments(disease);

        // Styling based on health status
        if (disease.toLowerCase() === 'healthy') {
            elStatusIndicator.classList.add('healthy');
            elStatusIndicator.style.background = '#2ecc71';
        } else {
            elStatusIndicator.classList.remove('healthy');
            elStatusIndicator.style.background = '#e74c3c';
        }

        resultsSection.classList.remove('hidden');
    };

    // --- Treatment Database Simulation ---
    const loadTreatments = async (diseaseName) => {
        try {
            // In a real app, this might be a GET API request. 
            // For now, fetch static JSON dataset
            const response = await fetch('/static/disease_data.json');
            const data = await response.json();
            
            const diseaseInfo = data[diseaseName] || data["Default"];
            
            elTreatmentList.innerHTML = '';
            
            if (diseaseInfo && diseaseInfo.treatments) {
                diseaseInfo.treatments.forEach(treatment => {
                    const li = document.createElement('li');
                    li.textContent = treatment;
                    elTreatmentList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = "Consult agricultural expert for specific treatments.";
                elTreatmentList.appendChild(li);
            }

        } catch (error) {
            console.error("Failed to load treatments database: ", error);
            elTreatmentList.innerHTML = '<li>Unable to load treatment database.</li>';
        }
    };
});

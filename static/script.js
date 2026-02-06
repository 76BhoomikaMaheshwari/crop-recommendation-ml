// Get form and element references
const form = document.getElementById("predictionForm");
const resultEl = document.getElementById("result");
const messageEl = document.getElementById("message");
const infoEl = document.getElementById("cropInfo");
const resultsSection = document.getElementById("resultsSection");
const submitButton = document.getElementById("submitButton");
const confidenceEl = document.getElementById("confidence");
const confidenceValueEl = document.getElementById("confidenceValue");
const whyCropEl = document.getElementById("whyCrop");
const themeToggle = document.getElementById("themeToggle");
const confidenceFill = document.getElementById("confidenceFill");
const sampleButton = document.getElementById("sampleButton");
const tryAgainButton = document.getElementById("tryAgain");
const soilSuitabilityEl = document.getElementById("soilSuitability");
const climateSuitabilityEl = document.getElementById("climateSuitability");
const soilSuitabilityLabel = document.getElementById("soilSuitabilityLabel");
const climateSuitabilityLabel = document.getElementById("climateSuitabilityLabel");

// Range input fields
const rangeFields = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"];

// Initialize range slider synchronization
function initializeRangeSliders() {
    rangeFields.forEach(field => {
        const numberInput = document.getElementById(field);
        const rangeInput = document.getElementById(`${field}-range`);
        const valueDisplay = document.getElementById(`${field}-value`);

        if (numberInput && rangeInput && valueDisplay) {
            // Sync range to number input with animation
            rangeInput.addEventListener("input", function () {
                numberInput.value = this.value;
                updateValueDisplay(field);
                animateValueChange(valueDisplay);
            });

            // Sync number to range input
            numberInput.addEventListener("input", function () {
                rangeInput.value = this.value;
                updateValueDisplay(field);
                animateValueChange(valueDisplay);
            });

            // Initialize display
            if (numberInput.value) {
                rangeInput.value = numberInput.value;
                updateValueDisplay(field);
            }
        }
    });
}

function updateValueDisplay(field) {
    const numberInput = document.getElementById(field);
    const valueDisplay = document.getElementById(`${field}-value`);
    if (numberInput && valueDisplay) {
        valueDisplay.textContent = numberInput.value || "-";
    }

    if (field === "N" || field === "P" || field === "K") {
        updateNpkLevel(field);
    }

    updateWarnings(field);
}

function animateValueChange(element) {
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'pulse 0.3s ease-out';
    }, 10);
}

// Show/hide message with animation
function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    
    // Add animation
    messageEl.style.animation = 'none';
    setTimeout(() => {
        messageEl.style.animation = 'slideIn 0.4s ease-out';
    }, 10);
}

// Clear outputs
function clearOutputs() {
    resultEl.textContent = "";
    infoEl.innerHTML = "";
    if (whyCropEl) {
        whyCropEl.innerHTML = "";
    }
    if (confidenceEl) {
        confidenceEl.style.display = "none";
    }
    if (confidenceFill) {
        confidenceFill.style.width = "0%";
    }
    if (soilSuitabilityEl) {
        soilSuitabilityEl.style.width = "0%";
    }
    if (climateSuitabilityEl) {
        climateSuitabilityEl.style.width = "0%";
    }
    if (soilSuitabilityLabel) {
        soilSuitabilityLabel.textContent = "-";
    }
    if (climateSuitabilityLabel) {
        climateSuitabilityLabel.textContent = "-";
    }
    showMessage("", "info");
    resultsSection.style.display = "none";
}

function setLoadingState(isLoading) {
    if (!submitButton) {
        return;
    }
    submitButton.disabled = isLoading;
    submitButton.classList.toggle("is-loading", isLoading);
}

function validateField(input) {
    const label = input.dataset.label || input.name || "Field";
    const value = input.value.trim();
    const min = input.min === "" ? null : Number(input.min);
    const max = input.max === "" ? null : Number(input.max);
    let message = "";

    if (value === "") {
        message = `${label} is required.`;
    } else if (Number.isNaN(Number(value))) {
        message = `${label} must be a number.`;
    } else if (min !== null && Number(value) < min) {
        message = `${label} must be at least ${min}.`;
    } else if (max !== null && Number(value) > max) {
        message = `${label} must be at most ${max}.`;
    }

    const errorEl = document.getElementById(`${input.id}-error`);
    if (message) {
        input.classList.add("is-invalid");
        if (errorEl) {
            errorEl.textContent = message;
        }
        return false;
    }

    input.classList.remove("is-invalid");
    if (errorEl) {
        errorEl.textContent = "";
    }
    return true;
}

function updateNpkLevel(field) {
    const input = document.getElementById(field);
    const badge = document.getElementById(`${field}-level`);
    if (!input || !badge || input.value.trim() === "") {
        if (badge) {
            badge.textContent = "-";
            badge.className = "level-badge";
        }
        return;
    }

    const value = Number(input.value);
    const max = Number(input.max || 100);
    const ratio = max ? value / max : 0;
    let label = "Medium";
    let levelClass = "level-medium";

    if (ratio < 0.33) {
        label = "Low";
        levelClass = "level-low";
    } else if (ratio > 0.66) {
        label = "High";
        levelClass = "level-high";
    }

    badge.textContent = label;
    badge.className = `level-badge ${levelClass}`;
}

function setWarning(id, message) {
    const target = document.getElementById(id);
    if (!target) {
        return;
    }
    target.textContent = message;
}

function updateWarnings(field) {
    const value = Number(document.getElementById(field)?.value || 0);
    if (field === "temperature") {
        setWarning("temperature-warning", value && (value < 10 || value > 40) ? "Unusual temperature range." : "");
    }
    if (field === "humidity") {
        setWarning("humidity-warning", value && (value < 30 || value > 90) ? "Humidity looks uncommon." : "");
    }
    if (field === "rainfall") {
        setWarning("rainfall-warning", value && (value < 50 || value > 250) ? "Rainfall is outside normal range." : "");
    }
    if (field === "ph") {
        setWarning("ph-warning", value && (value < 5.5 || value > 8.5) ? "pH is outside ideal crop range." : "");
    }
}

function updateSuitability(values) {
    if (!soilSuitabilityEl || !climateSuitabilityEl) {
        return;
    }

    const soilScore = getSoilSuitability(values);
    const climateScore = getClimateSuitability(values);

    soilSuitabilityEl.style.width = `${soilScore}%`;
    climateSuitabilityEl.style.width = `${climateScore}%`;

    if (soilSuitabilityLabel) {
        soilSuitabilityLabel.textContent = `${soilScore}%`;
    }
    if (climateSuitabilityLabel) {
        climateSuitabilityLabel.textContent = `${climateScore}%`;
    }
}

function clampPercent(value) {
    return Math.max(10, Math.min(100, Math.round(value)));
}

function getSoilSuitability(values) {
    const n = Number(values.N || 0);
    const p = Number(values.P || 0);
    const k = Number(values.K || 0);
    const ph = Number(values.ph || 0);
    const nScore = 100 - Math.abs(n - 70) * 1.2;
    const pScore = 100 - Math.abs(p - 70) * 1.2;
    const kScore = 100 - Math.abs(k - 100) * 0.9;
    const phScore = 100 - Math.abs(ph - 6.5) * 15;
    return clampPercent((nScore + pScore + kScore + phScore) / 4);
}

function getClimateSuitability(values) {
    const temp = Number(values.temperature || 0);
    const humidity = Number(values.humidity || 0);
    const rainfall = Number(values.rainfall || 0);
    const tempScore = 100 - Math.abs(temp - 26) * 2.2;
    const humidityScore = 100 - Math.abs(humidity - 70) * 1.2;
    const rainScore = 100 - Math.abs(rainfall - 120) * 0.6;
    return clampPercent((tempScore + humidityScore + rainScore) / 3);
}

function validateFormFields() {
    const fields = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"];
    let firstInvalid = null;

    fields.forEach(field => {
        const input = document.getElementById(field);
        if (!input) {
            return;
        }
        const isValid = validateField(input);
        if (!isValid && !firstInvalid) {
            firstInvalid = input;
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
        return false;
    }
    return true;
}

// Crop emoji mapping
const cropEmojis = {
    "apple": "🍎", "banana": "🍌", "blackgram": "🫘", "chickpea": "🫘",
    "coconut": "🥥", "coffee": "☕", "cotton": "🧵", "grapes": "🍇",
    "jute": "🌾", "kidneybeans": "🫘", "lentil": "🫘", "maize": "🌽",
    "mango": "🥭", "mothbeans": "🫘", "mungbean": "🫘", "muskmelon": "🍈",
    "orange": "🍊", "papaya": "🧡", "pigeonpeas": "🫘", "pomegranate": "🍎",
    "rice": "🍚", "watermelon": "🍉"
};

// Crop colors for visual indication
const cropColors = {
    "apple": "#FF6B6B", "banana": "#FFD93D", "blackgram": "#6C5B7F", "chickpea": "#C4A69D",
    "coconut": "#8B7355", "coffee": "#6F4E37", "cotton": "#F5F5F5", "grapes": "#722F77",
    "jute": "#A4AC86", "kidneybeans": "#B4453E", "lentil": "#CD853F", "maize": "#FFD700",
    "mango": "#FF7F00", "mothbeans": "#8B4513", "mungbean": "#228B22", "muskmelon": "#FFB347",
    "orange": "#FF8C00", "papaya": "#FF6347", "pigeonpeas": "#8B7500", "pomegranate": "#DC143C",
    "rice": "#F4A460", "watermelon": "#FF1493"
};

// Farming tips for different crops
const farmingTips = {
    "rice": [
        "Ensure fields are properly flooded for at least 5 cm water depth",
        "Monitor for pest attacks, especially during growing season",
        "Apply nitrogen fertilizer in 2-3 splits for better yield",
        "Harvest when grain moisture drops to 12-14%"
    ],
    "maize": [
        "Plant in well-prepared soil with good drainage",
        "Ensure proper spacing (60-75 cm between rows)",
        "Irrigate every 15-20 days during critical growth stages",
        "Use certified seeds for better productivity"
    ],
    "wheat": [
        "Plant in November-December for best results",
        "Apply NPK fertilizer as per soil test recommendations",
        "Harvest when moisture content drops to 12-14%",
        "Protect from frost during grain development"
    ],
    "cotton": [
        "Choose disease-resistant varieties suitable to your region",
        "Maintain proper plant spacing for good air circulation",
        "Monitor closely for pests like bollworms and spider mites",
        "Use drip irrigation for water conservation"
    ],
    "banana": [
        "Use healthy suckers for planting",
        "Provide continuous irrigation, especially during dry season",
        "Mulch the base to retain soil moisture",
        "Apply organic manure every 3 months"
    ],
    "mango": [
        "Pruning encourages better flowering and fruiting",
        "Regular irrigation is essential during fruit development",
        "Protect fruits from fruit flies using proper management",
        "Harvest when fruit develops slight color change"
    ],
    "default": [
        "Always start with soil testing to know nutrient status",
        "Practice crop rotation to maintain soil fertility",
        "Use organic manure to improve soil structure",
        "Monitor soil moisture and irrigate as needed"
    ]
};

// Get tips for a crop
function getTipsForCrop(cropName) {
    return farmingTips[cropName.toLowerCase()] || farmingTips["default"];
}

// Next steps for all crops
const nextSteps = [
    "Prepare Soil: Based on the recommended crop requirements",
    "Get Seeds: From certified seed suppliers in your region",
    "Plan Irrigation: According to the water requirements",
    "Monitor Growth: Keep track of crop development",
    "Harvest: At the right time for maximum yield"
];

// Update progress indicators
function updateProgressIndicator(step) {
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
        if (index < step) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Format form submission
form.addEventListener("submit", function (event) {
    event.preventDefault();

    clearOutputs();

    if (!validateFormFields()) {
        showMessage("Please fix the highlighted fields before submitting.", "error");
        return;
    }

    const formData = new FormData(form);

    // Show loading state with animation
    showMessage("Analyzing soil and climate data...", "info");
    setLoadingState(true);

    // Submit form
    fetch("/predict", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            setLoadingState(false);
            if (data.error) {
                showMessage(`❌ ${data.error}`, "error");
                return;
            }

            const crop = data.crop;
            const emoji = cropEmojis[crop.toLowerCase()] || "🌱";
            const color = cropColors[crop.toLowerCase()] || "#4a9c2e";

            // Display result with animation
            resultEl.innerHTML = `
                <div style="font-size: 4rem; margin-bottom: 20px; animation: bounce 1s ease-out;">
                    ${emoji}
                </div>
                <div>
                    <strong style="font-size: 0.9rem; opacity: 0.9;">RECOMMENDED CROP</strong><br>
                    <span style="font-size: 2rem; font-weight: 900; letter-spacing: 2px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${crop.toUpperCase()}
                    </span>
                    <div style="margin-top: 10px; font-size: 0.95rem; opacity: 0.9;">
                        Best crop for your field
                    </div>
                </div>
            `;

            // Update result card color based on crop
            resultEl.parentElement.style.background = `linear-gradient(135deg, ${color}, ${adjustBrightness(color, 20)})`;
            resultEl.classList.add("is-highlighted");
            setTimeout(() => resultEl.classList.remove("is-highlighted"), 1200);

            // Confidence display (if provided by backend)
            if (confidenceEl && confidenceValueEl && typeof data.confidence === "number") {
                confidenceEl.style.display = "block";
                confidenceValueEl.textContent = `${(data.confidence * 100).toFixed(1)}%`;
                if (confidenceFill) {
                    confidenceFill.style.width = `${(data.confidence * 100).toFixed(1)}%`;
                }
            }

            // Display crop information
            if (data.info && (data.info.season || data.info.water || data.info.soil)) {
                const season = data.info.season ? `<li><strong>Ideal Season:</strong> ${data.info.season}</li>` : "";
                const water = data.info.water ? `<li><strong>Water Needs:</strong> ${data.info.water}</li>` : "";
                const soil = data.info.soil ? `<li><strong>Ideal Soil:</strong> ${data.info.soil}</li>` : "";
                infoEl.innerHTML = `
                    <div class="info-card">
                        <h4>Crop Info</h4>
                        <ul>${soil}${season}${water}</ul>
                    </div>
                `;
            }

            // Why this crop explanation
            if (whyCropEl) {
                const values = {
                    N: formData.get("N"),
                    P: formData.get("P"),
                    K: formData.get("K"),
                    temperature: formData.get("temperature"),
                    humidity: formData.get("humidity"),
                    rainfall: formData.get("rainfall"),
                    ph: formData.get("ph")
                };
                const reasons = [];
                reasons.push(`Nutrient balance: N ${values.N}, P ${values.P}, K ${values.K}.`);
                reasons.push(`Climate fit: ${values.temperature}°C, ${values.humidity}% humidity, ${values.rainfall} mm rainfall.`);
                if (data.info && data.info.season) {
                    reasons.push(`Seasonal fit: ${data.info.season}.`);
                }
                if (data.info && data.info.water) {
                    reasons.push(`Water guidance: ${data.info.water}.`);
                }
                whyCropEl.innerHTML = `
                    <div class="why-card">
                        <h4>Why this crop?</h4>
                        <ul>${reasons.map(reason => `<li>${reason}</li>`).join("")}</ul>
                    </div>
                `;

                updateSuitability(values);
            }

            // Display farming tips
            const tips = getTipsForCrop(crop);
            const tipsHTML = tips.map((tip, index) => `<li style="animation: slideIn 0.3s ease-out ${index * 0.1}s both;">${tip}</li>`).join("");
            document.getElementById("farmingTips").innerHTML = tipsHTML;

            // Show results section with animation
            resultsSection.style.display = "block";
            resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

            // Add confetti effect
            createConfetti();

            showMessage("Prediction ready. Happy farming!", "success");

            // Auto-hide success message after 4 seconds
            setTimeout(() => {
                if (messageEl.classList.contains("success")) {
                    messageEl.style.opacity = "0";
                    messageEl.style.transition = "opacity 0.3s ease-out";
                    setTimeout(() => {
                        showMessage("", "info");
                        messageEl.style.opacity = "1";
                        messageEl.style.transition = "none";
                    }, 300);
                }
            }, 4000);
        })
        .catch(error => {
            console.error("Error:", error);
            setLoadingState(false);
            showMessage("❌ Prediction failed. Please try again.", "error");
        });
});

// Form reset handler with animation
form.addEventListener("reset", function () {
    clearOutputs();
    // Reset range sliders with animation
    rangeFields.forEach(field => {
        const valueDisplay = document.getElementById(`${field}-value`);
        if (valueDisplay) {
            valueDisplay.style.animation = 'pulse 0.3s ease-out';
            setTimeout(() => {
                valueDisplay.textContent = "-";
            }, 150);
        }
    });
    showMessage("Form cleared successfully!", "success");
    setTimeout(() => showMessage("", "info"), 2500);
});

// Create confetti effect for celebration
function createConfetti() {
    const colors = ["#2b7a0b", "#4a9c2e", "#81c784", "#c8e6c9", "#FFD93D"];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.style.position = "fixed";
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.top = "-10px";
        confetti.style.width = Math.random() * 8 + 4 + "px";
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = "50%";
        confetti.style.pointerEvents = "none";
        confetti.style.zIndex = "999";
        document.body.appendChild(confetti);

        const duration = Math.random() * 2 + 2.5;
        const xMove = (Math.random() - 0.5) * 200;

        confetti.animate(
            [
                { transform: "translateY(0) rotate(0deg)", opacity: 1 },
                { transform: `translateY(${window.innerHeight}px) translateX(${xMove}px) rotate(720deg)`, opacity: 0 }
            ],
            {
                duration: duration * 1000,
                easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            }
        );

        setTimeout(() => confetti.remove(), duration * 1000);
    }
}

// Adjust brightness of hex color
function adjustBrightness(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Add smooth scroll for section headers
document.querySelectorAll('.section-header').forEach((header, index) => {
    header.style.animation = `slideIn 0.5s ease-out ${index * 0.1}s backwards`;
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
    initializeRangeSliders();

    const inputs = document.querySelectorAll("#predictionForm input[type='number']");
    inputs.forEach(input => {
        input.addEventListener("input", () => validateField(input));
        input.addEventListener("blur", () => validateField(input));
    });

    if (sampleButton) {
        sampleButton.addEventListener("click", () => {
            const sample = {
                N: 80,
                P: 65,
                K: 90,
                temperature: 26.5,
                humidity: 72,
                rainfall: 140,
                ph: 6.7
            };
            Object.keys(sample).forEach(key => {
                const input = document.getElementById(key);
                const range = document.getElementById(`${key}-range`);
                if (input) {
                    input.value = sample[key];
                    validateField(input);
                }
                if (range) {
                    range.value = sample[key];
                }
                updateValueDisplay(key);
            });
            showMessage("Sample values filled. Adjust as needed.", "info");
        });
    }

    if (tryAgainButton) {
        tryAgainButton.addEventListener("click", () => {
            const formSection = document.querySelector(".form-section");
            if (formSection) {
                formSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    }

    if (themeToggle) {
        const savedTheme = localStorage.getItem("agriTheme") || "light";
        if (savedTheme === "dark") {
            document.body.classList.add("theme-dark");
            themeToggle.textContent = "Light mode";
        }

        themeToggle.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("theme-dark");
            localStorage.setItem("agriTheme", isDark ? "dark" : "light");
            themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
        });
    }
    
    // Add scroll reveal animation to cards
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = "all 0.3s ease";
        observer.observe(card);
    });

    document.querySelectorAll("a[href^='#']").forEach(anchor => {
        anchor.addEventListener("click", event => {
            const target = document.querySelector(anchor.getAttribute("href"));
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
});

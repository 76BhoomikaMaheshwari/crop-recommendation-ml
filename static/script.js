const form = document.getElementById("predictionForm");
const resultEl = document.getElementById("result");
const messageEl = document.getElementById("message");
const infoEl = document.getElementById("cropInfo");

function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}

function clearOutputs() {
    resultEl.textContent = "";
    infoEl.innerHTML = "";
    showMessage("", "info");
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    clearOutputs();

    const fields = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"];
    const formData = new FormData(form);

    for (const field of fields) {
        const raw = formData.get(field);
        if (raw === null || raw.trim() === "") {
            showMessage("Please fill all fields before submitting.", "error");
            return;
        }
        const value = Number(raw);
        if (Number.isNaN(value)) {
            showMessage(`Invalid number for ${field}.`, "error");
            return;
        }
        if (value < 0) {
            showMessage(`${field} cannot be negative.`, "error");
            return;
        }
    }

    fetch("/predict", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showMessage(data.error, "error");
                return;
            }

            const crop = data.crop;
            resultEl.textContent = `Recommended Crop: ${crop}`;

            if (data.info && (data.info.season || data.info.water)) {
                const season = data.info.season ? `<li><strong>Ideal season:</strong> ${data.info.season}</li>` : "";
                const water = data.info.water ? `<li><strong>Water need:</strong> ${data.info.water}</li>` : "";
                infoEl.innerHTML = `<div class="info-card"><h4>Farmer note</h4><ul>${season}${water}</ul></div>`;
            } else {
                infoEl.innerHTML = "";
            }

            showMessage("Prediction ready. Happy farming!", "success");
            // fetchCommodityPrice(crop);
        })
        .catch(error => {
            console.error("Error:", error);
            showMessage("Prediction failed. Please try again.", "error");
        });
});

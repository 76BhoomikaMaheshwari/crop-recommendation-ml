document.getElementById("predictionForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let formData = new FormData(this);
    fetch("/predict", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // const predictedCrop = data.crop;
        document.getElementById("result").innerText = "Recommended Crop: " + data.crop;
        // fetchCommodityPrice(predictedCrop);
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("result").innerText = "Prediction failed. Try again.";
    });
});

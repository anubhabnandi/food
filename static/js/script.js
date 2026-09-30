let currentFood = null;
let calorieChart = null;
let intakeChart = null;


const imageInput =
    document.getElementById("image");

const preview =
    document.getElementById("preview");

const previewImage =
    document.getElementById("previewImage");


/* =========================
   IMAGE PREVIEW
========================= */

imageInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onload =
            function (event) {

                previewImage.src =
                    event.target.result;

                preview.classList.remove(
                    "hidden"
                );
            };

        reader.readAsDataURL(file);
    }
);


/* =========================
   SCAN FOOD
========================= */

async function scanFood() {

    const file =
        imageInput.files[0];

    if (!file) {

        showScanMessage(
            "Please choose a food image first."
        );

        return;
    }


    const button =
        document.getElementById(
            "scanButton"
        );

    const result =
        document.getElementById(
            "scanResult"
        );


    button.disabled = true;

    button.innerHTML =
        "🤖 Analyzing...";


    result.innerHTML = `
        <div class="empty-state">
            <span>🧠</span>
            <p>AI is analyzing your food...</p>
        </div>
    `;


    const formData =
        new FormData();

    formData.append(
        "image",
        file
    );


    try {

        const response =
            await fetch(
                "/predict",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            showScanMessage(
                data.message ||
                "Unable to analyze image."
            );

            return;
        }


        if (!data.nutrition_available) {

            result.innerHTML = `

                <div class="food-result">

                    <h3>
                        🍽️ ${escapeHtml(data.food)}
                    </h3>

                    <p>
                        AI Confidence:
                        <strong>
                            ${data.confidence}%
                        </strong>
                    </p>

                    <p>
                        ${escapeHtml(data.message)}
                    </p>

                </div>
            `;

            return;
        }


        currentFood = {

            food:
                data.food,

            confidence:
                data.confidence,

            caloriesPer100g:
                Number(
                    data.calories_per_100g
                ),

            proteinPer100g:
                Number(
                    data.protein_per_100g
                ),

            carbsPer100g:
                Number(
                    data.carbs_per_100g
                ),

            fatPer100g:
                Number(
                    data.fat_per_100g
                )

        };


        renderFoodResult(
            "scanResult",
            currentFood
        );


    } catch (error) {

        showScanMessage(
            "Something went wrong while connecting to the server."
        );

    } finally {

        button.disabled = false;

        button.innerHTML =
            "<span>✨</span> Analyze Food";
    }
}


/* =========================
   FOOD RESULT
========================= */

function renderFoodResult(
    elementId,
    food
) {

    const result =
        document.getElementById(
            elementId
        );


    result.innerHTML = `

        <div class="food-result">

            <h3>
                🍽️ ${escapeHtml(food.food)}
            </h3>

            <p>
                Nutrition values are
                calculated per 100g.
            </p>

            <p class="confidence">

                🤖 AI Confidence:
                <strong>
                    ${food.confidence}%
                </strong>

            </p>


            <div class="quantity-box">

                <input
                    type="number"
                    id="quantity-${elementId}"
                    value="100"
                    min="1"
                    max="5000"
                    step="1"
                    oninput="updateFoodCalculation('${elementId}')"
                >

                <span>grams</span>

            </div>


            <div id="calculated-${elementId}"
                 style="margin-top:18px;">

            </div>


            <button
                class="add-button"
                onclick="addCurrentFood('${elementId}')">

                + Add to Today's Meals

            </button>

        </div>
    `;


    updateFoodCalculation(
        elementId
    );
}


/* =========================
   CALCULATE
========================= */

function updateFoodCalculation(
    elementId
) {

    if (!currentFood) {
        return;
    }


    const input =
        document.getElementById(
            `quantity-${elementId}`
        );


    const quantity =
        Number(input.value) || 0;


    const multiplier =
        quantity / 100;


    const calories =
        currentFood.caloriesPer100g
        * multiplier;


    const protein =
        currentFood.proteinPer100g
        * multiplier;


    const carbs =
        currentFood.carbsPer100g
        * multiplier;


    const fat =
        currentFood.fatPer100g
        * multiplier;


    const box =
        document.getElementById(
            `calculated-${elementId}`
        );


    box.innerHTML = `

        <div class="macro-grid">

            <div class="macro">

                <span>🔥</span>

                <div>

                    <p>Calories</p>

                    <strong>
                        ${calories.toFixed(0)} kcal
                    </strong>

                </div>

            </div>


            <div class="macro">

                <span>🥩</span>

                <div>

                    <p>Protein</p>

                    <strong>
                        ${protein.toFixed(1)}g
                    </strong>

                </div>

            </div>


            <div class="macro">

                <span>🍞</span>

                <div>

                    <p>Carbs</p>

                    <strong>
                        ${carbs.toFixed(1)}g
                    </strong>

                </div>

            </div>


            <div class="macro">

                <span>🥑</span>

                <div>

                    <p>Fat</p>

                    <strong>
                        ${fat.toFixed(1)}g
                    </strong>

                </div>

            </div>

        </div>
    `;
}


/* =========================
   ADD FOOD
========================= */

async function addCurrentFood(
    elementId
) {

    if (!currentFood) {
        return;
    }


    const input =
        document.getElementById(
            `quantity-${elementId}`
        );


    const quantity =
        Number(input.value);


    if (
        !quantity ||
        quantity <= 0
    ) {

        alert(
            "Please enter a valid quantity."
        );

        return;
    }


    const multiplier =
        quantity / 100;


    const calories =
        currentFood.caloriesPer100g
        * multiplier;


    const protein =
        currentFood.proteinPer100g
        * multiplier;


    const carbs =
        currentFood.carbsPer100g
        * multiplier;


    const fat =
        currentFood.fatPer100g
        * multiplier;


    try {

        const response =
            await fetch(
                "/add",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            food:
                                currentFood.food,

                            quantity:
                                quantity,

                            calories:
                                calories,

                            protein:
                                protein,

                            carbs:
                                carbs,

                            fat:
                                fat,

                            confidence:
                                currentFood.confidence

                        })

                }
            );


        const data =
            await response.json();


        if (data.success) {

            loadDashboard();

            alert(
                "Food added to today's meals."
            );

        } else {

            alert(
                data.message ||
                "Unable to add food."
            );
        }

    } catch {

        alert(
            "Could not connect to server."
        );
    }
}


/* =========================
   SEARCH FOOD
========================= */

async function searchFood() {

    const input =
        document.getElementById(
            "foodSearch"
        );


    const query =
        input.value.trim();


    if (!query) {

        showSearchMessage(
            "Please enter a food name."
        );

        return;
    }


    const result =
        document.getElementById(
            "searchResult"
        );


    result.innerHTML = `

        <div class="empty-state">

            <span>🔎</span>

            <p>
                Searching nutrition database...
            </p>

        </div>
    `;


    try {

        const response =
            await fetch(
                "/search",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            food: query
                        })

                }
            );


        const data =
            await response.json();


        if (data.success) {

            currentFood = {

                food:
                    data.food,

                confidence:
                    100,

                caloriesPer100g:
                    Number(data.calories),

                proteinPer100g:
                    Number(data.protein),

                carbsPer100g:
                    Number(data.carbs),

                fatPer100g:
                    Number(data.fat)

            };


            renderFoodResult(
                "searchResult",
                currentFood
            );

        } else {

            if (
                data.matches &&
                data.matches.length
            ) {

                result.innerHTML = `

                    <div class="food-result">

                        <p>
                            Try:
                            <strong>
                                ${data.matches
                                    .map(escapeHtml)
                                    .join(", ")}
                            </strong>
                        </p>

                    </div>
                `;

            } else {

                showSearchMessage(
                    "Food not found in the database."
                );
            }
        }

    } catch {

        showSearchMessage(
            "Could not connect to server."
        );
    }
}


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/dashboard"
            );


        const data =
            await response.json();


        document.getElementById(
            "target"
        ).innerText =
            Math.round(data.target);


        document.getElementById(
            "consumed"
        ).innerText =
            Math.round(data.consumed);


        document.getElementById(
            "remaining"
        ).innerText =
            Math.round(data.remaining);


        document.getElementById(
            "percentage"
        ).innerText =
            data.percentage + "%";


        document.getElementById(
            "progressBar"
        ).style.width =
            data.percentage + "%";


        document.getElementById(
            "protein"
        ).innerText =
            data.protein + " g";


        document.getElementById(
            "carbs"
        ).innerText =
            data.carbs + " g";


        document.getElementById(
            "fat"
        ).innerText =
            data.fat + " g";


        renderMeals(
            data.foods
        );


        renderCharts(
            data
        );


    } catch {

        console.log(
            "Dashboard could not load."
        );
    }
}


/* =========================
   MEALS
========================= */

function renderMeals(foods) {

    const list =
        document.getElementById(
            "mealList"
        );


    const count =
        document.getElementById(
            "mealCount"
        );


    count.innerText =
        `${foods.length} ${
            foods.length === 1
                ? "meal"
                : "meals"
        }`;


    if (!foods.length) {

        list.innerHTML = `

            <div class="empty-state">

                <span>🍴</span>

                <p>
                    No meals added yet.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        foods.map(
            item => `

                <div class="meal">

                    <div class="meal-name">

                        <div class="meal-icon">
                            🍽️
                        </div>

                        <div>

                            <p>
                                ${escapeHtml(
                                    item.food_name
                                )}
                            </p>

                            <small>
                                ${item.quantity}g
                                ·
                                ${item.meal_time}
                            </small>

                        </div>

                    </div>

                    <div class="meal-calories">

                        ${Math.round(
                            item.calories
                        )} kcal

                    </div>

                </div>

            `
        ).join("");
}


/* =========================
   CHARTS
========================= */

function renderCharts(data) {

    if (calorieChart) {

        Plotly.purge(
            "calorieChart"
        );
    }


    if (intakeChart) {

        Plotly.purge(
            "intakeChart"
        );
    }


    Plotly.newPlot(
        "calorieChart",

        [{

            values: [
                data.consumed,
                data.remaining
            ],

            labels: [
                "Consumed",
                "Remaining"
            ],

            type: "pie",

            hole: 0.72,

            textinfo: "none",

            marker: {

                colors: [
                    "#9be7a4",
                    "#26352b"
                ]

            }

        }],

        {

            paper_bgcolor:
                "rgba(0,0,0,0)",

            plot_bgcolor:
                "rgba(0,0,0,0)",

            font: {
                color: "#9daaa1"
            },

            showlegend: true,

            legend: {
                orientation: "h"
            },

            margin: {
                t: 10,
                b: 10,
                l: 10,
                r: 10
            }

        },

        {
            responsive: true,
            displayModeBar: false
        }
    );


    Plotly.newPlot(
        "intakeChart",

        [{

            x:
                data.foods.map(
                    item =>
                        item.food_name
                ),

            y:
                data.foods.map(
                    item =>
                        item.calories
                ),

            type: "bar",

            marker: {
                color: "#9be7a4"
            }

        }],

        {

            paper_bgcolor:
                "rgba(0,0,0,0)",

            plot_bgcolor:
                "rgba(0,0,0,0)",

            font: {
                color: "#9daaa1"
            },

            xaxis: {
                gridcolor:
                    "rgba(255,255,255,0.05)"
            },

            yaxis: {
                gridcolor:
                    "rgba(255,255,255,0.05)"
            },

            margin: {
                t: 10,
                b: 50,
                l: 45,
                r: 10
            }

        },

        {
            responsive: true,
            displayModeBar: false
        }
    );
}


/* =========================
   HELPERS
========================= */

function showScanMessage(message) {

    document.getElementById(
        "scanResult"
    ).innerHTML = `

        <div class="empty-state">

            <span>⚠️</span>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;
}


function showSearchMessage(message) {

    document.getElementById(
        "searchResult"
    ).innerHTML = `

        <div class="empty-state">

            <span>⚠️</span>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   START
========================= */

loadDashboard();
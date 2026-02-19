let currentFilter = "all";
let currentOffset = 0;
let currentIngredients = "";

// =========================
// RENDER RECIPE CARD
// =========================

function renderRecipeCard(recipe, index = null) {

    const time = recipe.readyInMinutes || 0;

    const difficulty =
        time <= 20 ? "Easy" :
        time <= 45 ? "Medium" :
        "Hard";
        // Apply difficulty filter
if (currentFilter !== "all") {
    if (currentFilter === "easy" && difficulty !== "Easy") return "";
    if (currentFilter === "medium" && difficulty !== "Medium") return "";
    if (currentFilter === "hard" && difficulty !== "Hard") return "";
}


    return `
        <div class="card">
            ${index === 0 ? '<div class="badge">⭐ Best Match</div>' : ''}

            <img src="${recipe.image || ''}" alt="${recipe.title}">

            <h3>${recipe.title}</h3>

            <p>
                ⏱ ${time ? time + " min" : "Check details"}  
                ⭐ ${recipe.healthScore || "?"} health  
                🔥 ${difficulty}
            </p>

            <button onclick="getRecipeDetails(${recipe.id})">View Details</button>

            <button onclick="saveFavorite(${recipe.id}, '${recipe.title.replace(/'/g, "\\'")}', '${recipe.image}')">
                ❤️ Save
            </button>
        </div>
    `;
}

// =========================
// SEARCH FUNCTION
// =========================

function findRecipes() {

    const input = document.getElementById("ingredientsInput").value.trim();
    const results = document.getElementById("results");

    if (!input) {
        results.innerHTML = "Please enter ingredients.";
        return;
    }

    currentOffset = 0;
    currentIngredients = input;

    results.innerHTML = '<div class="loader"></div>';

    fetchRecipes(input, 0, true);
}

// =========================
// FETCH RECIPES (Reusable)
// =========================
// =========================
function fetchRecipes(ingredients, offset, isNewSearch = false) {

    fetch(`http://localhost:5000/recipes?ingredients=${ingredients}&offset=${offset}`)
        .then(response => {
            if (!response.ok) throw new Error("Server error");
            return response.json();
        })
        .then(data => {

            if (!Array.isArray(data)) throw new Error("Invalid data");

            const results = document.getElementById("results");

            if (isNewSearch) {
                results.innerHTML = "";
            }

            if (data.length === 0 && offset === 0) {
                results.innerHTML = "No recipes found.";
                return;
            }

            // =========================
            // COLLECT MISSING INGREDIENTS
            // =========================

            let allMissing = new Set();

            data.forEach(recipe => {
                if (recipe.extendedIngredients) {
                    recipe.extendedIngredients.forEach(ing => {
                        if (!ingredients.toLowerCase().includes(ing.name.toLowerCase())) {
                            allMissing.add(ing.name);
                        }
                    });
                }
            });

            // =========================
            // SHOW BANNER + SHOPPING LIST (ONLY ON NEW SEARCH)
            // =========================

            if (isNewSearch) {

                results.innerHTML += `
                    <div class="top-recommendation">
                        🧠 Based on your ingredients, here are the best optimized results.
                    </div>
                `;

                if (allMissing.size > 0) {
                    results.innerHTML += `
                        <div class="shopping-list">
                            <h4>🛒 Ingredients You Might Need:</h4>
                            <ul>
                                ${[...allMissing].slice(0, 8).map(item => `<li>${item}</li>`).join("")}
                            </ul>
                        </div>
                    `;
                }
            }

            // =========================
            // SMART SCORE
            // =========================

            data.forEach(recipe => {
                const matchScore = recipe.healthScore || 0;
                const timeScore = recipe.readyInMinutes ? (60 - recipe.readyInMinutes) : 0;
                recipe.smartScore = matchScore + timeScore;
            });

            data.sort((a, b) => b.smartScore - a.smartScore);

            // =========================
            // RENDER CARDS
            // =========================

            data.forEach((recipe, index) => {
                results.innerHTML += renderRecipeCard(recipe, offset === 0 ? index : null);
            });

            // =========================
            // LOAD MORE BUTTON
            // =========================

            const oldBtn = document.getElementById("loadMoreBtn");
            if (oldBtn) oldBtn.remove();

            if (data.length === 6) {
                results.innerHTML += `
                    <div style="text-align:center; margin-top:20px;" id="loadMoreBtn">
                        <button onclick="loadMore()">Load More</button>
                    </div>
                `;
            }

        })
       .catch(error => {
    console.error(error);
    document.getElementById("results").innerHTML = `
        <div class="error-box">
            ⚠ Unable to fetch recipes right now.
            <br>
            Please try again later.
        </div>
    `;
});

}


function loadMore() {

    currentOffset += 6;
    fetchRecipes(currentIngredients, currentOffset);
}

// =========================
// MODAL DETAILS
// =========================

function getRecipeDetails(id) {

    fetch(`http://localhost:5000/recipe-details/${id}`)
        .then(response => response.json())
        .then(data => {

            document.getElementById("modalTitle").innerText = data.title;

            let instructionsHTML = "";

            if (data.analyzedInstructions && data.analyzedInstructions.length > 0) {

                instructionsHTML += "<ul>";

                data.analyzedInstructions[0].steps.forEach(step => {
                    instructionsHTML += `<li>${step.step}</li>`;
                });

                instructionsHTML += "</ul>";

            } else {
                instructionsHTML = "<p>No detailed instructions available.</p>";
            }

            document.getElementById("modalBody").innerHTML = instructionsHTML;
            document.getElementById("recipeModal").style.display = "block";
        })
        .catch(err => {
            console.error(err);
            alert("Error loading recipe details.");
        });
}

function closeModal() {
    document.getElementById("recipeModal").style.display = "none";
}

// =========================
// FAVORITES
// =========================

function saveFavorite(id, title, image) {

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.find(recipe => recipe.id === id)) {
        alert("Already saved!");
        return;
    }

    favorites.push({ id, title, image });
    localStorage.setItem("favorites", JSON.stringify(favorites));

    alert("Saved to favorites!");
    displayFavorites();
}

function displayFavorites() {

    const favoritesDiv = document.getElementById("favorites");
    if (!favoritesDiv) return;

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    favoritesDiv.innerHTML = "";

    if (favorites.length === 0) {
        favoritesDiv.innerHTML = "<p>No favorites saved yet.</p>";
        return;
    }

    favorites.forEach(recipe => {
        favoritesDiv.innerHTML += `
            <div class="card">
                <img src="${recipe.image}">
                <h3>${recipe.title}</h3>
                <button onclick="removeFavorite(${recipe.id})">❌ Remove</button>
            </div>
        `;
    });
}

function removeFavorite(id) {

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(recipe => recipe.id !== id);

    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayFavorites();
}

window.onload = function () {
    displayFavorites();
};
function setFilter(level) {
    currentFilter = level;

    // Remove active class from all buttons
    document.querySelectorAll(".filters button").forEach(btn => {
        btn.classList.remove("active");
    });

    // Add active class to clicked button
    event.target.classList.add("active");

    findRecipes();
}

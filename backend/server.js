require('dotenv').config();

console.log("Server file loaded");

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Replace this with your real Spoonacular API key
const API_KEY = "process.env.API_KEY";

// ============================
// ROOT ROUTE

// ============================

app.get("/", (req, res) => {
    res.send("Backend is working");
});

// ============================
// RECIPES LIST ROUTE
// ============================

app.get("/recipes", async (req, res) => {

    console.log(">>> /recipes route triggered <<<");

    const ingredients = req.query.ingredients;
    const offset = parseInt(req.query.offset) || 0;

    if (!ingredients) {
        return res.status(400).json({ error: "Ingredients required" });
    }

    try {
        const response = await axios.get(
            "https://api.spoonacular.com/recipes/complexSearch",
            {
                params: {
                    query: ingredients,
                    addRecipeInformation: true,
                    number: 6,
                    offset: offset,
                    apiKey: API_KEY
                }
            }
        );

        res.json(response.data.results);

    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});


// ============================
// START SERVER
// ============================

app.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
});

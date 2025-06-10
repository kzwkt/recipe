// main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const recipeListSection = document.getElementById('recipe-list-section');
    const recipesContainer = document.getElementById('recipes-container');
    const loadingMessage = document.getElementById('loading-message');
    const recipeContentSection = document.getElementById('recipe-content-section');
    const recipeBodyDiv = document.getElementById('recipe-body');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const homeLink = document.getElementById('home-link');
    const browseIndexLink = document.getElementById('browse-index-link');
    const indexControlsContainer = document.getElementById('index-controls-container');
    const alphabetNavContainer = document.getElementById('alphabet-nav-container');

    // --- Global State Variables ---
    const recipeCache = {}; // Cache for individual recipe HTML content
    let allRecipes = []; // Stores the full list of all recipes loaded from manifest
    let currentStartingLetter = ''; // Tracks the currently selected letter filter (e.g., 'C' for Chicken)
    let currentDisplayMode = 'home'; // Tracks the active view: 'home' (all recipes) or 'index' (A-Z filter)

    // --- Base Path for Assets (adjust if your GitHub Pages setup is different) ---
    // Example: if your repo is 'my-recipes' and it's deployed to 'username.github.io/my-recipes/',
    // then BASE_PATH should be '/my-recipes'.
    // If it's a project page at 'username.github.io/', it might be empty or just '/'.
    const BASE_PATH = '/recipe'; 

    // --- Asynchronous Function to Fetch Recipe Manifest ---
    async function getRecipeManifest() {
        try {
            const response = await fetch(`${BASE_PATH}/recipes-list.json`);
            if (!response.ok) {
                // Handle 404 specifically for better debugging
                if (response.status === 404) {
                    console.warn('recipes-list.json not found. Ensure it\'s generated and the BASE_PATH is correct.');
                    loadingMessage.textContent = 'Recipes list not found. Please check deployment.';
                    return [];
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching recipes-list.json:', error);
            loadingMessage.textContent = 'Error loading recipes. Please check the browser console for details.';
            return [];
        }
    }

    // --- Core Function: Update the Displayed Recipe List based on Current Mode/Filters ---
    function updateRecipeDisplay() {
        recipesContainer.innerHTML = ''; // Clear previous recipe list
        loadingMessage.style.display = 'block'; // Show loading/message by default

        let recipesToDisplay = []; // Array to hold recipes that will be shown

        // Logic based on the current display mode
        if (currentDisplayMode === 'home') {
            indexControlsContainer.style.display = 'none'; // Hide A-Z controls in home mode
            recipesToDisplay = allRecipes; // In home mode, display all recipes
            loadingMessage.style.display = 'none'; // Hide loading message if we have recipes

            if (allRecipes.length === 0) {
                loadingMessage.style.display = 'block';
                loadingMessage.textContent = 'No recipes found to display. Check recipes-list.json.';
            }

        } else if (currentDisplayMode === 'index') {
            indexControlsContainer.style.display = 'block'; // Show A-Z controls in index mode

            // If a letter is selected, filter recipes by that letter
            if (currentStartingLetter) {
                recipesToDisplay = allRecipes.filter(recipe =>
                    recipe.title.charAt(0).toUpperCase() === currentStartingLetter
                );
            } else {
                recipesToDisplay = []; // If no letter is selected, show an empty list
            }

            // Adjust loading message based on selection and results
            if (currentStartingLetter && recipesToDisplay.length === 0) {
                loadingMessage.textContent = `No recipes found starting with '${currentStartingLetter}'.`;
                loadingMessage.style.display = 'block';
            } else if (!currentStartingLetter) {
                loadingMessage.textContent = 'Select a letter above to browse recipes.';
                loadingMessage.style.display = 'block';
            } else {
                 loadingMessage.style.display = 'none'; // Hide message if a letter is selected and results are found
            }
        }

        // --- Render the Filtered Recipe List ---
        const ul = document.createElement('ul');
        ul.classList.add('recipe-list');

        recipesToDisplay.forEach(recipe => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${recipe.id}`; // Link to the recipe's unique ID
            a.textContent = recipe.title;
            a.dataset.filename = recipe.file; // Store filename for content loading
            a.classList.add('recipe-link');
            li.appendChild(a);

            // Optionally display tags next to the title
            if (recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.classList.add('recipe-tags-display');
                recipe.tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.classList.add('recipe-tag-badge');
                    span.textContent = tag;
                    tagsDiv.appendChild(span);
                });
                li.appendChild(tagsDiv);
            }
            ul.appendChild(li);
        });
        recipesContainer.appendChild(ul); // Append the complete list to the container
    }

    // --- Function to Dynamically Display the A-Z Navigation Bar ---
    function displayAlphabeticalNav() {
        alphabetNavContainer.innerHTML = ''; // Clear existing A-Z navigation
        const navUl = document.createElement('ul');
        navUl.classList.add('alphabet-nav-list');

        // Identify which letters actually have recipes to enable them
        const existingFirstLetters = new Set();
        allRecipes.forEach(recipe => {
            existingFirstLetters.add(recipe.title.charAt(0).toUpperCase());
        });

        // Loop through all letters A-Z to create the navigation
        for (let i = 65; i <= 90; i++) { // ASCII A=65, Z=90
            const letter = String.fromCharCode(i);
            const li = document.createElement('li');
            const navLink = document.createElement('a');
            navLink.href = '#'; // Links act as filters, not direct anchors
            navLink.textContent = letter;
            navLink.classList.add('alphabet-nav-link');

            // Apply 'active' class if this letter is currently selected
            if (currentStartingLetter === letter) {
                navLink.classList.add('active');
            }

            // Disable letters that have no corresponding recipes
            if (!existingFirstLetters.has(letter)) {
                navLink.classList.add('disabled-letter');
                navLink.style.pointerEvents = 'none'; // Make it unclickable via CSS
            } else {
                // Attach click event listener for clickable letters
                navLink.addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent default link behavior

                    // Toggle selected letter logic
                    if (currentStartingLetter === letter) {
                        currentStartingLetter = ''; // Deselect if already active
                    } else {
                        currentStartingLetter = letter; // Select new letter
                    }
                    
                    displayAlphabeticalNav(); // Re-render A-Z nav to update active state
                    updateRecipeDisplay(); // Re-filter and display recipes
                });
            }
            li.appendChild(navLink);
            navUl.appendChild(li);
        }
        alphabetNavContainer.appendChild(navUl); // Add the A-Z list to the container
    }

    // --- Asynchronous Function to Load Individual Recipe Content ---
    async function loadRecipeContent(filename) {
        recipeListSection.style.display = 'none'; // Hide the list view
        recipeContentSection.style.display = 'block'; // Show the content view
        recipeBodyDiv.innerHTML = 'Loading recipe...'; // Display loading message

        // Check if content is already in cache
        if (recipeCache[filename]) {
            recipeBodyDiv.innerHTML = recipeCache[filename];
            return;
        }

        try {
            const response = await fetch(`${BASE_PATH}/blog/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const htmlContent = await response.text();

            recipeCache[filename] = htmlContent; // Store in cache
            recipeBodyDiv.innerHTML = htmlContent; // Display content
        } catch (error) {
            console.error('Error loading recipe content:', error);
            recipeBodyDiv.innerHTML = `<p style="color: red;">Failed to load recipe: ${filename}.</p>`;
        }
    }

    // --- Event Listeners ---

    // Listener for individual recipe links in the list
    recipesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('recipe-link')) {
            event.preventDefault(); // Stop default link navigation
            const filename = event.target.dataset.filename;
            loadRecipeContent(filename);
            window.location.hash = event.target.href.split('#')[1]; // Update URL hash for direct linking
        }
    });

    // Listener for the "Back to Recipes" button
    backToListBtn.addEventListener('click', () => {
        window.location.hash = ''; // Clear hash to return to list view
    });

    // Listener for the "Home" navigation link
    homeLink.addEventListener('click', (event) => {
        event.preventDefault();
        currentDisplayMode = 'home'; // Set mode to home
        currentStartingLetter = ''; // Clear any active letter filter
        displayAlphabeticalNav(); // Re-render A-Z nav to clear active state
        window.location.hash = ''; // Clear URL hash
        updateRecipeDisplay(); // Update display to show all recipes
    });

    // Listener for the "Browse Index" navigation link
    browseIndexLink.addEventListener('click', (event) => {
        event.preventDefault();
        currentDisplayMode = 'index'; // Set mode to index
        currentStartingLetter = ''; // Start index mode with no letter selected
        displayAlphabeticalNav(); // Initialize/re-render A-Z nav
        window.location.hash = ''; // Clear URL hash
        updateRecipeDisplay(); // Update display for index view (initially empty list, prompt to click letter)
    });

    // Listener for browser's hash changes (for direct links to recipes or back button)
    window.addEventListener('hashchange', async () => {
        const recipeHashId = window.location.hash.substring(1); // Get ID from hash
        if (recipeHashId) {
            // Ensure allRecipes is populated before searching for a recipe
            if (allRecipes.length === 0) {
                allRecipes = await getRecipeManifest();
            }
            const targetRecipe = allRecipes.find(r => r.id === recipeHashId);
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file);
            } else {
                // If hash is invalid, default to home view
                currentDisplayMode = 'home';
                currentStartingLetter = '';
                displayAlphabeticalNav();
                updateRecipeDisplay();
            }
        } else {
            // If hash is empty, show the appropriate list based on currentDisplayMode
            updateRecipeDisplay();
        }
    });

    // --- Initialization Function: Runs when the page first loads ---
    async function initializePage() {
        loadingMessage.textContent = 'Loading recipes...'; // Initial message
        allRecipes = await getRecipeManifest(); // Fetch all recipes once

        // --- DEBUGGING: Check if recipes were loaded ---
        console.log("Recipes loaded and available in scope:", allRecipes); 

        if (allRecipes.length === 0) {
            loadingMessage.textContent = 'No recipes found to display. Please ensure recipes-list.json is correctly generated and accessible.';
            return; // Stop if no recipes are loaded
        }

        // Sort all recipes alphabetically by title once after loading for consistent display
        allRecipes.sort((a, b) => a.title.localeCompare(b.title));

        // Initialize the A-Z navigation (it's hidden initially by CSS in home mode)
        displayAlphabeticalNav(); 

        // Check URL hash for direct links to recipes on initial load
        if (window.location.hash) {
            const recipeHashId = window.location.hash.substring(1);
            const targetRecipe = allRecipes.find(r => r.id === recipeHashId);
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file);
            } else {
                currentDisplayMode = 'home'; // Invalid hash, default to home view
                updateRecipeDisplay();
            }
        } else {
            currentDisplayMode = 'home'; // No hash, default to home view
            updateRecipeDisplay(); // Display the initial list
        }
    }

    // Call the initialization function when the DOM is ready
    initializePage();
});

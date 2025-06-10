document.addEventListener('DOMContentLoaded', () => {
    const recipeListSection = document.getElementById('recipe-list-section');
    const recipesContainer = document.getElementById('recipes-container');
    const loadingMessage = document.getElementById('loading-message');
    const recipeContentSection = document.getElementById('recipe-content-section');
    const recipeBodyDiv = document.getElementById('recipe-body');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const homeLink = document.getElementById('home-link');

    // NEW: Index Controls Container & Browse Index Link
    const indexControlsContainer = document.getElementById('index-controls-container');
    const alphabetNavContainer = document.getElementById('alphabet-nav-container');
    const browseIndexLink = document.getElementById('browse-index-link');

    const recipeCache = {};
    let allRecipes = []; // Full list of all recipes
    let currentStartingLetter = ''; // Stores the selected letter for filtering in index mode

    // NEW: Track current display mode ('home' or 'index')
    let currentDisplayMode = 'home';

    const BASE_PATH = '/recipe';

    async function getRecipeManifest() {
        try {
            const response = await fetch(`${BASE_PATH}/recipes-list.json`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('recipes-list.json not found. It might not have been generated yet or the path is incorrect.');
                    return [];
                }
                throw new Error(`Failed to load recipes-list.json! Status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching recipes-list.json:', error);
            loadingMessage.textContent = 'Error loading recipes. Please check the console for details.';
            return [];
        }
    }

    // --- NEW: Function to manage the display based on current mode and filters ---
    function updateRecipeDisplay() {
        recipesContainer.innerHTML = ''; // Clear previous list
        loadingMessage.style.display = 'block'; // Show loading message by default

        let recipesToDisplay = [];

        if (currentDisplayMode === 'home') {
            indexControlsContainer.style.display = 'none'; // Hide A-Z controls
            recipesToDisplay = allRecipes; // Show all recipes in home mode
            loadingMessage.style.display = 'none'; // Hide if home mode shows all
            if (allRecipes.length === 0) {
                loadingMessage.style.display = 'block';
                loadingMessage.textContent = 'No recipes found.';
            }

        } else if (currentDisplayMode === 'index') {
            indexControlsContainer.style.display = 'block'; // Show A-Z controls
            // If a letter is selected, filter recipes
            if (currentStartingLetter) {
                recipesToDisplay = allRecipes.filter(recipe =>
                    recipe.title.charAt(0).toUpperCase() === currentStartingLetter
                );
            } else {
                recipesToDisplay = []; // No letter selected, so display nothing yet
            }

            if (currentStartingLetter && recipesToDisplay.length === 0) {
                loadingMessage.textContent = `No recipes found starting with '${currentStartingLetter}'.`;
                loadingMessage.style.display = 'block';
            } else if (!currentStartingLetter) {
                loadingMessage.textContent = 'Select a letter above to browse recipes.';
                loadingMessage.style.display = 'block';
            } else {
                 loadingMessage.style.display = 'none'; // Hide if a letter is selected and there are results
            }
        }

        // --- Render the Recipe List ---
        const ul = document.createElement('ul');
        ul.classList.add('recipe-list');

        recipesToDisplay.forEach(recipe => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${recipe.id}`;
            a.textContent = recipe.title;
            a.dataset.filename = recipe.file;
            a.classList.add('recipe-link');
            li.appendChild(a);

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
        recipesContainer.appendChild(ul);
    }

    // --- Function to display the A-Z navigation bar ---
    function displayAlphabeticalNav() {
        alphabetNavContainer.innerHTML = ''; // Clear existing nav
        const navUl = document.createElement('ul');
        navUl.classList.add('alphabet-nav-list');

        const existingFirstLetters = new Set();
        allRecipes.forEach(recipe => {
            existingFirstLetters.add(recipe.title.charAt(0).toUpperCase());
        });

        for (let i = 65; i <= 90; i++) { // A-Z
            const letter = String.fromCharCode(i);
            const li = document.createElement('li');
            const navLink = document.createElement('a');
            navLink.href = '#'; // Use '#' as it's a filter
            navLink.textContent = letter;
            navLink.classList.add('alphabet-nav-link');

            // Set active class if this letter is currently selected
            if (currentStartingLetter === letter) {
                navLink.classList.add('active');
            }

            // Optionally disable or style letters with no recipes
            if (!existingFirstLetters.has(letter)) {
                navLink.classList.add('disabled-letter');
                navLink.style.pointerEvents = 'none'; // Make it unclickable
            } else {
                // Add click behavior for active letters
                navLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (currentStartingLetter === letter) {
                        currentStartingLetter = ''; // Deselect if already active
                    } else {
                        currentStartingLetter = letter; // Select new letter
                    }
                    // Re-render nav to update active state
                    displayAlphabeticalNav();
                    // Update recipe display based on new filter
                    updateRecipeDisplay();
                });
            }
            li.appendChild(navLink);
            navUl.appendChild(li);
        }
        alphabetNavContainer.appendChild(navUl);
    }

    async function loadRecipeContent(filename) {
        recipeListSection.style.display = 'none';
        recipeContentSection.style.display = 'block';
        recipeBodyDiv.innerHTML = 'Loading recipe...';

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

            recipeCache[filename] = htmlContent;
            recipeBodyDiv.innerHTML = htmlContent;

        } catch (error) {
            console.error('Error loading recipe content:', error);
            recipeBodyDiv.innerHTML = `<p style="color: red;">Failed to load recipe: ${filename}.</p>`;
        }
    }

    // --- Event Listeners ---
    recipesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('recipe-link')) {
            event.preventDefault();
            const filename = event.target.dataset.filename;
            loadRecipeContent(filename);
            window.location.hash = event.target.href.split('#')[1];
        }
    });

    backToListBtn.addEventListener('click', () => {
        window.location.hash = ''; // Clear hash to go back to list
    });

    homeLink.addEventListener('click', (event) => {
        event.preventDefault();
        currentDisplayMode = 'home';
        currentStartingLetter = ''; // Clear letter filter when going to home
        displayAlphabeticalNav(); // Update A-Z nav state
        window.location.hash = ''; // Clear hash
        updateRecipeDisplay(); // Show home list
    });

    // NEW: Browse Index Link Event Listener
    browseIndexLink.addEventListener('click', (event) => {
        event.preventDefault();
        currentDisplayMode = 'index';
        currentStartingLetter = ''; // Start index mode with no letter selected
        displayAlphabeticalNav(); // Initialize A-Z nav
        window.location.hash = ''; // Clear hash
        updateRecipeDisplay(); // Show index view
    });


    // Handle hash changes and initial page load
    window.addEventListener('hashchange', async () => {
        const recipeHashId = window.location.hash.substring(1);
        if (recipeHashId) {
            if (allRecipes.length === 0) { // Ensure allRecipes is populated
                allRecipes = await getRecipeManifest();
            }
            const targetRecipe = allRecipes.find(r => r.id === recipeHashId);
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file);
            } else {
                // If hash is invalid, go to home view
                currentDisplayMode = 'home';
                currentStartingLetter = '';
                displayAlphabeticalNav();
                updateRecipeDisplay();
            }
        } else {
            // Hash is empty, show the appropriate list based on currentDisplayMode
            updateRecipeDisplay();
        }
    });

    // --- Initial Page Load Logic ---
    async function initializePage() {
        allRecipes = await getRecipeManifest(); // Fetch all recipes once

        if (allRecipes.length === 0) {
            loadingMessage.textContent = 'No recipes found to display.';
            return;
        }

        // Sort recipes once, at the beginning, for consistent alphabetical display
        allRecipes.sort((a, b) => a.title.localeCompare(b.title));

        displayAlphabeticalNav(); // Initialize the A-Z navigation (it's hidden initially)

        // Check hash for direct recipe link, otherwise show home list
        if (window.location.hash) {
            const recipeHashId = window.location.hash.substring(1);
            const targetRecipe = allRecipes.find(r => r.id === recipeHashId);
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file);
            } else {
                currentDisplayMode = 'home'; // Invalid hash, default to home
                updateRecipeDisplay();
            }
        } else {
            currentDisplayMode = 'home'; // No hash, default to home view
            updateRecipeDisplay();
        }
    }

    initializePage();
});

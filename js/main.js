document.addEventListener('DOMContentLoaded', () => {
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

    const recipeCache = {};
    let allRecipes = [];
    let currentStartingLetter = '';
    let currentDisplayMode = 'home';

    const BASE_PATH = '/recipe'; 

    async function getRecipeManifest() {
        try {
            const response = await fetch(`${BASE_PATH}/recipes-list.json`);
            if (!response.ok) {
                if (response.status === 404) {
                    loadingMessage.textContent = 'Recipes list not found. Please check deployment and console.';
                    return [];
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            loadingMessage.textContent = 'Error loading recipes. Please check the browser console for details.';
            return [];
        }
    }

    function updateRecipeDisplay() {
        recipeContentSection.style.display = 'none';
        recipeListSection.style.display = 'block';

        recipesContainer.innerHTML = '';
        loadingMessage.style.display = 'block';

        let recipesToDisplay = [];

        if (currentDisplayMode === 'home') {
            indexControlsContainer.style.display = 'none';
            recipesToDisplay = allRecipes;
            loadingMessage.style.display = 'none';

            if (allRecipes.length === 0) {
                loadingMessage.style.display = 'block';
                loadingMessage.textContent = 'No recipes found to display. Check recipes-list.json.';
            }

        } else if (currentDisplayMode === 'index') {
            indexControlsContainer.style.display = 'block';

            recipesToDisplay = currentStartingLetter
                ? allRecipes.filter(recipe => recipe.title?.charAt(0).toUpperCase() === currentStartingLetter)
                : [];

            if (currentStartingLetter && recipesToDisplay.length === 0) {
                loadingMessage.textContent = `No recipes found starting with '${currentStartingLetter}'.`;
                loadingMessage.style.display = 'block';
            } else if (!currentStartingLetter) {
                loadingMessage.textContent = 'Select a letter above to browse recipes.';
                loadingMessage.style.display = 'block';
            } else {
                 loadingMessage.style.display = 'none';
            }
        }

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

    function displayAlphabeticalNav() {
        alphabetNavContainer.innerHTML = '';
        const navUl = document.createElement('ul');
        navUl.classList.add('alphabet-nav-list');

        const existingFirstLetters = new Set(
            allRecipes.map(recipe => recipe.title?.charAt(0).toUpperCase()).filter(Boolean)
        );

        const sortedAvailableLetters = Array.from(existingFirstLetters).sort();

        sortedAvailableLetters.forEach(letter => {
            const li = document.createElement('li');
            const navLink = document.createElement('a');
            navLink.href = '#';
            navLink.textContent = letter;
            navLink.classList.add('alphabet-nav-link');

            if (currentStartingLetter === letter) {
                navLink.classList.add('active');
            }

            navLink.addEventListener('click', (event) => {
                event.preventDefault();
                currentStartingLetter = (currentStartingLetter === letter) ? '' : letter;
                displayAlphabeticalNav();
                updateRecipeDisplay();
            });

            li.appendChild(navLink);
            navUl.appendChild(li);
        });
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
            recipeBodyDiv.innerHTML = `<p style="color: red;">Failed to load recipe: ${filename}.</p>`;
        }
    }

    recipesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('recipe-link')) {
            event.preventDefault();
            const filename = event.target.dataset.filename;
            loadRecipeContent(filename);
            window.location.hash = event.target.href.split('#')[1];
        }
    });

    backToListBtn.addEventListener('click', () => {
        window.location.hash = ''; 
    });

    homeLink.addEventListener('click', (event) => {
        event.preventDefault();
        currentDisplayMode = 'home';
        currentStartingLetter = '';
        displayAlphabeticalNav();
        window.location.hash = '';
        updateRecipeDisplay();
    });

    browseIndexLink.addEventListener('click', (event) => {
        event.preventDefault();
        currentDisplayMode = 'index';
        currentStartingLetter = '';
        displayAlphabeticalNav();
        window.location.hash = '';
        updateRecipeDisplay();
    });

    window.addEventListener('hashchange', async () => {
        const recipeHashId = window.location.hash.substring(1);
        if (recipeHashId) {
            if (allRecipes.length === 0) {
                allRecipes = await getRecipeManifest();
            }
            const targetRecipe = allRecipes.find(r => r.id === recipeHashId);
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file);
            } else {
                currentDisplayMode = 'home';
                currentStartingLetter = '';
                displayAlphabeticalNav();
                updateRecipeDisplay();
            }
        } else {
            updateRecipeDisplay();
        }
    });

    async function initializePage() {
        loadingMessage.textContent = 'Loading recipes...';
        allRecipes = await getRecipeManifest();

        if (allRecipes.length === 0) {
            loadingMessage.textContent = 'No recipes found to display. Please ensure recipes-list.json is correctly generated and accessible.';
            return;
        }

        allRecipes.sort((a, b) => a.title.localeCompare(b.title));

        displayAlphabeticalNav();

        if (window.location.hash) {
            const recipeHashId = window.location.hash.substring(1);
            const targetRecipe = allRecipes.find(r => r.id === recipeHashId);
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file);
            } else {
                currentDisplayMode = 'home';
                updateRecipeDisplay();
            }
        } else {
            currentDisplayMode = 'home';
            updateRecipeDisplay();
        }
    }

    initializePage();
});

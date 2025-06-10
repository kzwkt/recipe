document.addEventListener('DOMContentLoaded', () => {
    // Get references to key elements in the HTML
    const recipeListSection = document.getElementById('recipe-list-section');
    const recipesContainer = document.getElementById('recipes-container'); // Container for the recipe links
    const loadingMessage = document.getElementById('loading-message');
    const recipeContentSection = document.getElementById('recipe-content-section');
    const recipeBodyDiv = document.getElementById('recipe-body'); // Div to load recipe HTML into
    const backToListBtn = document.getElementById('back-to-list-btn');
    const homeLink = document.getElementById('home-link');

    // Use a cache to store loaded recipe contents to avoid re-fetching the same recipe multiple times
    const recipeCache = {};

    // --- IMPORTANT: Define the base path for your GitHub Project Page ---
    // This should be your repository name (e.g., 'recipe' if your URL is https://kzwkt.github.io/recipe/)
    const BASE_PATH = '/recipe'; // <--- Make sure this matches your repository name!

    // --- Function to fetch the pre-generated recipes-list.json manifest ---
    async function getRecipeManifest() {
        try {
            // Fetch the JSON file using the correct base path
            const response = await fetch(`${BASE_PATH}/recipes-list.json`);
            if (!response.ok) {
                // Handle cases where the file might not be found (e.g., first deployment)
                if (response.status === 404) {
                    console.warn('recipes-list.json not found. It might not have been generated yet or the path is incorrect.');
                    return []; // Return an empty array if not found
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

    // --- Function to display the list of recipes on the homepage ---
    async function displayRecipeList() {
        recipeListSection.style.display = 'block'; // Show the list section
        recipeContentSection.style.display = 'none'; // Hide the individual recipe section
        recipeBodyDiv.innerHTML = ''; // Clear any previously loaded recipe content
        loadingMessage.style.display = 'block'; // Show loading message

        // Clear any existing list items before re-rendering to prevent duplicates
        const existingUl = recipesContainer.querySelector('ul.recipe-list');
        if (existingUl) {
            existingUl.remove();
        }

        const recipes = await getRecipeManifest(); // Fetch the recipe manifest

        if (recipes.length === 0) {
            loadingMessage.textContent = 'No recipes found yet!';
            return;
        }

        const ul = document.createElement('ul');
        ul.classList.add('recipe-list'); // Add a class for potential styling

        recipes.forEach(recipe => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${recipe.id}`; // Use the 'id' from the JSON for URL hash navigation
            a.textContent = recipe.title; // Display the clean title from the JSON
            a.dataset.filename = recipe.file; // Store the original filename to fetch the content later
            a.classList.add('recipe-link'); // Add a class for event delegation
            li.appendChild(a);
            ul.appendChild(li);
        });

        recipesContainer.appendChild(ul); // Add the generated list to the container
        loadingMessage.style.display = 'none'; // Hide loading message
    }

    // --- Function to load and display a specific recipe's content ---
    async function loadRecipeContent(filename) {
        recipeListSection.style.display = 'none'; // Hide the list section
        recipeContentSection.style.display = 'block'; // Show the individual recipe section
        recipeBodyDiv.innerHTML = 'Loading recipe...'; // Show a loading indicator

        // Check if the recipe content is already in the cache
        if (recipeCache[filename]) {
            recipeBodyDiv.innerHTML = recipeCache[filename];
            return; // Exit if already cached
        }

        try {
            // Fetch the recipe's HTML content using the correct base path
            const response = await fetch(`${BASE_PATH}/blog/${filename}`); // <--- Modified path here
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const htmlContent = await response.text(); // Get the raw HTML content

            recipeCache[filename] = htmlContent; // Store content in cache
            recipeBodyDiv.innerHTML = htmlContent; // Inject the HTML content into the div

        } catch (error) {
            console.error('Error loading recipe content:', error);
            recipeBodyDiv.innerHTML = `<p style="color: red;">Failed to load recipe: ${filename}.</p>`;
        }
    }

    // --- Event Listener for Clicks on Recipe Links ---
    // Using event delegation on the container for efficiency
    recipesContainer.addEventListener('click', (event) => {
        // Check if the clicked element is a recipe link
        if (event.target.classList.contains('recipe-link')) {
            event.preventDefault(); // Prevent default link behavior (page reload)
            const filename = event.target.dataset.filename; // Get the filename from data-filename attribute
            loadRecipeContent(filename); // Load the recipe content
            window.location.hash = event.target.href.split('#')[1]; // Update URL hash for direct linking/back button
        }
    });

    // --- Event Listener for the "Back to Recipes" button ---
    backToListBtn.addEventListener('click', () => {
        // Clearing the hash will trigger the 'hashchange' event,
        // which then correctly calls displayRecipeList.
        window.location.hash = ''; 
    });

    // --- Event Listener for the "Home" navigation link ---
    homeLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        // Clearing the hash will trigger the 'hashchange' event,
        // which then correctly calls displayRecipeList.
        window.location.hash = ''; 
    });

    // --- Handle Browser History (Back/Forward buttons) and Direct URL Access with Hash ---
    window.addEventListener('hashchange', async () => {
        const recipeHashId = window.location.hash.substring(1); // Get the ID from the URL hash (remove '#')
        if (recipeHashId) {
            const recipes = await getRecipeManifest(); // Get the manifest to find the file
            const targetRecipe = recipes.find(r => r.id === recipeHashId); // Find the recipe by its ID
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file); // Load the recipe content if found
            } else {
                displayRecipeList(); // If hash doesn't match a recipe, show the list
            }
        } else {
            // This is the sole, correct place to call displayRecipeList when the hash is empty
            displayRecipeList(); 
        }
    });

    // --- Initial Page Load Logic ---
    // This runs once when the page first loads to determine what to display
    async function initializePage() {
        if (window.location.hash) {
            const recipeHashId = window.location.hash.substring(1);
            const recipes = await getRecipeManifest(); // Fetch manifest for initial hash check
            const targetRecipe = recipes.find(r => r.id === recipeHashId);
            if (targetRecipe) {
                loadRecipeContent(targetRecipe.file); // Load specific recipe if hash matches
            } else {
                displayRecipeList(); // Otherwise, show the full list
            }
        } else {
            displayRecipeList(); // No hash present, so just show the list
        }
    }

    // Call the initialization function when the DOM is ready
    initializePage();
});

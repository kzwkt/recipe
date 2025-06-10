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

        const recipes = await getRecipeManifest(); //

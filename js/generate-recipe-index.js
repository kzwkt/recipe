// This script reads the blog/recipe content folder and generates a JSON index.

const fs = require('fs');
const path = require('path');

// Read environment variables passed from the GitHub Actions workflow
const blogPath = process.env.BLOG_CONTENT_FOLDER;
const outputPath = process.env.OUTPUT_INDEX_DB_FILE;

// Helper function to convert a filename (e.g., 'tomato-meat-machillo-receipe.html')
// into a clean, readable title (e.g., 'Tomato Meat Machillo Receipe')
function filenameToTitle(filename) {
  let title = filename.replace('.html', ''); // Remove .html extension
  title = title.replace(/-/g, ' '); // Replace hyphens with spaces
  // Capitalize the first letter of each word
  title = title.replace(/\b\w/g, char => char.toUpperCase());
  return title;
}

// Main function to execute the generation logic
async function generateRecipeIndex() {
  try {
    // Check if the blog folder exists
    if (!fs.existsSync(blogPath)) {
      console.warn(`Warning: Blog content folder '${blogPath}' not found. Generating an empty recipes-list.json.`);
      fs.writeFileSync(outputPath, '[]');
      return; // Exit if folder doesn't exist
    }

    const files = fs.readdirSync(blogPath); // Read directory synchronously for simplicity in script

    // Filter for HTML files and sort them (e.g., alphabetically descending for consistent order)
    const recipeFiles = files
      .filter(file => file.endsWith('.html'))
      .sort((a, b) => b.localeCompare(a)); // Sorts newest first if filenames are date-prefixed

    // Map the filtered files into an array of recipe objects
    const recipes = recipeFiles.map(file => ({
      id: file.replace('.html', ''),   // Create a unique ID from the filename (for URL hashes)
      title: filenameToTitle(file),    // Generate the clean title for display
      file: file                       // Keep the original filename to fetch content later
    }));

    // Write the generated recipes array to the JSON file
    fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2));
    console.log(`Successfully generated ${outputPath} with ${recipes.length} recipes.`);

  } catch (err) {
    console.error('Error generating recipes-list.json:', err);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
}

// Execute the main function
generateRecipeIndex();

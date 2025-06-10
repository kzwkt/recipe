document.addEventListener('DOMContentLoaded', () => {
    const postsListSection = document.getElementById('blog-posts-list');
    const loadingMessage = document.getElementById('loading-message');
    const postContentSection = document.getElementById('blog-post-content');
    const postBodyDiv = document.getElementById('post-body');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const homeLink = document.getElementById('home-link');

    const GITHUB_USERNAME = 'YOUR_GITHUB_USERNAME'; // REPLACE THIS with your GitHub username
    const REPO_NAME = 'YOUR_REPO_NAME'; // REPLACE THIS with your repository name
    const BLOG_FOLDER_PATH = 'blog'; // The folder where your blog HTML files are

    // Cache to store loaded post contents to avoid re-fetching
    const postCache = {};

    // Function to get list of blog post files from GitHub API
    async function getBlogPostFiles() {
        // GitHub API endpoint for directory contents
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${BLOG_FOLDER_PATH}`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    console.error('GitHub API returned 404. Check username, repo name, and folder path.');
                }
                throw new Error(`GitHub API error! Status: ${response.status}`);
            }
            const files = await response.json();
            // Filter for HTML files and sort them (e.g., alphabetically or by a naming convention for dates)
            const htmlFiles = files
                .filter(file => file.type === 'file' && file.name.endsWith('.html'))
                // You might want to sort these if your filenames aren't implicitly ordered (e.g., by date prefix)
                .sort((a, b) => b.name.localeCompare(a.name)); // Example: sort Z-A by filename

            return htmlFiles;

        } catch (error) {
            console.error('Error fetching blog post files from GitHub API:', error);
            loadingMessage.textContent = 'Error loading posts. Please check console.';
            return [];
        }
    }

    // Function to display the list of blog posts
    async function displayPostList() {
        postsListSection.style.display = 'block';
        postContentSection.style.display = 'none';
        postBodyDiv.innerHTML = '';
        loadingMessage.style.display = 'block'; // Show loading message

        // Clear existing list items before re-rendering
        const existingUl = postsListSection.querySelector('ul.blog-list');
        if (existingUl) {
            existingUl.remove();
        }

        const files = await getBlogPostFiles();

        if (files.length === 0) {
            loadingMessage.textContent = 'No blog posts found.';
            return;
        }

        const ul = document.createElement('ul');
        ul.classList.add('blog-list');

        for (const file of files) {
            // Fetch the content of each file to get the first line (title)
            const fileContent = await fetch(`blog/${file.name}`)
                .then(response => response.text())
                .catch(error => {
                    console.error(`Error fetching content for ${file.name}:`, error);
                    return ''; // Return empty string on error
                });

            // Extract the first line as the title
            const firstLine = fileContent.split('\n')[0].trim();
            const title = firstLine || `Untitled Post (${file.name})`; // Fallback title

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${file.name.replace('.html', '')}`; // Use filename as hash ID
            a.textContent = title;
            a.dataset.filename = file.name; // Store full filename for loading
            a.classList.add('post-link');
            li.appendChild(a);
            ul.appendChild(li);
        }

        postsListSection.querySelector('h2').after(ul);
        loadingMessage.style.display = 'none'; // Hide loading message
    }

    // Function to load and display a specific blog post
    async function loadBlogPost(filename) {
        postsListSection.style.display = 'none';
        postContentSection.style.display = 'block';
        postBodyDiv.innerHTML = 'Loading post...'; // Show loading indicator for post

        // Check cache first
        if (postCache[filename]) {
            postBodyDiv.innerHTML = postCache[filename];
            return;
        }

        try {
            const response = await fetch(`blog/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const htmlContent = await response.text();

            // Store in cache
            postCache[filename] = htmlContent;

            postBodyDiv.innerHTML = htmlContent;
        } catch (error) {
            console.error('Error loading blog post:', error);
            postBodyDiv.innerHTML = `<p style="color: red;">Failed to load post: ${filename}.</p>`;
        }
    }

    // Event listener for clicks on the blog post links (using delegation)
    postsListSection.addEventListener('click', (event) => {
        if (event.target.classList.contains('post-link')) {
            event.preventDefault();
            const filename = event.target.dataset.filename;
            loadBlogPost(filename);
            window.location.hash = event.target.href.split('#')[1];
        }
    });

    // Event listener for "Back to Posts" button
    backToListBtn.addEventListener('click', () => {
        window.location.hash = ''; // Clear the hash
        displayPostList();
    });

    // Event listener for "Home" link
    homeLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.hash = ''; // Clear the hash
        displayPostList();
    });


    // Handle direct URL access with hash (e.g., yourpage.github.io/#my-first-post)
    window.addEventListener('hashchange', () => {
        const postHashId = window.location.hash.substring(1);
        if (postHashId) {
             // We need to map the hash ID back to the full filename.
             // This assumes filenames are unique and match the hash format (e.g., 'my-first-post').
             // A more robust solution might store the filename in the hash, e.g. #file=my-first-post.html
             // For simplicity, we'll fetch the list again to find the file.
            getBlogPostFiles().then(files => {
                const targetFile = files.find(f => f.name.replace('.html', '') === postHashId);
                if (targetFile) {
                    loadBlogPost(targetFile.name);
                } else {
                    displayPostList(); // Hash not found, show list
                }
            }).catch(error => {
                console.error('Error finding post by hash:', error);
                displayPostList();
            });

        } else {
            displayPostList(); // No hash, show the list
        }
    });

    // Initial load: check if there's a hash, otherwise show list
    if (window.location.hash) {
        const postHashId = window.location.hash.substring(1);
        getBlogPostFiles().then(files => {
            const targetFile = files.find(f => f.name.replace('.html', '') === postHashId);
            if (targetFile) {
                loadBlogPost(targetFile.name);
            } else {
                displayPostList();
            }
        }).catch(error => {
            console.error('Error on initial hash load:', error);
            displayPostList();
        });
    } else {
        displayPostList();
    }
});

const fs = require('fs');
const path = require('path');

const articlesPath = path.join(process.cwd(), 'data', 'json', 'articles.json');

if (!fs.existsSync(articlesPath)) {
    console.error('articles.json not found at', articlesPath);
    process.exit(1);
}

// Function to convert slug to Title Case
function slugToTitle(slug) {
    if (!slug) return slug;

    // Split by hyphen or underscore
    return slug.split(/[-_]/).map(word => {
        // Handle numbers or special cases if needed, but simple capitalization is usually best for "Exact Match"
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

// Read Data
const data = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

let count = 0;
const updatedData = data.map(article => {
    if (article.slug) {
        const exactMatchTitle = slugToTitle(article.slug);

        // Only update if different
        if (article.title !== exactMatchTitle) {
            console.log(`Renaming: "${article.title}" -> "${exactMatchTitle}"`);
            count++;
            return {
                ...article,
                title: exactMatchTitle
            };
        }
    }
    return article;
});

// Update Data
if (count > 0) {
    fs.writeFileSync(articlesPath, JSON.stringify(updatedData, null, 2));
    console.log(`\nSuccessfully updated ${count} article titles to exact match keywords.`);
} else {
    console.log('\nNo titles needed updating.');
}

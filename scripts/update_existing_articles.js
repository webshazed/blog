const fs = require('fs');
const path = require('path');

const articlesPath = path.join(__dirname, '../data/json/articles.json');
const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

// Track updates
const updates = [];

// 1. Update "How To Store Cilantro In Fridge" (id: 1276) - add longevity info
const cilantroArticle = articles.find(a => a.id === 1276);
if (cilantroArticle) {
    // Add "how long does cilantro last" optimization to the content
    const longevitySection = `
<h2>How Long Does Cilantro Last?</h2>
<p>The longevity of cilantro depends entirely on how you store it. Here is a breakdown of <strong>how long cilantro lasts</strong> using different storage methods:</p>
<ul>
  <li><strong>Counter (no water):</strong> 1-2 days at most. The leaves will wilt quickly.</li>
  <li><strong>Refrigerator (loose in bag):</strong> 3-5 days before wilting and browning begins.</li>
  <li><strong>Refrigerator (water method):</strong> Up to 2-3 weeks with proper water changes.</li>
  <li><strong>Freezer (frozen whole or chopped):</strong> 3-6 months, though texture changes.</li>
</ul>
<p>Using the water jar method described below, you can extend cilantro's freshness significantly compared to leaving it loose in the crisper drawer.</p>
`;

    // Insert after the first paragraph
    const contentParts = cilantroArticle.content.split('</p>');
    if (contentParts.length > 1) {
        contentParts.splice(1, 0, longevitySection);
        cilantroArticle.content = contentParts.join('</p>');
    } else {
        cilantroArticle.content = cilantroArticle.content + longevitySection;
    }

    // Update excerpt to include longevity keyword
    cilantroArticle.excerpt = 'Learn how long cilantro lasts and the best methods to store fresh cilantro in your fridge. This guide covers the water jar method, paper towel technique, and freezing tips to keep herbs fresh for weeks.';
    cilantroArticle.updatedAt = new Date().toISOString();

    updates.push('✅ Updated cilantro article (id: 1276) - added "how long does cilantro last" section');
}

// 2. Update "Honey Garlic Fermented Recipe" (id: 1324) - add FAQ about floating garlic
const honeyGarlicArticle = articles.find(a => a.id === 1324);
if (honeyGarlicArticle) {
    const floatingGarlicFAQ = `
<p><strong>Q: Why is my garlic floating in honey?</strong><br>A: Garlic cloves float in honey because they contain air pockets and are less dense than honey. This is completely normal during the first few days of fermentation. As fermentation progresses and the garlic absorbs honey while releasing gases, the cloves will typically sink. To ensure even fermentation, flip your jar upside down daily for the first week to keep all cloves coated in honey.</p>
`;

    // Find the FAQ section and add the new question
    if (honeyGarlicArticle.content.includes('Frequently Asked Questions')) {
        honeyGarlicArticle.content = honeyGarlicArticle.content.replace(
            '<h2>Frequently Asked Questions</h2>',
            '<h2>Frequently Asked Questions</h2>\n' + floatingGarlicFAQ
        );
    } else {
        // Add FAQ section at the end if it doesn't exist
        honeyGarlicArticle.content += `
<h2>Frequently Asked Questions</h2>
${floatingGarlicFAQ}`;
    }

    honeyGarlicArticle.updatedAt = new Date().toISOString();

    updates.push('✅ Updated honey garlic article (id: 1324) - added floating garlic FAQ');
}

// 3. Update "Homemade Ricotta From Whey" (id: 1240) - optimize for "how do you make ricotta cheese from whey"
const ricottaArticle = articles.find(a => a.id === 1240);
if (ricottaArticle) {
    // Add the exact keyword phrase near the top of the content
    const keywordOptimization = `<p>Wondering <strong>how do you make ricotta cheese from whey</strong>? This guide walks you through the traditional Italian technique of transforming leftover whey into fresh, creamy ricotta using just a few simple ingredients.</p>

`;

    // Insert after the first paragraph or at the beginning
    if (ricottaArticle.content.startsWith('<p>')) {
        const firstPEnd = ricottaArticle.content.indexOf('</p>') + 4;
        ricottaArticle.content = ricottaArticle.content.slice(0, firstPEnd) + '\n' + keywordOptimization + ricottaArticle.content.slice(firstPEnd);
    } else {
        ricottaArticle.content = keywordOptimization + ricottaArticle.content;
    }

    // Update excerpt
    ricottaArticle.excerpt = 'Learn how do you make ricotta cheese from whey with this authentic Italian technique. This step-by-step guide shows you how to transform leftover whey into fresh, creamy homemade ricotta.';
    ricottaArticle.updatedAt = new Date().toISOString();

    updates.push('✅ Updated ricotta article (id: 1240) - optimized for "how do you make ricotta cheese from whey"');
}

// Save the updates
fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2));

// Report
console.log('\n=== Article Updates Complete ===\n');
updates.forEach(u => console.log(u));
console.log('\nTotal articles:', articles.length);

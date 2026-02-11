const fs = require('fs');
const path = require('path');

const ARTICLES_PATH = path.join(__dirname, '../data/json/articles.json');

const NEW_STYLES = `
<style>
  /* Improved Reviews CSS */
  .review-article {
      font-family: inherit;
      color: #333;
      line-height: 1.6;
  }
  
  /* Mobile Responsive Table Wrapper */
  .review-article .table-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border-radius: 8px;
  }
  
  .review-article table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 0; /* Margin handled by wrapper */
      font-size: 0.95em; 
      min-width: 600px; /* Force minimum width to trigger scroll on small screens */
      background: #fff;
  }
  .review-article thead tr { 
      background-color: #2c3e50 !important; 
      color: #ffffff !important; 
      text-align: left; 
  }
  .review-article th {
      background-color: #2c3e50 !important; 
      color: #ffffff !important;
      font-weight: 600;
  }
  .review-article th, .review-article td { 
      padding: 15px 20px; 
      border-bottom: 1px solid #eee; 
  }
  .review-article tbody tr { 
      border-bottom: 1px solid #eee; 
      transition: background-color 0.2s;
  }
  .review-article tbody tr:hover {
      background-color: #f1f2f6;
  }
  .review-article tbody tr:nth-of-type(even) { 
      background-color: #f8f9fa; 
  }
  .review-article tbody tr:last-of-type { 
      border-bottom: 3px solid #2c3e50; 
  }
  
  /* Disclaimer Box */
  .affiliate-disclaimer {
      background-color: #f8f9fa;
      border-left: 4px solid #2c3e50;
      padding: 15px;
      margin-bottom: 25px;
      font-size: 0.9em;
      color: #555;
      font-style: italic;
  }

  /* Button Styles */
  .review-article .cta-button, 
  .review-article .btn, 
  .review-article .button {
      display: inline-block;
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none !important;
      border-radius: 50px;
      font-weight: 700;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin: 10px 0;
      border: none;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 1px;
      cursor: pointer;
      white-space: nowrap;
  }
  .review-article .cta-button:hover, 
  .review-article .btn:hover,
  .review-article .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.2);
      filter: brightness(110%);
  }

  /* Table Title Links */
  .review-article table td a:not(.btn):not(.button):not(.cta-button) {
      color: #2c3e50;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.2s;
  }
  .review-article table td a:not(.btn):not(.button):not(.cta-button):hover {
      color: #e74c3c;
      text-decoration: underline;
  }

  /* Responsive Images in Table */
  .review-article table img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
  }
  
  @media (max-width: 768px) {
      .review-article table img {
          max-width: 80px !important; /* Force smaller size on mobile */
          width: auto !important;
          max-height: 80px !important;
          object-fit: contain;
      }
      .review-article th, .review-article td { 
          padding: 10px 8px; /* Reduce padding on mobile */
      }
  }
</style>
`;

const AMAZON_DISCLAIMER = `
<div class="affiliate-disclaimer">
    <strong>Transparency:</strong> Kitchen Algo is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, we earn from qualifying purchases at no extra cost to you.
</div>
`;

function cleanContent(fullHtml) {
    // 1. Extract Body if present (content might already be partial from previous run)
    let content = fullHtml;
    // Check if it's already wrapped in .review-article from previous run, strip it to start fresh
    if (content.includes('<div class="review-article">')) {
        content = content.replace(/<div class="review-article">[\s\S]*?<style>[\s\S]*?<\/style>/, '').replace(/<\/div>\s*$/, '');
    }

    // If it has a body tag (from original HTML), extract it
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        content = bodyMatch[1];
    }

    // 2. Remove H1
    content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');

    // 3. Remove existing <style> blocks
    content = content.replace(/<style>[\s\S]*?<\/style>/gi, '');

    // 4. Remove unwanted inline styles
    content = content.replace(/style="[^"]*background-color[^"]*"/gi, '');

    // 5. Link Table Titles
    content = linkTableTitles(content);

    // 6. Wrap Tables for Mobile Responsiveness
    // Replace <table> with <div class="table-wrapper"><table>...</table></div>
    content = content.replace(/(<table[^>]*>[\s\S]*?<\/table>)/gi, '<div class="table-wrapper">$1</div>');

    // 7. Remove existing disclaimer if present to avoid duplication
    content = content.replace(/<div class="affiliate-disclaimer">[\s\S]*?<\/div>/gi, '');

    // 8. Add Disclaimer at Top
    content = AMAZON_DISCLAIMER + '\n' + content.trim();

    // 9. Wrap in container with styles
    return `<div class="review-article">${NEW_STYLES}\n${content}</div>`;
}

function linkTableTitles(html) {
    // Regex to iterate over table rows
    return html.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (rowMatch, innerProps) => {
        // Find the "Check Price" link first to get the URL
        const linkMatch = rowMatch.match(/<a\s+href="([^"]+)"[^>]*>Check Price<\/a>/i);
        if (!linkMatch) return rowMatch; // No link, return original row.

        const url = linkMatch[1];

        // Find all <td> cells
        const cells = rowMatch.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        if (!cells || cells.length < 4) return rowMatch; // Ensure enough cells (Image, Name, Rating, Action)

        // cells[1] is typically the Product Name cell
        const nameCellNode = cells[1];

        // Check if it's already linked to avoid double wrapping
        if (nameCellNode.includes('<a href')) return rowMatch;

        // Extract inner text/content
        const nameMatch = nameCellNode.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
        if (!nameMatch) return rowMatch;

        const originalName = nameMatch[1].trim();

        // Create new cell with link
        // We add a class to the link to style it if needed, or inherit
        const linkedNameCell = `<td><a href="${url}" target="_blank" rel="nofollow noopener" style="text-decoration: none; color: inherit; font-weight: 600;">${originalName}</a></td>`;

        // Replace the original cell in the row
        return rowMatch.replace(nameCellNode, linkedNameCell);
    });
}

function main() {
    console.log('🔄 Starting Review Articles Update (Mobile Fix + Disclaimer)...');

    if (!fs.existsSync(ARTICLES_PATH)) {
        console.error('❌ Articles JSON not found!');
        process.exit(1);
    }
    const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf8'));
    let count = 0;

    articles.forEach(article => {
        if (article.categorySlug === 'reviews') {
            // Apply Settings
            article.enableAds = false;
            article.hideFeaturedImage = true;

            // Fix Content
            article.content = cleanContent(article.content);

            count++;
        }
    });

    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2));
    console.log(`✅ Successfully updated ${count} review articles.`);
}

main();

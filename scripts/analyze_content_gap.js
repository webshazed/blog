const fs = require('fs');
const path = require('path');

// CORRECTED: Use articles.json, not posts.json
const ARTICLES_PATH = path.join(__dirname, '../data/json/articles.json');
const QUERIES_PATH = path.join(__dirname, '../Queries.csv');

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    const data = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i];
        if (!line.trim()) continue;

        if (insideQuotes) {
            currentLine += '\n' + line;
        } else {
            currentLine = line;
        }

        if ((currentLine.match(/"/g) || []).length % 2 === 1) {
            insideQuotes = true;
            continue;
        } else {
            insideQuotes = false;
        }

        const columns = [];
        let buffer = '';
        let inQuote = false;

        for (let j = 0; j < currentLine.length; j++) {
            const char = currentLine[j];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                columns.push(buffer.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                buffer = '';
            } else {
                buffer += char;
            }
        }
        columns.push(buffer.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

        if (columns.length > 0 && columns[0]) {
            data.push({
                query: columns[0],
                clicks: parseInt(columns[1] || '0'),
                impressions: parseInt(columns[2] || '0'),
                ctr: columns[3],
                position: parseFloat(columns[4] || '0')
            });
        }
    }
    return data;
}

function normalizeForComparison(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function analyze() {
    console.log('Reading articles from articles.json...');
    const articlesRaw = fs.readFileSync(ARTICLES_PATH, 'utf8');
    const articles = JSON.parse(articlesRaw);

    console.log('Reading queries...');
    const queriesRaw = fs.readFileSync(QUERIES_PATH, 'utf8');
    const queries = parseCSV(queriesRaw);

    console.log(`Found ${articles.length} articles and ${queries.length} queries.\n`);

    const covered = [];
    const missing = [];

    // Create searchable index from articles
    const articleIndex = articles.map(a => ({
        title: normalizeForComparison(a.title || ''),
        slug: normalizeForComparison((a.slug || '').replace(/-/g, ' ')),
        original: a
    }));

    queries.forEach(q => {
        const queryNorm = normalizeForComparison(q.query);
        const queryWords = queryNorm.split(' ').filter(w => w.length > 2);

        // Match: at least 60% of query words are in title OR slug contains most of query
        let bestMatch = null;
        let bestScore = 0;

        for (const article of articleIndex) {
            // Check title
            const titleWords = article.title.split(' ');
            const matchingWordsTitle = queryWords.filter(qw =>
                titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
            ).length;
            const titleScore = matchingWordsTitle / queryWords.length;

            // Check slug
            const slugWords = article.slug.split(' ');
            const matchingWordsSlug = queryWords.filter(qw =>
                slugWords.some(sw => sw.includes(qw) || qw.includes(sw))
            ).length;
            const slugScore = matchingWordsSlug / queryWords.length;

            const score = Math.max(titleScore, slugScore);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = article.original;
            }
        }

        if (bestScore >= 0.5) {
            covered.push({
                query: q,
                matchedArticle: bestMatch.title,
                score: bestScore
            });
        } else {
            missing.push(q);
        }
    });

    console.log('=== ANALYSIS COMPLETE ===\n');
    console.log(`✅ COVERED: ${covered.length} queries`);
    console.log(`❌ MISSING: ${missing.length} queries\n`);

    // Sort by impressions
    missing.sort((a, b) => b.impressions - a.impressions);
    covered.sort((a, b) => b.query.impressions - a.query.impressions);

    console.log('--- TOP 15 COVERED KEYWORDS ---');
    covered.slice(0, 15).forEach((c, i) => {
        console.log(`${i + 1}. "${c.query.query}" → ${c.matchedArticle} (${Math.round(c.score * 100)}% match)`);
    });

    console.log('\n--- TOP 15 MISSING KEYWORDS (Opportunities) ---');
    missing.slice(0, 15).forEach((m, i) => {
        console.log(`${i + 1}. "${m.query}" (${m.impressions} impressions, pos ${m.position})`);
    });

    console.log('\n--- ALL MISSING KEYWORDS ---');
    missing.forEach(m => {
        console.log(`- ${m.query}`);
    });
}

analyze();

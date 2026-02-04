const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../out/blog');
const REPORT_FILE = path.join(__dirname, '../out/seo_audit_report.md');

// Configuration
const REQUIRED_TAGS = {
    title: /<title[^>]*>([^<]+)<\/title>/i,
    description: /<meta\s+name=["']description["']\s+content=["']([^"']+)["']\s*\/?>|<meta\s+content=["']([^"']+)["']\s+name=["']description["']\s*\/?>/i,
    h1: /<h1[^>]*>([^<]+)<\/h1>/i,
    canonical: /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']\s*\/?>/i,
    viewport: /<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']\s*\/?>/i,
    ogTitle: /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i,
    ogDescription: /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']\s*\/?>/i,
    ogImage: /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/i,
};

function getAllHtmlFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith('.html')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function auditHtmlContent(content, filePath) {
    const relativePath = path.relative(BLOG_DIR, filePath);
    const issues = [];
    const score = {
        passed: 0,
        total: 0
    };

    const check = (name, regex, critical = true) => {
        score.total++;
        const match = content.match(regex);
        if (match) {
            score.passed++;
            const value = match[1] || match[2]; // Handle alternate group for description
            // Additional checks
            if (name === 'title' && (value.length < 10 || value.length > 70)) {
                issues.push(`[WARN] Title length (${value.length}) is not ideal (10-70 chars).`);
            }
            if (name === 'description' && (value.length < 50 || value.length > 170)) {
                issues.push(`[WARN] Description length (${value.length}) is not ideal (50-160 chars).`);
            }
            return value;
        } else {
            if (critical) {
                issues.push(`[FAIL] Missing ${name} tag.`);
            } else {
                issues.push(`[WARN] Missing ${name} tag.`);
            }
            return null;
        }
    };

    check('title', REQUIRED_TAGS.title);
    check('description', REQUIRED_TAGS.description);
    check('h1', REQUIRED_TAGS.h1);
    check('canonical', REQUIRED_TAGS.canonical);
    check('viewport', REQUIRED_TAGS.viewport); // Critical for Bing mobile friendliness

    // OG Tags
    const hasOgTitle = check('ogTitle', REQUIRED_TAGS.ogTitle, false);
    const hasOgDesc = check('ogDescription', REQUIRED_TAGS.ogDescription, false);
    const hasOgImage = check('ogImage', REQUIRED_TAGS.ogImage, false);

    return {
        file: relativePath,
        issues,
        score: Math.round((score.passed / score.total) * 100)
    };
}

async function runAudit() {
    console.log(`Scanning ${BLOG_DIR}...`);

    try {
        if (!fs.existsSync(BLOG_DIR)) {
            console.error(`Directory not found: ${BLOG_DIR}`);
            console.error('Please run "npm run build" first.');
            return;
        }

        const htmlFiles = getAllHtmlFiles(BLOG_DIR);
        console.log(`Found ${htmlFiles.length} HTML files.`);

        let reportContent = `# SEO Audit Report\n\nDate: ${new Date().toISOString()}\nTotal Files Scanned: ${htmlFiles.length}\n\n`;
        let totalIssues = 0;
        let perfectFiles = 0;

        const results = htmlFiles.map(file => {
            const content = fs.readFileSync(file, 'utf8');
            return auditHtmlContent(content, file);
        });

        // Summary Statistics
        const lowScoreFiles = results.filter(r => r.score < 100);
        reportContent += `## Summary\n`;
        reportContent += `- **Perfect Score Files:** ${results.length - lowScoreFiles.length}\n`;
        reportContent += `- **Files with Issues:** ${lowScoreFiles.length}\n`;
        reportContent += `- **Average Score:** ${Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)}%\n\n`;

        reportContent += `## Detailed Issues\n\n`;

        if (lowScoreFiles.length === 0) {
            reportContent += `✅ All files passed the basic SEO checks!\n`;
        } else {
            lowScoreFiles.forEach(res => {
                reportContent += `### 📄 ${res.file} (Score: ${res.score}%)\n`;
                res.issues.forEach(issue => {
                    const icon = issue.includes('[FAIL]') ? '❌' : '⚠️';
                    reportContent += `- ${icon} ${issue.replace('[FAIL] ', '').replace('[WARN] ', '')}\n`;
                });
                reportContent += `\n`;
            });
        }

        fs.writeFileSync(REPORT_FILE, reportContent);
        console.log(`Report generated at: ${REPORT_FILE}`);

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

runAudit();

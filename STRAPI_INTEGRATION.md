# Strapi CMS Integration Guide

## Quick Start

### 1. Start Strapi

```bash
cd x:\BLOG\strapi-cms
npm run develop
```

Strapi will start at: **http://localhost:1337**

### 2. Create Admin User

On first run, visit http://localhost:1337/admin and create your admin account.

### 3. Configure API Permissions

Go to **Settings → Users & Permissions → Roles → Public**:
- Enable `find` and `findOne` for **Article**
- Enable `find` and `findOne` for **Author**
- Enable `find` and `findOne` for **Category**

Go to **Settings → Users & Permissions → Roles → Authenticated**:
- Enable ALL permissions for **Article**, **Author**, **Category**

### 4. Generate API Token

Go to **Settings → API Tokens → Create new API Token**:
- Name: `Next.js Blog`
- Token type: `Full access`
- Copy the generated token

### 5. Configure Next.js Environment

Add to your `.env.local`:

```env
# Strapi Configuration
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_generated_token_here
```

### 6. Start Next.js

```bash
cd x:\BLOG
npm run dev
```

---

## API Endpoint Documentation

### POST `/api/blog` - Create New AI-Processed Article

**Headers:**
```
api: YOUR_BLOG_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Your raw markdown or HTML content here...",
  "author": "Shazed",
  "category": "Technology",
  "featured_image": "https://example.com/image.jpg"
}
```

**What happens:**
1. API validates the API key
2. Content is sent to **Google Gemini AI**
3. AI generates: title, slug, excerpt, structured HTML with SEO
4. Images are processed and uploaded to **Cloudflare R2**
5. Final article is saved to **Strapi CMS**
6. Response returns the saved article

**Response (Success - 201):**
```json
{
  "success": true,
  "post": {
    "id": 1,
    "title": "AI-Generated Title",
    "slug": "ai-generated-slug",
    "excerpt": "AI-generated meta description...",
    "content": "<processed HTML>",
    "image": "https://r2.example.com/image.webp",
    "author": "Shazed",
    "category": "Technology",
    "date": "Dec 14, 2025",
    "adCodeTop": null,
    "adCodeMiddle": null,
    "adCodeBottom": null,
    "enableAds": true
  }
}
```

---

## Managing Ads in Strapi

Each article has these ad-related fields:

| Field | Description |
|-------|-------------|
| `adCodeTop` | HTML/JS code for top banner ad |
| `adCodeMiddle` | HTML/JS code inserted before content |
| `adCodeBottom` | HTML/JS code for bottom banner ad |
| `enableAds` | Toggle to enable/disable all ads for this post |

### Example Ad Code

```html
<!-- Google AdSense Example -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXX"
     data-ad-slot="XXXXXXXX"
     data-ad-format="auto"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   External AI Agent / n8n                                       │
│          │                                                      │
│          ▼ POST raw content                                     │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │            Next.js API: /api/blog                       │  │
│   │   1. Validate API Key                                   │  │
│   │   2. Send to Gemini AI → structured HTML               │  │
│   │   3. Process images → Cloudflare R2                    │  │
│   │   4. Save to Strapi CMS                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              STRAPI CMS (localhost:1337)                │  │
│   │   • Manage articles with ad codes                       │  │
│   │   • Author/Category management                          │  │
│   │   • Toggle ads per article                              │  │
│   └─────────────────────────────────────────────────────────┘  │
│          │                                                      │
│          ▼ REST API                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │            Next.js Frontend (localhost:3000)            │  │
│   │   • Fetches articles from Strapi                        │  │
│   │   • Renders dynamic ad codes                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing the Integration

### Test with cURL

```bash
curl -X POST http://localhost:3000/api/blog \
  -H "api: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Test Article\n\nThis is a test article about technology.",
    "author": "Test Author",
    "category": "Technology"
  }'
```

### Verify in Strapi

1. Go to http://localhost:1337/admin
2. Navigate to **Content Manager → Article**
3. You should see the new article with AI-generated fields

### Verify on Frontend

1. Go to http://localhost:3000
2. The new article should appear on the homepage
3. Click to view the full article with ad slots

---

## Troubleshooting

### "Strapi API error: 403"
- Check that API permissions are configured for Public role
- Verify STRAPI_API_TOKEN is correct in .env.local

### "Connection refused to localhost:1337"
- Make sure Strapi is running: `cd strapi-cms && npm run develop`

### Articles not showing on frontend
- Check Strapi admin → Articles are published (not draft)
- Clear Next.js cache: `rm -rf .next && npm run dev`

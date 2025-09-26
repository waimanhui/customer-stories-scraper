# Microsoft Customer Stories Scraper

A comprehensive Playwright-based tool to extract customer stories from Microsoft's customer portal. Features automatic image downloading, pagination support, and monthly automated extraction via GitHub Actions. Perfect for market research, competitive analysis, and tracking Microsoft's customer success stories.

## Features

- 🎯 Extract customer stories from Microsoft's customer portal with pagination support
- 🖼️ **Automatic image downloading** - Downloads company logos, header images, and product icons
- 📄 **JSON output with relative image paths** - Portable dataset with organized image references
- 🔄 **Monthly automated extraction** via GitHub Actions workflow
- 🛡️ **Mandatory URL validation** - Prevents accidental runs with unintended URLs
- 📊 **Comprehensive data extraction** - Story titles, industries, company logos, and Microsoft products
- 🎪 **Playwright-powered** - Robust web scraping with error handling
- 🌐 **Static Web App** - Interactive web interface to browse and explore customer stories

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

## Installation

1. Clone or download this project
2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers:

```bash
npm run install-browsers
```

## Quick Start

```powershell
# 1. Set your target URL
$env:BASE_URL="https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence&sortBy=PublishedDate+Desc"

# 2. Run the extraction
npm run extract:paginated

# 3. Check results
# - JSON: microsoft-customer-stories.json
# - Images: media/ folder

# 4. View stories in web app
# Open index.html in your browser or serve locally:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Static Web App

The repository includes a **static web application** (`index.html`) that provides an interactive interface to browse and explore the extracted customer stories.

### Features
- 📱 **Responsive design** - Works on desktop, tablet, and mobile devices
- 🔍 **Search functionality** - Search by company name, industry, or story title
- 🏭 **Industry filtering** - Filter stories by industry categories
- 🖼️ **Local images** - Uses downloaded images from the `media/` directory
- 🔗 **Clickable tiles** - Story cards link directly to Microsoft's original story pages
- 📊 **Live statistics** - Shows filtered story counts and metadata

### Usage
1. Ensure you have extracted stories using the scraper (see Quick Start above)
2. **Important**: You must serve the files via an HTTP server (cannot open index.html directly in browser due to CORS restrictions)
3. Serve the files locally using one of these methods:
   ```bash
   # Using Python (recommended)
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
4. Visit the local server URL (e.g., `http://localhost:8000`)
5. Browse, search, and filter stories using the web interface
6. Click on any story tile to open the full story on Microsoft's website

⚠️ **Important Note**: Do not open `index.html` directly in your browser by double-clicking it. This will cause CORS errors and the JSON data won't load. Always use an HTTP server as shown above.

### Web App Structure
- `index.html` - Main HTML structure
- `styles.css` - CSS styling with Microsoft-inspired design
- `script.js` - JavaScript for loading JSON data and interactive features

## Usage

### Option 1: Using Playwright Tests (Recommended)

The Playwright test approach provides better error handling, reporting, and debugging capabilities.

**⚠️ IMPORTANT:** The BASE_URL environment variable is now **required**. The script will throw an error if BASE_URL is not provided.

#### Complete Extraction with Pagination
You must set the BASE_URL environment variable before running the extraction:

**PowerShell:**
```powershell
$env:BASE_URL="https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence&sortBy=PublishedDate+Desc"
npm run extract:paginated
```

**Command Prompt:**
```cmd
set BASE_URL=https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence&sortBy=PublishedDate+Desc
npm run extract:paginated
```

**Linux/Mac:**
```bash
BASE_URL="https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence&sortBy=PublishedDate+Desc" npm run extract:paginated
```

#### Helper Scripts
For convenience, you can also use these helper commands to see proper usage examples:

```bash
npm run extract:custom   # Shows BASE_URL usage instructions
npm run extract:example  # Shows example with sample URL
```

#### Error Handling
If you run the extraction without setting BASE_URL, you'll see this error:
```
Error: BASE_URL environment variable is required. Please set BASE_URL with your Microsoft Customer Stories search URL.
```

This is intentional - the script requires explicit URL configuration to prevent accidental runs with unintended URLs.

#### Run All Tests
```bash
npm test
```

#### Run Tests with Browser Visible (for debugging)
```bash
npm run test:headed
```

### Option 2: Using Standalone Script

⚠️ **Note:** The standalone script may need updates to match the BASE_URL requirement. Use the Playwright test approach (Option 1) for the most reliable experience.

## Automated Monthly Extraction (GitHub Actions)

This repository includes a GitHub workflow that automatically runs the extraction monthly on the 1st day of each month at 7:00 AM UTC.

### Workflow Features

- **Scheduled execution**: Runs monthly on the 1st day of each month at 7:00 AM UTC
- **Manual triggering**: Can be triggered manually from GitHub Actions tab
- **Automatic commits**: Updates the repository with new data
- **Artifact storage**: Stores extraction results as downloadable artifacts
- **Cross-platform**: Runs on Ubuntu latest

### Workflow Configuration

The workflow is defined in `.github/workflows/monthly-extraction.yml` and performs:

1. Sets up Node.js environment
2. Installs dependencies and Playwright browsers
3. Runs the customer stories extraction
4. Uploads results as artifacts (retained for 30 days)
5. Commits and pushes changes back to the repository

### Files Updated by Workflow

- `microsoft-customer-stories.json` - Main extraction results
- `media/` - Downloaded images (logos, headers, product icons)

### Manual Workflow Execution

To trigger the workflow manually:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Monthly Microsoft Customer Stories Extraction"
3. Click "Run workflow"
4. (Optional) Enter a custom Base URL for different filters/regions
5. Choose the branch and click "Run workflow"

### Workflow Permissions

The workflow requires:
- **Contents: write** - To commit changes back to repository
- **Actions: read** - To access workflow artifacts

Make sure your repository has these permissions enabled in Settings > Actions > General > Workflow permissions.

## Output Files

The script generates the following output files:

### JSON Results
- `microsoft-customer-stories.json` - Main extraction results (saved to root directory)
- Contains comprehensive story data, metadata, and statistics

### Downloaded Images
- `media/` directory - Contains all downloaded images with organized naming:
  - `{company_name}_p{page}_{position}_logo.{ext}` - Company logos
  - `{company_name}_p{page}_{position}_header.{ext}` - Story header images  
  - `{company_name}_p{page}_{position}_product_{product_name}.{ext}` - Product icons

### JSON Structure
The JSON file contains:
- **metadata**: Extraction summary including total pages, stories, URLs, and per-page breakdown
- **stories**: Array of story objects with complete company and product information
- All images are downloaded locally with relative paths for portability

## Data Structure

### JSON Output Structure

```json
{
  "metadata": {
    "totalPages": 5,
    "totalStories": 60,
    "extractionDate": "2025-09-26T12:30:45Z",
    "baseUrl": "https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence&sortBy=PublishedDate+Desc",
    "storiesPerPage": {
      "1": 12,
      "2": 12,
      "3": 12,
      "4": 12,
      "5": 12
    }
  },
  "stories": [
    {
      "page": 1,
      "positionOnPage": 2,
      "globalId": "p1_2",
      "title": "Manufacturing Company transforms operations with AI-powered solutions",
      "industry": "Manufacturing",
      "storyUrl": "https://www.microsoft.com/en-us/customers/story/1234567890-example-manufacturing...",
      "company": {
        "name": "Example Manufacturing Corp",
        "logo": "https://cdn-dynmedia-1.microsoft.com/is/image/...",
        "logoLocal": "media/example_manufacturing_corp_p1_2_logo.jpg"
      },
      "media": {
        "headerImage": "https://cdn-dynmedia-1.microsoft.com/is/image/...",
        "headerImageAlt": "Manufacturing facility with AI automation",
        "headerImageLocal": "media/example_manufacturing_corp_p1_2_header.jpg"
      },
      "microsoftProducts": [
        {
          "name": "Azure AI",
          "icon": "https://cdn-dynmedia-1.microsoft.com/is/image/...",
          "iconAlt": "Azure AI logo",
          "iconLocal": "media/example_manufacturing_corp_p1_2_product_azure_ai.jpg"
        },
        {
          "name": "Microsoft 365 Copilot",
          "icon": "https://cdn-dynmedia-1.microsoft.com/is/image/...",
          "iconAlt": "Microsoft 365 Copilot logo", 
          "iconLocal": "media/example_manufacturing_corp_p1_2_product_microsoft_365_copilot.jpg"
        }
      ],
      "extractedAt": "2025-09-26T12:30:45Z"
    }
  ]
}
```

### Story Data Structure

Each story in the JSON includes:

- **page**: Page number where story was found  
- **positionOnPage**: Position of story on that page
- **globalId**: Unique identifier (format: `p{page}_{position}`)
- **title**: Full title of the customer story
- **industry**: Industry category (e.g., "Manufacturing", "Healthcare", "Professional and Business Services")
- **storyUrl**: Direct link to the full story on Microsoft's site
- **company**: Object containing company information:
  - `name`: Company name
  - `logo`: Original logo URL from Microsoft
  - `logoLocal`: Local path to downloaded logo (e.g., "media/company_name_p1_2_logo.jpg")
- **media**: Object containing story media:
  - `headerImage`: Original header image URL from Microsoft
  - `headerImageAlt`: Alt text for header image
  - `headerImageLocal`: Local path to downloaded header image
- **microsoftProducts**: Array of product objects, each containing:
  - `name`: Product name (e.g., "Azure AI", "Microsoft 365 Copilot")
  - `icon`: Original icon URL from Microsoft
  - `iconAlt`: Alt text for product icon
  - `iconLocal`: Local path to downloaded product icon
- **extractedAt**: ISO timestamp of extraction

## Target URL and Filters

The script extracts data from any Microsoft Customer Stories search URL you provide via the BASE_URL environment variable.

**Example URLs:**

```bash
# AI stories from all regions
https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence&sortBy=PublishedDate+Desc

# Financial services stories  
https://www.microsoft.com/en-us/customers/search/?filters=industries%3Afinancial-services&sortBy=PublishedDate+Desc

# Azure OpenAI product stories
https://www.microsoft.com/en-us/customers/search/?filters=products%3Aazure-openai&sortBy=PublishedDate+Desc
```

## Customization

### Changing Filters

To modify the search filters, simply change the BASE_URL environment variable. No code changes needed!

### Common Filter Parameters

- **Industries**: `filters=industries%3Afinancial-services`
- **Business Needs**: `filters=business-need%3Acloud-scale-analytics`
- **Products**: `filters=products%3Aazure-openai`
- **Regions**: `filters=region%3Aasia%2Fsingapore`
- **Organization Size**: `filters=organization-size%3Alarge-enterprise`

### Pagination Limits

By default, the scripts limit extraction to 10 pages to prevent excessive runtime. To change this:

```javascript
while (hasNextPage && currentPage <= 10) { // Change this number
```

### Output Configuration

The script currently saves:
- **JSON file**: `microsoft-customer-stories.json` (root directory)  
- **Images**: `media/` directory with organized naming scheme

To modify output locations, edit the file paths in `tests/microsoft-customers-extraction.spec.js`.

## Debugging

### Enable Headed Mode
Run tests with visible browser for debugging:
```bash
npm run test:headed
```

### Slow Motion
Add slow motion to see what's happening:
```javascript
const browser = await chromium.launch({ 
  headless: false,
  slowMo: 1000 // milliseconds
});
```

### Debug Output
The scripts include extensive console logging. Check the terminal output for:
- Page navigation status
- Number of stories found on each page
- Extraction progress
- Error messages
- Final statistics

## Error Handling

The scripts include robust error handling for:
- Network timeouts
- Missing elements
- Pagination issues
- Data extraction failures
- File writing errors

Failed extractions are logged but don't stop the overall process.

## Performance Notes

- **Full extraction with images**: 3-15 minutes depending on number of pages and stories
- **Image downloading**: Adds ~2-5 seconds per story (3 images average per story)
- **Network delays**: Built-in waits for dynamic content loading
- **Rate limiting**: 2-second delays between page requests to avoid overwhelming servers
- **Pagination limit**: Default maximum of 10 pages to prevent excessive runtime

## Troubleshooting

### Common Issues

1. **BASE_URL is required error**
   ```
   Error: BASE_URL environment variable is required...
   ```
   **Solution:** Set the BASE_URL environment variable before running:
   ```powershell
   $env:BASE_URL="https://www.microsoft.com/en-us/customers/search/?filters=..."
   npm run extract:paginated
   ```

2. **Playwright not installed**
   ```bash
   npm run install-browsers
   ```

3. **Timeout errors**
   - Increase timeout values in the scripts
   - Check internet connection
   - Try running with `--headed` to see what's happening

4. **No stories extracted**
   - Verify the URL is accessible
   - Check if Microsoft changed their page structure
   - Review console logs for error messages

5. **Image download failures**
   - Check network connectivity
   - Some images might be protected or blocked
   - The script continues even if some images fail to download

6. **Empty results**
   - Filters might be too restrictive
   - Page might not have loaded completely
   - Try increasing wait times

### Getting Help

If you encounter issues:
1. Run with `--headed` flag to see browser behavior
2. Check console output for error messages
3. Verify the Microsoft page loads correctly in a regular browser
4. Check if page selectors have changed

## License

MIT License - feel free to modify and distribute as needed.
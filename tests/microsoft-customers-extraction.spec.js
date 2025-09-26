const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Download image from URL and save to local file
 * @param {string} imageUrl - The URL of the image to download
 * @param {string} localPath - The local path where to save the image
 * @returns {Promise<string>} - Returns the local path if successful
 */
async function downloadImage(imageUrl, localPath) {
  if (!imageUrl || imageUrl.startsWith('data:')) {
    return null; // Skip data URLs or empty URLs
  }

  return new Promise((resolve, reject) => {
    // Ensure directory exists
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const protocol = imageUrl.startsWith('https:') ? https : http;
    
    const request = protocol.get(imageUrl, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(localPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(localPath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(localPath, () => {}); // Delete the file on error
          reject(err);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadImage(response.headers.location, localPath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });

    // Set timeout
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

/**
 * Get file extension from URL or content type
 * @param {string} url - The image URL
 * @param {string} contentType - The content type header
 * @returns {string} - File extension
 */
function getImageExtension(url, contentType = '') {
  // Try to get extension from URL first
  const urlMatch = url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i);
  if (urlMatch) {
    return urlMatch[1].toLowerCase();
  }
  
  // Fall back to content type
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('svg')) return 'svg';
  
  // Default to jpg if can't determine
  return 'jpg';
}

/**
 * Generate safe filename from globalId and other identifiers (no company name)
 * @param {string} companyName - Company name (unused, kept for compatibility)
 * @param {string} globalId - Global ID of the story
 * @param {string} type - Type of image (logo, header, product-icon)
 * @param {string} extension - File extension
 * @returns {string} - Safe filename
 */
function generateImageFilename(companyName, globalId, type, extension) {
  return `${globalId}_${type}.${extension}`;
}

/**
 * Microsoft Customer Stories Extraction with Advanced Pagination Detection
 * 
 * This test implements a robust pagination detection strategy that uses multiple indicators:
 * 1. Primary: Check if pagination container has 'd-none' class (hidden = single page)
 * 2. Secondary: Compare showing values (show-value === show-total = all results on one page)  
 * 3. Tertiary: Parse pagination announcement text for "Page X of Y"
 * 4. Fallback: Check next button state (disabled = no more pages)
 * 
 * The strategy prevents false pagination attempts and accurately detects single-page results.
 */
test.describe('Microsoft Customer Stories Extraction', () => {
  
  test('Extract all stories with pagination support', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(120000); // 2 minutes
    
    const allStories = [];
    let currentPage = 1;
    let hasNextPage = true;
    
    // Get base URL from environment variable - required
    const baseUrl = process.env.BASE_URL;
    
    if (!baseUrl) {
      throw new Error('BASE_URL environment variable is required. Please set BASE_URL with your Microsoft Customer Stories search URL.');
    }
    
    console.log(`Using base URL: ${baseUrl}`);
    
    // Example URLs for different regions/filters:
    // Hong Kong SAR (AI): https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence%2Cregion%3Aasia%2Fhong-kong-sar&sortBy=PublishedDate+Desc
    // Multiple Asia regions (AI): https://www.microsoft.com/en-us/customers/search/?filters=business-need%3Aartificial-intelligence%2Cregion%3Aasia%2Fbangladesh%2Cregion%3Aasia%2Fbhutan%2Cregion%3Aasia%2Fbrunei%2Cregion%3Aasia%2Fchina%2Cregion%3Aasia%2Fhong-kong-sar%2Cregion%3Aasia%2Findia%2Cregion%3Aasia%2Findonesia&sortBy=PublishedDate+Desc
    
    while (hasNextPage && currentPage <= 5) { // Limit to 5 pages for testing
      console.log(`\nProcessing page ${currentPage}...`);
      
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}&page=${currentPage}`;
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      
      // Wait for content with longer timeout
      await page.waitForSelector('.dynamic-content__content', { timeout: 60000 });
      await page.waitForTimeout(3000); // Additional wait for content to fully load
      
      // Check if stories exist on this page
      const storyCards = await page.$$('.card--style-customer-story');
      
      if (storyCards.length === 0) {
        console.log('No stories found on this page. Stopping pagination.');
        break;
      }
      
      // Extract stories from current page
      const pageStories = await page.evaluate((pageNum) => {
        const stories = [];
        const cards = document.querySelectorAll('.card--style-customer-story');
        
        cards.forEach((card, index) => {
          try {
            const titleElement = card.querySelector('.block-feature__title');
            const industryElement = card.querySelector('.block-feature__eyebrow .block-feature__label');
            const storyLink = card.querySelector('a[href*="/customers/story/"]');
            const logoImg = card.querySelector('.media__slot img');
            
            // Extract header/story image
            const headerImg = card.querySelector('.card__media .ocr-img img');
            
            if (titleElement && storyLink) {
              // Extract products for this story with icons
              const products = [];
              const productElements = card.querySelectorAll('.related-products__product');
              productElements.forEach(product => {
                const productLabel = product.querySelector('.label');
                const productIcon = product.querySelector('img');
                
                if (productLabel) {
                  products.push({
                    name: productLabel.textContent.trim(),
                    icon: productIcon ? productIcon.getAttribute('src') || '' : '',
                    iconAlt: productIcon ? productIcon.getAttribute('alt') || '' : ''
                  });
                }
              });
              
              stories.push({
                page: pageNum,
                positionOnPage: index + 1,
                globalId: `p${pageNum}_${index + 1}`,
                title: titleElement.textContent.trim(),
                industry: industryElement ? industryElement.textContent.replace('Industry: ', '').trim() : '',
                storyUrl: storyLink.getAttribute('href'),
                
                // Company information with logo only (no name extraction)
                company: {
                  logo: logoImg ? logoImg.getAttribute('src') || '' : ''
                },
                
                // Story media assets
                media: {
                  headerImage: headerImg ? headerImg.getAttribute('src') || '' : '',
                  headerImageAlt: headerImg ? headerImg.getAttribute('alt') || '' : ''
                },
                
                microsoftProducts: products,
                extractedAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`Error extracting story on page ${pageNum}, position ${index + 1}:`, error.message);
          }
        });
        
        return stories;
      }, currentPage);
      
      allStories.push(...pageStories);
      console.log(`Found ${pageStories.length} stories on page ${currentPage}`);
      
      // Check pagination info to see if there are more pages using improved strategy
      const paginationInfo = await page.evaluate(() => {
        // Strategy 1: Check if pagination container is hidden (most reliable for single page)
        const paginationContainer = document.querySelector('[data-mount="oc-pagination"]');
        const isPaginationHidden = paginationContainer && paginationContainer.classList.contains('d-none');
        
        // Strategy 2: Compare showing values to determine if all results are on one page
        const showValue = document.querySelector('.dynamic-content__show-value');
        const showTotal = document.querySelector('.dynamic-content__show-total');
        const currentShowing = showValue ? parseInt(showValue.textContent) : 0;
        const totalResults = showTotal ? parseInt(showTotal.textContent) : 0;
        const allResultsOnOnePage = currentShowing === totalResults && totalResults > 0;
        
        // Strategy 3: Check pagination announcement for page numbers
        const paginationElement = document.querySelector('#pagination-announcement');
        const paginationText = paginationElement ? paginationElement.textContent : '';
        const match = paginationText.match(/Page (\d+) of (\d+)/);
        
        // Strategy 4: Check right arrow state
        const nextButton = document.querySelector('#right-arrow');
        const nextButtonDisabled = nextButton && (
          nextButton.classList.contains('disabled') || 
          nextButton.getAttribute('aria-disabled') === 'true'
        );
        
        // Only consider it a single page if pagination is truly hidden AND all results are shown
        // If pagination container exists but not hidden, check other indicators
        if (isPaginationHidden && allResultsOnOnePage) {
          return {
            currentPage: 1,
            totalPages: 1,
            hasNext: false,
            singlePage: true,
            showingResults: `${currentShowing} of ${totalResults}`,
            reason: 'pagination hidden and all results shown'
          };
        }
        
        if (match) {
          const currentPage = parseInt(match[1]);
          const totalPages = parseInt(match[2]);
          return {
            currentPage: currentPage,
            totalPages: totalPages,
            hasNext: currentPage < totalPages,
            singlePage: totalPages === 1,
            showingResults: `${currentShowing} of ${totalResults}`,
            reason: 'pagination announcement'
          };
        }
        
        // Fallback: check next button state
        return {
          hasNext: !nextButtonDisabled,
          currentPage: null,
          totalPages: null,
          singlePage: nextButtonDisabled,
          showingResults: `${currentShowing} of ${totalResults}`,
          reason: 'next button state'
        };
      });
      
      console.log('Pagination info:', paginationInfo);
      
      // Determine if there are more pages using improved logic
      if (paginationInfo.singlePage) {
        hasNextPage = false;
        console.log(`Single page detected (${paginationInfo.reason}): ${paginationInfo.showingResults}`);
      } else if (paginationInfo.totalPages && currentPage >= paginationInfo.totalPages) {
        hasNextPage = false;
        console.log(`Reached last page (${paginationInfo.totalPages}): ${paginationInfo.showingResults}`);
      } else if (paginationInfo.hasNext === false) {
        hasNextPage = false;
        console.log(`No more pages available (${paginationInfo.reason}): ${paginationInfo.showingResults}`);
      } else {
        // Navigate to next page directly via URL (more reliable than clicking)
        console.log(`Navigating to page ${currentPage + 1}... (${paginationInfo.showingResults})`);
        currentPage++;
        
        // Continue to next iteration, the while loop will handle the new page URL
      }
    }
    
    // Validate results
    expect(allStories.length).toBeGreaterThan(0);
    
    // Download all images and update paths
    console.log(`\n=== DOWNLOADING IMAGES ===`);
    const mediaDir = path.join(process.cwd(), 'media');
    
    // Ensure media directory exists
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    
    for (let i = 0; i < allStories.length; i++) {
      const story = allStories[i];
      console.log(`Processing images for story ${i + 1}/${allStories.length}: ${story.globalId}`);
      
      try {
        // Download company logo
        if (story.company?.logo) {
          const logoExtension = getImageExtension(story.company.logo);
          const logoFilename = generateImageFilename('', story.globalId, 'logo', logoExtension);
          const logoPath = path.join(mediaDir, logoFilename);
          
          try {
            await downloadImage(story.company.logo, logoPath);
            story.company.logoLocal = `media/${logoFilename}`;
            console.log(`  Downloaded logo: ${logoFilename}`);
          } catch (error) {
            console.warn(`  Failed to download logo for story ${story.globalId}: ${error.message}`);
          }
        }
        
        // Download header image
        if (story.media?.headerImage) {
          const headerExtension = getImageExtension(story.media.headerImage);
          const headerFilename = generateImageFilename('', story.globalId, 'header', headerExtension);
          const headerPath = path.join(mediaDir, headerFilename);
          
          try {
            await downloadImage(story.media.headerImage, headerPath);
            story.media.headerImageLocal = `media/${headerFilename}`;
            console.log(`  Downloaded header: ${headerFilename}`);
          } catch (error) {
            console.warn(`  Failed to download header image for story ${story.globalId}: ${error.message}`);
          }
        }
        
        // Download product icons
        for (let j = 0; j < story.microsoftProducts.length; j++) {
          const product = story.microsoftProducts[j];
          if (typeof product === 'object' && product.icon) {
            const iconExtension = getImageExtension(product.icon);
            const productSafeName = product.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const iconFilename = generateImageFilename('', story.globalId, `product_${productSafeName}`, iconExtension);
            const iconPath = path.join(mediaDir, iconFilename);
            
            try {
              await downloadImage(product.icon, iconPath);
              story.microsoftProducts[j].iconLocal = `media/${iconFilename}`;
              console.log(`  Downloaded product icon: ${iconFilename}`);
            } catch (error) {
              console.warn(`  Failed to download product icon for ${product.name}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing images for story ${story.globalId}: ${error.message}`);
      }
    }
    
    console.log(`\n=== PAGINATION EXTRACTION COMPLETE ===`);
    console.log(`Total stories across ${currentPage} pages: ${allStories.length}`);
    
    // Log pagination detection details
    if (allStories.length > 0) {
      const storiesPerPage = {};
      allStories.forEach(story => {
        storiesPerPage[story.page] = (storiesPerPage[story.page] || 0) + 1;
      });
      console.log(`Stories per page breakdown:`, storiesPerPage);
    }
    
    // Generate summary statistics
    const industryCount = {};
    const productCount = {};
    
    allStories.forEach(story => {
      // Count industries
      if (story.industry) {
        industryCount[story.industry] = (industryCount[story.industry] || 0) + 1;
      }
      
      // Count products (handle both string and object formats)
      story.microsoftProducts.forEach(product => {
        const productName = typeof product === 'object' ? product.name : product;
        productCount[productName] = (productCount[productName] || 0) + 1;
      });
    });
    
    // Save paginated results
    const filename = `microsoft-customer-stories.json`;
    
    const paginatedResults = {
      metadata: {
        totalPages: currentPage,
        totalStories: allStories.length,
        extractionDate: new Date().toISOString(),
        baseUrl: baseUrl,
        storiesPerPage: allStories.reduce((acc, story) => {
          acc[story.page] = (acc[story.page] || 0) + 1;
          return acc;
        }, {})
      },
      stories: allStories
    };
    
    fs.writeFileSync(filename, JSON.stringify(paginatedResults, null, 2));
    console.log(`Results saved to: ${filename}`);
    
  });
});
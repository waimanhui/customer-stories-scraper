class CustomerStoriesApp {
    constructor() {
        this.stories = [];
        this.filteredStories = [];
        this.metadata = {};
        this.industries = new Set();
        
        this.searchInput = document.getElementById('searchInput');
        this.industryFilter = document.getElementById('industryFilter');
        this.storiesGrid = document.getElementById('storiesGrid');
        this.statsContainer = document.getElementById('statsContainer');
        this.extractionDate = document.getElementById('extractionDate');
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.populateIndustryFilter();
            this.renderStories();
            this.updateStats();
        } catch (error) {
            this.showError('Failed to load customer stories. Please check if the JSON file exists.');
            console.error('Error initializing app:', error);
        }
    }
    
    async loadData() {
        try {
            const response = await fetch('./microsoft-customer-stories.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.metadata = data.metadata;
            this.stories = data.stories || [];
            this.filteredStories = [...this.stories];
            
            // Extract unique industries
            this.stories.forEach(story => {
                if (story.industry) {
                    this.industries.add(story.industry);
                }
            });
            
            // Update extraction date
            if (this.metadata.extractionDate) {
                const date = new Date(this.metadata.extractionDate);
                this.extractionDate.textContent = date.toLocaleDateString();
            }
            
        } catch (error) {
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }
    
    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.industryFilter.addEventListener('change', () => this.handleFilter());
    }
    
    populateIndustryFilter() {
        const sortedIndustries = Array.from(this.industries).sort();
        
        sortedIndustries.forEach(industry => {
            const option = document.createElement('option');
            option.value = industry;
            option.textContent = industry;
            this.industryFilter.appendChild(option);
        });
    }
    
    handleSearch() {
        this.applyFilters();
    }
    
    handleFilter() {
        this.applyFilters();
    }
    
    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const selectedIndustry = this.industryFilter.value;
        
        this.filteredStories = this.stories.filter(story => {
            const matchesSearch = !searchTerm || 
                story.title.toLowerCase().includes(searchTerm) ||
                story.company.name.toLowerCase().includes(searchTerm) ||
                story.industry.toLowerCase().includes(searchTerm);
            
            const matchesIndustry = !selectedIndustry || story.industry === selectedIndustry;
            
            return matchesSearch && matchesIndustry;
        });
        
        this.renderStories();
        this.updateStats();
    }
    
    renderStories() {
        if (this.filteredStories.length === 0) {
            this.storiesGrid.innerHTML = `
                <div class="loading">
                    <p>No stories found matching your criteria.</p>
                </div>
            `;
            return;
        }
        
        this.storiesGrid.innerHTML = this.filteredStories.map(story => 
            this.createStoryCard(story)
        ).join('');
    }
    
    createStoryCard(story) {
        const headerImage = story.media?.headerImageLocal ? 
            `./${story.media.headerImageLocal}` : 
            './media/placeholder-header.jpg';
        
        const companyLogo = story.company?.logoLocal ? 
            `./${story.company.logoLocal}` : 
            './media/placeholder-logo.jpg';
        
        const products = story.microsoftProducts || [];
        const productsHtml = products.map(product => `
            <div class="product-tag">
                ${product.iconLocal ? `<img src="./${product.iconLocal}" alt="${product.iconAlt || product.name}" class="product-icon">` : ''}
                <span>${product.name}</span>
            </div>
        `).join('');
        
        return `
            <a href="${story.storyUrl}" class="story-card" target="_blank" rel="noopener noreferrer">
                <div class="story-header">
                    <img src="${headerImage}" alt="${story.media?.headerImageAlt || story.title}" class="story-header-image" 
                         onerror="this.src='./media/placeholder-header.jpg'">
                    <div class="story-company-logo">
                        <img src="${companyLogo}" alt="${story.company?.name || 'Company Logo'}" class="company-logo"
                             onerror="this.src='./media/placeholder-logo.jpg'">
                    </div>
                </div>
                <div class="story-content">
                    <h3 class="story-title">${this.escapeHtml(story.title)}</h3>
                    <div class="story-meta">
                        <span class="story-company">${this.escapeHtml(story.company?.name || 'Unknown Company')}</span>
                        ${story.industry ? `<span class="story-industry">${this.escapeHtml(story.industry)}</span>` : ''}
                    </div>
                    ${products.length > 0 ? `
                        <div class="story-products">
                            ${productsHtml}
                        </div>
                    ` : ''}
                </div>
            </a>
        `;
    }
    
    updateStats() {
        const totalStories = this.stories.length;
        const filteredCount = this.filteredStories.length;
        const totalPages = this.metadata.totalPages || 1;
        
        let statsText = `Showing ${filteredCount} of ${totalStories} customer stories`;
        if (totalPages > 1) {
            statsText += ` from ${totalPages} pages`;
        }
        
        this.statsContainer.innerHTML = `<span class="stats-item">${statsText}</span>`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        this.storiesGrid.innerHTML = `
            <div class="error">
                <p><strong>Error:</strong> ${message}</p>
            </div>
        `;
    }
}

// Create placeholder images if they don't exist
function createPlaceholderImages() {
    // Create placeholder header image
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = 400;
    headerCanvas.height = 200;
    const headerCtx = headerCanvas.getContext('2d');
    headerCtx.fillStyle = '#f0f0f0';
    headerCtx.fillRect(0, 0, 400, 200);
    headerCtx.fillStyle = '#999';
    headerCtx.font = '20px Arial';
    headerCtx.textAlign = 'center';
    headerCtx.fillText('Story Header Image', 200, 100);
    
    // Create placeholder logo image
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 100;
    logoCanvas.height = 100;
    const logoCtx = logoCanvas.getContext('2d');
    logoCtx.fillStyle = '#f8f8f8';
    logoCtx.fillRect(0, 0, 100, 100);
    logoCtx.fillStyle = '#666';
    logoCtx.font = '12px Arial';
    logoCtx.textAlign = 'center';
    logoCtx.fillText('Company', 50, 45);
    logoCtx.fillText('Logo', 50, 60);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CustomerStoriesApp();
    createPlaceholderImages();
});
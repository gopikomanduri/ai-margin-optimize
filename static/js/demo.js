// Global variables
let factorsChart = null;
let sentimentChart = null;
let historyData = [];

// Format currency
function formatCurrency(value) {
    return '₹' + parseFloat(value).toLocaleString('en-IN');
}

// Fetch account information
async function fetchPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        const data = await response.json();
        
        // Update account summary
        document.getElementById('account-value').textContent = formatCurrency(data.total_value || 1500000);
        document.getElementById('current-margin').textContent = formatCurrency(data.used_margin || 350000);
        
        // Update holdings table
        const holdingsTable = document.getElementById('holdings-data');
        holdingsTable.innerHTML = '';
        
        const holdings = data.holdings || [];
        holdings.forEach(holding => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${holding.symbol}</td>
                <td>${holding.quantity}</td>
                <td>${formatCurrency(holding.market_value)}</td>
                <td><span class="sentiment-label">Loading...</span></td>
            `;
            holdingsTable.appendChild(row);
        });
        
        return data;
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

// Fetch market data
async function fetchMarketData() {
    try {
        const response = await fetch('/api/market');
        const data = await response.json();
        
        // Update market overview table
        const marketTable = document.getElementById('market-data');
        marketTable.innerHTML = '';
        
        const indices = data.indices || {};
        Object.entries(indices).forEach(([index, details]) => {
            const row = document.createElement('tr');
            const changeClass = details.change_1d >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = details.change_1d >= 0 ? '▲' : '▼';
            
            row.innerHTML = `
                <td>${index}</td>
                <td>${details.current.toLocaleString()}</td>
                <td class="${changeClass}">${changeIcon} ${Math.abs(details.change_1d).toFixed(2)}</td>
                <td class="${changeClass}">${changeIcon} ${Math.abs(details.change_percent_1d).toFixed(2)}%</td>
            `;
            marketTable.appendChild(row);
        });
        
        return data;
    } catch (error) {
        console.error('Error fetching market data:', error);
    }
}

// Fetch news data
async function fetchNewsData() {
    try {
        const response = await fetch('/api/news');
        const data = await response.json();
        
        // Update news container
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = '';
        
        const newsItems = Array.isArray(data) ? data : [];
        newsItems.slice(0, 3).forEach(news => {
            const date = new Date(news.published_at);
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const newsCard = document.createElement('div');
            newsCard.className = 'col-md-4 mb-4';
            newsCard.innerHTML = `
                <div class="card news-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${news.title}</h5>
                        <p class="news-source">Source: ${news.source}</p>
                        <p class="news-date">Published: ${formattedDate}</p>
                        <p class="card-text">${news.summary}</p>
                    </div>
                </div>
            `;
            newsContainer.appendChild(newsCard);
        });
        
        return data;
    } catch (error) {
        console.error('Error fetching news data:', error);
    }
}

// Fetch sentiment data
async function fetchSentimentData() {
    try {
        const response = await fetch('/api/sentiment');
        const data = await response.json();
        
        // Update sentiment chart
        updateSentimentChart(data);
        
        // Update sentiment indicators in the holdings table
        const holdingsTable = document.getElementById('holdings-data');
        const rows = holdingsTable.querySelectorAll('tr');
        
        rows.forEach(row => {
            const symbol = row.querySelector('td').textContent;
            const sentimentCell = row.querySelector('td:last-child');
            const sentimentData = data[symbol];
            
            if (sentimentData) {
                const sentimentLabel = sentimentCell.querySelector('.sentiment-label');
                sentimentLabel.textContent = sentimentData.label.charAt(0).toUpperCase() + sentimentData.label.slice(1);
                
                if (sentimentData.label === 'positive') {
                    sentimentLabel.className = 'sentiment-label sentiment-positive';
                } else if (sentimentData.label === 'negative') {
                    sentimentLabel.className = 'sentiment-label sentiment-negative';
                } else {
                    sentimentLabel.className = 'sentiment-label sentiment-neutral';
                }
            }
        });
        
        return data;
    } catch (error) {
        console.error('Error fetching sentiment data:', error);
    }
}

// Fetch optimization factors
async function fetchFactors() {
    try {
        const response = await fetch('/api/factors');
        const data = await response.json();
        
        // Update factors chart
        updateFactorsChart(data);
        
        return data;
    } catch (error) {
        console.error('Error fetching factors:', error);
    }
}

// Optimize margin
async function optimizeMargin() {
    try {
        // Add pulse animation to the button
        const button = document.getElementById('optimize-btn');
        button.classList.add('pulse-animation');
        button.textContent = 'Optimizing...';
        button.disabled = true;
        
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                factors: {}  // Could add manual adjustment factors here
            })
        });
        
        const data = await response.json();
        
        // Update optimization results
        document.getElementById('current-margin').textContent = formatCurrency(data.current_margin);
        document.getElementById('optimized-margin').textContent = formatCurrency(data.optimized_margin);
        
        const savings = data.current_margin - data.optimized_margin;
        document.getElementById('potential-savings').textContent = formatCurrency(savings);
        
        document.getElementById('reduction-percent').textContent = data.reduction_percent + '%';
        
        const confidencePercent = Math.round(data.confidence * 100);
        document.getElementById('confidence-value').textContent = confidencePercent + '%';
        
        const confidenceBar = document.getElementById('confidence-bar');
        confidenceBar.style.width = confidencePercent + '%';
        
        if (confidencePercent >= 80) {
            confidenceBar.className = 'progress-bar bg-success';
        } else if (confidencePercent >= 60) {
            confidenceBar.className = 'progress-bar bg-info';
        } else if (confidencePercent >= 40) {
            confidenceBar.className = 'progress-bar bg-warning';
        } else {
            confidenceBar.className = 'progress-bar bg-danger';
        }
        
        // Add to history
        historyData.unshift(data);
        updateHistoryTable();
        
        // Remove animation and restore button
        setTimeout(() => {
            button.classList.remove('pulse-animation');
            button.textContent = 'Optimize Margin';
            button.disabled = false;
        }, 1000);
        
        return data;
    } catch (error) {
        console.error('Error optimizing margin:', error);
        
        // Restore button state
        const button = document.getElementById('optimize-btn');
        button.classList.remove('pulse-animation');
        button.textContent = 'Optimize Margin';
        button.disabled = false;
    }
}

// Update the factors radar chart
function updateFactorsChart(data) {
    const ctx = document.getElementById('factors-chart').getContext('2d');
    
    if (factorsChart) {
        factorsChart.destroy();
    }
    
    factorsChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Market Volatility', 
                'News Sentiment', 
                'Liquidity Index', 
                'Correlation Factor',
                'Macro Impact'
            ],
            datasets: [{
                label: 'Optimization Factors',
                data: [
                    data.market_volatility * 100, 
                    data.sentiment_score * 100, 
                    data.liquidity_index * 100, 
                    data.correlation_factor * 100,
                    data.macro_impact * 100
                ],
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                borderColor: 'rgba(13, 110, 253, 1)',
                pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(13, 110, 253, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

// Update the sentiment pie chart
function updateSentimentChart(data) {
    const ctx = document.getElementById('sentiment-chart').getContext('2d');
    
    // Count sentiment types
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    Object.values(data).forEach(item => {
        if (item.label === 'positive') {
            positive++;
        } else if (item.label === 'negative') {
            negative++;
        } else {
            neutral++;
        }
    });
    
    if (sentimentChart) {
        sentimentChart.destroy();
    }
    
    sentimentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [positive, neutral, negative],
                backgroundColor: [
                    'rgba(25, 135, 84, 0.7)',
                    'rgba(108, 117, 125, 0.7)',
                    'rgba(220, 53, 69, 0.7)'
                ],
                borderColor: [
                    'rgba(25, 135, 84, 1)',
                    'rgba(108, 117, 125, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Update sentiment details
    const sentimentDetails = document.getElementById('sentiment-details');
    sentimentDetails.innerHTML = `
        <div class="d-flex justify-content-between">
            <span>Positive:</span>
            <span>${positive} (${Math.round(positive / Object.keys(data).length * 100) || 0}%)</span>
        </div>
        <div class="d-flex justify-content-between">
            <span>Neutral:</span>
            <span>${neutral} (${Math.round(neutral / Object.keys(data).length * 100) || 0}%)</span>
        </div>
        <div class="d-flex justify-content-between">
            <span>Negative:</span>
            <span>${negative} (${Math.round(negative / Object.keys(data).length * 100) || 0}%)</span>
        </div>
    `;
}

// Update the history table
function updateHistoryTable() {
    const historyTable = document.getElementById('history-data');
    historyTable.innerHTML = '';
    
    historyData.slice(0, 5).forEach(item => {
        const row = document.createElement('tr');
        
        const confidenceClass = item.confidence >= 0.8 ? 'text-success' : 
                              item.confidence >= 0.6 ? 'text-info' : 
                              item.confidence >= 0.4 ? 'text-warning' : 'text-danger';
        
        row.innerHTML = `
            <td>${item.timestamp}</td>
            <td>${formatCurrency(item.current_margin)}</td>
            <td>${formatCurrency(item.optimized_margin)}</td>
            <td>${item.reduction_percent}%</td>
            <td class="${confidenceClass}">${Math.round(item.confidence * 100)}%</td>
        `;
        
        historyTable.appendChild(row);
    });
}

// Initialize the demo
async function initializeDemo() {
    await fetchPortfolio();
    await fetchMarketData();
    await fetchNewsData();
    await fetchSentimentData();
    await fetchFactors();
    
    // Set up event listeners
    document.getElementById('optimize-btn').addEventListener('click', optimizeMargin);
}

// Run the demo on page load
document.addEventListener('DOMContentLoaded', initializeDemo);
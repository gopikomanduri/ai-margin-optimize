document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initUI();
    
    // Fetch data for the dashboard
    fetchDashboardData();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Initialize UI components
 */
function initUI() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Connect Broker button
    const connectBrokerBtn = document.getElementById('connectBrokerBtn');
    if (connectBrokerBtn) {
        connectBrokerBtn.addEventListener('click', function() {
            const connectBrokerModal = new bootstrap.Modal(document.getElementById('connectBrokerModal'));
            connectBrokerModal.show();
        });
    }
    
    // Connect Broker Form Submit
    const connectBrokerSubmitBtn = document.getElementById('connectBrokerSubmitBtn');
    if (connectBrokerSubmitBtn) {
        connectBrokerSubmitBtn.addEventListener('click', function() {
            connectBroker();
        });
    }
    
    // Apply Optimization Button
    const applyOptimizationBtn = document.getElementById('applyOptimizationBtn');
    if (applyOptimizationBtn) {
        applyOptimizationBtn.addEventListener('click', function() {
            applyOptimization();
        });
    }
}

/**
 * Fetch all data for the dashboard
 */
async function fetchDashboardData() {
    try {
        // Show loading indicators
        showLoading();
        
        // Fetch portfolio data
        const portfolio = await fetchPortfolio();
        
        // Fetch news data based on portfolio
        const news = await fetchNews();
        
        // Fetch sentiment analysis
        const sentiment = await fetchSentiment();
        
        // Fetch margin optimization
        const optimization = await fetchOptimization();
        
        // Fetch market data
        const marketData = await fetchMarketData();
        
        // Update UI with data
        updatePortfolioUI(portfolio);
        updateNewsUI(news);
        updateSentimentUI(sentiment);
        updateOptimizationUI(optimization);
        updateMarketDataUI(marketData);
        
        // Hide loading indicators
        hideLoading();
        
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showError("Failed to load dashboard data. Please try again.");
        hideLoading();
    }
}

/**
 * Show loading state
 */
function showLoading() {
    // You could add loading spinners to different sections
    // This is a simplified version
    console.log("Loading data...");
}

/**
 * Hide loading state
 */
function hideLoading() {
    // Remove loading spinners
    console.log("Data loaded");
}

/**
 * Show error message
 */
function showError(message) {
    alert(message);
}

/**
 * Connect to broker API
 */
async function connectBroker() {
    try {
        // Get form values
        const broker = document.getElementById('brokerSelect').value;
        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;
        const rememberCredentials = document.getElementById('rememberCredentials').checked;
        
        if (!broker || !userId || !password) {
            showError("Please fill all required fields");
            return;
        }
        
        // Prepare request data
        const requestData = {
            broker: broker,
            credentials: {
                user_id: userId,
                password: password
            }
        };
        
        // Call API to connect to broker
        const response = await fetch('/api/broker/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('connectBrokerModal'));
            modal.hide();
            
            // Show success message
            alert(`Successfully connected to ${broker.toUpperCase()}`);
            
            // Store token if remember is checked
            if (rememberCredentials) {
                localStorage.setItem('broker', broker);
                localStorage.setItem('user_id', userId);
                // Note: We don't store password for security reasons
            }
            
            // Refresh dashboard data
            fetchDashboardData();
            
        } else {
            showError(`Failed to connect: ${result.error}`);
        }
        
    } catch (error) {
        console.error("Error connecting to broker:", error);
        showError("Failed to connect to broker. Please try again.");
    }
}

/**
 * Apply margin optimization
 */
function applyOptimization() {
    // In a real app, this would call an API to apply the optimization
    // For this demo, just show an alert
    alert("Optimization applied successfully! Your margin requirements have been updated.");
}

/**
 * Fetch portfolio data from API
 */
async function fetchPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        return await response.json();
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        return null;
    }
}

/**
 * Fetch news data from API
 */
async function fetchNews() {
    try {
        const response = await fetch('/api/news');
        return await response.json();
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
}

/**
 * Fetch sentiment analysis from API
 */
async function fetchSentiment() {
    try {
        const response = await fetch('/api/sentiment');
        return await response.json();
    } catch (error) {
        console.error("Error fetching sentiment analysis:", error);
        return null;
    }
}

/**
 * Fetch margin optimization from API
 */
async function fetchOptimization() {
    try {
        const response = await fetch('/api/margin/optimize');
        return await response.json();
    } catch (error) {
        console.error("Error fetching margin optimization:", error);
        return null;
    }
}

/**
 * Fetch market data from API
 */
async function fetchMarketData() {
    try {
        const response = await fetch('/api/macro');
        return await response.json();
    } catch (error) {
        console.error("Error fetching market data:", error);
        return null;
    }
}

/**
 * Update portfolio UI with data
 */
function updatePortfolioUI(portfolio) {
    if (!portfolio) return;
    
    // Update margin information
    const marginData = portfolio.margin;
    if (marginData) {
        document.getElementById('availableMargin').textContent = formatCurrency(marginData.available_margin);
        document.getElementById('usedMargin').textContent = formatCurrency(marginData.used_margin);
        document.getElementById('totalMargin').textContent = formatCurrency(marginData.total_margin);
        
        // Update progress bar
        const progressBar = document.getElementById('marginProgressBar');
        progressBar.style.width = `${marginData.margin_used_percent}%`;
        
        // Change color based on percentage
        if (marginData.margin_used_percent > 80) {
            progressBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');
            progressBar.classList.add('bg-danger');
        } else if (marginData.margin_used_percent > 60) {
            progressBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');
            progressBar.classList.add('bg-success');
        }
    }
    
    // Update positions table
    const positionsTableBody = document.getElementById('positionsTableBody');
    if (positionsTableBody && portfolio.positions) {
        positionsTableBody.innerHTML = '';
        
        portfolio.positions.forEach(position => {
            const row = document.createElement('tr');
            
            const isPnLPositive = position.pnl >= 0;
            const pnlClass = isPnLPositive ? 'text-success' : 'text-danger';
            const pnlPrefix = isPnLPositive ? '' : '-';
            
            row.innerHTML = `
                <td>${position.symbol}</td>
                <td>${position.qty}</td>
                <td>${formatCurrency(position.buy_price)}</td>
                <td>${formatCurrency(position.current_price)}</td>
                <td class="${pnlClass}">${pnlPrefix}${formatCurrency(Math.abs(position.pnl))}</td>
                <td>${formatCurrency(position.margin_used)}</td>
                <td><span class="badge bg-secondary">Loading...</span></td>
            `;
            
            positionsTableBody.appendChild(row);
        });
    }
    
    // Update holdings table
    const holdingsTableBody = document.getElementById('holdingsTableBody');
    if (holdingsTableBody && portfolio.holdings) {
        holdingsTableBody.innerHTML = '';
        
        portfolio.holdings.forEach(holding => {
            const row = document.createElement('tr');
            
            const isPnLPositive = holding.pnl >= 0;
            const pnlClass = isPnLPositive ? 'text-success' : 'text-danger';
            const pnlPrefix = isPnLPositive ? '' : '-';
            
            row.innerHTML = `
                <td>${holding.symbol}</td>
                <td>${holding.quantity}</td>
                <td>${formatCurrency(holding.avg_price)}</td>
                <td>${formatCurrency(holding.current_price)}</td>
                <td class="${pnlClass}">${pnlPrefix}${formatCurrency(Math.abs(holding.pnl))}</td>
                <td class="${pnlClass}">${pnlPrefix}${Math.abs(holding.pnl_percent).toFixed(2)}%</td>
                <td><span class="badge bg-secondary">Loading...</span></td>
            `;
            
            holdingsTableBody.appendChild(row);
        });
    }
}

/**
 * Update news UI with data
 */
function updateNewsUI(news) {
    if (!news || news.length === 0) return;
    
    const newsList = document.getElementById('newsList');
    if (newsList) {
        newsList.innerHTML = '';
        
        // Only show up to 5 news items
        const newsToShow = news.slice(0, 5);
        
        newsToShow.forEach(article => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            
            // Format date
            let timeAgo = 'recently';
            if (article.publishedAt) {
                const publishDate = new Date(article.publishedAt);
                const now = new Date();
                const diffMs = now - publishDate;
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                
                if (diffHrs < 1) {
                    timeAgo = 'just now';
                } else if (diffHrs < 24) {
                    timeAgo = `${diffHrs}h ago`;
                } else {
                    const diffDays = Math.floor(diffHrs / 24);
                    timeAgo = `${diffDays}d ago`;
                }
            }
            
            li.innerHTML = `
                <small class="text-muted d-block">${article.related_symbol} • ${timeAgo}</small>
                <a href="${article.url}" target="_blank" class="text-decoration-none">${article.title}</a>
            `;
            
            newsList.appendChild(li);
        });
    }
}

/**
 * Update sentiment UI with data
 */
function updateSentimentUI(sentiment) {
    if (!sentiment) return;
    
    // Update overall sentiment
    const overall = sentiment.overall;
    if (overall) {
        const score = overall.score;
        const confidence = overall.confidence;
        
        // Update sentiment value
        const sentimentValue = document.getElementById('overallSentimentValue');
        if (sentimentValue) {
            sentimentValue.textContent = score.toFixed(2);
            
            // Update color based on score
            sentimentValue.className = score > 0 ? 'text-success fw-bold' : score < 0 ? 'text-danger fw-bold' : 'text-warning fw-bold';
        }
        
        // Update sentiment bar
        const sentimentBar = document.getElementById('overallSentimentBar');
        if (sentimentBar) {
            // Convert score from -1 to 1 range to 0 to 100% for the progress bar
            const barWidth = ((score + 1) / 2) * 100;
            sentimentBar.style.width = `${barWidth}%`;
            
            // Update color based on score
            sentimentBar.className = 'progress-bar';
            if (score > 0.3) {
                sentimentBar.classList.add('bg-success');
            } else if (score < -0.3) {
                sentimentBar.classList.add('bg-danger');
            } else {
                sentimentBar.classList.add('bg-warning');
            }
        }
        
        // Update confidence
        const confidenceElement = document.getElementById('sentimentConfidence');
        if (confidenceElement) {
            confidenceElement.textContent = confidence.toFixed(2);
        }
    }
    
    // Update symbol-specific sentiment
    const symbolSentimentContainer = document.getElementById('symbolSentiment');
    if (symbolSentimentContainer) {
        symbolSentimentContainer.innerHTML = '';
        
        // Loop through sentiment data, skipping the 'overall' key
        Object.entries(sentiment).forEach(([symbol, data]) => {
            if (symbol === 'overall') return;
            
            const score = data.score;
            
            // Create sentiment bar for this symbol
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-2';
            
            // Convert score from -1 to 1 range to 0 to 100% for the progress bar
            const barWidth = ((score + 1) / 2) * 100;
            const barColor = score > 0.3 ? 'bg-success' : score < -0.3 ? 'bg-danger' : 'bg-warning';
            const textColor = score > 0.3 ? 'text-success' : score < -0.3 ? 'text-danger' : 'text-warning';
            
            div.innerHTML = `
                <div>${symbol}</div>
                <div class="d-flex align-items-center">
                    <div class="progress mx-2" style="width: 100px; height: 6px;">
                        <div class="progress-bar ${barColor}" role="progressbar" style="width: ${barWidth}%"></div>
                    </div>
                    <span class="${textColor}">${score.toFixed(2)}</span>
                </div>
            `;
            
            symbolSentimentContainer.appendChild(div);
            
            // Also update the sentiment badges in the tables
            updateSentimentBadges(symbol, score);
        });
    }
}

/**
 * Update sentiment badges in portfolio tables
 */
function updateSentimentBadges(symbol, score) {
    // Find all rows in both tables that contain this symbol
    const tables = ['positionsTableBody', 'holdingsTableBody'];
    
    tables.forEach(tableId => {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        // Get all rows
        const rows = table.querySelectorAll('tr');
        
        rows.forEach(row => {
            const symbolCell = row.querySelector('td:first-child');
            if (!symbolCell) return;
            
            // Check if this row is for the current symbol
            // For positions, we need to check if the symbol starts with the stock symbol
            // (e.g., "NIFTY APR FUT" contains "NIFTY")
            if (symbolCell.textContent.includes(symbol)) {
                const badgeCell = row.querySelector('td:last-child');
                if (!badgeCell) return;
                
                // Create badge
                let badgeClass = 'bg-warning text-dark';
                let badgeText = 'Neutral';
                
                if (score > 0.3) {
                    badgeClass = 'bg-success';
                    badgeText = 'Positive';
                } else if (score < -0.3) {
                    badgeClass = 'bg-danger';
                    badgeText = 'Negative';
                }
                
                badgeCell.innerHTML = `<span class="badge ${badgeClass}">${badgeText}</span>`;
            }
        });
    });
}

/**
 * Update optimization UI with data
 */
function updateOptimizationUI(optimization) {
    if (!optimization) return;
    
    // Update margin values
    document.getElementById('currentMargin').textContent = formatCurrency(optimization.current_margin);
    document.getElementById('optimizedMargin').textContent = formatCurrency(optimization.optimized_margin);
    document.getElementById('potentialSavings').textContent = formatCurrency(optimization.potential_savings);
    document.getElementById('reductionPercentage').textContent = `${optimization.reduction_percent.toFixed(1)}%`;
    
    // Update optimization factors
    const factorsContainer = document.getElementById('optimizationFactors');
    if (factorsContainer && optimization.method === 'rule_based') {
        factorsContainer.innerHTML = '';
        
        // Add each factor
        const factors = optimization.factors;
        Object.entries(factors).forEach(([factor, value]) => {
            // Format factor name
            const formattedFactor = factor
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            
            // Calculate width based on contribution to total reduction
            const width = (value / optimization.reduction_percent) * 100;
            
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-2';
            div.innerHTML = `
                <div>${formattedFactor}</div>
                <div class="d-flex align-items-center">
                    <div class="progress mx-2" style="width: 100px; height: 6px;">
                        <div class="progress-bar" role="progressbar" style="width: ${width}%"></div>
                    </div>
                    <span>${value.toFixed(1)}%</span>
                </div>
            `;
            
            factorsContainer.appendChild(div);
        });
        
        // Add total reduction
        const totalDiv = document.createElement('div');
        totalDiv.innerHTML = `
            <hr>
            <div class="d-flex justify-content-between align-items-center">
                <div class="fw-bold">Total Reduction</div>
                <div class="fw-bold">${optimization.reduction_percent.toFixed(1)}%</div>
            </div>
            
            <div class="mt-3 text-end">
                <span class="badge bg-secondary">Confidence: ${(optimization.confidence * 100).toFixed(0)}%</span>
                <span class="badge bg-info ms-2">${optimization.method === 'rule_based' ? 'Rule-based' : 'ML Model'}</span>
            </div>
        `;
        
        factorsContainer.appendChild(totalDiv);
    }
}

/**
 * Update market data UI
 */
function updateMarketDataUI(marketData) {
    if (!marketData) return;
    
    // Update each macro indicator
    Object.entries(marketData).forEach(([indicator, data]) => {
        try {
            const currentValue = data.current;
            const change = data.change_1d;
            const changePercent = data.change_percent_1d;
            
            // Format the values
            let valueFormatted = currentValue;
            let changeFormatted = change;
            let changePercentFormatted = changePercent;
            
            // Special formatting for certain indicators
            if (indicator === 'INR/USD') {
                valueFormatted = currentValue.toFixed(2);
                changeFormatted = change.toFixed(2);
            } else if (indicator === 'Crude Oil' || indicator === 'Gold') {
                valueFormatted = `$${currentValue.toFixed(2)}`;
                changeFormatted = change.toFixed(2);
            } else {
                valueFormatted = currentValue.toFixed(2);
                changeFormatted = change.toFixed(2);
            }
            
            changePercentFormatted = changePercent.toFixed(2);
            
            // Determine if change is positive or negative
            const isPositive = change >= 0;
            const changeIndicator = isPositive ? '+' : '';
            const changeClass = isPositive ? 'text-success' : 'text-danger';
            const arrowIcon = isPositive ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
            
            // Update the UI
            const indicatorId = indicator.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Update value
            const valueElement = document.getElementById(`${indicatorId}Value`);
            if (valueElement) {
                valueElement.textContent = valueFormatted;
            }
            
            // Update change
            const changeElement = document.getElementById(`${indicatorId}Change`);
            if (changeElement) {
                changeElement.textContent = `${changeIndicator}${changeFormatted} (${changeIndicator}${changePercentFormatted}%)`;
                changeElement.parentElement.className = changeClass + ' small';
                
                // Update arrow icon
                const iconElement = changeElement.parentElement.querySelector('i');
                if (iconElement) {
                    iconElement.className = `bi ${arrowIcon}`;
                }
            }
        } catch (error) {
            console.error(`Error updating market data for ${indicator}:`, error);
        }
    });
}

/**
 * Format currency value
 */
function formatCurrency(value) {
    if (value === undefined || value === null) return '';
    
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(value);
}
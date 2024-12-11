// Initialize data storage
let tradeData = JSON.parse(localStorage.getItem('tradeData')) || [];
let ships = JSON.parse(localStorage.getItem('ships')) || [
    { name: 'Caterpillar', cargoSize: 576 },
    { name: 'Freelancer', cargoSize: 66 },
    { name: 'Cutlass Black', cargoSize: 46 },
    { name: 'Constellation', cargoSize: 96 }
];
let cargoTypes = JSON.parse(localStorage.getItem('cargoTypes')) || ['Titanium', 'Laranite', 'Agricium', 'Medical Supplies'];
let locations = JSON.parse(localStorage.getItem('locations')) || [
    'Port Olisar', 'Lorville', 'Area18', 'New Babbage', 
    'CRU L1', 'HUR L1', 'ARC L1', 'MIC L1'
];

// Constants for SCU calculations

function calculateSCUPrice(fullPrice, amount) {
    // Calculate price per SCU by dividing total price by amount of SCUs
    return amount > 0 ? fullPrice / amount : 0;
}

function calculateProfit(buyPrice, sellPrice, amount) {
    // Calculate profit based on price per SCU
    const buyPricePerSCU = calculateSCUPrice(buyPrice, amount);
    const sellPricePerSCU = calculateSCUPrice(sellPrice, amount);
    return (sellPricePerSCU - buyPricePerSCU) * amount;
}

// Filter dropdown options
function filterDropdown(filterInput, selectElement, options) {
    const filterText = filterInput.value.toLowerCase();
    const select = document.getElementById(selectElement);
    select.innerHTML = '';
    
    options.filter(option => 
        (typeof option === 'string' ? option : option.name)
        .toLowerCase()
        .includes(filterText)
    ).forEach(option => {
        if (typeof option === 'string') {
            select.add(new Option(option, option));
        } else {
            select.add(new Option(option.name, option.name));
        }
    });
}

// Initialize dropdowns with filtering
function initializeDropdowns() {
    // Initialize ship dropdown
    const shipSelect = document.getElementById('shipSelect');
    shipSelect.innerHTML = '';
    ships.forEach(ship => {
        shipSelect.add(new Option(ship.name, ship.name));
    });

    // Initialize locations
    filterDropdown({ value: '' }, 'buyLocation', locations);
    filterDropdown({ value: '' }, 'sellLocation', locations);

    // Update cargo size for initially selected ship
    updateCargoSize();

    // Add to existing function
    const priceAnalysisCargoFilter = document.getElementById('priceAnalysisCargoFilter');
    const priceAnalysisLocationFilter = document.getElementById('priceAnalysisLocationFilter');
    
    cargoTypes.forEach(type => {
        priceAnalysisCargoFilter.add(new Option(type, type));
    });
    
    locations.forEach(location => {
        priceAnalysisLocationFilter.add(new Option(location, location));
    });
    
    updatePriceAnalysis();
}

// Edit ship's cargo size
function editShipCargo(shipName) {
    const ship = ships.find(s => s.name === shipName);
    if (!ship) return;

    const newCargoSize = parseInt(prompt(`Enter new cargo size for ${ship.name} (SCU):`, ship.cargoSize));
    if (!isNaN(newCargoSize) && newCargoSize > 0) {
        ship.cargoSize = newCargoSize;
        localStorage.setItem('ships', JSON.stringify(ships));
        
        // Refresh the modal and update cargo size if the ship is currently selected
        showManageModal('ships');
        const currentShip = document.getElementById('shipSelect').value;
        if (currentShip === shipName) {
            document.getElementById('cargoSize').value = newCargoSize;
        }
    }
}

// Update cargo size based on selected ship
function updateCargoSize() {
    const shipSelect = document.getElementById('shipSelect');
    const cargoSizeInput = document.getElementById('cargoSize');
    const selectedShip = ships.find(ship => ship.name === shipSelect.value);
    if (selectedShip) {
        cargoSizeInput.value = selectedShip.cargoSize;
    }
}

// Save cargo size changes when manually edited
function saveCargoSize() {
    const shipSelect = document.getElementById('shipSelect');
    const cargoSizeInput = document.getElementById('cargoSize');
    const selectedShip = ships.find(ship => ship.name === shipSelect.value);
    
    if (selectedShip && cargoSizeInput.value) {
        const newSize = parseInt(cargoSizeInput.value);
        if (!isNaN(newSize) && newSize > 0) {
            selectedShip.cargoSize = newSize;
            localStorage.setItem('ships', JSON.stringify(ships));
        }
    }
}

// Add new ship with cargo size
function addNewShip() {
    const shipName = prompt('Enter new ship name:');
    if (!shipName) return;
    
    const cargoSize = parseInt(prompt('Enter cargo size (SCU):'));
    if (isNaN(cargoSize) || cargoSize <= 0) {
        alert('Please enter a valid cargo size');
        return;
    }

    if (!ships.some(ship => ship.name === shipName)) {
        ships.push({ name: shipName, cargoSize: cargoSize });
        localStorage.setItem('ships', JSON.stringify(ships));
        initializeDropdowns();
    }
}

// Add new option to dropdowns
function addNewOption(type) {
    const newOption = prompt(`Enter new ${type} name:`);
    if (!newOption) return;

    switch(type) {
        case 'cargo':
            if (!cargoTypes.includes(newOption)) {
                cargoTypes.push(newOption);
                localStorage.setItem('cargoTypes', JSON.stringify(cargoTypes));
            }
            break;
        case 'location':
            if (!locations.includes(newOption)) {
                locations.push(newOption);
                localStorage.setItem('locations', JSON.stringify(locations));
            }
            break;
    }

    initializeDropdowns();
}

// Add new cargo item to form
function addCargoItem() {
    const container = document.getElementById('cargoItemsContainer');
    const cargoId = Date.now(); // Unique ID for the cargo item
    
    const cargoItem = document.createElement('div');
    cargoItem.className = 'cargo-item';
    cargoItem.id = `cargo-${cargoId}`;
    
    cargoItem.innerHTML = `
        <div class="remove-cargo" onclick="removeCargoItem(${cargoId})">✕</div>
        <div class="row">
            <div class="col-md-12 mb-2">
                <label class="form-label">Cargo Type</label>
                <div class="d-flex">
                    <input type="text" class="form-control me-2" placeholder="Filter cargo types..." 
                           onkeyup="filterCargoTypes(this, ${cargoId})">
                    <select class="form-select me-2" id="cargoType-${cargoId}" required></select>
                    <button type="button" class="btn btn-secondary btn-add-option" 
                            onclick="addNewOption('cargo')">+</button>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-2">
                <label class="form-label">Amount (SCU)</label>
                <input type="number" class="form-control" id="amount-${cargoId}" required>
            </div>
            <div class="col-md-6 mb-2">
                <label class="form-label">Total Buy Price</label>
                <input type="number" class="form-control" id="buyPrice-${cargoId}" required>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-2">
                <label class="form-label">Amount Sold (SCU)</label>
                <input type="number" class="form-control" id="sellAmount-${cargoId}" required>
            </div>
            <div class="col-md-6 mb-2">
                <label class="form-label">Total Sell Price</label>
                <input type="number" class="form-control" id="sellPrice-${cargoId}" required>
            </div>
        </div>
    `;
    
    container.appendChild(cargoItem);
    filterDropdown({ value: '' }, `cargoType-${cargoId}`, cargoTypes);
}

// Remove cargo item from form
function removeCargoItem(cargoId) {
    const item = document.getElementById(`cargo-${cargoId}`);
    item.remove();
}

// Filter cargo types for specific cargo item
function filterCargoTypes(input, cargoId) {
    filterDropdown(input, `cargoType-${cargoId}`, cargoTypes);
}

// Get all cargo items data
function getCargoItems() {
    const items = [];
    const container = document.getElementById('cargoItemsContainer');
    
    for (const cargoItem of container.children) {
        const cargoId = cargoItem.id.split('-')[1];
        items.push({
            cargoType: document.getElementById(`cargoType-${cargoId}`).value,
            amount: parseFloat(document.getElementById(`amount-${cargoId}`).value),
            buyPrice: parseFloat(document.getElementById(`buyPrice-${cargoId}`).value),
            sellAmount: parseFloat(document.getElementById(`sellAmount-${cargoId}`).value),
            sellPrice: parseFloat(document.getElementById(`sellPrice-${cargoId}`).value)
        });
    }
    
    return items;
}

// Add trade record
document.getElementById('tradeForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const cargoItems = [];
    document.querySelectorAll('.cargo-item').forEach(item => {
        cargoItems.push({
            cargoType: item.querySelector('[name="cargoType"]').value,
            amount: parseFloat(item.querySelector('[name="amount"]').value) || 0,
            buyPrice: parseFloat(item.querySelector('[name="buyPrice"]').value) || 0,
            sellPrice: parseFloat(item.querySelector('[name="sellPrice"]').value) || 0
        });
    });

    const tradeData = {
        ship: document.getElementById('shipSelect').value,
        buyLocation: document.getElementById('buyLocation').value,
        sellLocation: document.getElementById('sellLocation').value,
        cargoItems: cargoItems,
        date: new Date().toISOString()
    };

    // Get existing trades or initialize empty array
    let existingTrades = JSON.parse(localStorage.getItem('tradeData') || '[]');
    
    // Add new trade
    existingTrades.push(tradeData);
    
    // Save back to localStorage
    localStorage.setItem('tradeData', JSON.stringify(existingTrades));
    
    // Update displays
    updateTradeHistory();
    updatePriceAnalysis();
    this.reset();
    document.getElementById('cargoItemsContainer').innerHTML = '';
});

// Delete trade record
function deleteTrade(index) {
    if (confirm('Are you sure you want to delete this trade?')) {
        let trades = JSON.parse(localStorage.getItem('tradeData') || '[]');
        trades.splice(index, 1);
        localStorage.setItem('tradeData', JSON.stringify(trades));
        updateTradeHistory();
        updatePriceAnalysis();
    }
}

// Update trade history table with null checks
function updateTradeHistory() {
    try {
        const trades = JSON.parse(localStorage.getItem('tradeData') || '[]');
        const tbody = document.getElementById('tradeHistoryBody'); 
        if (!tbody) {
            console.error('Trade history table body not found');
            return;
        }

        tbody.innerHTML = '';

        trades.forEach((trade, index) => {
            if (!trade || !trade.cargoItems) return;
            
            const row = document.createElement('tr');
            const profit = trade.cargoItems.reduce((sum, item) => {
                if (!item) return sum;
                const sellPrice = parseFloat(item.sellPrice) || 0;
                const buyPrice = parseFloat(item.buyPrice) || 0;
                const amount = parseFloat(item.amount) || 0;
                return sum + calculateProfit(buyPrice, sellPrice, amount);
            }, 0);

            row.innerHTML = `
                <td>${trade.ship || 'N/A'}</td>
                <td>${trade.cargoItems.map(item => `${item.cargoType || 'Unknown'} (${item.amount || 0} SCU)`).join(', ')}</td>
                <td>${trade.buyLocation || 'N/A'} → ${trade.sellLocation || 'N/A'}</td>
                <td>${profit.toLocaleString()} aUEC</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteTrade(${index})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error updating trade history:', error);
    }
}

// Migration function to add dates to existing records
function migrateTradeData() {
    try {
        const trades = JSON.parse(localStorage.getItem('tradeData') || '[]');
        let needsMigration = false;

        // Check if any trade lacks a date
        trades.forEach(trade => {
            if (!trade.date) {
                needsMigration = true;
                trade.date = new Date().toISOString(); // Add current date to old records
            }
        });

        // If we made any changes, save back to localStorage
        if (needsMigration) {
            localStorage.setItem('tradeData', JSON.stringify(trades));
            console.log('Trade data migration completed');
        }
    } catch (error) {
        console.error('Error migrating trade data:', error);
    }
}

// Update price analysis table and charts
function updatePriceAnalysis() {
    try {
        const trades = JSON.parse(localStorage.getItem('tradeData') || '[]');
        const cargoFilter = document.getElementById('priceAnalysisCargoFilter').value;
        const locationFilter = document.getElementById('priceAnalysisLocationFilter').value;
        const sortBy = document.getElementById('priceAnalysisSortBy').value;
        const sortDirection = document.getElementById('priceAnalysisSortDirection').value;

        // Create maps to store data
        const priceMap = new Map();
        const profitHistory = new Map();
        const commodityProfits = new Map();

        // Process all trades
        trades.forEach(trade => {
            if (!trade || !trade.cargoItems) return;
            const tradeDate = trade.date ? new Date(trade.date) : new Date();
            
            trade.cargoItems.forEach(item => {
                if (!item) return;
                const key = `${item.cargoType}|${trade.buyLocation}|${trade.sellLocation}`;
                const buyPrice = parseFloat(item.buyPrice) || 0;
                const sellPrice = parseFloat(item.sellPrice) || 0;
                const amount = parseFloat(item.amount) || 0;

                // Calculate prices per SCU
                const buyPricePerSCU = calculateSCUPrice(buyPrice, amount);
                const sellPricePerSCU = calculateSCUPrice(sellPrice, amount);
                const profitPerSCU = sellPricePerSCU - buyPricePerSCU;
                
                // Update price map
                const existingEntry = priceMap.get(key);
                if (!existingEntry || tradeDate > new Date(existingEntry.date)) {
                    priceMap.set(key, {
                        cargoType: item.cargoType,
                        buyLocation: trade.buyLocation,
                        buyPrice: buyPricePerSCU,
                        sellLocation: trade.sellLocation,
                        sellPrice: sellPricePerSCU,
                        profitPerSCU: profitPerSCU,
                        date: tradeDate.toISOString()
                    });
                }

                // Update profit history
                const monthKey = tradeDate.toISOString().slice(0, 7); // YYYY-MM
                profitHistory.set(monthKey, (profitHistory.get(monthKey) || 0) + calculateProfit(buyPrice, sellPrice, amount));

                // Update commodity profits
                commodityProfits.set(item.cargoType, (commodityProfits.get(item.cargoType) || 0) + calculateProfit(buyPrice, sellPrice, amount));
            });
        });

        // Update price analysis table
        const tbody = document.getElementById('priceAnalysisBody');
        if (tbody) {
            tbody.innerHTML = '';

            Array.from(priceMap.values())
                .filter(entry => {
                    if (cargoFilter && entry.cargoType !== cargoFilter) return false;
                    if (locationFilter && (entry.buyLocation !== locationFilter && entry.sellLocation !== locationFilter)) return false;
                    return true;
                })
                .sort((a, b) => {
                    let valueA, valueB;
                    switch(sortBy) {
                        case 'profit':
                            valueA = a.profitPerSCU;
                            valueB = b.profitPerSCU;
                            break;
                        case 'buyPrice':
                            valueA = a.buyPrice;
                            valueB = b.buyPrice;
                            break;
                        case 'sellPrice':
                            valueA = a.sellPrice;
                            valueB = b.sellPrice;
                            break;
                        default:
                            valueA = a.profitPerSCU;
                            valueB = b.profitPerSCU;
                    }
                    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
                })
                .forEach(entry => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${entry.cargoType || 'Unknown'}</td>
                        <td>${entry.buyLocation || 'N/A'}</td>
                        <td>${Math.round(entry.buyPrice).toLocaleString()} aUEC/SCU</td>
                        <td>${entry.sellLocation || 'N/A'}</td>
                        <td>${Math.round(entry.sellPrice).toLocaleString()} aUEC/SCU</td>
                        <td>${Math.round(entry.profitPerSCU).toLocaleString()} aUEC/SCU</td>
                        <td>${new Date(entry.date).toLocaleDateString()}</td>
                    `;
                    tbody.appendChild(row);
                });
        }

        // Update charts
        updateProfitTrendChart(profitHistory);
        updateTopCommoditiesChart(commodityProfits);
    } catch (error) {
        console.error('Error in updatePriceAnalysis:', error);
    }
}

// Update profit trend chart
function updateProfitTrendChart(profitHistory) {
    const ctx = document.getElementById('profitTrendChart');
    if (!ctx) {
        console.error('Profit trend chart canvas not found');
        return;
    }

    // Get last 6 months of data
    const sortedData = Array.from(profitHistory.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .slice(-6); // Only show last 6 months

    const labels = sortedData.map(([month]) => {
        const [year, monthNum] = month.split('-');
        return `${monthNum}/${year}`;
    });
    const data = sortedData.map(([, profit]) => profit);

    if (window.profitTrendChart instanceof Chart) {
        window.profitTrendChart.destroy();
    }

    window.profitTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Profit (aUEC)',
                data: data,
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e2e8f0',
                        boxWidth: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0',
                        callback: value => `${(value / 1000000).toFixed(1)}M`
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
}

// Update top commodities chart
function updateTopCommoditiesChart(commodityProfits) {
    const ctx = document.getElementById('topCommoditiesChart');
    if (!ctx) {
        console.error('Top commodities chart canvas not found');
        return;
    }

    // Get top 5 commodities only
    const topCommodities = Array.from(commodityProfits.entries())
        .sort(([, profitA], [, profitB]) => profitB - profitA)
        .slice(0, 5); // Only show top 5

    const labels = topCommodities.map(([commodity]) => commodity);
    const data = topCommodities.map(([, profit]) => profit);

    if (window.topCommoditiesChart instanceof Chart) {
        window.topCommoditiesChart.destroy();
    }

    window.topCommoditiesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Profit (aUEC)',
                data: data,
                backgroundColor: 'rgba(66, 153, 225, 0.5)',
                borderColor: '#4299e1',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e2e8f0',
                        boxWidth: 20
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0',
                        callback: value => `${(value / 1000000).toFixed(1)}M`
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
}

// Show management modal
function showManageModal(type) {
    const modal = new bootstrap.Modal(document.getElementById('manageModal'));
    const title = document.getElementById('manageModalTitle');
    const list = document.getElementById('manageList');
    list.innerHTML = '';

    let items;
    switch(type) {
        case 'ships':
            title.textContent = 'Manage Ships';
            items = ships;
            items.forEach(ship => {
                const item = document.createElement('div');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    <span>${ship.name} (${ship.cargoSize} SCU)</span>
                    <div class="action-buttons">
                        <span class="edit-item" onclick="editShipCargo('${ship.name}')">✎</span>
                        <span class="delete-item" onclick="deleteItem('ships', '${ship.name}')">✕</span>
                    </div>
                `;
                list.appendChild(item);
            });
            break;
        case 'cargo':
            title.textContent = 'Manage Cargo Types';
            items = cargoTypes;
            items.forEach(cargo => {
                const item = document.createElement('div');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    ${cargo}
                    <span class="delete-item" onclick="deleteItem('cargo', '${cargo}')">✕</span>
                `;
                list.appendChild(item);
            });
            break;
        case 'locations':
            title.textContent = 'Manage Locations';
            items = locations;
            items.forEach(location => {
                const item = document.createElement('div');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    ${location}
                    <span class="delete-item" onclick="deleteItem('locations', '${location}')">✕</span>
                `;
                list.appendChild(item);
            });
            break;
    }

    modal.show();
}

// Delete item from list
function deleteItem(type, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }

    switch(type) {
        case 'ships':
            // Check if ship is used in any trade records
            if (tradeData.some(record => record.ship === name)) {
                alert('Cannot delete this ship as it is used in existing trade records.');
                return;
            }
            ships = ships.filter(ship => ship.name !== name);
            localStorage.setItem('ships', JSON.stringify(ships));
            break;
        case 'cargo':
            // Check if cargo type is used in any trade records
            if (tradeData.some(record => record.cargoItems.some(item => item.cargoType === name))) {
                alert('Cannot delete this cargo type as it is used in existing trade records.');
                return;
            }
            cargoTypes = cargoTypes.filter(cargo => cargo !== name);
            localStorage.setItem('cargoTypes', JSON.stringify(cargoTypes));
            break;
        case 'locations':
            // Check if location is used in any trade records
            if (tradeData.some(record => record.buyLocation === name || record.sellLocation === name)) {
                alert('Cannot delete this location as it is used in existing trade records.');
                return;
            }
            locations = locations.filter(location => location !== name);
            localStorage.setItem('locations', JSON.stringify(locations));
            break;
    }

    // Refresh the modal and dropdowns
    showManageModal(type);
    initializeDropdowns();
}

// Export trade data to Google Sheets
function exportToSheets() {
    // Convert trade data to CSV format
    let csv = 'Ship,Cargo Types,Buy Location,Sell Location,Total Profit (aUEC)\n';
    
    tradeData.forEach(record => {
        const cargoDetails = record.cargoItems.map(item => 
            `${item.amount} SCU ${item.cargoType} (Buy: ${item.buyPrice} aUEC, Sell: ${item.sellPrice} aUEC)`
        ).join('; ');
        
        csv += `"${record.ship}","${cargoDetails}","${record.buyLocation}","${record.sellLocation}","${record.totalProfit}"\n`;
    });

    // Create a Blob containing the CSV data
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a link to download the CSV
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'star_citizen_trades.csv');
    document.body.appendChild(link);
    
    // Click the link to download the file
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Provide instructions for Google Sheets import
    alert('CSV file has been downloaded. To import into Google Sheets:\n\n' +
          '1. Open Google Sheets\n' +
          '2. Click File > Import\n' +
          '3. Select the downloaded CSV file\n' +
          '4. Choose "Replace current sheet" or "Create new sheet"\n' +
          '5. Click Import data');
}

// Save data to JSON file
function saveToJson() {
    // Collect all data from localStorage
    const data = {
        trades: JSON.parse(localStorage.getItem('tradeData') || '[]'),
        ships: JSON.parse(localStorage.getItem('ships') || '[]'),
        cargoTypes: JSON.parse(localStorage.getItem('cargoTypes') || '[]'),
        locations: JSON.parse(localStorage.getItem('locations') || '[]')
    };

    // Create a Blob with the JSON data
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `star_citizen_trade_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Load data from JSON file
function loadFromJson(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.trades || !data.ships || !data.cargoTypes || !data.locations) {
                throw new Error('Invalid data format');
            }

            // Store the data
            localStorage.setItem('tradeData', JSON.stringify(data.trades));
            localStorage.setItem('ships', JSON.stringify(data.ships));
            localStorage.setItem('cargoTypes', JSON.stringify(data.cargoTypes));
            localStorage.setItem('locations', JSON.stringify(data.locations));

            // Refresh the UI
            updateTradeHistory();
            initializeDropdowns();

            alert('Data loaded successfully!');
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset the input
    input.value = '';
}

// Combine multiple JSON files
function combineJsonFiles(input) {
    const files = Array.from(input.files);
    if (files.length < 2) {
        alert('Please select at least 2 JSON files to combine');
        input.value = '';
        return;
    }

    let combinedData = {
        trades: [],
        ships: [],
        cargoTypes: [],
        locations: []
    };

    let filesProcessed = 0;
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.trades || !data.ships || !data.cargoTypes || !data.locations) {
                    throw new Error(`Invalid data format in file: ${file.name}`);
                }

                // Combine data, avoiding duplicates
                combinedData.trades = [...combinedData.trades, ...data.trades];
                combinedData.ships = [...new Set([...combinedData.ships, ...data.ships])];
                combinedData.cargoTypes = [...new Set([...combinedData.cargoTypes, ...data.cargoTypes])];
                combinedData.locations = [...new Set([...combinedData.locations, ...data.locations])];

                filesProcessed++;

                // When all files are processed, save the combined data
                if (filesProcessed === files.length) {
                    // Create and download the combined file
                    const blob = new Blob([JSON.stringify(combinedData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `combined_trade_data_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                alert('Error processing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    });
    
    // Reset the input
    input.value = '';
}

// Update price analysis when filters change
document.getElementById('priceAnalysisCargoFilter').addEventListener('change', updatePriceAnalysis);
document.getElementById('priceAnalysisLocationFilter').addEventListener('change', updatePriceAnalysis);
document.getElementById('priceAnalysisSortBy').addEventListener('change', updatePriceAnalysis);
document.getElementById('priceAnalysisSortDirection').addEventListener('change', updatePriceAnalysis);

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    migrateTradeData();
    initializeDropdowns();
    updateTradeHistory();
    updatePriceAnalysis();
    
    // Add event listeners
    document.getElementById('shipSelect').addEventListener('change', updateCargoSize);
    document.getElementById('cargoSize').addEventListener('change', saveCargoSize);
    
    // Add event listeners for location filters
    document.getElementById('buyLocationFilter').addEventListener('input', function() {
        filterDropdown(this, 'buyLocation', locations);
    });
    document.getElementById('sellLocationFilter').addEventListener('input', function() {
        filterDropdown(this, 'sellLocation', locations);
    });

    // Set fixed height for chart containers
    const chartContainers = document.querySelectorAll('.card-body');
    chartContainers.forEach(container => {
        if (container.querySelector('canvas')) {
            container.style.height = '250px'; // Fixed height
        }
    });
});

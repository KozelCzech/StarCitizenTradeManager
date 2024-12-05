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
}

// Edit ship's cargo size
function editShipCargo() {
    const shipSelect = document.getElementById('shipSelect');
    const selectedShip = ships.find(ship => ship.name === shipSelect.value);
    
    if (!selectedShip) {
        alert('Please select a ship first');
        return;
    }

    const newCargoSize = parseInt(prompt(`Enter new cargo size for ${selectedShip.name} (SCU):`, selectedShip.cargoSize));
    if (!isNaN(newCargoSize) && newCargoSize > 0) {
        selectedShip.cargoSize = newCargoSize;
        localStorage.setItem('ships', JSON.stringify(ships));
        document.getElementById('cargoSize').value = newCargoSize;
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
document.getElementById('tradeForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const cargoItems = getCargoItems();
    if (cargoItems.length === 0) {
        alert('Please add at least one cargo item');
        return;
    }

    const totalProfit = cargoItems.reduce((sum, item) => 
        sum + (item.sellPrice - item.buyPrice), 0);

    const record = {
        id: Date.now(),
        ship: document.getElementById('shipSelect').value,
        cargoSize: document.getElementById('cargoSize').value,
        buyLocation: document.getElementById('buyLocation').value,
        sellLocation: document.getElementById('sellLocation').value,
        cargoItems: cargoItems,
        totalProfit: totalProfit
    };

    tradeData.push(record);
    localStorage.setItem('tradeData', JSON.stringify(tradeData));
    updateTradeHistory();
    this.reset();
    document.getElementById('cargoItemsContainer').innerHTML = '';
});

// Update trade history table
function updateTradeHistory() {
    const tbody = document.getElementById('tradeHistory');
    tbody.innerHTML = '';

    tradeData.forEach(record => {
        const cargoDetails = record.cargoItems.map(item => 
            `${item.amount} SCU ${item.cargoType}`
        ).join('<br>');

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${record.ship}</td>
            <td>${cargoDetails}</td>
            <td>${record.buyLocation} → ${record.sellLocation}</td>
            <td>${record.totalProfit.toLocaleString()} aUEC</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteRecord(${record.id})">Delete</button>
            </td>
        `;
    });
}

// Delete record
function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        tradeData = tradeData.filter(record => record.id !== id);
        localStorage.setItem('tradeData', JSON.stringify(tradeData));
        updateTradeHistory();
    }
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
                    ${ship.name} (${ship.cargoSize} SCU)
                    <span class="delete-item" onclick="deleteItem('ships', '${ship.name}')">✕</span>
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeDropdowns();
    updateTradeHistory();
    
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
});

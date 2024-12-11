// Fleet data structure
let fleetData = JSON.parse(localStorage.getItem('fleetData')) || [];

// Component types configuration
const componentTypes = {
    powerPlant: { 
        label: 'Power Plant', 
        listId: 'powerPlantList',
        infoLabel: 'Power Output',
        infoPlaceholder: 'e.g., 2500 kW'
    },
    shield: { 
        label: 'Shield Generator', 
        listId: 'shieldList',
        infoLabel: 'Shield HP',
        infoPlaceholder: 'e.g., 7500 HP'
    },
    quantumDrive: { 
        label: 'Quantum Drive', 
        listId: 'quantumDriveList',
        infoLabel: 'Speed/Consumption',
        infoPlaceholder: 'e.g., 283,000 km/s, 583 l/Mm'
    },
    weapon: { 
        label: 'Weapon', 
        listId: 'weaponList',
        infoLabel: 'Damage/RoF',
        infoPlaceholder: 'e.g., 220 dmg, 750 rpm'
    },
    cooler: { 
        label: 'Cooler', 
        listId: 'coolerList',
        infoLabel: 'Cooling Rate',
        infoPlaceholder: 'e.g., 235 kW/s'
    }
};

// Size and grade options
const sizeOptions = ['S0', 'S1', 'S2', 'S3', 'S4'];
const gradeOptions = ['A', 'B', 'C', 'D'];

// Initialize Bootstrap modal
let shipModal;
document.addEventListener('DOMContentLoaded', function() {
    shipModal = new bootstrap.Modal(document.getElementById('shipModal'));
    renderFleet();
});

// Show modal for adding new ship
function showAddShipModal() {
    document.getElementById('shipModalTitle').textContent = 'Add New Ship';
    document.getElementById('shipForm').reset();
    clearAllComponents();
    shipModal.show();
}

// Show modal for editing existing ship
function showEditShipModal(index) {
    const ship = fleetData[index];
    document.getElementById('shipModalTitle').textContent = 'Edit Ship';
    
    // Fill form with ship data
    document.getElementById('shipName').value = ship.name;
    document.getElementById('shipModel').value = ship.model;
    document.getElementById('cargoCapacity').value = ship.cargoCapacity;
    document.getElementById('hydrogenFuel').value = ship.hydrogenFuel;
    document.getElementById('quantumFuel').value = ship.quantumFuel;
    document.getElementById('shipNotes').value = ship.notes;

    // Clear and repopulate components
    clearAllComponents();
    Object.entries(ship.components || {}).forEach(([type, components]) => {
        components.forEach(comp => {
            addComponent(type, comp);
        });
    });

    shipModal.show();
}

// Create dropdown HTML
function createDropdownHTML(options, selectedValue = '') {
    return options.map(option => 
        `<option value="${option}" ${option === selectedValue ? 'selected' : ''}>${option}</option>`
    ).join('');
}

// Add component input fields
function addComponent(type, component = null) {
    const listId = componentTypes[type].listId;
    const componentList = document.getElementById(listId);
    const componentDiv = document.createElement('div');
    componentDiv.className = 'component-item mb-2 p-2 border border-secondary rounded';
    
    const sizeOptionsHTML = createDropdownHTML(sizeOptions, component?.size);
    const gradeOptionsHTML = createDropdownHTML(gradeOptions, component?.grade);
    
    componentDiv.innerHTML = `
        <div class="row align-items-center g-2">
            <div class="col-md-3">
                <input type="text" class="form-control form-control-sm" 
                    placeholder="Name" value="${component?.name || ''}" required>
            </div>
            <div class="col-md-2">
                <select class="form-select form-select-sm">
                    ${sizeOptionsHTML}
                </select>
            </div>
            <div class="col-md-2">
                <select class="form-select form-select-sm">
                    ${gradeOptionsHTML}
                </select>
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm" 
                    placeholder="${componentTypes[type].infoPlaceholder}"
                    value="${component?.info || ''}">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm" 
                    onclick="this.closest('.component-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    componentList.appendChild(componentDiv);
}

// Save ship data
function saveShip() {
    const shipData = {
        name: document.getElementById('shipName').value,
        model: document.getElementById('shipModel').value,
        cargoCapacity: parseInt(document.getElementById('cargoCapacity').value),
        hydrogenFuel: parseInt(document.getElementById('hydrogenFuel').value),
        quantumFuel: parseInt(document.getElementById('quantumFuel').value),
        notes: document.getElementById('shipNotes').value,
        components: {}
    };

    // Collect components by type
    Object.entries(componentTypes).forEach(([type, config]) => {
        const components = [];
        document.querySelectorAll(`#${config.listId} .component-item`).forEach(item => {
            const inputs = item.querySelectorAll('input');
            const selects = item.querySelectorAll('select');
            if (inputs[0].value) { // Only add if name is provided
                components.push({
                    name: inputs[0].value,
                    size: selects[0].value,
                    grade: selects[1].value,
                    info: inputs[1].value
                });
            }
        });
        if (components.length > 0) {
            shipData.components[type] = components;
        }
    });

    // Add or update ship
    const editMode = document.getElementById('shipModalTitle').textContent === 'Edit Ship';
    if (editMode) {
        const index = fleetData.findIndex(ship => ship.name === shipData.name);
        if (index !== -1) {
            fleetData[index] = shipData;
        }
    } else {
        fleetData.push(shipData);
    }

    // Save and update
    localStorage.setItem('fleetData', JSON.stringify(fleetData));
    renderFleet();
    shipModal.hide();
}

// Render components in ship card
function renderComponents(components) {
    if (!components || Object.keys(components).length === 0) return '';
    
    return `
        <div class="mb-3">
            <h6>Components</h6>
            ${Object.entries(components).map(([type, items]) => `
                <div class="mb-2">
                    <small class="text-muted">${componentTypes[type].label}</small>
                    <ul class="component-list">
                        ${items.map(item => `
                            <li class="component-item">
                                <div class="d-flex justify-content-between">
                                    <span>${item.name} (${item.size}, Grade ${item.grade})</span>
                                    ${item.info ? `<small class="text-muted">${item.info}</small>` : ''}
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    `;
}

// Clear all component lists
function clearAllComponents() {
    Object.values(componentTypes).forEach(type => {
        document.getElementById(type.listId).innerHTML = '';
    });
}

// Delete ship
function deleteShip(index) {
    if (confirm('Are you sure you want to delete this ship?')) {
        fleetData.splice(index, 1);
        localStorage.setItem('fleetData', JSON.stringify(fleetData));
        renderFleet();
    }
}

// Render fleet cards
function renderFleet() {
    const container = document.getElementById('fleetContainer');
    container.innerHTML = '';

    fleetData.forEach((ship, index) => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        card.innerHTML = `
            <div class="card ship-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h4 class="mb-0">${ship.name}</h4>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="showEditShipModal(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteShip(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>Model:</strong> ${ship.model}</p>
                    <div class="row mb-3">
                        <div class="col-4">
                            <small class="d-block text-muted">Cargo</small>
                            ${ship.cargoCapacity} SCU
                        </div>
                        <div class="col-4">
                            <small class="d-block text-muted">H₂ Fuel</small>
                            ${ship.hydrogenFuel || 'N/A'} L
                        </div>
                        <div class="col-4">
                            <small class="d-block text-muted">Q Fuel</small>
                            ${ship.quantumFuel || 'N/A'} L
                        </div>
                    </div>
                    ${renderComponents(ship.components)}
                    ${ship.notes ? `
                        <div class="mt-3">
                            <h6>Notes</h6>
                            <p class="mb-0">${ship.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Show empty state if no ships
    if (fleetData.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="card">
                    <div class="card-body">
                        <h4>No Ships in Fleet</h4>
                        <p>Click the "Add New Ship" button to get started!</p>
                    </div>
                </div>
            </div>
        `;
    }
}

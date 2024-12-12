// Fleet data structure
let fleetData = [];
let componentDatabase = JSON.parse(localStorage.getItem('componentDatabase')) || {
    powerPlant: [],
    shield: [],
    quantumDrive: [],
    weapon: [],
    cooler: []
};

// Component types configuration
const componentTypes = {
    powerPlant: { 
        label: 'Power Plant', 
        listId: 'powerPlantList',
        infoLabel: 'Power Output',
        infoPlaceholder: 'e.g., 2500 kW',
        maxSize: 4,
        hasGrade: true
    },
    shield: { 
        label: 'Shield Generator', 
        listId: 'shieldList',
        infoLabel: 'Shield HP',
        infoPlaceholder: 'e.g., 7500 HP',
        maxSize: 4,
        hasGrade: true
    },
    quantumDrive: { 
        label: 'Quantum Drive', 
        listId: 'quantumDriveList',
        infoLabel: 'Speed/Consumption',
        infoPlaceholder: 'e.g., 283,000 km/s, 583 l/Mm',
        maxSize: 4,
        hasGrade: true
    },
    weapon: { 
        label: 'Weapon', 
        listId: 'weaponList',
        infoLabel: 'Damage/RoF',
        infoPlaceholder: 'e.g., 220 dmg, 750 rpm',
        maxSize: 10,
        hasGrade: false
    },
    cooler: { 
        label: 'Cooler', 
        listId: 'coolerList',
        infoLabel: 'Cooling Rate',
        infoPlaceholder: 'e.g., 235 kW/s',
        maxSize: 4,
        hasGrade: true
    }
};

// Generate size options based on component type
function getSizeOptions(type) {
    const maxSize = componentTypes[type].maxSize;
    return Array.from({length: maxSize + 1}, (_, i) => `S${i}`);
}

const gradeOptions = ['A', 'B', 'C', 'D'];

// Initialize data and UI
let shipModal;

document.addEventListener('DOMContentLoaded', function() {
    // Load saved data
    const savedFleet = localStorage.getItem('fleetData');
    if (savedFleet) {
        try {
            fleetData = JSON.parse(savedFleet);
            console.log('Loaded fleet data:', fleetData);
        } catch (error) {
            console.error('Error loading fleet data:', error);
            fleetData = [];
        }
    }

    // Initialize Bootstrap modal
    shipModal = new bootstrap.Modal(document.getElementById('shipModal'));
    
    // Setup components
    setupComponentAutocomplete();
    
    // Add form submit handler
    document.getElementById('shipForm').addEventListener('submit', function(event) {
        event.preventDefault();
        saveShip(event);
    });

    // Render initial fleet
    renderFleet();
});

// Setup component name autocomplete
function setupComponentAutocomplete() {
    Object.keys(componentTypes).forEach(type => {
        // Create datalist if it doesn't exist
        if (!document.getElementById(`${type}List`)) {
            const datalist = document.createElement('datalist');
            datalist.id = `${type}List`;
            document.body.appendChild(datalist);
        }
        updateComponentDatalist(type);
    });
}

// Update component datalist
function updateComponentDatalist(type) {
    const datalist = document.getElementById(`${type}List`);
    if (!datalist) return;
    
    const options = componentDatabase[type]
        .map(comp => `<option value="${comp.name}" data-size="${comp.size}" data-grade="${comp.grade || ''}" data-info="${comp.info || ''}">`);
    datalist.innerHTML = options.join('');
}

// Add component to database
function addToComponentDatabase(type, component) {
    const existing = componentDatabase[type].find(c => c.name === component.name);
    if (!existing) {
        componentDatabase[type].push(component);
        localStorage.setItem('componentDatabase', JSON.stringify(componentDatabase));
        updateComponentDatalist(type);
    }
}

// Show modal for adding new ship
function showAddShipModal() {
    document.getElementById('shipModalTitle').textContent = 'Add New Ship';
    document.getElementById('shipIndex').value = ''; // Clear index
    document.getElementById('shipForm').reset();
    clearAllComponents();
    shipModal.show();
}

// Show modal for editing existing ship
function showEditShipModal(index) {
    const ship = fleetData[index];
    document.getElementById('shipModalTitle').textContent = 'Edit Ship';
    document.getElementById('shipIndex').value = index; // Store index for saving
    
    // Fill form with ship data
    document.getElementById('shipName').value = ship.name || '';
    document.getElementById('shipModel').value = ship.model || '';
    document.getElementById('cargoCapacity').value = ship.cargoCapacity || '';
    document.getElementById('hydrogenFuel').value = ship.hydrogenFuel || '';
    document.getElementById('quantumFuel').value = ship.quantumFuel || '';
    document.getElementById('shipNotes').value = ship.notes || '';

    // Clear existing components
    clearAllComponents();

    // Add existing components
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

// Component input change handler
function handleComponentInput(input, type) {
    const selectedValue = input.value;
    console.log('Selected value:', selectedValue);
    
    const component = componentDatabase[type].find(c => c.name === selectedValue);
    console.log('Found component in database:', component);
    
    if (!component) return;
    
    const componentItem = input.closest('.component-item');
    if (!componentItem) {
        console.error('Could not find component item container');
        return;
    }

    // Get all the fields
    const sizeSelect = componentItem.querySelector('select:first-of-type');
    const gradeSelect = componentTypes[type].hasGrade ? 
        componentItem.querySelector('select:nth-of-type(2)') : null;
    const infoInput = componentItem.querySelector('input[placeholder*="e.g."]');

    console.log('Found fields:', { sizeSelect, gradeSelect, infoInput });
    console.log('Component values:', component);

    // Update the fields
    if (sizeSelect && component.size) {
        sizeSelect.value = component.size;
        console.log('Set size to:', component.size);
    }

    if (gradeSelect && component.grade) {
        gradeSelect.value = component.grade;
        console.log('Set grade to:', component.grade);
    }

    if (infoInput && component.info) {
        infoInput.value = component.info;
        console.log('Set info to:', component.info);
    }
}

// Add component input fields
function addComponent(type, component = null) {
    const listId = componentTypes[type].listId;
    const componentList = document.getElementById(listId);
    const componentDiv = document.createElement('div');
    componentDiv.className = 'component-item mb-2 p-2 border border-secondary rounded bg-dark text-light';
    
    const sizeOptionsHTML = createDropdownHTML(getSizeOptions(type), component?.size);
    const gradeOptionsHTML = componentTypes[type].hasGrade ? 
        `<div class="col-md-2">
            <select class="form-select form-select-sm bg-dark text-light">
                ${createDropdownHTML(gradeOptions, component?.grade)}
            </select>
        </div>` : '';
    
    componentDiv.innerHTML = `
        <div class="row align-items-center g-2">
            <div class="col-md-3">
                <input type="text" 
                    class="form-control form-control-sm bg-dark text-light component-name" 
                    placeholder="Name" 
                    value="${component?.name || ''}" 
                    list="${type}List" 
                    autocomplete="off"
                    required>
            </div>
            <div class="col-md-2">
                <select class="form-select form-select-sm bg-dark text-light">
                    ${sizeOptionsHTML}
                </select>
            </div>
            ${gradeOptionsHTML}
            <div class="col-md-${componentTypes[type].hasGrade ? '3' : '5'}">
                <input type="text" class="form-control form-control-sm bg-dark text-light" 
                    placeholder="${componentTypes[type].infoPlaceholder}"
                    value="${component?.info || ''}">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-outline-info w-100" onclick="togglePlannedUpgrade(this)">
                    Plan Upgrade
                </button>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm" 
                    onclick="this.closest('.component-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="planned-upgrade mt-2" style="display: none;">
            <div class="row g-2">
                <div class="col-md-4">
                    <input type="text" class="form-control form-control-sm bg-dark text-light" 
                        placeholder="Planned Component" list="${type}List">
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control form-control-sm bg-dark text-light" 
                        placeholder="Location">
                </div>
                <div class="col-md-4">
                    <input type="number" class="form-control form-control-sm bg-dark text-light" 
                        placeholder="Price in aUEC">
                </div>
            </div>
        </div>
    `;
    componentList.appendChild(componentDiv);

    // Add event listeners after adding to DOM
    const nameInput = componentDiv.querySelector('.component-name');
    
    // Handle both input and change events
    ['input', 'change'].forEach(eventType => {
        nameInput.addEventListener(eventType, (e) => {
            console.log(`${eventType} event triggered`);
            handleComponentInput(e.target, type);
        });
    });

    // If we're loading an existing component with planned upgrade, show it
    if (component?.planned) {
        const plannedSection = componentDiv.querySelector('.planned-upgrade');
        const plannedInputs = plannedSection.querySelectorAll('input');
        plannedInputs[0].value = component.planned.name;
        plannedInputs[1].value = component.planned.location;
        plannedInputs[2].value = component.planned.price;
        plannedSection.style.display = 'block';
        componentDiv.querySelector('.btn-outline-info').textContent = 'Hide Plan';
    }
}

// Toggle planned upgrade section
function togglePlannedUpgrade(button) {
    const plannedSection = button.closest('.component-item').querySelector('.planned-upgrade');
    const isHidden = plannedSection.style.display === 'none';
    plannedSection.style.display = isHidden ? 'block' : 'none';
    button.textContent = isHidden ? 'Hide Plan' : 'Plan Upgrade';
    button.classList.toggle('btn-outline-info', !isHidden);
    button.classList.toggle('btn-info', isHidden);
}

// Save ship data
function saveShip(event) {
    if (event) {
        event.preventDefault();
    }
    
    console.log('Saving ship data...');
    
    const shipData = {
        name: document.getElementById('shipName').value,
        model: document.getElementById('shipModel').value,
        cargoCapacity: document.getElementById('cargoCapacity').value ? 
            parseInt(document.getElementById('cargoCapacity').value) : 0,
        hydrogenFuel: document.getElementById('hydrogenFuel').value ? 
            parseInt(document.getElementById('hydrogenFuel').value) : 0,
        quantumFuel: document.getElementById('quantumFuel').value ? 
            parseInt(document.getElementById('quantumFuel').value) : 0,
        notes: document.getElementById('shipNotes').value,
        components: {}
    };

    if (!shipData.name || !shipData.model) {
        alert('Ship name and model are required!');
        return;
    }

    console.log('Collected ship data:', shipData);

    // Collect components by type
    Object.entries(componentTypes).forEach(([type, config]) => {
        const components = [];
        document.querySelectorAll(`#${config.listId} .component-item`).forEach(item => {
            const inputs = item.querySelectorAll('input');
            const selects = item.querySelectorAll('select');
            const plannedSection = item.querySelector('.planned-upgrade');
            const plannedInputs = plannedSection.querySelectorAll('input');

            if (inputs[0].value) {
                const component = {
                    name: inputs[0].value,
                    size: selects[0].value,
                    info: inputs[1].value
                };

                if (config.hasGrade) {
                    component.grade = selects[1].value;
                }

                if (plannedInputs[0].value) {
                    component.planned = {
                        name: plannedInputs[0].value,
                        location: plannedInputs[1].value,
                        price: plannedInputs[2].value
                    };
                }

                components.push(component);
                
                // Add to component database without planned upgrade info
                const dbComponent = {
                    name: component.name,
                    size: component.size,
                    grade: component.grade,
                    info: component.info
                };
                addToComponentDatabase(type, dbComponent);
            }
        });
        if (components.length > 0) {
            shipData.components[type] = components;
        }
    });

    try {
        // Get the index if we're editing
        const index = document.getElementById('shipIndex').value;
        const isEditing = index !== '';

        console.log('Saving mode:', isEditing ? 'Edit' : 'Add', 'Index:', index);

        if (isEditing) {
            // Update existing ship
            fleetData[parseInt(index)] = shipData;
        } else {
            // Add new ship
            fleetData.push(shipData);
        }

        // Save to localStorage
        localStorage.setItem('fleetData', JSON.stringify(fleetData));
        console.log('Saved fleet data:', fleetData);

        // Update display and close modal
        renderFleet();
        shipModal.hide();
    } catch (error) {
        console.error('Error saving ship:', error);
        alert('There was an error saving the ship. Please try again.');
    }
}

// Render components in ship card
function renderComponents(components) {
    if (!components || Object.keys(components).length === 0) return '';
    
    return `
        <div class="mb-3">
            <h6 class="text-light">Components</h6>
            ${Object.entries(components).map(([type, items]) => `
                <div class="mb-2">
                    <small class="text-muted">${componentTypes[type].label}</small>
                    <ul class="component-list list-unstyled">
                        ${items.map(item => `
                            <li class="component-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-light">
                                        ${item.name} (${item.size}${item.grade ? `, Grade ${item.grade}` : ''})
                                        ${item.info ? `<small class="text-muted ms-2">${item.info}</small>` : ''}
                                    </span>
                                    ${item.planned ? `
                                        <span class="text-info">
                                            <small>
                                                Planned: ${item.planned.name} 
                                                @ ${item.planned.location}
                                                (${item.planned.price} aUEC)
                                            </small>
                                        </span>
                                    ` : ''}
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

// Render fleet display
function renderFleet() {
    const fleetContainer = document.getElementById('fleetContainer');
    fleetContainer.innerHTML = ''; // Clear existing content

    console.log('Rendering fleet:', fleetData);

    if (!fleetData || fleetData.length === 0) {
        fleetContainer.innerHTML = '<div class="text-center text-light p-4">No ships in your fleet yet. Click "Add Ship" to get started!</div>';
        return;
    }

    fleetData.forEach((ship, index) => {
        const shipCard = document.createElement('div');
        shipCard.className = 'col-md-4 mb-4'; // Adjusted to col-md-4 for narrower cards
        
        const cardContent = `
            <div class="card bg-dark text-light border-secondary h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${ship.name}</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-info me-2" onclick="showEditShipModal(${index})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteShip(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-sm-6">
                            <strong>Model:</strong> ${ship.model}
                        </div>
                        <div class="col-sm-6">
                            <strong>Cargo:</strong> ${ship.cargoCapacity} SCU
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-sm-6">
                            <strong>Hydrogen:</strong> ${ship.hydrogenFuel} µSCU
                        </div>
                        <div class="col-sm-6">
                            <strong>Quantum:</strong> ${ship.quantumFuel} µSCU
                        </div>
                    </div>
                    ${ship.notes ? `<div class="mb-3"><strong>Notes:</strong> ${ship.notes}</div>` : ''}
                    ${renderComponents(ship.components)}
                </div>
            </div>
        `;
        
        shipCard.innerHTML = cardContent;
        fleetContainer.appendChild(shipCard);
    });
}

// Delete ship
function deleteShip(index) {
    if (confirm('Are you sure you want to delete this ship?')) {
        console.log('Deleting ship at index:', index);
        fleetData.splice(index, 1);
        localStorage.setItem('fleetData', JSON.stringify(fleetData));
        renderFleet();
    }
}

// JSON Management Functions
function saveToJson() {
    const data = {
        fleetData: fleetData,
        componentDatabase: componentDatabase
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `fleet-data-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadFromJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.fleetData && Array.isArray(data.fleetData)) {
                    fleetData = data.fleetData;
                    localStorage.setItem('fleetData', JSON.stringify(fleetData));
                }
                
                if (data.componentDatabase) {
                    componentDatabase = data.componentDatabase;
                    localStorage.setItem('componentDatabase', JSON.stringify(componentDatabase));
                    setupComponentAutocomplete();
                }
                
                renderFleet();
                alert('Data loaded successfully!');
            } catch (error) {
                console.error('Error loading data:', error);
                alert('Error loading data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function combineJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Combine fleet data
                if (importedData.fleetData && Array.isArray(importedData.fleetData)) {
                    // Create a map of existing ships by name for quick lookup
                    const existingShips = new Map(fleetData.map(ship => [ship.name, ship]));
                    
                    importedData.fleetData.forEach(importedShip => {
                        if (!existingShips.has(importedShip.name)) {
                            fleetData.push(importedShip);
                        }
                    });
                    
                    localStorage.setItem('fleetData', JSON.stringify(fleetData));
                }
                
                // Combine component database
                if (importedData.componentDatabase) {
                    Object.keys(componentDatabase).forEach(type => {
                        if (importedData.componentDatabase[type]) {
                            // Create a map of existing components by name
                            const existingComponents = new Map(
                                componentDatabase[type].map(comp => [comp.name, comp])
                            );
                            
                            // Add new components
                            importedData.componentDatabase[type].forEach(importedComp => {
                                if (!existingComponents.has(importedComp.name)) {
                                    componentDatabase[type].push(importedComp);
                                }
                            });
                        }
                    });
                    
                    localStorage.setItem('componentDatabase', JSON.stringify(componentDatabase));
                    setupComponentAutocomplete();
                }
                
                renderFleet();
                alert('Data combined successfully!');
            } catch (error) {
                console.error('Error combining data:', error);
                alert('Error combining data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

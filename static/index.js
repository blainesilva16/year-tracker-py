document.addEventListener('DOMContentLoaded', () => {
    const infoIcon = document.getElementById('info-icon');

    infoIcon.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent event bubbling to document

      // Toggle the tooltip
      infoIcon.classList.toggle('active');
    });

    // Optional: hide the tooltip when clicking anywhere else
    document.addEventListener('click', () => {
      infoIcon.classList.remove('active');
    });
    const monthNamesShort = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const daysInMonthStandard = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let currentActiveTrackId = null; // To keep track of the currently selected track
    let currentActiveYearId = null; // To keep track of the current year

    // Helper to check for leap year
    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    // Function to generate the year calendar grid
    function generateYearGrid(containerId, yearId, trackId, dayData = {}) {
        const calendarContainer = document.getElementById(containerId);
        if (!calendarContainer) {
            console.error(`Calendar container with ID '${containerId}' not found.`);
            return;
        }

        calendarContainer.innerHTML = ''; // Clear existing content

        let daysInMonth = [...daysInMonthStandard];
        if (isLeapYear(yearId)) { // Assuming yearId is the actual year number (e.g., 2025)
            daysInMonth[1] = 29; // February
        }

        // Add an empty cell for the top-left corner
        const emptyCorner = document.createElement('div');
        emptyCorner.classList.add('empty-corner');
        calendarContainer.appendChild(emptyCorner);

        // Add day number labels (01, 02, ..., 31)
        for (let i = 1; i <= 31; i++) {
            const dayNumLabel = document.createElement('div');
            dayNumLabel.classList.add('day-number-label');
            dayNumLabel.textContent = i.toString().padStart(2, '0');
            calendarContainer.appendChild(dayNumLabel);
        }

        // Add month labels and day cells
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            // Add month label (J, F, M, ...)
            const monthLabel = document.createElement('div');
            monthLabel.classList.add('month-label');
            monthLabel.textContent = monthNamesShort[monthIndex];
            calendarContainer.appendChild(monthLabel);

            // Add day cells for the current month
            const currentMonthDays = daysInMonth[monthIndex];
            for (let day = 1; day <= currentMonthDays; day++) {
                const yearDay = document.createElement('div');
                yearDay.classList.add('year-day');
                yearDay.dataset.month = monthIndex + 1; // 1-indexed month
                yearDay.dataset.day = day;
                yearDay.dataset.yearId = yearId;
                yearDay.dataset.trackId = trackId;

                // Apply saved color if available
                const dataKey = `${monthIndex + 1}-${day}`;
                const savedColorId = dayData[dataKey];
                if (savedColorId !== undefined && savedColorId !== null) {
                    // We'll get the hex code from a global map later
                    yearDay.dataset.colorId = savedColorId;
                }
                calendarContainer.appendChild(yearDay);
            }

            // Add placeholder cells for days beyond the current month's length
            for (let i = currentMonthDays; i < 31; i++) {
                const placeholderDay = document.createElement('div');
                placeholderDay.classList.add('year-day', 'placeholder');
                // placeholderDay.style.visibility = 'hidden'; // CSS handles this now
                calendarContainer.appendChild(placeholderDay);
            }
        }
    }
    function generateYearGridVertical(containerId, yearId, trackId, dayData = {}) {
        const calendarContainer = document.getElementById(containerId);
        if (!calendarContainer) {
            console.error(`Calendar container with ID '${containerId}' not found.`);
            return;
        }

        calendarContainer.innerHTML = ''; // Clear existing content

        let daysInMonth = [...daysInMonthStandard];
        if (isLeapYear(yearId)) { // Assuming yearId is the actual year number (e.g., 2025)
            daysInMonth[1] = 29; // February
        }

        // Add an empty cell for the top-left corner
        const emptyCorner = document.createElement('div');
        emptyCorner.classList.add('empty-corner');
        calendarContainer.appendChild(emptyCorner);

        // Add month labels
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const monthLabel = document.createElement('div');
            monthLabel.classList.add('month-label');
            monthLabel.textContent = monthNamesShort[monthIndex];
            calendarContainer.appendChild(monthLabel);
        }

        // Add day numbers and cells
        for (let day = 1; day <= 31; day++) {
            // Day number label
            const dayNumLabel = document.createElement('div');
            dayNumLabel.classList.add('day-number-label');
            dayNumLabel.textContent = day.toString().padStart(2, '0');
            calendarContainer.appendChild(dayNumLabel);

            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                const cell = document.createElement('div');
                cell.classList.add('year-day');
                const currentMonthDays = daysInMonth[monthIndex];
                if (day > currentMonthDays) {
                    cell.classList.add('placeholder');
                } else {
                    const dataKey = `${monthIndex + 1}-${day}`;
                    const savedColorId = dayData[dataKey];
                    if (savedColorId !== undefined && savedColorId !== null) {
                        cell.dataset.colorId = savedColorId;
                    }
                }
                cell.dataset.month = monthIndex + 1;
                cell.dataset.day = day;
                cell.dataset.yearId = yearId;
                cell.dataset.trackId = trackId;
                calendarContainer.appendChild(cell);
            }
        }
    }

    // Function to render the color codes section
    function renderColorCodes(containerId, colors, selectedColorId = null) {
        const colorCodesContainer = document.getElementById(containerId);
        if (!colorCodesContainer) return;

        // Clear existing color codes (excluding the h5 title)
        const existingColorElements = colorCodesContainer.querySelectorAll('.color-code');
        existingColorElements.forEach(el => el.remove());

        colors.forEach(color => {
            const colorCodeDiv = document.createElement('div');
            colorCodeDiv.classList.add('color-code');
            colorCodeDiv.dataset.colorId = color.id;
            colorCodeDiv.dataset.colorHex = color.hex_code; // Store hex for easy access
            colorCodeDiv.dataset.colorName = color.name;

            if (selectedColorId === color.id) {
                colorCodeDiv.classList.add('selected'); // Highlight selected color
            }

            colorCodeDiv.innerHTML = `
                <div class="color-info align-items-center">
                    <div class="color" style="background-color: ${color.hex_code};"></div>
                    <p style="margin:0">${color.name}</p>
                </div>
                <div class="color-options align-items-center">
                    <i class="fa fa-pencil edit-color-btn" data-color-id="${color.id}"
                    data-bs-toggle="modal" data-bs-target="#modalColorCodeActions"></i>
                    <i class="fa fa-trash delete-color-btn" data-color-id="${color.id}"
                    data-bs-toggle="modal" data-bs-target="#modalDeleteConfirmation"
                    ></i>
                </div>
            `;
            colorCodesContainer.appendChild(colorCodeDiv);
        });
    }

    // Function to render the color codes section for horizontal layout
    function renderColorCodesHorizontal(containerId, colors, selectedColorId = null) {
        const colorCodesContainer = document.getElementById(containerId);
        if (!colorCodesContainer) return;
        // Clear existing color codes (excluding the h5 title)
        const existingColorElements = colorCodesContainer.querySelectorAll('.color-code-horizontal');
        existingColorElements.forEach(el => el.remove());
        colors.forEach(color => {          
            const colorCodeDiv = document.createElement('div');
            colorCodeDiv.classList.add('color-code-horizontal');
            colorCodeDiv.dataset.colorId = color.id;
            colorCodeDiv.dataset.colorHex = color.hex_code; // Store hex for easy access
            colorCodeDiv.dataset.colorName = color.name;
            if (selectedColorId === color.id) {
                colorCodeDiv.classList.add('selected'); // Highlight selected color
            }
            colorCodeDiv.innerHTML = `
                <div class="color-info d-flex flex-column align-items-center">
                    <div class="color" style="background-color: ${color.hex_code};"></div>
                    <a href="#" class="color-code-name-horizontal" style="text-decoration:none;color:black" data-bs-toggle="modal" 
                    data-bs-target="#modalColorCodeActions"
                        data-color-id=${color.id}>${color.name}</a>
                </div>
            `;
            colorCodesContainer.appendChild(colorCodeDiv);
        });
    }

    // Function to fetch and display track data (calendar and colors)
    async function loadTrackData(yearId, trackId) {
        try {
            const response = await fetch(`/get_track_data/${yearId}/${trackId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Store colors globally for easy lookup
            window.currentTrackColors = {};
            data.colors.forEach(color => {
                window.currentTrackColors[color.id] = color.hex_code;
            });

            // Generate calendar grid
            const calendarContainerId = `year-calendar-${trackId}`;
            generateYearGrid(calendarContainerId, yearId, trackId, data.day_data);
            const calendarContainerVerticalId = `year-calendar-vertical-${trackId}`;
            generateYearGridVertical(calendarContainerVerticalId, yearId, trackId, data.day_data);

            // Apply saved colors to year-day cells
            const yearDayCells = document.querySelectorAll(`#${calendarContainerId} .year-day`);
            yearDayCells.forEach(cell => {
                const colorId = cell.dataset.colorId;
                if (colorId && window.currentTrackColors[colorId]) {
                    cell.style.backgroundColor = window.currentTrackColors[colorId];
                } else {
                    // Reset to default if no color or color not found
                    cell.style.backgroundColor = ''; // Revert to CSS default
                    delete cell.dataset.colorId; // Remove the data attribute
                }
            });
            const yearDayCellsVertical = document.querySelectorAll(`#${calendarContainerVerticalId} .year-day`);
            yearDayCellsVertical.forEach(cell => {
                const colorId = cell.dataset.colorId;
                if (colorId && window.currentTrackColors[colorId]) {
                    cell.style.backgroundColor = window.currentTrackColors[colorId];
                } else {
                    // Reset to default if no color or color not found
                    cell.style.backgroundColor = ''; // Revert to CSS default
                    delete cell.dataset.colorId; // Remove the data attribute
                }
            });

            // Render color codes list
            const colorCodesContainerId = `color-codes-${trackId}`;
            renderColorCodes(colorCodesContainerId, data.colors);
            const colorCodesContainerHorizontalId = `color-codes-horizontal-${trackId}`;
            renderColorCodesHorizontal(colorCodesContainerHorizontalId, data.colors);

            // Set current active track and year
            currentActiveTrackId = trackId;
            currentActiveYearId = yearId;

            // Highlight the first color in the color codes as default selected for new clicks
            const firstColorCode = document.querySelector(`#${colorCodesContainerId} .color-code`);
            if (firstColorCode) {
                firstColorCode.classList.add('selected');
                window.selectedColorForClicks = {
                    id: parseInt(firstColorCode.dataset.colorId),
                    hex: firstColorCode.dataset.colorHex
                };
            } else {
                 window.selectedColorForClicks = null; // No colors defined for this track
            }

        } catch (error) {
            console.error("Error loading track data:", error);
            // Optionally display an error message to the user
        }
    }

    // --- Event Listeners ---
    function handleTabClick() {
        // Tab switching
        const tabLinks = document.querySelectorAll('.tab-links li');
        const tabContents = document.querySelectorAll('.tab-content .tab');
        const selectLinks = document.getElementById('tab-select');

        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetTabId = this.querySelector('a').getAttribute('href').substring(1); // e.g., 'tab1'
                const targetTabElement = document.getElementById(targetTabId);

                if (!targetTabElement) {
                    console.warn(`Attempted to activate non-existent tab: ${targetTabId}`);
                    return;
                }

                // Remove 'active' from all tabs and links
                tabLinks.forEach(l => {
                    l.classList.remove('active');
                    // Remove 'active' from the div with class 'track-options' inside the li element
                    const trackOptionsDiv = l.querySelector('.track-options');
                    if (trackOptionsDiv) {
                        trackOptionsDiv.classList.remove('active');
                    }
                });
                tabContents.forEach(c => c.classList.remove('active'));

                

                // Add 'active' to the clicked tab link and its content
                this.classList.add('active');
                targetTabElement.classList.add('active');

                // Add 'active' to the div with class 'track-options' inside the li element
                const trackOptionsDiv = this.querySelector('.track-options');
                if (trackOptionsDiv) {
                    trackOptionsDiv.classList.add('active');
                } else {
                    console.warn(`No track options found for tab: ${targetTabId}`);
                }

                // Load data for the newly active tab
                const yearId = parseInt(targetTabElement.querySelector('.year-calendar').dataset.yearId);
                const trackId = parseInt(targetTabElement.querySelector('.year-calendar').dataset.trackId);
                loadTrackData(yearId, trackId);
                // Update the select element to match the active tab
                selectLinks.value = targetTabId.replace('tab', ''); // e.g., '1' for 'tab1'
            });
        });
        selectLinks.addEventListener('change', function(e) {
            console.log('Select link clicked:', this.value);
            document.getElementById('toTab'+this.value).click(); // Update the select element
            // e.preventDefault();
            // const targetTabId = this.value; // e.g., 'tab1'
            // const targetTabElement = document.getElementById("#tab"+targetTabId);
            // if (!targetTabElement) {
            //     console.warn(`Attempted to activate non-existent tab: ${targetTabId}`);
            //     return;
            // }
            // // Remove 'active' from all tabs and links
            // tabLinks.forEach(l => l.classList.remove('active'));
            // tabContents.forEach(c => c.classList.remove('active'));
            // // Add 'active' to the clicked tab link and its content
            // const activeLink = document.querySelector(`.tab-links li a[href="#${targetTabId}"]`);
            // if (activeLink) {
            //     activeLink.parentElement.classList.add('active');
            //     targetTabElement.classList.add('active');
            //     // Load data for the newly active tab
            //     const yearId = parseInt(targetTabElement.querySelector('.year-calendar').dataset.yearId);
            //     const trackId = parseInt(targetTabElement.querySelector('.year-calendar').dataset.trackId);
            //     loadTrackData(yearId, trackId);
            // } else {
            //     console.warn(`No active link found for tab: ${targetTabId}`);
            // }
            
        });
    }
    
    handleTabClick();

    // Initial load: activate the first tab and load its data
    const initialActiveTabLink = document.querySelector('.tab-links li.active');
    if (initialActiveTabLink) {
        const initialYearId = parseInt(initialActiveTabLink.closest('.tabs').querySelector('.tab.active .year-calendar').dataset.yearId);
        const initialTrackId = parseInt(initialActiveTabLink.closest('.tabs').querySelector('.tab.active .year-calendar').dataset.trackId);
        loadTrackData(initialYearId, initialTrackId);
    } else {
        // Fallback if no initial active tab, activate the first one
        const firstTabLink = document.querySelector('.tab-links li:first-child:not(#newTab)');
        if(firstTabLink) {
            firstTabLink.click(); // Programmatically click it to trigger loading
        }
    }


    // Delegate click events for year-day squares (event delegation)
    // Listen on the main container which is always present
    document.querySelector('.tab-content').addEventListener('click', function(e) {
        const yearDayCell = e.target.closest('.year-day:not(.placeholder)'); // Ensure it's a non-placeholder day cell
        if (yearDayCell && currentActiveTrackId && currentActiveYearId) {
            const month = parseInt(yearDayCell.dataset.month);
            const day = parseInt(yearDayCell.dataset.day);
            const yearId = parseInt(yearDayCell.dataset.yearId);
            const trackId = parseInt(yearDayCell.dataset.trackId);

            let newColorId = null; // Default to clearing color
            let newColorHex = '';

            if (window.selectedColorForClicks) {
                // If a color is selected for clicks, use it
                if (parseInt(yearDayCell.dataset.colorId) === window.selectedColorForClicks.id) {
                    // If clicked day already has this color, clear it
                    newColorId = null;
                    newColorHex = '';
                } else {
                    // Apply the new color
                    newColorId = window.selectedColorForClicks.id;
                    newColorHex = window.selectedColorForClicks.hex;
                }
            } else {
                // If no color selected for clicks, simply clear the color on click
                newColorId = null;
                newColorHex = '';
            }

            // Update the backend
            fetch('/update_day_color', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    yearId: yearId,
                    trackId: trackId,
                    month: month,
                    day: day,
                    colorId: newColorId
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update frontend immediately
                    if (newColorId === null) {
                        yearDayCell.style.backgroundColor = ''; // Revert to CSS default
                        delete yearDayCell.dataset.colorId;
                    } else {
                        yearDayCell.style.backgroundColor = newColorHex;
                        yearDayCell.dataset.colorId = newColorId;
                    }
                    loadTrackData(yearId, trackId);
                } else {
                    console.error("Failed to update day color:", data.error);
                    alert("Error updating day color: " + data.error);
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });

    // Delegate click events for color codes to select them
    document.querySelector('.tab-content').addEventListener('click', function(e) {
        const colorCodeDiv = e.target.closest('.color-code');
        if (colorCodeDiv && !e.target.closest('.color-options')) { // Ensure it's the color-code itself, not edit/delete icons
            const currentTrackColorCodes = document.querySelectorAll(`#color-codes-${currentActiveTrackId} .color-code`);
            currentTrackColorCodes.forEach(div => div.classList.remove('selected'));

            colorCodeDiv.classList.add('selected');
            window.selectedColorForClicks = {
                id: parseInt(colorCodeDiv.dataset.colorId),
                hex: colorCodeDiv.dataset.colorHex
            };
        }
    });


    // Add New Color functionality (using event delegation for the button)
    document.querySelector('.tab-content').addEventListener('click', function(e) {
        if (e.target.classList.contains('add-color-btn')) {
            const trackId = parseInt(e.target.dataset.trackId);
            const newColorNameInput = document.getElementById(`new-color-name-${trackId}`);
            const newColorPicker = document.getElementById(`new-color-picker-${trackId}`);

            const colorName = newColorNameInput.value.trim();
            const hexCode = newColorPicker.value;

            if (!colorName) {
                alert("Please enter a color name.");
                return;
            }

            fetch('/add_color', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trackId: trackId,
                    colorName: colorName,
                    hexCode: hexCode
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Color added successfully!");
                    newColorNameInput.value = ''; // Clear input
                    newColorPicker.value = '#89eecc'; // Reset color picker

                    // Reload current track data to update the color codes list
                    if (currentActiveYearId && currentActiveTrackId) {
                        loadTrackData(currentActiveYearId, currentActiveTrackId);
                    }
                } else {
                    console.error("Failed to add color:", data.error);
                    alert("Error adding color: " + data.error);
                }
            })
            .catch(error => console.error('Error adding color:', error));
        }
    });
    // JavaScript to set the track ID for adding color in small screen
    const addColorLinks = document.querySelectorAll('.add-color-btn-horizontal-link');
    const colorCodeModal = document.getElementById('modalColorCode');
    if (colorCodeModal) {
        addColorLinks.forEach(link => {
            link.addEventListener('click', () => {
                const trackId = link.dataset.trackId;
                console.log('Track ID for modal:', trackId);
                colorCodeModal.querySelector('#track_id').value = trackId;
            });
        });
    }

    // Add Color Button in Modal
    // This is for the modal that appears when adding a new color
    const addColorButtonModal = document.getElementById('add-color-btn-modal');
    if (addColorButtonModal) {
        addColorButtonModal.addEventListener('click', async () => {
            const trackId = parseInt(document.getElementById('track_id').value);
            const newColorNameInput = document.getElementById(`new-code-modal`).value.trim();
            const newColorPicker = document.getElementById(`new-color-modal`).value;
            fetch('/add_color', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trackId: trackId,
                    colorName: newColorNameInput,
                    hexCode: newColorPicker
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Color added successfully!");
                    document.getElementById(`new-code-modal`).value = ''; // Clear input
                    document.getElementById(`new-color-modal`).value = '#89eecc'; // Reset color picker

                    // Reload current track data to update the color codes list
                    if (currentActiveYearId && currentActiveTrackId) {
                        loadTrackData(currentActiveYearId, currentActiveTrackId);
                    }
                } else {
                    console.error("Failed to add color:", data.error);
                    alert("Error adding color: " + data.error);
                }
            })
            .catch(error => console.error('Error adding color:', error));
        });
    }

    // Delete Color functionality (using event delegation)
    document.querySelector('.tab-content').addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-color-btn')) {
            const colorId = parseInt(e.target.dataset.colorId);
            document.getElementById('color_code_action_id').value = colorId; // Set the color ID in the modal input
            // if (confirm("Are you sure you want to delete this color? This will also remove it from any days it's applied to.")) {
            //     try {
            //         const response = await fetch(`/delete_color/${colorId}`, { method: 'DELETE' });
            //         const data = await response.json();
            //         if (data.success) {
            //             alert("Color deleted successfully!");
            //             // Reload current track data to update the color codes list and calendar
            //             if (currentActiveYearId && currentActiveTrackId) {
            //                 loadTrackData(currentActiveYearId, currentActiveTrackId);
            //             }
            //         } else {
            //             console.error("Failed to delete color:", data.error);
            //             alert("Error deleting color: " + data.error);
            //         }
            //     } catch (error) {
            //         console.error('Error deleting color:', error);
            //         alert("An error occurred while deleting the color.");
            //     }
            // }
        }
    });
    
    const deleteColorButtonModal = document.getElementById('delete-color-btn-modal');
    deleteColorButtonModal.addEventListener('click', async () => {
        const colorId = parseInt(document.getElementById('color_code_action_id').value);
        try {
            const response = await fetch(`/delete_color/${colorId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert("Color deleted successfully!");
                // Reload current track data to update the color codes list and calendar
                if (currentActiveYearId && currentActiveTrackId) {
                    loadTrackData(currentActiveYearId, currentActiveTrackId);
                }
            } else {
                console.error("Failed to delete color:", data.error);
                alert("Error deleting color: " + data.error);
            }
        } catch (error) {
            console.error('Error deleting color:', error);
            alert("An error occurred while deleting the color.");
        }
    })

    // Edit Color functionality (using event delegation)
    document.querySelector('.tab-content').addEventListener('click', async function(e) {
        if (e.target.classList.contains('edit-color-btn')) {
            const colorId = parseInt(e.target.dataset.colorId);
            const colorCodeDiv = e.target.closest('.color-code');
            if (!colorCodeDiv) return;

            const currentName = colorCodeDiv.dataset.colorName;
            const currentHex = colorCodeDiv.dataset.colorHex;

            const colorCodeActionsModal = document.getElementById('modalColorCodeActions');
            if (colorCodeActionsModal) {
                colorCodeActionsModal.querySelector('#color_code_action_id').value = colorId;
                colorCodeActionsModal.querySelector('#edit-color-modal').value = currentHex;
                colorCodeActionsModal.querySelector('#edit-code-modal').value = currentName;
            }
            // const newName = prompt(`Edit name for '${currentName}':`, currentName);
            // if (newName === null) return; // User cancelled

            // const newHex = prompt(`Edit hex code for '${currentName}' (e.g., #RRGGBB):`, currentHex);
            // if (newHex === null) return; // User cancelled

            // // Simple hex validation (you might want more robust validation)
            // if (!/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
            //     alert("Invalid hex code format. Please use #RRGGBB.");
            //     return;
            // }

            // try {
            //     const response = await fetch(`/edit_color/${colorId}`, {
            //         method: 'PUT',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ name: newName, hexCode: newHex })
            //     });
            //     const data = await response.json();

            //     if (data.success) {
            //         alert("Color updated successfully!");
            //         if (currentActiveYearId && currentActiveTrackId) {
            //             loadTrackData(currentActiveYearId, currentActiveTrackId); // Reload to update UI
            //         }
            //     } else {
            //         console.error("Failed to update color:", data.error);
            //         alert("Error updating color: " + data.error);
            //     }
            // } catch (error) {
            //     console.error('Error updating color:', error);
            //     alert("An error occurred while updating the color.");
            // }
        }
        const actionLink = e.target.closest('.color-code-name-horizontal');
        if (actionLink) {
            const colorCodeDiv = actionLink.closest('.color-code-horizontal');
            if (!colorCodeDiv) return;

            const colorId = actionLink.dataset.colorId; // This is on the <a> tag
            const currentName = colorCodeDiv.dataset.colorName; // This is on the parent div
            const currentHex = colorCodeDiv.dataset.colorHex;   // This is on the parent div

            console.log("Clicked horizontal color link:", colorId, currentName, currentHex);

            const colorCodeActionsModal = document.getElementById('modalColorCodeActions');
            if (colorCodeActionsModal) {
                colorCodeActionsModal.querySelector('#color_code_action_id').value = colorId;
                colorCodeActionsModal.querySelector('#edit-color-modal').value = currentHex;
                colorCodeActionsModal.querySelector('#edit-code-modal').value = currentName;
            }
        }
    });
    
    // Edit Color Button in Modal
    const editColorButtonModal = document.getElementById('edit-color-btn-modal');
    editColorButtonModal.addEventListener('click', async () => {
        const colorId = parseInt(document.getElementById('color_code_action_id').value);
        const newName = document.getElementById('edit-code-modal').value.trim();
        const newHex = document.getElementById('edit-color-modal').value;
        // Simple hex validation (you might want more robust validation)
        if (!/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
            alert("Invalid hex code format. Please use #RRGGBB.");
            return;
        }
        try {
                const response = await fetch(`/edit_color/${colorId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName, hexCode: newHex })
                });
                const data = await response.json();

                if (data.success) {
                    alert("Color updated successfully!");
                    if (currentActiveYearId && currentActiveTrackId) {
                        loadTrackData(currentActiveYearId, currentActiveTrackId); // Reload to update UI
                    }
                } else {
                    console.error("Failed to update color:", data.error);
                    alert("Error updating color: " + data.error);
                }
            } catch (error) {
                console.error('Error updating color:', error);
                alert("An error occurred while updating the color.");
            }
    });    
    // Event listener for the '+' tab (for larger screens)
    document.getElementById('newTab').addEventListener('click', function(e) {
        e.preventDefault();
        // The data-bs-toggle on the <a> tag will handle opening the modal.
        // We just need to make sure the modal is empty.
        document.getElementById('new-track-name-input').value = '';
    });
    // Event listener for the 'New Track' option in the select (for smaller screens)
    const selectLinks = document.getElementById('tab-select');
    selectLinks.addEventListener('change', function(e) {
        if (this.value === 'add-new-track') {
            const newTrackModal = new bootstrap.Modal(document.getElementById('modalNewTrack'));
            newTrackModal.show();
            document.getElementById('new-track-name-input').value = ''; // Clear input
            // Reset the select back to the currently active track if you want
            // or leave it on "New Track" and handle it as a separate action.
            // For now, let's keep it on "New Track" until it's created.
        } else {
            // Existing logic for switching tabs
            document.getElementById('toTab' + this.value).querySelector('a').click();
        }
    });
    // Event listener for the "Create Track" button inside the new track modal
    document.getElementById('add-track-btn-modal').addEventListener('click', async () => {
        const newTrackNameInput = document.getElementById('new-track-name-input');
        const trackName = newTrackNameInput.value.trim();

        if (!trackName) {
            alert("Please enter a track name.");
            return;
        }

        // Determine the yearId for the new track.
        // This is a simple approach: use the yearId of the currently active track.
        // You might need a more robust way if users can have tracks for multiple years.
        let yearIdForNewTrack = null;
        if (currentActiveYearId) {
            yearIdForNewTrack = currentActiveYearId;
        } else {
            // Fallback if no active track is loaded yet (e.g., first load)
            // You might want to default to the current year or prompt the user.
            // For now, let's assume there's always an active track.
            console.warn("No active year ID found for new track creation. Defaulting to 2025.");
            yearIdForNewTrack = new Date().getFullYear(); // Example: use current year
        }
        console.log(trackName, yearIdForNewTrack);
        try {
            const response = await fetch('/add_track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackName: trackName, yearId: yearIdForNewTrack })
            });
            const data = await response.json();

            if (data.success) {
                alert(`Track "${data.name}" added successfully!`);
                // Close the modal
                const newTrackModal = bootstrap.Modal.getInstance(document.getElementById('modalNewTrack'));
                if (newTrackModal) newTrackModal.hide();

                // Dynamically add the new tab and option to the DOM
                const tabLinksContainer = document.querySelector('.tab-links');
                const selectLinksElement = document.getElementById('tab-select');
                const newTabLi = document.createElement('li');
                newTabLi.id = `toTab${data.id}`;
                newTabLi.dataset.trackId = data.id;
                newTabLi.dataset.trackName = data.name;

                const newTabLink = document.createElement('a');
                newTabLink.href = `#tab${data.id}`;
                newTabLink.classList.add('track-tab-link'); // Add this class
                newTabLink.dataset.trackId = data.id;
                newTabLink.dataset.trackName = data.name;

                const newTabOptionsDiv = document.createElement('div');
                newTabOptionsDiv.classList.add('track-options');
                newTabOptionsDiv.classList.add('align-items-center');
                newTabOptionsDiv.innerHTML = `
                    <i class="fa fa-pencil edit-track-btn" data-track-id="${data.id}"
                    data-track-name="${data.name}" data-bs-toggle="modal" data-bs-target="#modalTrackActions"></i>
                    <i class="fa fa-trash delete-track-btn" data-track-id="${data.id}"
                    data-bs-toggle="modal" data-bs-target="#modalDeleteTrackConfirmation"></i>
                `;
                newTabLink.innerHTML = '<span>'+ data.name + '</span>' + newTabOptionsDiv.outerHTML; // Add options to the link

                newTabLi.appendChild(newTabLink);

                newTabLink.querySelectorAll('.edit-track-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const trackId = parseInt(this.dataset.trackId);
                        const trackName = this.dataset.trackName;
                        document.getElementById('track_action_id').value = trackId;
                        document.getElementById('edit-track-name-input').value = trackName;
                    })
                });

                newTabLink.querySelectorAll('.delete-track-btn').forEach(icon => {
                    icon.addEventListener('click', function() {
                        const trackId = parseInt(this.dataset.trackId);
                        document.getElementById('delete_track_id_confirm').value = trackId;
                    })
                });



                // Insert new tab before the '+' tab
                const newTabButton = document.getElementById('newTab');
                tabLinksContainer.insertBefore(newTabLi, newTabButton);

                const newOption = document.createElement('option');
                newOption.value = data.id;
                newOption.textContent = data.name;
                newOption.dataset.trackId = data.id;
                newOption.dataset.trackName = data.name;

                // Insert new option before "New Track" option
                const addNewTrackOption = selectLinksElement.querySelector('option[value="add-new-track"]');
                selectLinksElement.insertBefore(newOption, addNewTrackOption);

                // You'll also need to create a new tab content div
                const tabContentContainer = document.querySelector('.tab-content');
                const newTabContent = document.querySelector('#new-tab-template').cloneNode(true);
                newTabContent.id = `tab${data.id}`;
                newTabContent.style.display = ''; // Make it visible
                newTabContent.classList.remove('active'); // Will be activated by click

                // Populate the new tab content with appropriate IDs and data attributes
                const yearCalendar = newTabContent.querySelector('.year-calendar');
                if (yearCalendar) {
                    yearCalendar.id = `year-calendar-${data.id}`;
                    yearCalendar.dataset.yearId = yearIdForNewTrack;
                    yearCalendar.dataset.trackId = data.id;
                }
                const yearCalendarVertical = newTabContent.querySelector('.year-calendar-vertical');
                if (yearCalendarVertical) {
                    yearCalendarVertical.id = `year-calendar-vertical-${data.id}`;
                    yearCalendarVertical.dataset.yearId = yearIdForNewTrack;
                    yearCalendarVertical.dataset.trackId = data.id;
                }
                const colorCodes = newTabContent.querySelector('.color-codes');
                if (colorCodes) colorCodes.id = `color-codes-${data.id}`;
                const newColorPicker = newTabContent.querySelector('input[type="color"]');
                if (newColorPicker) newColorPicker.id = `new-color-picker-${data.id}`;
                const newColorName = newTabContent.querySelector('input[type="text"]');
                if (newColorName) newColorName.id = `new-color-name-${data.id}`;
                const addColorBtn = newTabContent.querySelector('.add-color-btn');
                if (addColorBtn) addColorBtn.dataset.trackId = data.id;

                const colorCodesHorizontal = newTabContent.querySelector('.color-codes-horizontal');
                if (colorCodesHorizontal) colorCodesHorizontal.id = `color-codes-horizontal-${data.id}`;
                const addColorBtnHorizontalLink = newTabContent.querySelector('.add-color-btn-horizontal-link');
                if (addColorBtnHorizontalLink) addColorBtnHorizontalLink.dataset.trackId = data.id;


                tabContentContainer.appendChild(newTabContent);
                handleTabClick();
                // Trigger click on the newly created tab to activate it and load its data
                newTabLink.click();
                generateYearGrid(yearIdForNewTrack, data.id); // Generate the year grid for the new track
                generateYearGridVertical(yearIdForNewTrack, data.id); // Generate the vertical year grid for the new track

            } else {
                console.error("Failed to add track:", data.error);
                alert("Error adding track: " + data.error);
            }
        } catch (error) {
            console.error('Error adding track:', error);
            alert("An error occurred while adding the track.");
        }
    });

    // Save id and track name on the edit modal
    document.querySelectorAll('.edit-track-btn').forEach(button => {
        button.addEventListener('click', function() {
            const trackId = parseInt(this.dataset.trackId);
            const trackName = this.dataset.trackName;
            document.getElementById('track_action_id').value = trackId;
            document.getElementById('edit-track-name-input').value = trackName;
            console.log('Edit track button clicked:', trackId, trackName);
        });
    });

    // Event listener for the "Save Changes" button in the edit track modal
    document.getElementById('edit-track-btn-modal').addEventListener('click', async () => {
        const trackId = parseInt(document.getElementById('track_action_id').value);
        const newName = document.getElementById('edit-track-name-input').value.trim();

        if (!newName) {
            alert("Track name cannot be empty.");
            return;
        }

        try {
            const response = await fetch(`/edit_track/${trackId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            const data = await response.json();

            if (data.success) {
                alert(`Track name updated to "${data.track.name}"!`);
                // Close the modal
                const modalTrackActions = bootstrap.Modal.getInstance(document.getElementById('modalTrackActions'));
                if (modalTrackActions) modalTrackActions.hide();

                // Update the UI: tab link and select option
                const tabLink = document.querySelector(`#toTab${trackId} span`);
                if (tabLink) {
                    tabLink.textContent = data.track.name;
                    tabLink.dataset.trackName = data.track.name;
                }
                const selectOption = document.querySelector(`#tab-select option[value="${trackId}"]`);
                if (selectOption) {
                    selectOption.textContent = data.track.name;
                    selectOption.dataset.trackName = data.track.name;
                }
                // Reload current track data to ensure everything is in sync (optional but good practice)
                if (currentActiveYearId && currentActiveTrackId === trackId) {
                    loadTrackData(currentActiveYearId, currentActiveTrackId);
                }
            } else {
                console.error("Failed to update track:", data.error);
                alert("Error updating track: " + data.error);
            }
        } catch (error) {
            console.error('Error updating track:', error);
            alert("An error occurred while updating the track.");
        }
    });

    // Set the track ID for the delete confirmation modal
    const deleteTrackIcons = document.querySelectorAll('.delete-track-btn')
    deleteTrackIcons.forEach(icon => {
        icon.addEventListener('click', function() {
        const trackId = parseInt(icon.dataset.trackId);
        document.getElementById('delete_track_id_confirm').value = trackId;
    })
    });

    // Event listener for the "Delete Track" button
    document.getElementById('confirm-delete-track-btn').addEventListener('click', async () => {
        const trackIdToDelete = parseInt(document.getElementById('delete_track_id_confirm').value);
        console.log('Delete track button clicked:', trackIdToDelete);
        try {
            const response = await fetch(`/delete_track/${trackIdToDelete}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                alert("Track deleted successfully!");

                // Remove the track from the UI
                const tabToRemove = document.getElementById(`toTab${trackIdToDelete}`);
                if (tabToRemove) tabToRemove.remove();

                const optionToRemove = document.querySelector(`#tab-select option[value="${trackIdToDelete}"]`);
                if (optionToRemove) optionToRemove.remove();

                const contentToRemove = document.getElementById(`tab${trackIdToDelete}`);
                if (contentToRemove) contentToRemove.remove();

                // After deletion, activate the first remaining tab or a default one
                const firstRemainingTabLink = document.querySelector('.tab-links li:not(#newTab) a');
                if (firstRemainingTabLink) {
                    firstRemainingTabLink.click();
                } else {
                    // No tracks left, clear the calendar display
                    document.querySelector('.tab-content').innerHTML = `<h2>No tracks available. Add a new one!</h2>`;
                    currentActiveTrackId = null;
                    currentActiveYearId = null;
                    window.selectedColorForClicks = null;
                }

            } else {
                console.error("Failed to delete track:", data.error);
                alert("Error deleting track: " + data.error);
            }
        } catch (error) {
            console.error('Error deleting track:', error);
            alert("An error occurred while deleting the track.");
        }
    })
});
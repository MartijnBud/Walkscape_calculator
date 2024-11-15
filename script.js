let currentCharacter = {}; // Store character data
let activities = []; // Store activities data
let gear = []; // Store gear data
let sortOrder = -1; // 1 for ascending, -1 for descending

function loadActivities() {
  fetch(
    "https://proxyserver-2d51fl6oa-martijnbuds-projects.vercel.app/api?url=https://martijnbud.github.io/Walkscape_calculator/data/activities.csv"
  )
    .then((response) => response.text())
    .then((data) => {
      const rows = data.split("\n").slice(1); // Skip the header row
      activities = rows.map((row) => {
        const columns = row.split(",");
        const skill = columns[9] ? columns[9].toLowerCase().trim() : "";
        return {
          activity: columns[0],
          level: columns[1],
          requirement: columns[2],
          materialsUsed: columns[3],
          baseExp: columns[4],
          baseSteps: columns[5],
          baseExpPerStep: columns[6],
          minSteps: columns[7],
          category: columns[8],
          skill: skill,
          location: columns[10],
        };
      });
      populateActivityTable(); // Populate dropdown after loading
    })
    .catch((error) => console.error("Error loading activities:", error));
  populateActivityTable(); // Call this after activities are loaded
}

window.addEventListener("load", loadActivities); // Load activities on page load

function populateActivityTable(skill) {
  console.log("Skill:", skill);
  const activityTableBody = document
    .getElementById("activityTable")
    .getElementsByTagName("tbody")[0];
  activityTableBody.innerHTML = ""; // Clear the table first

  const currentXP = parseInt(document.getElementById("currentXP").value);
  const desiredLevel = parseInt(document.getElementById("desiredLevel").value);

  // Check if XP and desired level are valid for calculating total actions and steps
  const xpValid = !isNaN(currentXP);
  const levelValid = !isNaN(desiredLevel) && desiredLevel > 0;

  let totalXPNeeded = 0;

  if (xpValid && levelValid) {
    const xpTable = [
      0, 0, 83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107,
      2411, 2746, 3115, 3523, 3973, 4470, 5018, 5624, 6291, 7028, 7842, 8740,
      9730, 10824, 12031, 13363, 14833, 16456, 18247, 20224, 22406, 24815,
      27473, 30408, 33648, 37224, 41171, 45529, 50339, 55649, 61512, 68000,
      75127, 83014, 91721, 101333, 111945, 123660, 136594, 150872, 166636,
      184040, 203254, 224466, 247886, 273742, 302288, 333804, 368599, 407015,
      449428, 496254, 547953, 605032, 668051, 737627, 814445, 899257, 992895,
      1096278, 1210421, 1336443, 1475581, 1629200, 1798808, 1986068, 2192818,
      2421087, 2673114, 2951373, 3258594, 3597792, 3972294, 4385776, 4842295,
      5346332, 5902831, 6517253, 7195629, 7944614, 8771558, 9684577, 10692629,
      11805606, 13034431,
    ];

    totalXPNeeded = xpTable[desiredLevel] - currentXP;
  }

  // Filter activities if the skill is defined and not an empty string
  const filteredActivities = skill
    ? activities.filter(
        (activity) => activity.skill.toLowerCase() === skill.toLowerCase()
      )
    : activities;

  filteredActivities.forEach((activity) => {
    const xpPerAction = parseFloat(activity.baseExp);
    const stepsPerAction = parseFloat(activity.minSteps);

    let actionsRequired = "N/A";
    let totalStepsRequired = "N/A";

    // Calculate actions and steps only if XP and level inputs are valid
    if (xpValid && levelValid && xpPerAction > 0) {
      actionsRequired = Math.ceil(totalXPNeeded / xpPerAction);
      totalStepsRequired = actionsRequired * stepsPerAction;
    }

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${Math.floor(activity.level)}</td>
      <td>${activity.activity}</td>
      <td>${actionsRequired}</td>
      <td>${totalStepsRequired}</td>
      <td>${activity.skill}</td>
    `;

    const currentLevel = parseInt(
      document.getElementById("currentLevel").value
    );
    let highNuff = false;
    if (activity.level <= currentLevel) {
      highNuff = true;
    }
    highNuff ? row.classList.add("green") : row.classList.add("red");

    // Add an event listener to each row
    row.addEventListener("click", () => {
      document.getElementById("xpPerActionDisplay").textContent = Math.floor(
        activity.baseExp
      );
      document.getElementById("stepsPerActionDisplay").textContent =
        activity.minSteps;

      // Highlight selected row
      const rows = document.querySelectorAll("tr");
      rows.forEach((row) => row.classList.remove("selected"));
      row.classList.add("selected");
    });

    activityTableBody.appendChild(row); // Add the row to the table body
  });
  if (isNaN(skill)) {
    sortTable(0); // Sort by level by default
    console.log("Sorting by level");
  }
}

function sortTable(columnIndex) {
  const table = document.getElementById("activityTable");
  const rowsArray = Array.from(table.rows).slice(1); // Exclude header row
  const isNumeric = columnIndex >= 0;

  rowsArray.sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent;
    const bValue = b.cells[columnIndex].textContent;

    if (isNumeric) {
      return sortOrder * (parseFloat(aValue) - parseFloat(bValue));
    } else {
      return sortOrder * aValue.localeCompare(bValue);
    }
  });

  // Toggle sorting order for the next click
  sortOrder = -sortOrder;

  // Reinsert sorted rows into the table
  const tbody = table.getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear existing rows
  rowsArray.forEach((row) => tbody.appendChild(row));
}

function updateActivityValues() {
  const activityDropdown = document.getElementById("activityDropdown");
  const selectedOption =
    activityDropdown.options[activityDropdown.selectedIndex];

  if (selectedOption.value) {
    const baseExp = selectedOption.getAttribute("data-xp");
    const baseSteps = selectedOption.getAttribute("data-steps");

    // Display baseExp and minSteps
    document.getElementById("xpPerActionDisplay").textContent =
      Math.floor(baseExp);
    document.getElementById("stepsPerActionDisplay").textContent = baseSteps;
  } else {
    // Reset the values if no activity is selected
    document.getElementById("xpPerActionDisplay").textContent = "N/A";
    document.getElementById("stepsPerActionDisplay").textContent = "N/A";
  }
}

function setupEventListeners() {
  const currentXPInput = document.getElementById("currentXP");
  const desiredLevelInput = document.getElementById("desiredLevel");
  const skillDropdown = document.getElementById("skillDropdown");
  const currentLevelInput = document.getElementById("currentLevel");

  // Update the table when currentXP or desiredLevel is changed
  currentXPInput.addEventListener("input", () => {
    const selectedSkill = skillDropdown.value;
    populateActivityTable(selectedSkill);
  });

  desiredLevelInput.addEventListener("input", () => {
    const selectedSkill = skillDropdown.value;
    populateActivityTable(selectedSkill);
  });

  currentLevelInput.addEventListener("input", () => {
    const selectedSkill = skillDropdown.value;
    populateActivityTable(selectedSkill);
  });

  // Update the table when skill selection is changed
  skillDropdown.addEventListener("change", () => {
    const selectedSkill = skillDropdown.value;
    populateActivityTable(selectedSkill);
  });
}

// Call the setupEventListeners function when the window is loaded
window.addEventListener("load", () => {
  loadActivities(); // Load activities
  setupEventListeners(); // Set up event listeners
});

function populateSkillDropdown(statistics) {
  console.log("Statistics:", statistics);
  const skillDropdown = document.getElementById("skillDropdown");
  skillDropdown.innerHTML = '<option value="">Select a skill</option>';

  const skills = [
    "mining",
    "agility",
    "cooking",
    "fishing",
    "crafting",
    "foraging",
    "smithing",
    "woodcutting",
    "carpentry",
  ];

  skills.forEach((skill) => {
    let xp = statistics[skill] || 0;
    let lvl = 0;
    for (let i = 1; i < xpTable.length; i++) {
      if (xpTable[i] > xp) {
        lvl = i - 1;
        console.log("Level:", lvl);
        skillDropdown.innerHTML += `<option value="${skill}">${
          skill.charAt(0).toUpperCase() + skill.slice(1)
        } (Level: ${lvl || 0})</option>`;
        break;
      }
    }
  });

  // skills.forEach((skill) => {
  //   skillDropdown.innerHTML += `<option value="${skill}">${
  //     skill.charAt(0).toUpperCase() + skill.slice(1)
  //   } (XP: ${lvl || 0})</option>`;
  // });
}

function calculateCurrentLevelFromXP() {
  const currentXP = parseInt(document.getElementById("currentXP").value);
  const currentLevelField = document.getElementById("currentLevel");

  if (!isNaN(currentXP)) {
    for (let i = 1; i < xpTable.length; i++) {
      if (xpTable[i] > currentXP) {
        currentLevelField.value = i - 1; // Update the current level field
        break;
      }
    }
  }
}

function searchCharacter() {
  const username = document.getElementById("username").value.trim();
  const searchResult = document.getElementById("searchResult");
  const skillSelection = document.getElementById("skillSelection");
  const skillDropdown = document.getElementById("skillDropdown");
  const usernameField = document.getElementById("username");
  const currentXPInput = document.getElementById("currentXP");
  const searchButton = document.querySelector("button[type='button']");
  searchButton.classList.add("pulsate");
  if (username === "") {
    searchResult.innerText = "Please enter a username.";
    searchResult.classList.remove("show");
    searchButton.classList.remove("pulsate");
    return;
  }

  const proxyUrl =
    "https://proxyserver-2d51fl6oa-martijnbuds-projects.vercel.app/api";
  const searchUrl = `${proxyUrl}?url=https://server.walkscape.app/portal/shared/users?search=${username}`;

  fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0 || !data.users || data.users.length === 0) {
        searchResult.innerText = "No character found.";
        searchResult.classList.add("show");
        searchButton.classList.remove("pulsate");
        skillSelection.style.display = "none";
        return;
      }

      const userId = data.users[0].id;
      const characterName = data.users[0].username; // set the username to the fetched username
      const charactersUrl = `${proxyUrl}?url=https://server.walkscape.app/portal/shared/users/${userId}/characters`;

      return fetch(charactersUrl)
        .then((response) => response.json())
        .then((characters) => {
          if (!characters || characters.length === 0) {
            searchResult.innerText = "No characters found for this user.";
            searchResult.classList.add("show");
            searchButton.classList.remove("pulsate");
            return;
          }

          currentCharacter = characters[0];
          usernameField.value = characterName; // Set the input field to the correct username
          searchButton.classList.remove("pulsate");
          searchButton.classList.add("fade-green"); // Change button color to green

          populateSkillDropdown(currentCharacter.statistics);
          skillSelection.style.display = "block";
        });
    })
    .catch((error) => {
      searchResult.innerText = "Error fetching data. Please try again.";
      searchResult.classList.add("show");
      console.error("Error:", error);
    });
}

function selectGear(slotId) {
  console.log(`Selected gear slot: ${slotId}`);
  // You can add more logic here if you want to handle actions when a slot is selected
}

document.addEventListener("DOMContentLoaded", () => {
  fetchEquipmentData();
});

async function fetchEquipmentData() {
  const response = await fetch(
    "https://proxyserver-2d51fl6oa-martijnbuds-projects.vercel.app/api?url=https://martijnbud.github.io/Walkscape_calculator/data/equipment.csv"
  );
  const data = await response.text();
  console.log("Data:", data);
  const equipment = parseCSV(data);

  populateGearSlots(equipment);
}

function parseCSV(data) {
  const rows = data.split("\n");
  const header = rows[0].split(",").map((col) => col.trim());

  // Get column indices based on header
  const itemIndex = header.indexOf("Item");
  const qualityIndex = header.indexOf("Quality");
  const slotIndex = header.indexOf("Slot");
  const attributeIndex = header.indexOf("Attribute");
  const boostIndex = header.indexOf("Boost");
  const typeBoostIndex = header.indexOf("Type_boost");
  const skillBoostIndex = header.indexOf("Skill_boost");
  const noteIndex = header.indexOf("Note");

  if (itemIndex === -1 || qualityIndex === -1 || slotIndex === -1) {
    console.error("CSV format error: Missing essential columns.");
    return [];
  }

  const equipment = {};

  rows.slice(1).forEach((row) => {
    const columns = row.split(",");
    if (columns.length > Math.max(itemIndex, qualityIndex)) {
      const itemName = columns[itemIndex].trim();
      const slot = columns[slotIndex].trim().toLowerCase();
      const quality = columns[qualityIndex].trim();
      const attribute = {
        type: columns[attributeIndex]?.trim(),
        boost: columns[boostIndex]?.trim(),
        boostType: columns[typeBoostIndex]?.trim(),
        skillBoost: columns[skillBoostIndex]?.trim(),
        condition: columns[noteIndex]?.trim(),
      };

      // Initialize item if not present
      if (!equipment[itemName]) {
        equipment[itemName] = { Item: itemName, Slot: slot, Qualities: {} };
      }

      // Initialize quality if not present
      if (!equipment[itemName].Qualities[quality]) {
        equipment[itemName].Qualities[quality] = [];
      }

      // Add attribute to the appropriate quality level
      equipment[itemName].Qualities[quality].push(attribute);
    }
  });

  const parsedData = Object.values(equipment);
  console.log(
    "Final Parsed Data with Grouped Attributes by Quality:",
    parsedData
  );
  return parsedData;
}
const equipmentMap = {}; // Store structured attributes by item and quality

function getSelectedSkill() {
  const skillDropdown = document.getElementById("skillDropdown");
  return skillDropdown ? skillDropdown.value : "";
}
document.getElementById("skillDropdown").addEventListener("change", () => {
  updateTotalsTable(totalsTracker); // Re-run table update with new skill selection
});

function populateGearSlots(equipment) {
  const gearSlots = [
    "cape",
    "head",
    "back",
    "hands",
    "chest",
    "neck",
    "primary",
    "legs",
    "secondary",
    "ring",
    "feet",
    "tool",
  ];

  // Populate equipmentMap for easy access by item name
  equipment.forEach((item) => {
    equipmentMap[item.Item.toLowerCase()] = item.Qualities;
  });

  // Populate each gear slot dropdown (datalist) with items matching the slot
  gearSlots.forEach((slot) => {
    const slotData = equipment.filter(
      (item) => item.Slot === slot.toLowerCase()
    );
    const datalist = document.getElementById(`${slot}Suggestions`);

    if (datalist) {
      console.log(`Populating ${slot} with items:`, slotData);
      datalist.innerHTML = ""; // Clear any previous options

      slotData.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.Item;
        datalist.appendChild(option);
      });
    } else {
      console.warn(`Datalist for ${slot} not found in HTML.`);
    }
  });

  // Add event listeners to log attributes when an item is selected
  addSelectionListeners();
}

// Initialize totals tracker globally
let totalsTracker = {}; // We use `let` so we can reset it on recalculations

function addSelectionListeners() {
  const gearInputs = document.querySelectorAll(".gear-slot");

  gearInputs.forEach((input) => {
    input.addEventListener("input", (event) => {
      const selectedItem = event.target.value.trim().toLowerCase();

      // Check if selectedItem is an exact match in equipmentMap
      if (selectedItem && equipmentMap[selectedItem]) {
        updateTotals();
      } else if (!selectedItem) {
        // If the input is cleared, update totals to remove bonuses from that slot
        updateTotals();
      }
    });
  });
}

// Function to re-calculate totals based on current grid input values
function updateTotals() {
  // Reset totalsTracker to start fresh
  totalsTracker = {};

  // Get all gear inputs and calculate totals based on exact matches
  const gearInputs = document.querySelectorAll(".gear-slot");

  gearInputs.forEach((input) => {
    const selectedItem = input.value.trim().toLowerCase();
    const qualities = equipmentMap[selectedItem];

    if (qualities) {
      // Accumulate totals grouped by main attribute type
      for (const quality in qualities) {
        qualities[quality].forEach((attr) => {
          const isPercentage = attr.boostType === "Percentage";
          const boostValue = parseFloat(attr.boost) || 0;

          // Skip this attribute if boost value is zero
          if (boostValue === 0) return;

          const isNegative = attr.boost.startsWith("-");
          const mainAttribute = attr.type; // Grouping key for main attribute type
          const specificCondition = `${
            attr.skillBoost === "Specific"
              ? "while " + attr.condition
              : attr.condition
              ? attr.condition.toLowerCase()
              : "global"
          }`;

          // Initialize main attribute in totalsTracker if not already present
          if (!totalsTracker[mainAttribute]) {
            totalsTracker[mainAttribute] = {};
          }

          // Initialize condition-specific total if not present
          if (!totalsTracker[mainAttribute][specificCondition]) {
            totalsTracker[mainAttribute][specificCondition] = {
              percentage: 0,
              flat: 0,
            };
          }

          // Add or subtract the boost based on its type
          if (isPercentage) {
            totalsTracker[mainAttribute][specificCondition].percentage +=
              isNegative ? -Math.abs(boostValue) : boostValue;
          } else {
            totalsTracker[mainAttribute][specificCondition].flat += isNegative
              ? -Math.abs(boostValue)
              : boostValue;
          }
        });
      }
    }
  });

  // Update the totals table with the recalculated cumulative totals
  updateTotalsTable(totalsTracker);
}

function updateTotalsTable(totalsTracker) {
  const tableBody = document
    .getElementById("totalsTable")
    .querySelector("tbody");

  // Get the selected skill from the dropdown
  const selectedSkill = getSelectedSkill();

  // Clear existing rows
  tableBody.innerHTML = "";

  // Populate table with grouped cumulative totals
  for (const [mainAttribute, conditions] of Object.entries(totalsTracker)) {
    let row = document.createElement("tr");

    // Create a cell for the main attribute (e.g., "Work Efficiency")
    const attributeCell = document.createElement("td");
    attributeCell.textContent = mainAttribute;
    attributeCell.rowSpan = Object.keys(conditions).length; // Span across all conditions for this attribute
    row.appendChild(attributeCell);

    // Add each condition-specific total as its own row under the main attribute
    let firstCondition = true;
    for (const [condition, totals] of Object.entries(conditions)) {
      // Only append a new row if it's not the first condition (first condition uses the same row as main attribute)
      if (!firstCondition) {
        tableBody.appendChild(row);
        row = document.createElement("tr"); // Create a new row for subsequent conditions
      }

      // Create cells for condition, percentage, and flat bonus
      const conditionCell = document.createElement("td");
      conditionCell.textContent = condition;
      row.appendChild(conditionCell);

      const percentageCell = document.createElement("td");
      percentageCell.textContent =
        totals.percentage !== 0 ? `${totals.percentage}%` : "";
      row.appendChild(percentageCell);

      const flatCell = document.createElement("td");
      flatCell.textContent = totals.flat !== 0 ? `${totals.flat}` : "";
      row.appendChild(flatCell);

      // Apply row color based on skill match
      if (selectedSkill) {
        // If a skill is selected, color green if it matches, red if it doesn't
        if (condition.toLowerCase().includes(selectedSkill.toLowerCase())) {
          row.style.backgroundColor = "rgba(144, 238, 144, 0.3)"; // Light green
        } else {
          row.style.backgroundColor = "rgba(255, 99, 71, 0.3)"; // Light red
        }
      } else {
        // Reset to default color if no skill is selected
        row.style.backgroundColor = "";
      }

      firstCondition = false;
      tableBody.appendChild(row); // Append the row to the table body
    }
  }
}

// Function to update the current XP based on the selected skill
function updateCurrentXP() {
  const skillDropdown = document.getElementById("skillDropdown");
  const currentXPInput = document.getElementById("currentXP");
  console.log("Skill dropdown value:", skillDropdown.value);
  populateActivityTable(skillDropdown.value);

  if (skillDropdown.value) {
    currentCharacter.statistics
      ? (currentXPInput.value =
          currentCharacter.statistics[skillDropdown.value])
      : null; // Set current XP
  } else {
    currentXPInput.value = ""; // Reset if no skill selected
  }

  // Update the current level based on the new XP
  calculateCurrentLevelFromXP();
}
const xpTable = [
  0, 0, 83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107,
  2411, 2746, 3115, 3523, 3973, 4470, 5018, 5624, 6291, 7028, 7842, 8740, 9730,
  10824, 12031, 13363, 14833, 16456, 18247, 20224, 22406, 24815, 27473, 30408,
  33648, 37224, 41171, 45529, 50339, 55649, 61512, 68000, 75127, 83014, 91721,
  101333, 111945, 123660, 136594, 150872, 166636, 184040, 203254, 224466,
  247886, 273742, 302288, 333804, 368599, 407015, 449428, 496254, 547953,
  605032, 668051, 737627, 814445, 899257, 992895, 1096278, 1210421, 1336443,
  1475581, 1629200, 1798808, 1986068, 2192818, 2421087, 2673114, 2951373,
  3258594, 3597792, 3972294, 4385776, 4842295, 5346332, 5902831, 6517253,
  7195629, 7944614, 8771558, 9684577, 10692629, 11805606, 13034431,
];

// Function to calculate the current level from XP
function calculateCurrentLevelFromXP() {
  const currentXP = parseInt(document.getElementById("currentXP").value);
  const currentLevelField = document.getElementById("currentLevel");

  if (!isNaN(currentXP)) {
    for (let i = 1; i < xpTable.length; i++) {
      if (xpTable[i] > currentXP) {
        currentLevelField.value = i - 1; // Update the current level field
        break;
      }
    }
  }
}

// Function to calculate the total XP required to reach the desired level
function calculateXP() {
  console.log("Calculating XP...");

  const baseExp = parseInt(
    document.getElementById("xpPerActionDisplay").textContent
  );
  const baseSteps = parseInt(
    document.getElementById("stepsPerActionDisplay").textContent
  );

  const currentXP = parseInt(document.getElementById("currentXP").value);
  const currentLevelField = document.getElementById("currentLevel");
  let currentLevel = parseInt(currentLevelField.value);
  const desiredLevel = parseInt(document.getElementById("desiredLevel").value);
  const stepsPerAction = baseSteps;

  const xpPerAction = baseExp;
  console.log("Steps per action:", stepsPerAction);
  console.log("XP per action:", xpPerAction);

  let currentXPLevel = currentLevel;
  if (!isNaN(currentXP)) {
    for (let i = 1; i < xpTable.length; i++) {
      if (xpTable[i] > currentXP) {
        currentXPLevel = i - 1; // Set current level based on XP
        currentLevelField.value = currentXPLevel; // Insert that value into the input field
        break;
      }
    }
  }

  if (desiredLevel <= currentXPLevel) {
    document.getElementById("result").innerText =
      "Desired level must be higher than current level!";
    return;
  }

  // Calculate total XP needed to go from current level to desired level
  let totalXP =
    xpTable[desiredLevel] - (currentXP ? currentXP : xpTable[currentXPLevel]);
  console.log("Total XP:", totalXP);

  // Calculate how many actions are required based on XP per action
  let actionsRequired = totalXP / xpPerAction;
  console.log("Actions required:", actionsRequired);

  // Calculate total steps required based on actions and steps per action
  let totalSteps = actionsRequired * stepsPerAction;
  console.log("Total steps:", totalSteps);

  // Round steps and actions up to nearest int
  totalSteps = Math.ceil(totalSteps);
  actionsRequired = Math.ceil(actionsRequired);

  // Fade effect on button
  const calculateButton = document.querySelector(
    "button[onclick='calculateXP()']"
  );
  calculateButton.classList.add("fade-green");

  // Remove the class after a brief delay
  setTimeout(() => {
    calculateButton.classList.remove("fade-green");
  }, 1000); // Change duration as needed
  // Change calculate button color to green
  calculateButton.classList.add("fetched");

  // Display the result
  document.getElementById(
    "result"
  ).innerText = `You need to walk ${totalSteps} steps and perform ${actionsRequired} actions to reach level ${desiredLevel}.  Good luck!`;
  document.getElementById("result").classList.add("show");
  // Scroll to the result
  const resultElement = document.getElementById("result");
  resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Update current level when XP is changed:
document
  .getElementById("currentXP")
  .addEventListener("input", calculateCurrentLevelFromXP);

document.getElementById();

// Function to check if cookies have been accepted or declined
function checkCookieConsent() {
  const cookieConsent = localStorage.getItem("cookieConsent");
  if (!cookieConsent) {
    document.getElementById("cookieConsent").style.display = "block";
  }
}

// Function to handle Enter key press for input fields
function handleInputKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default form submission

    if (event.target.id === "username") {
      searchCharacter(); // Trigger the search function
    } else {
      calculateXP(); // Trigger the calculate function
    }
  }
}

// Add event listeners to input fields
document
  .getElementById("username")
  .addEventListener("keydown", handleInputKeyPress);
document
  .getElementById("currentXP")
  .addEventListener("keydown", handleInputKeyPress);
document
  .getElementById("currentLevel")
  .addEventListener("keydown", handleInputKeyPress);
document
  .getElementById("desiredLevel")
  .addEventListener("keydown", handleInputKeyPress);
document
  .getElementById("stepsPerAction")
  .addEventListener("keydown", handleInputKeyPress);
document
  .getElementById("xpPerAction")
  .addEventListener("keydown", handleInputKeyPress);

// Function to handle cookie consent acceptance
function acceptCookies() {
  localStorage.setItem("cookieConsent", "true");
  document.getElementById("cookieConsent").style.display = "none";
}

// Function to handle cookie consent decline
function declineCookies() {
  localStorage.setItem("cookieConsent", "false");
  document.getElementById("cookieConsent").style.display = "none";
}

// Wait until the entire page has loaded
window.addEventListener("load", function () {
  // Check the cookie consent status on page load
  checkCookieConsent();

  // Add event listener for "Accept" button
  document
    .getElementById("acceptCookies")
    .addEventListener("click", acceptCookies);

  // Add event listener for "Decline" button
  document
    .getElementById("declineCookies")
    .addEventListener("click", declineCookies);
});

function toggleView() {
  const homeContainer = document.getElementById("homeContainer");
  const mapContainer = document.getElementById("mapContainer");
  const menuButton = document.getElementById("menuButton");

  // Toggle between home and map
  if (homeContainer.style.display === "none") {
    // Show home container (calculator)
    homeContainer.style.display = "block";
    mapContainer.style.display = "none";
    menuButton.textContent = "Interactive World Map"; // Set text to "Interactive World Map"

    // Remove the "expand" class to reset the container
    homeContainer.classList.remove("expand");
  } else {
    // Show map container
    homeContainer.style.display = "none";
    mapContainer.style.display = "block";
    menuButton.textContent = "Calculator"; // Set text to "Calculator"

    // Add the "expand" class to increase the width of homeContainer when switching back
    homeContainer.classList.add("expand");
  }
}

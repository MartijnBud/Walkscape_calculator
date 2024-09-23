let currentCharacter = {}; // Store character data
let activities = []; // Store activities data

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
      populateActivityDropdown(); // Populate dropdown after loading
    })
    .catch((error) => console.error("Error loading activities:", error));
  populateActivityDropdown(); // Call this after activities are loaded
}

window.addEventListener("load", loadActivities); // Load activities on page load

function populateActivityDropdown() {
  const activityDropdown = document.getElementById("activityDropdown");
  activityDropdown.innerHTML = '<option value="">Select Activity</option>';

  activities.forEach((activity) => {
    activityDropdown.innerHTML += `
      <option value="${activity.activity}" 
              data-xp="${activity.baseExp}" 
              data-steps="${activity.minSteps}" 
              data-skill="${activity.skill}">
        ${activity.activity}
      </option>`;
  });
}

function filterActivitiesBySkill(skill) {
  const activityDropdown = document.getElementById("activityDropdown");
  activityDropdown.innerHTML = '<option value="">Select Activity</option>';
  activities;
  console.log("Filtering activities by skill:", skill);
  console.log("Activities:", activities[0].skill);

  activities
    .filter((activity) => activity.skill.toLowerCase() === skill) // Filter by the selected skill
    .forEach((activity) => {
      activityDropdown.innerHTML += `
        <option value="${activity.activity}" 
                data-xp="${activity.baseExp}" 
                data-steps="${activity.minSteps}">
          ${activity.activity}
        </option>`;
    });
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

function populateSkillDropdown(statistics) {
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
    skillDropdown.innerHTML += `<option value="${skill}">${
      skill.charAt(0).toUpperCase() + skill.slice(1)
    } (XP: ${statistics[skill] || 0})</option>`;
  });

  skillDropdown.addEventListener("change", () => {
    updateCurrentXP();
    filterActivitiesBySkill(skillDropdown.value);
    console.log("Skill selected:", skillDropdown.value);
  });
}
function searchCharacter() {
  const username = document.getElementById("username").value.trim();
  const searchResult = document.getElementById("searchResult");
  const skillSelection = document.getElementById("skillSelection");
  const skillDropdown = document.getElementById("skillDropdown");
  const usernameField = document.getElementById("username"); // Get the username input field
  const currentXPInput = document.getElementById("currentXP"); // Get the current XP input field
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
      const characterName = data.users[0].username; // Get the correct username
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
          // usernameField.classList.add("fetched");

          // searchResult.innerHTML = `
          //   <h3>Character: ${currentCharacter.character_name} ✔️</h3>
          //   <p><strong>Current Location:</strong> ${currentCharacter.current_location}</p>
          //   <p><strong>Total Steps:</strong> ${currentCharacter.total_steps}</p>
          //   <p><strong>Total XP:</strong> ${currentCharacter.statistics.total_xp}</p>
          // `;

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

// Function to update the current XP based on the selected skill
function updateCurrentXP() {
  const skillDropdown = document.getElementById("skillDropdown");
  const currentXPInput = document.getElementById("currentXP");

  if (skillDropdown.value) {
    currentXPInput.value = currentCharacter.statistics[skillDropdown.value]; // Set current XP
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

  const selectedOption =
    activityDropdown.options[activityDropdown.selectedIndex];
  const baseExp = selectedOption.getAttribute("data-xp");
  const baseSteps = selectedOption.getAttribute("data-steps");

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
  ).innerText = `You need to walk ${totalSteps} steps and perform ${actionsRequired} actions to reach level ${desiredLevel}.`;
  document.getElementById("result").classList.add("show");
  // Scroll to the result
  const resultElement = document.getElementById("result");
  resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Update current level when XP is changed:
document
  .getElementById("currentXP")
  .addEventListener("input", calculateCurrentLevelFromXP);

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
document.getElementById("skillDropdown").addEventListener("change", () => {
  updateCurrentXP();
  filterActivitiesBySkill(document.getElementById("skillDropdown").value);
});

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

// gear selection part:

// sample gear items
const gearItems = {
  cape: { name: "Mystic Cape", efficiencyBonus: 5 },
  back: { name: "Adventurer's Backpack", efficiencyBonus: 3 },
  head: { name: "Helmet of Wisdom", efficiencyBonus: 4 },
  hands: { name: "Gauntlets of Strength", efficiencyBonus: 6 },
  neck: { name: "Amulet of Power", efficiencyBonus: 7 },
  chest: { name: "Dragon Chestplate", efficiencyBonus: 8 },
  primary: { name: "Sword of Valor", efficiencyBonus: 10 },
  legs: { name: "Leggings of Swiftness", efficiencyBonus: 4 },
  secondary: { name: "Shield of Fortitude", efficiencyBonus: 5 },
  ring1: { name: "Ring of Precision", efficiencyBonus: 2 },
  feet: { name: "Boots of Speed", efficiencyBonus: 3 },
  ring2: { name: "Ring of Endurance", efficiencyBonus: 2 },
};

// initial state
let selectedGear = {
  cape: null,
  back: null,
  head: null,
  hands: null,
  neck: null,
  chest: null,
  primary: null,
  legs: null,
  secondary: null,
  ring1: null,
  feet: null,
  ring2: null,
};

function selectGear(slot) {
  const gear = gearItems[slot];
  selectedGear[slot] = gear;
  document.getElementById(slot).textContent = gear.name;

  updateTotalBonus();
}

function updateTotalBonus() {
  let totalBonus = 0;
  for (let slot in selectedGear) {
    if (selectedGear[slot]) {
      totalBonus += selectedGear[slot].efficiencyBonus;
    }
  }
  document.getElementById("totalBonus").textContent = totalBonus;
}

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

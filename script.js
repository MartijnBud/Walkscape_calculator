let currentCharacter = {}; // Store character data

// Function to search for a character by username
function searchCharacter() {
  const username = document.getElementById("username").value.trim();
  const searchResult = document.getElementById("searchResult");
  const skillSelection = document.getElementById("skillSelection");
  const skillDropdown = document.getElementById("skillDropdown");

  if (username === "") {
    searchResult.innerText = "Please enter a username.";
    searchResult.classList.remove("show"); // Hide result if no username
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
        searchResult.classList.add("show"); // Show result
        skillSelection.style.display = "none"; // Hide skill selection
        return;
      }

      const userId = data.users[0].id;
      const charactersUrl = `${proxyUrl}?url=https://server.walkscape.app/portal/shared/users/${userId}/characters`;

      return fetch(charactersUrl);
    })
    .then((response) => response.json())
    .then((characters) => {
      if (!characters || characters.length === 0) {
        searchResult.innerText = "No characters found for this user.";
        searchResult.classList.add("show");
        return;
      }

      currentCharacter = characters[0];
      searchResult.innerHTML = `
        <h3>Character: ${currentCharacter.character_name} ✔️</h3>
        <p><strong>Current Location:</strong> ${currentCharacter.current_location}</p>
        <p><strong>Total Steps:</strong> ${currentCharacter.total_steps}</p>
        <p><strong>Total XP:</strong> ${currentCharacter.statistics.total_xp}</p>
      `;

      // Populate skill dropdown
      populateSkillDropdown(currentCharacter.statistics);
      skillSelection.style.display = "block"; // Show skill selection
    })
    .catch((error) => {
      searchResult.innerText = "Error fetching data. Please try again.";
      searchResult.classList.add("show");
      console.error("Error:", error);
    });
}

// Populate skill dropdown based on character statistics
function populateSkillDropdown(statistics) {
  const skillDropdown = document.getElementById("skillDropdown");
  skillDropdown.innerHTML = '<option value="">Select a skill</option>'; // Reset dropdown

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

  skillDropdown.addEventListener("change", updateCurrentXP); // Add change event listener
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
  const currentXP = parseInt(document.getElementById("currentXP").value);
  const currentLevelField = document.getElementById("currentLevel");
  let currentLevel = parseInt(currentLevelField.value);
  const desiredLevel = parseInt(document.getElementById("desiredLevel").value);
  const stepsPerAction = parseFloat(
    document.getElementById("stepsPerAction").value
  );
  const xpPerAction = parseFloat(document.getElementById("xpPerAction").value);

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

  // Calculate how many actions are required based on XP per action
  let actionsRequired = totalXP / xpPerAction;

  // Calculate total steps required based on actions and steps per action
  let totalSteps = actionsRequired * stepsPerAction;

  // Round steps and actions up to nearest int
  totalSteps = Math.ceil(totalSteps);
  actionsRequired = Math.ceil(actionsRequired);

  // Display the result
  document.getElementById(
    "result"
  ).innerText = `You need to walk ${totalSteps} steps and perform ${actionsRequired} actions to reach level ${desiredLevel}.`;
  console.log("Total XP:", totalSteps);
  document.getElementById("result").classList.add("show");
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

// XP table for WalkScape (sample data)
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

  // Round steps and actions up to nearest int, since half steps and actions are useless
  totalSteps = Math.ceil(totalSteps);
  actionsRequired = Math.ceil(actionsRequired);

  // Display the result
  document.getElementById(
    "result"
  ).innerText = `You need to walk ${totalSteps} steps and perform ${actionsRequired} actions to reach level ${desiredLevel}.`;
}

// Update current level when XP is changed:
document
  .getElementById("currentXP")
  .addEventListener("input", calculateCurrentLevelFromXP);

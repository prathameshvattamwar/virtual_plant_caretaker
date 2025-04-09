document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (Keep existing ones) ---
    const appBody = document.getElementById('app-body');
    const appContainer = document.getElementById('app-container');
    const initialSetupModal = document.getElementById('initial-setup');
    const setupPlantTypeSelect = document.getElementById('setup-plant-type');
    const setupBackgroundThemeSelect = document.getElementById('setup-background-theme');
    const startCaringButton = document.getElementById('start-caring-button');

    const plantImage = document.getElementById('plant-image');
    const plantStageName = document.getElementById('plant-stage-name');
    const pointsDisplay = document.getElementById('points-display');
    const plantStatusMessage = document.getElementById('plant-status-message') || createPlantStatusElement(); // NEW
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const plantImageContainer = document.getElementById('plant-image-container');

    const taskForm = document.getElementById('task-form');
    const taskSelect = document.getElementById('task-select');
    const taskFeedback = document.getElementById('task-feedback');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const historyList = document.getElementById('history-list');
    const statsContent = document.getElementById('stats-content'); // Get stats container
    const careTipsContainer = document.getElementById('care-tips') || createCareTipsElement(); // NEW

    const streakDisplay = document.getElementById('streak-display');
    const totalPointsDisplay = document.getElementById('total-points-display');
    const todayTasksDisplay = document.getElementById('today-tasks-display');
    const weekTasksDisplay = document.getElementById('week-tasks-display');
    // NEW Stats Elements
    const avgPointsDayDisplay = document.getElementById('avg-points-day') || createStatsElement('avg-points-day', 'Avg Points/Day');
    const avgTasksDayDisplay = document.getElementById('avg-tasks-day') || createStatsElement('avg-tasks-day', 'Avg Tasks/Day');


    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const settingPlantTypeSelect = document.getElementById('setting-plant-type');
    const settingBackgroundThemeSelect = document.getElementById('setting-background-theme');
    const resetDataButton = document.getElementById('reset-data-button');

    const milestoneCelebration = document.getElementById('milestone-celebration');
    const milestoneText = document.getElementById('milestone-text');

    // --- Configuration (Keep existing) ---
    const STORAGE_KEY = 'virtualPlantCareData_v2'; // Increment version if state structure changes significantly

     const TASKS = {
        'drink-water': { name: 'Drink Water', points: 5, tip: "Hydration is key for you and your plant!" },
        'exercise': { name: 'Exercise (15+ min)', points: 20, tip: "Keep moving! It boosts energy levels." },
        'meditate': { name: 'Meditate (5+ min)', points: 15, tip: "A calm mind supports steady growth." },
        'read': { name: 'Read a Book', points: 10, tip: "Expand your mind like roots expand in soil." },
        'healthy-meal': { name: 'Eat a Healthy Meal', points: 10, tip: "Good fuel helps you thrive." },
        'no-sugar': { name: 'Avoid Sugary Snacks', points: 15, tip: "Steady energy is better than quick bursts." },
        'tidy-up': { name: 'Tidy Space (5 min)', points: 8, tip: "A clear space helps clear the mind."} // New Task Example
    };

    const PLANT_STAGES = { // Keep existing
        0: { name: 'Seedling', image: '_seedling.svg', tip: "Just starting out! Consistent care is vital." },
        50: { name: 'Sprout', image: '_sprout.svg', tip: "Showing promise! Keep up the good habits." },
        150: { name: 'Small Plant', image: '_small.svg', tip: "Getting stronger. Your efforts are paying off." },
        300: { name: 'Growing Plant', image: '_growing.svg', tip: "Developing well! Aim for variety in your tasks." },
        500: { name: 'Mature Plant', image: '_mature.svg', tip: "Look how far you've come! Maintain consistency." },
        800: { name: 'Flowering', image: '_flowering.svg', tip: "Blooming beautifully! Celebrate your achievements." },
    };
    const STAGE_THRESHOLDS = Object.keys(PLANT_STAGES).map(Number).sort((a, b) => a - b);

    const REWARDS = { // Keep existing, maybe add more
        'streak_3': { type: 'decoration', value: 'butterfly', message: 'A butterfly friend joined! (3 day streak)' },
        'points_200': { type: 'theme', value: 'night', message: 'Night Garden theme unlocked! (200 points)' },
        'stage_Mature Plant': { type: 'decoration', value: 'pot-upgrade', message: 'Fancy pot upgrade! (Mature Stage)' },
        'streak_7': { type: 'bonus_points', value: 50, message: 'Weekly Streak Bonus! +50 points!'}
    };

    const RANDOM_EVENTS = [ // NEW
        { message: "Feeling sunny! Plant got a small boost.", points: 3, probability: 0.1 }, // 10% chance
        { message: "A gentle rain refreshed your plant!", points: 2, probability: 0.1 },
        { message: "A helpful bee visited!", points: 1, probability: 0.05 },
        { message: "Perfect growing conditions today!", points: 0, probability: 0.15 } // No points, just flavor
    ];

    const NEGLECT_THRESHOLD_HOURS = 36; // NEW: Check if task logged within this time

    // --- State Management ---
    let state = {
        points: 0,
        plantType: 'bonsai',
        backgroundTheme: 'sunny',
        taskHistory: [],
        lastLoginDate: null, // YYYY-MM-DD for streak
        lastTaskTimestamp: null, // Full timestamp for neglect check
        streak: 0,
        unlockedRewards: [],
        setupComplete: false,
        dailyBonusClaimedDate: null // NEW: YYYY-MM-DD
    };

    // --- Helper Functions for Dynamic Elements ---
    function createPlantStatusElement() {
        const p = document.createElement('p');
        p.id = 'plant-status-message';
        pointsDisplay.parentNode.insertBefore(p, pointsDisplay.nextSibling);
        return p;
    }

     function createCareTipsElement() {
        const div = document.createElement('div');
        div.id = 'care-tips';
        div.classList.add('card'); // Style it like a card
        statsContent.parentNode.insertBefore(div, statsContent.nextSibling); // Insert after stats
        div.innerHTML = '<h2>Care Tips</h2><p id="tip-text">Log tasks to see relevant tips!</p>';
        return div.querySelector('#tip-text');
    }

     function createStatsElement(id, label) {
         const p = document.createElement('p');
         p.innerHTML = `${label}: <span id="${id}">0</span>`;
         // Insert before the care tips container if it exists, or at the end of stats
         const careTipsDiv = document.getElementById('care-tips');
         if (careTipsDiv) {
              statsContent.insertBefore(p, careTipsDiv);
         } else {
              statsContent.appendChild(p);
         }
         return p.querySelector(`#${id}`);
     }


    // --- State Saving/Loading (Keep existing, ensure new state vars are handled) ---
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Error saving state:", e);
            showTaskFeedback("Error saving progress!", true); // Use feedback line
        }
    }

    function loadState() {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const loaded = JSON.parse(savedState);
                // Merge loaded state with defaults to handle missing keys after updates
                state = { ...state, ...loaded };
                 // Ensure arrays are arrays even if saved as null
                state.taskHistory = state.taskHistory || [];
                state.unlockedRewards = state.unlockedRewards || [];
            } catch (e) {
                console.error("Error parsing state:", e);
                localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
            }
        }
    }


    // --- Initialization (Modified) ---
    function init() {
        loadState();

        if (!state.setupComplete) {
            showInitialSetup();
        } else {
            startApp();
        }
    }

    function showInitialSetup() { // No changes needed here
        initialSetupModal.classList.remove('hidden');
        appContainer.classList.add('hidden');
        setupPlantTypeSelect.value = state.plantType;
        setupBackgroundThemeSelect.value = state.backgroundTheme;

        startCaringButton.onclick = () => {
            state.plantType = setupPlantTypeSelect.value;
            state.backgroundTheme = setupBackgroundThemeSelect.value;
            settingPlantTypeSelect.value = state.plantType; // Sync settings dropdown
            settingBackgroundThemeSelect.value = state.backgroundTheme;
            state.setupComplete = true;
            initialSetupModal.classList.add('hidden');
            appContainer.classList.remove('hidden');
            saveState();
            startApp();
        };
    }

     function startApp() {
        populateTaskDropdown();
        addEventListeners();
        applyTheme();
        handleDailyCheckin(); // NEW: Check for bonus on load
        updateUI(); // Render based on loaded state
        triggerRandomEvent(0.1); // Low chance of event on app start
        console.log("App Initialized. State:", state);
    }

    function populateTaskDropdown() { // No change needed
        taskSelect.innerHTML = '';
        for (const key in TASKS) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${TASKS[key].name} (+${TASKS[key].points} pts)`;
            taskSelect.appendChild(option);
        }
    }

    // --- Core Logic (Enhanced) ---

    function logTask(taskKey) {
        if (!TASKS[taskKey]) return;

        const task = TASKS[taskKey];
        const pointsEarned = task.points;
        state.points += pointsEarned;
        const now = new Date();
        state.lastTaskTimestamp = now.toISOString(); // Update last task time

        const historyEntry = {
            id: now.getTime(),
            taskKey: taskKey,
            taskName: task.name,
            points: pointsEarned,
            timestamp: state.lastTaskTimestamp
        };
        state.taskHistory.push(historyEntry);

        updateStreak(true); // Counts for streak

        showTaskFeedback(`+${pointsEarned} points for ${task.name}!`);
        displayCareTip(task.tip || PLANT_STAGES[getCurrentStageKey()].tip); // Show task tip or stage tip

        checkMilestones();
        triggerRandomEvent(); // Chance of random event after task
        updateUI(); // This now includes plant status update
        saveState();
    }

    function handleDailyCheckin() { // NEW
        const today = new Date().toISOString().split('T')[0];
        if (state.dailyBonusClaimedDate !== today) {
            const bonusPoints = 5; // Define daily bonus
            state.points += bonusPoints;
            state.dailyBonusClaimedDate = today;
            showTaskFeedback(`Daily Check-in Bonus: +${bonusPoints} points!`, false, true); // Mark as event
             console.log("Daily bonus claimed");
            updateStreak(); // Update streak based on login day (even without task)
            saveState(); // Save immediately after bonus
        } else {
             updateStreak(); // Still update streak status on load if bonus already claimed
        }
    }


    function updateStreak(taskLoggedToday = false) { // Modified logic
        const today = new Date().toISOString().split('T')[0];
        let streakUpdated = false;

        if (state.lastLoginDate) {
            const lastDate = new Date(state.lastLoginDate);
            const currentDate = new Date(today);
            // Normalize dates to midnight UTC for accurate day difference calculation
            lastDate.setUTCHours(0, 0, 0, 0);
            currentDate.setUTCHours(0, 0, 0, 0);
            const timeDiff = currentDate.getTime() - lastDate.getTime();
            const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));

            if (dayDiff === 1) {
                 // Only increment if it's the *next* day
                 if (state.streak === 0) state.streak = 1; // Start streak if it was 0
                 state.streak++;
                 streakUpdated = true;
                 console.log("Streak increased to:", state.streak);
            } else if (dayDiff > 1) {
                 // Reset streak if gap is > 1 day
                 state.streak = taskLoggedToday ? 1 : 0; // Start at 1 if logging task, else 0
                 streakUpdated = true;
                  console.log("Streak reset to:", state.streak);
            } else if (dayDiff === 0 && state.streak === 0 && taskLoggedToday) {
                 // First task ever, or first task after a long break on the same day
                 state.streak = 1;
                 streakUpdated = true;
                 console.log("Streak started at 1 today");
            }
             // If dayDiff is 0 and streak > 0, do nothing to streak count
              // If dayDiff < 0 (time travel?), ignore

        } else if (taskLoggedToday) {
            // First time ever logging in and logging a task
            state.streak = 1;
             streakUpdated = true;
            console.log("First ever task, streak started at 1");
        }

        // Update lastLoginDate if it's a new day OR if streak was just started/incremented
         if (state.lastLoginDate !== today || streakUpdated) {
             state.lastLoginDate = today;
         }

        // Check streak rewards if streak was updated
        if (streakUpdated) {
             checkMilestones(); // Check rewards related to streak
        }
    }


    function getCurrentStageKey() { // Helper to get the threshold key
        let currentStageKey = 0;
        for (const threshold of STAGE_THRESHOLDS) {
            if (state.points >= threshold) {
                currentStageKey = threshold;
            } else {
                break;
            }
        }
        return currentStageKey;
    }

    function getCurrentStage() { // No change needed
        return PLANT_STAGES[getCurrentStageKey()];
    }

    function getNextStage() { // No change needed
        const currentKeyIndex = STAGE_THRESHOLDS.indexOf(getCurrentStageKey());
        const nextThreshold = STAGE_THRESHOLDS[currentKeyIndex + 1];
        return nextThreshold ? { threshold: nextThreshold, ...PLANT_STAGES[nextThreshold] } : null;
    }

    function checkMilestones() { // Modified to handle point bonuses
        const previousStageName = plantStageName.textContent.replace('Stage: ', '');
        const currentStageKey = getCurrentStageKey();
        const newStage = PLANT_STAGES[currentStageKey];

        // 1. Stage Up
        if (newStage.name !== previousStageName && previousStageName !== '...') {
            showMilestoneCelebration(`Reached ${newStage.name} stage! 🌱`);
            plantImage.style.transform = 'scale(1.15)'; // Bigger boost
            setTimeout(() => { plantImage.style.transform = 'scale(1)'; }, 600);
             displayCareTip(newStage.tip); // Show stage tip on level up
        }

        // 2. Other Rewards
        for (const key in REWARDS) {
            const reward = REWARDS[key];
            if (state.unlockedRewards.includes(key)) continue; // Use reward key for uniqueness

            let conditionMet = false;
            if (key.startsWith('streak_') && state.streak >= parseInt(key.split('_')[1])) {
                conditionMet = true;
            } else if (key.startsWith('points_') && state.points >= parseInt(key.split('_')[1])) {
                conditionMet = true;
            } else if (key.startsWith('stage_') && newStage.name === key.split('_')[1]) {
                conditionMet = true;
            }

            if (conditionMet) {
                state.unlockedRewards.push(key); // Store the reward key
                showMilestoneCelebration(reward.message);
                console.log("Reward Unlocked:", key, reward.value);

                 // Apply reward effect
                 if (reward.type === 'bonus_points') {
                     state.points += reward.value;
                     // Show feedback for point gain, but maybe delayed slightly after celebration
                     setTimeout(() => showTaskFeedback(`Bonus: +${reward.value} points!`, false, true), 500);
                 }
                 // Visual rewards like themes/decorations are handled in updateUI
            }
        }
         // Update UI potentially needed if points changed
         updateUI();
    }

    function triggerRandomEvent(overrideProbability = null) { // NEW
        const randomValue = Math.random();
        let cumulativeProb = 0;

        for (const event of RANDOM_EVENTS) {
             const probability = overrideProbability ?? event.probability; // Use override if provided
             cumulativeProb += probability;
            if (randomValue < cumulativeProb) {
                if (event.points > 0) {
                    state.points += event.points;
                }
                showTaskFeedback(event.message, false, true); // Mark as event type feedback
                console.log("Random Event Triggered:", event.message);
                updateUI(); // Update points display if needed
                 saveState(); // Save after event changes state
                break; // Only trigger one event
            }
        }
    }

    function checkPlantStatus() { // NEW
        plantStatusMessage.textContent = ''; // Clear previous message
        plantStatusMessage.classList.remove('warning');
        if (!state.lastTaskTimestamp) {
            if (state.points > 0) { // Only show if they've started
                 plantStatusMessage.textContent = "Log a task to keep your plant happy!";
            }
            return;
        }

        const now = new Date();
        const lastTaskDate = new Date(state.lastTaskTimestamp);
        const hoursSinceLastTask = (now.getTime() - lastTaskDate.getTime()) / (1000 * 3600);

        if (hoursSinceLastTask > NEGLECT_THRESHOLD_HOURS) {
            plantStatusMessage.textContent = "Plant looks thirsty! Log a task soon.";
            plantStatusMessage.classList.add('warning');
            // Optional: Slightly change plant animation (e.g., slow down sway)
            // plantImage.style.animationDuration = '8s';
        } else {
            // Optional: Reset animation speed if it was changed
             // plantImage.style.animationDuration = '6s';
        }
    }

    function displayCareTip(tip = null) { // NEW
        if (!tip) {
            // Default tip if none provided (e.g., based on current stage)
            tip = PLANT_STAGES[getCurrentStageKey()].tip || "Keep up the great work!";
        }
        if (careTipsContainer) {
             careTipsContainer.textContent = tip;
             careTipsContainer.parentElement.classList.remove('hidden'); // Ensure card is visible
        }
    }

    // --- UI Updates (Enhanced) ---

    function updateUI() {
        // Points, Stage, Image (mostly existing logic)
        pointsDisplay.textContent = `Points: ${state.points}`;
        const currentStage = getCurrentStage();
        plantStageName.textContent = `Stage: ${currentStage.name}`;
        const imagePath = `assets/${state.plantType}/${state.plantType}${currentStage.image}`;
        if(plantImage.src !== imagePath) { // Avoid unnecessary reloads if image is same
             plantImage.src = imagePath;
             plantImage.alt = `${state.plantType} - ${currentStage.name}`;
        }


        // Progress Bar (existing logic)
        const nextStage = getNextStage();
        if (nextStage) {
            // Find the threshold key for the *start* of the current stage
            const currentStageStartThreshold = STAGE_THRESHOLDS[STAGE_THRESHOLDS.indexOf(nextStage.threshold) - 1] || 0;
             const pointsInCurrentStage = Math.max(0, state.points - currentStageStartThreshold);
            const pointsNeededForNext = nextStage.threshold - currentStageStartThreshold;
            const progressPercentage = Math.min(100, Math.max(0, (pointsInCurrentStage / pointsNeededForNext) * 100));

            progressBarFill.style.width = `${progressPercentage}%`;
            progressBarFill.style.background = ''; // Reset to CSS variable default
            progressText.textContent = `${pointsInCurrentStage}/${pointsNeededForNext} to ${nextStage.name}`;
        } else {
            progressBarFill.style.width = '100%';
            progressBarFill.style.background = 'gold'; // Max stage indication
            progressText.textContent = 'Max Stage Reached! 🎉';
        }

        // Task History
        renderHistory();

        // Stats (enhanced)
        updateStats();

        // Settings Modal Values
        settingPlantTypeSelect.value = state.plantType;
        settingBackgroundThemeSelect.value = state.backgroundTheme;

        // Unlocked Rewards Visuals
        applyRewardsVisuals();

        // Plant Status (NEW)
        checkPlantStatus();

        // Default Care Tip if none shown recently (NEW)
        if (careTipsContainer && careTipsContainer.textContent.includes("Log tasks")) {
             displayCareTip(); // Show default stage tip
        } else if (!careTipsContainer) {
             // If the element wasn't found initially, try showing default tip anyway
             displayCareTip();
        }


        console.log("UI Updated");
    }

    function renderHistory() { // Minor tweak for clarity
        historyList.innerHTML = '';
        if (state.taskHistory.length === 0) {
            historyList.innerHTML = '<li>No tasks logged yet.</li>';
            return;
        }
        const reversedHistory = [...state.taskHistory].reverse();
        reversedHistory.slice(0, 75).forEach(item => { // Show more history
            const li = document.createElement('li');
            const taskDate = new Date(item.timestamp);
            const formattedTime = taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedDate = taskDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

            li.innerHTML = `
                <span>${item.taskName} (+${item.points} pts)</span>
                <span class="task-time">${formattedDate} ${formattedTime}</span>
            `; // Use spans for better layout control
            historyList.appendChild(li);
        });
    }

    function updateStats() { // Enhanced Stats
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0,0,0,0); // Start of the day 7 days ago

        let tasksToday = 0;
        let tasksWeek = 0;
        let totalDaysWithTasks = 0;
        const taskDates = new Set(); // Use a Set to count unique days

        state.taskHistory.forEach(task => {
            const taskDate = new Date(task.timestamp);
            const taskDateString = taskDate.toISOString().split('T')[0];
            taskDates.add(taskDateString); // Add date string to Set

            if (taskDateString === today) {
                tasksToday++;
            }
            if (taskDate >= oneWeekAgo) {
                tasksWeek++;
            }
        });

        totalDaysWithTasks = taskDates.size;

        // Calculate Averages (avoid division by zero)
        const avgPointsPerDay = totalDaysWithTasks > 0 ? (state.points / totalDaysWithTasks).toFixed(1) : 0;
        const avgTasksPerDay = totalDaysWithTasks > 0 ? (state.taskHistory.length / totalDaysWithTasks).toFixed(1) : 0;


        streakDisplay.textContent = state.streak;
        totalPointsDisplay.textContent = state.points;
        todayTasksDisplay.textContent = tasksToday;
        weekTasksDisplay.textContent = tasksWeek;
        // Update NEW stats elements
         if(avgPointsDayDisplay) avgPointsDayDisplay.textContent = avgPointsPerDay;
         if(avgTasksDayDisplay) avgTasksDayDisplay.textContent = avgTasksPerDay;
    }


    function applyTheme() { // No change needed
        appBody.className = `theme-${state.backgroundTheme}`;
    }

    function applyRewardsVisuals() { // Modified for reward key check
        // Clear existing decorations
        plantImageContainer.querySelectorAll('.decoration').forEach(el => el.remove());
        plantImageContainer.classList.remove('fancy-pot'); // Clear class-based rewards

        state.unlockedRewards.forEach(rewardKey => {
            const rewardInfo = REWARDS[rewardKey];
             if (rewardInfo && rewardInfo.type === 'decoration') {
                 if (rewardInfo.value === 'butterfly') {
                    const butterfly = document.createElement('div');
                    butterfly.className = 'decoration decoration-butterfly visible';
                    plantImageContainer.appendChild(butterfly);
                 } else if (rewardInfo.value === 'pot-upgrade') {
                      plantImageContainer.classList.add('fancy-pot'); // Needs corresponding CSS
                 }
                 // Add more decoration types here
             } else if (rewardInfo && rewardInfo.type === 'theme') {
                 // Theme unlocking logic is handled elsewhere (e.g., enabling in settings)
                 // Or we could add an indicator maybe? For now, just log it.
                 console.log(`Visual check: Theme ${rewardInfo.value} unlocked.`);
             }
        });

         // Ensure available themes are selectable in settings
         updateThemeOptions();
    }

    function updateThemeOptions() { // NEW: Enable unlocked themes in dropdowns
         const themeOptions = document.querySelectorAll('#setup-background-theme option, #setting-background-theme option');
         themeOptions.forEach(option => {
             if (option.value !== 'sunny' && option.value !== 'indoor') { // Keep defaults always available
                 const isUnlocked = state.unlockedRewards.some(key => REWARDS[key]?.type === 'theme' && REWARDS[key]?.value === option.value);
                 option.disabled = !isUnlocked;
                 option.textContent = isUnlocked ? option.textContent.replace(' (Locked)', '') : `${option.textContent.replace(' (Locked)', '')} (Locked)`;
             } else {
                 option.disabled = false; // Ensure defaults are enabled
                 option.textContent = option.textContent.replace(' (Locked)', '');
             }
         });
     }

    function showTaskFeedback(message, isError = false, isEvent = false) { // Modified
        taskFeedback.textContent = message;
        taskFeedback.classList.remove('error', 'event'); // Reset classes
        if (isError) {
            taskFeedback.classList.add('error'); // Needs CSS for .error
             taskFeedback.style.color = '#d9534f'; // Simple red color
        } else if (isEvent) {
             taskFeedback.classList.add('event'); // Uses .event color from CSS
        } else {
              taskFeedback.style.color = '#4cae4c'; // Default success color
        }

        taskFeedback.classList.add('show');
        setTimeout(() => {
            taskFeedback.classList.remove('show');
        }, isEvent || isError ? 3500 : 2500); // Show events/errors slightly longer
    }

    function showMilestoneCelebration(message) { // Slight visual enhancement
        milestoneText.innerHTML = message; // Allow basic HTML like 🌱
        milestoneCelebration.classList.remove('hidden');
        // Delay adding visible class slightly for better transition initialization
        requestAnimationFrame(() => {
             milestoneCelebration.classList.add('visible');
        });


        // Optional: Add confetti effect here (requires a library or complex CSS)
        // Example using a simple CSS approach (add this class in CSS)
        // milestoneCelebration.classList.add('confetti-effect');

        setTimeout(() => {
            milestoneCelebration.classList.remove('visible');
             // milestoneCelebration.classList.remove('confetti-effect');
            // Add delay before hiding completely for fade out transition
            setTimeout(() => {
                 milestoneCelebration.classList.add('hidden');
            }, 500); // Match CSS transition duration
        }, 3000); // Show for 3 seconds
    }


    // --- Event Listeners (Mostly Existing, Added Reset Confirmation Detail) ---
    function addEventListeners() {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedTaskKey = taskSelect.value;
            logTask(selectedTaskKey);
            taskForm.reset();
        });

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                 // Animate pane switching (using CSS animation defined earlier)
                 tabPanes.forEach(pane => {
                      const paneTarget = pane.id.split('-')[0]; // e.g., 'tasks' from 'tasks-content'
                      if(paneTarget === targetTab) {
                          pane.classList.remove('hidden');
                      } else {
                           pane.classList.add('hidden');
                      }
                 });

                 // Toggle Task area visibility based on tab
                const taskAreaCard = document.querySelector('.task-area.card');
                if (targetTab === 'tasks') {
                     taskAreaCard.classList.remove('hidden');
                     taskAreaCard.style.opacity = '1';
                     taskAreaCard.style.transform = 'translateY(0)';
                 } else {
                      taskAreaCard.style.opacity = '0';
                      taskAreaCard.style.transform = 'translateY(10px)';
                     // Add a slight delay before hiding completely to allow fade out
                      setTimeout(() => {
                         if(!document.querySelector('.tab-button[data-tab="tasks"]').classList.contains('active')) {
                            taskAreaCard.classList.add('hidden');
                         }
                      }, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--transition-speed') || '0.3') * 1000);
                 }

                  // Show default care tip when switching to stats tab if needed
                  if (targetTab === 'stats' && careTipsContainer) {
                      displayCareTip();
                 }
            });
        });

        settingsButton.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            updateThemeOptions(); // Ensure theme options are up-to-date when opening settings
        });

        closeSettingsButton.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.add('hidden');
            }
        });

        settingPlantTypeSelect.addEventListener('change', (e) => {
            state.plantType = e.target.value;
            updateUI();
            saveState();
        });
        settingBackgroundThemeSelect.addEventListener('change', (e) => {
            state.backgroundTheme = e.target.value;
            applyTheme();
            saveState();
        });

        resetDataButton.addEventListener('click', () => {
            const confirmation = prompt("This will delete ALL progress, points, and unlocks. Type 'RESET' to confirm.");
            if (confirmation === "RESET") {
                localStorage.removeItem(STORAGE_KEY);
                // Reset state object fully
                 state = {
                    points: 0, plantType: 'bonsai', backgroundTheme: 'sunny',
                    taskHistory: [], lastLoginDate: null, lastTaskTimestamp: null,
                    streak: 0, unlockedRewards: [], setupComplete: false, dailyBonusClaimedDate: null
                };
                window.location.reload();
            } else {
                 alert("Reset cancelled.");
            }
        });
    }

    // --- Run Initialization ---
    init();

}); // End DOMContentLoaded
import { wordData } from './words.js';

// State
let players = [];
let imposterCount = 1;
let playerCount = 3;
let currentPlayerIndex = 0;
let currentWord = "";
let currentCategory = "General";
let timerInterval;

// DOM Elements
const screens = {
    setup: document.getElementById('setup-screen'),
    reveal: document.getElementById('reveal-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const ui = {
    playerCount: document.getElementById('player-count'),
    imposterCount: document.getElementById('imposter-count'),
    categorySelect: document.getElementById('category-select'),
    currentPlayerNum: document.getElementById('current-player-num'),
    roleCard: document.getElementById('role-card'),
    roleText: document.getElementById('role-text'),
    roleSubtext: document.getElementById('role-subtext'),
    timer: document.getElementById('timer'),
    resultDetails: document.getElementById('result-details')
};

// Utils
function showScreen(screenName) {
    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    screens[screenName].classList.remove('hidden');
    screens[screenName].classList.add('active');
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Setup
function init() {
    // Populate Categories
    const randomOption = document.createElement('option');
    randomOption.value = 'Random';
    randomOption.textContent = 'Random (ဘယ်အရာမဆို)';
    ui.categorySelect.appendChild(randomOption);

    Object.keys(wordData).forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        ui.categorySelect.appendChild(option);
    });

    // Event Listeners
    document.getElementById('btn-player-minus').addEventListener('click', () => updateCounts(-1, 0));
    document.getElementById('btn-player-plus').addEventListener('click', () => updateCounts(1, 0));
    document.getElementById('btn-imposter-minus').addEventListener('click', () => updateCounts(0, -1));
    document.getElementById('btn-imposter-plus').addEventListener('click', () => updateCounts(0, 1));

    document.getElementById('btn-start').addEventListener('click', startGame);
    ui.roleCard.addEventListener('click', revealRole);
    document.getElementById('btn-next-player').addEventListener('click', (e) => {
        e.stopPropagation();
        nextPlayer();
    });

    document.getElementById('btn-end-game').addEventListener('click', endGame);
    document.getElementById('btn-play-again').addEventListener('click', resetGame);
}

function updateCounts(playerChg, imposterChg) {
    let newPlayers = playerCount + playerChg;
    let newImposters = imposterCount + imposterChg;

    if (newPlayers < 3) newPlayers = 3;
    if (newPlayers > 20) newPlayers = 20;

    // Imposters must be less than half of players (roughly)
    if (newImposters < 1) newImposters = 1;
    if (newImposters >= newPlayers / 2) newImposters = Math.floor((newPlayers - 1) / 2);

    playerCount = newPlayers;
    imposterCount = newImposters;

    ui.playerCount.textContent = playerCount;
    ui.imposterCount.textContent = imposterCount;
}

// Game Logic
function startGame() {
    let selectedCategory = ui.categorySelect.value;

    if (selectedCategory === 'Random') {
        const categories = Object.keys(wordData);
        selectedCategory = getRandomItem(categories);
    }

    currentCategory = selectedCategory;
    const words = wordData[currentCategory];
    currentWord = getRandomItem(words);

    // Create role distribution
    let roles = Array(playerCount).fill('Civilian');
    for (let i = 0; i < imposterCount; i++) {
        roles[i] = 'Imposter';
    }

    // Fisher-Yates Shuffle
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Create players with assigned roles
    players = roles.map((role, i) => ({
        id: i + 1,
        isImposter: role === 'Imposter',
        word: role === 'Imposter' ? "Imposter" : currentWord
    }));

    currentPlayerIndex = 0;
    prepareTurn();
    showScreen('reveal');
}

function prepareTurn() {
    ui.currentPlayerNum.textContent = players[currentPlayerIndex].id;
    ui.roleCard.classList.remove('flipped');
    // Hide buttons initially? No, handled by flip
}

function revealRole() {
    if (ui.roleCard.classList.contains('flipped')) return;

    const player = players[currentPlayerIndex];

    if (player.isImposter) {
        ui.roleText.textContent = "IMPOSTER";
        ui.roleText.style.color = "var(--danger-color)";
        ui.roleSubtext.textContent = "Blend in! Don't get caught.";
    } else {
        ui.roleText.textContent = player.word;
        ui.roleText.style.color = "var(--primary-color)";
        ui.roleSubtext.textContent = `Category: ${currentCategory}`;
    }

    ui.roleCard.classList.add('flipped');
}

function nextPlayer() {
    currentPlayerIndex++;
    if (currentPlayerIndex >= playerCount) {
        startPlaying();
    } else {
        prepareTurn();
    }
}

function startPlaying() {
    showScreen('game');
    startTimer();
}

function startTimer() {
    let seconds = 0;
    ui.timer.textContent = "00:00";
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        seconds++;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        ui.timer.textContent = `${m}:${s}`;
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);

    const imposters = players.filter(p => p.isImposter);

    let html = `
        <h2 style="color: var(--text-muted); font-size: 1rem; margin-bottom: 2rem;">Hidden Word was: <br><span style="color: var(--text-color); font-size: 1.5rem;">${currentWord}</span></h2>
        <div class="result-list">
    `;

    imposters.forEach(imp => {
        html += `<div class="result-role">Player ${imp.id} was the Imposter! 😈</div>`;
    });

    html += `</div>`;

    ui.resultDetails.innerHTML = html;
    showScreen('result');
}

function resetGame() {
    showScreen('setup');
}

// Initialize
init();

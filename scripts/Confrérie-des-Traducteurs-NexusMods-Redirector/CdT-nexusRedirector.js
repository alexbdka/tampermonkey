// ==UserScript==
// @name         Confrérie des Traducteurs - NexusMods Redirector
// @namespace    https://discord.gg/sJDzeCZCa3
// @version      1.2.1
// @description  Find French translations of NexusMods mods on Confrérie des Traducteurs
// @author       chunchunmaru (alexbdka)
// @icon         https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png
// @match        https://www.nexusmods.com/skyrimspecialedition/*
// @match        https://www.nexusmods.com/skyrim/*
// @match        https://www.nexusmods.com/oblivion/*
// @match        https://www.nexusmods.com/morrowind/*
// @match        https://www.nexusmods.com/fallout4/*
// @match        https://www.nexusmods.com/newvegas/*
// @match        https://www.nexusmods.com/fallout3/*
// @grant        GM_xmlhttpRequest
// @connect      www.confrerie-des-traducteurs.fr
// ==/UserScript==

(function() {
    'use strict';

    // Extract game category from URL
    const gameCategory = window.location.pathname.split('/')[1];
    
    // Determine search base URL and game parameters based on game category
    const searchBaseUrl = getSearchBaseUrl(gameCategory);
    const gameParams = getGameParams(gameCategory);

    // Extract mod title and author
    const modTitle = document.querySelector("#pagetitle > h1").innerText.trim();
    const modAuthor = document.querySelector("#fileinfo > div:nth-child(5) > a").innerText.trim();

    // Create and append button container
    const buttonContainer = createButtonContainer();
    document.body.appendChild(buttonContainer);

    // Add click event listener to search button
    buttonContainer.querySelector('button').addEventListener('click', () => {
        const button = buttonContainer.querySelector('button');
        button.disabled = true;
        searchModOnConfrerie(modTitle, modAuthor, button);
    });

    /**
     * Get the base search URL for the specific game
     * @param {string} gameCategory - The game category from the URL
     * @returns {string} Search base URL for the game
     */
    function getSearchBaseUrl(gameCategory) {
        const gameUrlMap = {
            'skyrimspecialedition': "https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple",
            'skyrim': "https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple",
            'oblivion': "https://www.confrerie-des-traducteurs.fr/oblivion/recherche/simple",
            'morrowind': "https://www.confrerie-des-traducteurs.fr/morrowind/recherche/simple",
            'fallout4': "https://www.confrerie-des-traducteurs.fr/fallout4/recherche/simple",
            'newvegas': "https://www.confrerie-des-traducteurs.fr/fallout-new-vegas/recherche/simple",
            'fallout3': "https://www.confrerie-des-traducteurs.fr/fallout3/recherche/simple"
        };
        return gameUrlMap[gameCategory] || gameUrlMap['skyrim'];
    }

    /**
     * Get game-specific search parameters
     * @param {string} gameCategory - The game category from the URL
     * @returns {Object} Game-specific search parameters
     */
    function getGameParams(gameCategory) {
        return gameCategory.includes("skyrimspecialedition")
            ? { skyrim: 0, skyrimSE: 1 }
            : gameCategory.includes("skyrim")
            ? { skyrim: 1, skyrimSE: 0 }
            : {};
    }

    /**
     * Create the button container for searching translations
     * @returns {HTMLElement} Button container element
     */
    function createButtonContainer() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';

        const button = document.createElement('button');
        button.innerHTML = `
            <span style="display: flex; align-items: center; font-family: 'Brush Script MT', cursive; color: #4b3929;">
                <img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" alt="Confrérie" style="vertical-align: middle; width: 40px; height: 40px; margin-right: 10px;">
                Traduction<br>Française
            </span>
        `;
        button.style.margin = '5px';
        button.style.padding = '15px 20px';
        button.style.backgroundColor = '#e6ccaa';
        button.style.color = '#4b3929';
        button.style.border = '2px solid #4b3929';
        button.style.borderRadius = '10px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';

        container.appendChild(button);
        return container;
    }

    /**
     * Search for mod translation on Confrérie des Traducteurs
     * @param {string} modTitle - Title of the mod
     * @param {string} modAuthor - Author of the mod
     * @param {HTMLButtonElement} button - Button to update after search
     */
    function searchModOnConfrerie(modTitle, modAuthor, button) {
        const params = new URLSearchParams({
            term: modTitle.replace(/\s+/g, "_"),
            authors: 0,
            name: 1,
            nameVO: 1,
            description: 0,
            ...gameParams
        });

        GM_xmlhttpRequest({
            method: "POST",
            url: searchBaseUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: params.toString(),
            onload: (response) => {
                if (response.status === 200) {
                    handleSearchResponse(response.responseText, modTitle, modAuthor, button);
                } else {
                    console.error(`[ERROR] Search failed with status: ${response.status}`);
                    updateButtonState(button, 'error');
                }
            },
            onerror: () => {
                console.error("[ERROR] Error during search");
                updateButtonState(button, 'error');
            }
        });
    }

    /**
     * Handle search response from Confrérie des Traducteurs
     * @param {string} responseText - Response from the search request
     * @param {string} modTitle - Title of the mod
     * @param {string} modAuthor - Author of the mod
     * @param {HTMLButtonElement} button - Button to update after search
     */
    function handleSearchResponse(responseText, modTitle, modAuthor, button) {
        const data = JSON.parse(responseText);
        const possibleMods = data.Entries.map(entry => ({ name: entry.OriginalName, link: entry.Link }));
        const bestMatch = findBestMatch(modTitle, possibleMods);

        if (bestMatch) {
            const translationLink = "https://www.confrerie-des-traducteurs.fr" + bestMatch.link;
            window.open(translationLink, "_blank");
            updateButtonState(button, 'success');
        } else {
            searchByAuthor(modAuthor, modTitle, button);
        }
    }

    /**
     * Search for translation by mod author
     * @param {string} modAuthor - Author of the mod
     * @param {string} modTitle - Title of the mod
     * @param {HTMLButtonElement} button - Button to update after search
     */
    function searchByAuthor(modAuthor, modTitle, button) {
        const params = new URLSearchParams({
            term: modAuthor,
            authors: 1,
            name: 0,
            nameVO: 0,
            description: 0,
            ...gameParams
        });

        GM_xmlhttpRequest({
            method: "POST",
            url: searchBaseUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: params.toString(),
            onload: (response) => {
                if (response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    const possibleMods = data.Entries.map(entry => ({ name: entry.OriginalName, link: entry.Link }));
                    const bestMatch = findBestMatch(modTitle, possibleMods);

                    if (bestMatch) {
                        const translationLink = "https://www.confrerie-des-traducteurs.fr" + bestMatch.link;
                        window.open(translationLink, "_blank");
                        updateButtonState(button, 'success');
                    } else {
                        updateButtonState(button, 'not-found');
                    }
                } else {
                    console.error(`[ERROR] Author search failed with status: ${response.status}`);
                    updateButtonState(button, 'error');
                }
            },
            onerror: () => {
                console.error("[ERROR] Error during author search");
                updateButtonState(button, 'error');
            }
        });
    }

    /**
     * Find the best match for a mod title
     * @param {string} modTitle - Title of the mod
     * @param {Array} possibleMods - List of possible matching mods
     * @returns {Object|null} Best matching mod or null
     */
    function findBestMatch(modTitle, possibleMods) {
        let bestMatch = null;
        let lowestRatio = 1;

        for (const mod of possibleMods) {
            const distance = levenshteinDistance(modTitle, mod.name);
            const ratio = distance / Math.max(modTitle.length, mod.name.length);
            if (ratio <= 0.35 && ratio < lowestRatio) {
                lowestRatio = ratio;
                bestMatch = mod;
            }
        }

        return bestMatch;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {number} Levenshtein distance
     */
    function levenshteinDistance(a, b) {
        const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                matrix[i][j] = b[i - 1] === a[j - 1]
                    ? matrix[i - 1][j - 1]
                    : Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Update the button state based on search results
     * @param {HTMLButtonElement} button - Button to update
     * @param {string} state - State of the search ('success', 'not-found', 'error')
     */
    function updateButtonState(button, state) {
        button.disabled = false;
        button.style.backgroundColor = state === 'success' ? '#5cb85c'
            : state === 'not-found' ? '#f0ad4e'
            : '#d9534f';
        button.innerHTML = state === 'success' ? 'Traduction trouvée !'
            : state === 'not-found' ? 'Pas de traduction'
            : 'Erreur';
    }
})();

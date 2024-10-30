// ==UserScript==
// @name         Confrérie des Traducteurs - Nexusmods Redirector
// @namespace    https://discord.gg/sJDzeCZCa3
// @version      1.0
// @description  Adds a button to find the French-translated version of a NexusMods mod on Confrérie des Traducteurs.
// @author       chunchunmaru - alexbdka
// @icon         https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png
// @match        https://www.nexusmods.com/skyrim/*
// @match        https://www.nexusmods.com/skyrimspecialedition/*
// @match        https://www.nexusmods.com/fallout4/*
// @grant        GM_xmlhttpRequest
// @connect      www.confrerie-des-traducteurs.fr
// ==/UserScript==

(function() {
    'use strict';

    // Retrieve the mod title and author from the NexusMods page
    const modTitle = document.querySelector("#pagetitle > h1").innerText.trim();
    const modAuthor = document.querySelector("#fileinfo > div:nth-child(5) > a").innerText.trim();

    // Determine the game category (Skyrim or Fallout 4) from the current URL path
    const gameCategory = window.location.pathname.split('/')[1];

    // Base search URL for Confrérie des Traducteurs, adjusted based on the game category
    let searchBaseUrl = (gameCategory.includes('skyrim'))
        ? 'https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple'
        : 'https://www.confrerie-des-traducteurs.fr/fallout4/recherche/simple';

    // Initialize parameters for the appropriate game search
    let gameParams = {};
    if (gameCategory.includes("fallout4")) {
        gameParams = { fallout4: 1 };  // Fallout 4 specific params
    } else if (gameCategory.includes("skyrimspecialedition")) {
        gameParams = { skyrim: 0, skyrimSE: 1 };  // Skyrim Special Edition specific params
    } else if (gameCategory.includes("skyrim")) {
        gameParams = { skyrim: 1, skyrimSE: 0 };  // Skyrim LE specific params
    }

    // Identify the container where the translation button will be added (NexusMods page)
    const actionsContainer = document.querySelector("#pagetitle > ul.modactions.clearfix");
    if (actionsContainer) {
        const buttonContainer = createFixedButtonContainer();
        document.body.appendChild(buttonContainer);
    }

    /**
     * Creates a container with a button that stays fixed at the bottom-right of the page.
     * @returns {HTMLElement} The button container element.
     */
    function createFixedButtonContainer() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '1000';

        // Create a button with a Confrérie logo and text
        const button = document.createElement('button');
        button.innerHTML = `
            <span style="display: flex; align-items: center; font-family: 'Brush Script MT', cursive;">
                <img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" alt="Confrérie" style="vertical-align: middle; width: 40px; height: 40px; margin-right: 10px;">
                Rechercher<br>une<br>Traduction
            </span>
        `;
        button.style.margin = '5px';
        button.style.padding = '15px';
        button.style.backgroundColor = '#e6ccaa';
        button.style.color = '#333';
        button.style.border = '2px solid #4b3929';
        button.style.borderRadius = '10px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';

        // Add click event to initiate the mod search on Confrérie when the button is clicked
        button.addEventListener('click', function() {
            button.innerHTML = "Recherche en cours...";
            searchModOnConfrerie(modTitle, modAuthor, button);
        });

        buttonContainer.appendChild(button);
        return buttonContainer;
    }

    /**
     * Initiates the search for the mod on Confrérie des Traducteurs.
     * It uses the mod title and author retrieved from NexusMods.
     * @param {string} modTitle - The mod's title on NexusMods.
     * @param {string} modAuthor - The mod's author on NexusMods.
     * @param {HTMLElement} button - Button element to update its state during the search.
     */
    function searchModOnConfrerie(modTitle, modAuthor, button) {
        console.log(`[INFO] Searching by title: ${modTitle}`);

        // Construct search parameters for Confrérie des Traducteurs based on the mod title
        const params = new URLSearchParams({
            term: modTitle.replace(/\s+/g, "_"), // Replace spaces with underscores for the query
            authors: 0,
            name: 1,
            nameVO: 1,
            description: 0,
            ...gameParams  // Include game-specific params (e.g., Fallout 4, Skyrim)
        });

        // Make an HTTP request to Confrérie's search endpoint
        GM_xmlhttpRequest({
            method: "POST",
            url: searchBaseUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: params.toString(),
            onload: function(response) {
                if (response.status === 200) {
                    handleSearchResponse(response.responseText, modTitle, modAuthor, button);
                } else {
                    console.error("[ERROR] Search failed with status: ", response.status);
                    button.style.backgroundColor = '#d9534f';
                    button.innerHTML = "Erreur";
                }
            },
            onerror: function() {
                console.error("[ERROR] Error during search");
                button.style.backgroundColor = '#d9534f';
                button.innerHTML = "Erreur";
            }
        });
    }

    /**
     * Processes the search response from Confrérie des Traducteurs.
     * If no exact match is found, it will attempt to search by the mod author.
     * @param {string} responseText - The raw response text from the Confrérie search.
     * @param {string} modTitle - The mod's title from NexusMods.
     * @param {string} modAuthor - The mod's author from NexusMods.
     * @param {HTMLElement} button - Button element to update its state after processing the result.
     */
    function handleSearchResponse(responseText, modTitle, modAuthor, button) {
        const data = JSON.parse(responseText);
        if (data.Count > 0) {
            const possibleMods = data.Entries.map(entry => ({ name: entry.OriginalName, link: entry.Link }));
            const bestMatch = findBestLevenshteinMatch(modTitle, possibleMods);
            if (bestMatch) {
                const translationLink = "https://www.confrerie-des-traducteurs.fr" + bestMatch.link;
                window.open(translationLink, "_blank");
                button.style.backgroundColor = '#5cb85c';
                button.innerHTML = "Traduction trouvée !";
            } else {
                searchByAuthor(modAuthor, modTitle, button);  // Fallback to author search
            }
        } else {
            searchByAuthor(modAuthor, modTitle, button);  // Fallback to author search
        }
    }

    /**
     * If no mods were found by title, attempts a search by author.
     * @param {string} modAuthor - The mod's author from NexusMods.
     * @param {string} modTitle - The mod's title from NexusMods.
     * @param {HTMLElement} button - Button element to update its state.
     */
    function searchByAuthor(modAuthor, modTitle, button) {
        console.log(`[INFO] Searching by author: ${modAuthor}`);

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
            onload: function(response) {
                if (response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    if (data.Count > 0) {
                        console.log("[INFO] Mods found by author: ", data.Entries);
                        const possibleMods = data.Entries.map(entry => ({ name: entry.OriginalName, link: entry.Link }));
                        const bestMatch = findBestLevenshteinMatch(modTitle, possibleMods);
                        if (bestMatch) {
                            const translationLink = "https://www.confrerie-des-traducteurs.fr" + bestMatch.link;
                            window.open(translationLink, "_blank");
                            button.style.backgroundColor = '#5cb85c';
                            button.innerHTML = "Traduction trouvée !";
                        } else {
                            button.style.backgroundColor = '#f0ad4e';
                            button.innerHTML = "Pas de traduction";
                        }
                    } else {
                        button.style.backgroundColor = '#f0ad4e';
                        button.innerHTML = "Pas de traduction";
                    }
                } else {
                    console.error("[ERROR] Author search failed with status: ", response.status);
                    button.style.backgroundColor = '#d9534f';
                    button.innerHTML = "Erreur";
                }
            },
            onerror: function() {
                console.error("[ERROR] Error during author search");
                button.style.backgroundColor = '#d9534f';
                button.innerHTML = "Erreur";
            }
        });
    }

    /**
     * Finds the best match from a list of mods using the Levenshtein distance.
     * @param {string} modTitle - The original mod title.
     * @param {Array<Object>} possibleMods - An array of possible mod results from Confrérie.
     * @returns {Object|null} The mod with the closest match to the modTitle.
     */
    function findBestLevenshteinMatch(modTitle, possibleMods) {
        let bestMatch = null;
        let lowestDistance = Infinity;

        possibleMods.forEach(mod => {
            const distance = levenshteinDistance(modTitle, mod.name);
            if (distance < lowestDistance) {
                lowestDistance = distance;
                bestMatch = mod;
            }
        });

        return (lowestDistance <= 5) ? bestMatch : null;  // Adjust distance threshold if needed
    }

    /**
     * Computes the Levenshtein distance between two strings.
     * @param {string} a - First string.
     * @param {string} b - Second string.
     * @returns {number} The computed Levenshtein distance.
     */
    function levenshteinDistance(a, b) {
        const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i - 1] === a[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }

        return matrix[b.length][a.length];
    }
})();

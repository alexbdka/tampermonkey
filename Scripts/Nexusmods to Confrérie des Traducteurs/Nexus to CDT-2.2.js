// ==UserScript==
// @name         Nexusmods to Confrérie des Traducteurs
// @namespace    https://discord.gg/sJDzeCZCa3
// @version      2.2
// @description  Ajoute un bouton pour trouver la version française d'un mod de Nexusmods sur la Confrérie des Traducteurs.
// @author       chunchunmaru - alex6
// @icon         https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png
// @match        https://www.nexusmods.com/skyrim/*
// @match        https://www.nexusmods.com/skyrimspecialedition/*
// @match        https://www.nexusmods.com/fallout4/*
// @grant        GM_xmlhttpRequest
// @connect      www.confrerie-des-traducteurs.fr
// @downloadURL  https://update.greasyfork.org/scripts/512982/Nexusmods%20to%20Confr%C3%A9rie%20des%20Traducteurs.user.js
// @updateURL    https://update.greasyfork.org/scripts/512982/Nexusmods%20to%20Confr%C3%A9rie%20des%20Traducteurs.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Retrieve the mod title and author from NexusMods page
    const modTitle = document.querySelector("#pagetitle > h1").innerText.trim();
    const modAuthor = document.querySelector("#fileinfo > div:nth-child(5) > a").innerText.trim();
    const gameCategory = window.location.pathname.split('/')[1]; // Retrieves game category (e.g., skyrimspecialedition, fallout4)

    // Dynamic search URL based on game category
    let searchBaseUrl = (gameCategory.includes('skyrim')) ? 'https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple'
                              : 'https://www.confrerie-des-traducteurs.fr/fallout4/recherche/simple';

    // Game parameters for the search
    let gameParams = {};
    if (gameCategory.includes("fallout4")) {
        searchBaseUrl = "https://www.confrerie-des-traducteurs.fr/fallout4/recherche/simple";
        gameParams = {
            skyrim: 0,
            skyrimSE: 0,
            fallout4: 1,
        };
    } else if (gameCategory.includes("skyrimspecialedition")) {
        searchBaseUrl = "https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple";
        gameParams = {
            skyrim: 0,
            skyrimSE: 1,
            fallout4: 0,
        };
    } else if (gameCategory.includes("skyrim")) {
        searchBaseUrl = "https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple";
        gameParams = {
            skyrim: 1,
            skyrimSE: 0,
            fallout4: 0,
        };
    }

    // Adding the translation button to NexusMods page
    const actionsContainer = document.querySelector("#pagetitle > ul.modactions.clearfix");
    if (actionsContainer) {
        const buttonContainer = createFixedButtonContainer();
        document.body.appendChild(buttonContainer);
    }

    /**
     * Creates a fixed button container for the translation button.
     * @returns {HTMLElement} The button container element.
     */
    function createFixedButtonContainer() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';  // Fixe le bouton pour qu'il soit toujours visible
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '1000';  // Priorité d'affichage

        const button = document.createElement('button');
        button.innerHTML = `<span style="display: flex; align-items: center;"><img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" alt="Confrérie" style="vertical-align: middle; width: 40px; height: 40px; margin-right: 10px;"> Rechercher<br>Traduction</span>`;
        button.style.margin = '5px';
        button.style.padding = '15px';
        button.style.backgroundColor = '#ffffff';
        button.style.color = '#333';
        button.style.border = '2px solid #ccc';
        button.style.borderRadius = '10px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';  // Taille de police ajustée
        button.style.display = 'flex';
        button.style.alignItems = 'center'; // Alignement vertical de l'image et du texte
        button.style.justifyContent = 'center'; // Centrer le contenu
        button.style.width = 'auto'; // Ajuster la largeur automatiquement
        button.style.fontFamily = '"Brush Script MT", cursive'; // Appliquer la police

        // Add event listener to initiate search on click
        button.addEventListener('click', function() {
            button.innerHTML = "Recherche en cours...";
            searchModOnConfrerie(modTitle, modAuthor, button);
        });

        buttonContainer.appendChild(button);
        return buttonContainer;
    }

    /**
     * Initiates the search for the mod on Confrérie des Traducteurs.
     * @param {string} modTitle - Title of the mod from NexusMods
     * @param {string} modAuthor - Author of the mod from NexusMods
     * @param {HTMLElement} button - Button element to update its state
     */
    function searchModOnConfrerie(modTitle, modAuthor, button) {
        console.log(`[INFO] Recherche de traduction pour: ${modTitle}`);

        const params = new URLSearchParams({
            term: modTitle.replace(/\s+/g, "_"), // Replace spaces with underscores
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
            onload: function(response) {
                if (response.status === 200) {
                    handleSearchResponse(response.responseText, modTitle, modAuthor, button);
                } else {
                    console.error("[ERROR] Recherche échouée avec le statut: ", response.status);
                    button.style.backgroundColor = '#d9534f';
                    button.innerHTML = "Erreur de recherche.";
                    button.disabled = false;
                }
            },
            onerror: function() {
                console.error("[ERROR] Erreur lors de la recherche.");
                button.style.backgroundColor = '#d9534f';
                button.innerHTML = "Erreur lors de la recherche.";
                button.disabled = false;
            }
        });
    }

    // (Rest of your existing functions remain unchanged)

    /**
     * Handles the response from the Confrérie search. If no result is found, falls back to searching by author.
     * @param {string} responseText - Response from the Confrérie des Traducteurs search
     * @param {string} modTitle - Title of the mod from NexusMods
     * @param {string} modAuthor - Author of the mod from NexusMods
     * @param {HTMLElement} button - Button element to update its state
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
                button.innerHTML = "Traduction trouvée!";
            } else {
                searchByAuthor(modAuthor, modTitle, button);  // Fallback to author search
            }
        } else {
            searchByAuthor(modAuthor, modTitle, button);  // Fallback to author search
        }
    }

    /**
     * Searches mods by author if the title search returns no results.
     * @param {string} modAuthor - Author of the mod from NexusMods
     * @param {string} modTitle - Title of the mod from NexusMods
     * @param {HTMLElement} button - Button element to update its state
     */
    function searchByAuthor(modAuthor, modTitle, button) {
        console.log(`[INFO] Recherche par auteur: ${modAuthor}`);

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
                    handleAuthorSearchResponse(response.responseText, modTitle, button);
                } else {
                    console.error("[ERROR] Recherche par auteur échouée avec le statut: ", response.status);
                    button.style.backgroundColor = '#d9534f';
                    button.innerHTML = "Erreur de recherche par auteur.";
                    button.disabled = false;
                }
            },
            onerror: function() {
                console.error("[ERROR] Erreur lors de la recherche par auteur.");
                button.style.backgroundColor = '#d9534f';
                button.innerHTML = "Erreur lors de la recherche par auteur.";
                button.disabled = false;
            }
        });
    }

    /**
     * Handles the response from the author search.
     * @param {string} responseText - Response from the Confrérie des Traducteurs search
     * @param {string} modTitle - Title of the mod from NexusMods
     * @param {HTMLElement} button - Button element to update its state
     */
    function handleAuthorSearchResponse(responseText, modTitle, button) {
        const data = JSON.parse(responseText);
        if (data.Count > 0) {
            const possibleMods = data.Entries.map(entry => ({ name: entry.OriginalName, link: entry.Link }));
            const bestMatch = findBestLevenshteinMatch(modTitle, possibleMods);
            if (bestMatch) {
                const translationLink = "https://www.confrerie-des-traducteurs.fr" + bestMatch.link;
                window.open(translationLink, "_blank");
                button.style.backgroundColor = '#5cb85c';
                button.innerHTML = "Traduction trouvée!";
            } else {
                button.style.backgroundColor = '#d9534f';
                button.innerHTML = "Aucune traduction trouvée.";
            }
        } else {
            button.style.backgroundColor = '#d9534f';
            button.innerHTML = "Aucune traduction trouvée.";
        }
    }

    /**
     * Finds the best match for the mod title using the Levenshtein distance.
     * @param {string} title - The original mod title
     * @param {Array} possibleMods - List of possible mod translations
     * @returns {Object|null} The best matching mod or null if no match is found
     */
    function findBestLevenshteinMatch(title, possibleMods) {
        let bestMatch = null;
        let lowestDistance = Infinity;

        for (const mod of possibleMods) {
            const distance = levenshteinDistance(title, mod.name);
            if (distance < lowestDistance) {
                lowestDistance = distance;
                bestMatch = mod;
            }
        }
        return bestMatch;
    }

    /**
     * Calculates the Levenshtein distance between two strings.
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {number} The Levenshtein distance between the two strings
     */
    function levenshteinDistance(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1 // deletion
                        )
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
})();

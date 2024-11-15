// ==UserScript==
// @name         Confrérie des Traducteurs - NexusMods Redirector
// @namespace    https://discord.gg/sJDzeCZCa3
// @version      1.1
// @description  Finds French translations of NexusMods mods on Confrérie des Traducteurs.
// @author       chunchunmaru (alexbdka)
// @icon         https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png
// @match        https://www.nexusmods.com/skyrim/*
// @match        https://www.nexusmods.com/skyrimspecialedition/*
// @match        https://www.nexusmods.com/fallout4/*
// @grant        GM_xmlhttpRequest
// @connect      www.confrerie-des-traducteurs.fr
// ==/UserScript==

(function() {
    'use strict';
    const gameCategory = window.location.pathname.split('/')[1];
    const searchBaseUrl = getSearchBaseUrl(gameCategory);
    const gameParams = getGameParams(gameCategory);

    const modTitle = document.querySelector("#pagetitle > h1").innerText.trim();
    const modAuthor = document.querySelector("#fileinfo > div:nth-child(5) > a").innerText.trim();

    const buttonContainer = createButtonContainer();
    document.body.appendChild(buttonContainer);

    buttonContainer.querySelector('button').addEventListener('click', () => {
        buttonContainer.querySelector('button').disabled = true;
        searchModOnConfrerie(modTitle, modAuthor, buttonContainer.querySelector('button'));
    });

    function getSearchBaseUrl(gameCategory) {
        return gameCategory.includes("skyrimspecialedition")
            ? "https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple"
        : `https://www.confrerie-des-traducteurs.fr/${gameCategory}/recherche/simple`;
    }

    function getGameParams(gameCategory) {
        return gameCategory.includes("fallout4")
            ? { fallout4: 1 }
        : gameCategory.includes("skyrimspecialedition")
            ? { skyrim: 0, skyrimSE: 1 }
        : { skyrim: 1, skyrimSE: 0 };
    }

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
                    console.error(`[ERROR] Search URL: ${searchBaseUrl}`);
                    console.error(`[ERROR] Search params: ${params.toString()}`);
                    updateButtonState(button, 'error');
                }
            },
            onerror: () => {
                console.error("[ERROR] Error during search");
                updateButtonState(button, 'error');
            }
        });
    }

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

    function findBestMatch(modTitle, possibleMods) {
        console.log("[DEBUG] possibleMods : ", possibleMods);
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

// ==UserScript==
// @name         Confrérie des Traducteurs - modlhandler
// @namespace    https://discord.gg/sJDzeCZCa3
// @version      1.0
// @description  Allows downloading translations from the Confrérie directly into MO2.
// @author       chunchunmaru - alexbdka
// @icon         https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png
// @match        https://www.confrerie-des-traducteurs.fr/*/mods/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Get the game category from the URL path
    const gameCategory = window.location.pathname.split('/')[1];
    let gameId = null; // Initialize the game ID variable
    let downloadUrl = null; // Initialize the download URL variable

    // Check if the game category includes 'skyrim'
    if (gameCategory.includes('skyrim')) {
        gameId = 'skyrimse'; // Set the game ID for SkyrimSE
        // Select the download link element using a CSS selector
        const linkElement = document.querySelector("body > section > main > div > div > div > div:nth-of-type(3) > a");
        // Get the href attribute from the link element
        downloadUrl = linkElement ? linkElement.href : null;
        console.log("[INFO] game ID : ", gameId); // Log the game ID
        console.log("[INFO] download URL : ", downloadUrl); // Log the download URL
    // Check if the game category includes 'fallout4'
    } else if (gameCategory.includes('fallout4')) {
        gameId = 'fallout4'; // Set the game ID for Fallout 4
        // Select the download link element using a CSS selector
        const linkElement = document.querySelector("body > section > main > section:nth-of-type(2) > div:nth-of-type(3) > a");
        // Get the href attribute from the link element
        downloadUrl = linkElement ? linkElement.href : null;
        console.log("[INFO] game ID : ", gameId); // Log the game ID
        console.log("[INFO] download URL : ", downloadUrl); // Log the download URL
    } else {
        console.log("[ERROR] Unsupported game");
    }

    // Check if a download URL was found
    if (downloadUrl) {
        // Encode the download URL to make it safe for use in a link
        const encodedUrl = encodeURIComponent(downloadUrl);
        // Construct the mod manager link with the game ID and encoded URL
        const modManagerLink = 'modl://' + gameId + '/?url=' + encodedUrl + ".7z";
        console.log("[INFO] mod manager link : ", modManagerLink); // Log the constructed link

        // Create a fixed button container for the download button
        const buttonContainer = createFixedButtonContainer(modManagerLink);
        document.body.appendChild(buttonContainer); // Append the button container to the body
    } else {
        console.log("[WARN] No download link found."); // Log a warning if no download link was found
    }

    /**
     * Creates a fixed button container for the mod download button.
     * @param {string} modManagerLink - The link to be opened on button click.
     * @returns {HTMLElement} The button container element.
     */
    function createFixedButtonContainer(modManagerLink) {
        const buttonContainer = document.createElement('div'); // Create a new div for the button container
        // Set the style to position the button container fixed at the bottom right
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '1000'; // Ensure it appears above other elements

        const button = document.createElement('button'); // Create a new button element
        // Set the inner HTML of the button with an icon and text
        button.innerHTML = `
            <span style="display: flex; align-items: center; font-family: 'Brush Script MT', cursive;">
                <img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" alt="Confrérie" style="vertical-align: middle; width: 40px; height: 40px; margin-right: 10px;">
                Télécharger<br>avec<br>Mod Organizer 2
            </span>
        `;
        // Style the button
        button.style.margin = '5px';
        button.style.padding = '15px';
        button.style.backgroundColor = '#e6ccaa';
        button.style.color = '#333';
        button.style.border = '2px solid #4b3929';
        button.style.borderRadius = '10px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.width = 'auto';

        // Add a click event listener to the button to open the link in a new window
        button.addEventListener('click', () => {
            window.open(modManagerLink, '_blank'); // Open the mod manager link in a new tab
        });

        buttonContainer.appendChild(button); // Append the button to the button container
        return buttonContainer; // Return the button container
    }
})();

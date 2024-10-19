// ==UserScript==
// @name         Nexusmods to Confrérie des Traducteurs
// @namespace    https://discord.gg/sJDzeCZCa3
// @version      2.1
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

    // Fonction pour ajouter le bouton sur la page
    function addTranslationButton() {
        const modTitleElement = document.querySelector("#pagetitle > h1");
        if (!modTitleElement) {
            console.log("[WARN] TITRE INTROUVABLE");
            return;
        }

        const modAuthorElement = document.querySelector("#fileinfo > div:nth-child(5) > a");
        if (!modAuthorElement) {
            console.log("[WARN] AUTEUR INTROUVABLE");
            return;
        }

        let modTitle = modTitleElement.innerText.trim();
        modTitle = modTitle.split('-')[0].trim().replace(/ /g, '_');
        console.log("[INFO] MOD TITLE: ", modTitle);

        let modAuthor = modAuthorElement.innerText.trim();
        console.log("[INFO] MOD AUTHOR: ", modAuthor);

        // Créer un conteneur pour le bouton dans le body
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';  // Fixe le bouton pour qu'il soit toujours visible
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '1000';  // Priorité d'affichage

        // Créer le bouton
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

        // Fonction de gestion de la recherche de traduction
        button.onclick = function() {
            button.disabled = true;
            button.style.backgroundColor = '#f0ad4e'; // Orange pendant la recherche

            checkTranslation(modTitle, button); // Vérifier la traduction
        };

        buttonContainer.appendChild(button);

        // Ajouter le bouton au body
        document.body.appendChild(buttonContainer);
        console.log("[INFO] BOUTON AJOUTE");
    }

    // Fonction pour vérifier la traduction
    function checkTranslation(modTitle, button) {
        const currentUrl = window.location.href;
        let apiUrl = "";
        let gameParams = {};

        // Déterminer l'URL de l'API basée sur le jeu
        if (currentUrl.includes("fallout4")) {
            apiUrl = "https://www.confrerie-des-traducteurs.fr/fallout4/recherche/simple";
            gameParams = {
                skyrim: 0,
                skyrimSE: 0,
                fallout4: 1,
            };
        } else if (currentUrl.includes("skyrimspecialedition")) {
            apiUrl = "https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple";
            gameParams = {
                skyrim: 0,
                skyrimSE: 1,
                fallout4: 0,
            };
        } else if (currentUrl.includes("skyrim")) {
            apiUrl = "https://www.confrerie-des-traducteurs.fr/skyrim/recherche/simple";
            gameParams = {
                skyrim: 1,
                skyrimSE: 0,
                fallout4: 0,
            };
        }

        console.log("[INFO] URL actuelle : ", currentUrl);
        console.log("[INFO] URL API de recherche : ", apiUrl);

        // Construire les paramètres pour la requête
        const params = new URLSearchParams({
            term: modTitle,
            name: 1,
            nameVO: 1,
            description: 0,
            authors: 0,
            translators: 0,
            testers: 0,
            proofreaders: 0,
            designers: 0,
            actors: 0,
            vostfr: 0,
            vf: 0,
            vfPart: 0,
            excludeIsNotProofread: 0,
            ...gameParams
        });

        // Faire la requête pour vérifier la traduction
        GM_xmlhttpRequest({
            method: "POST",
            url: apiUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `https://www.confrerie-des-traducteurs.fr/${apiUrl.includes('fallout4') ? 'fallout4' : 'skyrim'}/recherche?search=basic&term=${encodeURIComponent(modTitle)}`
            },
            data: params.toString(),
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        const data = JSON.parse(response.responseText);
                        console.log("[INFO] Réponse de l'API : ", data);
                        if (data.Count > 0) {
                            // Si une traduction est trouvée, rediriger vers le lien
                            const firstResult = data.Entries[0]; // Prendre le premier résultat
                            const translationLink = "https://www.confrerie-des-traducteurs.fr" + firstResult.Link;
                            window.open(translationLink, "_blank"); // Ouvrir le lien dans un nouvel onglet
                            button.style.backgroundColor = '#5cb85c'; // Vert si traduction trouvée
                            button.innerHTML = `<span style="display: flex; align-items: center;"><img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" style="width: 40px; height: 40px; margin-right: 10px;">Traduction trouvée!</span>`;
                        } else {
                            button.style.backgroundColor = '#d9534f'; // Rouge si aucune traduction
                            button.innerHTML = `<span style="display: flex; align-items: center;"><img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" style="width: 40px; height: 40px; margin-right: 10px;">Aucune traduction trouvée</span>`;
                        }
                    } catch (e) {
                        console.error("[ERROR] ERREUR LORS DU TRAITEMENT DE LA RÉPONSE : ", e);
                        button.style.backgroundColor = '#d9534f'; // Rouge en cas d'erreur
                        button.innerHTML = `<span style="display: flex; align-items: center;"><img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" style="width: 40px; height: 40px; margin-right: 10px;">Erreur de réponse</span>`;
                    }
                } else {
                    console.error("[ERROR] LA REQUÊTE A ÉCHOUÉ AVEC LE STATUT : ", response.status);
                    button.style.backgroundColor = '#d9534f'; // Rouge si la requête échoue
                    button.innerHTML = `<span style="display: flex; align-items: center;"><img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" style="width: 40px; height: 40px; margin-right: 10px;">Erreur de requête</span>`;
                }
                button.disabled = false;
            },
            onerror: function() {
                console.error("[ERROR] ERREUR LORS DE LA VÉRIFICATION DE LA TRADUCTION");
                button.style.backgroundColor = '#d9534f'; // Rouge en cas d'erreur
                button.innerHTML = `<span style="display: flex; align-items: center;"><img src="https://i.ibb.co/55r0z7m/confrerie-des-traducteurs-small.png" style="width: 40px; height: 40px; margin-right: 10px;">Erreur lors de la recherche</span>`;
                button.disabled = false;
            }
        });
    }

    // Appeler la fonction pour ajouter le bouton au chargement de la page
    addTranslationButton();
})();

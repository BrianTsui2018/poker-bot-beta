/* 

    This script is modified from:
    https://www.fantasynamegenerators.com/casino-names.php
    (21 May 2019)

*/


function nameGen(type) {

    var nm1 = ["Aegis", "Aeon", "Aeros", "Allure", "Ambrosia", "Amethyst", "Anemone", "Apex", "Arch", "Archway", "Aria", "Aristocrat", "Aura", "Aurora", "Avian", "Azalea", "Basilica", "Bastille", "Belvedere", "Bird of Paradise", "Blossom", "Borealis", "Boulevard", "Cadence", "Calypso", "Cardinal", "Carriage", "Celesta", "Century", "Chalice", "Chariot", "Clover", "Coronal", "Creek", "Crescendo", "Crown", "Cub", "Curtain", "Cushion", "Delta", "Diamond", "Dove", "Dream", "Dune", "Echo", "Eclipse", "Element", "Elephant", "Elixir", "Ellipsis", "Elysian", "Elysium", "Emerald", "Equinox", "Euphoria", "Excelsior", "Felicity", "Flame", "Fountain", "Gala", "Gate", "Glacier", "Globe", "Gold Nugget", "Grand Plaza", "Greyhound", "Halo", "Harmony", "Helix", "Horseshoe", "Hyacinth", "Iris", "Labyrinth", "Lady Fortune", "Leviathan", "Liberty", "Lion", "Luminos", "Luna", "Majesty", "Marble", "Matrix", "Medallion", "Melody", "Meridian", "Millenium", "Mint", "Mithril", "Mountain", "Myriad", "Mystery", "Mystique", "Nightowl", "Nimbus", "Nova", "Nugget", "Oasis", "Obelisk", "Oleander", "Orchid", "Palm", "Paradise", "Phantom", "Pinnacle", "Plaza", "Plume", "Prism", "Quill", "Reef", "Rhythm", "Robin", "Rose", "Sabre", "Sapphire", "Scarlet", "Scepter", "Serenade", "Serendipity", "Serenity", "Sierra", "Siren", "Snowflake", "Solas", "Solstice", "Spa", "Spire", "Spirit", "Spring", "Stallion", "Star", "Talisman", "Tempest", "Tiara", "Tigress", "Trillium", "Valley", "Vertex", "Victory", "Voyage", "Wolfhound", "Zenith", "Zephyr"];
    var nm2 = ["Aerial", "Alabaster", "Amber", "Amethyst", "Aqua", "Astral", "Atlantic", "Aurelian", "Azulene", "Azure", "Cardinal", "Carmine", "Celestial", "Cerulean", "Coral", "Crimson", "Crown", "Crystal", "Diamond", "Eastern", "Ebon", "Ember", "Emerald", "Exalted", "Gilded", "Gold", "Golden", "Grand", "Granite", "Halcyon", "Indigo", "Ivory", "Jade", "King", "Lavender", "Light", "Lucky", "Lunar", "Malachite", "Marble", "Marina", "Maroon", "Noble", "Northern", "Obsidian", "Onyx", "Pacific", "Paradise", "Porcelain", "Regal", "Royal", "Ruby", "Sable", "Saffron", "Sanguine", "Sapphire", "Scarlet", "Silk", "Silver", "Solar", "Southern", "Supreme", "Twin", "Velour", "Velvet", "Verdigris", "Vermilion", "Violet", "Viridian", "Western", "White"];
    var nm3 = ["Aegis", "Aeon", "Allure", "Anemone", "Angel", "Arc", "Arch", "Archway", "Aura", "Aurora", "Avian", "Bastille", "Blossom", "Borealis", "Boulevard", "Carriage", "Chalice", "Chariot", "Citadel", "Cloak", "Cloud", "Clover", "Court", "Creek", "Crown", "Cub", "Curtain", "Cushion", "Diamond", "Dome", "Dove", "Dream", "Dune", "Element", "Elephant", "Dawn", "Chandelier", "Panther", "Griffin", "Flame", "Flower", "Fountain", "Garden", "Gardens", "Gate", "Globe", "Greyhound", "Halo", "Heirloom", "Helix", "Horseshoe", "Hyacinth", "Iris", "Jewel", "Labyrinth", "Leviathan", "Lion", "Majesty", "Mantle", "Medallion", "Mountain", "Mystery", "Nebula", "Nimbus", "Nugget", "Oasis", "Obelisk", "Oleander", "Orb", "Orchid", "Palm", "Petal", "Phoenix", "Plume", "Prism", "Pyramid", "Quill", "Reef", "Ribbon", "Rose", "Sabre", "Scepter", "Shield", "Shrine", "Sierra", "Siren", "Snowflake", "Peacock", "Solstice", "Spa", "Spire", "Stallion", "Star", "Talisman", "Tempest", "Tiara", "Tigress", "Trillium", "Trinket", "Valley", "Wolfhound", "Zenith", "Zephyr"];
    var nm5 = ["Écarlate", "Écho", "Éclipse", "Égide", "Élément", "Éléphant", "Élixir", "Élysée", "Émeraude", "Équinoxe", "Éros", "Étalon", "Étoile", "Aiguille", "Améthyste", "Ambroisie", "Anémone", "Apex", "Arcade", "Arche", "Aria", "Aristocrate", "Attrait", "Aura", "Aurore", "Aviaire", "Azalée", "Barrière", "Basilique", "Bastille", "Belvédère", "Boréales", "Boulevard", "Célesta", "Cadance", "Cadence", "Calice", "Calypso", "Cardinal", "Char", "Chariot", "Cime", "Colombe", "Coronaire", "Couronne", "Coussin", "Cramoisi", "Crescendo", "Delta", "Diadème", "Diamant", "Dune", "Ellipse", "Euphorie", "Excelsior", "Félicité", "Fête", "Fantôme", "Fer à Cheval", "Flèche", "Flamme", "Fleur", "Floraison", "Fontaine", "Fortune", "Gala", "Glacier", "Globe", "Grand Place", "Grandeur", "Hélix", "Halo", "Harmonie", "Hibou", "Iris", "Jacinthe", "Léviathan", "Lévrier", "Labyrinthe", "Levrette", "Liberté", "Lion", "Lionceau", "Luminos", "Lune", "Médaillon", "Mélodie", "Méridien", "Majesté", "Marbre", "Matrix", "Menthe", "Millénaire", "Mithril", "Montagne", "Myriade", "Mystère", "Mystique", "Neige", "Nimbus", "Nova", "Oasis", "Obélisque", "Oiseau de Paradis", "Orchidée", "Pépite", "Pépite d'Or", "Palmier", "Paradis", "Paradisier", "Penne", "Pinacle", "Plume", "Printemps", "Prisme", "Récif", "Rêve", "Rose", "Ruisseau", "Rythme", "Sérénade", "Sérénité", "Sérendipité", "Sabre", "Saphir", "Sceptre", "Siècle", "Sierra", "Sirène", "Solstice", "Sommet", "Spa", "Sphère", "Talisman", "Tempête", "Tiare", "Tigresse", "Trèfle", "Trille", "Triomphe", "Vallée", "Victoire", "Voile", "Voyage", "Zénith", "Zéphyr"];
    var nm6a = ["Ébène", "Écarlate", "Émeraude", "Aérien", "Alcyon", "Ambré", "Antlantique", "Argenté", "Astral", "Aurélien", "Azulène", "Azuré", "Blanc", "Bordeaux", "Céleste", "Cardinal", "Carmin", "Chanceux", "Cramoisi", "Doré", "Exalté", "Grandiose", "Incarnat", "Indigo", "Jumeau", "Lunaire", "Majestueux", "Noble", "Pacifique", "Royal", "Sanguin", "Solaire", "Suprème", "Velouté", "Violet", "Viridian", "d'Albâtre", "d'Améthyste", "d'Ambre", "d'Aqua", "d'Argent", "d'Azur", "d'Ivoire", "d'Obsidienne", "d'Onyx", "d'Or", "de Braise", "de Corail", "de Diamant", "de Jade", "de Lavande", "de Lumière", "de Malachite", "de Marbre", "de Paradis", "de Rubis", "de Safran", "de Saphir", "de Soie", "de Velours", "de Vermillon", "de Vert-de-Gris", "de Zibeline", "de l'Est", "de l'Ouest", "de la Couronne", "de la Lune", "de la Marina", "de la Reine", "du Nord", "du Roi", "du Soleil", "du Sud", "en Cristal", "en Marbre"];
    var nm6b = ["Ébène", "Écarlate", "Émeraude", "Aérienne", "Alcyon", "Ambrée", "Antlantique", "Argentée", "Astrale", "Aurélienne", "Azulène", "Azurée", "Blanche", "Bordeause", "Céleste", "Cardinale", "Carmin", "Chanceuse", "Cramoisie", "Dorée", "Exaltée", "Grandiose", "Incarnate", "Indigo", "Jumelle", "Lunaire", "Majestueuse", "Noble", "Pacifique", "Royale", "Sanguine", "Solaire", "Suprème", "Veloutée", "Violette", "Viridienne"];
    var nm7 = ["l'Égide", "l'Étoile", "l'Allure", "l'Anémone", "l'Arche", "l'Aube", "l'Aura", "l'Aurore", "la Bastille", "la Citadelle", "la Colombe", "la Cour", "la Couronne", "la Dune", "la Flèche", "la Flamme", "la Fleur", "la Floraison", "la Fontaine", "la Grandeur", "l'Hélice", "la Jacinthe", "la Levrette", "la Majesté", "la Montagne", "la Nébuleuse", "l'Oasis", "l'Orchidée", "la Pépite", "la Panthère", "la Penne", "la Perle", "la Plume", "la Porte", "la Pyramide", "la Rose", "la Sierra", "la Sirène", "la Sphère", "la Tempête", "la Terre", "la Tiare", "la Tigresse", "la Vallée", "l'Élément", "l'Éléphant", "l'Étalon", "l'Ange", "l'Arc", "l'Aviaire", "le Bibelot", "le Bijou", "le Bouclier", "le Boulevard", "le Calice", "le Chariot", "le Coussin", "le Dôme", "le Diamant", "le Fer à Cheval", "le Globe", "le Griffon", "l'Héritage", "le Halo", "l'Iris", "le Jardin", "le Léviathan", "le Lévrier", "le Labyrinthe", "le Lion", "le Lustre", "le Médaillon", "le Manteau", "le Mystère", "le Nimbe", "le Nimbus", "le Nuage", "l'Obélisque", "l'Orbe", "le Pétale", "le Palmier", "le Paon", "le Phénix", "le Portail", "le Prisme", "le Récif", "le Rêve", "le Rideau", "le Ruban", "le Ruisseau", "le Sabre", "le Sceptre", "le Solstice", "le Spa", "le Talisman", "le Tombeau", "le Trèfle", "le Trille", "le Voile", "le Zénith", "le Zéphyr"];
    var nm4 = ["", " Casino"];

    //let i = Math.random() * 20;
    let nameList = [];

    for (i = 0; i < 5; i++) {
        if (i < 1) {
            rnd = Math.random() * nm5.length | 0;
            name = "The " + nm5[rnd];
            nm5.splice(rnd, 1);
        } else if (i < 2) {
            rnd = Math.random() * nm6a.length | 0;
            rnd2 = Math.random() * nm7.length | 0;
            if (rnd2 < 44 && rnd < 36) {
                name = nm7[rnd2] + " " + nm6b[rnd];
            } else {
                name = nm7[rnd2] + " " + nm6a[rnd];
            }
            nm7.splice(rnd2, 1);
        } else if (i < 3) {

            rnd = Math.random() * nm1.length | 0;
            rnd2 = Math.random() * nm4.length | 0;
            name = "The " + nm1[rnd] + nm4[rnd2];
            nm1.splice(rnd, 1);
        } else {
            rnd = Math.random() * nm2.length | 0;
            rnd2 = Math.random() * nm3.length | 0;
            name = "The " + nm2[rnd] + " " + nm3[rnd2];
            nm2.splice(rnd, 1);
            nm3.splice(rnd2, 1);
        }
        //console.log(name);
        nameList.push(name);

    }
    //console.log(nameList);
    return (nameList);
}

module.exports = {
    nameGen
}
//nameGen();
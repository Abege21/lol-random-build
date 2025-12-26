const VERSION = "14.24.1"; 
let selectedLane = "ALL";
let allChampions = [];
let forcedChamp = null;

const LANE_DATA = {
    TOP: ["Aatrox", "Akali", "Camille", "Cho'Gath", "Darius", "Dr. Mundo", "Fiora", "Gangplank", "Garen", "Gnar", "Gwen", "Illaoi", "Irelia", "Jax", "Jayce", "K'Sante", "Kayle", "Kennen", "Kled", "Malphite", "Mordekaiser", "Nasus", "Olaf", "Ornn", "Pantheon", "Poppy", "Quinn", "Renekton", "Riven", "Rumble", "Shen", "Singed", "Sion", "Tahm Kench", "Teemo", "Tryndamere", "Urgot", "Vayne", "Volibear", "Warwick", "Yorick", "Yasuo", "Yone"],
    JUNGLE: ["Amumu", "Bel'Veth", "Briar", "Diana", "Ekko", "Evelynn", "Fiddlesticks", "Gragas", "Graves", "Hecarim", "Ivern", "Jarvan IV", "Jax", "Karthus", "Kayn", "Kha'Zix", "Kindred", "Lee Sin", "Lillia", "Master Yi", "Nidalee", "Nocturne", "Nunu & Willump", "Olaf", "Poppy", "Rammus", "Rek'Sai", "Rengar", "Sejuani", "Shaco", "Shyvana", "Skarner", "Taliyah", "Trundle", "Udyr", "Vi", "Viego", "Volibear", "Warwick", "Xin Zhao", "Zac"],
    MIDDLE: ["Ahri", "Akali", "Akshan", "Anivia", "Annie", "Aurelion Sol", "Azir", "Cassiopeia", "Corki", "Ekko", "Fizz", "Galio", "Hwei", "Irelia", "Kassadin", "Katarina", "LeBlanc", "Lissandra", "Lux", "Malzahar", "Naafiri", "Neeko", "Orianna", "Pantheon", "Ryze", "Sylas", "Syndra", "Talon", "Twisted Fate", "Veigar", "Vel'Koz", "Vex", "Viktor", "Vladimir", "Xerath", "Yasuo", "Yone", "Zed", "Zoe"],
    BOTTOM: ["Aphelios", "Ashe", "Caitlyn", "Draven", "Ezreal", "Jhin", "Jinx", "Kai'Sa", "Kalista", "Kog'Maw", "Lucian", "Miss Fortune", "Nilah", "Samira", "Sivir", "Smolder", "Tristana", "Twitch", "Varus", "Vayne", "Xayah", "Zeri"],
    UTILITY: ["Alistar", "Bard", "Blitzcrank", "Brand", "Braum", "Janna", "Karma", "Leona", "Lulu", "Lux", "Milio", "Morgana", "Nami", "Nautilus", "Pyke", "Rakan", "Rell", "Renata Glasc", "Seraphine", "Senna", "Shaco", "Sona", "Soraka", "Swain", "Taric", "Thresh", "Xerath", "Yuumi", "Zilean", "Zyra"]
};

const EXCLUSIVE_GROUPS = [["3035", "3036", "3033", "6694"], ["3003", "3004", "3119"]];

window.onload = async () => {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/champion.json`);
    const data = await res.json();
    allChampions = Object.values(data.data);
    updateLaneView("ALL");
};

function setLane(lane, btn) {
    selectedLane = lane; forcedChamp = null;
    document.getElementById('champ-search').value = "";
    document.querySelectorAll('.lane-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateLaneView(lane);
}

function updateLaneView(lane) {
    const container = document.getElementById('lane-champions');
    let pool = (lane === "ALL") ? allChampions : allChampions.filter(c => LANE_DATA[lane].includes(c.name));
    pool.sort((a, b) => a.name.localeCompare(b.name));
    container.innerHTML = pool.map(c => `<img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${c.id}.png" class="lane-champ-icon" onclick="selectFromGrid('${c.id}', this)">`).join("");
}

function selectFromGrid(id, el) {
    forcedChamp = allChampions.find(c => c.id === id);
    document.querySelectorAll('.lane-champ-icon').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('champ-search').value = forcedChamp.name;
}

document.getElementById('champ-search').addEventListener('input', function(e) {
    const val = e.target.value.toLowerCase().replace(/['\s]/g, "");
    const sugg = document.getElementById('search-suggestions');
    if(val.length < 1) { sugg.style.display='none'; return; }
    const filtered = allChampions.filter(c => c.name.toLowerCase().replace(/['\s]/g, "").includes(val));
    sugg.innerHTML = filtered.map(c => `<div class="suggestion-item" onclick="applySearch('${c.name.replace("'", "\\'")}')">${c.name}</div>`).join("");
    sugg.style.display = 'block';
});

function applySearch(name) {
    document.getElementById('champ-search').value = name;
    document.getElementById('search-suggestions').style.display='none';
    forcedChamp = allChampions.find(c => c.name === name);
}

async function generateBuild() {
    const btn = document.getElementById('generate-btn'); btn.classList.add('loading'); btn.disabled = true;
    setTimeout(async () => {
        try {
            const [itemRes, runeRes, spellRes] = await Promise.all([
                fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/item.json`),
                fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/runesReforged.json`),
                fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/summoner.json`)
            ]);
            const itemsData = await itemRes.json(); const runesData = await runeRes.json(); const spellsData = await spellRes.json();
            
            let champ = forcedChamp || allChampions.filter(c => selectedLane === "ALL" || LANE_DATA[selectedLane].includes(c.name))[Math.floor(Math.random()*10)];
            if(!champ) champ = allChampions[Math.floor(Math.random()*allChampions.length)];

            document.getElementById('champ-img').src = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${champ.id}.png`;
            document.getElementById('champ-name').innerText = champ.name.toUpperCase();

            // Büyüler
            let sPool = Object.values(spellsData.data).filter(s => s.modes.includes("CLASSIC") && s.id !== "SummonerSmiteAvatar");
            const finalSpells = [];
            if(selectedLane === "JUNGLE") finalSpells.push(sPool.find(s => s.id === "SummonerSmite"));
            sPool = sPool.filter(s => s.id !== "SummonerSmite");
            while(finalSpells.length < 2) {
                const r = sPool[Math.floor(Math.random()*sPool.length)];
                if(!finalSpells.some(s => s.id === r.id)) finalSpells.push(r);
            }
            document.getElementById('spells-display').innerHTML = finalSpells.map(s => `<img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/spell/${s.id}.png" class="spell-img">`).join("");

            // Eşyalar
            let bPool = [], iPool = [];
            for(let id in itemsData.data) {
                const item = itemsData.data[id];
                if(item.maps[11] && item.gold.purchasable && !item.requiredChampion) {
                    if(item.tags.includes("Boots") && item.gold.total > 500) bPool.push(id);
                    else if(!item.into && item.gold.total >= 2500) iPool.push(id);
                }
            }
            const build = [];
            if(champ.id !== "Cassiopeia") build.push(bPool[Math.floor(Math.random()*bPool.length)]);
            while(build.length < 6) {
                const rId = iPool[Math.floor(Math.random()*iPool.length)];
                let conflict = EXCLUSIVE_GROUPS.some(g => g.includes(rId) && build.some(o => g.includes(o)));
                if(!build.includes(rId) && !conflict) build.push(rId);
            }
            document.getElementById('build-display').innerHTML = build.map(id => `<div class="item-slot"><img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/item/${id}.png"></div>`).join("");

            // Rünler (Fixli: 4 Ana, 2 Yan)
            const pT = runesData[Math.floor(Math.random()*runesData.length)];
            let sT; do { sT = runesData[Math.floor(Math.random()*runesData.length)]; } while(sT.id === pT.id);
            const pR = pT.slots.map(s => s.runes[Math.floor(Math.random()*s.runes.length)]);
            const sR = [...sT.slots.slice(1)].sort(() => 0.5-Math.random()).slice(0,2).map(s => s.runes[Math.floor(Math.random()*s.runes.length)]);
            
            document.getElementById('primary-runes').innerHTML = pR.map((r, i) => `<img src="https://ddragon.leagueoflegends.com/cdn/img/${r.icon}" class="rune-img ${i===0?'keystone':''}">`).join("");
            document.getElementById('secondary-runes').innerHTML = sR.map(r => `<img src="https://ddragon.leagueoflegends.com/cdn/img/${r.icon}" class="rune-img">`).join("");

            document.getElementById('result-area').classList.remove('hidden');
        } catch(e) { console.error(e); }
        btn.classList.remove('loading'); btn.disabled = false;
    }, 1200);
}
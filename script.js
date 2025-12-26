const VERSION = "14.24.1"; 
let selectedLane = "ALL", allChampions = [], forcedChamp = null;

const LANE_DATA = {
    TOP: ["Aatrox", "Akali", "Camille", "Cho'Gath", "Darius", "Dr. Mundo", "Fiora", "Gangplank", "Garen", "Gnar", "Gwen", "Illaoi", "Irelia", "Jax", "Jayce", "K'Sante", "Kayle", "Kennen", "Kled", "Malphite", "Mordekaiser", "Nasus", "Olaf", "Ornn", "Pantheon", "Poppy", "Quinn", "Renekton", "Riven", "Rumble", "Shen", "Singed", "Sion", "Tahm Kench", "Teemo", "Tryndamere", "Urgot", "Vayne", "Volibear", "Warwick", "Yorick", "Yasuo", "Yone"],
    JUNGLE: ["Amumu", "Bel'Veth", "Briar", "Diana", "Ekko", "Evelynn", "Fiddlesticks", "Gragas", "Graves", "Hecarim", "Ivern", "Jarvan IV", "Jax", "Karthus", "Kayn", "Kha'Zix", "Kindred", "Lee Sin", "Lillia", "Master Yi", "Nidalee", "Nocturne", "Nunu & Willump", "Olaf", "Poppy", "Rammus", "Rek'Sai", "Rengar", "Sejuani", "Shaco", "Shyvana", "Skarner", "Taliyah", "Trundle", "Udyr", "Vi", "Viego", "Volibear", "Warwick", "Xin Zhao", "Zac"],
    MIDDLE: ["Ahri", "Akali", "Akshan", "Anivia", "Annie", "Aurelion Sol", "Azir", "Cassiopeia", "Corki", "Ekko", "Fizz", "Galio", "Hwei", "Irelia", "Kassadin", "Katarina", "LeBlanc", "Lissandra", "Lux", "Malzahar", "Naafiri", "Neeko", "Orianna", "Pantheon", "Ryze", "Sylas", "Syndra", "Talon", "Twisted Fate", "Veigar", "Vel'Koz", "Vex", "Viktor", "Vladimir", "Xerath", "Yasuo", "Yone", "Zed", "Zoe"],
    BOTTOM: ["Aphelios", "Ashe", "Caitlyn", "Draven", "Ezreal", "Jhin", "Jinx", "Kai'Sa", "Kalista", "Kog'Maw", "Lucian", "Miss Fortune", "Nilah", "Samira", "Sivir", "Smolder", "Tristana", "Twitch", "Varus", "Vayne", "Xayah", "Zeri"],
    UTILITY: ["Alistar", "Bard", "Blitzcrank", "Brand", "Braum", "Janna", "Karma", "Leona", "Lulu", "Lux", "Milio", "Morgana", "Nami", "Nautilus", "Pyke", "Rakan", "Rell", "Renata Glasc", "Seraphine", "Senna", "Shaco", "Sona", "Soraka", "Swain", "Taric", "Thresh", "Xerath", "Yuumi", "Zilean", "Zyra"]
};

const EXCLUSIVE_GROUPS = [["3035", "3036", "3033", "6694"], ["3046", "3031", "6671"], ["3003", "3004", "3119"]];

// Tooltip System
const tooltip = document.getElementById('custom-tooltip');
document.addEventListener('mousemove', (e) => {
    if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    }
});
const showTooltip = (t, d) => {
    tooltip.innerHTML = `<span class="tooltip-title">${t}</span><span class="tooltip-desc">${d}</span>`;
    tooltip.classList.remove('hidden');
};
const hideTooltip = () => tooltip.classList.add('hidden');

// Start up
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/champion.json`);
        const data = await res.json();
        allChampions = Object.values(data.data);
        updateLaneView("ALL");
    } catch (e) { console.error("Data error:", e); }
});

function setLane(l, btn) {
    selectedLane = l; forcedChamp = null;
    document.getElementById('champ-search').value = "";
    document.querySelectorAll('.lane-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateLaneView(l);
}

function updateLaneView(lane) {
    const container = document.getElementById('lane-champions');
    if(!container) return;
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

// Search Functionality
document.getElementById('champ-search').addEventListener('input', function(e) {
    const val = e.target.value.toLowerCase().trim();
    const sugg = document.getElementById('search-suggestions');
    if(val.length < 1) { sugg.style.display = 'none'; return; }
    const filtered = allChampions.filter(c => c.name.toLowerCase().includes(val));
    if(filtered.length > 0) {
        sugg.innerHTML = filtered.map(c => `<div class="suggestion-item" onclick="applySearch('${c.name.replace("'", "\\'")}')">${c.name}</div>`).join("");
        sugg.style.display = 'block';
    } else { sugg.style.display = 'none'; }
});

function applySearch(n) {
    document.getElementById('champ-search').value = n;
    document.getElementById('search-suggestions').style.display = 'none';
    forcedChamp = allChampions.find(c => c.name === n);
}

// Build Engine
async function generateBuild() {
    const btn = document.getElementById('generate-btn');
    btn.classList.add('loading'); btn.disabled = true;

    setTimeout(async () => {
        try {
            const [iR, rR, sR] = await Promise.all([
                fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/item.json`),
                fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/runesReforged.json`),
                fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/summoner.json`)
            ]);
            const iD = await iR.json(), rData = await rR.json(), sD = await sR.json();
            
            let champ = forcedChamp || allChampions.filter(c => selectedLane === "ALL" || LANE_DATA[selectedLane].includes(c.name))[Math.floor(Math.random()*10)];
            if(!champ) champ = allChampions[Math.floor(Math.random()*allChampions.length)];

            document.getElementById('champ-img').src = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${champ.id}.png`;
            document.getElementById('champ-name').innerText = champ.name.toUpperCase();

            // Runes
            const renderRune = (r, k) => `<div class="rune-item-wrapper"><img src="https://ddragon.leagueoflegends.com/cdn/img/${r.icon}" class="rune-img ${k?'keystone':''}"><span class="rune-name-label">${r.name}</span></div>`;
            const pT = rData[Math.floor(Math.random()*rData.length)];
            let sT; do { sT = rData[Math.floor(Math.random()*rData.length)]; } while(sT.id === pT.id);
            const pRunes = pT.slots.map(s => s.runes[Math.floor(Math.random()*s.runes.length)]);
            const sRunes = [...sT.slots.slice(1)].sort(() => 0.5-Math.random()).slice(0,2).map(s => s.runes[Math.floor(Math.random()*s.runes.length)]);
            document.getElementById('primary-runes').innerHTML = pRunes.map((r, i) => renderRune(r, i===0)).join("");
            document.getElementById('secondary-runes').innerHTML = sRunes.map(r => renderRune(r)).join("");

            // Spells
            let sPool = Object.values(sD.data).filter(s => s.modes.includes("CLASSIC") && s.id !== "SummonerSmiteAvatar");
            const fS = []; if(selectedLane === "JUNGLE") fS.push(sPool.find(s => s.id === "SummonerSmite"));
            sPool = sPool.filter(s => s.id !== "SummonerSmite");
            while(fS.length < 2) { const r = sPool[Math.floor(Math.random()*sPool.length)]; if(!fS.some(s => s.id === r.id)) fS.push(r); }
            document.getElementById('spells-display').innerHTML = fS.map(s => `<img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/spell/${s.id}.png" class="spell-img" onmouseenter="showTooltip('${s.name}', '${s.description.replace(/<[^>]*>?/gm, '')}')" onmouseleave="hideTooltip()">`).join("");

            // Items
            let bP = [], iP = [];
            for(let id in iD.data) { const it = iD.data[id]; if(it.maps[11] && it.gold.purchasable && !it.requiredChampion) { if(it.tags.includes("Boots") && it.gold.total > 500) bP.push(id); else if(!it.into && it.gold.total >= 2500) iP.push(id); } }
            const b = []; if(champ.id !== "Cassiopeia") b.push(bP[Math.floor(Math.random()*bP.length)]);
            while(b.length < 6) { const rI = iP[Math.floor(Math.random()*iP.length)]; let c = EXCLUSIVE_GROUPS.some(g => g.includes(rI) && b.some(o => g.includes(o))); if(!b.includes(rI) && !c) b.push(rI); }
            document.getElementById('build-display').innerHTML = b.map(id => `<div class="item-slot" onmouseenter="showTooltip('${iD.data[id].name}', '${iD.data[id].description.replace(/<[^>]*>?/gm, '')}')" onmouseleave="hideTooltip()"><img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/item/${id}.png"></div>`).join("");

            document.getElementById('result-area').classList.remove('hidden');
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } catch(e) { console.error(e); }
        btn.classList.remove('loading'); btn.disabled = false;
    }, 1200);
}
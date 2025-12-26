const VERSION = "14.24.1"; 
let selectedLane = "ALL";
let allChampions = [];

// Sayfa yüklendiğinde şampiyonları önbelleğe al
window.onload = async () => {
    try {
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/champion.json`);
        const data = await res.json();
        allChampions = Object.values(data.data);
    } catch(e) { 
        console.error("Şampiyonlar yüklenemedi:", e); 
    }
};

// Koridor Seçimi Fonksiyonu
function setLane(lane, btn) {
    selectedLane = lane;
    document.querySelectorAll('.lane-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Arama Önerileri Sistemi
document.getElementById('champ-search').addEventListener('input', function(e) {
    const value = e.target.value.toLowerCase();
    const suggestions = document.getElementById('search-suggestions');
    
    if (value.length < 1) { 
        suggestions.style.display = 'none'; 
        return; 
    }

    const filtered = allChampions.filter(c => c.name.toLowerCase().includes(value));

    if (filtered.length > 0) {
        suggestions.innerHTML = filtered.map(c => `
            <div class="suggestion-item" onclick="selectChampion('${c.name}')">
                <img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${c.id}.png">
                <span>${c.name}</span>
            </div>
        `).join("");
        suggestions.style.display = 'block';
    } else { 
        suggestions.style.display = 'none'; 
    }
});

function selectChampion(name) {
    document.getElementById('champ-search').value = name;
    document.getElementById('search-suggestions').style.display = 'none';
}

// ANA FONKSİYON: BUILD OLUŞTURMA
async function generateBuild() {
    const btn = document.getElementById('generate-btn');
    const searchVal = document.getElementById('champ-search').value.trim().toLowerCase();
    btn.innerText = "HEXTECH İŞLENİYOR...";
    
    try {
        const [itemRes, runeRes, spellRes] = await Promise.all([
            fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/item.json`),
            fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/runesReforged.json`),
            fetch(`https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/tr_TR/summoner.json`)
        ]);

        const itemsData = await itemRes.json();
        const runesData = await runeRes.json();
        const spellsData = await spellRes.json();

        // --- 1. ŞAMPİYON BELİRLEME ---
        let selectedChamp;
        if (searchVal) {
            selectedChamp = allChampions.find(c => c.name.toLowerCase().includes(searchVal));
        } 
        
        if (!selectedChamp) {
            let pool = [...allChampions];
            if (selectedLane !== "ALL") {
                pool = pool.filter(c => {
                    if (selectedLane === "TOP") return c.tags.includes("Tank") || c.tags.includes("Fighter");
                    if (selectedLane === "JUNGLE") return c.tags.includes("Assassin") || c.tags.includes("Fighter") || c.tags.includes("Tank");
                    if (selectedLane === "MIDDLE") return c.tags.includes("Mage") || c.tags.includes("Assassin");
                    if (selectedLane === "BOTTOM") return c.tags.includes("Marksman");
                    if (selectedLane === "UTILITY") return c.tags.includes("Support") || c.tags.includes("Mage");
                });
            }
            selectedChamp = pool[Math.floor(Math.random() * pool.length)];
        }

        document.getElementById('champ-img').src = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${selectedChamp.id}.png`;
        document.getElementById('champ-name').innerText = selectedChamp.name.toUpperCase();

        // --- 2. SİHİRDAR BÜYÜLERİ (DÜZELTİLMİŞ KISIM) ---
        let spellsPool = Object.values(spellsData.data).filter(s => s.modes.includes("CLASSIC") && s.id !== "SummonerSmiteAvatar");
        const finalSpells = [];

        // JUNGLE seçiliyse Smite'ı ekle, değilse Smite'ı havuzdan tamamen çıkar
        const smiteSpell = spellsPool.find(s => s.id === "SummonerSmite");

        if (selectedLane === "JUNGLE") {
            finalSpells.push(smiteSpell);
        }

        // Smite'ı havuzdan çıkarıyoruz (Her durumda: JNG ise zaten ekledik, değilse gelmesini istemiyoruz)
        spellsPool = spellsPool.filter(s => s.id !== "SummonerSmite");

        while(finalSpells.length < 2) {
            const randomIndex = Math.floor(Math.random() * spellsPool.length);
            const r = spellsPool[randomIndex];
            if(!finalSpells.some(s => s.id === r.id)) {
                finalSpells.push(r);
            }
        }
        document.getElementById('spells-display').innerHTML = finalSpells.map(s => 
            `<img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/spell/${s.id}.png" class="spell-img" title="${s.name}">`
        ).join("");

        // --- 3. EŞYALAR (1 BOT + 5 TAMAMLANMIŞ) ---
        let bootsPool = [], itemsPool = [];
        for (let id in itemsData.data) {
            const item = itemsData.data[id];
            if (item.maps[11] && item.gold.purchasable && !item.requiredChampion) {
                if (item.tags.includes("Boots") && item.gold.total > 500) bootsPool.push(id);
                else if (!item.into && item.gold.total >= 2800) itemsPool.push(id);
            }
        }
        const build = [];
        if (selectedChamp.id !== "Cassiopeia") {
            build.push(bootsPool[Math.floor(Math.random() * bootsPool.length)]);
        }
        while (build.length < 6) {
            const rId = itemsPool[Math.floor(Math.random() * itemsPool.length)];
            if (!build.includes(rId)) build.push(rId);
        }
        document.getElementById('build-display').innerHTML = build.map(id => 
            `<div class="item-slot"><img src="https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/item/${id}.png"></div>`
        ).join("");

        // --- 4. RÜNLER ---
        const pTree = runesData[Math.floor(Math.random() * runesData.length)];
        let sTree; 
        do { sTree = runesData[Math.floor(Math.random() * runesData.length)]; } while (sTree.id === pTree.id);
        
        const pRunes = pTree.slots.map(s => s.runes[Math.floor(Math.random() * s.runes.length)]);
        const sSlots = [...sTree.slots.slice(1)].sort(() => 0.5 - Math.random()).slice(0, 2);
        const sRunes = sSlots.map(s => s.runes[Math.floor(Math.random() * s.runes.length)]);

        document.getElementById('primary-runes').innerHTML = "<h4>ANA AĞAÇ</h4>" + pRunes.map((r, i) => 
            `<img src="https://ddragon.leagueoflegends.com/cdn/img/${r.icon}" class="rune-img ${i===0?'keystone':''}" title="${r.name}">`
        ).join("");
        document.getElementById('secondary-runes').innerHTML = "<h4>YAN AĞAÇ</h4>" + sRunes.map(r => 
            `<img src="https://ddragon.leagueoflegends.com/cdn/img/${r.icon}" class="rune-img" title="${r.name}">`
        ).join("");

        document.getElementById('result-area').classList.remove('hidden');
    } catch (e) { 
        console.error("Hata:", e); 
    }
    btn.innerText = "HEXTECH OLUŞTUR";
}
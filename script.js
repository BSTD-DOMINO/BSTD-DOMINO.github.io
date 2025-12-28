const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxD9J2olFdDqcAkt2e6BMYKshz5oWIS0kVQnG7yktbe32adgLm7qH_qANJtR7q7GQB6/exec"; 

let currentUser = JSON.parse(localStorage.getItem('userData')) || null;

let rankThresholds = currentUser ? (currentUser.rankThresholds || {rank2:100, rank3:500, rank4:1000, rank5:5000, rank6:10000}) : null;

let activeTestQuestions = [];
let currentQuestionIndex = 0;
let currentTestScore = 0;
let isTakingMandatory = false;
let draftQuestions = [];
let newsBlocks = [];

console.log("Script Loaded Correctly v5.1 (Informant Fix) ✅");

window.onload = function() {
    if (currentUser) {
        loginSuccess(currentUser);
    } else {
        showSection('login');
    }
};

function toggleMenu() {
    document.getElementById("dropdownMenu").classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('.profile-header') && !event.target.matches('.profile-header *')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}


function performRegister() {
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;
    const statusDiv = document.getElementById('regStatus');
    const btn = document.getElementById('btnReg');

    if(!user || !pass) {
        statusDiv.innerText = "Заповніть усі поля!";
        statusDiv.style.color = "red";
        return;
    }

    btn.disabled = true;
    statusDiv.innerText = "Реєструємо...";
    statusDiv.style.color = "blue";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "register", username: user, password: pass })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        if(data.status === "success") {
            statusDiv.innerText = "Успішно! Увійдіть.";
            statusDiv.style.color = "green";
            setTimeout(() => showSection('login'), 1500);
        } else {
            statusDiv.innerText = data.message;
            statusDiv.style.color = "red";
        }
    })
    .catch(err => {
        btn.disabled = false;
        statusDiv.innerText = "Помилка з'єднання.";
        console.error(err);
    });
}


function performLogin() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const statusDiv = document.getElementById('loginStatus');
    const btn = document.getElementById('btnLogin');

    if(!user || !pass) {
        statusDiv.innerText = "Введіть дані!";
        return;
    }

    btn.disabled = true;
    statusDiv.innerText = "Перевірка...";
    statusDiv.style.color = "blue";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "login", username: user, password: pass })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        if(data.status === "success") {
            const u = data.data;
            const userData = {
                username: user,
                score: u.score,
                team: u.team,
                test_passed: u.test_passed,
                role: u.role,
                completed_ids: u.completed_ids,
                avatar: u.avatar,        
                description: u.description,
                rankThresholds: u.rankThresholds
            };
            currentUser = userData;
            rankThresholds = u.rankThresholds;
            localStorage.setItem('userData', JSON.stringify(userData));
            loginSuccess(userData);
        } else {
            statusDiv.innerText = data.message;
            statusDiv.style.color = "red";
        }
    })
    .catch(err => {
        btn.disabled = false;
        statusDiv.innerText = "Помилка.";
        console.error(err);
    });
}

function loginSuccess(u) {
    document.getElementById('cornerUsername').innerText = u.username;
    document.getElementById('profileName').innerText = u.username;
    
    const headerName = document.getElementById('profileNameHeader');
    if(headerName) headerName.innerText = u.username;
    
    const bigAvatar = document.getElementById('profileAvatarBig');
    if (u.avatar && u.avatar.startsWith('http')) {
        bigAvatar.src = u.avatar;
    } else {
        bigAvatar.src = "https://via.placeholder.com/150";
    }

    const descEl = document.getElementById('profileDescription');
    if(descEl) descEl.innerText = u.description || "(Немає опису)";

    const firstLetter = u.username.charAt(0);
    const avatarEl = document.getElementById('avatarCircle');
    if(avatarEl) avatarEl.innerText = firstLetter;

    document.getElementById('profileScore').innerText = u.score;
    document.getElementById('profileTeam').innerText = u.team;
    
    
    const rankCont = document.getElementById('rankContainer');
    if (u.team === "ВСТД") {
        if(rankCont) {
            rankCont.style.display = "block";
            document.getElementById('profileRank').innerText = calculateRankName(parseInt(u.score));
        }
    } else {
        if(rankCont) rankCont.style.display = "none";
    }
    
    const teamStatusText = document.getElementById('teamStatusText');
    if(teamStatusText) teamStatusText.innerText = u.team;
    
    
    const adminBtn = document.getElementById('adminBtn');
    if (u.role === 'admin') {
        adminBtn.style.display = 'block';
    } else {
        adminBtn.style.display = 'none';
    }

    
    const adminPanel = document.getElementById('adminInformantPanel');
    if (adminPanel) {
        adminPanel.style.display = (u.role === 'admin') ? 'block' : 'none';
    }

    document.getElementById('profileCorner').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginStatus').innerText = '';
    
    let passedStatus = String(u.test_passed).toLowerCase();

    if (passedStatus === "false" && u.role !== 'admin') {
        startMandatoryTest(); 
    } else {
        showSection('main');
    }
}


function calculateRankName(score) {
    if (!rankThresholds) return "1 Учень";
    if (score >= rankThresholds.rank6) return "6 Рада Сталі Дрючка";
    if (score >= rankThresholds.rank5) return "5 Начальник-Господар";
    if (score >= rankThresholds.rank4) return "4 Інженер-Керівник";
    if (score >= rankThresholds.rank3) return "3 Майстер-Наставник";
    if (score >= rankThresholds.rank2) return "2 Робітник-Ідеолог";
    return "1 Учень";
}

function handleLogout() {
    localStorage.removeItem('userData');
    currentUser = null;
    document.getElementById('profileCorner').style.display = 'none';
    document.getElementById('adminBtn').style.display = 'none';
    showSection('login');
}


function showSection(sectionName) {
    const sections = ['login', 'register', 'main', 'profile', 'news', 'team', 'bstd', 'support', 'admin', 'testPlayer', 'tests', 'userList', 'createNews', 'newsReader'];
    
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if(el) el.classList.add('hidden');
    });
    
    if (sectionName === 'tests') {
        loadOptionalTests();
    }
    if (sectionName === 'news') {
        loadNewsFeed();
    }
    
    
    if (sectionName === 'main') {
        loadInformantMessage();
    }

    const target = document.getElementById(sectionName + 'Section');
    if (target) target.classList.remove('hidden');

    const dropdown = document.getElementById("dropdownMenu");
    if (dropdown) dropdown.classList.remove('show');
}


function loadInformantMessage() {
    const display = document.getElementById('informantDisplay');
    if (!display) return;
    
    if(display.innerText.includes("Завантаження")) display.innerHTML = "<em>Оновлення...</em>";
    
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "getInformantMessage" }) })
    .then(r => r.json())
    .then(d => {
        if (d.status === 'success') {
            display.innerText = d.message || "Наразі важливих оголошень немає.";
        } else {
            display.innerText = "Не вдалося завантажити оголошення.";
        }
    })
    .catch(e => {
        display.innerText = "Помилка з'єднання.";
        console.error(e);
    });
}

function saveInformantMessage() {
    const text = document.getElementById('informantInput').value;
    if (!text.trim()) { alert("Напишіть повідомлення!"); return; }
    
    if (!currentUser || currentUser.role !== 'admin') { alert("Тільки для адміністраторів!"); return; }

    
    const btn = document.querySelector('#adminInformantPanel button');
    const originalText = btn.innerText;
    btn.innerText = "Публікуємо...";
    btn.disabled = true;

    fetch(GOOGLE_SCRIPT_URL, { 
        method: "POST", 
        body: JSON.stringify({ 
            action: "saveInformantMessage", 
            message: text,
            role: currentUser.role 
        }) 
    })
    .then(r => r.json())
    .then(d => {
        alert(d.message);
        if (d.status === 'success') {
            document.getElementById('informantInput').value = ""; 
            loadInformantMessage(); 
        }
    })
    .catch(e => {
        alert("Помилка публікації.");
        console.error(e);
    })
    .finally(() => {
        btn.innerText = originalText;
        btn.disabled = false;
    });
}


function openTeamPage() {
    if (currentUser.team === "ВСТД") {
        showSection('bstd');
        loadBSTDStats();
    } else {
        showSection('team');
        document.getElementById('teamNameGeneric').innerText = currentUser.team || "Не розподілено";
    }
}

function loadBSTDStats() {
    const statsDiv = document.getElementById('bstdStats');
    statsDiv.innerHTML = "Рахуємо інженерів...";
    
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "getBSTDStats" }) })
    .then(r => r.json())
    .then(data => {
        const s = data.stats;
        statsDiv.innerHTML = `
            Вже з нами:<br>
            <span style="color:blue">${s.engineers}</span> інженерів, 
            <span style="color:green">${s.masters}</span> майстрів, 
            <span style="color:orange">${s.workers}</span> робітників
        `;
    });
}


function openRankDistribution() {
    const div = document.getElementById('rankSettings');
    div.classList.toggle('hidden');
    
    if (rankThresholds) {
        document.getElementById('r2_val').value = rankThresholds.rank2;
        document.getElementById('r3_val').value = rankThresholds.rank3;
        document.getElementById('r4_val').value = rankThresholds.rank4;
        document.getElementById('r5_val').value = rankThresholds.rank5;
        document.getElementById('r6_val').value = rankThresholds.rank6;
    }
}

function saveRanks() {
    const r2 = document.getElementById('r2_val').value;
    const r3 = document.getElementById('r3_val').value;
    const r4 = document.getElementById('r4_val').value;
    const r5 = document.getElementById('r5_val').value;
    const r6 = document.getElementById('r6_val').value;

    fetch(GOOGLE_SCRIPT_URL, { 
        method: "POST", 
        body: JSON.stringify({ action: "saveRankSettings", r2:r2, r3:r3, r4:r4, r5:r5, r6:r6 }) 
    })
    .then(r => r.json())
    .then(d => {
        alert(d.message);
        rankThresholds = { rank2:r2, rank3:r3, rank4:r4, rank5:r5, rank6:r6 };
    });
}

function sendFeedback() {
    const text = document.getElementById('supportMessage').value;
    const btn = document.getElementById('btnSupport');

    if (!text.trim()) { alert("Напишіть щось!"); return; }
    
    if(btn) btn.disabled = true;
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "feedback", username: currentUser.username, message: text })
    })
    .then(res => res.json())
    .then(data => {
        if(btn) btn.disabled = false;
        alert("Відправлено!");
        document.getElementById('supportMessage').value = "";
    });
}


function openNewsCreator() {
    showSection('createNews');
    const container = document.getElementById('newsContentBuilder');
    container.innerHTML = '<p id="emptyMsg" style="color:grey; text-align:center;">Додайте блоки...</p>';
    document.getElementById('newsTitle').value = "";
    document.getElementById('newsSubtitle').value = "";
    document.getElementById('newsTargetValue').value = "";
    document.getElementById('newsCoverFile').value = "";
    document.getElementById('newsCoverStatus').innerText = "";
}

function toggleNewsTargetInput() {
    const type = document.getElementById('newsTargetType').value;
    const input = document.getElementById('newsTargetValue');
    if (type === 'all') input.style.display = 'none';
    else input.style.display = 'block';
}

function checkEmptyMsg() {
    const msg = document.getElementById('emptyMsg');
    if(msg) msg.remove();
}

function addNewsTextBlock() {
    checkEmptyMsg();
    const container = document.getElementById('newsContentBuilder');
    const div = document.createElement('div');
    div.style = "margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; background: #f9f9f9; position: relative; border-radius: 5px;";
    div.innerHTML = `
        <span style="font-weight:bold; font-size:0.8em; color:grey;">📝 ТЕКСТ</span>
        <textarea class="news-text-input" style="width:100%; height:80px; margin-top:5px; border: 1px solid #ccc; border-radius: 4px; padding: 5px;" placeholder="Пишіть текст тут..."></textarea>
        <button onclick="this.parentElement.remove()" style="position:absolute; top:5px; right:5px; width:auto; padding:2px 8px; background:red; color:white; border:none; border-radius:3px; cursor:pointer;">X</button>
    `;
    container.appendChild(div);
}

function addNewsImageBlock() {
    checkEmptyMsg();
    const container = document.getElementById('newsContentBuilder');
    const div = document.createElement('div');
    div.style = "margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; background: #eef; position: relative; border-radius: 5px;";
    div.innerHTML = `
        <span style="font-weight:bold; font-size:0.8em; color:grey;">📷 ФОТО</span>
        <input type="file" class="news-file-input" accept="image/*" style="margin-top:5px;">
        <p class="status-text" style="font-size:0.8em; color:blue; margin: 5px 0 0 0;"></p>
        <button onclick="this.parentElement.remove()" style="position:absolute; top:5px; right:5px; width:auto; padding:2px 8px; background:red; color:white; border:none; border-radius:3px; cursor:pointer;">X</button>
    `;
    container.appendChild(div);
}

async function publishNews() {
    const title = document.getElementById('newsTitle').value;
    const subtitle = document.getElementById('newsSubtitle').value;
    const targetType = document.getElementById('newsTargetType').value;
    const targetValue = document.getElementById('newsTargetValue').value;
    const coverFile = document.getElementById('newsCoverFile').files[0];
    
    if (!title) { alert("Введіть заголовок новини!"); return; }
    
    const container = document.getElementById('newsContentBuilder');
    const children = container.children;
    
    if (children.length === 0 || (children.length === 1 && children[0].id === 'emptyMsg')) {
        if(!confirm("Створити пусту новину?")) return;
    }

    let contentData = [];
    
    const uploadFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const rawData = e.target.result.split(',')[1];
                fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "uploadImage", fileName: file.name, mimeType: file.type, fileData: rawData }) })
                .then(res => res.json())
                .then(data => { if(data.status==='success') resolve(data.imageUrl); else reject("Error uploading"); })
                .catch(err => reject(err));
            };
            reader.readAsDataURL(file);
        });
    };

    alert("Публікація... Це може зайняти час.");

    let coverUrl = "https://via.placeholder.com/300x150?text=News";
    if (coverFile) {
        try {
            document.getElementById('newsCoverStatus').innerText = "Вантажу обкладинку...";
            coverUrl = await uploadFile(coverFile);
        } catch(e) { alert("Помилка завантаження обкладинки"); return; }
    }

    for (let div of children) {
        if (div.id === 'emptyMsg') continue;
        const textArea = div.querySelector('.news-text-input');
        if (textArea) {
            contentData.push({ type: 'text', value: textArea.value });
            continue;
        }
        const fileInput = div.querySelector('.news-file-input');
        if (fileInput) {
            if (fileInput.files.length > 0) {
                try {
                    div.querySelector('.status-text').innerText = " Вантажу...";
                    const url = await uploadFile(fileInput.files[0]);
                    contentData.push({ type: 'image', value: url });
                    div.querySelector('.status-text').innerText = " Ок";
                } catch(e) { 
                    alert("Помилка фото в блоці"); 
                    div.querySelector('.status-text').innerText = " Помилка";
                    return; 
                }
            }
        }
    }

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "addNews",
            title: title,
            subtitle: subtitle,
            coverImage: coverUrl,
            content: contentData,
            targetType: targetType,
            targetValue: targetValue
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        showSection('news');
    });
}


function loadNewsFeed() {
    const container = document.getElementById('newsFeedContainer');
    container.innerHTML = "<p>Оновлення стрічки...</p>";
    
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getNews", username: currentUser.username })
    })
    .then(res => res.json())
    .then(data => {
        container.innerHTML = "";
        if (data.news.length === 0) { container.innerHTML = "<p>Новин немає.</p>"; return; }
        
        data.news.forEach(n => {
            const div = document.createElement('div');
            div.className = "news-card";
            div.style = "background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; cursor: pointer; transition: transform 0.2s;";
            
            div.onmouseover = function() { this.style.transform = "scale(1.02)"; }
            div.onmouseout = function() { this.style.transform = "scale(1)"; }
            div.onclick = function() { openNewsReader(n); };
            
            div.innerHTML = `
                <img src="${n.coverImage}" style="width: 100%; height: 180px; object-fit: cover;">
                <div style="padding: 15px;">
                    <h3 style="margin: 0 0 5px 0;">${n.title}</h3>
                    <p style="color: grey; font-size: 0.9em; margin: 0;">${n.subtitle || ""}</p>
                    <span style="font-size: 0.7em; color: #aaa;">${n.date}</span>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

function openNewsReader(newsItem) {
    showSection('newsReader');
    document.getElementById('readerTitle').innerText = newsItem.title;
    document.getElementById('readerSubtitle').innerText = newsItem.subtitle || "";
    document.getElementById('readerDate').innerText = newsItem.date;
    
    const contentDiv = document.getElementById('readerContent');
    contentDiv.innerHTML = "";
    
    newsItem.content.forEach(block => {
        if (block.type === 'text') {
            const p = document.createElement('p');
            p.innerText = block.value;
            p.style = "margin-bottom: 15px; white-space: pre-wrap; font-size: 1.1em; line-height: 1.6;";
            contentDiv.appendChild(p);
        } else if (block.type === 'image') {
            const img = document.createElement('img');
            img.src = block.value;
            img.style = "width: 100%; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);";
            contentDiv.appendChild(img);
        }
    });
}


function loadUserManagement() {
    showSection('userList');
    const container = document.getElementById('allUsersContainer');
    container.innerHTML = "<p>Завантаження списку...</p>";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getAllUsers" })
    })
    .then(res => res.json())
    .then(data => {
        container.innerHTML = "";
        if (data.users.length === 0) {
            container.innerHTML = "Список порожній.";
            return;
        }

        data.users.forEach(u => {
            const div = document.createElement('div');
            div.style = "background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;";
            
            div.innerHTML = `
                <div style="display:flex; gap:15px; align-items:center;">
                    <img src="${u.avatar || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
                    <div>
                        <strong style="font-size:1.2em;">${u.username}</strong>
                        <span style="color:grey; font-size:0.8em;">(${u.role})</span>
                    </div>
                </div>
                <hr style="margin:10px 0;">
                <label>Партія:</label>
                <input type="text" id="team_${u.username}" value="${u.team}" style="margin-bottom:5px;">
                <label>Опис:</label>
                <textarea id="desc_${u.username}" rows="2" style="margin-bottom:5px;">${u.description}</textarea>
                <label>Нова аватарка (з ПК):</label>
                <input type="file" id="file_${u.username}" accept="image/*">
                <button onclick="saveUserChanges('${u.username}')" style="background: #4f46e5; margin-top:10px;">Зберегти зміни</button>
            `;
            container.appendChild(div);
        });
    });
}

function saveUserChanges(username) {
    const newTeam = document.getElementById(`team_${username}`).value;
    const newDesc = document.getElementById(`desc_${username}`).value;
    const fileInput = document.getElementById(`file_${username}`);
    
    const sendUpdate = (avatarUrl) => {
        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "updateUserProfile",
                targetUser: username,
                newTeam: newTeam,
                newDesc: newDesc,
                newAvatar: avatarUrl 
            })
        })
        .then(res => res.json())
        .then(data => { alert(data.message); });
    };

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        alert("Вантажимо фото... Зачекайте!");
        reader.onload = function(e) {
            const rawData = e.target.result.split(',')[1];
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "uploadImage", fileName: file.name, mimeType: file.type, fileData: rawData })
            })
            .then(res => res.json())
            .then(data => {
                if(data.status === "success") { sendUpdate(data.imageUrl); } 
                else { alert("Помилка фото: " + data.message); }
            });
        };
        reader.readAsDataURL(file);
    } else {
        sendUpdate(null);
    }
}


function addAnswerField() {
    const container = document.getElementById('answersContainer');
    container.innerHTML += `<br><input type="text" class="ans-text" placeholder="Відповідь"><input type="number" class="ans-score" placeholder="Бали">`;
}

function addToDraft() {
    const fileInput = document.getElementById('newQFile');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        document.getElementById('uploadStatus').innerText = "Вантажу...";
        reader.onload = function(e) {
            const rawData = e.target.result.split(',')[1];
            fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "uploadImage", fileName: file.name, mimeType: file.type, fileData: rawData }) })
            .then(res => res.json())
            .then(data => {
                document.getElementById('uploadStatus').innerText = "Ок";
                pushQuestionToArray(data.imageUrl);
            });
        };
        reader.readAsDataURL(file);
    } else { pushQuestionToArray(""); }
}

function pushQuestionToArray(imgUrl) {
    const type = document.getElementById('newQType').value;
    const text = document.getElementById('newQText').value;
    const ansTexts = document.querySelectorAll('.ans-text');
    const ansScores = document.querySelectorAll('.ans-score');
    let answers = [];
    for(let i=0; i<ansTexts.length; i++) {
        if(ansTexts[i].value) {
            answers.push({ text: ansTexts[i].value, score: parseInt(ansScores[i].value) || 0 });
        }
    }
    if (!text || answers.length < 1) { alert("Заповніть текст і варіанти!"); return; }
    draftQuestions.push({ type, question: text, image: imgUrl, answers });
    renderDraftList();
    document.getElementById('newQText').value = '';
    document.getElementById('newQFile').value = '';
    document.getElementById('answersContainer').innerHTML = `<input type="text" class="ans-text" placeholder="Відповідь 1"><input type="number" class="ans-score" placeholder="Бали"><br><input type="text" class="ans-text" placeholder="Відповідь 2"><input type="number" class="ans-score" placeholder="Бали">`;
}

function renderDraftList() {
    const listDiv = document.getElementById('draftList');
    const btn = document.getElementById('btnPublish');
    if (draftQuestions.length === 0) { listDiv.innerHTML = '<p style="color: grey;">Пусто...</p>'; btn.style.display = 'none'; return; }
    let html = '';
    draftQuestions.forEach((q, i) => {
        html += `<div><strong>${i + 1}.</strong> ${q.question} <button onclick="removeDraft(${i})" style="background: red; color: white;">🗑️</button></div>`;
    });
    listDiv.innerHTML = html;
    btn.style.display = 'block';
    btn.innerText = `ЗАВАНТАЖИТИ (${draftQuestions.length})`;
}

function removeDraft(index) {
    draftQuestions.splice(index, 1);
    renderDraftList();
}

function publishTest() {
    if (draftQuestions.length === 0) return;
    const btn = document.getElementById('btnPublish');
    btn.disabled = true;
    btn.innerText = "Відправка...";
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "addQuestionBatch", questions: draftQuestions }) })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        draftQuestions = [];
        renderDraftList();
        btn.disabled = false;
    });
}


function loadOptionalTests() {
    const container = document.getElementById('testsListContainer');
    container.innerHTML = "<p>Оновлення...</p>";
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "getTests", type: "optional" }) })
    .then(res => res.json())
    .then(data => {
        container.innerHTML = "";
        const completed = currentUser.completed_ids ? String(currentUser.completed_ids).split(',') : [];
        const available = data.data.filter(q => !completed.includes(String(q.id)));
        if (available.length === 0) { container.innerHTML = "<p>Всі тести пройдено!</p>"; return; }
        available.forEach(q => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerHTML = `📝 ${q.text}`;
            btn.onclick = function() { startSingleTest(q); };
            container.appendChild(btn);
        });
    });
}

function startSingleTest(q) {
    activeTestQuestions = [q]; currentQuestionIndex = 0; currentTestScore = 0; isTakingMandatory = false; renderQuestion();
}

function startMandatoryTest() {
    document.getElementById('profileCorner').style.display = 'none';
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "getTests", type: "mandatory" }) })
    .then(res => res.json())
    .then(data => {
        if (data.data.length === 0) { showSection('main'); document.getElementById('profileCorner').style.display = 'flex'; return; }
        activeTestQuestions = data.data; currentQuestionIndex = 0; currentTestScore = 0; isTakingMandatory = true; renderQuestion();
    });
}

function renderQuestion() {
    showSection('testPlayer');
    const q = activeTestQuestions[currentQuestionIndex];
    document.getElementById('testQuestionText').innerText = q.text;
    document.getElementById('testQuestionText').style.display = 'block'; 
    
    
    const qCur = document.getElementById('qCurrent'); if(qCur) qCur.innerText = currentQuestionIndex + 1;
    const qTot = document.getElementById('qTotal'); if(qTot) qTot.innerText = activeTestQuestions.length;

    const img = document.getElementById('testImage');
    if (q.image) { img.src = q.image; img.style.display = 'block'; } else { img.style.display = 'none'; }
    
    const ansDiv = document.getElementById('testAnswers');
    ansDiv.innerHTML = '';
    
    q.answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = ans.text;
        
        btn.onclick = function() {
            this.style.background = "#e67e22"; 
            this.innerText = "⏳...";
            submitAnswer(ans.score);
        };
        ansDiv.appendChild(btn);
    });
}

function submitAnswer(score) {
    currentTestScore += parseInt(score) || 0;
    currentQuestionIndex++;
    
    setTimeout(() => {
        if (currentQuestionIndex < activeTestQuestions.length) { 
            renderQuestion(); 
        } else { 
            document.getElementById('testAnswers').innerHTML = '<h3 style="color: blue;"> Зберігаємо результат...</h3>';
            document.getElementById('testQuestionText').style.display = 'none';
            finishTest(); 
        }
    }, 200);
}

function finishTest() {
    let ids = activeTestQuestions.map(q => q.id);
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ 
            action: "submitTestResult", 
            username: currentUser.username, 
            points: currentTestScore, 
            isMandatory: isTakingMandatory, 
            passedIds: ids 
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'error') {
            alert("Помилка сервера: " + data.message);
            showSection('main');
            return;
        }

        alert("Тест завершено! Ваш результат: " + currentTestScore);
        currentUser.score = data.newScore;
        if (data.combinedIds) currentUser.completed_ids = data.combinedIds;
        if(isTakingMandatory) currentUser.test_passed = "true";
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        document.getElementById('profileCorner').style.display = 'flex';
        showSection(isTakingMandatory ? 'main' : 'tests');
    })
    .catch(err => {
        alert("Критична помилка збереження! Перевірте консоль (F12).");
        console.error(err);
        showSection('main');
    });
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxD9J2olFdDqcAkt2e6BMYKshz5oWIS0kVQnG7yktbe32adgLm7qH_qANJtR7q7GQB6/exec"; 


let currentUser = JSON.parse(localStorage.getItem('userData')) || null;
let rankThresholds = currentUser && currentUser.rankThresholds ? currentUser.rankThresholds : {
    rank2: 100, rank3: 500, rank4: 1000, rank5: 5000, rank6: 10000
};

let activeTestQuestions = [];
let currentQuestionIndex = 0;
let currentTestScore = 0;
let isTakingMandatory = false;
let draftQuestions = [];
let newsBlocks = [];

console.log("Script Loaded Correctly ✅");

window.onload = function() {
    if (currentUser) {
        loginSuccess(currentUser);
    } else {
        showSection('login');
    }
};

function toggleMenu() { document.getElementById("dropdownMenu").classList.toggle("show"); }
window.onclick = function(event) { if (!event.target.matches('.profile-header') && !event.target.matches('.profile-header *')) { var dropdowns = document.getElementsByClassName("dropdown-content"); for (var i = 0; i < dropdowns.length; i++) { var openDropdown = dropdowns[i]; if (openDropdown.classList.contains('show')) { openDropdown.classList.remove('show'); } } } }



function performRegister() {
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;
    const statusDiv = document.getElementById('regStatus');
    const btn = document.getElementById('btnReg');

    if(!user || !pass) { statusDiv.innerText = "Заповніть усі поля!"; statusDiv.style.color = "red"; return; }

    btn.disabled = true; statusDiv.innerText = "Реєструємо..."; statusDiv.style.color = "blue";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "register", username: user, password: pass })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        if(data.status === "success") {
            statusDiv.innerText = "Успішно! Увійдіть."; statusDiv.style.color = "green";
            setTimeout(() => showSection('login'), 1500);
        } else {
            statusDiv.innerText = data.message; statusDiv.style.color = "red";
        }
    })
    .catch(err => { btn.disabled = false; statusDiv.innerText = "Помилка з'єднання."; });
}

function performLogin() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const statusDiv = document.getElementById('loginStatus');
    const btn = document.getElementById('btnLogin');

    if(!user || !pass) { statusDiv.innerText = "Введіть дані!"; return; }

    btn.disabled = true; statusDiv.innerText = "Перевірка..."; statusDiv.style.color = "blue";

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
                username: user, score: u.score, team: u.team, test_passed: u.test_passed, role: u.role,
                completed_ids: u.completed_ids, avatar: u.avatar, description: u.description,
                rankThresholds: u.rankThresholds 
            };
            
            currentUser = userData;
            
            if(u.rankThresholds) rankThresholds = u.rankThresholds;
            
            localStorage.setItem('userData', JSON.stringify(userData));
            loginSuccess(userData);
        } else {
            statusDiv.innerText = data.message; statusDiv.style.color = "red";
        }
    })
    .catch(err => { btn.disabled = false; statusDiv.innerText = "Помилка."; });
}

function loginSuccess(u) {
    document.getElementById('cornerUsername').innerText = u.username;
    document.getElementById('profileName').innerText = u.username;
    document.getElementById('profileNameHeader').innerText = u.username;
    
    
    const bigAvatar = document.getElementById('profileAvatarBig');
    bigAvatar.src = (u.avatar && u.avatar.startsWith('http')) ? u.avatar : "https://via.placeholder.com/150";

    document.getElementById('profileDescription').innerText = u.description || "(Немає опису)";
    document.getElementById('avatarCircle').innerText = u.username.charAt(0);
    document.getElementById('profileScore').innerText = u.score;
    document.getElementById('profileTeam').innerText = u.team;
    
    
    const rankContainer = document.getElementById('rankContainer');
    if (u.team === "ВСТД") {
        if(rankContainer) {
            rankContainer.style.display = "block";
            document.getElementById('profileRank').innerText = calculateRankName(u.score);
        }
    } else {
        if(rankContainer) rankContainer.style.display = "none";
    }

  
    const adminBtn = document.getElementById('adminBtn');
    if (u.role === 'admin') adminBtn.style.display = 'block';
    else adminBtn.style.display = 'none';

    document.getElementById('profileCorner').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginStatus').innerText = '';
    
    let passedStatus = String(u.test_passed).toLowerCase();
    if (passedStatus === "false" && u.role !== 'admin') { startMandatoryTest(); } 
    else { showSection('main'); }
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
    
    if (sectionName === 'tests') loadOptionalTests();
    if (sectionName === 'news') loadNewsFeed();

    const target = document.getElementById(sectionName + 'Section');
    if (target) target.classList.remove('hidden');

    const dropdown = document.getElementById("dropdownMenu");
    if (dropdown) dropdown.classList.remove('show');
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
    statsDiv.innerHTML = "Підрахунок інженерів...";
    
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "getBSTDStats" }) })
    .then(r => r.json())
    .then(data => {
        if(data.status === 'success') {
            const s = data.stats;
            statsDiv.innerHTML = `
                Вже з нами:<br>
                <span style="color:blue">${s.engineers}</span> інженерів, 
                <span style="color:green">${s.masters}</span> майстрів, 
                <span style="color:orange">${s.workers}</span> робітників.
            `;
        } else {
            statsDiv.innerText = "Помилка завантаження статистики.";
        }
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
       
        rankThresholds = { rank2: parseInt(r2), rank3: parseInt(r3), rank4: parseInt(r4), rank5: parseInt(r5), rank6: parseInt(r6) };
        
        if(currentUser) {
            currentUser.rankThresholds = rankThresholds;
            localStorage.setItem('userData', JSON.stringify(currentUser));
        }
    });
}



function openNewsCreator() {
    showSection('createNews');
    const container = document.getElementById('newsContentBuilder');
    container.innerHTML = '<p id="emptyMsg" style="color:grey; text-align:center;">Додайте блоки тексту або фото (можна багато)</p>';
    document.getElementById('newsTitle').value = "";
    document.getElementById('newsSubtitle').value = "";
    document.getElementById('newsTargetValue').value = "";
    document.getElementById('newsCoverFile').value = "";
    document.getElementById('newsCoverStatus').innerText = "";
}

function toggleNewsTargetInput() {
    const type = document.getElementById('newsTargetType').value;
    const input = document.getElementById('newsTargetValue');
    input.style.display = (type === 'all') ? 'none' : 'block';
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
        <textarea class="news-text-input" style="width:100%; height:80px; margin-top:5px; border: 1px solid #ccc; padding: 5px;" placeholder="Пишіть текст..."></textarea>
        <button onclick="this.parentElement.remove()" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; cursor:pointer;">X</button>
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
        <button onclick="this.parentElement.remove()" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; cursor:pointer;">X</button>
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
                .then(data => { if(data.status==='success') resolve(data.imageUrl); else reject("Error"); })
                .catch(err => reject(err));
            };
            reader.readAsDataURL(file);
        });
    };

    alert("Публікація...");

    let coverUrl = "https://via.placeholder.com/300x150?text=News";
    if (coverFile) {
        try {
            document.getElementById('newsCoverStatus').innerText = "Вантажу обкладинку...";
            coverUrl = await uploadFile(coverFile);
        } catch(e) { alert("Помилка обкладинки"); return; }
    }

    for (let div of children) {
        if (div.id === 'emptyMsg') continue;
        const textArea = div.querySelector('.news-text-input');
        if (textArea) { contentData.push({ type: 'text', value: textArea.value }); continue; }
        const fileInput = div.querySelector('.news-file-input');
        if (fileInput && fileInput.files.length > 0) {
            try {
                div.querySelector('.status-text').innerText = "Вантажу...";
                const url = await uploadFile(fileInput.files[0]);
                contentData.push({ type: 'image', value: url });
                div.querySelector('.status-text').innerText = "Ок";
            } catch(e) { alert("Помилка фото"); return; }
        }
    }

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "addNews", title: title, subtitle: subtitle, coverImage: coverUrl,
            content: contentData, targetType: targetType, targetValue: targetValue
        })
    }).then(res => res.json()).then(data => { alert(data.message); showSection('news'); });
}


function loadNewsFeed() {
    const container = document.getElementById('newsFeedContainer');
    container.innerHTML = "<p>Оновлення...</p>";
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "getNews", username: currentUser.username }) })
    .then(res => res.json()).then(data => {
        container.innerHTML = "";
        if (data.news.length === 0) { container.innerHTML = "<p>Новин немає.</p>"; return; }
        data.news.forEach(n => {
            const div = document.createElement('div');
            div.className = "news-card";
            div.style = "background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; cursor: pointer;";
            div.onclick = function() { openNewsReader(n); };
            div.innerHTML = `<img src="${n.coverImage}" style="width: 100%; height: 180px; object-fit: cover;"><div style="padding: 15px;"><h3 style="margin: 0 0 5px 0;">${n.title}</h3><p style="color: grey; font-size: 0.9em; margin: 0;">${n.subtitle || ""}</p><span style="font-size: 0.7em; color: #aaa;">${n.date}</span></div>`;
            container.appendChild(div);
        });
    });
}

function openNewsReader(n) {
    showSection('newsReader');
    document.getElementById('readerTitle').innerText = n.title;
    document.getElementById('readerSubtitle').innerText = n.subtitle || "";
    document.getElementById('readerDate').innerText = n.date;
    const c = document.getElementById('readerContent'); c.innerHTML = "";
    n.content.forEach(b => {
        if (b.type === 'text') { const p = document.createElement('p'); p.innerText = b.value; p.style="margin-bottom:15px; white-space: pre-wrap;"; c.appendChild(p); }
        else if (b.type === 'image') { const img = document.createElement('img'); img.src = b.value; img.style="width:100%; border-radius:8px; margin-bottom:15px;"; c.appendChild(img); }
    });
}


function loadUserManagement() {
    showSection('userList');
    const container = document.getElementById('allUsersContainer');
    container.innerHTML = "<p>Завантаження...</p>";
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "getAllUsers" }) })
    .then(res => res.json()).then(data => {
        container.innerHTML = "";
        data.users.forEach(u => {
            const div = document.createElement('div');
            div.style = "background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;";
            div.innerHTML = `
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${u.avatar || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
                    <div><strong style="font-size:1.2em;">${u.username}</strong> <span style="color:grey;">(${u.role})</span></div>
                </div>
                <hr style="margin:10px 0;">
                <label>Партія:</label> <input type="text" id="team_${u.username}" value="${u.team}" style="margin-bottom:5px;">
                <label>Опис:</label> <textarea id="desc_${u.username}" rows="2" style="margin-bottom:5px;">${u.description}</textarea>
                <label>Аватар:</label> <input type="file" id="file_${u.username}" accept="image/*">
                <button onclick="saveUserChanges('${u.username}')" style="background: #4f46e5; margin-top:10px;">Зберегти</button>
            `;
            container.appendChild(div);
        });
    });
}

function saveUserChanges(username) {
    const t = document.getElementById(`team_${username}`).value;
    const d = document.getElementById(`desc_${username}`).value;
    const f = document.getElementById(`file_${username}`);
    const send = (url) => {
        fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "updateUserProfile", targetUser: username, newTeam: t, newDesc: d, newAvatar: url }) })
        .then(r => r.json()).then(res => alert(res.message));
    };
    if (f.files.length > 0) {
        const r = new FileReader();
        alert("Вантажимо фото...");
        r.onload = e => {
            fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "uploadImage", fileName: f.files[0].name, mimeType: f.files[0].type, fileData: e.target.result.split(',')[1] }) })
            .then(res => res.json()).then(data => { if(data.status==='success') send(data.imageUrl); else alert("Error photo"); });
        };
        r.readAsDataURL(f.files[0]);
    } else { send(null); }
}


function sendFeedback() {
    const txt = document.getElementById('supportMessage').value;
    if(!txt.trim()) return alert("Напишіть щось!");
    fetch(GOOGLE_SCRIPT_URL, {method:"POST", body:JSON.stringify({action:"feedback", username:currentUser.username, message:txt})}).then(r=>r.json()).then(d=>{alert("Відправлено!"); document.getElementById('supportMessage').value="";});
}


function addAnswerField() { document.getElementById('answersContainer').innerHTML += `<br><input type="text" class="ans-text" placeholder="Відп"><input type="number" class="ans-score" placeholder="Бал">`; }
function addToDraft() {
    const f = document.getElementById('newQFile');
    if(f.files.length>0) {
        const r = new FileReader(); document.getElementById('uploadStatus').innerText="Вантажу...";
        r.onload = e => {
            fetch(GOOGLE_SCRIPT_URL, {method:"POST", body:JSON.stringify({action:"uploadImage", fileName:f.files[0].name, mimeType:f.files[0].type, fileData:e.target.result.split(',')[1]})})
            .then(r=>r.json()).then(d=>{ document.getElementById('uploadStatus').innerText="Ок"; pushQ(d.imageUrl); });
        }; r.readAsDataURL(f.files[0]);
    } else pushQ("");
}
function pushQ(img) {
    const t = document.getElementById('newQText').value;
    const ans=[]; document.querySelectorAll('.ans-text').forEach((el,i)=>ans.push({text:el.value,score:document.querySelectorAll('.ans-score')[i].value}));
    if(!t || ans.length<1) return alert("Заповніть!");
    draftQuestions.push({type:document.getElementById('newQType').value, question:t, image:img, answers:ans});
    renderDraft();
}
function renderDraft() {
    const l = document.getElementById('draftList'); l.innerHTML=""; 
    draftQuestions.forEach((q,i)=>l.innerHTML+=`<div>${i+1}. ${q.question} <button onclick="draftQuestions.splice(${i},1);renderDraft();" style="background:red;color:white;">X</button></div>`);
    document.getElementById('btnPublish').style.display = draftQuestions.length>0 ? 'block' : 'none';
}
function publishTest() {
    fetch(GOOGLE_SCRIPT_URL, {method:"POST", body:JSON.stringify({action:"addQuestionBatch", questions:draftQuestions})}).then(r=>r.json()).then(d=>{alert(d.message); draftQuestions=[]; renderDraft();});
}


function loadOptionalTests() {
    document.getElementById('testsListContainer').innerHTML = "Оновлення...";
    fetch(GOOGLE_SCRIPT_URL, {method:"POST", body:JSON.stringify({action:"getTests", type:"optional"})}).then(r=>r.json()).then(d=>{
        const c = document.getElementById('testsListContainer'); c.innerHTML="";
        const done = currentUser.completed_ids ? String(currentUser.completed_ids).split(',') : [];
        const avail = d.data.filter(q=>!done.includes(String(q.id)));
        if(avail.length==0){c.innerHTML="Всі тести пройдено!";return;}
        avail.forEach(q=>{ c.innerHTML+=`<button class="btn" onclick='startTest(${JSON.stringify(q)})'>📝 ${q.text}</button>`; });
    });
}
function startTest(q) { activeTestQuestions=[q]; currentQuestionIndex=0; currentTestScore=0; isTakingMandatory=false; renderQ(); }
function startMandatoryTest() {
    document.getElementById('profileCorner').style.display='none';
    fetch(GOOGLE_SCRIPT_URL, {method:"POST", body:JSON.stringify({action:"getTests", type:"mandatory"})}).then(r=>r.json()).then(d=>{
        if(d.data.length==0){showSection('main');document.getElementById('profileCorner').style.display='flex';return;}
        activeTestQuestions=d.data; currentQuestionIndex=0; currentTestScore=0; isTakingMandatory=true; renderQ();
    });
}
function renderQ() {
    showSection('testPlayer'); const q=activeTestQuestions[currentQuestionIndex];
    document.getElementById('testQuestionText').innerText = q.text;
    const img = document.getElementById('testImage'); q.image?(img.src=q.image,img.style.display='block'):img.style.display='none';
    const ans = document.getElementById('testAnswers'); ans.innerHTML="";
    q.answers.forEach(a=>{ ans.innerHTML+=`<button class="btn" onclick="submitAns(${a.score})">${a.text}</button>`; });
}
function submitAns(s) { currentTestScore+=parseInt(s); currentQuestionIndex++; if(currentQuestionIndex<activeTestQuestions.length)renderQ(); else finishTest(); }
function finishTest() {
    let ids = activeTestQuestions.map(q=>q.id);
    fetch(GOOGLE_SCRIPT_URL, {method:"POST", body:JSON.stringify({action:"submitTestResult", username:currentUser.username, points:currentTestScore, isMandatory:isTakingMandatory, passedIds:ids})})
    .then(r=>r.json()).then(d=>{
        alert("Результат: "+currentTestScore); currentUser.score=d.newScore; if(d.combinedIds)currentUser.completed_ids=d.combinedIds;
        if(isTakingMandatory) currentUser.test_passed="true"; localStorage.setItem('userData', JSON.stringify(currentUser));
        document.getElementById('profileCorner').style.display='flex'; showSection(isTakingMandatory?'main':'tests');
    });
}

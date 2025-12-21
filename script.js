const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxD9J2olFdDqcAkt2e6BMYKshz5oWIS0kVQnG7yktbe32adgLm7qH_qANJtR7q7GQB6/exec"; 

let currentUser = JSON.parse(localStorage.getItem('userData')) || null;
let activeTestQuestions = [];
let currentQuestionIndex = 0;
let currentTestScore = 0;
let isTakingMandatory = false;


let draftQuestions = [];

console.log("Script Loaded Correctly ✅");

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
            const userData = {
                username: user,
                score: data.data.score,
                team: data.data.team,
                test_passed: data.data.test_passed,
                role: data.data.role,
                completed_ids: data.data.completed_ids
            };
            currentUser = userData;
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

function loginSuccess(userObj) {
    document.getElementById('cornerUsername').innerText = userObj.username;
    document.getElementById('profileName').innerText = userObj.username;
    
  
    const headerName = document.getElementById('profileNameHeader');
    if(headerName) headerName.innerText = userObj.username;
    
    const firstLetter = userObj.username.charAt(0);
    const avatarEl = document.getElementById('avatarCircle');
    if(avatarEl) avatarEl.innerText = firstLetter;

    document.getElementById('profileScore').innerText = userObj.score;
    document.getElementById('profileTeam').innerText = userObj.team;
    
    const teamStatusText = document.getElementById('teamStatusText');
    if(teamStatusText) teamStatusText.innerText = userObj.team;
    
    const adminBtn = document.getElementById('adminBtn');
    if (userObj.role === 'admin') {
        adminBtn.style.display = 'block';
    } else {
        adminBtn.style.display = 'none';
    }

    document.getElementById('profileCorner').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginStatus').innerText = '';
    
    let passedStatus = String(userObj.test_passed).toLowerCase();

    if (passedStatus === "false" && userObj.role !== 'admin') {
        startMandatoryTest(); 
    } else {
        showSection('main');
    }
}

function handleLogout() {
    localStorage.removeItem('userData');
    currentUser = null;
    document.getElementById('profileCorner').style.display = 'none';
    document.getElementById('adminBtn').style.display = 'none';
    showSection('login');
}


function showSection(sectionName) {
    const sections = ['login', 'register', 'main', 'profile', 'news', 'team', 'support', 'admin', 'testPlayer', 'tests'];
    
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if(el) el.classList.add('hidden');
    });
    
   
    if (sectionName === 'tests') {
        loadOptionalTests();
    }

    const target = document.getElementById(sectionName + 'Section');
    if (target) target.classList.remove('hidden');

    const dropdown = document.getElementById("dropdownMenu");
    if (dropdown) dropdown.classList.remove('show');
}

function sendFeedback() {
    const text = document.getElementById('supportMessage').value;
    const statusDiv = document.getElementById('supportStatus');
    const btn = document.getElementById('btnSupport');

    if (!text.trim()) {
        statusDiv.innerText = "Напишіть хоч щось!";
        statusDiv.style.color = "red";
        return;
    }
    if (!currentUser) {
        statusDiv.innerText = "Спочатку увійдіть в акаунт!";
        statusDiv.style.color = "red";
        return;
    }

    btn.disabled = true;
    statusDiv.innerText = "Відправляємо...";
    statusDiv.style.color = "blue";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "feedback", username: currentUser.username, message: text })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        if(data.status === "success") {
            statusDiv.innerText = "Відправлено! Дяк.";
            statusDiv.style.color = "green";
            document.getElementById('supportMessage').value = "";
        } else {
            statusDiv.innerText = "Помилка: " + data.message;
            statusDiv.style.color = "red";
        }
    })
    .catch(err => {
        btn.disabled = false;
        statusDiv.innerText = "Помилка з'єднання.";
        console.error(err);
    });
}



function addAnswerField() {
    const container = document.getElementById('answersContainer');
    container.innerHTML += `
        <br>
        <input type="text" class="ans-text" placeholder="Відповідь">
        <input type="number" class="ans-score" placeholder="Бали">
    `;
}

function addToDraft() {
    console.log("Button Clicked: addToDraft"); 

    const fileInput = document.getElementById('newQFile');
    const statusText = document.getElementById('uploadStatus');

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        statusText.innerText = "Завантаження фото...";
        
        reader.onload = function(e) {
            const rawData = e.target.result.split(',')[1];
            
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "uploadImage",
                    fileName: file.name,
                    mimeType: file.type,
                    fileData: rawData
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    statusText.innerText = "Фото ок!";
                    pushQuestionToArray(data.imageUrl);
                } else {
                    statusText.innerText = "Помилка фото.";
                    alert("Помилка: " + data.message);
                }
            });
        };
        reader.readAsDataURL(file); 
    } else {
        pushQuestionToArray(""); 
    }
}

function pushQuestionToArray(imgUrl) {
    const type = document.getElementById('newQType').value;
    const text = document.getElementById('newQText').value;
    
    const ansTexts = document.querySelectorAll('.ans-text');
    const ansScores = document.querySelectorAll('.ans-score');
    let answers = [];
    
    for(let i=0; i<ansTexts.length; i++) {
        if(ansTexts[i].value) {
            answers.push({
                text: ansTexts[i].value,
                score: parseInt(ansScores[i].value) || 0
            });
        }
    }

    if (!text || answers.length < 1) {
        alert("Заповніть текст і варіанти!");
        return;
    }

    const questionObj = {
        type: type,
        question: text,
        image: imgUrl,
        answers: answers
    };

    draftQuestions.push(questionObj);
    renderDraftList();
    
    document.getElementById('newQText').value = '';
    document.getElementById('newQFile').value = '';
    document.getElementById('uploadStatus').innerText = '';
    
    document.getElementById('answersContainer').innerHTML = `
        <input type="text" class="ans-text" placeholder="Відповідь 1">
        <input type="number" class="ans-score" placeholder="Бали">
        <br>
        <input type="text" class="ans-text" placeholder="Відповідь 2">
        <input type="number" class="ans-score" placeholder="Бали">
    `;
}

function renderDraftList() {
    const listDiv = document.getElementById('draftList');
    const btnPublish = document.getElementById('btnPublish');
    
    if (draftQuestions.length === 0) {
        listDiv.innerHTML = '<p style="color: grey;">Поки що пусто...</p>';
        btnPublish.style.display = 'none';
        return;
    }

    let html = '';
    draftQuestions.forEach((q, index) => {
        html += `
            <div style="background: #fff; padding: 10px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${index + 1}.</strong> ${q.question} 
                    <span style="font-size: 0.8em; color: grey;">(${q.type})</span>
                </div>
                <button onclick="removeDraft(${index})" style="background: red; color: white; padding: 5px 10px; font-size: 12px; width: auto; cursor: pointer;">🗑️</button>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
    btnPublish.style.display = 'block';
    btnPublish.innerText = `🚀 ЗАВАНТАЖИТИ ВЕСЬ ТЕСТ (${draftQuestions.length})`;
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

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "addQuestionBatch",
            questions: draftQuestions
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
            draftQuestions = [];
            renderDraftList();
        } else {
            alert("Помилка: " + data.message);
        }
        btn.disabled = false;
        btn.innerText = "ЗАВАНТАЖИТИ ВЕСЬ ТЕСТ";
    })
    .catch(err => {
        console.error(err);
        alert("Помилка з'єднання");
        btn.disabled = false;
        btn.innerText = "ЗАВАНТАЖИТИ ВЕСЬ ТЕСТ";
    });
}



function loadOptionalTests() {
    const container = document.getElementById('testsListContainer');
    container.innerHTML = "<p>Оновлення списку...</p>";
    
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getTests", type: "optional" })
    })
    .then(res => res.json())
    .then(data => {
        container.innerHTML = "";
        
     
        const completed = currentUser.completed_ids ? String(currentUser.completed_ids).split(',') : [];
        
        const available = data.data.filter(q => !completed.includes(String(q.id)));
        
        if (available.length === 0) {
            container.innerHTML = "<p>🎉 Всі тести пройдено! Чекайте нових.</p>";
            return;
        }
        
        available.forEach(q => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerHTML = `📝 ${q.text}`;
            btn.style.textAlign = "left";
            btn.onclick = function() { startSingleTest(q); };
            container.appendChild(btn);
        });
    });
}

function startSingleTest(questionObj) {
    activeTestQuestions = [questionObj];
    currentQuestionIndex = 0;
    currentTestScore = 0;
    isTakingMandatory = false;
    
    renderQuestion(); 
}



function startMandatoryTest() {
    document.getElementById('profileCorner').style.display = 'none';
    
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getTests", type: "mandatory" })
    })
    .then(res => res.json())
    .then(data => {
        if (data.data.length === 0) {
            showSection('main');
            document.getElementById('profileCorner').style.display = 'flex';
            return;
        }
        
        activeTestQuestions = data.data;
        currentQuestionIndex = 0;
        currentTestScore = 0;
        isTakingMandatory = true;
        
        renderQuestion();
    });
}

function renderQuestion() {
    showSection('testPlayer');
    const q = activeTestQuestions[currentQuestionIndex];
    
    document.getElementById('testQuestionText').innerText = q.text;
    document.getElementById('qCurrent').innerText = currentQuestionIndex + 1;
    document.getElementById('qTotal').innerText = activeTestQuestions.length;

    const imgEl = document.getElementById('testImage');
    if (q.image) {
        imgEl.src = q.image;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    const ansDiv = document.getElementById('testAnswers');
    ansDiv.innerHTML = '';
    
    q.answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = ans.text;
        btn.onclick = function() { submitAnswer(ans.score); };
        ansDiv.appendChild(btn);
    });
}

function submitAnswer(score) {
    currentTestScore += score;
    currentQuestionIndex++;
    
    if (currentQuestionIndex < activeTestQuestions.length) {
        renderQuestion();
    } else {
        finishTest();
    }
}

function finishTest() {
    document.getElementById('testQuestionText').innerText = "Тест завершено!";
    document.getElementById('testAnswers').innerHTML = "<p>Обробка результатів...</p>";
    document.getElementById('testImage').style.display = 'none';
    
   
    let passedIds = activeTestQuestions.map(q => q.id);

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "submitTestResult",
            username: currentUser.username,
            points: currentTestScore,
            isMandatory: isTakingMandatory,
            passedIds: passedIds 
        })
    })
    .then(res => res.json())
    .then(data => {
        let msg = "Ваш результат: " + (currentTestScore > 0 ? "+" : "") + currentTestScore + " балів!";
        alert(msg);
        
     
        currentUser.score = data.newScore;
        
    
        if (data.combinedIds) {
            currentUser.completed_ids = data.combinedIds;
        }
        
        if(isTakingMandatory) currentUser.test_passed = "true";
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        document.getElementById('profileCorner').style.display = 'flex';
        

        if (!isTakingMandatory) {
            showSection('tests');
        } else {
            showSection('main');
        }
    });
}

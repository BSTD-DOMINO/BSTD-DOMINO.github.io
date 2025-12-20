
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxD9J2olFdDqcAkt2e6BMYKshz5oWIS0kVQnG7yktbe32adgLm7qH_qANJtR7q7GQB6/exec"; 

let currentUser = JSON.parse(localStorage.getItem('userData')) || null;

let activeTestQuestions = [];
let currentQuestionIndex = 0;
let currentTestScore = 0;
let isTakingMandatory = false;

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
                role: data.data.role
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
    
    const firstLetter = userObj.username.charAt(0);
    const avatarEl = document.getElementById('avatarCircle');
    if(avatarEl) avatarEl.innerText = firstLetter;

    const scoreEl = document.getElementById('profileScore');
    if(scoreEl) scoreEl.innerText = userObj.score;

    const teamEl = document.getElementById('profileTeam');
    if(teamEl) teamEl.innerText = userObj.team;

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
    

    if (userObj.test_passed === "false" && userObj.role !== 'admin') {
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

    const sections = ['login', 'register', 'main', 'profile', 'news', 'team', 'support', 'admin', 'testPlayer'];
    
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if(el) el.classList.add('hidden');
    });
    
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

function uploadAndSave() {
    const fileInput = document.getElementById('newQFile');
    const statusText = document.getElementById('uploadStatus');
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        statusText.innerText = "Завантаження фото ";
        
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
                    statusText.innerText = "✅ Фото завантажено!";
                 
                    document.getElementById('uploadedImageUrl').value = data.imageUrl;
                 
                    saveQuestionToDB(); 
                } else {
                    statusText.innerText = "❌ Помилка завантаження фото.";
                    alert("Помилка фото: " + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                statusText.innerText = "❌ Помилка з'єднання.";
            });
        };
        reader.readAsDataURL(file); 
    } else {
  
        document.getElementById('uploadedImageUrl').value = "";
        saveQuestionToDB();
    }
}


function saveQuestionToDB() {
    const type = document.getElementById('newQType').value;
    const text = document.getElementById('newQText').value;
    const image = document.getElementById('uploadedImageUrl').value; 
    
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

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "addQuestion",
            type: type,
            question: text,
            image: image,
            answers: answers
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
 
        document.getElementById('newQText').value = '';
        document.getElementById('newQFile').value = '';
        document.getElementById('uploadStatus').innerText = '';
        document.getElementById('uploadedImageUrl').value = '';
    });
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

    const imgDiv = document.getElementById('testImage');
    if (q.image) {
        imgDiv.style.backgroundImage = "url('" + q.image + "')";
        imgDiv.style.display = 'block';
    } else {
        imgDiv.style.display = 'none';
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
    
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "submitTestResult",
            username: currentUser.username,
            points: currentTestScore,
            isMandatory: isTakingMandatory
        })
    })
    .then(res => res.json())
    .then(data => {
        let msg = "Ваш результат: " + (currentTestScore > 0 ? "+" : "") + currentTestScore + " балів!";
        alert(msg);
        
        currentUser.score = data.newScore;
        if(isTakingMandatory) currentUser.test_passed = "true";
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        document.getElementById('profileCorner').style.display = 'flex';
        showSection('main');
    });
}

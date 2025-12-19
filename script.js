
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxD9J2olFdDqcAkt2e6BMYKshz5oWIS0kVQnG7yktbe32adgLm7qH_qANJtR7q7GQB6/exec"; 

let currentUser = JSON.parse(localStorage.getItem('userData')) || null;

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
                test_passed: data.data.test_passed
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
    
    document.getElementById('profileCorner').style.display = 'flex';

    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginStatus').innerText = '';
    
    showSection('main');
}

function handleLogout() {
    localStorage.removeItem('userData');
    currentUser = null;
    document.getElementById('profileCorner').style.display = 'none';
    showSection('login');
}

function showSection(sectionName) {
    const sections = ['login', 'register', 'main', 'profile', 'news', 'team', 'support'];
    
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(sectionName + 'Section');
    if (target) target.classList.remove('hidden');

    const dropdown = document.getElementById("dropdownMenu");
    if (dropdown) dropdown.classList.remove('show');
}

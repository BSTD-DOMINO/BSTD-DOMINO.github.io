
const GOOGLE_SCRIPT_URL = "С"; 

let currentUser = localStorage.getItem('user') || null;

window.onload = function() {
    if (currentUser) {
        loginSuccess(currentUser);
    } else {
        showSection('login');
    }
};


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
            statusDiv.innerText = "Успішно! Тепер увійдіть.";
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
        statusDiv.innerText = "Введіть логін і пароль!";
        statusDiv.style.color = "red";
        return;
    }

    btn.disabled = true;
    statusDiv.innerText = "Перевіряємо...";
    statusDiv.style.color = "blue";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "login", username: user, password: pass })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        if(data.status === "success") {
            currentUser = user;
            localStorage.setItem('user', user);
            loginSuccess(user);
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

function loginSuccess(user) {
    document.getElementById('cornerUsername').innerText = user;
    document.getElementById('profileName').innerText = user;
    document.getElementById('welcomeText').innerText = "Вітаємо, " + user + "!";
    document.getElementById('profileCorner').style.display = 'block';
    
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginStatus').innerText = '';
    
    showSection('main');
}

function handleLogout() {
    localStorage.removeItem('user');
    currentUser = null;
    document.getElementById('profileCorner').style.display = 'none';
    showSection('login');
}

function showSection(sectionName) {
    const sections = ['login', 'register', 'main', 'profile', 'team'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if(el) el.classList.add('hidden');
    });
    document.getElementById(sectionName + 'Section').classList.remove('hidden');
}

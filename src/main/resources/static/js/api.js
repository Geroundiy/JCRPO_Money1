// src/main/resources/static/js/api.js

const API_BASE_URL = 'http://localhost:8080/api/data';
const AUTH_URL = 'http://localhost:8080/api/auth';

// --- ХРАНЕНИЕ УЧЕТНЫХ ДАННЫХ В СЕССИИ БРАУЗЕРА (КЛЮЧЕВОЕ ИЗМЕНЕНИЕ) ---
// Поскольку мы отключили JSESSIONID, мы храним Basic Auth заголовок
let globalAuthHeader = '';

/**
 * Аутентифицирует пользователя и сохраняет заголовок для последующих запросов.
 * @param {string} username - Имя пользователя.
 * @param {string} password - Пароль пользователя.
 * @returns {Promise<Response>} Ответ от сервера (первая проверка).
 */
async function login(username, password) {
    const credentials = btoa(`${username}:${password}`);
    const authHeader = `Basic ${credentials}`;

    // ПРОВЕРКА: Пробуем получить защищенный ресурс, чтобы Spring Security нас аутентифицировал.
    const response = await fetch(`${API_BASE_URL}/goal`, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        // Если аутентификация прошла успешно, сохраняем заголовок для будущих вызовов
        globalAuthHeader = authHeader;
    }

    return response;
}

/**
 * Регистрирует пользователя.
 */
async function register(username, password) {
    const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    return response;
}

/**
 * Вспомогательная функция для создания заголовков для защищенных запросов.
 */
function getProtectedHeaders() {
    return {
        'Content-Type': 'application/json',
        // ДОБАВЛЯЕМ СОХРАНЕННЫЙ ЗАГОЛОВОК BASIC AUTH
        'Authorization': globalAuthHeader
    };
}


/**
 * Получает все данные пользователя: цель и транзакции.
 */
async function getFullData() {
    if (!globalAuthHeader) {
        window.location.href = 'login.html';
        return null;
    }
    const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: getProtectedHeaders()
    });

    if (response.status === 401) {
        window.location.href = 'login.html';
        return null;
    }
    if (!response.ok) {
        throw new Error(`Ошибка сети или сервера: ${response.status}`);
    }
    return response.json();
}

/**
 * Сохраняет новую цель.
 */
async function saveGoal(goal) {
    if (!globalAuthHeader) {
        window.location.href = 'login.html';
        return null;
    }
    const response = await fetch(`${API_BASE_URL}/goal`, {
        method: 'POST',
        headers: getProtectedHeaders(),
        body: JSON.stringify(goal)
    });

    if (response.status === 401) {
        window.location.href = 'login.html';
        return null;
    }

    return response.json();
}

/**
 * Сохраняет новую транзакцию.
 */
async function saveTransaction(transaction) {
    if (!globalAuthHeader) {
        window.location.href = 'login.html';
        return null;
    }
    const response = await fetch(`${API_BASE_URL}/transaction`, {
        method: 'POST',
        headers: getProtectedHeaders(),
        body: JSON.stringify(transaction)
    });

    if (response.status === 401) {
        window.location.href = 'login.html';
        return null;
    }

    return response.json();
}
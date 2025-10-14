// src/main/resources/static/js/api.js

const API_BASE_URL = 'http://localhost:8080/api/data';
const AUTH_URL = 'http://localhost:8080/api/auth';

/**
 * Выполняет вход пользователя, отправляя данные формы, как ожидает Spring Security.
 * @param {string} username - Имя пользователя.
 * @param {string} password - Пароль.
 * @returns {Promise<boolean>} - true в случае успеха, иначе false.
 */
export async function login(username, password) {
    const loginProcessingUrl = `${AUTH_URL}/login`;

    const details = {
        'username': username,
        'password': password
    };
    const formBody = Object.keys(details)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key]))
        .join('&');

    try {
        const response = await fetch(loginProcessingUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formBody
        });

        if (response.ok && response.url.includes('index.html')) {
            const data = await getFullData();
            if (data) {
                sessionStorage.setItem('userData', JSON.stringify(data));
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error("Ошибка при попытке входа:", error);
        return false;
    }
}


/**
 * Регистрирует нового пользователя.
 * @param {string} username - Имя пользователя.
 * @param {string} password - Пароль.
 * @returns {Promise<Response>} - Ответ от сервера.
 */
export async function register(username, password) {
    return await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
}

/**
 * Оболочка для всех защищенных запросов к API.
 * Автоматически использует сессионные cookie.
 */
async function fetchAPI(endpoint = '', options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            // ИЗМЕНЕНИЕ: Эта строка решает проблему с сессиями и конфиденциальностью
            credentials: 'include'
        });

        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }

        if (!response.ok && response.status !== 204 /* No Content */) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.status === 204 ? null : response.json();

    } catch (error) {
        console.error("API Fetch Error:", error.message);
        throw error;
    }
}

/**
 * Получает все данные пользователя (цель и транзакции).
 */
export async function getFullData() {
    return fetchAPI();
}

/**
 * Сохраняет цель пользователя.
 */
export async function saveGoal(goal) {
    return fetchAPI('/goal', {
        method: 'POST',
        body: JSON.stringify(goal)
    });
}

/**
 * Сохраняет транзакцию.
 */
export async function saveTransaction(transaction) {
    return fetchAPI('/transaction', {
        method: 'POST',
        body: JSON.stringify(transaction)
    });
}

/**
 * Удаляет цель и все связанные транзакции.
 */
export async function deleteGoal() {
    return fetchAPI('/goal', {
        method: 'DELETE'
    });
}

/**
 * Выполняет выход из системы.
 */
export async function logout() {
    try {
        await fetch(`${AUTH_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error("Ошибка при выходе из системы:", error);
    } finally {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}
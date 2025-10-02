const API_BASE_URL = 'http://localhost:8080/api/data';
const AUTH_URL = 'http://localhost:8080/api/auth';
let globalAuthHeader = '';

export async function login(username, password) {
    const credentials = btoa(`${username}:${password}`);
    const authHeader = `Basic ${credentials}`;

    const response = await fetch(`${API_BASE_URL}`, {
        headers: { 'Authorization': authHeader }
    });

    if (response.ok) {
        globalAuthHeader = authHeader;
        const data = await response.json();
        sessionStorage.setItem('userData', JSON.stringify(data));
        sessionStorage.setItem('authHeader', authHeader);
        return true;
    }
    return false;
}

export async function register(username, password) {
    return await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
}

function getProtectedHeaders() {
    if (!globalAuthHeader) {
        globalAuthHeader = sessionStorage.getItem('authHeader');
    }
    if (!globalAuthHeader) {
        window.location.href = 'login.html';
        throw new Error('Not authenticated');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': globalAuthHeader
    };
}

async function fetchAPI(endpoint = '', options = {}) {
    try {
        const headers = getProtectedHeaders();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }
        if (!response.ok && response.status !== 204) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.status === 204 ? null : response.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        if (error.message !== "Not authenticated") {
            // Можно добавить уведомление об ошибке
        }
        throw error;
    }
}

export async function getFullData() {
    return fetchAPI();
}

export async function saveGoal(goal) {
    return fetchAPI('/goal', {
        method: 'POST',
        body: JSON.stringify(goal)
    });
}

export async function saveTransaction(transaction) {
    return fetchAPI('/transaction', {
        method: 'POST',
        body: JSON.stringify(transaction)
    });
}

export async function deleteGoal() {
    return fetchAPI('/goal', {
        method: 'DELETE'
    });
}

export function logout() {
    sessionStorage.clear();
    globalAuthHeader = '';
    window.location.href = 'login.html';
}
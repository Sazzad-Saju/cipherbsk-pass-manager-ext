let masterPassword = null;
let sessionTimeout = null;
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Function to encrypt the master password for storage
function encryptForStorage(data) {
    // Simple encryption for storage - you can make this more secure
    return btoa(JSON.stringify(data));
}

// Function to decrypt the stored master password
function decryptFromStorage(encrypted) {
    try {
        return JSON.parse(atob(encrypted));
    } catch (e) {
        return null;
    }
}

// Function to store session data
function storeSession(password) {
    const session = {
        password: password,
        timestamp: Date.now()
    };
    chrome.storage.local.set({
        'bsk_session': encryptForStorage(session)
    });
}

// Function to clear session data
function clearSession() {
    chrome.storage.local.remove('bsk_session');
    masterPassword = null;
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
}

// Function to restore session
function restoreSession() {
    return new Promise((resolve) => {
        chrome.storage.local.get('bsk_session', (result) => {
            if (result.bsk_session) {
                const session = decryptFromStorage(result.bsk_session);
                if (session && session.timestamp) {
                    const elapsed = Date.now() - session.timestamp;
                    if (elapsed < SESSION_DURATION) {
                        masterPassword = session.password;
                        // Set new timeout for remaining time
                        const remainingTime = SESSION_DURATION - elapsed;
                        sessionTimeout = setTimeout(clearSession, remainingTime);
                        resolve(true);
                        return;
                    }
                }
            }
            clearSession();
            resolve(false);
        });
    });
}

// Initialize session on extension load
restoreSession();

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SET_MASTER_PASSWORD") {
        masterPassword = request.payload;
        // Clear any existing timeout
        if (sessionTimeout) {
            clearTimeout(sessionTimeout);
        }
        // Set new timeout
        sessionTimeout = setTimeout(clearSession, SESSION_DURATION);
        // Store session
        storeSession(masterPassword);
        sendResponse({ success: true });
        return true;
    }

    if (request.type === "GET_MASTER_PASSWORD") {
        // If master password is not in memory, try to restore session
        if (!masterPassword) {
            restoreSession().then(restored => {
                sendResponse({ 
                    password: masterPassword,
                    restored: restored
                });
            });
            return true;
        }
        sendResponse({ 
            password: masterPassword,
            restored: false
        });
        return true;
    }

    if (request.type === "CLEAR_MASTER_PASSWORD") {
        clearSession();
        sendResponse({ success: true });
        return true;
    }

    // Add ping mechanism to check session status
    if (request.type === "CHECK_SESSION") {
        if (!masterPassword) {
            restoreSession().then(restored => {
                sendResponse({ 
                    valid: !!masterPassword,
                    restored: restored
                });
            });
            return true;
        }
        sendResponse({ 
            valid: true,
            restored: false
        });
        return true;
    }
});

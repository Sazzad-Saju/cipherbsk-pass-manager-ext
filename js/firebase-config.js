// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDRf6t-S6hy42yQGpMWWBJQ9w8UaTxVE-Y",
    authDomain: "cipherbsk-pass-manager-ext.firebaseapp.com",
    projectId: "cipherbsk-pass-manager-ext",
    storageBucket: "cipherbsk-pass-manager-ext.firebasestorage.app",
    messagingSenderId: "173928457524",
    appId: "1:173928457524:web:6cc0a4c97f91f07014b161",
    measurementId: "G-7EP62ZSLBC"
};

// Initialize Firebase with compat version for Chrome extension
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Make these functions globally available
window.loginWithFirebase = async function(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

window.registerWithFirebase = async function(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

window.logoutWithFirebase = async function() {
    try {
        await auth.signOut();
        localStorage.removeItem("bsk_token");
        return true;
    } catch (error) {
        throw error;
    }
};

// Firestore CRUD operations
window.saveItem = async function(userId, itemData) {
    try {
        const itemsRef = db.collection('users').doc(userId).collection('items');
        if (itemData.id && itemData.id !== 'null') {
            // Update existing item
            await itemsRef.doc(itemData.id).update({
                name: itemData.name,
                link: itemData.link,
                email: itemData.email,
                password: itemData.password,
                note: itemData.note,
                en_round: itemData.en_round
            });
            return { success: true, id: itemData.id };
        } else {
            // Create new item
            const docRef = await itemsRef.add({
                name: itemData.name,
                link: itemData.link,
                email: itemData.email,
                password: itemData.password,
                note: itemData.note,
                en_round: itemData.en_round
            });
            return { success: true, id: docRef.id };
        }
    } catch (error) {
        throw error;
    }
};

window.getItems = async function(userId) {
    try {
        const itemsRef = db.collection('users').doc(userId).collection('items');
        const snapshot = await itemsRef.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,  // Ensure we're getting the Firestore document ID
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
};

window.deleteItem = async function(userId, itemId) {
    try {
        await db.collection('users').doc(userId).collection('items').doc(itemId).delete();
        return { success: true };
    } catch (error) {
        throw error;
    }
}; 
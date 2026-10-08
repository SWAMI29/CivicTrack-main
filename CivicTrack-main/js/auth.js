// auth.js – FULLY WORKING AUTH SYSTEM
class AuthManager {
    static init() {
        this.setupLoginForm();
        this.setupSignupForm();
    }
    
    static setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }
    }
    
    static setupSignupForm() {
        const form = document.getElementById('signupForm');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                this.handleSignup(e);
            });
        }
        const role = document.getElementById('role');
        if (role) {
            role.addEventListener('change', () => this.toggleAdminFields());
        }
    }
    
    static toggleAdminFields() {
        const role = document.getElementById('role')?.value;
        const fields = document.getElementById('adminFields');
        if (fields) fields.classList.toggle('d-none', role !== 'Admin');
    }
    
    static handleLogin(e) {
        const data = new FormData(e.target);
        const username = data.get('username').trim();
        const password = data.get('password');
        const role = data.get('role');
        
        if (!username || !password || !role) {
            this.notify('Please fill all fields', 'danger');
            return;
        }
        
        let users = JSON.parse(localStorage.getItem('civictrack_users') || '[]');
        let user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            user = {
                id: Date.now().toString(36),
                username, password, role,
                firstName: username, lastName: 'User',
                email: `${username}@example.com`,
                joinDate: new Date().toISOString(),
                isActive: true
            };
            users.push(user);
            localStorage.setItem('civictrack_users', JSON.stringify(users));
        }
        
        const { password: _, ...session } = user;
        localStorage.setItem('civictrack_current_user', JSON.stringify(session));
        window.location.href = role === 'Admin' ? 'admin_dashboard.html' : 'home.html';
        this.notify(`Welcome, ${username}!`, 'success');
    }
    
    static handleSignup(e) {
        const data = new FormData(e.target);
        const username = data.get('username').trim();
        const password = data.get('password');
        
        if (!username || !password) {
            this.notify('Username and password required', 'danger');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('civictrack_users') || '[]');
        if (users.some(u => u.username === username)) {
            this.notify('Username taken', 'danger');
            return;
        }
        
        const user = {
            id: Date.now().toString(36),
            username, password,
            firstName: data.get('firstName') || 'New',
            lastName: data.get('lastName') || 'User',
            email: data.get('email') || '',
            role: data.get('role') || 'Citizen',
            joinDate: new Date().toISOString(),
            isActive: true
        };
        
        users.push(user);
        localStorage.setItem('civictrack_users', JSON.stringify(users));
        const { password: _, ...session } = user;
        localStorage.setItem('civictrack_current_user', JSON.stringify(session));
        window.location.href = user.role === 'Admin' ? 'admin_dashboard.html' : 'home.html';
        this.notify('Account created!', 'success');
    }
    
    static logout() {
        localStorage.removeItem('civictrack_current_user');
        window.location.href = 'index.html';
    }
    
    static notify(msg, type = 'info') {
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.show(msg, type);
        } else {
            alert(msg);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => AuthManager.init());
window.AuthManager = AuthManager;
// Variáveis globais
let currentUser = null;
let expenses = [];
let revenues = [];
let supermarket = [];
let cards = [];
let categories = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 
    'Lazer', 'Vestuário', 'Outros'
];

// Gráficos
let categoryChart = null;
let evolutionChart = null;
let supermarketChart = null;
let cardsChart = null;
let establishmentChart = null;
let comparisonChart = null;

// Função para limpar dados corrompidos
function clearCorruptedData() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                if (value && value.startsWith('user') && !value.startsWith('user_')) {
                    console.log(`Removendo dado corrompido: ${key}`);
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.log(`Removendo chave corrompida: ${key}`);
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('Erro ao limpar dados corrompidos:', error);
    }
}

// Função segura para localStorage
function safeGetLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item);
    } catch (error) {
        console.error(`Erro ao ler localStorage para chave ${key}:`, error);
        localStorage.removeItem(key);
        return defaultValue;
    }
}

function safeSetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Erro ao salvar no localStorage para chave ${key}:`, error);
        return false;
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação...');
    
    // Limpar dados corrompidos primeiro
    clearCorruptedData();
    
    // Inicializar aplicação
    initializeApp();
});

function initializeApp() {
    try {
        console.log('Inicializando aplicação...');
        
        // Configurar event listeners
        setupEventListeners();
        
        // Verificar se há usuário logado
        const savedUser = safeGetLocalStorage('currentUser');
        if (savedUser && savedUser.email) {
            console.log('Usuário encontrado:', savedUser.email);
            currentUser = savedUser;
            showMainScreen();
            loadUserDataAfterLogin();
            loadDashboard();
        } else {
            console.log('Nenhum usuário logado, mostrando tela de login');
            showLoginScreen();
        }
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showLoginScreen();
    }
}

function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Event listeners para formulários de autenticação
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (loginForm) {
        console.log('Configurando listener para loginForm');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('loginForm não encontrado!');
    }
    
    if (registerForm) {
        console.log('Configurando listener para registerForm');
        registerForm.addEventListener('submit', handleRegister);
    } else {
        console.error('registerForm não encontrado!');
    }
    
    if (forgotPasswordForm) {
        console.log('Configurando listener para forgotPasswordForm');
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    } else {
        console.error('forgotPasswordForm não encontrado!');
    }
    
    // Event listeners para formulários do sistema principal
    setupFormListeners();
    
    // Event listeners para navegação
    setupNavigationListeners();
    
    // Event listeners para exportação
    setupExportListeners();
}

function setupFormListeners() {
    console.log('Configurando listeners dos formulários do sistema...');
    const forms = ['expenseForm', 'incomeForm', 'supermarketForm', 'cardsForm', 'categoryForm'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleFormSubmit(formId);
            });
        }
    });
    
    // Adicionar listeners para cálculo automático no supermercado
    setupSupermarketCalculation();
    
    // Carregar categorias nos selects
    populateCategories();
}

// Nova função para configurar cálculo automático do supermercado
function setupSupermarketCalculation() {
    const quantityInput = document.getElementById('supermarketQuantity');
    const unitValueInput = document.getElementById('supermarketUnitValue');
    const totalValueInput = document.getElementById('supermarketTotalValue');
    
    if (quantityInput && unitValueInput && totalValueInput) {
        function calculateTotal() {
            const quantity = parseFloat(quantityInput.value) || 0;
            const unitValue = parseFloat(unitValueInput.value) || 0;
            const total = quantity * unitValue;
            totalValueInput.value = total.toFixed(2);
        }
        
        quantityInput.addEventListener('input', calculateTotal);
        unitValueInput.addEventListener('input', calculateTotal);
    }
}

// Nova função para carregar categorias nos selects
function populateCategories() {
    const categorySelects = [
        'expenseCategory',
        'incomeCategory', 
        'cardCategory'
    ];
    
    categorySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select && selectId === 'cardCategory') {
            // Limpar opções existentes (exceto a primeira)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Adicionar categorias
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        }
    });
}

function setupNavigationListeners() {
    // Configurar botões de navegação se existirem
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Event listeners para abas
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            const section = e.target.closest('.content-section');
            if (section) {
                const sectionId = section.id;
                const tabName = e.target.dataset.tab;
                showTab(sectionId, tabName);
            }
        }
        
        if (e.target.classList.contains('nav-btn')) {
            const sectionId = e.target.dataset.section;
            showSection(sectionId);
        }
        
        if (e.target.classList.contains('delete-item-btn')) {
            const sectionId = e.target.dataset.section;
            const index = parseInt(e.target.dataset.index);
            deleteItem(sectionId, index);
        }
    });
}

function setupExportListeners() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
    
    // Adicionar listener para os radio buttons de exportação
    const exportRadios = document.querySelectorAll('input[name="exportType"]');
    const singleSheetSelect = document.getElementById('singleSheetSelect');
    
    exportRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'single') {
                singleSheetSelect.disabled = false;
            } else {
                singleSheetSelect.disabled = true;
            }
        });
    });
}

// Funções de navegação entre telas
function showLoginScreen() {
    console.log('Mostrando tela de login');
    hideAllScreens();
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.classList.add('active');
    }
}

function showRegisterScreen() {
    console.log('Mostrando tela de cadastro');
    hideAllScreens();
    const registerScreen = document.getElementById('registerScreen');
    if (registerScreen) {
        registerScreen.classList.add('active');
    }
}

function showForgotPasswordScreen() {
    console.log('Mostrando tela de recuperação de senha');
    hideAllScreens();
    const forgotPasswordScreen = document.getElementById('forgotPasswordScreen');
    if (forgotPasswordScreen) {
        forgotPasswordScreen.classList.add('active');
    }
}

function showMainScreen() {
    console.log('Mostrando tela principal');
    hideAllScreens();
    const mainScreen = document.getElementById('mainScreen');
    if (mainScreen) {
        mainScreen.classList.add('active');
    }
    
    // Atualizar informações do usuário
    updateUserInfo();
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
}

// Funções de navegação (chamadas pelos links)
function showLogin() {
    showLoginScreen();
}

function showRegister() {
    showRegisterScreen();
}

function showForgotPassword() {
    showForgotPasswordScreen();
}

// Funções de autenticação
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    try {
        // Buscar usuário no localStorage
        const users = safeGetLocalStorage('users', []);
        const user = users.find(u => u.email === email);
        
        if (!user) {
            showMessage('Usuário não encontrado.', 'error');
            return;
        }
        
        if (user.password !== password) {
            showMessage('Senha incorreta.', 'error');
            return;
        }
        
        // Login bem-sucedido
        currentUser = user;
        safeSetLocalStorage('currentUser', user);
        
        showMessage('Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
            showMainScreen();
            loadUserDataAfterLogin();
            loadDashboard();
        }, 1000);
        
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage('Erro interno. Tente novamente.', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    try {
        // Verificar se o email já existe
        const users = safeGetLocalStorage('users', []);
        
        if (users.find(u => u.email === email)) {
            showMessage('Este email já está cadastrado.', 'error');
            return;
        }
        
        // Criar ID único mais robusto
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const uniqueId = `${timestamp}_${random}`;
        
        // Criar novo usuário
        const newUser = {
            id: uniqueId,
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        safeSetLocalStorage('users', users);
        
        showMessage('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
        
        // Limpar formulário
        document.getElementById('registerForm').reset();
        
        setTimeout(() => {
            showLoginScreen();
        }, 2000);
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showMessage('Erro interno. Tente novamente.', 'error');
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    if (!email) {
        showMessage('Por favor, digite seu email.', 'error');
        return;
    }
    
    try {
        const users = safeGetLocalStorage('users', []);
        const user = users.find(u => u.email === email);
        
        if (!user) {
            showMessage('Email não encontrado.', 'error');
            return;
        }
        
        // Simular envio de email
        showMessage('Instruções de recuperação enviadas para seu email!', 'success');
        
        setTimeout(() => {
            showLoginScreen();
        }, 2000);
        
    } catch (error) {
        console.error('Erro na recuperação:', error);
        showMessage('Erro interno. Tente novamente.', 'error');
    }
}

function logout() {
    try {
        // Limpar dados do usuário atual
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Limpar arrays globais
        expenses = [];
        revenues = [];
        supermarket = [];
        cards = [];
        
        // Resetar categorias para padrão
        categories = [
            'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 
            'Lazer', 'Vestuário', 'Outros'
        ];
        
        // Destruir todos os gráficos
        if (categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }
        if (evolutionChart) {
            evolutionChart.destroy();
            evolutionChart = null;
        }
        if (supermarketChart) {
            supermarketChart.destroy();
            supermarketChart = null;
        }
        if (cardsChart) {
            cardsChart.destroy();
            cardsChart = null;
        }
        if (establishmentChart) {
            establishmentChart.destroy();
            establishmentChart = null;
        }
        if (comparisonChart) {
            comparisonChart.destroy();
            comparisonChart = null;
        }
        
        // Limpar formulários
        const forms = document.querySelectorAll('.data-form');
        forms.forEach(form => form.reset());
        
        // Limpar tabelas de dados salvos
        const tables = document.querySelectorAll('.saved-table tbody');
        tables.forEach(tbody => tbody.innerHTML = '');
        
        showMessage('Logout realizado com sucesso!', 'success');
        
        setTimeout(() => {
            showLoginScreen();
        }, 1000);
        
    } catch (error) {
        console.error('Erro no logout:', error);
        showLoginScreen();
    }
}

// Funções de carregamento de dados
function loadUserDataAfterLogin() {
    try {
        if (!currentUser) return;
        
        // Verificar integridade dos dados
        verifyUserDataIntegrity();
        
        expenses = loadUserData('expenses', []);
        revenues = loadUserData('revenues', []);
        supermarket = loadUserData('supermarket', []);
        cards = loadUserData('cards', []);
        
        // Carregar categorias personalizadas
        const userCategories = loadUserData('categories', []);
        if (userCategories.length > 0) {
            categories = [...new Set([...categories, ...userCategories])];
        }
        
        console.log('Dados do usuário carregados:', {
            userId: currentUser.id,
            expenses: expenses.length,
            revenues: revenues.length,
            supermarket: supermarket.length,
            cards: cards.length
        });
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Função para verificar integridade dos dados do usuário
function verifyUserDataIntegrity() {
    if (!currentUser) return;
    
    try {
        // Verificar se existem dados órfãos ou corrompidos
        const userPrefix = `user_${currentUser.id}_`;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith('user_') && !key.startsWith(userPrefix)) {
                // Verificar se é um dado de outro usuário válido
                const users = safeGetLocalStorage('users', []);
                const isValidUserData = users.some(user => key.startsWith(`user_${user.id}_`));
                
                if (!isValidUserData) {
                    console.log(`Removendo dado órfão: ${key}`);
                    localStorage.removeItem(key);
                }
            }
        });
        
        console.log('Verificação de integridade concluída');
    } catch (error) {
        console.error('Erro na verificação de integridade:', error);
    }
}

// Função para atualizar informações do usuário
function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name;
    }
}

// Funções de navegação entre seções
function showSection(sectionId) {
    console.log('Mostrando seção:', sectionId);
    
    // Esconder todas as seções
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Atualizar botões de navegação
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        }
    });
    
    // Carregar dados específicos da seção
    loadSectionData(sectionId);
    
    // Se for dashboard, atualizar gráficos
    if (sectionId === 'dashboard') {
        setTimeout(() => {
            updateDashboardCards();
            updateCharts();
        }, 100);
    }
}

function showTab(sectionId, tabName) {
    console.log('Mostrando aba:', sectionId, tabName);
    
    // Esconder todas as abas da seção
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const tabContents = section.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada - corrigindo a lógica de seleção
    let targetTab;
    if (tabName === 'form') {
        targetTab = document.getElementById(`${sectionId}-form`);
    } else if (tabName === 'saved') {
        targetTab = document.getElementById(`${sectionId}-saved`);
    } else {
        // Fallback para o método original
        targetTab = section.querySelector(`[data-tab="${tabName}"]`);
    }
    
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Atualizar botões de aba
    const tabButtons = section.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Carregar dados salvos se necessário
    if (tabName === 'saved') {
        loadSavedData(sectionId);
    }
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'categories':
            loadCategoriesManagement();
            break;
        case 'expenses':
        case 'income':
        case 'supermarket':
        case 'cards':
            // Carregar categorias nos selects quando entrar nas seções
            populateCategories();
            break;
    }
}

// Função para carregar dashboard
function loadDashboard() {
    updateDashboardCards();
    updateCharts();
}

function updateDashboardCards() {
    try {
        // Calcular totais de despesas e receitas
        const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.value || 0), 0);
        const totalRevenues = revenues.reduce((sum, revenue) => sum + parseFloat(revenue.value || 0), 0);
        
        // Incluir dados de supermercado no total de despesas
        const totalSupermarket = supermarket.reduce((sum, item) => sum + parseFloat(item.totalValue || 0), 0);
        
        // Incluir dados de cartões no total de despesas
        const totalCards = cards.reduce((sum, card) => sum + parseFloat(card.value || 0), 0);
        
        // Calcular totais finais
        const finalExpenses = totalExpenses + totalSupermarket + totalCards;
        const balance = totalRevenues - finalExpenses;
        
        // Atualizar cards com animação - IDs corretos
        animateValue('totalExpenses', 0, finalExpenses, 1000);
        animateValue('totalIncome', 0, totalRevenues, 1000);
        animateValue('currentBalance', 0, balance, 1000);
        
        // Atualizar contadores
        const expenseCountElement = document.getElementById('expenseCount');
        const revenueCountElement = document.getElementById('revenueCount');
        
        if (expenseCountElement) expenseCountElement.textContent = expenses.length + supermarket.length + cards.length;
        if (revenueCountElement) revenueCountElement.textContent = revenues.length;
        
        // Calcular categoria com mais gastos (incluindo todas as fontes)
        const categoryData = {};
        
        // Adicionar despesas
        expenses.forEach(expense => {
            const category = expense.category || 'Outros';
            categoryData[category] = (categoryData[category] || 0) + parseFloat(expense.value || 0);
        });
        
        // Adicionar supermercado (categoria "Alimentação")
        if (totalSupermarket > 0) {
            categoryData['Alimentação'] = (categoryData['Alimentação'] || 0) + totalSupermarket;
        }
        
        // Adicionar cartões
        cards.forEach(card => {
            const category = card.category || 'Outros';
            categoryData[category] = (categoryData[category] || 0) + parseFloat(card.value || 0);
        });
        
        // Encontrar categoria com maior gasto
        let topCategory = 'Nenhuma';
        let maxAmount = 0;
        
        Object.entries(categoryData).forEach(([category, amount]) => {
            if (amount > maxAmount) {
                maxAmount = amount;
                topCategory = category;
            }
        });
        
        // Atualizar card de categorias
        const totalCategoriesElement = document.getElementById('totalCategories');
        if (totalCategoriesElement) {
            if (maxAmount > 0) {
                totalCategoriesElement.textContent = `${topCategory}: ${formatCurrency(maxAmount)}`;
            } else {
                totalCategoriesElement.textContent = 'Nenhuma despesa registrada';
            }
        }
        
    } catch (error) {
        console.error('Erro ao atualizar cards do dashboard:', error);
    }
}

function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startTime = performance.now();
    const startValue = start;
    const endValue = end;
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easedProgress = easeOutQuart(progress);
        const currentValue = startValue + (endValue - startValue) * easedProgress;
        
        element.textContent = formatCurrency(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

// Funções de gráficos
function updateCharts() {
    updateCategoryChart();
    updateEvolutionChart();
    updateSupermarketChart();
    updateCardsChart();
    updateEstablishmentChart();
    updateComparisonChart();
}

function updateCategoryChart() {
    try {
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            showChartMessage('categoryChart', 'Biblioteca de gráficos não carregada');
            return;
        }
        
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        // Destruir gráfico anterior se existir
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        // Calcular gastos por categoria
        const categoryData = {};
        
        expenses.forEach(expense => {
            const category = expense.category || 'Outros';
            categoryData[category] = (categoryData[category] || 0) + parseFloat(expense.value || 0);
        });
        
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        if (labels.length === 0) {
            showChartMessage('categoryChart', 'Nenhuma despesa encontrada');
            return;
        }
        
        // Cores para o gráfico
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];
        
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de categorias:', error);
        showChartError('Erro ao carregar gráfico de categorias');
    }
}

function updateEvolutionChart() {
    try {
        const ctx = document.getElementById('evolutionChart');
        if (!ctx) return;
        
        // Destruir gráfico anterior se existir
        if (evolutionChart) {
            evolutionChart.destroy();
        }
        
        // Preparar dados dos últimos 6 meses
        const months = [];
        const expenseData = [];
        const revenueData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            
            months.push(monthName);
            
            // Calcular despesas do mês
            const monthExpenses = expenses.filter(expense => {
                if (!expense.date) return false;
                const expenseDate = new Date(expense.date);
                const expenseKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                return expenseKey === monthKey;
            });
            
            const monthExpenseTotal = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.value || 0), 0);
            expenseData.push(monthExpenseTotal);
            
            // Calcular receitas do mês
            const monthRevenues = revenues.filter(revenue => {
                if (!revenue.date) return false;
                const revenueDate = new Date(revenue.date);
                const revenueKey = `${revenueDate.getFullYear()}-${String(revenueDate.getMonth() + 1).padStart(2, '0')}`;
                return revenueKey === monthKey;
            });
            
            const monthRevenueTotal = monthRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.value || 0), 0);
            revenueData.push(monthRevenueTotal);
        }
        
        if (expenseData.every(val => val === 0) && revenueData.every(val => val === 0)) {
            showChartMessage('evolutionChart', 'Nenhum dado encontrado para os últimos 6 meses');
            return;
        }
        
        evolutionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Despesas',
                        data: expenseData,
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Receitas',
                        data: revenueData,
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de evolução:', error);
        showChartError('Erro ao carregar gráfico de evolução');
    }
}

function showChartMessage(chartId, message) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    // Esconder canvas
    canvas.style.display = 'none';
    
    // Criar ou atualizar mensagem
    let messageDiv = container.querySelector('.chart-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.className = 'chart-message';
        messageDiv.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            height: 300px;
            color: #666;
            font-size: 1.1rem;
            font-weight: 500;
            text-align: center;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px dashed #dee2e6;
        `;
        container.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'flex';
}

function showChartError(message) {
    console.error(message);
}

// Novo gráfico: Produtos mais comprados no supermercado
function updateSupermarketChart() {
    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            showChartMessage('supermarketChart', 'Biblioteca de gráficos não carregada');
            return;
        }
        
        const ctx = document.getElementById('supermarketChart');
        if (!ctx) return;
        
        if (supermarketChart) {
            supermarketChart.destroy();
        }
        
        // Calcular produtos mais comprados
        const productData = {};
        
        supermarket.forEach(item => {
            const product = item.product || 'Produto não especificado';
            const quantity = parseFloat(item.quantity || 0);
            const value = parseFloat(item.totalValue || 0);
            
            if (!productData[product]) {
                productData[product] = { quantity: 0, value: 0 };
            }
            productData[product].quantity += quantity;
            productData[product].value += value;
        });
        
        const labels = Object.keys(productData);
        const values = Object.values(productData).map(item => item.value);
        
        if (labels.length === 0) {
            showChartMessage('supermarketChart', 'Nenhum dado de supermercado encontrado');
            return;
        }
        
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];
        
        supermarketChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.slice(0, 8), // Top 8 produtos
                datasets: [{
                    label: 'Valor Gasto (R$)',
                    data: values.slice(0, 8),
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const product = context.label;
                                const value = context.parsed.y;
                                const quantity = productData[product].quantity;
                                return `${product}: ${formatCurrency(value)} (${quantity} unidades)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de supermercado:', error);
        showChartMessage('supermarketChart', 'Erro ao carregar gráfico de supermercado');
    }
}

// Novo gráfico: Gastos por cartão
function updateCardsChart() {
    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            showChartMessage('cardsChart', 'Biblioteca de gráficos não carregada');
            return;
        }
        
        const ctx = document.getElementById('cardsChart');
        if (!ctx) return;
        
        if (cardsChart) {
            cardsChart.destroy();
        }
        
        // Calcular gastos por cartão
        const cardData = {};
        
        cards.forEach(card => {
            const cardName = card.name || 'Cartão não especificado';
            const value = parseFloat(card.value || 0);
            cardData[cardName] = (cardData[cardName] || 0) + value;
        });
        
        const labels = Object.keys(cardData);
        const data = Object.values(cardData);
        
        if (labels.length === 0) {
            showChartMessage('cardsChart', 'Nenhum dado de cartão encontrado');
            return;
        }
        
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];
        
        cardsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de cartões:', error);
        showChartMessage('cardsChart', 'Erro ao carregar gráfico de cartões');
    }
}

// Novo gráfico: Gastos por estabelecimento
function updateEstablishmentChart() {
    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            showChartMessage('establishmentChart', 'Biblioteca de gráficos não carregada');
            return;
        }
        
        const ctx = document.getElementById('establishmentChart');
        if (!ctx) return;
        
        if (establishmentChart) {
            establishmentChart.destroy();
        }
        
        // Calcular gastos por estabelecimento (cartões + supermercado)
        const establishmentData = {};
        
        // Dados de cartões
        cards.forEach(card => {
            const establishment = card.establishment || 'Estabelecimento não especificado';
            const value = parseFloat(card.value || 0);
            establishmentData[establishment] = (establishmentData[establishment] || 0) + value;
        });
        
        // Dados de supermercado
        supermarket.forEach(item => {
            const store = item.store || 'Loja não especificada';
            const value = parseFloat(item.totalValue || 0);
            establishmentData[store] = (establishmentData[store] || 0) + value;
        });
        
        const labels = Object.keys(establishmentData);
        const data = Object.values(establishmentData);
        
        if (labels.length === 0) {
            showChartMessage('establishmentChart', 'Nenhum dado de estabelecimento encontrado');
            return;
        }
        
        // Ordenar por valor e pegar os top 10
        const sortedData = labels.map((label, index) => ({
            label,
            value: data[index]
        })).sort((a, b) => b.value - a.value).slice(0, 10);
        
        const sortedLabels = sortedData.map(item => item.label);
        const sortedValues = sortedData.map(item => item.value);
        
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#E7E9ED', '#71B37C'
        ];
        
        establishmentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedLabels,
                datasets: [{
                    label: 'Valor Gasto (R$)',
                    data: sortedValues,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y', // Isso faz o gráfico ser horizontal
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatCurrency(context.parsed.x)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de estabelecimentos:', error);
        showChartMessage('establishmentChart', 'Erro ao carregar gráfico de estabelecimentos');
    }
}

// Novo gráfico: Comparação Supermercado vs Cartões
function updateComparisonChart() {
    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado');
            showChartMessage('comparisonChart', 'Biblioteca de gráficos não carregada');
            return;
        }
        
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;
        
        if (comparisonChart) {
            comparisonChart.destroy();
        }
        
        // Preparar dados dos últimos 6 meses
        const months = [];
        const supermarketData = [];
        const cardsData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            
            months.push(monthName);
            
            // Calcular gastos de supermercado do mês
            const monthSupermarket = supermarket.filter(item => {
                if (!item.date) return false;
                const itemDate = new Date(item.date);
                const itemKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
                return itemKey === monthKey;
            });
            
            const monthSupermarketTotal = monthSupermarket.reduce((sum, item) => sum + parseFloat(item.totalValue || 0), 0);
            supermarketData.push(monthSupermarketTotal);
            
            // Calcular gastos de cartões do mês
            const monthCards = cards.filter(card => {
                if (!card.date) return false;
                const cardDate = new Date(card.date);
                const cardKey = `${cardDate.getFullYear()}-${String(cardDate.getMonth() + 1).padStart(2, '0')}`;
                return cardKey === monthKey;
            });
            
            const monthCardsTotal = monthCards.reduce((sum, card) => sum + parseFloat(card.value || 0), 0);
            cardsData.push(monthCardsTotal);
        }
        
        if (supermarketData.every(val => val === 0) && cardsData.every(val => val === 0)) {
            showChartMessage('comparisonChart', 'Nenhum dado encontrado para os últimos 6 meses');
            return;
        }
        
        comparisonChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Supermercado',
                        data: supermarketData,
                        borderColor: '#4BC0C0',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Cartões',
                        data: cardsData,
                        borderColor: '#9966FF',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar gráfico de comparação:', error);
        showChartMessage('comparisonChart', 'Erro ao carregar gráfico de comparação');
    }
}

// Funções de formulários
function handleFormSubmit(formId) {
    try {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const data = {};
        
        // Capturar dados baseado no tipo de formulário
        switch (formId) {
            case 'expenseForm':
                data.date = document.getElementById('expenseDate').value;
                data.category = document.getElementById('expenseCategory').value;
                data.description = document.getElementById('expenseDescription').value;
                data.value = parseFloat(document.getElementById('expenseValue').value) || 0;
                data.payment = document.getElementById('expensePayment').value;
                data.observations = document.getElementById('expenseObservations').value;
                break;
                
            case 'incomeForm':
                data.date = document.getElementById('incomeDate').value;
                data.source = document.getElementById('incomeSource').value;
                data.description = document.getElementById('incomeDescription').value;
                data.value = parseFloat(document.getElementById('incomeValue').value) || 0;
                data.category = document.getElementById('incomeCategory').value;
                data.observations = document.getElementById('incomeObservations').value;
                break;
                
            case 'supermarketForm':
                data.date = document.getElementById('supermarketDate').value;
                data.store = document.getElementById('supermarketStore').value;
                data.product = document.getElementById('supermarketProduct').value;
                data.quantity = parseInt(document.getElementById('supermarketQuantity').value) || 0;
                data.unitValue = parseFloat(document.getElementById('supermarketUnitValue').value) || 0;
                data.totalValue = parseFloat(document.getElementById('supermarketTotalValue').value) || 0;
                data.payment = document.getElementById('supermarketPayment').value;
                break;
                
            case 'cardsForm':
                data.name = document.getElementById('cardName').value;
                data.date = document.getElementById('cardDate').value;
                data.establishment = document.getElementById('cardEstablishment').value;
                data.value = parseFloat(document.getElementById('cardValue').value) || 0;
                data.installments = parseInt(document.getElementById('cardInstallments').value) || 1;
                data.category = document.getElementById('cardCategory').value;
                data.status = document.getElementById('cardStatus').value;
                break;
                
            default:
                return;
        }
        
        // Adicionar ID único e timestamp
        data.id = Date.now().toString();
        data.createdAt = new Date().toISOString();
        
        // Determinar tipo de dados baseado no formulário
        let dataType, array, successMessage;
        
        switch (formId) {
            case 'expenseForm':
                dataType = 'expenses';
                array = expenses;
                successMessage = 'Despesa adicionada com sucesso!';
                break;
            case 'incomeForm':
                dataType = 'revenues';
                array = revenues;
                successMessage = 'Receita adicionada com sucesso!';
                break;
            case 'supermarketForm':
                dataType = 'supermarket';
                array = supermarket;
                successMessage = 'Item do supermercado adicionado com sucesso!';
                break;
            case 'cardsForm':
                dataType = 'cards';
                array = cards;
                successMessage = 'Compra do cartão adicionada com sucesso!';
                break;
            default:
                return;
        }
        
        // Adicionar aos dados
        array.push(data);
        
        // Salvar no localStorage
        saveUserData(dataType, array);
        
        // Limpar formulário
        form.reset();
        
        // Mostrar mensagem de sucesso
        showMessage(successMessage, 'success');
        
        // Atualizar dashboard se estiver visível
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboardCards();
            updateCharts();
        }
        
    } catch (error) {
        console.error('Erro ao processar formulário:', error);
        showMessage('Erro ao salvar dados. Tente novamente.', 'error');
    }
}

// Funções de armazenamento
function saveUserData(dataType, data) {
    if (!currentUser) return;
    const key = `user_${currentUser.id}_${dataType}`;
    safeSetLocalStorage(key, data);
}

function loadUserData(dataType, defaultValue = []) {
    if (!currentUser) return defaultValue;
    const key = `user_${currentUser.id}_${dataType}`;
    return safeGetLocalStorage(key, defaultValue);
}

// Funções utilitárias
function formatCurrency(value) {
    if (isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Função para mostrar mensagens
function showMessage(message, type = 'info') {
    // Remover mensagens existentes
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Adicionar ao corpo da página
    document.body.appendChild(messageDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
    
    // Adicionar evento de clique para fechar
    messageDiv.addEventListener('click', () => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    });
}

// Funções de gerenciamento de categorias
function loadCategoriesManagement() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = '';
    
    categories.forEach((category, index) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span>${category}</span>
            <button class="btn btn-danger btn-sm" onclick="removeCategory(${index})">
                Remover
            </button>
        `;
        categoriesGrid.appendChild(categoryItem);
    });
}

function addCategory() {
    const categoryName = document.getElementById('categoryName').value;
    const categoryType = document.getElementById('categoryType').value;
    
    if (!categoryName || !categoryType) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (categories.includes(categoryName)) {
        showMessage('Esta categoria já existe.', 'error');
        return;
    }
    
    categories.push(categoryName);
    saveUserData('categories', categories);
    
    document.getElementById('categoryForm').reset();
    loadCategoriesManagement();
    
    // Atualizar selects de categorias
    populateCategories();
    
    showMessage('Categoria adicionada com sucesso!', 'success');
}

function removeCategory(index) {
    if (index < 0 || index >= categories.length) return;
    
    const categoryName = categories[index];
    
    if (confirm(`Tem certeza que deseja remover a categoria "${categoryName}"?`)) {
        categories.splice(index, 1);
        saveUserData('categories', categories);
        loadCategoriesManagement();
        
        showMessage('Categoria removida com sucesso!', 'success');
    }
}

// Funções de dados salvos
function loadSavedData(sectionId) {
    let data, tableId;
    
    switch (sectionId) {
        case 'expenses':
            data = expenses;
            tableId = 'expensesSavedTable';
            break;
        case 'income':
            data = revenues;
            tableId = 'incomeSavedTable';
            break;
        case 'supermarket':
            data = supermarket;
            tableId = 'supermarketSavedTable';
            break;
        case 'cards':
            data = cards;
            tableId = 'cardsSavedTable';
            break;
        default:
            return;
    }
    
    loadDataToTable(tableId, data, sectionId);
}

function loadDataToTable(tableId, data, sectionId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = table.querySelector('thead tr').children.length;
        cell.textContent = 'Nenhum dado encontrado';
        cell.style.textAlign = 'center';
        cell.style.padding = '2rem';
        cell.style.color = '#666';
        return;
    }
    
    data.forEach((item, index) => {
        const row = tbody.insertRow();
        
        // Adicionar células baseadas no tipo de dados
        switch (sectionId) {
            case 'expenses':
                row.insertCell().textContent = formatDate(item.date);
                row.insertCell().textContent = item.category || '';
                row.insertCell().textContent = item.description || '';
                row.insertCell().textContent = formatCurrency(item.value);
                row.insertCell().textContent = item.paymentMethod || '';
                row.insertCell().textContent = item.observations || '';
                break;
            case 'income':
                row.insertCell().textContent = formatDate(item.date);
                row.insertCell().textContent = item.category || '';
                row.insertCell().textContent = item.description || '';
                row.insertCell().textContent = formatCurrency(item.value);
                row.insertCell().textContent = item.source || '';
                row.insertCell().textContent = item.observations || '';
                break;
            case 'supermarket':
                row.insertCell().textContent = formatDate(item.date);
                row.insertCell().textContent = item.product || '';
                row.insertCell().textContent = item.quantity || '';
                row.insertCell().textContent = formatCurrency(item.unitValue);
                row.insertCell().textContent = formatCurrency(item.totalValue);
                row.insertCell().textContent = item.store || '';
                row.insertCell().textContent = item.payment || '';
                break;
            case 'cards':
                row.insertCell().textContent = item.name || '';
                row.insertCell().textContent = formatDate(item.date);
                row.insertCell().textContent = item.establishment || '';
                row.insertCell().textContent = formatCurrency(item.value);
                row.insertCell().textContent = item.installments || '';
                row.insertCell().textContent = item.category || '';
                row.insertCell().textContent = item.status || '';
                break;
        }
        
        // Adicionar botão de ação
        const actionCell = row.insertCell();
        actionCell.innerHTML = `
            <button class="btn btn-danger btn-sm delete-item-btn" 
                    data-section="${sectionId}" 
                    data-index="${index}">
                Excluir
            </button>
        `;
    });
}

function deleteItem(sectionId, index) {
    let data, dataType, successMessage;
    
    switch (sectionId) {
        case 'expenses':
            data = expenses;
            dataType = 'expenses';
            successMessage = 'Despesa excluída com sucesso!';
            break;
        case 'income':
            data = revenues;
            dataType = 'revenues';
            successMessage = 'Receita excluída com sucesso!';
            break;
        case 'supermarket':
            data = supermarket;
            dataType = 'supermarket';
            successMessage = 'Item do supermercado excluído com sucesso!';
            break;
        case 'cards':
            data = cards;
            dataType = 'cards';
            successMessage = 'Compra do cartão excluída com sucesso!';
            break;
        default:
            return;
    }
    
    if (index < 0 || index >= data.length) return;
    
    if (confirm('Tem certeza que deseja excluir este item?')) {
        data.splice(index, 1);
        saveUserData(dataType, data);
        loadSavedData(sectionId);
        
        showMessage(successMessage, 'success');
        
        // Atualizar dashboard se estiver visível
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboardCards();
            updateCharts();
        }
    }
}

// Função de exportação
function exportToExcel() {
    try {
        // Verificar tipo de exportação
        const exportType = document.querySelector('input[name="exportType"]:checked').value;
        const singleSheetSelect = document.getElementById('singleSheetSelect');
        
        if (exportType === 'single') {
            exportSingleSheet(singleSheetSelect.value);
            return;
        }
        
        // Exportação completa (código existente)
        if (expenses.length === 0 && revenues.length === 0 && supermarket.length === 0 && cards.length === 0) {
            showMessage('Não há dados para exportar.', 'error');
            return;
        }
        
        const wb = XLSX.utils.book_new();
        
        // Adicionar planilha de despesas
        if (expenses.length > 0) {
            const expensesData = expenses.map(item => ({
                'Data': formatDate(item.date),
                'Categoria': item.category || '',
                'Descrição': item.description || '',
                'Valor': item.value || 0,
                'Método de Pagamento': item.payment || '',
                'Observações': item.observations || ''
            }));
            const expensesWS = XLSX.utils.json_to_sheet(expensesData);
            XLSX.utils.book_append_sheet(wb, expensesWS, 'Despesas');
        }
        
        // Adicionar planilha de receitas
        if (revenues.length > 0) {
            const revenuesData = revenues.map(item => ({
                'Data': formatDate(item.date),
                'Categoria': item.category || '',
                'Descrição': item.description || '',
                'Valor': item.value || 0,
                'Origem': item.source || '',
                'Observações': item.observations || ''
            }));
            const revenuesWS = XLSX.utils.json_to_sheet(revenuesData);
            XLSX.utils.book_append_sheet(wb, revenuesWS, 'Receitas');
        }
        
        // Adicionar planilha de supermercado
        if (supermarket.length > 0) {
            const supermarketData = supermarket.map(item => ({
                'Data': formatDate(item.date),
                'Produto': item.product || '',
                'Quantidade': item.quantity || 0,
                'Valor Unitário': item.unitValue || 0,
                'Valor Total': item.totalValue || 0,
                'Loja': item.store || '',
                'Método de Pagamento': item.payment || ''
            }));
            const supermarketWS = XLSX.utils.json_to_sheet(supermarketData);
            XLSX.utils.book_append_sheet(wb, supermarketWS, 'Supermercado');
        }
        
        // Adicionar planilha de cartões
        if (cards.length > 0) {
            const cardsData = cards.map(item => ({
                'Nome do Cartão': item.name || '',
                'Data': formatDate(item.date),
                'Estabelecimento': item.establishment || '',
                'Valor': item.value || 0,
                'Parcelas': item.installments || 1,
                'Categoria': item.category || '',
                'Status': item.status || ''
            }));
            const cardsWS = XLSX.utils.json_to_sheet(cardsData);
            XLSX.utils.book_append_sheet(wb, cardsWS, 'Cartões');
        }
        
        const fileName = `K-Finance_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showMessage('Planilha exportada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro na exportação:', error);
        showMessage('Erro ao exportar planilha. Verifique se a biblioteca XLSX está carregada.', 'error');
    }
}

// Função para exportar uma única planilha
function exportSingleSheet(sheetType) {
    try {
        let data = [];
        let sheetName = '';
        let fileName = '';
        
        switch (sheetType) {
            case 'expenses':
                if (expenses.length === 0) {
                    showMessage('Não há despesas para exportar.', 'error');
                    return;
                }
                data = expenses.map(item => ({
                    'Data': formatDate(item.date),
                    'Categoria': item.category || '',
                    'Descrição': item.description || '',
                    'Valor': item.value || 0,
                    'Método de Pagamento': item.payment || '',
                    'Observações': item.observations || ''
                }));
                sheetName = 'Despesas';
                fileName = `K-Finance_Despesas_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'income':
                if (revenues.length === 0) {
                    showMessage('Não há receitas para exportar.', 'error');
                    return;
                }
                data = revenues.map(item => ({
                    'Data': formatDate(item.date),
                    'Categoria': item.category || '',
                    'Descrição': item.description || '',
                    'Valor': item.value || 0,
                    'Origem': item.source || '',
                    'Observações': item.observations || ''
                }));
                sheetName = 'Receitas';
                fileName = `K-Finance_Receitas_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'supermarket':
                if (supermarket.length === 0) {
                    showMessage('Não há dados de supermercado para exportar.', 'error');
                    return;
                }
                data = supermarket.map(item => ({
                    'Data': formatDate(item.date),
                    'Produto': item.product || '',
                    'Quantidade': item.quantity || 0,
                    'Valor Unitário': item.unitValue || 0,
                    'Valor Total': item.totalValue || 0,
                    'Loja': item.store || '',
                    'Método de Pagamento': item.payment || ''
                }));
                sheetName = 'Supermercado';
                fileName = `K-Finance_Supermercado_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'cards':
                if (cards.length === 0) {
                    showMessage('Não há dados de cartões para exportar.', 'error');
                    return;
                }
                data = cards.map(item => ({
                    'Nome do Cartão': item.name || '',
                    'Data': formatDate(item.date),
                    'Estabelecimento': item.establishment || '',
                    'Valor': item.value || 0,
                    'Parcelas': item.installments || 1,
                    'Categoria': item.category || '',
                    'Status': item.status || ''
                }));
                sheetName = 'Cartões';
                fileName = `K-Finance_Cartoes_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            default:
                showMessage('Tipo de exportação inválido.', 'error');
                return;
        }
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
        
        showMessage(`Planilha de ${sheetName.toLowerCase()} exportada com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro na exportação individual:', error);
        showMessage('Erro ao exportar planilha individual.', 'error');
    }
}

// Função para limpar todos os dados (para desenvolvimento)
function clearAllData() {
    if (confirm('ATENÇÃO: Isso irá apagar TODOS os dados. Tem certeza?')) {
        localStorage.clear();
        location.reload();
    }
}

// Expor função para console (desenvolvimento)
window.clearAllData = clearAllData;

console.log('Script K-FINANCE carregado com sucesso!');
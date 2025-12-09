const GEMINI_CONFIG = {
    // Função para obter chave API de forma segura
    get apiKey() {
        // Ordem de prioridade:
        // 1. Meta tag no HTML
        const metaKey = document.querySelector('meta[name="gemini-api-key"]')?.content;
        if (metaKey && metaKey.startsWith('AIzaSy')) return metaKey;
        
        // 2. Variável global window.ENV
        if (window.ENV?.GEMINI_API_KEY && window.ENV.GEMINI_API_KEY.startsWith('AIzaSy')) {
            return window.ENV.GEMINI_API_KEY;
        }
        
        // 3. localStorage (para desenvolvimento)
        const localKey = localStorage.getItem('GEMINI_API_KEY');
        if (localKey && localKey.startsWith('AIzaSy')) return localKey;
        
        // 4. Fallback - REMOVA EM PRODUÇÃO!
        return "AIzaSyBXbhPV_1_W_4-CC5WzdAlHEGdmfYFQRZM";
    },
    
    // Modelos disponíveis - use um destes:
    model: 'gemini-pro', // Modelo mais estável e amplamente disponível
    // model: 'gemini-1.5-pro-latest', // Se quiser usar o 1.5 Pro
    // model: 'gemini-1.0-pro', // Versão 1.0 Pro
    
    // Endpoint correto para a API
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
    maxTokens: 1500,
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
    ]
};

// Estado do Gemini (ATUALIZADO)
const GEMINI_STATE = {
    isAvailable: false,
    isInitialized: false,
    isValidKey: false,
    lastUsed: null,
    lastError: null
};

// ===== VARIÁVEIS GLOBAIS =====
let searchTimeout;
let allModuleCards = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const originalContent = document.getElementById('originalContent');
    
    // Coletar todos os cards de módulos
    allModuleCards = document.querySelectorAll('.module-card');
    
    // Configurar busca
    setupSearch(searchInput, searchResults, originalContent);
    
    // Configurar eventos adicionais
    setupAdditionalEvents();
    
    // Configurar analytics de clique (opcional)
    setupClickAnalytics();
    
    // Inicializar Assistente IA
    initializeAIAssistant();
    
    console.log('🚀 Portal de Treinamentos inicializado!');
    console.log(`📊 ${allModuleCards.length} módulos carregados`);
}

// ===== SISTEMA DE BUSCA =====
function setupSearch(searchInput, searchResults, originalContent) {
    // Event listener para input de busca com debounce
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            handleSearch(searchTerm, searchResults, originalContent);
        }, CONFIG.search.debounceTime);
    });
    
    // Event listener para tecla Escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearSearch(searchInput, searchResults, originalContent);
            this.blur();
        }
        
        // Enter para focar na busca
        if (e.key === '/' && e.ctrlKey) {
            e.preventDefault();
            this.focus();
        }
    });
    
    // Focar no campo de busca quando a página carregar
    searchInput.focus();
    
    // Placeholder dinâmico para dispositivos móveis
    updateSearchPlaceholder(searchInput);
}

function handleSearch(searchTerm, searchResults, originalContent) {
    const searchInput = document.getElementById('searchInput');
    if (searchTerm.length === 0) {
        clearSearch(searchInput, searchResults, originalContent);
        return;
    }
    
    if (searchTerm.length < CONFIG.search.minChars) {
        showMinCharsMessage(searchResults, originalContent);
        return;
    }
    
    const results = searchModules(searchTerm);
    displaySearchResults(results, searchResults, originalContent);
}

function searchModules(searchTerm) {
    const normalizedSearch = normalizeText(searchTerm);
    const results = [];
    
    allModuleCards.forEach(card => {
        const title = card.querySelector('.module-title').textContent;
        const description = card.querySelector('.module-description').textContent;
        const href = card.getAttribute('href');
        const category = card.closest('.category').querySelector('.category-title').textContent;
        
        const searchableText = normalizeText(title + ' ' + description + ' ' + category);
        
        if (searchableText.includes(normalizedSearch)) {
            const statusElement = card.querySelector('.module-status span');
            const status = statusElement ? statusElement.textContent : '';
            
            results.push({
                title: title,
                description: description,
                href: href,
                category: category,
                status: status,
                element: card
            });
        }
    });
    
    return results;
}

function displaySearchResults(results, searchResults, originalContent) {
    if (results.length === 0) {
        showNoResults(searchResults, originalContent);
        return;
    }
    
    const html = generateSearchResultsHTML(results);
    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
    originalContent.style.display = 'none';
    
    // Animar resultados
    animateSearchResults();
}

function generateSearchResultsHTML(results) {
    let html = `
        <div class="results-header">
            <div class="results-title">🎯 Resultados da Busca</div>
            <div class="results-count">${results.length} módulo(s) encontrado(s)</div>
        </div>
        <div class="results-grid">
    `;
    
    results.forEach(result => {
        // Determinar classe de cor baseada no módulo
        const moduleClass = Array.from(result.element.classList)
            .find(className => className.startsWith('module-')) || 'module-1';
            
        html += `
            <a href="${result.href}" class="module-card ${moduleClass} search-result-item">
                <div class="module-icon">${getModuleIcon(result.title)}</div>
                <h3 class="module-title">${result.title}</h3>
                <p class="module-description">${result.description}</p>
                <div class="module-meta">
                    <span class="module-category">${result.category}</span>
                    <span class="module-status">${result.status}</span>
                </div>
            </a>
        `;
    });
    
    html += '</div>';
    return html;
}

// ===== FUNÇÕES DE UTILIDADE =====
function normalizeText(text) {
    return text.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function clearSearch(searchInput, searchResults, originalContent) {
    searchResults.style.display = 'none';
    searchInput.value = '';
    originalContent.style.display = 'block';
    
    // Animar retorno ao conteúdo original
    animateContentReturn();
}

function showMinCharsMessage(searchResults, originalContent) {
    searchResults.innerHTML = `
        <div class="no-results">
            <div class="min-chars-message">
                🔍 Digite pelo menos ${CONFIG.search.minChars} caracteres...
            </div>
        </div>
    `;
    searchResults.style.display = 'block';
    originalContent.style.display = 'none';
}

function showNoResults(searchResults, originalContent) {
    searchResults.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">😕</div>
            <div class="no-results-title">Nenhum módulo encontrado</div>
            <div class="no-results-suggestions">
                <p>Tente:</p>
                <ul>
                    <li>Verificar a ortografia</li>
                    <li>Usar termos mais gerais</li>
                    <li>Procurar por categoria</li>
                </ul>
            </div>
        </div>
    `;
    searchResults.style.display = 'block';
    originalContent.style.display = 'none';
}

function getModuleIcon(moduleTitle) {
    const iconMap = {
        'Widgets': '⚙️',
        'Acesso Rápido': '🚀',
        'Auditoria': '📊',
        'Bitz Channel': '📺',
        'Painel': '🏠',
        'Reserva': '📅',
        'Check-in': '🔑',
        'Check-out': '🚪',
        'Faturamento': '💰',
        'Relatórios': '📈',
        'Housekeeping': '🧹',
        'Manutenção': '🔧'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (moduleTitle.includes(key)) {
            return icon;
        }
    }
    return '📄';
}

function updateSearchPlaceholder(searchInput) {
    const isMobile = window.innerWidth <= 768;
    searchInput.placeholder = isMobile ? '🔍 Buscar...' : '🔍 Buscar módulo...';
}

// ===== ANIMAÇÕES =====
function animateSearchResults() {
    const resultItems = document.querySelectorAll('.search-result-item');
    
    resultItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function animateContentReturn() {
    const modules = document.querySelectorAll('.module-card');
    
    modules.forEach((module, index) => {
        module.style.opacity = '0';
        module.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            module.style.transition = 'all 0.3s ease';
            module.style.opacity = '1';
            module.style.transform = 'scale(1)';
        }, index * 50);
    });
}

// ===== EVENTOS ADICIONAIS =====
function setupAdditionalEvents() {
    // Atualizar placeholder na redimensionamento
    window.addEventListener('resize', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) updateSearchPlaceholder(searchInput);
    });
    
    // Feedback visual ao passar o mouse nos módulos
    allModuleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // Clique com analytics
        card.addEventListener('click', function(e) {
            trackModuleClick(this);
        });
    });
    
    // Prevenir comportamento padrão de formulário
    const searchForm = document.querySelector('.search-container');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
}

// ===== ANALYTICS (OPCIONAL) =====
function setupClickAnalytics() {
    console.log('📊 Analytics configurado - pronto para rastrear cliques');
}

function trackModuleClick(moduleElement) {
    const moduleTitle = moduleElement.querySelector('.module-title').textContent;
    const moduleHref = moduleElement.getAttribute('href');
    
    const clickData = {
        module: moduleTitle,
        url: moduleHref,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    console.log('📈 Clique no módulo:', clickData);
}

// ===== FUNÇÕES DE ACESSIBILIDADE =====
function enhanceAccessibility() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.setAttribute('aria-label', 'Buscar módulos de treinamento');
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const focusedElement = document.activeElement;
            if (focusedElement.classList.contains('module-card')) {
                focusedElement.style.outline = '2px solid #3498db';
            }
        }
    });
}

// ===== EXPORTAÇÕES PARA USO EXTERNO (se necessário) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        normalizeText,
        searchModules,
        trackModuleClick
    };
}

// ============================================
// SEÇÃO IA - ASSISTENTE INTELIGENTE COM GEMINI
// ============================================

// Configurações do Assistente IA
const AI_CONFIG = {
    minSearchLength: 3,
    cacheDuration: 24 * 60 * 60 * 1000,
    maxResults: 5,
    responseDelay: 800,
    useGemini: true,
    geminiThreshold: 10
};

// Estado global do Assistente
const AI_STATE = {
    knowledgeBase: null,
    isInitialized: false,
    isChatOpen: false,
    currentSearchTerm: '',
    lastResponseMode: 'local' // 'local' ou 'gemini'
};

// Sistema de cache para arquivos
const FILE_CACHE = {
    data: new Map(),
    maxSize: 100,
    maxAge: 30 * 60 * 1000,
    
    get(key) {
        const item = this.data.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.maxAge) {
            this.data.delete(key);
            return null;
        }
        
        return item.data;
    },
    
    set(key, data) {
        if (this.data.size >= this.maxSize) {
            const oldestKey = this.data.keys().next().value;
            this.data.delete(oldestKey);
        }
        
        this.data.set(key, {
            data: data,
            timestamp: Date.now()
        });
    },
    
    clear() {
        this.data.clear();
    }
};

// Variável para acompanhar progresso
let loadProgress = {
    total: 0,
    loaded: 0,
    failed: 0
};

// ===== INICIALIZAÇÃO DO GEMINI (ATUALIZADA) =====
async function initializeGemini() {
    console.log('🔧 Inicializando Gemini...');
    
    // Validar formato da chave
    const apiKey = GEMINI_CONFIG.apiKey;
    if (!apiKey || !apiKey.startsWith('AIzaSy')) {
        console.warn('⚠️ Chave Gemini inválida ou não configurada');
        GEMINI_STATE.isAvailable = false;
        GEMINI_STATE.isValidKey = false;
        GEMINI_STATE.lastError = 'Chave API inválida';
        
        // Mostrar aviso no console
        console.log('ℹ️ Para configurar a chave Gemini:');
        console.log('1. Acesse https://makersuite.google.com/app/apikey');
        console.log('2. Crie uma chave API');
        console.log('3. Adicione no HTML: <meta name="gemini-api-key" content="SUA_CHAVE">');
        
        return false;
    }
    
    try {
        updateAIStatus('🔗 Conectando ao Gemini...');
        
        // Testar conexão com um prompt simples
        const testPrompt = "Responda apenas com 'OK' se estiver funcionando.";
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: testPrompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 10,
                topP: 0.1
            }
        };
        
        const response = await fetch(
            `${GEMINI_CONFIG.apiUrl}?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API retornou status: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
        }
        
        const data = await response.json();
        
        GEMINI_STATE.isAvailable = true;
        GEMINI_STATE.isInitialized = true;
        GEMINI_STATE.isValidKey = true;
        GEMINI_STATE.lastUsed = new Date();
        GEMINI_STATE.lastError = null;
        
        console.log('✅ Gemini conectado com sucesso');
        
        // Atualizar interface
        updateGeminiUIStatus(true);
        
        return true;
        
    } catch (error) {
        console.warn('⚠️ Gemini não disponível:', error.message);
        GEMINI_STATE.isAvailable = false;
        GEMINI_STATE.isValidKey = false;
        GEMINI_STATE.lastError = error.message;
        
        // Atualizar interface
        updateGeminiUIStatus(false, error.message);
        
        return false;
    }
}

// ===== FUNÇÃO PRINCIPAL PARA CHAMAR GEMINI (ATUALIZADA) =====
async function callGeminiAPI(question, contextResults = []) {
    if (!GEMINI_STATE.isAvailable) {
        throw new Error('Gemini não disponível');
    }
    
    try {
        // Preparar contexto baseado nos resultados locais
         let contextText = "Você é um assistente especializado em treinamentos para os sistemas Bitz Hotel e Bitz Motel.\n\n";
        
        if (contextResults.length > 0) {
            contextText += "Baseado nos seguintes documentos relacionados:\n";
            contextResults.forEach((result, index) => {
                contextText += `${index + 1}. ${result.title}\n`;
                if (result.content) {
                    contextText += `   Conteúdo relevante: ${result.content.substring(0, 200)}...\n\n`;
                }
            });
        }

        contextText += `\nResponda à seguinte pergunta do usuário de forma clara, objetiva e profissional: "${question}"\n\n`;
        contextText += "INSTRUÇÕES IMPORTANTES:\n";
        contextText += "1. Use emojis relevantes para tornar a resposta mais amigável\n";
        contextText += "2. Formate com tópicos quando apropriado\n";
        contextText += "3. Se mencionar procedimentos, forneça passos claros\n";
        contextText += "4. Seja específico sobre módulos e funcionalidades\n";
        contextText += "5. Se não tiver certeza, seja honesto\n";
        contextText += "6. Inclua links para documentos quando mencioná-los\n\n";
        contextText += "FORMATO DA RESPOSTA: Use **negrito** para ênfase, • para listas";
        
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: contextText
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: GEMINI_CONFIG.temperature,
                maxOutputTokens: GEMINI_CONFIG.maxTokens,
                topP: 0.8,
                topK: 40
            },
            safetySettings: GEMINI_CONFIG.safetySettings
        };
        
        const response = await fetch(
            `${GEMINI_CONFIG.apiUrl}?key=${GEMINI_CONFIG.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `Erro ${response.status}`;
            throw new Error(`API Gemini: ${errorMessage}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            GEMINI_STATE.lastUsed = new Date();
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Resposta inválida da API Gemini');
        }
        
    } catch (error) {
        console.error('❌ Erro no Gemini:', error);
        
        // Salvar erro no estado
        GEMINI_STATE.lastError = error.message;
        GEMINI_STATE.isAvailable = false;
        
        throw error;
    }
}

// ===== FUNÇÕES AUXILIARES DO GEMINI =====
function updateGeminiUIStatus(isAvailable, errorMessage = null) {
    const modelStatus = document.getElementById('ai-model-status');
    if (!modelStatus) return;
    
    if (isAvailable) {
        modelStatus.innerHTML = `
            <span class="model-indicator gemini">🤖</span>
            <span class="model-text">Gemini disponível</span>
        `;
        modelStatus.style.color = '#10b981';
    } else {
        modelStatus.innerHTML = `
            <span class="model-indicator local">🔍</span>
            <span class="model-text">Modo local${errorMessage ? ` (${errorMessage})` : ''}</span>
        `;
        modelStatus.style.color = '#ef4444';
    }
}

// ===== INICIALIZAÇÃO DO ASSISTENTE IA (ATUALIZADA) =====
function initializeAIAssistant() {
    // Verificar se estamos na página principal
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.endsWith('/')) {
        return;
    }
    
    console.log('🤖 Assistente IA inicializando...');
    
    // Configurar elementos da interface
    setupAIInterface();
    
    // Inicializar Gemini em paralelo
    if (AI_CONFIG.useGemini) {
        initializeGemini().then(success => {
            if (success) {
                console.log('✅ Módulo IA com Gemini carregado com sucesso');
            } else {
                console.warn('⚠️ Gemini não pôde ser inicializado, usando modo local');
            }
        });
    }
    
    // Carregar base de conhecimento em background
    preloadKnowledgeBase();
    
    console.log('✅ Assistente IA pronto para uso');
}

function setupAIInterface() {
    // Verificar se o container já existe
    if (!document.getElementById('ai-assistant-container')) {
        createAIContainer();
    }
    
    // Configurar eventos
    const aiBtn = document.getElementById('ai-assistant-btn');
    const aiCloseBtn = document.getElementById('ai-close-btn');
    const aiInput = document.getElementById('ai-chat-input');
    const aiSendBtn = document.getElementById('ai-send-btn');
    
    if (aiBtn) {
        aiBtn.addEventListener('click', toggleAIChat);
    }
    
    if (aiCloseBtn) {
        aiCloseBtn.addEventListener('click', toggleAIChat);
    }
    
    if (aiInput) {
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAIQuestion();
            }
        });
    }
    
    if (aiSendBtn) {
        aiSendBtn.addEventListener('click', handleAIQuestion);
    }
    
    // Tecla de atalho para abrir chat (Ctrl + I)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            toggleAIChat();
        }
    });
}

function createAIContainer() {
    console.warn('Container IA não encontrado, criando manualmente...');
}

// ===== CARREGAMENTO DE CONHECIMENTO =====
async function preloadKnowledgeBase() {
    try {
        updateAIStatus('🔍 Inicializando...');
        
        // Tentar carregar do cache primeiro
        const cached = localStorage.getItem('ai_knowledge_cache');
        const cacheTime = localStorage.getItem('ai_knowledge_time');
        
        if (cached && cacheTime) {
            const age = Date.now() - parseInt(cacheTime);
            if (age < AI_CONFIG.cacheDuration) {
                AI_STATE.knowledgeBase = JSON.parse(cached);
                AI_STATE.isInitialized = true;
                
                const docCount = countDocuments();
                updateAIStatus(`✅ ${docCount} documentos (cache)`);
                updateInitialMessage(docCount);
                return;
            }
        }
        
        // Mostrar progresso
        showLoadProgress();
        
        // Carregar do servidor
        updateAIStatus('📚 Carregando documentos...');
        AI_STATE.knowledgeBase = await loadKnowledgeBase();
        AI_STATE.isInitialized = true;
        
        // Salvar no cache
        localStorage.setItem('ai_knowledge_cache', JSON.stringify(AI_STATE.knowledgeBase));
        localStorage.setItem('ai_knowledge_time', Date.now().toString());
        
        const docCount = countDocuments();
        console.log(`✅ Base carregada: ${docCount} documentos`);
        
        hideLoadProgress();
        updateAIStatus(`✅ ${docCount} documentos carregados`);
        
        // Atualizar mensagem inicial
        updateInitialMessage(docCount);
        
    } catch (error) {
        console.error('Erro ao carregar base de conhecimento:', error);
        hideLoadProgress();
        updateAIStatus('❌ Erro ao carregar');
        
        // Tentar usar cache mesmo que antigo
        const cached = localStorage.getItem('ai_knowledge_cache');
        if (cached) {
            console.log('🔄 Usando cache antigo como fallback...');
            AI_STATE.knowledgeBase = JSON.parse(cached);
            AI_STATE.isInitialized = true;
            const docCount = countDocuments();
            updateAIStatus(`⚠️ ${docCount} documentos (cache)`);
            updateInitialMessage(docCount);
        }
    }
}

async function loadKnowledgeBase() {
    console.log('📖 Carregando base de conhecimento...');
    
    const [boasPraticas, hotel, motel] = await Promise.all([
        loadAllHTMLFiles('SubmodulesBoasPraticas/'),
        loadAllHTMLFiles('SubmodulesHotel/'),
        loadAllHTMLFiles('SubmodulesMotel/')
    ]);
    
    const totalDocs = 
        Object.keys(boasPraticas).length + 
        Object.keys(hotel).length + 
        Object.keys(motel).length;
    
    console.log(`✅ Base carregada: ${totalDocs} documentos`);
    
    return {
        boasPraticas,
        hotel,
        motel
    };
}

// ===== FUNÇÕES DE CARREGAMENTO DE ARQUIVOS =====
async function loadAllHTMLFiles(folderPath) {
    try {
        console.log(`🔍 Escaneando pasta: ${folderPath}`);
        
        let fileList = await discoverHTMLFiles(folderPath);
        
        if (fileList.length === 0) {
            fileList = getKnownHTMLFiles(folderPath);
        }
        
        // Atualizar contagem total
        loadProgress.total += fileList.length;
        updateLoadProgress();
        
        console.log(`📄 Encontrados ${fileList.length} arquivos em ${folderPath}`);
        
        const contents = {};
        const concurrencyLimit = 3;
        
        for (let i = 0; i < fileList.length; i += concurrencyLimit) {
            const batch = fileList.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(async (file) => {
                try {
                    const content = await loadSingleHTMLFile(folderPath, file);
                    if (content) {
                        contents[file] = content;
                        loadProgress.loaded++;
                    } else {
                        loadProgress.failed++;
                    }
                } catch (error) {
                    console.warn(`⚠️ Erro ao carregar ${file}:`, error.message);
                    loadProgress.failed++;
                } finally {
                    updateLoadProgress();
                }
            });
            
            await Promise.all(batchPromises);
        }
        
        return contents;
        
    } catch (error) {
        console.error(`❌ Erro ao carregar pasta ${folderPath}:`, error);
        return {};
    }
}

async function discoverHTMLFiles(folderPath) {
    const fileList = [];
    
    try {
        const response = await fetch(folderPath);
        if (response.ok) {
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = doc.querySelectorAll('a[href$=".html"]');
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http')) {
                    fileList.push(href);
                }
            });
        }
    } catch (error) {
        // Silenciosamente falhar
    }
    
    if (fileList.length === 0) {
        const knownFiles = getKnownHTMLFiles(folderPath);
        fileList.push(...knownFiles);
    }
    
    return [...new Set(fileList)];
}

function getKnownHTMLFiles(folderPath) {
    const knownFiles = {
        '../SubmodulesBoasPraticas/': [
            'BoasPraticasEscritaChat.html',
            'ConduçãoAtendimento.html',
            'ControleEmocional.html',
            'ConversasDificeis.html',
            'ProcessosPadronizações.html'
        ],
        '../SubmodulesHotel/': [
            'AjustarValorDiariaAut.html',
            'AlterarSenhaExclusão.html',
            'AlterarStatus.html',
            'BaixaParcial.html',
            'CadastrarEvento.html',
            'ComoDividirPagamento.html',
            'ComoMarcarPensão.html',
            'ConfiguracaoDayUse.html',
            'ConfiguracaoEstoque.html',
            'ConsultarHistoricoQuarto.html',
            'CorrigirPagamentoOutros.html',
            'EditarValorTarifa.html',
            'EditarValorTxService.html',
            'EditarVendaAvulsa.html',
            'Emprestimodeltem.html',
            'EncavalamentoReservas.html',
            'ErroRateioAdiantamento.html',
            'ExcluirltensLançados.html',
            'ImpressãoDeExtratoDariospedagemJaEncerrada.html',
            'LançarCortesia.html',
            'LimpezaEmMassa.html',
            'LinkSatisfacao.html',
            'MapaTarifarioDayuse.html',
            'ParametrosFinanceiro.html',
            'QuartoManutencao.html',
            'ReservaDayuse.html',
            'TarifasCadastradas.html',
            'TransferenciaConsumosQuartos.html',
            'TransferirAcompanhante.html',
            'TransferirResponsavelConsumo.html',
            'Uhindisponivel.html',
            'ValorTarifa.html',
            'VerificarHospedagensAnteriores.html',
            'Widgets.html',
            'ConfiguracoesGerais.html',
            'AcessoRapido.html',
            'Auditoria.html',
            'BitzChannel.html',
            'PainelUHs.html',
            'NovaReserva.html',
            'MapaTarifario.html',
            'MapadeOcupação.html',
            'Hospedagens.html',
            'Pensao.html',
            'VendasAvulsas.html',
            'Eventos.html',
            'DayUses.html',
            'Cadastros.html'
        ],
        'SubmodulesMotel/': [
            'Configuracoes.html',
            'GuiaGo.html'
        ]
    };
    
    return knownFiles[folderPath] || [];
}

async function loadSingleHTMLFile(folderPath, fileName) {
    const cacheKey = `${folderPath}${fileName}`;
    
    const cached = FILE_CACHE.get(cacheKey);
    if (cached) {
        console.log(`⚡ ${fileName} (cache)`);
        return cached;
    }
    
    try {
        const startTime = Date.now();
        const response = await fetch(`${folderPath}${fileName}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const text = extractTextFromHTML(html);
        
        if (!text || text.length < 50) {
            throw new Error('Conteúdo muito pequeno ou vazio');
        }
        
        const fileData = {
            title: formatTitle(fileName),
            content: text.substring(0, 8000),
            path: `${folderPath}${fileName}`,
            category: getCategoryFromPath(folderPath),
            fileSize: text.length,
            lastModified: response.headers.get('last-modified') || new Date().toISOString(),
            keywords: extractKeywords(text)
        };
        
        const loadTime = Date.now() - startTime;
        console.log(`✓ ${fileName} (${text.length} chars, ${loadTime}ms)`);
        
        FILE_CACHE.set(cacheKey, fileData);
        
        return fileData;
        
    } catch (error) {
        console.warn(`✗ ${fileName}: ${error.message}`);
        return null;
    }
}

function extractKeywords(text) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4 && word.length < 20);
    
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}

function extractTextFromHTML(html) {
    try {
        let text = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&(nbsp|amp|quot|lt|gt|apos);/g, ' ')
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/\s+/g, ' ')
            .trim();
        
        text = text.split(' ')
            .filter(word => word.length > 1)
            .join(' ');
        
        if (text.length > 10000) {
            text = text.substring(0, 10000) + '...';
        }
        
        return text;
        
    } catch (error) {
        console.error('Erro ao extrair texto HTML:', error);
        return '';
    }
}

function formatTitle(filename) {
    return filename
        .replace('.html', '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^\w/, c => c.toUpperCase());
}

function getCategoryFromPath(path) {
    if (path.includes('BoasPraticas')) return 'Boas Práticas';
    if (path.includes('Hotel')) return 'Hotel';
    if (path.includes('Motel')) return 'Motel';
    return 'Geral';
}

// ===== INTERFACE DO CHAT =====
function toggleAIChat() {
    const aiWindow = document.getElementById('ai-chat-window');
    
    AI_STATE.isChatOpen = !AI_STATE.isChatOpen;
    
    if (AI_STATE.isChatOpen) {
        aiWindow.classList.remove('ai-chat-hidden');
        aiWindow.classList.add('ai-chat-visible');
        document.getElementById('ai-chat-input').focus();
        
        if (!AI_STATE.isInitialized) {
            preloadKnowledgeBase();
        }
    } else {
        aiWindow.classList.remove('ai-chat-visible');
        aiWindow.classList.add('ai-chat-hidden');
    }
}

function handleAIQuestion() {
    const input = document.getElementById('ai-chat-input');
    const question = input.value.trim();
    
    if (!question || question.length < AI_CONFIG.minSearchLength) {
        showAIWarning(`Digite pelo menos ${AI_CONFIG.minSearchLength} caracteres`);
        return;
    }
    
    addAIMessage('user', question);
    input.value = '';
    
    updateAIStatus('🤔 Processando sua pergunta...');
    
    setTimeout(() => {
        processAIQuestion(question);
    }, 300);
}

// ===== SISTEMA HÍBRIDO LOCAL + GEMINI =====
async function processAIQuestion(question) {
    try {
        if (!AI_STATE.isInitialized || !AI_STATE.knowledgeBase) {
            throw new Error('Base de conhecimento não carregada');
        }
        
        AI_STATE.currentSearchTerm = question;
        
        // Buscar resultados locais primeiro
        const localResults = await searchInKnowledge(question);
        
        // Decidir qual sistema usar
        let resposta;
        
        if (shouldUseGemini(question, localResults)) {
            AI_STATE.lastResponseMode = 'gemini';
            updateAIStatus('🤖 Consultando Gemini AI...');
            
            try {
                const geminiResponse = await callGeminiAPI(question, localResults);
                resposta = enhanceGeminiResponse(geminiResponse, localResults);
            } catch (geminiError) {
                console.warn('⚠️ Gemini falhou, usando busca local:', geminiError);
                AI_STATE.lastResponseMode = 'local';
                resposta = generateAIResponse(localResults, detectQuestionCategory(question), question);
            }
        } else {
            AI_STATE.lastResponseMode = 'local';
            resposta = generateAIResponse(localResults, detectQuestionCategory(question), question);
        }
        
        addAIMessage('assistant', resposta);
        
        // Atualizar status com modo usado
        const modeText = AI_STATE.lastResponseMode === 'gemini' ? 'Gemini AI' : 'busca local';
        updateAIStatus(`✅ ${modeText} - Pronto para ajudar`);
        
        trackAISearch(question, resposta.length, AI_STATE.lastResponseMode);
        
    } catch (error) {
        console.error('Erro ao processar pergunta:', error);
        addAIMessage('assistant', 
            `Desculpe, estou com dificuldades técnicas no momento. 
            <br><br>🔧 <em>Tente novamente ou consulte os módulos diretamente.</em>`);
        updateAIStatus('❌ Erro no processamento');
    }
}

function shouldUseGemini(question, localResults) {
    // Verificar se Gemini está disponível e configurado para uso
    if (!AI_CONFIG.useGemini || !GEMINI_STATE.isAvailable) {
        return false;
    }
    
    // Perguntas complexas ou explicativas
    const complexKeywords = ['como', 'por que', 'explique', 'funciona', 'tutorial', 'passo a passo', 'detalhe'];
    const isComplexQuestion = complexKeywords.some(keyword => 
        question.toLowerCase().includes(keyword)
    );
    
    // Se for pergunta complexa OU não tiver bons resultados locais
    if (isComplexQuestion || localResults.length === 0 || localResults[0]?.relevance < AI_CONFIG.geminiThreshold) {
        return true;
    }
    
    return false;
}

function enhanceGeminiResponse(geminiResponse, localResults) {
    let response = geminiResponse;
    
    // Adicionar links para documentos relevantes
    if (localResults && localResults.length > 0) {
        response += `\n\n<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4CAF50;">`;
        response += `<strong>📚 Documentos relacionados do portal:</strong><br>`;
        
        localResults.slice(0, 3).forEach((result, index) => {
            response += `
                <div style="margin-top: 8px;">
                    ${index + 1}. <a href="${result.path}" target="_blank" style="color: #2E7D32; font-weight: 500;">
                        ${result.title}
                    </a>
                    <br><small style="color: #666;">${result.content.substring(0, 100)}...</small>
                </div>`;
        });
        
        response += `</div>`;
    }
    
    // Adicionar aviso de IA
    response += `
        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; font-size: 12px; color: #856404; border: 1px solid #ffeaa7;">
            <strong>⚠️ Aviso:</strong> Esta resposta foi gerada por IA Gemini e pode conter imprecisões. 
            Sempre consulte a documentação oficial para procedimentos críticos.
        </div>`;
    
    return response;
}

// ===== BUSCA LOCAL =====
async function searchInKnowledge(question) {
    const normalizedQuestion = normalizeText(question.toLowerCase());
    
    const category = detectQuestionCategory(normalizedQuestion);
    
    const allResults = [];
    
    for (const [catName, documents] of Object.entries(AI_STATE.knowledgeBase)) {
        const categoryResults = searchInCategory(documents, normalizedQuestion, catName);
        allResults.push(...categoryResults);
    }
    
    allResults.sort((a, b) => b.relevance - a.relevance);
    
    const uniqueResults = getUniqueResults(allResults);
    
    return uniqueResults;
}

function searchInCategory(documents, question, categoryName) {
    const results = [];
    
    for (const [docName, docData] of Object.entries(documents)) {
        const relevance = calculateRelevance(docData, question);
        
        if (relevance > 0) {
            results.push({
                title: docData.title,
                content: docData.content,
                path: docData.path,
                category: categoryName,
                relevance: relevance,
                exactMatch: docData.content.toLowerCase().includes(question)
            });
        }
    }
    
    return results;
}

function calculateRelevance(docData, question) {
    let score = 0;
    const title = docData.title.toLowerCase();
    const content = docData.content.toLowerCase();
    
    const keywords = question.split(' ').filter(word => word.length > 3);
    
    keywords.forEach(keyword => {
        if (title.includes(keyword)) score += 10;
        if (content.includes(keyword)) score += 5;
    });
    
    if (content.includes(question)) score += 20;
    
    return score;
}

function detectQuestionCategory(question) {
    const categories = {
        'hotel': ['hotel', 'hospedagem', 'reserva', 'check-in', 'check-out', 'recepção'],
        'motel': ['motel', 'suíte', 'pernoite', 'horas'],
        'boasPraticas': ['boa prática', 'atendimento', 'comunicação', 'cliente', 'qualidade'],
        'config': ['configurar', 'instalar', 'setup', 'ajustar'],
        'tecnico': ['erro', 'problema', 'bug', 'não funciona']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
            if (question.includes(keyword)) {
                return category;
            }
        }
    }
    
    return 'geral';
}

function getUniqueResults(results) {
    const seen = new Set();
    return results.filter(result => {
        const key = result.title + result.category;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function generateAIResponse(results, category, originalQuestion) {
    if (results.length === 0) {
        return `
            <div class="ai-no-results">
                <p>🔍 Não encontrei informações específicas sobre "<strong>${originalQuestion}</strong>"</p>
                <p>Sugestões:</p>
                <ul>
                    <li>Tente reformular sua pergunta</li>
                    <li>Use palavras-chave como: hotel, motel, boas práticas</li>
                    <li>Consulte as categorias específicas no portal</li>
                </ul>
            </div>
        `;
    }
    
    const topResults = results.slice(0, AI_CONFIG.maxResults);
    const hasMultiple = topResults.length > 1;
    
    let response = `
        <div class="ai-results-found">
            <p>Encontrei ${hasMultiple ? `${topResults.length} recursos` : 'um recurso'} sobre "<strong>${originalQuestion}</strong>":</p>
    `;
    
    topResults.forEach((result, index) => {
        const excerpt = getContentExcerpt(result.content, originalQuestion);
        
        response += `
            <div class="ai-result-item">
                <div class="ai-result-header">
                    <span class="ai-result-number">${index + 1}.</span>
                    <span class="ai-result-category">${result.category}</span>
                    <span class="ai-result-title">${result.title}</span>
                </div>
                <div class="ai-result-excerpt">${excerpt}</div>
                <div class="ai-result-actions">
                    <a href="${result.path}" target="_blank" class="ai-result-link">
                        📖 Abrir documento completo
                    </a>
                </div>
            </div>
        `;
    });
    
    if (results.length > AI_CONFIG.maxResults) {
        response += `
            <div class="ai-more-results">
                ...e mais ${results.length - AI_CONFIG.maxResults} resultados relacionados.
            </div>
        `;
    }
    
    response += '</div>';
    return response;
}

function getContentExcerpt(content, searchTerm) {
    const lowerContent = content.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    
    const index = lowerContent.indexOf(lowerSearch);
    
    if (index > -1) {
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + lowerSearch.length + 100);
        let excerpt = content.substring(start, end);
        
        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';
        
        return highlightText(excerpt, searchTerm);
    }
    
    return content.substring(0, 200) + '...';
}

function highlightText(text, term) {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// ===== FUNÇÕES DE UTILIDADE DA IA =====
function addAIMessage(type, content) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-${type}-message`;
    messageDiv.innerHTML = content;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 10);
}

function updateAIStatus(text) {
    const statusElement = document.getElementById('ai-status');
    if (statusElement) {
        statusElement.textContent = text;
    }
}

function updateInitialMessage(docCount) {
    const messages = document.getElementById('ai-chat-messages');
    if (!messages) return;
    
    const welcomeMsg = messages.querySelector('.ai-bot-message');
    if (welcomeMsg) {
        const geminiStatus = GEMINI_STATE.isAvailable ? '🤖 Gemini AI ativo' : '🔍 Modo local';
        welcomeMsg.innerHTML = `
            Olá! Sou seu assistente de treinamento. Posso ajudar com dúvidas sobre:
            <br>• 🏨 Bitz Hotel
            <br>• 🚪 Bitz Motel  
            <br>• ⭐ Boas Práticas
            <br>${geminiStatus}
        `;
    }
}

function showAIWarning(message) {
    const input = document.getElementById('ai-chat-input');
    
    input.style.borderColor = '#ff9800';
    input.style.boxShadow = '0 0 0 2px rgba(255, 152, 0, 0.2)';
    
    const warning = document.createElement('div');
    warning.className = 'ai-warning';
    warning.textContent = message;
    warning.style.cssText = `
        position: absolute;
        bottom: 70px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1001;
    `;
    
    document.getElementById('ai-chat-window').appendChild(warning);
    
    setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        warning.remove();
    }, 3000);
}

function countDocuments() {
    if (!AI_STATE.knowledgeBase) return 0;
    
    let total = 0;
    for (const category in AI_STATE.knowledgeBase) {
        total += Object.keys(AI_STATE.knowledgeBase[category]).length;
    }
    
    return total;
}

// ===== SISTEMA DE PROGRESSO =====
function showLoadProgress() {
    const progressContainer = document.getElementById('ai-progress-container');
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
}

function hideLoadProgress() {
    const progressContainer = document.getElementById('ai-progress-container');
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

function updateLoadProgress() {
    const progressElement = document.getElementById('ai-load-progress');
    const progressText = document.getElementById('ai-progress-text');
    
    if (!progressElement) return;
    
    const percent = loadProgress.total > 0 
        ? Math.round((loadProgress.loaded / loadProgress.total) * 100) 
        : 0;
    
    progressElement.style.width = `${percent}%`;
    progressElement.textContent = `${percent}%`;
    
    if (progressText) {
        progressText.textContent = 
            `Carregando... ${loadProgress.loaded}/${loadProgress.total} ` +
            `(falhas: ${loadProgress.failed})`;
    }
}

// ===== ANALYTICS DA IA =====
function trackAISearch(question, responseLength, mode = 'local') {
    const searchData = {
        question: question.substring(0, 100),
        length: question.length,
        responseLength: responseLength,
        mode: mode,
        timestamp: new Date().toISOString(),
        hasKnowledge: AI_STATE.isInitialized,
        geminiAvailable: GEMINI_STATE.isAvailable
    };
    
    console.log(`🔍 Busca IA (${mode}):`, searchData);
    
    const searches = JSON.parse(localStorage.getItem('ai_searches') || '[]');
    searches.unshift(searchData);
    
    if (searches.length > 50) searches.pop();
    
    localStorage.setItem('ai_searches', JSON.stringify(searches));
}

// ===== FUNÇÕES DISPONÍVEIS GLOBALMENTE (ATUALIZADO) =====
window.AIAssistant = {
    toggleChat: toggleAIChat,
    askQuestion: processAIQuestion,
    reloadKnowledge: preloadKnowledgeBase,
    reloadAllDocuments: async function() {
        FILE_CACHE.clear();
        localStorage.removeItem('ai_knowledge_cache');
        localStorage.removeItem('ai_knowledge_time');
        
        AI_STATE.knowledgeBase = null;
        AI_STATE.isInitialized = false;
        
        showLoadProgress();
        loadProgress = { total: 0, loaded: 0, failed: 0 };
        
        await preloadKnowledgeBase();
        
        hideLoadProgress();
        return AI_STATE.isInitialized;
    },
    getDocumentStats: function() {
        if (!AI_STATE.knowledgeBase) return null;
        
        const stats = {};
        for (const category in AI_STATE.knowledgeBase) {
            stats[category] = {
                count: Object.keys(AI_STATE.knowledgeBase[category]).length,
                files: Object.keys(AI_STATE.knowledgeBase[category])
            };
        }
        
        return stats;
    },
    toggleGemini: function(enable = null) {
        if (enable !== null) {
            AI_CONFIG.useGemini = enable;
        } else {
            AI_CONFIG.useGemini = !AI_CONFIG.useGemini;
        }
        
        if (AI_CONFIG.useGemini) {
            initializeGemini();
        }
        
        return AI_CONFIG.useGemini;
    },
    setApiKey: function(apiKey) {
        if (apiKey && apiKey.startsWith('AIzaSy')) {
            // Salvar em localStorage para sessão atual
            localStorage.setItem('GEMINI_API_KEY', apiKey);
            
            // Atualizar configuração (não pode modificar getter, então salvar em localStorage)
            localStorage.setItem('GEMINI_API_KEY_CUSTOM', apiKey);
            
            // Reinicializar Gemini
            return initializeGemini();
        } else {
            console.error('Chave API inválida');
            return Promise.resolve(false);
        }
    },
    getStats: () => ({
        isInitialized: AI_STATE.isInitialized,
        documentCount: countDocuments(),
        geminiAvailable: GEMINI_STATE.isAvailable,
        geminiEnabled: AI_CONFIG.useGemini,
        geminiValidKey: GEMINI_STATE.isValidKey,
        lastError: GEMINI_STATE.lastError,
        lastSearch: AI_STATE.currentSearchTerm,
        lastMode: AI_STATE.lastResponseMode,
        cacheSize: FILE_CACHE.data.size
    })
};
console.log('🤖 Módulo IA carregado com sucesso');
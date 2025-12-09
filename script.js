// ===== CONFIGURAÇÕES GLOBAIS =====
const CONFIG = {
    search: {
        minChars: 2,
        debounceTime: 300
    },
    modules: {
        status: {
            available: 'Disponível',
            development: 'Em Desenvolvimento',
            comingSoon: 'Em Breve'
        }
    }
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
    // Aqui você pode integrar com Google Analytics ou outro serviço
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
    
    // Log para demonstração (substitua por sua solução de analytics)
    console.log('📈 Clique no módulo:', clickData);
    
    // Exemplo: Enviar para Google Analytics
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', 'module_click', {
    //         'event_category': 'Navigation',
    //         'event_label': moduleTitle
    //     });
    // }
}

// ===== FUNÇÕES DE ACESSIBILIDADE =====
function enhanceAccessibility() {
    // Adicionar labels ARIA para melhor acessibilidade
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.setAttribute('aria-label', 'Buscar módulos de treinamento');
    }
    
    // Navegação por teclado
    document.addEventListener('keydown', function(e) {
        // Tab para navegar entre módulos
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
// SEÇÃO IA - ASSISTENTE INTELIGENTE
// ============================================

// Verifica se a página atual é onde o assistente será usado
if (window.location.pathname.includes('index.html') || 
    window.location.pathname.includes('dashboard')) {
    
  // Aguarda o DOM carregar
  document.addEventListener('DOMContentLoaded', async function() {
    // Carrega a base de conhecimento quando necessário
    window.knowledgeBase = null;
    
    // Função para carregar conhecimento
    window.loadKnowledgeBase = async function() {
      if (window.knowledgeBase) return window.knowledgeBase;
      
      console.log('Carregando base de conhecimento...');
      const modules = {
        boasPraticas: await loadHTMLContent('SubmodulesBoasPraticas/'),
        hotel: await loadHTMLContent('SubmodulesHotel/'),
        motel: await loadHTMLContent('SubmodulesMotel/')
      };
      
      window.knowledgeBase = modules;
      return modules;
    };
    
    // Função auxiliar para carregar HTML
    async function loadHTMLContent(folderPath) {
      // Implementação conforme acima
    }
    
    // Inicializa quando o usuário clicar no botão de IA
    const aiButton = document.getElementById('ai-assistant-btn');
    if (aiButton) {
      aiButton.addEventListener('click', async () => {
        const knowledge = await window.loadKnowledgeBase();
        openAIChat(knowledge);
      });
    }
  });
}
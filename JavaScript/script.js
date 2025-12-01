document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const originalContent = document.getElementById('originalContent');
    const allTrainingCards = document.querySelectorAll('.training-card');
    
    // Função para normalizar texto (remover acentos e converter para minúsculas)
    function normalizeText(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
    
    // Função para buscar treinamentos
    function searchTrainings(searchTerm) {
        const normalizedSearch = normalizeText(searchTerm);
        const results = [];
        
        // Buscar em todos os cards de treinamento
        allTrainingCards.forEach(card => {
            const title = card.getAttribute('data-title');
            const href = card.getAttribute('href');
            const category = card.getAttribute('data-category');
            const module = card.getAttribute('data-module');
            
            const normalizedTitle = normalizeText(title);
            const normalizedModule = normalizeText(module);
            const normalizedCategory = normalizeText(category);
            
            // Verificar se o termo de busca está no título, módulo ou categoria
            if (normalizedTitle.includes(normalizedSearch) || 
                normalizedModule.includes(normalizedSearch) ||
                normalizedCategory.includes(normalizedSearch)) {
                results.push({
                    title: title,
                    href: href,
                    category: category,
                    module: module
                });
            }
        });
        
        return results;
    }
    
    // Função para exibir resultados
    function displayResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">Nenhum treinamento encontrado. Tente usar termos diferentes.</div>';
            searchResults.style.display = 'block';
            originalContent.style.display = 'none';
        } else {
            let html = '<div class="results-title">🎯 Resultados da Busca</div>';
            html += '<div class="results-grid">';
            
            results.forEach(result => {
                html += `
                    <a href="${result.href}" class="training-card" data-title="${result.title}" data-category="${result.category}">
                        <div class="training-title">${result.title}</div>
                        <div class="training-duration">${result.category} • ${result.module}</div>
                    </a>
                `;
            });
            
            html += '</div>';
            searchResults.innerHTML = html;
            searchResults.style.display = 'block';
            originalContent.style.display = 'none';
        }
    }
    
    // Função para limpar busca e mostrar conteúdo original
    function clearSearch() {
        searchResults.style.display = 'none';
        searchInput.value = '';
        originalContent.style.display = 'block';
    }
    
    // Event listener para input de busca
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        if (searchTerm.length === 0) {
            clearSearch();
            return;
        }
        
        if (searchTerm.length < 2) {
            searchResults.innerHTML = '<div class="no-results">Digite pelo menos 2 caracteres...</div>';
            searchResults.style.display = 'block';
            originalContent.style.display = 'none';
            return;
        }
        
        const results = searchTrainings(searchTerm);
        displayResults(results);
    });
    
    // Event listener para tecla Escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearSearch();
            this.blur();
        }
    });
    
    // Focar no campo de busca quando a página carregar
    searchInput.focus();
});
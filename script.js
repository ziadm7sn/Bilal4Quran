document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. DOM Elements & Global State
    // =========================================================================
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loadingDiv = document.getElementById('loadingDiv');
    const errorDiv = document.getElementById('errorDiv');
    const resultsDiv = document.getElementById('resultsDiv');
    const noResultsDiv = document.getElementById('noResultsDiv');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const translationsToggle = document.getElementById('translationsToggle');
    const resultsPerPageSelect = document.getElementById('resultsPerPageSelect');

    let quranData = [];
    let isQuranDataLoaded = false;
    let translationsEnabled = true;
    let translationsData = {
        french_hameedullah: null,
        french_rashid: null,
        french_montada: null
    };
    let allSearchResults = [];
    let currentPage = 1;
    let resultsPerPage = 10;
    let totalPages = 0;

    const translationKeys = {
        french_hameedullah: 'محمد حميد الله',
        french_rashid: 'رشيد معاش',
        french_montada: 'محمد نبيل رضوان'
    };
    const suraNames = [ 'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم', 'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر', 'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس', 'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد', 'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص', 'الفلق', 'الناس' ];

    // =========================================================================
    // 2. Initialization & Event Listeners
    // =========================================================================
    
    async function initializeApp() {
        // لا حاجة لتعطيل الأزرار هنا، سنعتمد على حالة `isQuranDataLoaded`
        setLoadingState(true, 'جاري تجهيز بيانات القرآن...');
        try {
            await loadQuranData();
            // عند النجاح، نقوم بتفعيل حقل البحث
            searchInput.disabled = false;
            searchBtn.disabled = false;
            searchInput.placeholder = "أدخل الكلمة أو الجملة المراد البحث عنها...";
        } catch (error) {
            showError("فشل تحميل بيانات القرآن. يرجى تحديث الصفحة.");
            console.error("Initialization failed:", error);
            // سيبقى حقل البحث معطلاً في حالة الفشل
        } finally {
            setLoadingState(false);
        }
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            performSearch();
        }
    });
    translationsToggle.addEventListener('change', () => {
        translationsEnabled = translationsToggle.checked;
        if (allSearchResults.length > 0) displayPaginatedResults();
    });
    resultsPerPageSelect.addEventListener('change', () => {
        resultsPerPage = parseInt(resultsPerPageSelect.value, 10);
        currentPage = 1;
        if (allSearchResults.length > 0) displayPaginatedResults();
    });
    document.getElementById('firstPageBtn').addEventListener('click', () => goToPage(1));
    document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('lastPageBtn').addEventListener('click', () => goToPage(totalPages));
    
    // بدء تشغيل التطبيق
    initializeApp();

    // =========================================================================
    // 3. Data Loading & Parsing
    // =========================================================================

    function robustParseCsvLine(line) {
        const parts = [];
        let currentPart = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && !inQuotes && (i === 0 || line[i-1] === ',')) {
                inQuotes = true;
                continue;
            }
            if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                inQuotes = false;
                continue;
            }
            if (char === ',' && !inQuotes) {
                parts.push(currentPart);
                currentPart = '';
            } else {
                currentPart += char;
            }
        }
        parts.push(currentPart);
        return parts;
    }

    async function loadAndProcessCsv(filePath, processLine) {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Cannot load file: ${filePath}`);
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const dataLines = lines.filter(line => line.trim() && !line.startsWith('#') && !line.toLowerCase().startsWith('id,sura,aya'));
        dataLines.forEach(processLine);
    }

    async function loadQuranData() {
        if (isQuranDataLoaded) return;
        await loadAndProcessCsv('orthographic_v1.0.csv', (line) => {
            const parts = robustParseCsvLine(line);
            if (parts.length >= 5) {
                const suraNumber = parseInt(parts[2], 10);
                quranData.push({
                    serialNumber: parseInt(parts[0], 10),
                    suraNumber: suraNumber,
                    ayahNumber: parseInt(parts[3], 10),
                    ayahText: parts[4].replace(/^"|"$/g, '').trim(),
                    suraName: suraNames[suraNumber - 1] || `سورة ${suraNumber}`
                });
            }
        });
        isQuranDataLoaded = true;
        console.log(`Loaded ${quranData.length} ayahs.`);
    }

    async function loadAllTranslationFiles() {
        const translationFilePaths = {
            french_hameedullah: 'translations/french_hameedullah.csv',
            french_rashid: 'translations/french_rashid.csv',
            french_montada: 'translations/french_ridwan.csv'
        };

        const loadPromises = Object.keys(translationFilePaths).map(async (key) => {
            if (translationsData[key] === null) {
                try {
                    const translationMap = new Map();
                    await loadAndProcessCsv(translationFilePaths[key], (line) => {
                        const parts = robustParseCsvLine(line);
                        if (parts.length >= 4) {
                            const suraAyahKey = `${parts[1]}:${parts[2]}`;
                            const text = parts[3].replace(/^"|"$/g, '').trim();
                            translationMap.set(suraAyahKey, text);
                        }
                    });
                    translationsData[key] = translationMap;
                } catch (error) {
                    console.error(`Failed to load translation file ${key}:`, error);
                    translationsData[key] = new Map();
                }
            }
        });
        await Promise.all(loadPromises);
    }
    
    // =========================================================================
    // 4. Core Logic
    // =========================================================================
    
    async function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            alert('يرجى إدخال كلمة أو جملة للبحث');
            return;
        }
        
        hideAllResults();
        setLoadingState(true, 'جاري البحث...');
        searchBtn.disabled = true;

        setTimeout(async () => {
            try {
                const results = searchInQuran(searchTerm);
                if (results.length > 0) {
                    allSearchResults = results;
                    currentPage = 1;
                    if (translationsEnabled) {
                        setLoadingState(true, 'جاري تحميل الترجمات...');
                        await loadAllTranslationFiles();
                    }
                    displayPaginatedResults();
                } else {
                    noResultsDiv.style.display = 'block';
                }
            } catch (error) {
                showError(`حدث خطأ أثناء البحث: ${error.message}`);
            } finally {
                setLoadingState(false);
                searchBtn.disabled = false;
            }
        }, 10);
    }

    function searchInQuran(searchTerm) {
        const normalizedSearchTerm = searchTerm.toLowerCase().trim().replace(/[\u064B-\u0652\u0670\u0640]/g, '');
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        
        return quranData
            .filter(ayah => ayah.ayahText.toLowerCase().replace(/[\u064B-\u0652\u0670\u0640]/g, '').includes(normalizedSearchTerm))
            .sort((a, b) => a.serialNumber - b.serialNumber)
            .map(ayah => {
                const highlightedText = ayah.ayahText.replace(regex, `<mark>${searchTerm}</mark>`);
                return {
                    originalData: ayah,
                    formattedText: `${highlightedText} <span class="ayah-ref">[${ayah.suraName}: ${ayah.ayahNumber}]</span>`
                };
            });
    }

    function getLocalTranslations(suraNumber, ayahNumber) {
        const translations = {};
        const suraAyahKey = `${suraNumber}:${ayahNumber}`;
        for (const key in translationKeys) {
            translations[key] = (translationsData[key]?.get(suraAyahKey)) || 'غير متوفرة';
        }
        return translations;
    }

    // =========================================================================
    // 5. UI Rendering & Pagination
    // =========================================================================

    function displayPaginatedResults() {
        totalPages = Math.ceil(allSearchResults.length / resultsPerPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
        
        const startIndex = (currentPage - 1) * resultsPerPage;
        const currentPageResults = allSearchResults.slice(startIndex, startIndex + resultsPerPage);

        displayResults(currentPageResults);
        updatePaginationInfo();
        document.getElementById('paginationDiv').style.display = totalPages > 1 ? 'block' : 'none';
    }

    function displayResults(results) {
        resultsTableBody.innerHTML = '';
        results.forEach(resultItem => {
            const row = resultsTableBody.insertRow();
            const { suraNumber, ayahNumber } = resultItem.originalData;
            
            row.insertCell().innerHTML = `<div class="verse-text">${resultItem.formattedText}</div>`;

            const translations = translationsEnabled ? getLocalTranslations(suraNumber, ayahNumber) : {};
            
            updateTranslationCell(row.insertCell(), translations.french_hameedullah);
            updateTranslationCell(row.insertCell(), translations.french_rashid);
            updateTranslationCell(row.insertCell(), translations.french_montada);
        });
        resultsDiv.style.display = 'block';
    }

    function updateTranslationCell(cell, text) {
        cell.className = 'translation-cell';
        if (!translationsEnabled || !text) {
            cell.innerHTML = '';
            return;
        }
        cell.innerHTML = (text !== 'غير متوفرة')
            ? `<div class="translation-text">${text}</div>`
            : `<div class="translation-unavailable">${text}</div>`;
    }

    function updatePaginationInfo() {
        document.getElementById('resultsInfo').textContent = `تم العثور على ${allSearchResults.length} آية.`;
        document.getElementById('pageInfo').textContent = `الصفحة ${currentPage} من ${totalPages}`;
        document.getElementById('currentPageDisplay').textContent = `${currentPage} / ${totalPages}`;
        updatePaginationButtons();
    }
        
    function updatePaginationButtons() {
        document.getElementById('firstPageBtn').disabled = (currentPage === 1);
        document.getElementById('prevPageBtn').disabled = (currentPage === 1);
        document.getElementById('nextPageBtn').disabled = (currentPage === totalPages);
        document.getElementById('lastPageBtn').disabled = (currentPage === totalPages);
    }
        
    function goToPage(page) {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            currentPage = page;
            displayPaginatedResults();
        }
    }
        
    function hideAllResults() {
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        resultsDiv.style.display = 'none';
        noResultsDiv.style.display = 'none';
    }

    function setLoadingState(isLoading, message = 'جاري البحث...') {
        loadingDiv.innerHTML = `<div class="spinner"></div><p>${message}</p>`;
        loadingDiv.style.display = isLoading ? 'block' : 'none';
    }
        
    function showError(message) {
        errorDiv.innerHTML = `<div class="error-message">${message}</div>`;
        errorDiv.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const languageSelect = document.getElementById('languageSelect');
    const questionCountInput = document.getElementById('questionCount');
    const askButton = document.getElementById('askButton');
    const categorySelectorsContainer = document.getElementById('categorySelectorsContainer');
    const questionsContainer = document.getElementById('questionsContainer');

    let categories = [];

    // Función para normalizar cadenas (eliminar tildes y convertir a minúsculas)
    function normalizeString(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ /g, '-');
    }

    // Cargar categorías y generar opciones del select
    function loadCategories() {
        return fetch('categories/categories.txt')
            .then(response => response.text())
            .then(data => {
                categories = data.split('\n').filter(line => line.trim()).map(line => {
                    const [value, text] = line.split('|');
                    return { value, es: value, en: text };
                });
            })
            .catch(error => console.error('Error fetching categories:', error));
    }

    // Generar selects de categorías
    function generateCategorySelectors(n) {
        categorySelectorsContainer.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const select = document.createElement('select');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.value;
                option.textContent = languageSelect.value === 'es' ? category.es : category.en;
                select.appendChild(option);
            });
            // Seleccionar una categoría aleatoria
            const randomIndex = Math.floor(Math.random() * categories.length);
            select.selectedIndex = randomIndex;
            categorySelectorsContainer.appendChild(select);
        }
    }

    // Guardar el estado del idioma
    function saveLanguageSetting() {
        localStorage.setItem('selectedLanguage', languageSelect.value);
    }

    // Cargar el estado del idioma
    function loadLanguageSetting() {
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage) {
            languageSelect.value = savedLanguage;
        }
    }

    // Evento para cambiar la cantidad de selects cuando cambia el número de preguntas
    questionCountInput.addEventListener('change', function () {
        const n = parseInt(questionCountInput.value, 10);
        generateCategorySelectors(n);
    });

    // Evento de botón para generar preguntas aleatorias
    askButton.addEventListener('click', function () {
        const selectedLanguage = languageSelect.value;
        const n = parseInt(questionCountInput.value, 10);
        const selectedCategories = Array.from(categorySelectorsContainer.children).map(select => select.value);

        const questionPromises = selectedCategories.map(category => {
            const normalizedCategory = normalizeString(category);
            return fetch(`categories/${normalizedCategory}.txt`).then(response => response.text());
        });

        Promise.all(questionPromises)
            .then(results => {
                const questionsByCategory = {};
                results.forEach((data, index) => {
                    const category = selectedCategories[index];
                    const questions = data.split('\n').filter(line => line.trim()).map(line => {
                        const [es, en] = line.split('|');
                        return { es: es.trim(), en: en.trim() };
                    });
                    questionsByCategory[category] = questions;
                });

                const randomQuestions = selectedCategories.map(category => {
                    const questions = questionsByCategory[category];
                    const randomIndex = Math.floor(Math.random() * questions.length);
                    return questions[randomIndex];
                });

                questionsContainer.innerHTML = '';
                randomQuestions.forEach(question => {
                    let questionText;
                    if (selectedLanguage === 'es') {
                        questionText = question.es || question.en;  // Mostrar en español si está disponible, sino en inglés
                    } else {
                        questionText = question.en || question.es;  // Mostrar en inglés si está disponible, sino en español
                    }
                    const questionElement = document.createElement('div');
                    questionElement.className = 'question';
                    questionElement.textContent = questionText;
                    questionsContainer.appendChild(questionElement);
                });
            })
            .catch(error => console.error('Error fetching questions:', error));
    });

    // Inicializar
    loadCategories().then(() => {
        loadLanguageSetting();
        const initialQuestionCount = parseInt(questionCountInput.value, 10);
        generateCategorySelectors(initialQuestionCount);
    });

    // Cambiar el texto de las categorías cuando cambia el idioma y guardar el estado
    languageSelect.addEventListener('change', function () {
        saveLanguageSetting();
        Array.from(categorySelectorsContainer.children).forEach(select => {
            const currentCategory = select.value;
            select.innerHTML = '';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.value;
                option.textContent = languageSelect.value === 'es' ? category.es : category.en;
                select.appendChild(option);
            });
            select.value = currentCategory;
        });
    });

    const gameDescriptionEsElement = document.getElementById('gameDescriptionEs');
    const gameDescriptionEnElement = document.getElementById('gameDescriptionEn');

    function updateGameDescription() {
        const selectedLanguage = languageSelect.value;

        gameDescriptionEsElement.style.display = selectedLanguage === 'es' ? 'block' : 'none';
        gameDescriptionEnElement.style.display = selectedLanguage === 'en' ? 'block' : 'none';
    }

    languageSelect.addEventListener('change', updateGameDescription);
    updateGameDescription(); // Inicializa la descripción del juego
});

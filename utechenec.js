const config = {
    typingDelayMin: 50,
    typingDelayMax: 150,
    preFieldDelayMin: 300,
    preFieldDelayMax: 800,
    postFieldDelayMin: 80,
    postFieldDelayMax: 200,
    delayedFieldJitterMin: 50,
    delayedFieldJitterMax: 250,
    stepTransitionDelayMin: 5000,
    stepTransitionDelayMax: 7000,
    waitForElementMaxAttempts: 50,
    waitForElementInterval: 200,
};
function triggerEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: false }));
    el.dispatchEvent(new Event('blur', { bubbles: true, cancelable: false }));
}
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function typeValue(el, value) {
    el.value = ''; // Очистити поле перед набором
    triggerEvents(el); // Іноді потрібно після очищення
    await wait(randomDelay(50, 100)); // Невелика пауза перед початком набору

    for (const char of String(value)) {
        el.value += char;
        el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        await wait(randomDelay(config.typingDelayMin, config.typingDelayMax));
    }
    triggerEvents(el);
}
function waitForElement(id) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            const el = document.getElementById(id);
            if (el) {
                clearInterval(interval);
                console.log(`🔍 Елемент знайдено: ${id}`);
                resolve(el);
            } else {
                attempts++;
                if (attempts >= config.waitForElementMaxAttempts) {
                    clearInterval(interval);
                    console.warn(`⚠️ Елемент з ID "${id}" не знайдено після ${attempts} спроб.`);
                    resolve(null); // Повертаємо null, щоб обробити у викликаючому коді
                }
            }
        }, config.waitForElementInterval);
    });
}

const delayedFields = {
    'residence-address-county-0': 2000,
    'residence-address-municipality-0': 2000,
    'residence-address-street-0': 2000,
    'fs13-0-travel-doc-type': 500,
};
const step1Fields = [
    ['fs3-name-10', "Taras", 'text'],
    ['fs1-surname-10', "Stetsovych", 'text'],

    ['fs7-date-of-birth0', async (el) => {
        el.focus();
        await wait(100);

        // Введення значення
        el.value = '02.09.2005';
        triggerEvents(el);
        await wait(200);
        for (let i = 0; i < 10; i++) {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft', bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft', code: 'ArrowLeft', bubbles: true }));
            await wait(50);
        }
        for (let i = 0; i < 2; i++) {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Delete', code: 'Delete', bubbles: true }));
            await wait(50);
        }

        triggerEvents(el); // фінальні події
    }, 'custom'],
    ['s41-delivery-phone-captcha', "+421947171844", 'text'],
    ['email0', "ilariondub1@gmail.com", 'text'],
];

const step2Fields = [
    ['s42-check-gdpr-info', true, 'checkbox'], // true для checked
    ['fs13-0-travel-doc-type', "1", 'select'],
    ['fs13-travel-doc-number', "C2847", 'text'],
];

const step3Fields = [
    ['s5-previous-surname-1', "B", 'text'],
    ['s4-name-at-birth-1', "B", 'text'],
    ['s6-sex', "M", 'select'],
    ['s8-place-of-birth', "B", 'text'],
    ['s01-residence-document-id', "C5", 'text'],
    ['s9-country-of-birth', "UKR", 'select'],
    ['s10-citizenship', "UKR", 'select'],
    ['s11-nationality', "10", 'select'], // Перевірте, чи це ID чи текстове значення
    ['s12-marital-status', "2", 'select'],
    ['s19-education', "3", 'select'],
    ['s14-travel-doc-issue-date', "12.12.2020", 'text'],
    ['s15-travel-doc-valid-until', "12.02.2025", 'text'],
    ['s16-travel-doc-issued-by', "C5", 'text'],
    ['s16-0-travel-doc-issued-country', "UKR", 'select'],
    ['s28-last-perm-res-abroad-address', "B", 'text'],
    ['s29-last-perm-res-abroad-country', "UKR", 'select'],
    ['s30-last-perm-res-reg-date', "20.12.2024", 'text'],
    ['address-foreign-copy', null, 'click'], // Значення не потрібне для кліку
    ['s26-perm-res-abroad-address-native', "B", 'text'],
    ['residence-address-county-0', "6811", 'select'],
    ['residence-address-municipality-0', "117099", 'select'],
    ['residence-address-district-0', "217099", 'select'],
    ['residence-address-register-number-0', '1895', 'text'],
    ['residence-address-street-0', "28641", 'select'],
    ['residence-address-house-number-0', '22', 'text'],
    ['s42-individual-delivery', 'false', 'select'],
    ['delivery-address-copy-0', null, 'click'],
];


// 🚀 Основна функція заповнення полів для одного кроку
async function fillFields(fields, label) {
    console.log(`--- Початок: ${label} ---`);
    for (const [id, value, type] of fields) {
        console.log(`⏳ Пошук елемента: ${id}`);
        const el = await waitForElement(id);

        if (!el) {
            console.warn(`[${label}] ⚠️ Пропуск поля: Елемент ${id} не знайдено.`);
            continue; // Перейти до наступного поля, якщо елемент не знайдено
        }

        try {
            // Визначення затримки перед взаємодією
            let preDelay;
            if (delayedFields[id]) {
                const baseDelay = delayedFields[id];
                const jitter = randomDelay(config.delayedFieldJitterMin, config.delayedFieldJitterMax);
                preDelay = baseDelay + jitter;
                console.log(`⏳ Спеціальна затримка для ${id}: ${baseDelay} + ${jitter} (jitter) = ${preDelay} мс`);
            } else {
                preDelay = randomDelay(config.preFieldDelayMin, config.preFieldDelayMax);
                console.log(`🕐 Випадкова затримка перед ${id}: ${preDelay} мс`);
            }
            await wait(preDelay);

            // --- Взаємодія з елементом ---
            el.focus(); // Імітація фокусу перед дією
            await wait(randomDelay(50, 150)); // Маленька пауза після фокусу

            switch (type) {
                case 'text':
                    console.log(`⌨️ Введення тексту в ${id}: ${value}`);
                    await typeValue(el, value); // Використання функції typeValue
                    break;
                case 'select':
                    console.log(`🖱️ Вибір значення в ${id}: ${value}`);
                    el.value = value;
                    triggerEvents(el); // Для select теж потрібні події
                    break;
                case 'checkbox':
                    console.log(`☑️ Зміна стану чекбоксу ${id}: ${value}`);
                    el.checked = Boolean(value);
                    triggerEvents(el);
                    break;
                case 'click':
                    console.log(`🖱️ Клік по ${id}`);
                    el.click();
                    break;

                case 'custom':
                    console.log(`⚙️ Спеціальна логіка для ${id}`);
                    await value(el); // value — це функція
                    break;


                default:
                    console.warn(`[${label}] ❓ Невідомий тип поля "${type}" для ID ${id}`);
                    continue; // Пропустити невідомий тип
            }

            console.log(`[${label}] ✅ Завершено: ${id}`);

            const postDelay = randomDelay(config.postFieldDelayMin, config.postFieldDelayMax);
            await wait(postDelay);

        } catch (e) {
            console.error(`[${label}] ❌ Помилка при обробці ${id}:`, e);
        }
    }
    console.log(`--- Завершено: ${label} ---`);
}

try {
    history.replaceState(null, null, location.href);
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });
    console.log("🧹 Історія браузера та кеш очищено.");
} catch (err) {
    console.warn("⚠️ Помилка при очищенні:", err);
}

(async () => {
    console.log("⏳ Очікування натискання кнопки #langSK...");
    const langButton = await waitForElement('langSK');
    if (!langButton) {
        console.error('❌ Кнопку #langSK не знайдено. Запуск неможливий.');
        return;
    }

    langButton.addEventListener('click', async () => {
        console.log("🟢 Кнопка мови натиснута. Запускаємо Крок 1...");
        await wait(randomDelay(800, 1500)); // Невелика пауза після натискання

        await fillFields(step1Fields, '[Step 1]');

        console.log("⏳ Очікування на вибір одного з міст (радіо-кнопки)...");

        const triggerStep2Button = await waitForElement('f1-offices');
        if (!triggerStep2Button) {
            console.error('❌ Не вдалося знайти блок з містами (#f1-offices).');
            return;
        }

        triggerStep2Button.addEventListener('click', async () => {
            const delay = randomDelay(800, 1500);
            console.log(`🚀 Кнопка Кроку 2 натиснута. Запуск Кроку 2 через ${delay} мс...`);
            await wait(delay);
            await fillFields(step2Fields, '[Step 2]');
            console.log("✅🏁 Всі кроки завершено!");
        }, { once: true });

        console.log("📝 Крок 1 завершено. Очікування на клік Кроку 2...");
    }, { once: true });

})();

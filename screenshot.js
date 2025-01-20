const { chromium } = require('playwright');
const { Telegraf } = require('telegraf');

// Ganti dengan token bot Telegram Anda
const bot = new Telegraf('7832217088:AAEbMw8wUeA8Q7LCOYW7RC_aKxhJt2M97MA');

// Fungsi untuk login dan mengambil screenshot setelahnya
async function captureScreenshot(url, loginUrl, username, password, ctx) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ timeout: 180000 }); // Set timeout global
    const page = await browser.newPage();
    page.setDefaultTimeout(180000); // 180 detik untuk semua tindakan pada halaman ini
    
    try {
        // Proses membuka halaman login
        console.log('Mencoba mengakses halaman login...');
        await page.goto(loginUrl);
        console.log('Halaman login dimuat.');

        // Proses input username
        await page.fill('input[name="username"]', username);
        console.log('Username dimasukkan.');

        // Proses input password
        await page.fill('input[name="password"]', password);
        console.log('Password dimasukkan.');

        // Proses submit form login dengan tombol yang telah diperbarui
        await page.click('.btn.btn-block.btn-primary.btn-lg.font-weight-medium.auth-form-btn');
        console.log('Tombol login diklik.');

        console.log('Menunggu dashboard dimuat...');
        await page.waitForSelector('.card.identity-card.b-rad-all-10', { timeout: 180000 });
        console.log('Elemen berhasil dimuat.');


        // Langsung membuka URL tiket
        console.log('Membuka URL tiket...');
        await page.goto('https://intranet2023.biznetnetworks.com/2023/crm/ticket');  // Langsung mengakses URL tiket
        console.log('URL tiket dibuka.');

        console.log('Prosessing');
        await page.waitForFunction(() => {
            const element = document.querySelector('#ticket-list-table_processing');
            return element && element.style.display === 'none';
        }, { timeout: 180000 }); // Maksimal waktu tunggu 120 detik

        // Mengatur ukuran viewport
        console.log('Mengatur ukuran viewport...');
        await page.setViewportSize({ width: 2023, height: 1080 });  // Sesuaikan tinggi sesuai kebutuhan

        // Menunggu elemen tabel muncul sebelum mengambil screenshot
        const elementSelector = '.table-wrapper .table-container-h';  // Sesuaikan dengan elemen yang ingin diambil screenshot-nya
        const element = await page.locator(elementSelector);
        
        // Ambil screenshot hanya dari elemen yang dipilih
        console.log('Mengambil screenshot dari elemen...');
        const screenshotDashboard = await element.screenshot();
        await browser.close();
        console.log('Screenshot berhasil diambil.');

        // Proses mengirim hasil screenshot ke chat bot
        console.log('Mengirim screenshot tiket ke chat...');
        await ctx.replyWithPhoto({ source: screenshotDashboard });
        console.log('Screenshot berhasil dikirim ke chat.');

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        const finalScreenshot = await page.screenshot();
        await ctx.reply('Proses dihentikan karena kesalahan. Berikut adalah screenshot terakhir.');
        await ctx.replyWithPhoto({ source: finalScreenshot });
        await ctx.reply('Terjadi kesalahan. Pastikan URL valid dan login berhasil.');
        await browser.close();
        throw error;
    }
}

// Menunggu perintah /screenshot dari pengguna
bot.command('screenshot', async (ctx) => {
    console.log('Menerima perintah /screenshot');
    await ctx.reply('Silakan kirimkan perintah /tiketlist setelah login.');

    // Menunggu input perintah /tiketlist dari pengguna
    bot.command('tiketlist', async (msgCtx) => {
        console.log('Menerima perintah /tiketlist');
        await msgCtx.reply('Tunggu sekitar -+ 1 menit...');

        const loginUrl = 'https://intranet2023.biznetnetworks.com/login'; // URL halaman login
        const username = 'mochamad_muslikhudin'; // Username login Anda
        const password = 'Biznet2024!'; // Password login Anda

        try {
            // Ambil screenshot setelah login dan akses URL
            await captureScreenshot('', loginUrl, username, password, msgCtx);
        } catch (error) {
            console.error('Terjadi kesalahan saat mengambil screenshot:', error);
            await msgCtx.reply('Terjadi kesalahan. Pastikan URL valid dan login berhasil.');
        }
    });
});

// Mulai bot
console.log('Bot sedang diluncurkan...');
bot.launch()
    .then(() => console.log('Bot telah diluncurkan!'))
    .catch((err) => console.error('Kesalahan saat meluncurkan bot:', err));

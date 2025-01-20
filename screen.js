import { chromium } from 'playwright';  
import { Telegraf } from 'telegraf';
import { Cluster } from 'playwright-cluster';  

// Ganti dengan token bot Telegram Anda
const bot = new Telegraf('7982547288:AAElbHzR2p9oT4RF7UW5gTlTLKpsOKFpMDI');

// Fungsi untuk login dan mengambil screenshot setelahnya
async function captureScreenshot(page, loginUrl, username, password, ctx) {
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

        // Jeda 2 detik setelah mengklik tombol login
        console.log('Menunggu 2 detik...');
        await page.waitForTimeout(2000);

        // Langsung membuka URL tiket
        console.log('Membuka URL tiket...');
        await page.goto('https://intranet2023.biznetnetworks.com/2023/crm/ticket');
        console.log('URL tiket dibuka.');

        console.log('Processing...');
        await page.waitForFunction(() => {
            const element = document.querySelector('#ticket-list-table_processing');
            return element && element.style.display === 'none';
        }, { timeout: 120000 });

        // Mengatur ukuran viewport
        console.log('Mengatur ukuran viewport...');
        await page.setViewportSize({ width: 2023, height: 1080 });

        // Menunggu elemen tabel muncul sebelum mengambil screenshot
        const elementSelector = '.table-wrapper .table-container-h';
        const element = await page.locator(elementSelector);

        // Ambil screenshot hanya dari elemen yang dipilih
        console.log('Mengambil screenshot dari elemen...');
        const screenshotDashboard = await element.screenshot();

        console.log('Screenshot berhasil diambil.');

        // Proses mengirim hasil screenshot ke chat bot
        console.log('Mengirim screenshot tiket ke chat...');
        await ctx.replyWithPhoto({ source: screenshotDashboard });
        console.log('Screenshot berhasil dikirim ke chat.');

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        await ctx.reply('Terjadi kesalahan. Pastikan URL valid dan login berhasil.');
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
        await msgCtx.reply('Tunggu sekitar 1 menit... Permintaan Anda sedang dalam antrian.');

        const loginUrl = 'https://intranet2023.biznetnetworks.com/login'; // URL halaman login
        const username = 'mochamad_muslikhudin'; // Username login Anda
        const password = 'Biznet2024!'; // Password login Anda

        try {
            // Membuat cluster untuk menjalankan tugas secara paralel
            const cluster = await Cluster.launch({
                concurrency: Cluster.CONCURRENCY_CONTEXT, // Menjalankan task di setiap konteks terpisah
                maxConcurrency: 5, // Maksimal 5 permintaan bersamaan
                timeout: 60000 // Timeout setelah 1 menit jika tidak ada progress
            });

            // Menambahkan tugas ke cluster
            await cluster.task(async ({ page, data }) => {
                await captureScreenshot(page, loginUrl, username, password, msgCtx);
            });

            // Menambahkan tugas untuk setiap permintaan
            await cluster.queue({});

            // Menunggu cluster selesai memproses semua tugas
            await cluster.idle(); // Pastikan cluster idle sebelum melanjutkan
            await cluster.close(); // Tutup cluster setelah selesai

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

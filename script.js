const folderInput = document.getElementById('folderInput');
const watermarkText = document.getElementById('watermarkText');
const logoInput = document.getElementById('logoInput');
const processBtn = document.getElementById('processBtn');
const gallery = document.getElementById('gallery');
const wmTypeRadios = document.getElementsByName('wmType');
const textInputGroup = document.getElementById('textInputGroup');
const imageInputGroup = document.getElementById('imageInputGroup');

// Logika buat ganti input Text vs Image
wmTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'text') {
            textInputGroup.style.display = 'block';
            imageInputGroup.style.display = 'none';
        } else {
            textInputGroup.style.display = 'none';
            imageInputGroup.style.display = 'block';
        }
    });
});

// Fungsi buat ngebaca file logo PNG
const loadLogo = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

processBtn.addEventListener('click', async () => {
    const files = folderInput.files;
    
    if (files.length === 0) {
        alert('Pilih folder foto targetnya dulu bos!');
        return;
    }

    const wmType = document.querySelector('input[name="wmType"]:checked').value;
    let logoImg = null;

    if (wmType === 'image') {
        if (logoInput.files.length === 0) {
            alert('Upload file watermark logo (PNG) dulu!');
            return;
        }
        try {
            logoImg = await loadLogo(logoInput.files[0]);
        } catch (err) {
            alert('Gagal meload logo, pastikan formatnya gambar.');
            return;
        }
    }

    gallery.innerHTML = '';
    processBtn.innerText = '⏳ Memproses...';
    processBtn.disabled = true;

    try {
        // Pake Array.from biar lebih kompatibel buat diloop
        const fileArray = Array.from(files);
        
        for(let file of fileArray) {
            // Cek biar cuma gambar yang diproses
            if(file.type.startsWith('image/')) {
                await processImage(file, wmType, watermarkText.value, logoImg);
            }
        }
    } catch (error) {
        console.error("Error saat proses:", error);
        alert("Waduh, ada error pas ngeproses. Pastikan milih foldernya bener.");
    }

    processBtn.innerText = '🚀 Proses Foto';
    processBtn.disabled = false;
});

function processImage(file, wmType, text, logoImg) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // 1. Gambar foto asli dulu
                ctx.drawImage(img, 0, 0);

                const x = canvas.width / 2;

                if (wmType === 'text') {
                    // 2. Setelan buat Watermark Teks
                    const fontSize = Math.max(14, Math.floor(img.height * 0.03));
                    ctx.font = `bold ${fontSize}px 'Poppins', sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Putih transparansi 80%
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    
                    const y = canvas.height - (fontSize * 0.5);

                    // Tambah drop shadow biar kebaca
                    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    ctx.fillText(text, x, y);

                } else if (wmType === 'image' && logoImg) {
                    // 3. Setelan buat Watermark Logo Gambar
                    // Tinggi logo = 10% dari tinggi gambar asli
                    const targetLogoHeight = Math.max(30, img.height * 0.1); 
                    const scaleRatio = targetLogoHeight / logoImg.height;
                    const targetLogoWidth = logoImg.width * scaleRatio;

                    // Posisi logo di tengah bawah dengan sedikit jarak (padding)
                    const logoX = x - (targetLogoWidth / 2);
                    const logoY = canvas.height - targetLogoHeight - (img.height * 0.02);

                    // Bikin logo semi-transparan (80%) biar elegan
                    ctx.globalAlpha = 0.8;
                    ctx.drawImage(logoImg, logoX, logoY, targetLogoWidth, targetLogoHeight);
                    ctx.globalAlpha = 1.0; // reset
                }

                const dataUrl = canvas.toDataURL(file.type, 0.9);
                displayResult(dataUrl, file.name);
                resolve();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function displayResult(dataUrl, originalName) {
    const card = document.createElement('div');
    card.className = 'image-card';

    const imgPreview = document.createElement('img');
    imgPreview.src = dataUrl;

    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `WM_${originalName}`;
    downloadLink.innerText = '⬇️ Download';
    downloadLink.className = 'download-btn';

    card.appendChild(imgPreview);
    card.appendChild(downloadLink);
    gallery.appendChild(card);
}

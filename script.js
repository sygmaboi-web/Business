const folderInput = document.getElementById('folderInput');
const watermarkText = document.getElementById('watermarkText');
const logoInput = document.getElementById('logoInput');
const processBtn = document.getElementById('processBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const gallery = document.getElementById('gallery');
const wmTypeRadios = document.getElementsByName('wmType');
const textInputGroup = document.getElementById('textInputGroup');
const imageInputGroup = document.getElementById('imageInputGroup');

// Objek untuk menampung data ZIP
let zip = new JSZip();

// Mengatur tampilan input teks atau gambar berdasarkan radio button
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

// Fungsi untuk membaca logo file PNG
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
        alert('Pilih folder foto targetnya dulu!');
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
    downloadZipBtn.style.display = 'none';
    
    // Reset object ZIP setiap kali memproses folder baru
    zip = new JSZip(); 

    try {
        const fileArray = Array.from(files);
        
        for(let file of fileArray) {
            if(file.type.startsWith('image/')) {
                await processImage(file, wmType, watermarkText.value, logoImg);
            }
        }
        
        // Menampilkan tombol download ZIP jika ada file yang diproses
        if (Object.keys(zip.files).length > 0) {
            downloadZipBtn.style.display = 'block';
        }

    } catch (error) {
        console.error("Error saat proses:", error);
        alert("Terjadi error saat memproses. Pastikan folder yang dipilih benar.");
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

                // Menggambar foto asli
                ctx.drawImage(img, 0, 0);

                const x = canvas.width / 2;

                if (wmType === 'text') {
                    // Logika watermark teks
                    const fontSize = Math.max(14, Math.floor(img.height * 0.07));
                    ctx.font = `bold ${fontSize}px 'Poppins', sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    
                    const y = canvas.height - (fontSize * 0.5);

                    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    ctx.fillText(text, x, y);

                } else if (wmType === 'image' && logoImg) {
                    // Logika watermark gambar (PNG)
                    const targetLogoHeight = Math.max(30, img.height * 0.8); 
                    const scaleRatio = targetLogoHeight / logoImg.height;
                    const targetLogoWidth = logoImg.width * scaleRatio;

                    const logoX = x - (targetLogoWidth / 2);
                    const logoY = canvas.height - targetLogoHeight - (img.height * 0.02);

                    ctx.globalAlpha = 0.8;
                    ctx.drawImage(logoImg, logoX, logoY, targetLogoWidth, targetLogoHeight);
                    ctx.globalAlpha = 1.0; 
                }

                const dataUrl = canvas.toDataURL(file.type, 0.9);
                
                // Memasukkan hasil gambar ke dalam file ZIP
                const base64Data = dataUrl.split(',')[1];
                zip.file(`WM_${file.name}`, base64Data, {base64: true});

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

// Event Listener untuk memicu download file ZIP
downloadZipBtn.addEventListener('click', async () => {
    downloadZipBtn.innerText = '⏳ Menyiapkan ZIP... (Tunggu bentar)';
    downloadZipBtn.disabled = true;

    try {
        const content = await zip.generateAsync({type: "blob"});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "Hasil_Watermark.zip";
        link.click();
        
        URL.revokeObjectURL(link.href);
    } catch (err) {
        console.error("Gagal membuat ZIP:", err);
        alert("Gagal membuat file ZIP.");
    }

    downloadZipBtn.innerText = '📦 Download Semua (ZIP)';
    downloadZipBtn.disabled = false;
});

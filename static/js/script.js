function calculateHealthRisks(duration, perDay, exerciseFreq) {
    const packYears = (perDay / 20) * duration;

    const lung = packYears > 10 || duration >= 10
        ? { level: 'Tinggi', bar: 85, class: 'high' }
        : packYears > 3 || duration >= 3
            ? { level: 'Sedang', bar: 55, class: 'medium' }
            : { level: 'Rendah', bar: 25, class: 'low' };

    const heart = perDay >= 20 || duration >= 8
        ? { level: 'Tinggi', bar: 80, class: 'high' }
        : perDay >= 10 || duration >= 3
            ? { level: 'Sedang', bar: 50, class: 'medium' }
            : { level: 'Rendah', bar: 20, class: 'low' };

    const vessels = perDay >= 15 || duration >= 5
        ? { level: 'Tinggi', bar: 75, class: 'high' }
        : perDay >= 5
            ? { level: 'Sedang', bar: 45, class: 'medium' }
            : { level: 'Rendah', bar: 20, class: 'low' };

    const activity = exerciseFreq === 'jarang' || exerciseFreq === 'tidak_pernah' || perDay >= 15
        ? { level: 'Perlu diperhatikan', bar: 70, class: 'high' }
        : { level: 'Baik', bar: 30, class: 'low' };

    return { lung, heart, vessels, activity };
}

function showInfo(title, description) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = description;
    document.getElementById('infoModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('infoModal').style.display = 'none';
}

function renderRiskList(risks) {
    const labels = [
        { key: 'lung', title: '🫁 Paru-paru', info: 'Asap rokok merusak silia pada saluran napas dan meningkatkan risiko bronkitis kronis, emfisema, hingga kanker paru-paru.' },
        { key: 'heart', title: '❤️ Jantung', info: 'Nikotin mempercepat detak jantung dan meningkatkan tekanan darah, membebankan kerja otot jantung secara berlebih.' },
        { key: 'vessels', title: '🩸 Pembuluh Darah', info: 'Zat kimia dalam rokok merusak dinding arteri, memicu penumpukan plak (aterosklerosis) yang berisiko tinggi menyebabkan penyumbatan.' },
        { key: 'activity', title: '🏃 Aktivitas Fisik', info: 'Karbon monoksida mengikat hemoglobin darah, mengurangi suplai oksigen ke otot dan menurunkan daya tahan serta kapasitas paru saat berolahraga.' }
    ];

    const container = document.getElementById('riskList');
    if (!container) return;

    container.innerHTML = labels.map(item => {
        const risk = risks[item.key];
        return `
            <div class="risk-item" role="button" tabindex="0" onclick="showInfo('${item.title.replace(/['"]/g, '')}', '${item.info}')">
                <div style="display: flex; justify-content: space-between;">
                    <span>${item.title}</span>
                    <span>Indikator: <strong>${risk.level}</strong></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${risk.class}" style="width: ${risk.bar}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderResultPage() {
    const params = new URLSearchParams(window.location.search);
    const age = Number(params.get('age') || 0);
    const startAge = Number(params.get('start_age') || 0);
    const perDay = Number(params.get('cigarettes_per_day') || 0);
    const exerciseFreq = params.get('exercise_freq') || 'jarang';

    if (!age || !startAge || !perDay) {
        document.getElementById('summaryGrid').innerHTML = '<p>Data tidak tersedia. Silakan ulangi proses assessment.</p>';
        return;
    }

    const duration = age - startAge;
    const monthly = perDay * 30;
    const yearly = perDay * 365;
    const risks = calculateHealthRisks(duration, perDay, exerciseFreq);

    document.getElementById('summaryGrid').innerHTML = `
        <div><strong>Umur:</strong> ${age} tahun</div>
        <div><strong>Mulai:</strong> ${startAge} tahun</div>
        <div><strong>Lama Merokok:</strong> ${duration} tahun</div>
        <div><strong>Konsumsi:</strong> ${perDay} batang/hari</div>
    `;

    document.getElementById('monthlyEstimate').innerHTML = `<strong>Bulan:</strong> ~${monthly} batang`;
    document.getElementById('yearlyEstimate').innerHTML = `<strong>Tahun:</strong> ~${yearly} batang`;
    renderRiskList(risks);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assessmentForm');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const age = Number(document.getElementById('age').value);
            const startAge = Number(document.getElementById('start_age').value);
            const perDay = Number(document.getElementById('cigarettes_per_day').value);

            if (startAge > age) {
                alert('Umur mulai merokok tidak boleh lebih besar dari umur sekarang.');
                return;
            }

            if (perDay < 0 || age <= 0 || startAge <= 0) {
                alert('Masukkan jumlah angka yang valid.');
                return;
            }

            const params = new URLSearchParams({
                age,
                start_age: startAge,
                cigarettes_per_day: perDay,
                exercise_freq: 'jarang'
            });

            window.location.href = `result.html?${params.toString()}`;
        });
    }

    if (document.getElementById('riskList')) {
        renderResultPage();
    }
});
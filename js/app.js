document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calculatorForm');
  if (!form) return;

  const resultArea = document.getElementById('resultArea');
  const emptyState = document.getElementById('emptyState');
  const btnReset = document.getElementById('btnReset');
  const $ = (id) => document.getElementById(id);

  const swalBase = {
    confirmButtonColor: '#146C6C',
    cancelButtonColor: '#5B6773',
    confirmButtonText: 'Oke',
    customClass: { popup: 'swal-font' }
  };

  const notify = (opts) => {
    if (window.Swal) return Swal.fire({ ...swalBase, ...opts });
    window.alert(opts.text || opts.title);
    return Promise.resolve({ isConfirmed: true });
  };

  const getLevel = (score) => {
    if (score < 35) return { key: 'rendah', label: 'Rendah' };
    if (score < 65) return { key: 'sedang', label: 'Sedang' };
    if (score < 85) return { key: 'tinggi', label: 'Tinggi' };
    return { key: 'kritis', label: 'Sangat tinggi' };
  };

  const formatTime = (minutes) => {
    const days = minutes / 60 / 24;
    if (days >= 365) return `${(days / 365).toFixed(1).replace('.', ',')} tahun`;
    if (days >= 1) return `${Math.round(days)} hari`;
    return `${Math.round(minutes / 60)} jam`;
  };

  const formatRupiah = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  const setIndicator = (barId, textId, score) => {
    const level = getLevel(score);
    const bar = $(barId);
    bar.style.width = `${score}%`;
    const item = bar.closest('.indicator-item');
    item.dataset.level = level.key;
    $(textId).textContent = `${level.label}`;
  };

  const clearInvalid = () => form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));

  const fail = (inputId, text) => {
    clearInvalid();
    $(inputId).classList.add('invalid');
    notify({ icon: 'warning', title: 'Cek lagi Data Anda', text }).then(() => $(inputId).focus());
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentAge = parseInt($('currentAge').value, 10);
    const startAge = parseInt($('smokingStartAge').value, 10);
    const cigsPerDay = parseInt($('cigsPerDay').value, 10);
    const packPrice = parseInt($('packPrice').value, 10);
    const smokeType = $('smokeType').value;

    if (isNaN(currentAge)) return fail('currentAge', 'Umur sekarang belum diisi.');
    if (currentAge < 10 || currentAge > 100) return fail('currentAge', 'Umur harus antara 10 sampai seterusnya.');
    if (isNaN(startAge)) return fail('smokingStartAge', 'Umur mulai merokok belum diisi.');
    if (startAge < 5) return fail('smokingStartAge', 'Umur mulai merokok minimal 5 tahun.');
    if (startAge >= currentAge) return fail('smokingStartAge', 'Umur mulai merokok harus lebih kecil dari umur sekarang.');
    if (isNaN(cigsPerDay) || cigsPerDay < 1) return fail('cigsPerDay', 'Jumlah batang per hari minimal 1.');
    if (cigsPerDay > 120) return fail('cigsPerDay', 'Jumlah batang per hari terlalu banyak. Maksimal 120.');
    if (!isNaN(packPrice) && packPrice < 0) return fail('packPrice', 'Harga tidak boleh minus.');

    clearInvalid();

    const years = currentAge - startAge;
    const totalCigs = years * 365 * cigsPerDay;
    const minutesLost = totalCigs * 11;

    const base = years * 2.5 + cigsPerDay * 2;
    const lungRaw = smokeType === 'konvensional' ? base * 1.15 : base * 0.95;
    const clamp = (v) => Math.min(Math.max(Math.round(v), 15), 98);
    // Indikator organ tambahan memakai indeks paparan yang sama sebagai gambaran edukasi,
    // bukan model risiko klinis atau skor medis tervalidasi.
    const scores = {
      lung: clamp(lungRaw),
      heart: clamp(base * 1.05),
      brain: clamp(base * 1.0),
      mouth: clamp(base * 1.05),
      vessel: clamp(base * 1.1),
      eye: clamp(base * 0.8),
      bone: clamp(base * 0.75),
      kidney: clamp(base * 0.85)
    };

    $('statCigs').textContent = totalCigs.toLocaleString('id-ID');
    $('statMoney').textContent = !isNaN(packPrice) && packPrice > 0 ? formatRupiah((totalCigs / 16) * packPrice) : 'Tidak diisi';
    $('timeLostValue').textContent = formatTime(minutesLost);
    Object.entries(scores).forEach(([organ, score]) => {
      setIndicator(`${organ}ProgressBar`, `${organ}RiskText`, score);
    });

    $('healthInsight').textContent = smokeType === 'konvensional'
      ? `Kamu sudah merokok ${years} tahun. Tar dan karbon monoksida dari pembakaran merusak silia di paru-paru dan membuat pembuluh darah lebih kaku.`
      : `Kamu sudah memakai rokok elektrik ${years} tahun. Memang tidak ada tar dari pembakaran, tapi nikotinnya tetap menyempitkan pembuluh darah dan uapnya bisa mengiritasi saluran napas.`;

    const worst = Math.max(...Object.values(scores));
    $('healthAdvice').textContent = worst >= 65
      ? 'Indikator paparanmu cukup tinggi. Pertimbangkan berkonsultasi dengan tenaga kesehatan, terutama jika ada keluhan. Berhenti merokok tetap memberi manfaat.'
      : 'Angka ini hanya gambaran edukasi dari pola paparan, bukan diagnosis atau prediksi kondisi tiap organ. Kondisi kesehatan hanya dapat dinilai oleh tenaga kesehatan.';

    emptyState.hidden = true;
    resultArea.hidden = false;
    if (window.innerWidth < 900) resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    notify({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Hasil sudah dihitung',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true
    });
  });

  btnReset.addEventListener('click', () => {
    const doReset = () => {
      form.reset();
      clearInvalid();
      resultArea.hidden = true;
      emptyState.hidden = false;
      $('lungProgressBar').style.width = '0%';
      $('heartProgressBar').style.width = '0%';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      $('currentAge').focus({ preventScroll: true });
    };

    if (!window.Swal) return doReset();

    Swal.fire({
      ...swalBase,
      icon: 'question',
      title: 'Hitung ulang?',
      text: 'Isian dan hasil yang sekarang akan dihapus.',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    }).then((res) => { if (res.isConfirmed) doReset(); });
  });
});

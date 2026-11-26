// ===== 1. MENGAMBIL ELEMEN (getElementById & querySelector) =====
const inputNama = document.getElementById("inputNama");
const inputRincian = document.getElementById("inputRincian");
const pilihKategori = document.getElementById("pilihKategori");
const inputDeadline = document.getElementById("inputDeadline");
const tombolTambah = document.getElementById("tombolTambah");
const pesanError = document.querySelector("#pesanError");

// ===== 2. DATA TUGAS & LOCALSTORAGE =====
// Setiap tugas: { id, nama, rincian, kategori, deadline, dibuat, progress }
const KUNCI_PENYIMPANAN = "todoListDataV2";
let dataTugas = [];

function simpanData() {
  localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(dataTugas));
}

function muatData() {
  const tersimpan = localStorage.getItem(KUNCI_PENYIMPANAN);
  if (tersimpan) {
    dataTugas = JSON.parse(tersimpan);
  }
}

// ===== 3. FUNGSI BANTU: TANGGAL & DEADLINE =====
// Mengubah "2026-11-25" menjadi "25 November 2026"
function formatTanggal(teksTanggal) {
  const tanggal = new Date(teksTanggal + "T00:00:00");
  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// Waktu saat tugas dibuat, contoh: "21 November 2026 pukul 13.45"
function ambilWaktu() {
  return new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Menghitung selisih hari antara hari ini dan deadline (negatif = sudah lewat)
function hitungSisaHari(deadline) {
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0); // jam diabaikan, hanya tanggal
  const tanggalDeadline = new Date(deadline + "T00:00:00");
  return Math.round((tanggalDeadline - hariIni) / 86400000); // 86400000 ms = 1 hari
}

// Menentukan teks dan warna lencana status deadline
function statusDeadline(tugas) {
  if (tugas.progress === 100) {
    return { teks: "Selesai", kelas: "selesai" };
  }
  const sisa = hitungSisaHari(tugas.deadline);
  if (sisa < 0) {
    return { teks: "Terlambat " + Math.abs(sisa) + " hari", kelas: "terlambat" };
  }
  if (sisa === 0) {
    return { teks: "Deadline hari ini", kelas: "dekat" };
  }
  if (sisa <= 2) {
    return { teks: sisa + " hari lagi", kelas: "dekat" };
  }
  return { teks: sisa + " hari lagi", kelas: "aman" };
}

// Fungsi bantu singkat untuk membuat elemen + class + teks
function buatElemen(tag, namaClass, teks) {
  const elemen = document.createElement(tag);
  if (namaClass) elemen.className = namaClass;
  if (teks) elemen.textContent = teks;
  return elemen;
}

// ===== 4. MEMPERBARUI RINGKASAN (progress keseluruhan & statistik) =====
function perbaruiRingkasan() {
  let jumlahProgress = 0;
  let selesai = 0;
  let berjalan = 0;
  let terlambat = 0;

  dataTugas.forEach(function (tugas) {
    jumlahProgress += tugas.progress;
    if (tugas.progress === 100) {
      selesai++;
    } else {
      if (tugas.progress > 0) berjalan++;
      if (hitungSisaHari(tugas.deadline) < 0) terlambat++;
    }
  });

  const total = dataTugas.length;
  // Progress keseluruhan = rata-rata progress semua tugas
  const rata = total === 0 ? 0 : Math.round(jumlahProgress / total);

  document.getElementById("persenTotal").textContent = rata + "%";
  document.getElementById("barTotal").style.width = rata + "%";
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statBerjalan").textContent = berjalan;
  document.getElementById("statSelesai").textContent = selesai;
  document.getElementById("statTerlambat").textContent = terlambat;
}

// ===== 5. MENAMPILKAN SATU TUGAS (createElement & appendChild) =====
function tampilkanTugas(tugas) {
  const daftarTujuan = document.getElementById("daftar-" + tugas.kategori);

  const li = buatElemen("li", "kartu-tugas");

  // Baris atas: nama tugas dan tombol hapus
  const kepala = buatElemen("div", "kepala-kartu");
  const nama = buatElemen("h3", "nama-tugas", tugas.nama);
  const tombolHapus = buatElemen("button", "tombol-hapus", "Hapus");
  kepala.appendChild(nama);
  kepala.appendChild(tombolHapus);
  li.appendChild(kepala);

  // Rincian tugas (hanya dibuat jika diisi)
  if (tugas.rincian !== "") {
    li.appendChild(buatElemen("p", "rincian", tugas.rincian));
  }

  // Info: lencana status, deadline, waktu dibuat
  const info = buatElemen("div", "info-tugas");
  const lencana = buatElemen("span", "lencana");
  info.appendChild(lencana);
  info.appendChild(buatElemen("span", "", "Deadline: " + formatTanggal(tugas.deadline)));
  info.appendChild(buatElemen("span", "", "Dibuat: " + tugas.dibuat));
  li.appendChild(info);

  // Baris progress: bar, slider, dan angka persen
  const barisProgres = buatElemen("div", "baris-progres");
  const bar = buatElemen("div", "bar");
  const barIsi = buatElemen("div", "bar-isi");
  bar.appendChild(barIsi);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = 100;
  slider.step = 5;
  slider.value = tugas.progress;

  const persen = buatElemen("span", "persen");

  barisProgres.appendChild(bar);
  barisProgres.appendChild(slider);
  barisProgres.appendChild(persen);
  li.appendChild(barisProgres);

  // Fungsi untuk menyegarkan tampilan kartu sesuai data progress
  function perbaruiKartu() {
    barIsi.style.width = tugas.progress + "%";
    persen.textContent = tugas.progress + "%";

    const status = statusDeadline(tugas);
    lencana.textContent = status.teks;
    lencana.className = "lencana " + status.kelas;

    // classList.toggle(nama, kondisi): pasang class jika kondisi true, lepas jika false
    li.classList.toggle("selesai", tugas.progress === 100);
    li.classList.toggle("terlambat", status.kelas === "terlambat");
  }

  // ===== 6. MENGUBAH PROGRESS (event "input" pada slider) =====
  slider.addEventListener("input", function () {
    tugas.progress = Number(slider.value); // ubah data
    perbaruiKartu();                       // ubah tampilan kartu
    simpanData();
    perbaruiRingkasan();
  });

  // ===== 7. MENGHAPUS TUGAS (remove) =====
  tombolHapus.addEventListener("click", function () {
    li.remove(); // hapus dari tampilan
    dataTugas = dataTugas.filter(function (item) {
      return item.id !== tugas.id; // simpan semua kecuali tugas ini
    });
    simpanData();
    perbaruiRingkasan();
  });

  perbaruiKartu();               // tampilan awal kartu
  daftarTujuan.appendChild(li);  // pasang ke halaman
}

// ===== 8. MENAMBAH TUGAS BARU =====
function tambahTugas() {
  const nama = inputNama.value.trim();
  const rincian = inputRincian.value.trim();
  const deadline = inputDeadline.value; // format "yyyy-mm-dd"

  // Validasi input
  if (nama === "") {
    pesanError.textContent = "Nama tugas wajib diisi.";
    inputNama.focus();
    return;
  }
  if (deadline === "") {
    pesanError.textContent = "Deadline wajib dipilih.";
    inputDeadline.focus();
    return;
  }
  pesanError.textContent = "";

  const tugasBaru = {
    id: Date.now(),
    nama: nama,
    rincian: rincian,
    kategori: pilihKategori.value,
    deadline: deadline,
    dibuat: ambilWaktu(),
    progress: 0
  };

  dataTugas.push(tugasBaru);
  simpanData();
  tampilkanTugas(tugasBaru);
  perbaruiRingkasan();

  // Kosongkan form
  inputNama.value = "";
  inputRincian.value = "";
  inputDeadline.value = "";
  inputNama.focus();
}

// ===== 9. EVENT LISTENER =====
tombolTambah.addEventListener("click", tambahTugas);

// Tekan Enter di kolom nama juga menambah tugas
inputNama.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    tambahTugas();
  }
});

// ===== 10. SAAT HALAMAN DIBUKA =====
// Tampilkan tanggal hari ini di bagian atas
document.getElementById("tanggalHariIni").textContent =
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

muatData();
dataTugas.forEach(tampilkanTugas);
perbaruiRingkasan();
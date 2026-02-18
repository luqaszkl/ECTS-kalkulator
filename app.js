const FORM = document.querySelector("form");
const SREDNIA_EL = document.querySelector("#srednia");
const SUMA_EL = document.querySelector("#suma-ects");
const LICZBA_EL = document.querySelector("#liczba-przedmiotow");
const LISTA_EL = document.querySelector("#przedmioty-lista");
const SEMESTR_INPUT = document.querySelector("#semestr");
const SEMESTR_DISPLAY = document.querySelector("#semestr-display");
const BTN_WYCZYSC = document.querySelector("#btn-wyczysc");
const BTN_MOTYW = document.querySelector("#btn-motyw");
const WYKRES_EL = document.querySelector("#wykres-ocen");

let aktywnySemestr = localStorage.getItem("semestr") || "";
let przedmioty = JSON.parse(localStorage.getItem("przedmioty")) || [];
let motyw = localStorage.getItem("motyw") || "noc";

function ustawMotyw(nowy) {
  motyw = nowy;
  document.documentElement.setAttribute("data-motyw", motyw);
  BTN_MOTYW.textContent = motyw === "noc" ? "☀️" : "🌙";
  localStorage.setItem("motyw", motyw);
}

BTN_MOTYW.addEventListener("click", () => ustawMotyw(motyw === "noc" ? "dzien" : "noc"));
ustawMotyw(motyw);

if (aktywnySemestr) {
  SEMESTR_INPUT.value = aktywnySemestr;
  SEMESTR_DISPLAY.textContent = `sem. ${aktywnySemestr}`;
}

SEMESTR_INPUT.addEventListener("change", () => {
  aktywnySemestr = SEMESTR_INPUT.value;
  localStorage.setItem("semestr", aktywnySemestr);
  SEMESTR_DISPLAY.textContent = aktywnySemestr ? `sem. ${aktywnySemestr}` : "";
});

function zapiszDane() {
  localStorage.setItem("przedmioty", JSON.stringify(przedmioty));
}

function klasaOceny(ocena) {
  return `ocena-${ocena.toFixed(1).replace(".", "-")}`;
}

function grupujPoSemestrze() {
  const grupy = {};
  przedmioty.forEach((p) => {
    const klucz = p.semestr || "brak";
    if (!grupy[klucz]) grupy[klucz] = [];
    grupy[klucz].push(p);
  });
  return grupy;
}

function renderujWykres() {
  WYKRES_EL.innerHTML = "";
  const oceny = [2.0, 3.0, 3.5, 4.0, 4.5, 5.0];
  const liczniki = {};
  oceny.forEach((o) => (liczniki[o] = 0));
  przedmioty.forEach((p) => liczniki[p.ocena]++);
  const max = Math.max(...Object.values(liczniki), 1);

  oceny.forEach((ocena) => {
    const count = liczniki[ocena];
    const procent = (count / max) * 100;

    const kolumna = document.createElement("div");
    kolumna.className = "wykres-kolumna";

    const liczbaEl = document.createElement("span");
    liczbaEl.className = "wykres-liczba";
    liczbaEl.textContent = count > 0 ? count : "";

    const slupek = document.createElement("div");
    slupek.className = `wykres-slupek ${klasaOceny(ocena)}`;
    slupek.style.height = `${Math.max(procent, count > 0 ? 8 : 0)}%`;

    const etykieta = document.createElement("span");
    etykieta.className = "wykres-etykieta";
    etykieta.textContent = ocena;

    kolumna.appendChild(liczbaEl);
    kolumna.appendChild(slupek);
    kolumna.appendChild(etykieta);
    WYKRES_EL.appendChild(kolumna);
  });
}

function aktualizujPodsumowanie() {
  LICZBA_EL.textContent = przedmioty.length;

  if (przedmioty.length === 0) {
    SUMA_EL.textContent = "0";
    SREDNIA_EL.textContent = "—";
    SREDNIA_EL.className = "";
    BTN_WYCZYSC.style.display = "none";
    renderujWykres();
    return;
  }

  BTN_WYCZYSC.style.display = "block";
  const sumaEcts = przedmioty.reduce((acc, p) => acc + p.ects, 0);
  const sumaWazona = przedmioty.reduce((acc, p) => acc + p.ocena * p.ects, 0);
  const srednia = sumaWazona / sumaEcts;

  SUMA_EL.textContent = sumaEcts;
  SREDNIA_EL.textContent = srednia.toFixed(2);
  SREDNIA_EL.className = klasaOceny(Math.round(srednia * 2) / 2);
  renderujWykres();
}

function stworzElementListy(przedmiot) {
  const LI = document.createElement("li");
  const klasa = klasaOceny(przedmiot.ocena);
  LI.classList.add(klasa, "przedmiot-item");

  LI.innerHTML = `
    <div class="li-info">
      <span class="li-nazwa">${przedmiot.nazwa}</span>
      <div class="li-meta">
        <span class="li-ocena ${klasa}">${przedmiot.ocena}</span>
        <span class="li-ects">${przedmiot.ects} ECTS</span>
      </div>
    </div>
    <button class="btn-usun" aria-label="usuń ${przedmiot.nazwa}">✕</button>
  `;

  LI.querySelector(".btn-usun").addEventListener("click", () => {
    przedmioty.splice(przedmioty.findIndex((p) => p.id === przedmiot.id), 1);
    zapiszDane();
    renderujListe();
    aktualizujPodsumowanie();
  });

  return LI;
}

function renderujListe() {
  LISTA_EL.innerHTML = "";
  if (przedmioty.length === 0) return;

  const grupy = grupujPoSemestrze();
  const klucze = Object.keys(grupy).sort((a, b) => {
    if (a === "brak") return 1;
    if (b === "brak") return -1;
    return Number(a) - Number(b);
  });

  klucze.forEach((semestr) => {
    const header = document.createElement("li");
    header.className = "semestr-header";
    header.textContent = semestr === "brak" ? "Bez semestru" : `Semestr ${semestr}`;
    LISTA_EL.appendChild(header);
    grupy[semestr].forEach((p) => LISTA_EL.appendChild(stworzElementListy(p)));
  });
}

BTN_WYCZYSC.addEventListener("click", () => {
  if (!confirm("Usunąć wszystkie przedmioty?")) return;
  przedmioty = [];
  zapiszDane();
  renderujListe();
  aktualizujPodsumowanie();
});

FORM.addEventListener("submit", (e) => {
  e.preventDefault();
  const nazwa = document.querySelector("#przedmiot").value.trim();
  const ocena = parseFloat(document.querySelector("#ocena").value);
  const ects = parseFloat(document.querySelector("#ects").value);

  if (ects <= 0) {
    alert("Liczba ECTS musi być większa od 0!");
    return;
  }

  przedmioty.push({ id: Date.now(), nazwa, ocena, ects, semestr: aktywnySemestr || null });
  zapiszDane();
  FORM.reset();
  renderujListe();
  aktualizujPodsumowanie();
});

renderujListe();
aktualizujPodsumowanie();
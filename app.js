if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

const znajdzElement = (selektor) => document.querySelector(selektor);

const elementy = {
  formularz: znajdzElement("#formularz"),
  poleNazwy: znajdzElement("#f-nazwa"),
  poleOceny: znajdzElement("#f-ocena"),
  poleEcts: znajdzElement("#f-ects"),
  poleSemestru: znajdzElement("#f-sem"),
  podgladFormularza: znajdzElement("#podglad-formularza"),
  listaPrzedmiotow: znajdzElement("#lista-przedmiotow"),
  komunikatPusty: znajdzElement("#pusty"),
  znaczekLiczby: znajdzElement("#znaczek-liczby"),
  przyciskWyczyszczenia: znajdzElement("#btn-wyczysc"),
  owijkaFiltrow: znajdzElement("#filtry-owijka"),
  filtry: znajdzElement("#filtry"),
  statystykaSredniej: znajdzElement("#stat-srednia"),
  statystykaEcts: znajdzElement("#stat-ects"),
  statystykaLiczby: znajdzElement("#stat-liczba"),
  statystykaDokladna: znajdzElement("#stat-dokladna"),
  checkboxDokladna: znajdzElement("#checkbox-dokladna"),
  wykres: znajdzElement("#wykres"),
  chipySemestrow: znajdzElement("#chipy-semestrow"),
  wejsciaCoJesli: znajdzElement("#co-jesli-wejscia"),
  przyciskDodajCoJesli: znajdzElement("#co-jesli-dodaj"),
  wynikCoJesli: znajdzElement("#co-jesli-wynik"),
  terazCoJesli: znajdzElement("#co-jesli-teraz"),
  potemCoJesli: znajdzElement("#co-jesli-potem"),
  roznicaCoJesli: znajdzElement("#co-jesli-roznica"),
  pustyCoJesli: znajdzElement("#co-jesli-pusty"),
  progStypendium: znajdzElement("#stypendium-prog"),
  osobyStypendium: znajdzElement("#stypendium-osoby"),
  procentStypendium: znajdzElement("#stypendium-proc"),
  wynikStypendium: znajdzElement("#stypendium-wynik"),
  pustyStypendium: znajdzElement("#stypendium-pusty"),
  wypelnienieStypendium: znajdzElement("#stypendium-wypelnienie"),
  markerStypendium: znajdzElement("#stypendium-marker"),
  tyStypendium: znajdzElement("#stypendium-ty"),
  twojaStypendium: znajdzElement("#stypendium-twoja"),
  progWartoscStypendium: znajdzElement("#stypendium-prog-wartosc"),
  roznicaStypendium: znajdzElement("#stypendium-roznica"),
  miejsceStypendium: znajdzElement("#stypendium-miejsce"),
  przedStypendium: znajdzElement("#stypendium-przed"),
  komunikatStypendium: znajdzElement("#stypendium-komunikat"),
  bohater: znajdzElement("#hero"),
  przyciskPokazInfo: znajdzElement("#btn-pokaz-info"),
  celWejscie: znajdzElement("#cel-wejscie"),
  celInfo: znajdzElement("#cel-info"),
  celPasek: znajdzElement("#cel-pasek"),
  celWypelnienie: znajdzElement("#cel-wypelnienie"),
  celEtykiety: znajdzElement("#cel-etykiety"),
  celEtykietaPrawa: znajdzElement("#cel-etykieta-prawa"),
  kontenerPowiadomien: znajdzElement("#kontener-powiadomien"),
  konfettiCanvas: znajdzElement("#konfetti-canvas"),
  modalEdycji: znajdzElement("#modal-edycji"),
  modalNazwa: znajdzElement("#e-nazwa"),
  modalOcena: znajdzElement("#e-ocena"),
  modalEcts: znajdzElement("#e-ects"),
  modalSemestr: znajdzElement("#e-sem"),
  modalZapisz: znajdzElement("#modal-zapisz"),
  modalAnuluj: znajdzElement("#modal-anuluj"),
};

const DOSTEPNE_OCENY = [2, 3, 3.5, 4, 4.5, 5];
const KLASY_OCEN = Object.freeze({
  2: "g2",
  3: "g3",
  3.5: "g35",
  4: "g4",
  4.5: "g45",
  5: "g5",
});

const KLUCZ_DANYCH = "ectscalc";
const KLUCZ_BOHATERA = "ectscalc_hero";
const KLUCZ_SEMESTRU = "ectscalc_sem";
const KLUCZ_CELU = "ectscalc_cel";

let przedmioty = JSON.parse(localStorage.getItem(KLUCZ_DANYCH)) || [];
let bohaterWidoczny = localStorage.getItem(KLUCZ_BOHATERA) !== "0";
let trybDokladny = false;
let aktywneFiltery = new Set();
let wierszeCoJesli = [{ ocena: 4.5, ects: 5 }];
let ostatnioUsuniety = null;
let celOsiagniety = false;
let trybInicjalizacji = true;
let edytowanyId = null;


document.addEventListener("keydown", (zdarzenie) => {
  if (zdarzenie.key === "Escape") {
    if (!elementy.modalEdycji.classList.contains("ukryty")) {
      zamknijModal();
      return;
    }
    elementy.poleNazwy.value = "";
    elementy.poleOceny.value = "";
    elementy.poleEcts.value = "";
    elementy.podgladFormularza.classList.add("ukryty");
    elementy.poleNazwy.blur();
  }
  if ((zdarzenie.ctrlKey || zdarzenie.metaKey) && zdarzenie.key === "z")
    cofnijUsuniecie();
});

const animowaneLiczniki = new Map();

function animujLiczbe(element, nowaWartosc, miejsca = 2, czas = 420) {
  const stara = parseFloat(element.textContent) || 0;
  const nowa = parseFloat(nowaWartosc);
  if (isNaN(nowa)) {
    element.textContent = nowaWartosc;
    return;
  }
  if (Math.abs(nowa - stara) < 0.001) {
    element.textContent = nowa.toFixed(miejsca);
    return;
  }

  if (animowaneLiczniki.has(element))
    cancelAnimationFrame(animowaneLiczniki.get(element));

  const poczatek = performance.now();
  const krok = (teraz) => {
    const postep = Math.min((teraz - poczatek) / czas, 1);
    const wygladanie = 1 - Math.pow(1 - postep, 3);
    element.textContent = (stara + (nowa - stara) * wygladanie).toFixed(
      miejsca,
    );
    if (postep < 1) animowaneLiczniki.set(element, requestAnimationFrame(krok));
    else {
      element.textContent = nowa.toFixed(miejsca);
      animowaneLiczniki.delete(element);
    }
  };
  animowaneLiczniki.set(element, requestAnimationFrame(krok));
}

let konfettiAktywne = false;

function uruchomKonfetti() {
  if (konfettiAktywne) return;
  konfettiAktywne = true;
  const canvas = elementy.konfettiCanvas;
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const kolory = [
    "#00e5a0",
    "#06b6d4",
    "#f59e0b",
    "#e5484d",
    "#7cc443",
    "#38bdf8",
  ];

  const czastki = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    promien: Math.random() * 6 + 3,
    kolor: kolory[Math.floor(Math.random() * kolory.length)],
    predkoscX: (Math.random() - 0.5) * 3,
    predkoscY: Math.random() * 3 + 2,
    kat: Math.random() * 360,
    obrot: (Math.random() - 0.5) * 8,
    przezroczystosc: 1,
  }));

  const rysuj = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let zywe = 0;
    czastki.forEach((czastka) => {
      czastka.x += czastka.predkoscX;
      czastka.y += czastka.predkoscY;
      czastka.predkoscY += 0.08;
      czastka.kat += czastka.obrot;
      if (czastka.y > canvas.height * 0.7) czastka.przezroczystosc -= 0.02;
      if (czastka.przezroczystosc <= 0) return;
      zywe++;
      ctx.save();
      ctx.globalAlpha = Math.max(0, czastka.przezroczystosc);
      ctx.fillStyle = czastka.kolor;
      ctx.translate(czastka.x, czastka.y);
      ctx.rotate((czastka.kat * Math.PI) / 180);
      ctx.fillRect(
        -czastka.promien / 2,
        -czastka.promien / 2,
        czastka.promien,
        czastka.promien * 0.5,
      );
      ctx.restore();
    });
    if (zywe > 0) requestAnimationFrame(rysuj);
    else {
      canvas.style.display = "none";
      konfettiAktywne = false;
    }
  };
  rysuj();
}

function klasaOceny(ocena) {
  return KLASY_OCEN[ocena] ?? "";
}

function zaokraglOcene(srednia) {
  return Math.round(srednia * 2) / 2;
}

function zapiszDane() {
  localStorage.setItem(KLUCZ_DANYCH, JSON.stringify(przedmioty));
}

function obliczSredniaWazona(lista) {
  if (!lista.length) return null;
  const sumaEcts = lista.reduce((suma, przedmiot) => suma + przedmiot.ects, 0);
  if (!sumaEcts) return null;
  return (
    lista.reduce(
      (suma, przedmiot) => suma + przedmiot.ocena * przedmiot.ects,
      0,
    ) / sumaEcts
  );
}

function grupujPoSemestrach() {
  return przedmioty.reduce((grupy, przedmiot) => {
    const klucz = przedmiot.semestr || "brak";
    if (!grupy[klucz]) grupy[klucz] = [];
    grupy[klucz].push(przedmiot);
    return grupy;
  }, {});
}

function sortujKlucze(klucze) {
  return [...klucze].sort((klucz1, klucz2) => {
    if (klucz1 === "brak") return 1;
    if (klucz2 === "brak") return -1;
    return +klucz1 - +klucz2;
  });
}

function pokazPowiadomienie(tekst, rodzaj = "ok", akcja = null) {
  const element = document.createElement("div");
  element.className = `powiadomienie ${rodzaj}`;
  const span = document.createElement("span");
  span.textContent = tekst;
  element.appendChild(span);

  if (akcja) {
    const przycisk = document.createElement("button");
    przycisk.className = "powiadomienie-akcja";
    przycisk.textContent = akcja.etykieta;
    przycisk.addEventListener("click", () => {
      akcja.fn();
      element.classList.add("znikanie");
      setTimeout(() => element.remove(), 250);
    });
    element.appendChild(przycisk);
  }

  elementy.kontenerPowiadomien.appendChild(element);
  setTimeout(
    () => {
      element.classList.add("znikanie");
      setTimeout(() => element.remove(), 250);
    },
    akcja ? 4500 : 2400,
  );
}

function cofnijUsuniecie() {
  if (!ostatnioUsuniety) return;
  przedmioty.splice(ostatnioUsuniety.indeks, 0, ostatnioUsuniety.przedmiot);
  zapiszDane();
  renderujWszystko();
  ostatnioUsuniety = null;
  pokazPowiadomienie("Przywrócono przedmiot");
}

function ustawBohatera(widoczny) {
  bohaterWidoczny = widoczny;
  elementy.bohater.classList.toggle("ukryty", !widoczny);
  elementy.przyciskPokazInfo.classList.toggle("aktywny", widoczny);
  elementy.przyciskPokazInfo.title = widoczny ? "Zamknij" : "Jak to działa?";
  localStorage.setItem(KLUCZ_BOHATERA, widoczny ? "1" : "0");
}

function odswiezStatystyki() {
  const liczba = przedmioty.length;
  elementy.statystykaLiczby.textContent = liczba;
  elementy.komunikatPusty.style.display = liczba ? "none" : "flex";
  elementy.przyciskWyczyszczenia.classList.toggle("ukryty", !liczba);
  elementy.znaczekLiczby.classList.toggle("ukryty", !liczba);
  if (liczba) elementy.znaczekLiczby.textContent = liczba;

  if (!liczba) {
    elementy.statystykaSredniej.textContent = "-";
    elementy.statystykaSredniej.className = "statystyka-glowna";
    elementy.statystykaEcts.textContent = "0";
    elementy.statystykaDokladna.classList.add("ukryty");
    ukryjCel();
    celOsiagniety = false;
    return;
  }

  const sumaEcts = przedmioty.reduce(
    (suma, przedmiot) => suma + przedmiot.ects,
    0,
  );
  const srednia =
    przedmioty.reduce(
      (suma, przedmiot) => suma + przedmiot.ocena * przedmiot.ects,
      0,
    ) / sumaEcts;

  animujLiczbe(elementy.statystykaSredniej, srednia.toFixed(2), 2);
  animujLiczbe(elementy.statystykaEcts, sumaEcts, 0);
  elementy.statystykaSredniej.className =
    "statystyka-glowna " + klasaOceny(zaokraglOcene(srednia));

  if (trybDokladny) {
    elementy.statystykaDokladna.textContent = "= " + srednia.toFixed(8);
    elementy.statystykaDokladna.classList.remove("ukryty");
  } else {
    elementy.statystykaDokladna.classList.add("ukryty");
  }

  obliczCelSredniej(srednia, sumaEcts, true);
}

function ukryjCel() {
  elementy.celInfo.classList.add("ukryty");
  elementy.celPasek.classList.add("ukryty");
  elementy.celEtykiety.classList.add("ukryty");
}

function obliczCelSredniej(srednia, sumaEcts, pozwolKonfetti = false) {
  if (srednia === undefined) {
    if (!przedmioty.length) {
      ukryjCel();
      return;
    }
    sumaEcts = przedmioty.reduce((suma, przedmiot) => suma + przedmiot.ects, 0);
    srednia =
      przedmioty.reduce(
        (suma, przedmiot) => suma + przedmiot.ocena * przedmiot.ects,
        0,
      ) / sumaEcts;
  }
  const cel = parseFloat(elementy.celWejscie.value);
  if (!cel || cel < 2 || cel > 5) {
    ukryjCel();
    return;
  }

  const roznica = srednia - cel;
  elementy.celInfo.classList.remove("ukryty");
  elementy.celPasek.classList.remove("ukryty");
  elementy.celEtykiety.classList.remove("ukryty");

  if (srednia >= cel) {
    elementy.celInfo.innerHTML = `<strong>Cel osiągnięty!</strong> Zapas: ${roznica.toFixed(3)} pkt powyżej ${cel.toFixed(2)}.`;
    elementy.celWypelnienie.style.width = "100%";
    elementy.celWypelnienie.className = "cel-wypelnienie ok";
    if (!celOsiagniety && pozwolKonfetti && !trybInicjalizacji) {
      celOsiagniety = true;
      uruchomKonfetti();
    } else if (!celOsiagniety) {
      celOsiagniety = true;
    }
  } else {
    celOsiagniety = false;
    const sumaWazonych = przedmioty.reduce(
      (suma, przedmiot) => suma + przedmiot.ocena * przedmiot.ects,
      0,
    );
    const potrzebaEcts = Math.max(
      0,
      (cel * sumaEcts - sumaWazonych) / (5 - cel),
    );
    elementy.celInfo.innerHTML = `Brakuje <strong>${Math.abs(roznica).toFixed(3)} pkt</strong>. Potrzebujesz ok. <strong>${potrzebaEcts.toFixed(1)} ECTS</strong> z oceną 5.0.`;
    const zakres = cel - 2.0;
    const postep = zakres > 0 ? Math.max(0, (srednia - 2.0) / zakres) : 0;
    const procent = Math.min(postep * 100, 99);
    elementy.celWypelnienie.style.width = procent + "%";
    elementy.celWypelnienie.className =
      procent >= 70 ? "cel-wypelnienie ostrzezenie" : "cel-wypelnienie nie";
  }
  elementy.celEtykietaPrawa.textContent = cel.toFixed(2);
}

function renderujWykres() {
  elementy.wykres.innerHTML = "";
  const licznik = Object.fromEntries(DOSTEPNE_OCENY.map((ocena) => [ocena, 0]));
  przedmioty.forEach((przedmiot) => licznik[przedmiot.ocena]++);
  const maksimum = Math.max(...Object.values(licznik), 1);
  DOSTEPNE_OCENY.forEach((ocena) => {
    const liczba = licznik[ocena];
    const procent = (liczba / maksimum) * 100;
    const kolumna = document.createElement("div");
    kolumna.className = "wykres-kolumna";
    kolumna.innerHTML = `
      <span class="wykres-liczba">${liczba || ""}</span>
      <div class="wykres-slupek ${KLASY_OCEN[ocena]}" style="height:${Math.max(procent, liczba ? 8 : 0)}%" title="${ocena}: ${liczba}"></div>
      <span class="wykres-podpis">${ocena}</span>`;
    elementy.wykres.appendChild(kolumna);
  });
}

function renderujChipySemestrow() {
  elementy.chipySemestrow.innerHTML = "";
  const grupy = grupujPoSemestrach();
  const klucze = sortujKlucze(Object.keys(grupy));
  if (klucze.length <= 1 && klucze[0] === "brak") return;
  klucze.forEach((semestr) => {
    const srednia = obliczSredniaWazona(grupy[semestr]);
    if (!srednia) return;
    const sumaEcts = grupy[semestr].reduce(
      (suma, przedmiot) => suma + przedmiot.ects,
      0,
    );
    const chip = document.createElement("div");
    chip.className = "chip-semestru";
    chip.innerHTML = `
      <span class="chip-etykieta">${semestr === "brak" ? "bez semestru" : "semestr " + semestr}</span>
      <span class="chip-wartosc ${klasaOceny(zaokraglOcene(srednia))}">${srednia.toFixed(2)}</span>
      <span class="chip-pod">${sumaEcts} ECTS &middot; ${grupy[semestr].length} przedm.</span>`;
    elementy.chipySemestrow.appendChild(chip);
  });
}

function renderujFiltry() {
  elementy.filtry.innerHTML = "";
  const grupy = grupujPoSemestrach();
  const klucze = sortujKlucze(Object.keys(grupy));
  if (klucze.length <= 1) {
    elementy.owijkaFiltrow.classList.add("ukryty");
    return;
  }
  elementy.owijkaFiltrow.classList.remove("ukryty");

  const tworzPrzyciskFiltru = (etykieta, wartosc) => {
    const czyWszystkie = wartosc === "wszystkie";
    const czyAktywny = czyWszystkie
      ? aktywneFiltery.size === 0
      : aktywneFiltery.has(wartosc);
    const przycisk = document.createElement("button");
    przycisk.type = "button";
    przycisk.className = "filtr" + (czyAktywny ? " aktywny" : "");
    przycisk.textContent = etykieta;
    przycisk.addEventListener("click", () => {
      if (czyWszystkie) aktywneFiltery.clear();
      else
        aktywneFiltery.has(wartosc)
          ? aktywneFiltery.delete(wartosc)
          : aktywneFiltery.add(wartosc);
      renderujFiltry();
      renderujListe();
    });
    return przycisk;
  };

  elementy.filtry.appendChild(tworzPrzyciskFiltru("Wszystkie", "wszystkie"));
  klucze.forEach((klucz) =>
    elementy.filtry.appendChild(
      tworzPrzyciskFiltru(
        klucz === "brak" ? "bez sem." : "sem. " + klucz,
        klucz,
      ),
    ),
  );
}

function dodajSwipe(element, przedmiot) {
  let startX = 0;
  let startY = 0;
  const PROG_PRZESUNIECIA = 72;

  element.addEventListener(
    "touchstart",
    (zdarzenie) => {
      if (zdarzenie.touches.length !== 1) return;
      startX = zdarzenie.touches[0].clientX;
      startY = zdarzenie.touches[0].clientY;
      element.style.transition = "none";
    },
    { passive: false },
  );

  element.addEventListener(
    "touchmove",
    (zdarzenie) => {
      if (zdarzenie.touches.length !== 1) return;
      const przesuniecieX = zdarzenie.touches[0].clientX - startX;
      const przesuniecieY = zdarzenie.touches[0].clientY - startY;
      if (Math.abs(przesuniecieY) > Math.abs(przesuniecieX) + 5) return;
      if (przesuniecieX < 0) {
        element.style.transform = `translateX(${Math.max(przesuniecieX, -PROG_PRZESUNIECIA * 1.6)}px)`;
        element.style.opacity = `${1 + przesuniecieX / (PROG_PRZESUNIECIA * 2.2)}`;
      }
    },
    { passive: true },
  );

  element.addEventListener("touchend", () => {
    const przesuniecie =
      parseFloat(element.style.transform.replace(/[^-\d.]/g, "")) || 0;
    element.style.transition = "transform 0.25s ease, opacity 0.25s ease";
    if (przesuniecie < -PROG_PRZESUNIECIA) {
      element.style.transform = "translateX(-110%)";
      element.style.opacity = "0";
      setTimeout(() => usunPrzedmiot(przedmiot, element), 240);
    } else {
      element.style.transform = "";
      element.style.opacity = "";
    }
  });
}

function usunPrzedmiot(przedmiot, elementListy) {
  const indeks = przedmioty.findIndex(
    (pozycja) =>
      (pozycja.identyfikator ?? pozycja.id) ===
      (przedmiot.identyfikator ?? przedmiot.id),
  );
  if (indeks === -1) return;
  ostatnioUsuniety = { przedmiot: { ...przedmiot }, indeks };
  elementListy.classList.add("znikanie-element");
  setTimeout(() => {
    przedmioty.splice(indeks, 1);
    const noweGrupy = grupujPoSemestrach();
    aktywneFiltery.forEach((filtr) => {
      if (!noweGrupy[filtr]) aktywneFiltery.delete(filtr);
    });
    zapiszDane();
    renderujWszystko();
    pokazPowiadomienie(`Usunięto "${przedmiot.nazwa}"`, "ok", {
      etykieta: "Cofnij",
      fn: cofnijUsuniecie,
    });
  }, 220);
}

function otworzModal(przedmiot) {
  edytowanyId = przedmiot.identyfikator ?? przedmiot.id;
  elementy.modalNazwa.value = przedmiot.nazwa;
  elementy.modalOcena.value = przedmiot.ocena;
  elementy.modalEcts.value = przedmiot.ects;
  elementy.modalSemestr.value = przedmiot.semestr || "";
  elementy.modalEdycji.classList.remove("ukryty");
  elementy.modalNazwa.focus();
}

function zamknijModal() {
  elementy.modalEdycji.classList.add("ukryty");
  edytowanyId = null;
}

function zapiszEdycje() {
  const nazwa = elementy.modalNazwa.value.trim();
  const ocena = parseFloat(elementy.modalOcena.value);
  const ects = parseFloat(elementy.modalEcts.value);
  const semestrVal = parseInt(elementy.modalSemestr.value, 10);
  const semestr = (!isNaN(semestrVal) && semestrVal >= 1 && semestrVal <= 14) ? String(semestrVal) : null;

  if (!nazwa) {
    elementy.modalNazwa.focus();
    pokazPowiadomienie("Wpisz nazwę przedmiotu!", "blad");
    return;
  }
  if (!ocena) {
    pokazPowiadomienie("Wybierz ocenę!", "blad");
    return;
  }
  if (!ects || ects <= 0) {
    pokazPowiadomienie("Wpisz poprawne ECTS!", "blad");
    return;
  }

  const indeks = przedmioty.findIndex(
    (pozycja) => (pozycja.identyfikator ?? pozycja.id) === edytowanyId,
  );
  if (indeks === -1) {
    zamknijModal();
    return;
  }

  przedmioty[indeks] = { ...przedmioty[indeks], nazwa, ocena, ects, semestr };
  zapiszDane();
  renderujWszystko();
  zamknijModal();
  pokazPowiadomienie("Zaktualizowano: " + nazwa);
}

function renderujListe() {
  elementy.listaPrzedmiotow.innerHTML = "";
  if (!przedmioty.length) return;
  const grupy = grupujPoSemestrach();
  const klucze = sortujKlucze(Object.keys(grupy));
  const widoczne =
    aktywneFiltery.size === 0
      ? klucze
      : klucze.filter((klucz) => aktywneFiltery.has(klucz));

  widoczne.forEach((semestr) => {
    if (klucze.length > 1) {
      const srednia = obliczSredniaWazona(grupy[semestr]);
      const sumaEcts = grupy[semestr].reduce(
        (suma, przedmiot) => suma + przedmiot.ects,
        0,
      );
      const naglowek = document.createElement("li");
      naglowek.className = "naglowek-semestru";
      naglowek.innerHTML = `
        <span>${semestr === "brak" ? "bez semestru" : "semestr " + semestr}</span>
        <span class="meta-semestru">
          ${srednia ? `<span class="srednia-semestru">${srednia.toFixed(2)}</span>` : ""}
          <span class="info-semestru">${sumaEcts} ECTS</span>
        </span>`;
      elementy.listaPrzedmiotow.appendChild(naglowek);
    }

    grupy[semestr].forEach((przedmiot, indeks) => {
      const elementListy = document.createElement("li");
      elementListy.className = "element-listy " + klasaOceny(przedmiot.ocena);
      elementListy.style.animationDelay = `${indeks * 30}ms`;
      elementListy.innerHTML = `
        <span class="element-ocena">${przedmiot.ocena.toFixed(1)}</span>
        <div class="element-info">
          <div class="element-nazwa" title="${przedmiot.nazwa}">${przedmiot.nazwa}</div>
          <div class="element-pod">${przedmiot.ects} ECTS${przedmiot.semestr ? " &middot; sem. " + przedmiot.semestr : ""}</div>
        </div>
        <div class="element-akcje">
          <button class="element-edytuj" type="button" aria-label="Edytuj przedmiot">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" width="13" height="13">
              <path d="M11.5 2.5a1.5 1.5 0 0 1 2.1 2.1L5 13.2l-2.8.7.7-2.8L11.5 2.5z" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="element-usun" type="button" aria-label="Usuń przedmiot">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" width="13" height="13">
              <path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l.8 9.5a.5.5 0 0 0 .5.5h7.4a.5.5 0 0 0 .5-.5L13 4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>`;
      elementListy
        .querySelector(".element-edytuj")
        .addEventListener("click", () => otworzModal(przedmiot));
      elementListy
        .querySelector(".element-usun")
        .addEventListener("click", () =>
          usunPrzedmiot(przedmiot, elementListy),
        );
      dodajSwipe(elementListy, przedmiot);
      elementy.listaPrzedmiotow.appendChild(elementListy);
    });
  });
}

function zaktualizujPodgladFormularza() {
  const ocena = parseFloat(elementy.poleOceny.value);
  const ects = parseFloat(elementy.poleEcts.value);
  if (!ocena || !ects || ects <= 0 || !przedmioty.length) {
    elementy.podgladFormularza.classList.add("ukryty");
    return;
  }
  const sumaEcts = przedmioty.reduce(
    (suma, przedmiot) => suma + przedmiot.ects,
    0,
  );
  const sumaWazonych = przedmioty.reduce(
    (suma, przedmiot) => suma + przedmiot.ocena * przedmiot.ects,
    0,
  );
  const sredniaPrzed = sumaWazonych / sumaEcts;
  const sredniaPotem = (sumaWazonych + ocena * ects) / (sumaEcts + ects);
  const roznica = sredniaPotem - sredniaPrzed;
  const znak = roznica >= 0 ? "+" : "";
  const kolor =
    roznica >= 0 ? "var(--g5)" : roznica >= -0.05 ? "var(--g35)" : "var(--g2)";
  elementy.podgladFormularza.classList.remove("ukryty");
  elementy.podgladFormularza.innerHTML = `po dodaniu: <strong>${sredniaPotem.toFixed(2)}</strong>&nbsp;<span style="color:${kolor}">(${znak}${roznica.toFixed(3)})</span>`;
}

function renderujWierszeCoJesli() {
  elementy.wejsciaCoJesli.innerHTML = "";
  wierszeCoJesli.forEach((wiersz, indeks) => {
    const kontener = document.createElement("div");
    kontener.className = "co-jesli-rzad";
    kontener.innerHTML = `
      <div class="pole"><label>Ocena</label>
        <select class="co-jesli-ocena">
          ${DOSTEPNE_OCENY.map((wartosc) => `<option value="${wartosc}"${wiersz.ocena == wartosc ? " selected" : ""}>${wartosc.toFixed(1)}</option>`).join("")}
        </select>
      </div>
      <div class="pole"><label>ECTS</label>
        <input type="number" class="co-jesli-ects" min="0.5" max="30" step="0.5" inputmode="decimal" value="${wiersz.ects}" />
      </div>
      ${wierszeCoJesli.length > 1 ? `<button type="button" class="co-jesli-usun">&#10005;</button>` : `<div></div>`}`;
    kontener
      .querySelector(".co-jesli-ocena")
      .addEventListener("change", (zdarzenie) => {
        wierszeCoJesli[indeks].ocena = +zdarzenie.target.value;
        obliczCoJesli();
      });
    kontener
      .querySelector(".co-jesli-ects")
      .addEventListener("input", (zdarzenie) => {
        wierszeCoJesli[indeks].ects = +zdarzenie.target.value;
        obliczCoJesli();
      });
    if (wierszeCoJesli.length > 1)
      kontener.querySelector(".co-jesli-usun").addEventListener("click", () => {
        wierszeCoJesli.splice(indeks, 1);
        renderujWierszeCoJesli();
        obliczCoJesli();
      });
    elementy.wejsciaCoJesli.appendChild(kontener);
  });
}

function klasaDeltaRoznicy(roznica) {
  if (roznica > 0.001) return "delta-wzrost";
  if (roznica >= -0.015) return "delta-neutralna";
  if (roznica >= -0.06) return "delta-cieplo";
  if (roznica >= -0.15) return "delta-pomarancz";
  return "delta-spadek";
}

function obliczCoJesli() {
  if (!przedmioty.length) {
    elementy.wynikCoJesli.classList.add("ukryty");
    elementy.pustyCoJesli.style.display = "";
    return;
  }
  elementy.pustyCoJesli.style.display = "none";
  const sumaEcts = przedmioty.reduce(
    (suma, przedmiot) => suma + przedmiot.ects,
    0,
  );
  const sumaWazonych = przedmioty.reduce(
    (suma, przedmiot) => suma + przedmiot.ocena * przedmiot.ects,
    0,
  );
  const srednia = sumaWazonych / sumaEcts;
  let dodatkEcts = 0;
  let dodatkWazonych = 0;
  let wszystkoPoprawne = true;
  wierszeCoJesli.forEach((wiersz) => {
    if (!wiersz.ects || wiersz.ects <= 0) {
      wszystkoPoprawne = false;
      return;
    }
    dodatkEcts += wiersz.ects;
    dodatkWazonych += wiersz.ocena * wiersz.ects;
  });
  if (!wszystkoPoprawne || !dodatkEcts) {
    elementy.wynikCoJesli.classList.add("ukryty");
    return;
  }
  const sredniaPotem =
    (sumaWazonych + dodatkWazonych) / (sumaEcts + dodatkEcts);
  const roznica = sredniaPotem - srednia;
  const znak = roznica >= 0 ? "+" : "";
  elementy.wynikCoJesli.classList.remove("ukryty");
  elementy.terazCoJesli.textContent = srednia.toFixed(2);
  elementy.terazCoJesli.className = klasaOceny(zaokraglOcene(srednia));
  animujLiczbe(elementy.potemCoJesli, sredniaPotem.toFixed(2), 2);
  elementy.potemCoJesli.className = klasaOceny(zaokraglOcene(sredniaPotem));
  elementy.roznicaCoJesli.textContent = znak + roznica.toFixed(3);
  elementy.roznicaCoJesli.className =
    "co-jesli-roznica " + klasaDeltaRoznicy(roznica);
}

function obliczStypendium() {
  const prog = parseFloat(elementy.progStypendium.value);
  const osoby = parseInt(elementy.osobyStypendium.value, 10);
  const procent = parseFloat(elementy.procentStypendium.value);
  if (!prog || !osoby || !procent || !przedmioty.length) {
    elementy.wynikStypendium.classList.add("ukryty");
    elementy.pustyStypendium.style.display = "";
    return;
  }
  elementy.wynikStypendium.classList.remove("ukryty");
  elementy.pustyStypendium.style.display = "none";
  const sumaEcts = przedmioty.reduce(
    (suma, przedmiot) => suma + przedmiot.ects,
    0,
  );
  const srednia =
    przedmioty.reduce(
      (suma, przedmiot) => suma + przedmiot.ocena * przedmiot.ects,
      0,
    ) / sumaEcts;
  const sumaWazonych = srednia * sumaEcts;
  const liczbaStypendystow = Math.ceil(osoby * (procent / 100));
  const zakres = 3.0;
  const pozycjaTy = Math.min(Math.max((srednia - 2) / zakres, 0), 1) * 100;
  const pozycjaProgu = Math.min(Math.max((prog - 2) / zakres, 0), 1) * 100;
  const roznica = srednia - prog;

  elementy.wypelnienieStypendium.style.width = pozycjaTy + "%";
  elementy.wypelnienieStypendium.className =
    "stypendium-wypelnienie " + (srednia >= prog ? "ok" : "nie");
  elementy.markerStypendium.style.left = pozycjaProgu + "%";
  elementy.tyStypendium.style.left = pozycjaTy + "%";
  elementy.twojaStypendium.textContent = srednia.toFixed(2);
  elementy.twojaStypendium.className = klasaOceny(zaokraglOcene(srednia));
  elementy.progWartoscStypendium.textContent = prog.toFixed(2);

  const znak = roznica >= 0 ? "+" : "";
  elementy.roznicaStypendium.textContent = znak + roznica.toFixed(3);
  elementy.roznicaStypendium.style.color =
    roznica >= 0 ? "var(--g5)" : "var(--g2)";

  const szacowaneMiejsce =
    srednia >= prog
      ? Math.max(
          1,
          Math.round(
            (1 - ((srednia - prog) / zakres) * 3) * liczbaStypendystow,
          ),
        )
      : Math.round(
          liczbaStypendystow +
            ((prog - srednia) / zakres) * (osoby - liczbaStypendystow) * 2,
        );
  const miejsce = Math.min(szacowaneMiejsce, osoby);
  const liczbaOsobPrzed = Math.max(0, miejsce - 1);

  elementy.miejsceStypendium.textContent = "~" + miejsce + " / " + osoby;
  elementy.przedStypendium.textContent = "~" + liczbaOsobPrzed;
  elementy.przedStypendium.style.color =
    liczbaOsobPrzed < liczbaStypendystow ? "var(--g5)" : "var(--g2)";

  if (srednia >= prog) {
    elementy.komunikatStypendium.className = "stypendium-komunikat ok";
    elementy.komunikatStypendium.innerHTML = `<strong>Jesteś powyżej progu.</strong> Zapas: ${roznica.toFixed(3)} pkt. Szacunkowo ${liczbaOsobPrzed} ${liczbaOsobPrzed === 1 ? "osoba ma" : "osoby mają"} lepszą średnią.`;
  } else {
    const potrzebaEcts = Math.max(
      0,
      (prog * sumaEcts - sumaWazonych) / (5 - prog),
    );
    elementy.komunikatStypendium.className = "stypendium-komunikat nie";
    elementy.komunikatStypendium.innerHTML = `<strong>Brakuje: ${Math.abs(roznica).toFixed(3)} pkt.</strong> Szacunkowo ${liczbaOsobPrzed} ${liczbaOsobPrzed === 1 ? "osoba jest" : "osoby są"} przed Tobą. Do progu ${prog.toFixed(2)} potrzebujesz ok. <em>${potrzebaEcts.toFixed(1)} ECTS</em> z oceną 5.0.`;
  }
}

function renderujWszystko() {
  odswiezStatystyki();
  renderujWykres();
  renderujChipySemestrow();
  renderujFiltry();
  renderujListe();
  obliczCoJesli();
  obliczStypendium();
}

elementy.przyciskPokazInfo.addEventListener("click", () =>
  ustawBohatera(!bohaterWidoczny),
);
ustawBohatera(bohaterWidoczny);

elementy.checkboxDokladna.addEventListener("change", (zdarzenie) => {
  trybDokladny = zdarzenie.target.checked;
  odswiezStatystyki();
});

const zapisanySemestr = localStorage.getItem(KLUCZ_SEMESTRU);
if (zapisanySemestr) elementy.poleSemestru.value = zapisanySemestr;
elementy.poleSemestru.addEventListener("change", () =>
  localStorage.setItem(KLUCZ_SEMESTRU, elementy.poleSemestru.value),
);

elementy.poleOceny.addEventListener("change", zaktualizujPodgladFormularza);
elementy.poleEcts.addEventListener("input", zaktualizujPodgladFormularza);

elementy.formularz.addEventListener("submit", (zdarzenie) => {
  zdarzenie.preventDefault();
  const nazwa = elementy.poleNazwy.value.trim();
  const ocena = parseFloat(elementy.poleOceny.value);
  const ects = parseFloat(elementy.poleEcts.value);
  const semestrVal = parseInt(elementy.poleSemestru.value, 10);
  const semestr = (!isNaN(semestrVal) && semestrVal >= 1 && semestrVal <= 14) ? String(semestrVal) : null;
  if (!ocena) {
    pokazPowiadomienie("Wybierz ocenę!", "blad");
    elementy.poleOceny.focus();
    return;
  }
  if (!ects || ects <= 0) {
    pokazPowiadomienie("Wpisz poprawne ECTS!", "blad");
    elementy.poleEcts.focus();
    return;
  }

  przedmioty.push({ identyfikator: Date.now(), nazwa, ocena, ects, semestr });
  zapiszDane();
  elementy.poleNazwy.value = "";
  elementy.poleOceny.value = "";
  elementy.poleEcts.value = "";
  elementy.podgladFormularza.classList.add("ukryty");
  renderujWszystko();
  elementy.poleNazwy.focus();
  pokazPowiadomienie("Dodano: " + nazwa);
});

elementy.przyciskWyczyszczenia.addEventListener("click", () => {
  const kopia = [...przedmioty];
  przedmioty = [];
  aktywneFiltery.clear();
  celOsiagniety = false;
  zapiszDane();
  renderujWszystko();
  pokazPowiadomienie("Wyczyszczono wszystkie przedmioty", "ok", {
    etykieta: "Cofnij",
    fn: () => {
      przedmioty = kopia;
      zapiszDane();
      renderujWszystko();
    },
  });
});

elementy.przyciskDodajCoJesli.addEventListener("click", () => {
  wierszeCoJesli.push({ ocena: 4.5, ects: 5 });
  renderujWierszeCoJesli();
  obliczCoJesli();
});

[
  elementy.progStypendium,
  elementy.osobyStypendium,
  elementy.procentStypendium,
].forEach((pole) => pole.addEventListener("input", obliczStypendium));

const zapisanyCel = localStorage.getItem(KLUCZ_CELU);
if (zapisanyCel) elementy.celWejscie.value = zapisanyCel;

elementy.celWejscie.addEventListener("input", () => {
  localStorage.setItem(KLUCZ_CELU, elementy.celWejscie.value);
  celOsiagniety = false;
  obliczCelSredniej(undefined, undefined, false);
});

elementy.celWejscie.addEventListener("change", () => {
  celOsiagniety = false;
  obliczCelSredniej(undefined, undefined, true);
});

elementy.modalZapisz.addEventListener("click", zapiszEdycje);
elementy.modalAnuluj.addEventListener("click", zamknijModal);
elementy.modalEdycji.addEventListener("click", (zdarzenie) => {
  if (zdarzenie.target === elementy.modalEdycji) zamknijModal();
});
elementy.modalNazwa.addEventListener("keydown", (zdarzenie) => {
  if (zdarzenie.key === "Enter" && edytowanyId !== null) zapiszEdycje();
});

renderujWierszeCoJesli();
renderujWszystko();
trybInicjalizacji = false;

window.addEventListener("resize", () => {
  const canvas = elementy.konfettiCanvas;
  if (canvas.style.display !== "none") {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

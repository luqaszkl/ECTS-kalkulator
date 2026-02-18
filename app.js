const FORM = document.querySelector("form");
const SREDNIA_EL = document.querySelector("#srednia");
const SUMA_EL = document.querySelector("#suma-ects");
const LISTA_EL = document.querySelector("#przedmioty-lista");

let przedmioty = JSON.parse(localStorage.getItem("przedmioty")) || [];

function zapiszDane() {
  localStorage.setItem("przedmioty", JSON.stringify(przedmioty));
}

function aktualizujPodsumowanie() {
  if (przedmioty.length === 0) {
    SUMA_EL.textContent = "0";
    SREDNIA_EL.textContent = "-";
    return;
  }

  const sumaEcts = przedmioty.reduce((acc, p) => acc + p.ects, 0);
  const sumaWazona = przedmioty.reduce((acc, p) => acc + p.ocena * p.ects, 0);

  SUMA_EL.textContent = sumaEcts;
  SREDNIA_EL.textContent = (sumaWazona / sumaEcts).toFixed(2);
}
function stworzElementListy(przedmiot) {
  const LI = document.createElement("li");

  LI.innerHTML = `<div class = "li-info">
    <span class="li-nazwa">Przedmiot: ${przedmiot.nazwa}</span>
    <span class="li-ocena">Ocena: ${przedmiot.ocena}</span>
    <span class="li-ects">ECTS: ${przedmiot.ects}</span>
</div>
<button class="btn-usun" aria-label='usuń ${przedmiot.nazwa}'>Usuń</button>
`;

  LI.querySelector(".btn-usun").addEventListener("click", () => {
    const indeks = przedmioty.findIndex((p) => p.id === przedmiot.id);
    przedmioty.splice(indeks, 1);
    LI.remove();
    zapiszDane();
    aktualizujPodsumowanie();
  });
  return LI;
}

function wczytajZapisane() {
  przedmioty.forEach((przedmiot) => {
    const li = stworzElementListy(przedmiot);
    LISTA_EL.appendChild(li);
  });
  aktualizujPodsumowanie();
}

FORM.addEventListener("submit", (e) => {
  e.preventDefault();
  const nazwa = document.querySelector("#przedmiot").value.trim();
  const ocena = parseFloat(document.querySelector("#ocena").value);
  const ects = parseFloat(document.querySelector("#ects").value);

  if (ects <= 0) {
    alert("Liczba ECTS musi być większa od 0!");
    return;
  }
  const przedmiot = { id: Date.now(), nazwa, ocena, ects };
  przedmioty.push(przedmiot);
  const li = stworzElementListy(przedmiot);
  LISTA_EL.appendChild(li);

  zapiszDane();
  FORM.reset();
  aktualizujPodsumowanie();
});
wczytajZapisane();

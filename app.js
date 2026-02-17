const FORM = document.querySelector("form");
const PRZEDMIOTY = [];
const SREDNIA = document.querySelector("#srednia");
const SUMA = document.querySelector("#suma-ects");

function aktualizujPodsumowanie() {
  let sumaEcts = 0;
  let sumaWazona = 0;
  let srednia = 0;

  for (const przedmiot of PRZEDMIOTY) {
    sumaEcts += przedmiot.ECTS;
    sumaWazona += przedmiot.OCENA * przedmiot.ECTS;
  }

  srednia = sumaWazona / sumaEcts;
  SUMA.textContent = sumaEcts;
  SREDNIA.textContent = srednia.toFixed(2);
}

FORM.addEventListener("submit", (e) => {
  e.preventDefault();
  const PRZEDMIOT = document.querySelector("#przedmiot").value;
  const OCENA = parseFloat(document.querySelector("#ocena").value);
  const ECTS = parseFloat(document.querySelector("#ects").value);

  const przedmiot = { PRZEDMIOT, OCENA, ECTS };
  PRZEDMIOTY.push(przedmiot);

  const LI = document.createElement("li");

  LI.innerHTML = `<div class = "li-info">
    <span class="li-nazwa">Przedmiot: ${PRZEDMIOT}</span>
    <span class="li-ocena">Ocena: ${OCENA}</span>
    <span class="li-ects">ECTS: ${ECTS}</span>
</div>
<button class="btn-usun">Usuń</button>
`;

  const BTNUSUN = LI.querySelector(".btn-usun");

  BTNUSUN.addEventListener("click", () => {
    const indeks = PRZEDMIOTY.indexOf(przedmiot);
    PRZEDMIOTY.splice(indeks, 1);
    LI.remove();
    aktualizujPodsumowanie();
  });

  const lista = document.querySelector("#przedmioty-lista");
  lista.appendChild(LI);
  FORM.reset();
  aktualizujPodsumowanie();
});

// Interiores · pared de piedra. Recorrido vertical: barra, panel de proyectos, dock de capítulos, despiece y aparición.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const quieto = () => !document.documentElement.classList.contains("animar") && matchMedia("(prefers-reduced-motion: reduce)").matches;

const barra = $(".barra"), dock = $(".dock");
const boton = $("[data-proyectos]"), panel = $("#proyectos");

// ---------------------------------------------------------------- panel de proyectos
const abrir = (si) => {
  if (!panel) return;
  panel.classList.toggle("abierto", si);
  boton.setAttribute("aria-expanded", String(si));
  if (si && matchMedia("(pointer: fine)").matches) $('a[aria-current="page"], a', panel)?.focus({ preventScroll: true });
};
if (boton && panel) {
  boton.addEventListener("click", () => abrir(!panel.classList.contains("abierto")));
  document.addEventListener("pointerdown", (e) => { if (!panel.contains(e.target) && !boton.contains(e.target)) abrir(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("abierto")) { abrir(false); boton.focus(); } });
  panel.addEventListener("click", (e) => { if (e.target.closest("a")) abrir(false); });
}

// ---------------------------------------------------------------- barra y dock: se apartan al bajar, vuelven al subir
{
  let ultimo = scrollY, pedido = false;
  const mover = () => {
    pedido = false;
    const y = scrollY, d = y - ultimo;
    ultimo = y;
    if (panel?.classList.contains("abierto")) return;
    const esconder = y > 160 && d > 6, mostrar = y < 160 || d < -6;
    if (esconder) barra?.classList.add("oculta");
    if (mostrar) barra?.classList.remove("oculta");
    // el dock aparece cuando ya dejaste la entrada y no tapa la salida del final
    const fin = innerHeight + y > document.documentElement.scrollHeight - 140;
    dock?.classList.toggle("oculto", y < innerHeight * 0.6 || fin);
  };
  addEventListener("scroll", () => { if (!pedido) { pedido = true; requestAnimationFrame(mover); } }, { passive: true });
  barra?.addEventListener("focusin", () => barra.classList.remove("oculta"));
  mover();
}

// ---------------------------------------------------------------- dock: marca el capítulo en el que estás
if (dock) {
  const pares = $$("a", dock).map((a) => [a, document.getElementById(a.getAttribute("href").slice(1))]).filter(([, s]) => s);
  const espiar = () => {
    const linea = innerHeight * 0.45;
    let actual = 0;
    pares.forEach(([, s], i) => { if (s.getBoundingClientRect().top <= linea) actual = i; });
    pares.forEach(([a], i) => {
      if (i === actual) {
        if (a.getAttribute("aria-current") !== "true") {
          a.setAttribute("aria-current", "true");
          dock.scrollTo({ left: a.offsetLeft - 20, behavior: quieto() ? "auto" : "smooth" });
        }
      } else a.removeAttribute("aria-current");
    });
  };
  addEventListener("scroll", espiar, { passive: true });
  espiar();
  dock.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    document.getElementById(a.getAttribute("href").slice(1))?.scrollIntoView({ behavior: quieto() ? "auto" : "smooth" });
  });
}

// ---------------------------------------------------------------- despiece
for (const d of $$("[data-despiece]")) {
  const botones = $$("button", d), imgs = $$(".despiece__lamina img", d);
  const mostrar = (n) => {
    botones.forEach((b, i) => b.setAttribute("aria-pressed", String(i === n)));
    imgs.forEach((im, i) => { im.classList.toggle("activo", i === n); im.setAttribute("aria-hidden", String(i !== n)); });
  };
  botones.forEach((b, i) => {
    b.addEventListener("click", () => mostrar(i));
    b.addEventListener("keydown", (e) => {
      const k = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      const n = (i + k + botones.length) % botones.length;
      mostrar(n); botones[n].focus();
    });
  });
  mostrar(0);
}

// ---------------------------------------------------------------- índice: el proyecto de la fila aparece en el bloque ocre
{
  const vista = $("[data-vista]"), filas = $$("[data-filas] a[data-k]");
  if (vista && filas.length) {
    const figs = Object.fromEntries($$(".vista__img", vista).map((f) => [f.dataset.k, f]));
    let actual = null, tocando = false, reloj = null, enVista = false;
    const mostrar = (k) => {
      if (k === actual) return;
      if (actual) { const f = figs[actual]; f.classList.remove("activo"); f.classList.add("sale"); setTimeout(() => f.classList.remove("sale"), 900); }
      actual = k;
      figs[k]?.classList.add("activo");
      vista.classList.add("mostrando");
      filas.forEach((a) => a.classList.toggle("activo", a.dataset.k === k));
    };
    // mientras nadie lo toca y está a la vista, rota solo
    const girar = () => {
      clearInterval(reloj);
      if (quieto() || !enVista || tocando) return;
      reloj = setInterval(() => {
        const i = filas.findIndex((a) => a.dataset.k === actual);
        mostrar(filas[(i + 1) % filas.length].dataset.k);
      }, 3200);
    };
    filas.forEach((a) => {
      a.addEventListener("pointerenter", () => { tocando = true; clearInterval(reloj); mostrar(a.dataset.k); });
      a.addEventListener("focus", () => { tocando = true; clearInterval(reloj); mostrar(a.dataset.k); });
    });
    const lista = filas[0].closest("ol");
    lista.addEventListener("pointerleave", () => { tocando = false; girar(); });
    lista.addEventListener("focusout", (e) => { if (!lista.contains(e.relatedTarget)) { tocando = false; girar(); } });
    new IntersectionObserver(([en]) => {
      enVista = en.isIntersecting;
      if (enVista && !actual) setTimeout(() => mostrar(filas[0].dataset.k), 450);
      girar();
    }, { threshold: 0.35 }).observe(vista.parentElement);
  }
}

// ---------------------------------------------------------------- aparición
const aparece = $$(".aparece");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  aparece.forEach((el) => io.observe(el));
} else aparece.forEach((el) => el.classList.add("visible"));

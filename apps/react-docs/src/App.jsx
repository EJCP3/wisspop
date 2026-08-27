import { useRef, useState, useEffect } from "react";
import {
  WissPopMorph,
  WissPopPill,
  WissPopFlip,
  enterDropdownAnimation,
  leaveDropdownAnimation,
} from "wisspop/react";

const ANCLADOS = [
  { placement: "top", align: "start", etiqueta: "↑ inicio" },
  { placement: "top", align: "center", etiqueta: "↑ centro" },
  { placement: "top", align: "end", etiqueta: "↑ final" },
  { placement: "left", align: "center", etiqueta: "← izquierda" },
  { placement: "right", align: "center", etiqueta: "derecha →" },
  { placement: "bottom", align: "center", etiqueta: "↓ abajo" },
];

const EASES = [
  { ease: "back.out(1.7)", label: "(Rebote)", desc: "Rebote con overshoot elástico al expandirse.", closeEase: "power3.in", dur: 0.65, closeDur: 0.35 },
  { ease: "power3.out", label: "(Suave)", desc: "Desaceleración suave, profesional y fluida.", closeEase: "power2.in", dur: 0.5, closeDur: 0.3 },
  { ease: "elastic.out(1, 0.75)", label: "(Resorte)", desc: "Efecto resorte gomoso pronunciado.", closeEase: "power2.inOut", dur: 0.85, closeDur: 0.4 },
  { ease: "expo.out", label: "(Snap rápido)", desc: "Aceleración inicial instantánea con frenada suave.", closeEase: "expo.in", dur: 0.55, closeDur: 0.3 },
];

const GAP = 8;
const DROPDOWN_DIRS = {
  down: { origin: "top center", pos: (b) => ({ top: `${b.offsetTop + b.offsetHeight + GAP}px`, left: `${b.offsetLeft}px` }) },
  up: { origin: "bottom center", pos: (b, row) => ({ bottom: `${row.offsetHeight - b.offsetTop + GAP}px`, left: `${b.offsetLeft}px` }) },
  right: { origin: "left center", pos: (b) => ({ top: `${b.offsetTop}px`, left: `${b.offsetLeft + b.offsetWidth + GAP}px` }) },
  left: { origin: "right center", pos: (b, row) => ({ top: `${b.offsetTop}px`, right: `${row.offsetWidth - b.offsetLeft + GAP}px` }) },
};

export default function App() {
  // --- 1. Anclados ---
  const [ancladoOpen, setAncladoOpen] = useState(false);
  const [ancladoTarget, setAncladoTarget] = useState({ placement: "bottom", align: "center", origin: null });
  const ancladoBtnRefs = useRef({});

  const openAnclado = (placement, align) => {
    const key = placement + align;
    setAncladoTarget({ placement, align, origin: ancladoBtnRefs.current[key] });
    setAncladoOpen(true);
  };

  // --- 2. FAB ---
  const [fabOpen, setFabOpen] = useState(false);
  const fabBtnRef = useRef(null);

  // --- 3. Inline ---
  const [inlineOpen, setInlineOpen] = useState(false);
  const inlineBtnRef = useRef(null);

  // --- 4. Drawer ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLado, setDrawerLado] = useState("left");
  const drawerBtnRefs = useRef({});

  const openDrawer = (lado) => {
    setDrawerLado(lado);
    setDrawerOpen(true);
  };

  // --- 5. Auth Pill ---
  const authPillRef = useRef(null);
  const authCenterRef = useRef(null);
  const authOriginRef = useRef(null);
  const [authVista, setAuthVista] = useState("signup");
  const [authError, setAuthError] = useState(false);

  const openAuth = (placement) => {
    setAuthVista("signup");
    setAuthError(false);
    const btn = placement === "center" ? authCenterRef.current : authOriginRef.current;
    authPillRef.current?.open(btn, "Crear cuenta", { placement });
  };

  const toggleAuthVista = () => {
    authPillRef.current?.changeView(() => {
      setAuthVista((v) => (v === "signup" ? "login" : "signup"));
      setAuthError(false);
    });
  };

  const toggleAuthError = () => {
    setAuthError((err) => !err);
    authPillRef.current?.resync();
  };

  // --- 6. Formatos ---
  const [formatOpen, setFormatOpen] = useState(false);
  const [formatTipo, setFormatTipo] = useState("texto");
  const [formatOrigin, setFormatOrigin] = useState(null);
  const [formatLabel, setFormatLabel] = useState(null);

  const fTextoBtnRef = useRef(null);
  const fMixtoBtnRef = useRef(null);
  const fIconoBtnRef = useRef(null);
  const fImagenBtnRef = useRef(null);

  const openFormat = (tipo) => {
    setFormatTipo(tipo);
    let btn = fTextoBtnRef.current;
    if (tipo === "mixto") btn = fMixtoBtnRef.current;
    if (tipo === "icono") btn = fIconoBtnRef.current;
    if (tipo === "imagen") btn = fImagenBtnRef.current;
    setFormatOrigin(btn);
    setFormatLabel(
      tipo === "texto"
        ? "Solo texto"
        : tipo === "mixto"
          ? btn.querySelector(".con-icono")
          : tipo === "icono"
            ? btn.querySelector("svg")
            : btn.querySelector("img"),
    );
    setFormatOpen(true);
  };

  // --- 7. Casos de uso avanzados con elemento viajero ---
  const btnCheckoutRef = useRef(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const btnInviteRef = useRef(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const searchBoxWrapRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const btnDeleteRef = useRef(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // --- 8. Swipe ---
  const [swipeOpen, setSwipeOpen] = useState(false);
  const swipeBtnRef = useRef(null);

  // --- 10. Dropdown ---
  const dropdownRowRef = useRef(null);
  const dropdownPanelRef = useRef(null);
  const dropdownDirRef = useRef(null);

  const ddDownBtn = useRef(null);
  const ddUpBtn = useRef(null);
  const ddRightBtn = useRef(null);
  const ddLeftBtn = useRef(null);

  const closeDropdown = () => {
    const panel = dropdownPanelRef.current;
    const dir = dropdownDirRef.current;
    if (!panel || !dir) return;
    const { origin } = DROPDOWN_DIRS[dir];
    dropdownDirRef.current = null;
    leaveDropdownAnimation(panel, () => (panel.style.display = "none"), { transformOrigin: origin });
  };

  const openDropdown = (dir, btn) => {
    const panel = dropdownPanelRef.current;
    const row = dropdownRowRef.current;
    if (!panel || !row || !btn) return;

    dropdownDirRef.current = dir;
    const { origin, pos } = DROPDOWN_DIRS[dir];
    Object.assign(panel.style, {
      top: "",
      bottom: "",
      left: "",
      right: "",
      ...pos(btn, row),
      display: "block",
    });
    enterDropdownAnimation(panel, null, { transformOrigin: origin });
  };

  const toggleDropdownDir = (dir, btn) => {
    if (dropdownDirRef.current === dir) closeDropdown();
    else openDropdown(dir, btn);
  };

  useEffect(() => {
    const handleDocClick = (e) => {
      const panel = dropdownPanelRef.current;
      if (!dropdownDirRef.current || !panel || panel.contains(e.target)) return;
      if (e.target.closest("[data-dir]")) return;
      closeDropdown();
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // --- 11. Animación de contenido ---
  const [contentAnimOpen, setContentAnimOpen] = useState(false);
  const [contentAnimType, setContentAnimType] = useState("slide-up");
  const [contentAnimOrigin, setContentAnimOrigin] = useState(null);
  const contentAnimBtnRefs = useRef({});

  const openContentAnim = (anim) => {
    setContentAnimType(anim);
    setContentAnimOrigin(contentAnimBtnRefs.current[anim]);
    setContentAnimOpen(true);
  };

  // --- 12. Cascada Stagger ---
  const [staggerOpen, setStaggerOpen] = useState(false);
  const btnStaggerRef = useRef(null);

  // --- 13. Eases ---
  const [easeOpen, setEaseOpen] = useState(false);
  const [currentEaseConfig, setCurrentEaseConfig] = useState(EASES[0]);
  const [easeOrigin, setEaseOrigin] = useState(null);
  const easeBtnRefs = useRef({});

  const openEase = (item) => {
    setCurrentEaseConfig(item);
    setEaseOrigin(easeBtnRefs.current[item.ease]);
    setEaseOpen(true);
  };

  // --- 14. Móvil Rendimiento ---
  const [mobilePerfOpen, setMobilePerfOpen] = useState(false);
  const btnMobilePerfRef = useRef(null);

  // --- 15. Pantalla Completa ---
  const [pcFsOpen, setPcFsOpen] = useState(false);
  const btnPcFsRef = useRef(null);

  const [inmersivaOpen, setInmersivaOpen] = useState(false);
  const btnPcFsPillRef = useRef(null);

  return (
    <main className="page">
      <header>
        <h1>WissPop — React Docs</h1>
        <p className="lead">
          El panel no aparece de la nada: nace del elemento que lo abrió y vuelve a él al cerrarse.
        </p>
        <p className="note">
          Esta página está construida con componentes de React (<code>wisspop/react</code>):
          <code>WissPopMorph</code>, <code>WissPopPill</code> y <code>WissPopFlip</code>.
        </p>
      </header>

      {/* 1 · Anclado a un botón */}
      <section>
        <h2>Anclado a un botón</h2>
        <p className="hint">
          El panel nace del botón y se abre hacia el lado que le pidas. <code>align</code> es la
          posición sobre el <strong>eje cruzado</strong>: con el panel arriba o abajo alinea en
          horizontal, y al costado alinea en vertical.
        </p>

        <div className="matriz">
          {ANCLADOS.map((item) => {
            const key = item.placement + item.align;
            return (
              <button
                key={key}
                ref={(el) => (ancladoBtnRefs.current[key] = el)}
                onClick={() => openAnclado(item.placement, item.align)}
              >
                {{ item: item.etiqueta }.item}
              </button>
            );
          })}
        </div>

        <p className="hint">
          Ninguno puede taparse a sí mismo ni salirse: el panel se acota al espacio libre de su lado.
        </p>

        <WissPopMorph
          open={ancladoOpen}
          onClose={() => setAncladoOpen(false)}
          originRef={ancladoTarget.origin}
          placement={ancladoTarget.placement}
          align={ancladoTarget.align}
          modalClass="panel"
          swipeToClose
        >
          {({ close }) => (
            <ul className="menu">
              <li onClick={close}>Más recientes</li>
              <li onClick={close}>Más antiguos</li>
              <li onClick={close}>Mayor monto</li>
            </ul>
          )}
        </WissPopMorph>
      </section>

      {/* 2 · Desde un botón circular */}
      <section>
        <h2>Desde un botón circular</h2>
        <p className="hint">
          El radio del origen se lee del CSS y se acota a la mitad del lado menor.
        </p>

        <div className="row">
          <button ref={fabBtnRef} className="round" onClick={() => setFabOpen(true)}>+</button>
        </div>

        <WissPopMorph
          open={fabOpen}
          onClose={() => setFabOpen(false)}
          originRef={fabBtnRef}
          placement="center"
          ease="power3.out"
          duration={0.65}
          modalClass="panel"
          swipeToClose
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "22rem" }}>
              <h3><span data-wisspop-title>+</span> Nuevo movimiento</h3>
              <label>Concepto</label>
              <input placeholder="Café" />
              <label>Monto</label>
              <input placeholder="2500" />
              <button onClick={close}>Guardar</button>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 3 · Crecer en el lugar */}
      <section>
        <h2>Crecer en el lugar</h2>
        <p className="hint">
          <code>placement: "origin"</code> — el panel comparte el centro con el botón y crece ahí mismo.
        </p>

        <div className="row">
          <button ref={inlineBtnRef} onClick={() => setInlineOpen(true)}>Renombrar</button>
        </div>

        <WissPopMorph
          open={inlineOpen}
          onClose={() => setInlineOpen(false)}
          originRef={inlineBtnRef}
          placement="origin"
          modalClass="panel"
          closeButton
          swipeToClose
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "20rem" }}>
              <h3>Renombrar</h3>
              <label>Nombre</label>
              <input placeholder="Supermercado" />
              <button onClick={close}>Listo</button>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 4 · Drawer */}
      <section>
        <h2>Drawer</h2>
        <p className="hint">
          <code>drawer-left</code> · <code>drawer-right</code> · <code>drawer-top</code> · <code>drawer-bottom</code>.
        </p>

        <div className="row">
          {["left", "right", "top", "bottom"].map((lado) => (
            <button
              key={lado}
              ref={(el) => (drawerBtnRefs.current[lado] = el)}
              onClick={() => openDrawer(lado)}
            >
              drawer-{lado}
            </button>
          ))}
        </div>

        <WissPopMorph
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          originRef={drawerBtnRefs.current[drawerLado]}
          placement={`drawer-${drawerLado}`}
          modalClass={`panel drawer drawer-${drawerLado}`}
          swipeToClose
        >
          {({ close }) => (
            <ul className="menu">
              <li onClick={close}>Inicio</li>
              <li onClick={close}>Movimientos</li>
              <li onClick={close}>Presupuestos</li>
              <li onClick={close}>Ajustes</li>
            </ul>
          )}
        </WissPopMorph>
      </section>

      {/* 5 · Texto viajero */}
      <section>
        <h2>Texto viajero</h2>
        <p className="hint">
          El label del botón sale a 14px, viaja por la pantalla creciendo, y aterriza justo encima del elemento marcado con <code>data-wisspop-title</code>.
        </p>

        <div className="row">
          <h3>Modal center</h3>
          <button ref={authCenterRef} className="pill" onClick={() => openAuth("center")}>Crear cuenta</button>
          <h3>Modal origin</h3>
          <button ref={authOriginRef} className="pill" onClick={() => openAuth("origin")}>Crear cuenta</button>
        </div>

        <WissPopPill ref={authPillRef} modalClass="pill-panel">
          {({ titleReady, close }) => (
            <div className="pill-body">
              <h2 data-wisspop-title style={{ opacity: titleReady ? 1 : 0 }}>
                {authVista === "signup" ? "Crear cuenta" : "Iniciar sesión"}
              </h2>
              <label>Email</label>
              <input placeholder="hola@ejemplo.com" />
              <label>Contraseña</label>
              <input type="password" placeholder="••••••••" />
              {authVista === "signup" && (
                <>
                  <label>Repetir contraseña</label>
                  <input type="password" placeholder="••••••••" />
                </>
              )}
              {authError && <p className="error">Las contraseñas no coinciden.</p>}
              <button onClick={close}>Continuar</button>
              <button className="switch" onClick={toggleAuthError}>
                {authError ? "Ocultar error" : "Mostrar un error (resync)"}
              </button>
              <button className="switch" onClick={toggleAuthVista}>
                {authVista === "signup" ? "Ya tengo cuenta" : "Quiero crear una cuenta"}
              </button>
            </div>
          )}
        </WissPopPill>
      </section>

      {/* 6 · Formatos del elemento viajero */}
      <section>
        <h2>Formatos del elemento viajero</h2>
        <p className="hint">
          Lo que viaja puede ser texto, un nodo, o las dos cosas. El core elige cómo escalarlo.
        </p>

        <div className="row">
          <button ref={fTextoBtnRef} className="pill" onClick={() => openFormat("texto")}>Solo texto</button>
          <button ref={fMixtoBtnRef} className="pill" onClick={() => openFormat("mixto")}>
            <span className="con-icono">
              <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
              </svg>
              <span>Me gusta</span>
            </span>
          </button>
          <button ref={fIconoBtnRef} className="round" onClick={() => openFormat("icono")}>
            <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" />
            </svg>
          </button>
          <button ref={fImagenBtnRef} className="avatar-btn" onClick={() => openFormat("imagen")}>
            <img src="/gato.jpg" alt="" />
          </button>
        </div>

        <WissPopMorph
          open={formatOpen}
          onClose={() => setFormatOpen(false)}
          originRef={formatOrigin}
          label={formatLabel}
          placement="center"
          ease="power3.out"
          duration={0.65}
          modalClass="panel"
          flyingTextClass="flying"
          swipeToClose
        >
          {({ close }) => (
            <>
              {formatTipo === "texto" && (
                <div className="panel-body" style={{ width: "21rem" }}>
                  <h3><span data-wisspop-title>Solo texto</span></h3>
                  <p className="nota">
                    <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                    <span>No hay nodo que medir, así que el punto de partida sale de <code>labelOffsetX</code>.</span>
                  </p>
                  <button onClick={close}>Cerrar</button>
                </div>
              )}

              {formatTipo === "mixto" && (
                <div className="panel-body" style={{ width: "21rem" }}>
                  <h3>
                    <span data-wisspop-title className="con-icono">
                      <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>
                      <span>Me gusta</span>
                    </span>
                  </h3>
                  <p className="nota">
                    <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                    <span>El icono va en <code>em</code>: crece junto con el texto sin ninguna cuenta aparte.</span>
                  </p>
                  <button onClick={close}>Cerrar</button>
                </div>
              )}

              {formatTipo === "icono" && (
                <div className="panel-body" style={{ width: "21rem" }}>
                  <h3>
                    <span data-wisspop-title className="ico-destino">
                      <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" /></svg>
                    </span>
                  </h3>
                  <p className="nota">
                    <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                    <span>Sin texto que escalar, el core pasa a <code>box</code>: anima width/height.</span>
                  </p>
                  <button onClick={close}>Cerrar</button>
                </div>
              )}

              {formatTipo === "imagen" && (
                <div className="panel-body" style={{ width: "21rem" }}>
                  <span data-wisspop-title className="foto-destino"><img src="/gato.jpg" alt="" /></span>
                  <h3>No hace nada, HD</h3>
                  <p className="nota">
                    <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                    <span>Despega desde el rect medido de la miniatura y aterriza en el tamaño del destino.</span>
                  </p>
                  <button onClick={close}>Cerrar</button>
                </div>
              )}
            </>
          )}
        </WissPopMorph>
      </section>

      {/* 7 · Casos de uso avanzados con elemento viajero */}
      <section>
        <h2>Casos de uso avanzados con elemento viajero</h2>
        <p className="hint">
          El elemento viajero convierte acciones comunes en experiencias conectadas y fluidas.
        </p>

        <div className="row">
          {/* 1. Checkout Pro */}
          <button ref={btnCheckoutRef} className="pill" onClick={() => setCheckoutOpen(true)}>
            <span className="con-icono">
              <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2l.01.002L6 2a2 2 0 0 1 2 2v2h8V4a2 2 0 0 1 2-2h.01M3 6h18a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1zm6 4v2a3 3 0 0 0 6 0v-2"/></svg>
              <span>Plan Pro — $29/mes</span>
            </span>
          </button>

          {/* 2. Invitar colaboradores */}
          <button ref={btnInviteRef} className="pill" onClick={() => setInviteOpen(true)}>
            <span className="con-icono">
              <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>
              <span>Invitar colaboradores</span>
            </span>
          </button>

          {/* 3. Barra de Filtros y Búsqueda */}
          <div className="search-filter-pill">
            <div ref={searchBoxWrapRef} className="search-filter-input-wrap con-icono">
              <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6 -6"/></svg>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Buscar comercio..." className="search-filter-input" autoComplete="off" />
            </div>
            <div className="search-filter-divider"></div>
            <button type="button" className="search-filter-btn" onClick={() => setSearchOpen(true)}>
              <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4"/></svg>
              <span>Filtros</span>
            </button>
          </div>

          {/* 4. Confirmación destructiva */}
          <button ref={btnDeleteRef} className="btn-danger" onClick={() => setDeleteOpen(true)}>
            <span className="con-icono">
              <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12M9 7V4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>
              <span>Eliminar Proyecto</span>
            </span>
          </button>
        </div>

        {/* Modal 1: Checkout */}
        <WissPopMorph
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          originRef={btnCheckoutRef}
          label={btnCheckoutRef.current?.querySelector(".con-icono")}
          placement="center"
          flyingTextClass="flying"
          contentStagger
          contentAnimation="slide-up"
          ease="power3.out"
          duration={0.6}
          closeButton
          swipeToClose
          modalClass="panel"
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "25rem" }}>
              <h3 className="con-icono" data-wisspop-title style={{ marginBottom: "0.25rem" }}>
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2l.01.002L6 2a2 2 0 0 1 2 2v2h8V4a2 2 0 0 1 2-2h.01M3 6h18a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1zm6 4v2a3 3 0 0 0 6 0v-2"/></svg>
                <span>Plan Pro — $29/mes</span>
              </h3>
              <p className="nota" style={{ marginBottom: "0.75rem" }}>
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                <span>Acceso ilimitado a todas las herramientas de animación.</span>
              </p>
              
              <label>Método de pago preferido</label>
              <div className="payment-options">
                <div className="payment-card">Tarjeta Crédito</div>
                <div className="payment-card">Apple Pay</div>
                <div className="payment-card">PayPal</div>
                <div className="payment-card">Google Pay</div>
              </div>

              <label>Correo de facturación</label>
              <input type="email" defaultValue="alex@acme-design.studio" />

              <button style={{ width: "100%", background: "var(--accent)", color: "#fff", fontWeight: 700, padding: "0.75rem", border: "none", borderRadius: "10px", marginTop: "0.5rem" }} onClick={close}>
                Confirmar Suscripción ($29)
              </button>
            </div>
          )}
        </WissPopMorph>

        {/* Modal 2: Invitar */}
        <WissPopMorph
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          originRef={btnInviteRef}
          label={btnInviteRef.current?.querySelector(".con-icono")}
          placement="center"
          flyingTextClass="flying"
          contentAnimation="scale"
          ease="back.out(1.5)"
          duration={0.55}
          closeButton
          swipeToClose
          modalClass="panel"
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "23rem" }}>
              <h3 className="con-icono" data-wisspop-title>
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>
                <span>Invitar colaboradores</span>
              </h3>
              <p className="nota">
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                <span>Comparte acceso a tus componentes con tu equipo.</span>
              </p>
              
              <label>Correo electrónico</label>
              <input type="email" placeholder="companero@empresa.com" />
              
              <label>Rol asignado</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <button style={{ flex: 1, padding: "0.4rem", fontSize: "0.85rem", borderColor: "var(--accent)", color: "var(--accent)" }}>Editor</button>
                <button style={{ flex: 1, padding: "0.4rem", fontSize: "0.85rem" }}>Admin</button>
                <button style={{ flex: 1, padding: "0.4rem", fontSize: "0.85rem" }}>Lector</button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button onClick={close}>Cancelar</button>
                <button style={{ background: "var(--accent)", color: "#fff", fontWeight: 600 }} onClick={close}>Enviar invitación</button>
              </div>
            </div>
          )}
        </WissPopMorph>

        {/* Modal 3: Filtros */}
        <WissPopMorph
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          originRef={searchBoxWrapRef.current?.closest(".search-filter-pill")}
          label={searchBoxWrapRef.current}
          placement="center"
          flyingTextClass="flying"
          contentAnimation="slide-down"
          swipeToClose
          modalClass="panel filter-modal-panel"
        >
          {({ close }) => (
            <>
              <div className="filter-modal-header">
                <div className="filter-modal-search-wrap con-icono" data-wisspop-title>
                  <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6 -6"/></svg>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="text" className="filter-modal-input" placeholder="Buscar comercio..." autoFocus />
                </div>
                <button type="button" className="filter-close-btn" aria-label="Cerrar" onClick={close}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="filter-col" style={{ gap: "1.15rem" }}>
                <div className="filter-group">
                  <label className="filter-label">RANGO DE FECHA</label>
                  <button type="button" className="filter-select-btn">
                    <span>Cualquier Fecha</span>
                    <svg className="ico chevron" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                </div>

                <div className="filter-group">
                  <label className="filter-label">TIPO DE MOVIMIENTOS</label>
                  <button type="button" className="filter-select-btn">
                    <span>Todos los Tipos</span>
                    <svg className="ico chevron" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                </div>

                <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button style={{ padding: "0.45rem 0.9rem", borderRadius: "8px" }} onClick={close}>Cancelar</button>
                  <button style={{ padding: "0.45rem 1.1rem", borderRadius: "8px", background: "var(--accent)", color: "#fff", fontWeight: 600 }} onClick={close}>Aplicar Filtros</button>
                </div>
              </div>
            </>
          )}
        </WissPopMorph>

        {/* Modal 4: Eliminar */}
        <WissPopMorph
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          originRef={btnDeleteRef}
          label={btnDeleteRef.current?.querySelector(".con-icono")}
          placement="center"
          flyingTextClass="flying"
          contentAnimation="fade"
          ease="power3.out"
          duration={0.45}
          closeButton
          swipeToClose
          modalClass="panel"
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "22rem" }}>
              <h3 className="con-icono" data-wisspop-title style={{ color: "#dc2626" }}>
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12M9 7V4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>
                <span>Eliminar Proyecto</span>
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", margin: "0.75rem 0 1.25rem", lineHeight: 1.4 }}>
                ¿Estás seguro de que deseas eliminar este proyecto? Esta acción destruirá todas las vistas y no se puede deshacer.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={close}>Cancelar</button>
                <button className="btn-danger" onClick={close}>Sí, eliminar</button>
              </div>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 8 · Cerrar con el gesto */}
      <section>
        <h2>Cerrar con el gesto</h2>
        <p className="hint">
          <code>swipeToClose: true</code> — arrastrá el panel con el mouse o el dedo hacia cualquier lado.
        </p>

        <div className="row">
          <button ref={swipeBtnRef} onClick={() => setSwipeOpen(true)}>Arrastrame para cerrar</button>
        </div>

        <WissPopMorph
          open={swipeOpen}
          onClose={() => setSwipeOpen(false)}
          originRef={swipeBtnRef}
          placement="center"
          modalClass="panel"
          swipeToClose
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "20rem" }}>
              <h3>Arrastrame</h3>
              <p className="nota">
                Hacia cualquier lado, con el mouse o el dedo. Si soltás antes del umbral, vuelve solo.
              </p>
              <button onClick={close}>O cerrame así</button>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 9 · FlipModal — Elementos compartidos */}
      <section>
        <h2>FlipModal — Elementos compartidos</h2>
        <p className="hint">
          Los elementos con <code>data-flip-id</code> viajan del origen al modal conservando su identidad visual.
        </p>

        <div className="row">
          <WissPopFlip flipId="demo" closeButton swipeToClose>
            {({ open, close }) => (
              <>
                <div
                  data-flip-id="demo-card"
                  className="card-demo"
                  style={{ cursor: "pointer", padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", width: "16rem" }}
                  onClick={open}
                >
                  <img data-flip-id="demo-img" src="/gato.jpg" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "0.5rem" }} alt="" />
                  <h3 data-flip-id="demo-title" style={{ marginTop: "0.5rem", fontSize: "1.1rem" }}>Gato Viajero</h3>
                  <p className="trigger-fade-item-demo" style={{ fontSize: "0.85rem", color: "#888" }}>Clic para expandir detalle</p>
                </div>

                <WissPopFlip.Modal>
                  <div data-flip-id="demo-card" className="panel" style={{ padding: "1.5rem", width: "24rem", maxWidth: "90vw" }}>
                    <img data-flip-id="demo-img" src="/gato.jpg" style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "0.75rem" }} alt="" />
                    <h3 data-flip-id="demo-title" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Gato Viajero</h3>
                    <p className="modal-fade-item-demo" style={{ marginTop: "0.5rem", color: "#aaa", lineHeight: 1.4 }}>
                      Esta foto y título viajaron directamente desde la tarjeta usando GSAP Flip.
                    </p>
                    <button className="modal-fade-item-demo" style={{ marginTop: "1rem" }} onClick={close}>Cerrar</button>
                  </div>
                </WissPopFlip.Modal>
              </>
            )}
          </WissPopFlip>
        </div>
      </section>

      {/* 10 · DropdownPanel — Despliegue elástico */}
      <section>
        <h2>DropdownPanel — Despliegue elástico</h2>
        <p className="hint">
          Animación elástica ligera con <code>enterDropdownAnimation</code> y <code>leaveDropdownAnimation</code>.
        </p>

        <div ref={dropdownRowRef} className="row" style={{ position: "relative" }}>
          <button ref={ddDownBtn} data-dir="down" onClick={() => toggleDropdownDir("down", ddDownBtn.current)}>↓ Abajo</button>
          <button ref={ddUpBtn} data-dir="up" onClick={() => toggleDropdownDir("up", ddUpBtn.current)}>↑ Arriba</button>
          <button ref={ddRightBtn} data-dir="right" onClick={() => toggleDropdownDir("right", ddRightBtn.current)}>→ Derecha</button>
          <button ref={ddLeftBtn} data-dir="left" onClick={() => toggleDropdownDir("left", ddLeftBtn.current)}>← Izquierda</button>

          <div ref={dropdownPanelRef} className="panel" style={{ display: "none", position: "absolute", padding: "0.75rem 1rem", zIndex: 50 }}>
            <ul className="menu" style={{ margin: 0, padding: 0, listStyle: "none" }}>
              <li onClick={closeDropdown}>Opción 1</li>
              <li onClick={closeDropdown}>Opción 2</li>
              <li onClick={closeDropdown}>Opción 3</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 11 · Tipos de animación de contenido */}
      <section>
        <h2>Tipos de animación de contenido (<code>contentAnimation</code>)</h2>
        <p className="hint">
          El contenedor morph se expande físicamente mientras el contenido interior entra con la transición seleccionada: <code>slide-up</code> (por defecto), <code>slide-down</code>, <code>scale</code>, <code>fade</code> o <code>none</code>.
        </p>

        <div className="row">
          {["slide-up", "slide-down", "scale", "fade", "none"].map((anim) => (
            <button
              key={anim}
              ref={(el) => (contentAnimBtnRefs.current[anim] = el)}
              onClick={() => openContentAnim(anim)}
            >
              {anim} {anim === "slide-up" ? "(Default)" : anim === "scale" ? "(Zoom in)" : anim === "fade" ? "(Opacidad)" : anim === "none" ? "(Inmediato)" : ""}
            </button>
          ))}
        </div>

        <WissPopMorph
          open={contentAnimOpen}
          onClose={() => setContentAnimOpen(false)}
          originRef={contentAnimOrigin}
          placement="center"
          contentAnimation={contentAnimType}
          modalClass="panel"
          closeButton
          swipeToClose
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "22rem" }}>
              <h3>Animación: <span className="tag-pill">{contentAnimType}</span></h3>
              <p className="nota">
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                <span>Transición configurada mediante <code>contentAnimation: "{contentAnimType}"</code>.</span>
              </p>
              <button onClick={close}>Cerrar modal</button>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 12 · Cascada Stagger */}
      <section>
        <h2>Cascada de elementos (<code>contentStagger</code>)</h2>
        <p className="hint">
          <code>contentStagger: true</code> aplica automáticamente una cascada fluida con retardos progresivos (30ms) en cada uno de los elementos hijos.
        </p>

        <div className="row">
          <button ref={btnStaggerRef} className="pill" onClick={() => setStaggerOpen(true)}>Abrir lista con Stagger</button>
        </div>

        <WissPopMorph
          open={staggerOpen}
          onClose={() => setStaggerOpen(false)}
          originRef={btnStaggerRef}
          placement="center"
          contentStagger
          modalClass="panel"
          closeButton
          swipeToClose
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "24rem" }}>
              <h3>Efecto Cascada (Stagger)</h3>
              <p className="nota">
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                <span>Cada hijo entra con un delay escalonado de 30ms.</span>
              </p>
              <div className="stagger-demo-list">
                <div className="stagger-item">
                  <span>✨ Notificación del sistema</span>
                  <span className="badge">Nuevo</span>
                </div>
                <div className="stagger-item">
                  <span>📦 Paquete v0.1.9 publicado</span>
                  <span className="badge">NPM</span>
                </div>
                <div className="stagger-item">
                  <span>🚀 Optimización GPU 120 FPS</span>
                  <span className="badge">Core</span>
                </div>
                <div className="stagger-item">
                  <span>📱 Soporte móvil y táctil</span>
                  <span className="badge">Móvil</span>
                </div>
                <div className="stagger-item">
                  <span>⚡ Animación CSS desacoplada</span>
                  <span className="badge">CSS</span>
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button onClick={close}>Entendido</button>
              </div>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 13 · Curvas y Física de Aceleración */}
      <section>
        <h2>Curvas y Física de Aceleración (<code>ease</code> / <code>closeEase</code>)</h2>
        <p className="hint">
          Control completo sobre la física del morph usando curvas GSAP en apertura (<code>ease</code>) y cierre (<code>closeEase</code>).
        </p>

        <div className="row">
          {EASES.map((item) => (
            <button
              key={item.ease}
              ref={(el) => (easeBtnRefs.current[item.ease] = el)}
              onClick={() => openEase(item)}
            >
              {item.ease} {item.label}
            </button>
          ))}
        </div>

        <WissPopMorph
          open={easeOpen}
          onClose={() => setEaseOpen(false)}
          originRef={easeOrigin}
          placement="center"
          ease={currentEaseConfig.ease}
          closeEase={currentEaseConfig.closeEase}
          duration={currentEaseConfig.dur}
          closeDuration={currentEaseConfig.closeDur}
          modalClass="panel"
          closeButton
          swipeToClose
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "23rem" }}>
              <h3>Curva: <span className="tag-pill">{currentEaseConfig.ease}</span></h3>
              <p className="nota">
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                <span>{currentEaseConfig.desc}</span>
              </p>
              <div style={{ padding: "0.75rem", background: "var(--sunken)", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                <div><code>ease: "{currentEaseConfig.ease}"</code></div>
                <div style={{ marginTop: "0.3rem" }}><code>closeEase: "{currentEaseConfig.closeEase}"</code></div>
              </div>
              <button onClick={close}>Cerrar y ver closeEase</button>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 14 · Rendimiento Móvil */}
      <section>
        <h2>Rendimiento Móvil y Pantalla Completa (<code>fullscreenOnMobile</code>)</h2>
        <p className="hint">
          <code>fullscreenOnMobile: true</code> adapta automáticamente el modal a pantalla completa en dispositivos móviles, desactiva blur gaussiano pesado y optimiza VRAM.
        </p>

        <div className="row">
          <button ref={btnMobilePerfRef} className="pill" onClick={() => setMobilePerfOpen(true)}>Modal Optimizado Móvil</button>
        </div>

        <WissPopMorph
          open={mobilePerfOpen}
          onClose={() => setMobilePerfOpen(false)}
          originRef={btnMobilePerfRef}
          placement="center"
          fullscreenOnMobile
          contentBlur={false}
          closeButton
          swipeToClose
          modalClass="panel"
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "24rem", maxWidth: "100%" }}>
              <h3>Optimización Móvil (120 FPS)</h3>
              <p className="nota">
                <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
                <span>En pantallas menores a 640px, este modal se abre a pantalla completa con aceleración por capa GPU nativa.</span>
              </p>
              <ul style={{ fontSize: "0.85rem", color: "var(--muted)", paddingLeft: "1.2rem", margin: "0.75rem 0 1.25rem" }}>
                <li><strong>GPU Layer Promotion:</strong> <code>transform: translateZ(0)</code></li>
                <li><strong>Layout Containment:</strong> <code>contain: layout paint</code></li>
                <li><strong>Dynamic VRAM:</strong> will-change liberado tras la animación</li>
                <li><strong>Gesture swipe:</strong> arrastre táctil para descartar</li>
              </ul>
              <button onClick={close}>Cerrar modal</button>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 15 · Pantalla completa en PC y Móvil */}
      <section>
        <h2>Pantalla completa en PC y Móvil (<code>placement: "fullscreen"</code>)</h2>
        <p className="hint">
          <code>placement: "fullscreen"</code> expande el modal al <strong>100% exacto del viewport (100vw × 100vh)</strong> tanto en PC de escritorio como en cualquier dispositivo.
        </p>

        <div className="row">
          <button ref={btnPcFsRef} className="pill" onClick={() => setPcFsOpen(true)}>
            <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-12zM7 20h10M9 16v4M15 16v4"/></svg>
            <span>Dashboard Pantalla Completa (PC)</span>
          </button>

          <button ref={btnPcFsPillRef} className="btn-plan" onClick={() => setInmersivaOpen(true)}>
            <span className="con-icono">
              <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>
              <span>Experiencia Inmersiva</span>
            </span>
          </button>
        </div>

        {/* Modal Fullscreen 1: Dashboard */}
        <WissPopMorph
          open={pcFsOpen}
          onClose={() => setPcFsOpen(false)}
          originRef={btnPcFsRef}
          placement="fullscreen"
          contentAnimation="scale"
          ease="power3.out"
          duration={0.5}
          closeButton
          swipeToClose
          modalClass="fullscreen-modal"
        >
          {({ close }) => (
            <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", boxSizing: "border-box", overflowY: "auto" }}>
              <header className="fs-nav" style={{ paddingRight: "4rem" }}>
                <h2>
                  <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-12zM7 20h10M9 16v4M15 16v4"/></svg>
                  <span>Panel de Control — 100% Pantalla Completa</span>
                </h2>
                <span className="tag-pill">100vw × 100vh</span>
              </header>

              <main className="fs-container">
                <p className="lead">
                  Este modal ocupa el 100% del ancho y alto de la pantalla (100vw × 100vh) en PC de escritorio y monitores de cualquier resolución.
                </p>

                <div className="fs-grid">
                  <div className="fs-card">
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Peticiones / Seg</div>
                    <div className="stat">14.2k</div>
                    <div style={{ fontSize: "0.8rem", color: "#16a34a" }}>↑ +18.4% vs ayer</div>
                  </div>
                  <div className="fs-card">
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>FPS de Render</div>
                    <div className="stat">120 FPS</div>
                    <div style={{ fontSize: "0.8rem", color: "#16a34a" }}>⚡ GPU Acelerada</div>
                  </div>
                  <div className="fs-card">
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Memoria VRAM</div>
                    <div className="stat">0 MB</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Liberada a "auto"</div>
                  </div>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                  <button className="pill" onClick={close}>Cerrar vista completa</button>
                </div>
              </main>
            </div>
          )}
        </WissPopMorph>

        {/* Modal Fullscreen 2: Experiencia Inmersiva */}
        <WissPopMorph
          open={inmersivaOpen}
          onClose={() => setInmersivaOpen(false)}
          originRef={btnPcFsPillRef}
          label={btnPcFsPillRef.current?.querySelector(".con-icono")}
          placement="fullscreen"
          flyingTextClass="flying"
          contentStagger
          ease="power3.out"
          closeEase="power2.inOut"
          duration={0.65}
          closeDuration={0.65}
          closeButton
          swipeToClose
          modalClass="fullscreen-modal"
        >
          {({ close }) => (
            <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", boxSizing: "border-box", overflowY: "auto" }}>
              <header className="fs-nav" style={{ paddingRight: "4rem" }}>
                <h2 className="con-icono" data-wisspop-title style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                  <svg className="ico" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>
                  <span>Experiencia Inmersiva</span>
                </h2>
                <span className="tag-pill">GSAP Flying + Fullscreen</span>
              </header>

              <main className="fs-container">
                <div className="stagger-demo-list" style={{ marginTop: "1rem" }}>
                  <div className="stagger-item" style={{ padding: "1.25rem" }}>
                    <span>🌐 1. El botón de origen se expandió al 100% de la pantalla del monitor.</span>
                    <span className="badge">Viewport 100vw</span>
                  </div>
                  <div className="stagger-item" style={{ padding: "1.25rem" }}>
                    <span>✨ 2. El título voló desde el botón hasta el encabezado superior.</span>
                    <span className="badge">GSAP Flying</span>
                  </div>
                  <div className="stagger-item" style={{ padding: "1.25rem" }}>
                    <span>⚡ 3. Todas las tarjetas hijas entraron en cascada progresiva de 30ms.</span>
                    <span className="badge">Stagger CSS</span>
                  </div>
                  <div className="stagger-item" style={{ padding: "1.25rem" }}>
                    <span>🛡️ 4. Al cerrar, regresa limpiamente al botón original sin distorsiones.</span>
                    <span className="badge">Morph Core</span>
                  </div>
                </div>

                <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
                  <button className="pill" style={{ fontSize: "1.1rem", padding: "0.8rem 2rem" }} onClick={close}>
                    Regresar al sitio
                  </button>
                </div>
              </main>
            </div>
          )}
        </WissPopMorph>
      </section>

      {/* 16 · Scroll con el panel abierto */}
      <section>
        <h2>Scroll con el panel abierto</h2>
        <p className="hint">
          Depende de si la posición del panel depende del origen. Los anclados
          (<code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>,
          <code>origin</code>) <strong>siguen al botón</strong> al scrollear.
        </p>
      </section>

      {/* 17 · Alto reactivo */}
      <section>
        <h2>Alto reactivo</h2>
        <p className="hint">
          Los botones dentro del modal de auth ejercitan lo difícil:
          <code>resync()</code> reajusta el alto cuando aparece un error, y
          <code>changeView()</code> cambia de vista sin cerrar.
        </p>
      </section>
    </main>
  );
}

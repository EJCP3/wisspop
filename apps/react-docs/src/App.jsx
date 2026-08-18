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
  /** Qué viaja: un string o el nodo real del botón, que el core clona. */
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
    // Qué viaja. Un nodo montado trae su propio rect, así que el despegue es
    // exacto y no hace falta adivinarlo con `labelOffsetX` (solo texto suelto).
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

  // --- 7. Swipe ---
  const [swipeOpen, setSwipeOpen] = useState(false);
  const swipeBtnRef = useRef(null);

  // --- 9. Dropdown ---
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

  return (
    <main className="page">
      <header>
        <h1>WissPop — React Docs</h1>
        <p className="lead">
          El panel no aparece de la nada: nace del elemento que lo abrió y vuelve a él al cerrarse.
        </p>

        <p className="note">
          Esta página está construida con componentes nativos de React 18 (<code>wisspop/react</code>):
          <code>WissPopMorph</code>, <code>WissPopPill</code> y <code>WissPopFlip</code>.
        </p>
      </header>

      {/* 1 · Anclado a un botón */}
      <section>
        <h2>Anclado a un botón</h2>
        <p className="hint">
          El panel nace del botón y se abre hacia el lado que le pidas. <code>align</code> es la
          posición sobre el <strong>eje cruzado</strong>: con el panel arriba o abajo alinea en
          horizontal, y al costado alinea en vertical. Por eso acepta los dos vocabularios —
          <code>left</code>/<code>top</code>/<code>start</code> pegan al inicio,
          <code>right</code>/<code>bottom</code>/<code>end</code> al final.
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
                {item.etiqueta}
              </button>
            );
          })}
        </div>

        <p className="hint">
          Ninguno puede taparse a sí mismo ni salirse: el panel se acota al espacio libre de su
          lado —el alto si va arriba o abajo, el ancho si va al costado— y después al margen de
          la ventana.
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
          El radio del origen se lee del CSS y se acota a la mitad del lado menor, así que un
          círculo se abre como círculo. <code>ease: "power3.out"</code> — sin overshoot, porque
          en un panel grande el rebote se lee como «salió más grande de lo que debía».
        </p>

        <div className="row">
          <button ref={fabBtnRef} className="round" onClick={() => setFabOpen(true)}>
            +
          </button>
        </div>

        <WissPopMorph
          open={fabOpen}
          onClose={() => setFabOpen(false)}
          originRef={fabBtnRef.current}
          placement="center"
          ease="power3.out"
          duration={0.65}
          modalClass="panel"
          swipeToClose
        >
          {({ close }) => (
            <div className="panel-body" style={{ width: "22rem" }}>
              <h3>
                <span data-wisspop-title>+</span> Nuevo movimiento
              </h3>
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
          <code>placement: "origin"</code> — el panel comparte el centro con el botón y crece
          ahí mismo, sin viajar al medio de la pantalla. Útil cuando el botón ya está donde el
          usuario está mirando y moverlo rompería el hilo. Si el botón está pegado a un borde,
          el panel se mete en la ventana respetando el margen.
        </p>

        <div className="row">
          <button ref={inlineBtnRef} onClick={() => setInlineOpen(true)}>
            Renombrar
          </button>
        </div>

        <WissPopMorph
          open={inlineOpen}
          onClose={() => setInlineOpen(false)}
          originRef={inlineBtnRef.current}
          placement="origin"
          modalClass="panel"
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
          <code>drawer-left</code> · <code>drawer-right</code> · <code>drawer-top</code> ·
          <code>drawer-bottom</code> — pegado a su borde, ocupando todo el eje largo: los
          laterales toman el alto completo y los de arriba y abajo, el ancho completo. Ignoran
          <code>margin</code> a propósito, porque un cajón despegado del borde no es un cajón.
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
          El label del botón sale a 14px, viaja por la pantalla creciendo, y aterriza justo
          encima del elemento marcado con <code>data-wisspop-title</code>, que en ese momento toma
          el relevo. El destino <strong>se mide</strong>: el título puede estar en cualquier
          parte del contenido y no hay ni un offset hardcodeado.
        </p>

        <div className="row">
          <h3>Modal center</h3>
          <button ref={authCenterRef} className="pill" onClick={() => openAuth("center")}>
            Crear cuenta
          </button>
          <h3>Modal origin</h3>
          <button ref={authOriginRef} className="pill" onClick={() => openAuth("origin")}>
            Crear cuenta
          </button>
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
          Lo que viaja puede ser texto, un nodo, o las dos cosas. El core elige cómo escalarlo:
          con texto anima <code>font-size</code> y sin texto anima <code>width</code>/<code>height</code>.
        </p>

        <div className="row">
          <button ref={fTextoBtnRef} className="pill" onClick={() => openFormat("texto")}>
            Solo texto
          </button>
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
                    <span>Sin texto que escalar, el core pasa a <code>box</code>: anima <code>width</code>/<code>height</code>.</span>
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

      {/* 7 · Cerrar con el gesto */}
      <section>
        <h2>Cerrar con el gesto</h2>
        <p className="hint">
          <code>swipeToClose: true</code> — arrastrá el panel con el mouse o el dedo hacia
          cualquier lado, como una notificación de celular. Pasado el umbral se va para donde lo
          tiraste; si soltás antes, vuelve solo a su lugar.
        </p>

        <div className="row">
          <button ref={swipeBtnRef} onClick={() => setSwipeOpen(true)}>
            Arrastrame para cerrar
          </button>
        </div>

        <WissPopMorph
          open={swipeOpen}
          onClose={() => setSwipeOpen(false)}
          originRef={swipeBtnRef.current}
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

      {/* 8 · FlipModal — Elementos compartidos */}
      <section>
        <h2>FlipModal — Elementos compartidos</h2>
        <p className="hint">
          Los elementos con <code>data-flip-id</code> viajan del origen al modal conservando su identidad visual.
        </p>

        <div className="row">
          <WissPopFlip
            flipId="demo"
            closeButton
            swipeToClose
            
            trigger={(open) => (
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
            )}
          >
            {(close) => (
              <div data-flip-id="demo-card" className="panel" style={{ padding: "1.5rem", width: "24rem", maxWidth: "90vw" }}>
                <img data-flip-id="demo-img" src="/gato.jpg" style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "0.75rem" }} alt="" />
                <h3 data-flip-id="demo-title" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Gato Viajero</h3>
                <p className="modal-fade-item-demo" style={{ marginTop: "0.5rem", color: "#aaa", lineHeight: "1.4" }}>
                  Esta foto y título viajaron directamente desde la tarjeta usando GSAP Flip.
                </p>
                {/* Marcado como contenido secundario: no existe en el trigger, así
                    que sin esto sobra dentro de la tarjeta chica y cuelga fuera
                    de ella durante todo el vuelo. */}
                <button className="modal-fade-item-demo" style={{ marginTop: "1rem" }} onClick={close}>Cerrar</button>
              </div>
            )}
          </WissPopFlip>
        </div>
      </section>

      {/* 9 · DropdownPanel — Despliegue elástico */}
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

      {/* 10 · Scroll con el panel abierto */}
      <section>
        <h2>Scroll con el panel abierto</h2>
        <p className="hint">
          Depende de si la posición del panel depende del origen. Los anclados
          (<code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>,
          <code>origin</code>) <strong>siguen al botón</strong> al scrollear.
        </p>
      </section>

      {/* 11 · Alto reactivo */}
      <section>
        <h2>Alto reactivo</h2>
        <p className="hint">
          Los botones dentro del modal de arriba ejercitan lo difícil:
          <code>resync()</code> reajusta el alto cuando aparece un error, y
          <code>changeView()</code> cambia de vista sin cerrar.
        </p>
      </section>
    </main>
  );
}

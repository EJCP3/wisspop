<template>
  <main class="page">
    <header>
      <h1>WissPop — Vue Docs</h1>
      <p class="lead">
        El panel no aparece de la nada: nace del elemento que lo abrió y vuelve a él al cerrarse.
      </p>
      <p class="note">
        Esta página está construida con componentes nativos de Vue 3 (<code>wisspop/vue</code>):
        <code>WissPopMorph</code>, <code>WissPopPill</code> y <code>WissPopFlip</code>.
      </p>
    </header>

    <!-- 1 · Anclado a un botón -->
    <section>
      <h2>Anclado a un botón</h2>
      <p class="hint">
        El panel nace del botón y se abre hacia el lado que le pidas. <code>align</code> es la
        posición sobre el <strong>eje cruzado</strong>: con el panel arriba o abajo alinea en
        horizontal, y al costado alinea en vertical. Por eso acepta los dos vocabularios —
        <code>left</code>/<code>top</code>/<code>start</code> pegan al inicio,
        <code>right</code>/<code>bottom</code>/<code>end</code> al final.
      </p>

      <div class="matriz">
        <button
          v-for="item in ANCLADOS"
          :key="item.placement + item.align"
          :ref="(el) => setAncladoRef(item.placement + item.align, el)"
          @click="openAnclado(item.placement, item.align)"
        >
          {{ item.etiqueta }}
        </button>
      </div>

      <p class="hint">
        Ninguno puede taparse a sí mismo ni salirse: el panel se acota al espacio libre de su
        lado —el alto si va arriba o abajo, el ancho si va al costado— y después al margen de
        la ventana.
      </p>

      <WissPopMorph
        v-model="ancladoOpen"
        :origin-ref="ancladoOrigin"
        :placement="ancladoPlacement"
        :align="ancladoAlign"
        modal-class="panel"
        swipe-to-close
      >
        <template #default="{ close }">
          <ul class="menu">
            <li @click="close">Más recientes</li>
            <li @click="close">Más antiguos</li>
            <li @click="close">Mayor monto</li>
          </ul>
        </template>
      </WissPopMorph>
    </section>

    <!-- 2 · Desde un botón circular -->
    <section>
      <h2>Desde un botón circular</h2>
      <p class="hint">
        El radio del origen se lee del CSS y se acota a la mitad del lado menor, así que un
        círculo se abre como círculo. <code>ease: "power3.out"</code> — sin overshoot, porque
        en un panel grande el rebote se lee como «salió más grande de lo que debía».
      </p>

      <div class="row">
        <button ref="fabBtnRef" class="round" @click="fabOpen = true">+</button>
      </div>

      <WissPopMorph
        v-model="fabOpen"
        :origin-ref="fabBtnRef"
        placement="center"
        ease="power3.out"
        :duration="0.65"
        modal-class="panel"
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 22rem;">
            <h3><span data-wisspop-title>+</span> Nuevo movimiento</h3>
            <label>Concepto</label>
            <input placeholder="Café" />
            <label>Monto</label>
            <input placeholder="2500" />
            <button @click="close">Guardar</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 3 · Crecer en el lugar -->
    <section>
      <h2>Crecer en el lugar</h2>
      <p class="hint">
        <code>placement: "origin"</code> — el panel comparte el centro con el botón y crece
        ahí mismo, sin viajar al medio de la pantalla. Útil cuando el botón ya está donde el
        usuario está mirando y moverlo rompería el hilo. Si el botón está pegado a un borde,
        el panel se mete en la ventana respetando el margen.
      </p>

      <div class="row">
        <button ref="inlineBtnRef" @click="inlineOpen = true">Renombrar</button>
      </div>

      <WissPopMorph
        v-model="inlineOpen"
        :origin-ref="inlineBtnRef"
        placement="origin"
        modal-class="panel"
        close-button
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 20rem;">
            <h3>Renombrar</h3>
            <label>Nombre</label>
            <input placeholder="Supermercado" />
            <button @click="close">Listo</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 4 · Drawer -->
    <section>
      <h2>Drawer</h2>
      <p class="hint">
        <code>drawer-left</code> · <code>drawer-right</code> · <code>drawer-top</code> ·
        <code>drawer-bottom</code> — pegado a su borde, ocupando todo el eje largo: los
        laterales toman el alto completo y los de arriba y abajo, el ancho completo. Ignoran
        <code>margin</code> a propósito, porque un cajón despegado del borde no es un cajón.
      </p>

      <div class="row">
        <button
          v-for="lado in ['left', 'right', 'top', 'bottom']"
          :key="lado"
          :ref="(el) => setDrawerBtnRef(lado, el)"
          @click="openDrawer(lado)"
        >
          drawer-{{ lado }}
        </button>
      </div>

      <WissPopMorph
        v-model="drawerOpen"
        :origin-ref="drawerOrigin"
        :placement="drawerPlacement"
        :modal-class="`panel drawer drawer-${drawerLado}`"
        swipe-to-close
      >
        <template #default="{ close }">
          <ul class="menu">
            <li @click="close">Inicio</li>
            <li @click="close">Movimientos</li>
            <li @click="close">Presupuestos</li>
            <li @click="close">Ajustes</li>
          </ul>
        </template>
      </WissPopMorph>
    </section>

    <!-- 5 · Texto viajero -->
    <section>
      <h2>Texto viajero</h2>
      <p class="hint">
        El label del botón sale a 14px, viaja por la pantalla creciendo, y aterriza justo
        encima del elemento marcado con <code>data-wisspop-title</code>, que en ese momento toma
        el relevo. El destino <strong>se mide</strong>: el título puede estar en cualquier
        parte del contenido y no hay ni un offset hardcodeado.
      </p>

      <div class="row">
        <h3>Modal center</h3>
        <button ref="authCenterRef" class="pill" @click="openAuth('center')">Crear cuenta</button>
        <h3>Modal origin</h3>
        <button ref="authOriginRef" class="pill" @click="openAuth('origin')">Crear cuenta</button>
      </div>

      <WissPopPill ref="authPillRef" modal-class="pill-panel">
        <template #default="{ titleReady, close }">
          <div class="pill-body">
            <h2 data-wisspop-title :style="{ opacity: titleReady ? 1 : 0 }">
              {{ authVista === 'signup' ? 'Crear cuenta' : 'Iniciar sesión' }}
            </h2>
            <label>Email</label>
            <input placeholder="hola@ejemplo.com" />
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" />
            <template v-if="authVista === 'signup'">
              <label>Repetir contraseña</label>
              <input type="password" placeholder="••••••••" />
            </template>
            <p v-if="authError" class="error">Las contraseñas no coinciden.</p>
            <button @click="close">Continuar</button>
            <button class="switch" @click="toggleAuthError">
              {{ authError ? 'Ocultar error' : 'Mostrar un error (resync)' }}
            </button>
            <button class="switch" @click="toggleAuthVista">
              {{ authVista === 'signup' ? 'Ya tengo cuenta' : 'Quiero crear una cuenta' }}
            </button>
          </div>
        </template>
      </WissPopPill>
    </section>

    <!-- 6 · Formatos del elemento viajero -->
    <section>
      <h2>Formatos del elemento viajero</h2>
      <p class="hint">
        Lo que viaja puede ser texto, un nodo, o las dos cosas. El core elige cómo escalarlo:
        con texto anima <code>font-size</code> y sin texto anima <code>width</code>/<code>height</code>.
      </p>

      <div class="row">
        <button ref="fTextoBtnRef" class="pill" @click="openFormat('texto')">Solo texto</button>
        <button ref="fMixtoBtnRef" class="pill" @click="openFormat('mixto')">
          <span class="con-icono">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
            </svg>
            <span>Me gusta</span>
          </span>
        </button>
        <button ref="fIconoBtnRef" class="round" @click="openFormat('icono')">
          <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" />
          </svg>
        </button>
        <button ref="fImagenBtnRef" class="avatar-btn" @click="openFormat('imagen')">
          <img src="/gato.jpg" alt="" />
        </button>
      </div>

      <WissPopMorph
        v-model="formatOpen"
        :origin-ref="formatOrigin"
        :label="formatLabel"
        placement="center"
        ease="power3.out"
        :duration="0.65"
        modal-class="panel"
        flying-text-class="flying"
        swipe-to-close
      >
        <template #default="{ close }">
          <div v-if="formatTipo === 'texto'" class="panel-body" style="width: 21rem;">
            <h3><span data-wisspop-title>Solo texto</span></h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>No hay nodo que medir, así que el punto de partida sale de <code>labelOffsetX</code>.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>

          <div v-else-if="formatTipo === 'mixto'" class="panel-body" style="width: 21rem;">
            <h3>
              <span data-wisspop-title class="con-icono">
                <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>
                <span>Me gusta</span>
              </span>
            </h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>El icono va en <code>em</code>: crece junto con el texto sin ninguna cuenta aparte.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>

          <div v-else-if="formatTipo === 'icono'" class="panel-body" style="width: 21rem;">
            <h3>
              <span data-wisspop-title class="ico-destino">
                <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" /></svg>
              </span>
            </h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Sin texto que escalar, el core pasa a <code>box</code>: anima <code>width</code>/<code>height</code>.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>

          <div v-else-if="formatTipo === 'imagen'" class="panel-body" style="width: 21rem;">
            <span data-wisspop-title class="foto-destino"><img src="/gato.jpg" alt="" /></span>
            <h3>No hace nada, HD</h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Despega desde el rect medido de la miniatura y aterriza en el tamaño del destino.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 7 · Casos de uso avanzados con elemento viajero -->
    <section>
      <h2>Casos de uso avanzados con elemento viajero</h2>
      <p class="hint">
        El elemento viajero convierte acciones comunes en experiencias conectadas y fluidas. El texto del botón o icono viaja de forma continua mientras el cuerpo del modal entra con <code>contentAnimation</code> o <code>contentStagger</code>.
      </p>

      <div class="row">
        <!-- 1. Checkout Pro -->
        <button ref="btnCheckoutRef" class="pill" @click="openCheckout">
          <span class="con-icono">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2l.01.002L6 2a2 2 0 0 1 2 2v2h8V4a2 2 0 0 1 2-2h.01M3 6h18a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1zm6 4v2a3 3 0 0 0 6 0v-2"/></svg>
            <span>Plan Pro — $29/mes</span>
          </span>
        </button>

        <!-- 2. Invitar colaboradores -->
        <button ref="btnInviteRef" class="pill" @click="openInvite">
          <span class="con-icono">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>
            <span>Invitar colaboradores</span>
          </span>
        </button>

        <!-- 3. Barra de Filtros y Búsqueda -->
        <div class="search-filter-pill">
          <div ref="searchBoxWrapRef" class="search-filter-input-wrap con-icono">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6 -6"/></svg>
            <input v-model="searchTerm" type="text" placeholder="Buscar comercio..." class="search-filter-input" autocomplete="off" />
          </div>
          <div class="search-filter-divider"></div>
          <button type="button" class="search-filter-btn" @click="openSearchModal">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4"/></svg>
            <span>Filtros</span>
          </button>
        </div>

        <!-- 4. Confirmación destructiva -->
        <button ref="btnDeleteRef" class="btn-danger" @click="openDelete">
          <span class="con-icono">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12M9 7V4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>
            <span>Eliminar Proyecto</span>
          </span>
        </button>
      </div>

      <!-- Modal 1: Checkout -->
      <WissPopMorph
        v-model="checkoutOpen"
        :origin-ref="btnCheckoutRef"
        :label="checkoutLabel"
        placement="center"
        flying-text-class="flying"
        :content-stagger="true"
        content-animation="slide-up"
        ease="power3.out"
        :duration="0.6"
        close-button
        swipe-to-close
        modal-class="panel"
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 25rem">
            <h3 class="con-icono" data-wisspop-title style="margin-bottom: 0.25rem;">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2l.01.002L6 2a2 2 0 0 1 2 2v2h8V4a2 2 0 0 1 2-2h.01M3 6h18a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1zm6 4v2a3 3 0 0 0 6 0v-2"/></svg>
              <span>Plan Pro — $29/mes</span>
            </h3>
            <p class="nota" style="margin-bottom: 0.75rem;">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Acceso ilimitado a todas las herramientas de animación.</span>
            </p>
            
            <label>Método de pago preferido</label>
            <div class="payment-options">
              <div class="payment-card">Tarjeta Crédito</div>
              <div class="payment-card">Apple Pay</div>
              <div class="payment-card">PayPal</div>
              <div class="payment-card">Google Pay</div>
            </div>

            <label>Correo de facturación</label>
            <input type="email" value="alex@acme-design.studio" />

            <button style="width: 100%; background: var(--accent); color: #fff; font-weight: 700; padding: 0.75rem; border: none; border-radius: 10px; margin-top: 0.5rem;" @click="close">
              Confirmar Suscripción ($29)
            </button>
          </div>
        </template>
      </WissPopMorph>

      <!-- Modal 2: Invitar -->
      <WissPopMorph
        v-model="inviteOpen"
        :origin-ref="btnInviteRef"
        :label="inviteLabel"
        placement="center"
        flying-text-class="flying"
        content-animation="scale"
        ease="back.out(1.5)"
        :duration="0.55"
        close-button
        swipe-to-close
        modal-class="panel"
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 23rem">
            <h3 class="con-icono" data-wisspop-title>
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>
              <span>Invitar colaboradores</span>
            </h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Comparte acceso a tus componentes con tu equipo.</span>
            </p>
            
            <label>Correo electrónico</label>
            <input type="email" placeholder="companero@empresa.com" />
            
            <label>Rol asignado</label>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
              <button style="flex: 1; padding: 0.4rem; font-size: 0.85rem; border-color: var(--accent); color: var(--accent);">Editor</button>
              <button style="flex: 1; padding: 0.4rem; font-size: 0.85rem;">Admin</button>
              <button style="flex: 1; padding: 0.4rem; font-size: 0.85rem;">Lector</button>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button @click="close">Cancelar</button>
              <button style="background: var(--accent); color: #fff; font-weight: 600;" @click="close">Enviar invitación</button>
            </div>
          </div>
        </template>
      </WissPopMorph>

      <!-- Modal 3: Filtros y Búsqueda -->
      <WissPopMorph
        v-model="searchOpen"
        :origin-ref="searchOriginRef"
        :label="searchLabel"
        placement="center"
        flying-text-class="flying"
        content-animation="slide-down"
        swipe-to-close
        modal-class="panel filter-modal-panel"
      >
        <template #default="{ close }">
          <div class="filter-modal-header">
            <div class="filter-modal-search-wrap con-icono" data-wisspop-title>
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6 -6"/></svg>
              <input v-model="searchTerm" type="text" class="filter-modal-input" placeholder="Buscar comercio..." autofocus />
            </div>
            <button type="button" class="filter-close-btn" aria-label="Cerrar" @click="close">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="filter-col" style="gap: 1.15rem;">
            <div class="filter-group">
              <label class="filter-label">RANGO DE FECHA</label>
              <button type="button" class="filter-select-btn">
                <span>Cualquier Fecha</span>
                <svg class="ico chevron" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>

            <div class="filter-group">
              <label class="filter-label">TIPO DE MOVIMIENTOS</label>
              <button type="button" class="filter-select-btn">
                <span>Todos los Tipos</span>
                <svg class="ico chevron" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>

            <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button style="padding: 0.45rem 0.9rem; border-radius: 8px;" @click="close">Cancelar</button>
              <button style="padding: 0.45rem 1.1rem; border-radius: 8px; background: var(--accent); color: #fff; font-weight: 600;" @click="close">Aplicar Filtros</button>
            </div>
          </div>
        </template>
      </WissPopMorph>

      <!-- Modal 4: Eliminar -->
      <WissPopMorph
        v-model="deleteOpen"
        :origin-ref="btnDeleteRef"
        :label="deleteLabel"
        placement="center"
        flying-text-class="flying"
        content-animation="fade"
        ease="power3.out"
        :duration="0.45"
        close-button
        swipe-to-close
        modal-class="panel"
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 22rem">
            <h3 class="con-icono" data-wisspop-title style="color: #dc2626;">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12M9 7V4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>
              <span>Eliminar Proyecto</span>
            </h3>
            <p style="font-size: 0.9rem; color: var(--muted); margin: 0.75rem 0 1.25rem; line-height: 1.4;">
              ¿Estás seguro de que deseas eliminar este proyecto? Esta acción destruirá todas las vistas y no se puede deshacer.
            </p>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button @click="close">Cancelar</button>
              <button class="btn-danger" @click="close">Sí, eliminar</button>
            </div>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 8 · Cerrar con el gesto -->
    <section>
      <h2>Cerrar con el gesto</h2>
      <p class="hint">
        <code>swipeToClose: true</code> — arrastrá el panel con el mouse o el dedo hacia
        cualquier lado, como una notificación de celular. Pasado el umbral se va para donde lo
        tiraste; si soltás antes, vuelve solo a su lugar.
      </p>

      <div class="row">
        <button ref="swipeBtnRef" @click="swipeOpen = true">Arrastrame para cerrar</button>
      </div>

      <WissPopMorph
        v-model="swipeOpen"
        :origin-ref="swipeBtnRef"
        placement="center"
        modal-class="panel"
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 20rem;">
            <h3>Arrastrame</h3>
            <p class="nota">
              Hacia cualquier lado, con el mouse o el dedo. Si soltás antes del umbral, vuelve solo.
            </p>
            <button @click="close">O cerrame así</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 9 · FlipModal — Elementos compartidos -->
    <section>
      <h2>FlipModal — Elementos compartidos</h2>
      <p class="hint">
        Los elementos con <code>data-flip-id</code> viajan del origen al modal conservando su identidad visual.
      </p>

      <div class="row">
        <WissPopFlip flip-id="demo" close-button swipe-to-close>
          <template #trigger="{ open }">
            <div
              data-flip-id="demo-card"
              class="card-demo"
              style="cursor: pointer; padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; width: 16rem;"
              @click="open"
            >
              <img data-flip-id="demo-img" src="/gato.jpg" style="width: 100%; height: 100px; object-fit: cover; border-radius: 0.5rem;" alt="" />
              <h3 data-flip-id="demo-title" style="margin-top: 0.5rem; font-size: 1.1rem;">Gato Viajero</h3>
              <p class="trigger-fade-item-demo" style="font-size: 0.85rem; color: #888;">Clic para expandir detalle</p>
            </div>
          </template>

          <template #modal="{ close }">
            <div data-flip-id="demo-card" class="panel" style="padding: 1.5rem; width: 24rem; max-width: 90vw;">
              <img data-flip-id="demo-img" src="/gato.jpg" style="width: 100%; height: 220px; object-fit: cover; border-radius: 0.75rem;" alt="" />
              <h3 data-flip-id="demo-title" style="margin-top: 1rem; font-size: 1.5rem;">Gato Viajero</h3>
              <p class="modal-fade-item-demo" style="margin-top: 0.5rem; color: #aaa; line-height: 1.4;">
                Esta foto y título viajaron directamente desde la tarjeta usando GSAP Flip.
              </p>
              <button class="modal-fade-item-demo" style="margin-top: 1rem;" @click="close">Cerrar</button>
            </div>
          </template>
        </WissPopFlip>
      </div>
    </section>

    <!-- 10 · DropdownPanel — Despliegue elástico -->
    <section>
      <h2>DropdownPanel — Despliegue elástico</h2>
      <p class="hint">
        Animación elástica ligera con <code>enterDropdownAnimation</code> y <code>leaveDropdownAnimation</code>.
      </p>

      <div ref="dropdownRowRef" class="row" style="position: relative;">
        <button ref="ddDownBtn" data-dir="down" @click="toggleDropdownDir('down', ddDownBtn)">↓ Abajo</button>
        <button ref="ddUpBtn" data-dir="up" @click="toggleDropdownDir('up', ddUpBtn)">↑ Arriba</button>
        <button ref="ddRightBtn" data-dir="right" @click="toggleDropdownDir('right', ddRightBtn)">→ Derecha</button>
        <button ref="ddLeftBtn" data-dir="left" @click="toggleDropdownDir('left', ddLeftBtn)">← Izquierda</button>

        <div ref="dropdownPanelRef" class="panel" style="display: none; position: absolute; padding: 0.75rem 1rem; z-index: 50;">
          <ul class="menu" style="margin: 0; padding: 0; list-style: none;">
            <li @click="closeDropdown">Opción 1</li>
            <li @click="closeDropdown">Opción 2</li>
            <li @click="closeDropdown">Opción 3</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 11 · Tipos de animación de contenido (contentAnimation) -->
    <section>
      <h2>Tipos de animación de contenido (<code>contentAnimation</code>)</h2>
      <p class="hint">
        El contenedor morph se expande físicamente mientras el contenido interior entra con la transición seleccionada: <code>slide-up</code> (por defecto), <code>slide-down</code>, <code>scale</code>, <code>fade</code> o <code>none</code>.
      </p>

      <div class="row">
        <button
          v-for="anim in ['slide-up', 'slide-down', 'scale', 'fade', 'none']"
          :key="anim"
          :ref="(el) => setContentAnimBtnRef(anim, el)"
          @click="openContentAnim(anim)"
        >
          {{ anim }} {{ anim === 'slide-up' ? '(Default)' : anim === 'scale' ? '(Zoom in)' : anim === 'fade' ? '(Opacidad)' : anim === 'none' ? '(Inmediato)' : '' }}
        </button>
      </div>

      <WissPopMorph
        v-model="contentAnimOpen"
        :origin-ref="contentAnimOrigin"
        placement="center"
        :content-animation="contentAnimType"
        modal-class="panel"
        close-button
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 22rem">
            <h3>Animación: <span class="tag-pill">{{ contentAnimType }}</span></h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Transición configurada mediante <code>contentAnimation: "{{ contentAnimType }}"</code>.</span>
            </p>
            <button @click="close">Cerrar modal</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 12 · Cascada de elementos (contentStagger) -->
    <section>
      <h2>Cascada de elementos (<code>contentStagger</code>)</h2>
      <p class="hint">
        <code>contentStagger: true</code> aplica automáticamente una cascada fluida con retardos progresivos (30ms) en cada uno de los elementos hijos.
      </p>

      <div class="row">
        <button ref="btnStaggerRef" class="pill" @click="staggerOpen = true">Abrir lista con Stagger</button>
      </div>

      <WissPopMorph
        v-model="staggerOpen"
        :origin-ref="btnStaggerRef"
        placement="center"
        :content-stagger="true"
        modal-class="panel"
        close-button
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 24rem">
            <h3>Efecto Cascada (Stagger)</h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Cada hijo entra con un delay escalonado de 30ms.</span>
            </p>
            <div class="stagger-demo-list">
              <div class="stagger-item">
                <span>✨ Notificación del sistema</span>
                <span class="badge">Nuevo</span>
              </div>
              <div class="stagger-item">
                <span>📦 Paquete v0.2.0 publicado</span>
                <span class="badge">NPM</span>
              </div>
              <div class="stagger-item">
                <span>🚀 Optimización GPU 120 FPS</span>
                <span class="badge">Core</span>
              </div>
              <div class="stagger-item">
                <span>📱 Soporte móvil y táctil</span>
                <span class="badge">Móvil</span>
              </div>
              <div class="stagger-item">
                <span>⚡ Animación CSS desacoplada</span>
                <span class="badge">CSS</span>
              </div>
            </div>
            <div style="margin-top: 1rem;">
              <button @click="close">Entendido</button>
            </div>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 13 · Curvas y Física de Aceleración (ease / closeEase) -->
    <section>
      <h2>Curvas y Física de Aceleración (<code>ease</code> / <code>closeEase</code>)</h2>
      <p class="hint">
        Control completo sobre la física del morph usando curvas GSAP en apertura (<code>ease</code>) y cierre (<code>closeEase</code>).
      </p>

      <div class="row">
        <button
          v-for="item in EASES"
          :key="item.ease"
          :ref="(el) => setEaseBtnRef(item.ease, el)"
          @click="openEase(item)"
        >
          {{ item.ease }} {{ item.label }}
        </button>
      </div>

      <WissPopMorph
        v-model="easeOpen"
        :origin-ref="easeOrigin"
        placement="center"
        :ease="currentEaseConfig.ease"
        :close-ease="currentEaseConfig.closeEase"
        :duration="currentEaseConfig.dur"
        :close-duration="currentEaseConfig.closeDur"
        modal-class="panel"
        close-button
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 23rem">
            <h3>Curva: <span class="tag-pill">{{ currentEaseConfig.ease }}</span></h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>{{ currentEaseConfig.desc }}</span>
            </p>
            <div style="padding: 0.75rem; background: var(--sunken); border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem;">
              <div><code>ease: "{{ currentEaseConfig.ease }}"</code></div>
              <div style="margin-top: 0.3rem;"><code>closeEase: "{{ currentEaseConfig.closeEase }}"</code></div>
            </div>
            <button @click="close">Cerrar y ver closeEase</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 14 · Rendimiento Móvil y Pantalla Completa (fullscreenOnMobile) -->
    <section>
      <h2>Rendimiento Móvil y Pantalla Completa (<code>fullscreenOnMobile</code>)</h2>
      <p class="hint">
        <code>fullscreenOnMobile: true</code> adapta automáticamente el modal a pantalla completa en dispositivos móviles, desactiva blur gaussiano pesado (<code>contentBlur: false</code>), conmuta curvas con overshoot por desaceleración limpia y libera memoria VRAM gráfica tras la transición.
      </p>

      <div class="row">
        <button ref="btnMobilePerfRef" class="pill" @click="mobilePerfOpen = true">Modal Optimizado Móvil</button>
      </div>

      <WissPopMorph
        v-model="mobilePerfOpen"
        :origin-ref="btnMobilePerfRef"
        placement="center"
        :fullscreen-on-mobile="true"
        :content-blur="false"
        close-button
        swipe-to-close
        modal-class="panel"
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 24rem; max-width: 100%;">
            <h3>Optimización Móvil (120 FPS)</h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>En pantallas menores a 640px, este modal se abre a pantalla completa con aceleración por capa GPU nativa.</span>
            </p>
            <ul style="font-size: 0.85rem; color: var(--muted); padding-left: 1.2rem; margin: 0.75rem 0 1.25rem;">
              <li><strong>GPU Layer Promotion:</strong> <code>transform: translateZ(0)</code></li>
              <li><strong>Layout Containment:</strong> <code>contain: layout paint</code></li>
              <li><strong>Dynamic VRAM:</strong> will-change liberado tras la animación</li>
              <li><strong>Gesture swipe:</strong> arrastre táctil para descartar</li>
            </ul>
            <button @click="close">Cerrar modal</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 15 · Pantalla completa en PC y Móvil (placement: "fullscreen") -->
    <section>
      <h2>Pantalla completa en PC y Móvil (<code>placement: "fullscreen"</code>)</h2>
      <p class="hint">
        <code>placement: "fullscreen"</code> expande el modal al <strong>100% exacto del viewport (100vw × 100vh)</strong> tanto en PC de escritorio como en cualquier dispositivo. Nace con animación física fluida desde el botón disparador hasta cubrir toda la pantalla, eliminando bordes y sombras superfluas.
      </p>

      <div class="row">
        <!-- 1. Dashboard Fullscreen estándar -->
        <button ref="btnPcFsRef" class="pill" @click="pcFsOpen = true">
          <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-12zM7 20h10M9 16v4M15 16v4"/></svg>
          <span>Dashboard Pantalla Completa (PC)</span>
        </button>

        <!-- 2. Experiencia Inmersiva Pill -->
        <button ref="btnPcFsPillRef" class="btn-plan" @click="openInmersiva">
          <span class="con-icono">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>
            <span>Experiencia Inmersiva</span>
          </span>
        </button>
      </div>

      <!-- Modal Fullscreen 1: Dashboard -->
      <WissPopMorph
        v-model="pcFsOpen"
        :origin-ref="btnPcFsRef"
        placement="fullscreen"
        content-animation="scale"
        ease="power3.out"
        :duration="0.5"
        close-button
        swipe-to-close
        modal-class="fullscreen-modal"
      >
        <template #default="{ close }">
          <div style="display: flex; flex-direction: column; height: 100vh; width: 100vw; box-sizing: border-box; overflow-y: auto;">
            <header class="fs-nav" style="padding-right: 4rem;">
              <h2>
                <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-12zM7 20h10M9 16v4M15 16v4"/></svg>
                <span>Panel de Control — 100% Pantalla Completa</span>
              </h2>
              <span class="tag-pill">100vw × 100vh</span>
            </header>

            <main class="fs-container">
              <p class="lead">
                Este modal ocupa el 100% del ancho y alto de la pantalla (100vw × 100vh) en PC de escritorio y monitores de cualquier resolución.
              </p>

              <div class="fs-grid">
                <div class="fs-card">
                  <div style="font-size: 0.85rem; color: var(--muted);">Peticiones / Seg</div>
                  <div class="stat">14.2k</div>
                  <div style="font-size: 0.8rem; color: #16a34a;">↑ +18.4% vs ayer</div>
                </div>
                <div class="fs-card">
                  <div style="font-size: 0.85rem; color: var(--muted);">FPS de Render</div>
                  <div class="stat">120 FPS</div>
                  <div style="font-size: 0.8rem; color: #16a34a;">⚡ GPU Acelerada</div>
                </div>
                <div class="fs-card">
                  <div style="font-size: 0.85rem; color: var(--muted);">Memoria VRAM</div>
                  <div class="stat">0 MB</div>
                  <div style="font-size: 0.8rem; color: var(--muted);">Liberada a "auto"</div>
                </div>
              </div>

              <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                <button class="pill" @click="close">Cerrar vista completa</button>
              </div>
            </main>
          </div>
        </template>
      </WissPopMorph>

      <!-- Modal Fullscreen 2: Experiencia Inmersiva -->
      <WissPopMorph
        v-model="inmersivaOpen"
        :origin-ref="btnPcFsPillRef"
        :label="inmersivaLabel"
        placement="fullscreen"
        flying-text-class="flying"
        :content-stagger="true"
        ease="power3.out"
        close-ease="power2.inOut"
        :duration="0.65"
        :close-duration="0.65"
        close-button
        swipe-to-close
        modal-class="fullscreen-modal"
      >
        <template #default="{ close }">
          <div style="display: flex; flex-direction: column; height: 100vh; width: 100vw; box-sizing: border-box; overflow-y: auto;">
            <header class="fs-nav" style="padding-right: 4rem;">
              <h2 class="con-icono" data-wisspop-title style="margin: 0; font-size: 1.25rem; font-weight: 700;">
                <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>
                <span>Experiencia Inmersiva</span>
              </h2>
              <span class="tag-pill">GSAP Flying + Fullscreen</span>
            </header>

            <main class="fs-container">
              <div class="stagger-demo-list" style="margin-top: 1rem;">
                <div class="stagger-item" style="padding: 1.25rem;">
                  <span>🌐 1. El botón de origen se expandió al 100% de la pantalla del monitor.</span>
                  <span class="badge">Viewport 100vw</span>
                </div>
                <div class="stagger-item" style="padding: 1.25rem;">
                  <span>✨ 2. El título voló desde el botón hasta el encabezado superior.</span>
                  <span class="badge">GSAP Flying</span>
                </div>
                <div class="stagger-item" style="padding: 1.25rem;">
                  <span>⚡ 3. Todas las tarjetas hijas entraron en cascada progresiva de 30ms.</span>
                  <span class="badge">Stagger CSS</span>
                </div>
                <div class="stagger-item" style="padding: 1.25rem;">
                  <span>🛡️ 4. Al cerrar, regresa limpiamente al botón original sin distorsiones.</span>
                  <span class="badge">Morph Core</span>
                </div>
              </div>

              <div style="margin-top: 2.5rem; text-align: center;">
                <button class="pill" style="font-size: 1.1rem; padding: 0.8rem 2rem;" @click="close">
                  Regresar al sitio
                </button>
              </div>
            </main>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 16 · Scroll con el panel abierto -->
    <section>
      <h2>Scroll con el panel abierto</h2>
      <p class="hint">
        Depende de si la posición del panel depende del origen. Los anclados
        (<code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>,
        <code>origin</code>) <strong>siguen al botón</strong> al scrollear.
      </p>
    </section>

    <!-- 17 · Alto reactivo -->
    <section>
      <h2>Alto reactivo</h2>
      <p class="hint">
        Los botones dentro del modal de arriba ejercitan lo difícil:
        <code>resync()</code> reajusta el alto cuando aparece un error, y
        <code>changeView()</code> cambia de vista sin cerrar.
      </p>
    </section>
  </main>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import {
  WissPopMorph,
  WissPopPill,
  WissPopFlip,
  enterDropdownAnimation,
  leaveDropdownAnimation,
} from "wisspop/vue";

// --- Section 1: Anclados ---
const ANCLADOS = [
  { placement: "top", align: "start", etiqueta: "↑ inicio" },
  { placement: "top", align: "center", etiqueta: "↑ centro" },
  { placement: "top", align: "end", etiqueta: "↑ final" },
  { placement: "left", align: "center", etiqueta: "← izquierda" },
  { placement: "right", align: "center", etiqueta: "derecha →" },
  { placement: "bottom", align: "center", etiqueta: "↓ abajo" },
];

const ancladoOpen = ref(false);
const ancladoPlacement = ref("bottom");
const ancladoAlign = ref("center");
const ancladoOrigin = ref(null);
const ancladoRefs = ref({});

function setAncladoRef(key, el) {
  if (el) ancladoRefs.value[key] = el;
}

async function openAnclado(placement, align) {
  if (ancladoOpen.value) {
    ancladoOpen.value = false;
    await nextTick();
  }
  ancladoPlacement.value = placement;
  ancladoAlign.value = align;
  ancladoOrigin.value = ancladoRefs.value[placement + align];
  await nextTick();
  ancladoOpen.value = true;
}

// --- Section 2: FAB ---
const fabOpen = ref(false);
const fabBtnRef = ref(null);

// --- Section 3: Inline Origin ---
const inlineOpen = ref(false);
const inlineBtnRef = ref(null);

// --- Section 4: Drawer ---
const drawerOpen = ref(false);
const drawerPlacement = ref("drawer-left");
const drawerLado = ref("left");
const drawerOrigin = ref(null);
const drawerBtnRefs = ref({});

function setDrawerBtnRef(lado, el) {
  if (el) drawerBtnRefs.value[lado] = el;
}

async function openDrawer(lado) {
  if (drawerOpen.value) {
    drawerOpen.value = false;
    await nextTick();
  }
  drawerLado.value = lado;
  drawerPlacement.value = `drawer-${lado}`;
  drawerOrigin.value = drawerBtnRefs.value[lado];
  await nextTick();
  drawerOpen.value = true;
}

// --- Section 5: Auth Pill ---
const authPillRef = ref(null);
const authCenterRef = ref(null);
const authOriginRef = ref(null);
const authVista = ref("signup");
const authError = ref(false);

function openAuth(placement) {
  authVista.value = "signup";
  authError.value = false;
  const btn = placement === "center" ? authCenterRef.value : authOriginRef.value;
  authPillRef.value?.open(btn, "Crear cuenta", { placement });
}

function toggleAuthVista() {
  authPillRef.value?.changeView(() => {
    authVista.value = authVista.value === "signup" ? "login" : "signup";
    authError.value = false;
  });
}

function toggleAuthError() {
  authError.value = !authError.value;
  authPillRef.value?.resync();
}

// --- Section 6: Formatos del elemento viajero ---
const formatOpen = ref(false);
const formatOrigin = ref(null);
const formatTipo = ref("texto");
const formatLabel = ref(null);
const fTextoBtnRef = ref(null);
const fMixtoBtnRef = ref(null);
const fIconoBtnRef = ref(null);
const fImagenBtnRef = ref(null);

function openFormat(tipo) {
  formatTipo.value = tipo;
  let btn = fTextoBtnRef.value;
  if (tipo === "mixto") btn = fMixtoBtnRef.value;
  if (tipo === "icono") btn = fIconoBtnRef.value;
  if (tipo === "imagen") btn = fImagenBtnRef.value;
  formatOrigin.value = btn;
  formatLabel.value =
    tipo === "texto"
      ? "Solo texto"
      : tipo === "mixto"
        ? btn.querySelector(".con-icono")
        : tipo === "icono"
          ? btn.querySelector("svg")
          : btn.querySelector("img");
  formatOpen.value = true;
}

// --- Section 7: Casos de uso avanzados con elemento viajero ---
const btnCheckoutRef = ref(null);
const checkoutOpen = ref(false);
const checkoutLabel = ref(null);

function openCheckout() {
  checkoutLabel.value = btnCheckoutRef.value?.querySelector(".con-icono");
  checkoutOpen.value = true;
}

const btnInviteRef = ref(null);
const inviteOpen = ref(false);
const inviteLabel = ref(null);

function openInvite() {
  inviteLabel.value = btnInviteRef.value?.querySelector(".con-icono");
  inviteOpen.value = true;
}

const searchBoxWrapRef = ref(null);
const searchOpen = ref(false);
const searchOriginRef = ref(null);
const searchLabel = ref(null);
const searchTerm = ref("");

function openSearchModal() {
  searchOriginRef.value = searchBoxWrapRef.value?.closest(".search-filter-pill");
  searchLabel.value = searchBoxWrapRef.value;
  searchOpen.value = true;
}

const btnDeleteRef = ref(null);
const deleteOpen = ref(false);
const deleteLabel = ref(null);

function openDelete() {
  deleteLabel.value = btnDeleteRef.value?.querySelector(".con-icono");
  deleteOpen.value = true;
}

// --- Section 8: Swipe ---
const swipeOpen = ref(false);
const swipeBtnRef = ref(null);

// --- Section 10: Dropdown ---
const dropdownRowRef = ref(null);
const dropdownPanelRef = ref(null);
const ddDownBtn = ref(null);
const ddUpBtn = ref(null);
const ddRightBtn = ref(null);
const ddLeftBtn = ref(null);
let dropdownDir = null;

const GAP = 8;
const DROPDOWN_DIRS = {
  down: { origin: "top center", pos: (b) => ({ top: `${b.offsetTop + b.offsetHeight + GAP}px`, left: `${b.offsetLeft}px` }) },
  up: { origin: "bottom center", pos: (b, row) => ({ bottom: `${row.offsetHeight - b.offsetTop + GAP}px`, left: `${b.offsetLeft}px` }) },
  right: { origin: "left center", pos: (b) => ({ top: `${b.offsetTop}px`, left: `${b.offsetLeft + b.offsetWidth + GAP}px` }) },
  left: { origin: "right center", pos: (b, row) => ({ top: `${b.offsetTop}px`, right: `${row.offsetWidth - b.offsetLeft + GAP}px` }) },
};

function closeDropdown() {
  const panel = dropdownPanelRef.value;
  if (!panel || !dropdownDir) return;
  const { origin } = DROPDOWN_DIRS[dropdownDir];
  dropdownDir = null;
  leaveDropdownAnimation(panel, () => (panel.style.display = "none"), { transformOrigin: origin });
}

function openDropdown(dir, btn) {
  const panel = dropdownPanelRef.value;
  const row = dropdownRowRef.value;
  if (!panel || !row || !btn) return;

  dropdownDir = dir;
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
}

function toggleDropdownDir(dir, btn) {
  if (dropdownDir === dir) closeDropdown();
  else openDropdown(dir, btn);
}

function handleDocClick(e) {
  const panel = dropdownPanelRef.value;
  if (!dropdownDir || !panel || panel.contains(e.target)) return;
  if (e.target.closest("[data-dir]")) return;
  closeDropdown();
}

onMounted(() => document.addEventListener("click", handleDocClick));
onBeforeUnmount(() => document.removeEventListener("click", handleDocClick));

// --- Section 11: Tipos de animación de contenido ---
const contentAnimOpen = ref(false);
const contentAnimType = ref("slide-up");
const contentAnimOrigin = ref(null);
const contentAnimBtnRefs = ref({});

function setContentAnimBtnRef(anim, el) {
  if (el) contentAnimBtnRefs.value[anim] = el;
}

async function openContentAnim(anim) {
  if (contentAnimOpen.value) {
    contentAnimOpen.value = false;
    await nextTick();
  }
  contentAnimType.value = anim;
  contentAnimOrigin.value = contentAnimBtnRefs.value[anim];
  await nextTick();
  contentAnimOpen.value = true;
}

// --- Section 12: Cascada de elementos (contentStagger) ---
const btnStaggerRef = ref(null);
const staggerOpen = ref(false);

// --- Section 13: Curvas y Física de Aceleración ---
const EASES = [
  { ease: "back.out(1.7)", label: "(Rebote)", desc: "Rebote con overshoot elástico al expandirse.", closeEase: "power3.in", dur: 0.65, closeDur: 0.35 },
  { ease: "power3.out", label: "(Suave)", desc: "Desaceleración suave, profesional y fluida.", closeEase: "power2.in", dur: 0.5, closeDur: 0.3 },
  { ease: "elastic.out(1, 0.75)", label: "(Resorte)", desc: "Efecto resorte gomoso pronunciado.", closeEase: "power2.inOut", dur: 0.85, closeDur: 0.4 },
  { ease: "expo.out", label: "(Snap rápido)", desc: "Aceleración inicial instantánea con frenada suave.", closeEase: "expo.in", dur: 0.55, closeDur: 0.3 },
];

const easeOpen = ref(false);
const easeOrigin = ref(null);
const currentEaseConfig = ref(EASES[0]);
const easeBtnRefs = ref({});

function setEaseBtnRef(ease, el) {
  if (el) easeBtnRefs.value[ease] = el;
}

async function openEase(item) {
  if (easeOpen.value) {
    easeOpen.value = false;
    await nextTick();
  }
  currentEaseConfig.value = item;
  easeOrigin.value = easeBtnRefs.value[item.ease];
  await nextTick();
  easeOpen.value = true;
}

// --- Section 14: Rendimiento Móvil ---
const btnMobilePerfRef = ref(null);
const mobilePerfOpen = ref(false);

// --- Section 15: Pantalla Completa ---
const btnPcFsRef = ref(null);
const pcFsOpen = ref(false);

const btnPcFsPillRef = ref(null);
const inmersivaOpen = ref(false);
const inmersivaLabel = ref(null);

function openInmersiva() {
  inmersivaLabel.value = btnPcFsPillRef.value?.querySelector(".con-icono");
  inmersivaOpen.value = true;
}
</script>

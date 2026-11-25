/**
 * 🛠️ MIRA APP MODULES & TECHNICAL TROUBLESHOOTING KNOWLEDGE BASE (PT / EN / ES / FR)
 *
 * Offline/fallback knowledge for MIRA AI whenever users ask:
 * - How any module of the MIRA platform works
 * - How to resolve technical errors, login issues, slow loading, PDF downloads,
 *   job alerts, notifications, audio/language, PWA install, or GDPR account deletion.
 */

type Lang = 'PT' | 'EN' | 'ES' | 'FR';

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const RESPONSES = {
  ALL_MODULES: {
    PT: `🧭 **GUIA COMPLETO DOS MÓDULOS DA PLATAFORMA MIRA**

Aqui está como funciona cada módulo da aplicação:

1. **🏠 Início**: Painel principal com atalhos rápidos para todas as ferramentas, acesso ao teu perfil, botão de sugestões e instalação da app (PWA).
2. **👥 Comunidade (MIRA HUB)**: Publica relatos por categoria, comenta, guarda posts, traduz automaticamente (PT/EN/ES/FR) e vota na veracidade (**Fact-Checking**: Verdadeiro vs. Suspeito/Fake) contra burlas.
3. **💼 Empregos (JobBoard)**: Vagas reais em Portugal (IEFP, Net-Empregos, Jooble, Indeed) atualizadas diariamente, filtros por distrito/setor, aba de **Vagas Inclusivas PCD**, salário médio de referência e **Alertas de Emprego** (instantâneos, diários ou semanais).
4. **📍 Serviços Locais & Mapa**: 225+ serviços geolocalizados em Portugal (AIMA, CNAIM, CLAIM, Lojas do Cidadão, SNS, Finanças, Segurança Social, Associações e apoio PCD) com morada, contactos e avaliações.
5. **🎓 Cursos & Formação**: **174+ cursos oficiais** (131 reconhecidos pela DGES/CTeSP + 43 certificados pelo IEFP, incluindo Português PLA), filtros por área/distrito/certificação e Manual do Utilizador.
6. **📄 Documentos & Jornada**: Linha de Metro da Integração (Visto → NIF → NISS → SNS → Emprego → AIMA), assistentes guiados (NIF, NISS, SNS, Banco, Habitação, IMT, Nacionalidade, Regularização), **Gerador de Minutas PDF** e **Guia/Simulador de IRS**.
7. **🧮 6 Simuladores Económicos 2026**: Salário Líquido, Recibos Verdes, Custo de Vida (20 distritos), Proteção à Habitação (35% BdP), Requisitos AIMA & SS e Pequeno Empreendedor (ENI vs. Lda).
8. **🤖 MIRA Chat (Assistente IA)**: Apoio 24/7 em 4 idiomas com texto, voz e suporte técnico.
9. **👤 Perfil & Gamificação**: Reputação (XP), 12 medalhas oficiais, posts guardados e eliminação de conta RGPD.
10. **💬 Mensagens Diretas & 🔔 Notificações**: Chat privado entre membros (via perfil) e sininho/central de alertas.
11. **🛡️ Privacidade & RGPD**: Política de dados, cookies e gestão de consentimento (não guardamos documentos privados dos teus PDFs).

Queres que te explique algum módulo em detalhe ou estás a ter algum erro?
[view:HOME:Abrir Painel Principal] [view:DOCUMENTS:Abrir Documentos e Jornada] [view:SIMULATORS:Abrir Simuladores]`,
    EN: `🧭 **COMPLETE GUIDE TO MIRA PLATFORM MODULES**

1. **🏠 Home**: Main hub with quick shortcuts, profile access, feedback suggestions, and PWA app installation.
2. **👥 Community (MIRA HUB)**: Share posts by category, comment, save posts, auto-translate (PT/EN/ES/FR), and use **Community Fact-Checking** (Verified vs. Suspicious/Scam).
3. **💼 Jobs (JobBoard)**: Daily updated vacancies in Portugal (IEFP, Net-Empregos, Jooble, Indeed), district/sector filters, **Inclusive PWD Jobs** tab, benchmark salaries, and **Job Alerts** (instant, daily, or weekly).
4. **📍 Local Services & Map**: 225+ geolocated support centers (AIMA, CNAIM, CLAIM, Citizen Shops, SNS, Tax Authority, Social Security, Associations).
5. **🎓 Courses & Training**: **174+ official courses** (131 DGES/CTeSP + 43 IEFP including Portuguese PLA), filters by field/district/certification, and User Manual.
6. **📄 Documents & Journey**: Integration Metro Line (Visa → NIF → NISS → SNS → Job → AIMA), step-by-step wizards, **PDF Template Generator**, and **IRS Guide/Calculator**.
7. **🧮 6 Economic Simulators (2026)**: Net Salary, Green Receipts (Freelancer), Cost of Living (20 districts), Housing Protection (35% effort rate), AIMA/SS Means, and Small Business (ENI vs. LLC).
8. **🤖 MIRA Chat (AI Assistant)**: 24/7 assistant in 4 languages with voice & technical support.
9. **👤 Profile & Gamification**: XP points, 12 badges, saved posts, and GDPR account deletion.
10. **💬 Direct Messages & 🔔 Notifications**: Private member chat and alerts center.
11. **🛡️ Privacy & GDPR**: Privacy policy, cookies, and consent controls.

Which module would you like help with, or are you facing an error?
[view:HOME:Open Main Hub] [view:DOCUMENTS:Open Documents & Journey] [view:SIMULATORS:Open Simulators]`,
    ES: `🧭 **GUÍA COMPLETA DE LOS MÓDULOS DE MIRA**

1. **🏠 Inicio**: Panel principal con accesos rápidos, perfil, sugerencias e instalación de la app (PWA).
2. **👥 Comunidad (MIRA HUB)**: Publica experiencias por categoría, comenta, guarda posts, traduce al instante (PT/EN/ES/FR) y vota la veracidad (**Fact-Checking** contra estafas).
3. **💼 Empleos (JobBoard)**: Ofertas reales en Portugal (IEFP, Net-Empregos, Jooble, Indeed) actualizadas a diario, filtros por distrito/sector, pestaña de **Vacantes Inclusivas PCD** y **Alertas de Empleo** (instantáneas, diarias o semanales).
4. **📍 Servicios Locales y Mapa**: 225+ centros geolocalizados (AIMA, CNAIM, CLAIM, Lojas do Cidadão, SNS, Finanças, Seguridad Social y Asociaciones).
5. **🎓 Cursos y Formación**: **174+ cursos oficiales** (131 DGES/CTeSP + 43 IEFP incluido Portugués PLA) con filtros y Manual de Usuario.
6. **📄 Documentos y Trayecto**: Línea de Metro de Integración, asistentes paso a paso (NIF, NISS, SNS, Banco, Vivienda, IMT, Nacionalidad), **Generador de Minutas PDF** y **Guía/Simulador IRS**.
7. **🧮 6 Simuladores Económicos 2026**: Salario Neto, Recibos Verdes, Coste de Vida (20 distritos), Protección de Vivienda, Requisitos AIMA/SS y Pequeño Emprendedor.
8. **🤖 MIRA Chat (Asistente IA)**: Soporte 24/7 en 4 idiomas con voz y ayuda técnica.
9. **👤 Perfil y Gamificación**: Puntos XP, 12 insignias, posts guardados y eliminación de cuenta RGPD.
10. **💬 Mensajes Directos y 🔔 Notificaciones**: Chat privado entre miembros y centro de alertas.
11. **🛡️ Privacidad y RGPD**: Política de datos, cookies y consentimiento.

¿Sobre qué módulo necesitas ayuda o qué error estás viendo?
[view:HOME:Ir al Inicio] [view:DOCUMENTS:Abrir Documentos] [view:SIMULATORS:Abrir Simuladores]`,
    FR: `🧭 **GUIDE COMPLET DES MODULES DE LA PLATEFORME MIRA**

1. **🏠 Accueil** : Tableau principal avec raccourcis rapides, profil, suggestions et installation PWA.
2. **👥 Communauté (MIRA HUB)** : Partagez des retours par catégorie, commentez, sauvegardez, traduisez instantanément (PT/EN/ES/FR) et utilisez le **Fact-Checking** communautaire contre les arnaques.
3. **💼 Emplois (JobBoard)** : Offres réelles au Portugal (IEFP, Net-Empregos, Jooble, Indeed) mises à jour chaque jour, filtres, onglet **Emplois Inclusifs PCD** et **Alertes Emploi** (instantanées, quotidiennes ou hebdomadaires).
4. **📍 Services Locaux & Carte** : 225+ services géolocalisés (AIMA, CNAIM, CLAIM, Lojas do Cidadão, SNS, Finanças, Sécurité Sociale, Associations).
5. **🎓 Cours & Formation** : **174+ cours officiels** (131 DGES/CTeSP + 43 IEFP dont Portugais PLA) avec filtres et Manuel Utilisateur.
6. **📄 Documents & Parcours** : Ligne de Métro d'Intégration, assistants guidés, **Générateur de Modèles PDF** et **Guide/Simulateur IRS**.
7. **🧮 6 Simulateurs Économiques 2026** : Salaire Net, Recibos Verdes, Coût de la Vie (20 districts), Protection Logement, Conditions AIMA/SS et Petit Entrepreneur.
8. **🤖 MIRA Chat (Assistant IA)** : Aide 24/7 en 4 langues avec audio et support technique.
9. **👤 Profil & Gamification** : Points XP, 12 badges, posts sauvegardés et suppression de compte RGPD.
10. **💬 Messages Directs & 🔔 Notifications** : Chat privé entre membres et centre d'alertes.
11. **🛡️ Confidentialité & RGPD** : Politique de données, cookies et consentement.

Quel module souhaitez-vous explorer ou quel problème rencontrez-vous ?
[view:HOME:Ouvrir l'Accueil] [view:DOCUMENTS:Ouvrir Documents] [view:SIMULATORS:Ouvrir Simulateurs]`
  },

  TROUBLESHOOT_LOGIN: {
    PT: `🔐 **COMO RESOLVER PROBLEMAS DE LOGIN, SENHA OU SESSÃO EXPIRADA**

Segue estes passos por ordem:
1. **Esqueceste a palavra-passe?** No ecrã de entrada, clica em **"Recuperar palavra-passe"** e verifica também a pasta de **Spam / Lixo Eletrónico** pelo email de redefinição.
2. **Erro "Sessão inválida ou expirada":** Clica no ícone de **Sair** no canto superior direito, recarrega a página (\`Ctrl+Shift+R\` no PC ou fecha e reabre no telemóvel) e entra novamente.
3. **Email não reconhecido:** Confirma se não existem espaços antes/depois do email e se usaste o mesmo endereço do registo.
4. **Navegador bloqueado:** Testa abrir numa **janela anónima/privada** ou limpa os cookies de \`miraimigrante.pt\`.

Se o problema continuar, envia o email da conta e o print do erro para **mira.app@hotmail.com**.
[view:HOME:Ir para o Início] [view:PRIVACY:Ver Privacidade e Conta]`,
    EN: `🔐 **HOW TO FIX LOGIN, PASSWORD, OR EXPIRED SESSION ISSUES**

1. **Forgot password?** Click **"Recover password"** on the sign-in screen and check your **Spam/Junk** folder for the reset link.
2. **"Invalid or expired session" error:** Click **Sign Out** in the top-right bar, hard-refresh the page (\`Ctrl+Shift+R\`), and log back in.
3. **Email not recognized:** Check for accidental spaces before/after your email and make sure you're using the exact registration email.
4. **Browser/cache issue:** Try an **incognito/private window** or clear site cookies for \`miraimigrante.pt\`.

Still stuck? Email **mira.app@hotmail.com** with a screenshot of the error.
[view:HOME:Go to Home]`,
    ES: `🔐 **CÓMO RESOLVER PROBLEMAS DE INICIO DE SESIÓN O CONTRASEÑA**

1. **¿Olvidaste la contraseña?** Pulsa **"Recuperar contraseña"** en la pantalla de acceso y revisa también la carpeta de **Spam / Correo no deseado**.
2. **Error de "Sesión inválida o expirada":** Pulsa **Salir** en la barra superior, recarga la página (\`Ctrl+Shift+R\`) e inicia sesión de nuevo.
3. **Correo no reconocido:** Comprueba que no haya espacios antes o después del correo.
4. **Caché del navegador:** Prueba en una **ventana de incógnito** o borra las cookies de \`miraimigrante.pt\`.

Si persiste, escribe a **mira.app@hotmail.com** indicando el error exacto.
[view:HOME:Ir al Inicio]`,
    FR: `🔐 **RÉSOUDRE LES PROBLÈMES DE CONNEXION OU DE SESSION EXPIRÉE**

1. **Mot de passe oublié ?** Cliquez sur **"Récupérer le mot de passe"** sur l'écran de connexion et vérifiez vos **Spams / Indésirables**.
2. **Erreur « Session invalide ou expirée » :** Cliquez sur **Déconnexion** en haut à droite, rechargez la page (\`Ctrl+Shift+R\`) et reconnectez-vous.
3. **E-mail non reconnu :** Vérifiez qu'il n'y a pas d'espace avant/après votre adresse.
4. **Cache du navigateur :** Essayez en **navigation privée** ou effacez les cookies de \`miraimigrante.pt\`.

Si l'erreur persiste, contactez **mira.app@hotmail.com**.
[view:HOME:Aller à l'Accueil]`
  },

  TROUBLESHOOT_SLOW_CRASH: {
    PT: `⚡ **PLATAFORMA LENTA, ECRÃ EM BRANCO OU A TRAVAR — COMO RESOLVER**

1. **Atualização forçada (limpar cache antiga):**
   • **Computador:** prime \`Ctrl + Shift + R\` (Windows) ou \`Cmd + Shift + R\` (Mac).
   • **Telemóvel:** fecha totalmente a aba/app e volta a abrir \`miraimigrante.pt\`.
2. **Limpar Service Worker / dados em cache:** Nas definições do navegador → *Privacidade / Dados de sites* → procura \`miraimigrante.pt\` → limpa apenas a **cache** (mantendo a tua sessão).
3. **Evitar navegadores internos de redes sociais:** Se abriste o link dentro do Instagram, WhatsApp ou TikTok, toca em **"Abrir no Chrome / Safari"** para desempenho total.
4. **Verificar ligação e abas:** Fecha abas pesadas abertas em paralelo e confirma ligação estável à internet.

Se algum ecrã específico continuar a falhar, diz-me **qual o módulo** e o **teu navegador** para te ajudar!
[view:HOME:Voltar ao Início]`,
    EN: `⚡ **SLOW PLATFORM, BLANK SCREEN, OR FREEZING — HOW TO FIX**

1. **Force reload (clear stale cache):** Press \`Ctrl + Shift + R\` (Windows) or \`Cmd + Shift + R\` (Mac); on mobile, fully close and reopen the tab/app.
2. **Clear cached site data:** In browser settings → Site Data for \`miraimigrante.pt\` → clear cache.
3. **Avoid in-app social browsers:** If opened inside Instagram, WhatsApp, or TikTok, choose **"Open in Chrome / Safari"**.
4. **Check connection & browser version:** Close heavy background tabs and ensure your browser is up to date.

Tell me which module froze and which browser you're using if it still happens!
[view:HOME:Go to Home]`,
    ES: `⚡ **PLATAFORMA LENTA, PANTALLA EN BLANCO O BLOQUEADA — SOLUCIÓN**

1. **Recarga forzada:** Pulsa \`Ctrl + Shift + R\` (Windows) o \`Cmd + Shift + R\` (Mac); en móvil, cierra completamente la pestaña/app y vuelve a abrir.
2. **Limpiar caché del sitio:** En ajustes del navegador → Datos de sitios → \`miraimigrante.pt\` → borrar caché.
3. **Abrir fuera de redes sociales:** Si abriste el enlace desde Instagram, WhatsApp o TikTok, elige **"Abrir en Chrome / Safari"**.
4. **Conexión y pestañas:** Cierra pestañas pesadas en segundo plano.

Si el problema continúa, dime en qué módulo ocurre y qué navegador utilizas.
[view:HOME:Volver al Inicio]`,
    FR: `⚡ **PLATEFORME LENTE, ÉCRAN BLANC OU FIGÉ — COMMENT CORRIGER**

1. **Rechargement forcé :** Appuyez sur \`Ctrl + Shift + R\` (Windows) ou \`Cmd + Shift + R\` (Mac) ; sur mobile, fermez complètement l'onglet/app et rouvrez.
2. **Vider le cache du site :** Paramètres du navigateur → Données du site \`miraimigrante.pt\` → effacer le cache.
3. **Éviter les navigateurs intégrés :** Si vous venez d'Instagram, WhatsApp ou TikTok, choisissez **« Ouvrir dans Chrome / Safari »**.
4. **Connexion :** Fermez les onglets lourds et vérifiez votre connexion.

Dites-moi quel module bloque et quel navigateur vous utilisez si le problème persiste.
[view:HOME:Retour à l'Accueil]`
  },

  TROUBLESHOOT_ALERTS_NOTIF: {
    PT: `🔔 **ALERTAS DE EMPREGO OU NOTIFICAÇÕES NÃO CHEGAM — COMO RESOLVER**

1. **Confirmar que o alerta está ativo:** Vai a **Empregos → Gerir Alertas** e confirma que o interruptor do teu alerta está **Ligado (Ativo)**.
2. **Critérios demasiado restritivos:** Se o alerta combinar muitas palavras-chave + distrito específico, experimenta alargar para **"Todos os Distritos"** ou usar termos mais simples (ex.: "armazém", "hotelaria", "IT").
3. **Frequência escolhida:**
   • *Instantâneo*: notifica assim que entram novas vagas compatíveis.
   • *Diário / Semanal*: agrupa as vagas num resumo periódico.
4. **Verificar o sininho e a Central:** Abre o sino no topo ou vai à Central de Notificações. Nota: alertas só notificam vagas novas ingeridas **depois** da criação do alerta.
5. **Permissões no navegador/telemóvel:** Verifica nas definições do navegador se as notificações para \`miraimigrante.pt\` estão permitidas.

[view:JOBS:Gerir Alertas em Empregos] [view:NOTIFICATIONS:Abrir Central de Notificações]`,
    EN: `🔔 **JOB ALERTS OR NOTIFICATIONS NOT ARRIVING — HOW TO FIX**

1. **Check alert status:** Go to **Jobs → Manage Alerts** and confirm your alert toggle is **Active**.
2. **Broaden filters:** Try setting District to **"All Districts"** or simpler keywords if no matches appear.
3. **Check frequency:** *Instant* alerts notify as new matching vacancies arrive; *Daily/Weekly* send grouped summaries. Note that live alerts only notify vacancies ingested **after** you created the alert.
4. **Check Notifications Center & browser permissions:** Open the bell icon or Notifications Center, and ensure browser notifications are allowed for \`miraimigrante.pt\`.

[view:JOBS:Manage Job Alerts] [view:NOTIFICATIONS:Open Notifications Center]`,
    ES: `🔔 **ALERTAS DE EMPLEO O NOTIFICACIONES NO LLEGAN — SOLUCIÓN**

1. **Verifica que la alerta esté activa:** Ve a **Empleos → Gestionar Alertas** y comprueba que el interruptor está encendido.
2. **Amplía los filtros:** Prueba con **"Todos los Distritos"** o palabras clave más simples si no aparecen coincidencias.
3. **Frecuencia:** *Instantáneo* avisa cuando entran nuevas ofertas compatibles; *Diario/Semanal* agrupa en resumen. Las alertas avisan sobre vacantes ingresadas **después** de crear la alerta.
4. **Centro de Notificaciones y permisos:** Revisa la campana superior y permite notificaciones del navegador para \`miraimigrante.pt\`.

[view:JOBS:Gestionar Alertas] [view:NOTIFICATIONS:Ver Notificaciones]`,
    FR: `🔔 **ALERTES EMPLOI OU NOTIFICATIONS NON REÇUES — COMMENT CORRIGER**

1. **Vérifiez l'état de l'alerte :** Allez dans **Emplois → Gérer les alertes** et assurez-vous qu'elle est **Active**.
2. **Élargissez vos critères :** Essayez **« Tous les Districts »** ou des mots-clés plus généraux.
3. **Fréquence :** *Instantané* notifie dès qu'une nouvelle offre correspond ; *Quotidien/Hebdomadaire* regroupe les offres. Les alertes ne notifient que les offres ajoutées **après** leur création.
4. **Centre de notifications et permissions :** Vérifiez la cloche en haut et autorisez les notifications pour \`miraimigrante.pt\`.

[view:JOBS:Gérer les Alertes] [view:NOTIFICATIONS:Ouvrir les Notifications]`
  },

  TROUBLESHOOT_PDF: {
    PT: `📄 **ERRO AO GERAR OU DESCARREGAR PDF (MINUTAS / SIMULADORES)**

1. **Permitir downloads e pop-ups:** Confirma que o navegador não bloqueou o download automático de \`miraimigrante.pt\`.
2. **Usar Chrome ou Safari diretamente:** Navegadores embutidos (dentro do WhatsApp, Instagram ou Facebook) costumam bloquear downloads de PDF. Abre o link diretamente no **Google Chrome** ou **Safari**.
3. **Campos obrigatórios:** Verifica se todos os campos do formulário estão preenchidos sem caracteres inválidos.
4. **Privacidade garantida:** Os PDFs são gerados diretamente no teu dispositivo — o MIRA não guarda os teus dados privados em servidor.

[view:DOCUMENT_ASSISTANT:Abrir Gerador de Minutas PDF] [view:SIMULATORS:Abrir Simuladores]`,
    EN: `📄 **ERROR GENERATING OR DOWNLOADING PDF (TEMPLATES / SIMULATORS)**

1. **Allow downloads & pop-ups:** Make sure your browser did not block automatic downloads for \`miraimigrante.pt\`.
2. **Open in Chrome or Safari:** In-app browsers (WhatsApp, Instagram, Facebook) often block PDF downloads. Open \`miraimigrante.pt\` directly in **Chrome** or **Safari**.
3. **Required fields:** Confirm all required form fields are completed before clicking download.
4. **Privacy:** PDFs are generated directly on your device — MIRA does not store your private document data.

[view:DOCUMENT_ASSISTANT:Open PDF Generator] [view:SIMULATORS:Open Simulators]`,
    ES: `📄 **ERROR AL GENERAR O DESCARGAR PDF (MINUTAS / SIMULADORES)**

1. **Permitir descargas y ventanas emergentes:** Comprueba que el navegador no haya bloqueado la descarga para \`miraimigrante.pt\`.
2. **Usa Chrome o Safari directamente:** Los navegadores internos de WhatsApp o Instagram suelen bloquear archivos PDF.
3. **Campos obligatorios:** Verifica que todos los campos del formulario estén completos.

[view:DOCUMENT_ASSISTANT:Abrir Generador PDF] [view:SIMULATORS:Abrir Simuladores]`,
    FR: `📄 **ERREUR LORS DE LA GÉNÉRATION OU DU TÉLÉCHARGEMENT PDF**

1. **Autoriser les téléchargements :** Vérifiez que le navigateur ne bloque pas les téléchargements de \`miraimigrante.pt\`.
2. **Ouvrir dans Chrome ou Safari :** Les navigateurs intégrés (WhatsApp, Instagram) bloquent souvent les PDF.
3. **Champs obligatoires :** Vérifiez que tous les champs requis sont remplis.

[view:DOCUMENT_ASSISTANT:Ouvrir Générateur PDF] [view:SIMULATORS:Ouvrir Simulateurs]`
  },

  TROUBLESHOOT_COURSES_JOBS_FILTERS: {
    PT: `🔎 **CURSOS, VAGAS OU SERVIÇOS NÃO APARECEM — COMO RESOLVER**

1. **Repor filtros para "Todos":** Confirma se deixaste algum texto na barra de pesquisa ou um filtro de **Distrito**, **Categoria** ou **Certificação (DGES/IEFP)** selecionado — muda tudo para **"Todos"**.
2. **Cursos Oficiais (174+):** No menu **CURSOS**, podes alternar entre cursos **DGES (131)** e **IEFP (43)** ou ver todas as fontes juntas.
3. **Empregos:** As vagas são sincronizadas diariamente; se nenhuma aparecer num distrito pequeno, seleciona **"Todos os Distritos"** ou **"Remoto"**.
4. **Recarregar ligação:** Se a internet oscilou ao abrir a página, puxa para atualizar ou recarrega o navegador.

[view:LEARNING:Abrir Central de Cursos] [view:JOBS:Ver Vagas de Emprego] [view:MAP:Ver Serviços Locais]`,
    EN: `🔎 **COURSES, JOBS, OR SERVICES NOT SHOWING — HOW TO FIX**

1. **Reset filters to "All":** Clear the search box and reset **District**, **Category**, and **Source/Certification (DGES/IEFP)** filters to **"All"**.
2. **Official Courses (174+):** In **COURSES**, you can filter by **DGES (131)**, **IEFP (43)**, or view all sources together.
3. **Jobs:** Vacancies sync daily; try **"All Districts"** or **"Remote"** if a small district has no active listings.
4. **Refresh:** Reload the page if your connection briefly dropped while loading.

[view:LEARNING:Open Courses Center] [view:JOBS:Open Job Board] [view:MAP:Open Local Services]`,
    ES: `🔎 **CURSOS, EMPLEOS O SERVICIOS NO APARECEN — SOLUCIÓN**

1. **Restablece los filtros a "Todos":** Borra la barra de búsqueda y pon **Distrito**, **Categoría** y **Certificación (DGES/IEFP)** en **"Todos"**.
2. **Cursos Oficiales (174+):** En **CURSOS** tienes cursos **DGES (131)** e **IEFP (43)** disponibles.
3. **Empleos:** Si tu distrito no tiene vacantes hoy, prueba **"Todos los Distritos"** o **"Remoto"**.
4. **Recarga la página** si hubo un corte breve de conexión.

[view:LEARNING:Abrir Cursos] [view:JOBS:Ver Empleos] [view:MAP:Ver Servicios Locales]`,
    FR: `🔎 **COURS, EMPLOIS OU SERVICES N'APPARAISSENT PAS — SOLUTION**

1. **Réinitialisez les filtres sur « Tous » :** Videz la recherche et remettez **District**, **Catégorie** et **Certification (DGES/IEFP)** sur **« Tous »**.
2. **Cours Officiels (174+) :** Dans **COURS**, retrouvez les formations **DGES (131)** et **IEFP (43)**.
3. **Emplois :** Essayez **« Tous les Districts »** si aucune offre n'apparaît dans votre ville.
4. **Rechargez la page** si votre connexion a été interrompue.

[view:LEARNING:Ouvrir les Cours] [view:JOBS:Voir les Emplois] [view:MAP:Voir les Services Locaux]`
  },

  TROUBLESHOOT_AUDIO_LANG: {
    PT: `🔊 **ÁUDIO / VOZ OU IDIOMA NÃO FUNCIONA — COMO RESOLVER**

1. **Ativar áudio no navegador:** Toca/clica uma vez no ecrã antes de reproduzir áudio (os navegadores bloqueiam som automático sem clique prévio) e verifica se o telemóvel não está em modo silêncio.
2. **Mudar o idioma da plataforma (PT / EN / ES / FR):** Clica no ícone do **globo (🌐)** no canto superior direito da barra de topo e escolhe o teu idioma.
3. **Tradução na Comunidade:** Em cada publicação da Comunidade existe o botão de tradução instantânea para o teu idioma escolhido.

[view:HOME:Ir para o Início] [view:COMMUNITY:Abrir Comunidade]`,
    EN: `🔊 **AUDIO / VOICE OR LANGUAGE NOT WORKING — HOW TO FIX**

1. **Unlock browser audio:** Tap/click once on the screen before playing voice (browsers block autoplay audio until user interaction) and check device volume/mute.
2. **Change app language (PT / EN / ES / FR):** Click the **globe icon (🌐)** in the top-right bar to switch languages.
3. **Community translation:** Use the translate button on any post to read it in your chosen language.

[view:HOME:Go to Home] [view:COMMUNITY:Open Community]`,
    ES: `🔊 **AUDIO / VOZ O IDIOMA NO FUNCIONA — SOLUCIÓN**

1. **Activar audio:** Toca una vez en la pantalla antes de reproducir la voz (los navegadores bloquean el sonido automático) y comprueba el volumen del dispositivo.
2. **Cambiar idioma (PT / EN / ES / FR):** Pulsa el icono del **globo (🌐)** en la barra superior derecha.
3. **Traducción en Comunidad:** Cada publicación tiene botón de traducción automática.

[view:HOME:Ir al Inicio] [view:COMMUNITY:Abrir Comunidad]`,
    FR: `🔊 **AUDIO / VOIX OU LANGUE NE FONCTIONNE PAS — SOLUTION**

1. **Activer l'audio :** Touchez l'écran une fois avant d'activer la voix (les navigateurs bloquent l'audio automatique) et vérifiez le volume.
2. **Changer de langue (PT / EN / ES / FR) :** Cliquez sur l'icône **globe (🌐)** en haut à droite.
3. **Traduction Communauté :** Chaque publication dispose d'un bouton de traduction instantanée.

[view:HOME:Aller à l'Accueil] [view:COMMUNITY:Ouvrir Communauté]`
  },

  TROUBLESHOOT_PWA_INSTALL: {
    PT: `📲 **COMO INSTALAR A APP MIRA NO TELEMÓVEL OU COMPUTADOR (PWA)**

O MIRA funciona como aplicação nativa sem ocupar espaço da loja:
• **Android (Google Chrome):** Toca no menu **(⋮)** no canto superior direito → **"Instalar aplicação"** ou **"Adicionar ao ecrã principal"** (ou usa o botão de instalação no Início).
• **iPhone / iPad (Safari):** Abre \`miraimigrante.pt\` no **Safari** → toca em **Partilhar** (quadrado com seta para cima) → **"Adicionar ao ecrã principal"** → **Adicionar**.
• **Computador (Chrome / Edge):** Clica no ícone de instalação na extremidade direita da barra de endereço.

[view:HOME:Ir para o Início]`,
    EN: `📲 **HOW TO INSTALL THE MIRA APP ON MOBILE OR DESKTOP (PWA)**

• **Android (Chrome):** Tap the menu **(⋮)** → **"Install app"** or **"Add to Home screen"**.
• **iPhone / iPad (Safari):** Open \`miraimigrante.pt\` in **Safari** → tap **Share** → **"Add to Home Screen"**.
• **Desktop (Chrome / Edge):** Click the install icon on the right side of the address bar.

[view:HOME:Go to Home]`,
    ES: `📲 **CÓMO INSTALAR LA APP MIRA EN MÓVIL O COMPUTADOR (PWA)**

• **Android (Chrome):** Pulsa el menú **(⋮)** → **"Instalar aplicación"** o **"Añadir a pantalla de inicio"**.
• **iPhone / iPad (Safari):** Abre \`miraimigrante.pt\` en **Safari** → pulsa **Compartir** → **"Añadir a pantalla de inicio"**.
• **Computador (Chrome / Edge):** Pulsa el icono de instalación en la barra de direcciones.

[view:HOME:Ir al Inicio]`,
    FR: `📲 **COMMENT INSTALLER L'APPLICATION MIRA (PWA)**

• **Android (Chrome) :** Menu **(⋮)** → **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.
• **iPhone / iPad (Safari) :** Ouvrez \`miraimigrante.pt\` dans **Safari** → **Partager** → **« Sur l'écran d'accueil »**.
• **Ordinateur (Chrome / Edge) :** Cliquez sur l'icône d'installation dans la barre d'adresse.

[view:HOME:Aller à l'Accueil]`
  },

  TROUBLESHOOT_GDPR_DELETE: {
    PT: `🛡️ **ELIMINAR CONTA E DADOS PESSOAIS (RGPD)**

Podes exercer o teu direito ao apagamento a qualquer momento:
1. Abre o teu **Perfil** através do botão abaixo.
2. Seleciona a opção de **Eliminar Conta** (auto-exclusão permanente e irreversível, protegida pela tua sessão autenticada).
3. Todos os teus dados pessoais, alertas, publicações, comentários e documentos associados são eliminados de forma atómica.
4. **Se aparecer erro de sessão ou código de referência parcial:** faz logout, entra novamente e tenta outra vez — ou envia o código de referência exibido para **mira.app@hotmail.com** para conclusão imediata pela equipa.

[view:PROFILE:Abrir Meu Perfil] [view:PRIVACY:Ler Política de Privacidade]`,
    EN: `🛡️ **DELETE ACCOUNT & PERSONAL DATA (GDPR)**

1. Open your **Profile** using the button below.
2. Select **Delete Account** (permanent, irreversible self-deletion secured by your authenticated session).
3. If an error or partial reference code appears, sign out and back in to retry, or email the reference code to **mira.app@hotmail.com** for immediate completion.

[view:PROFILE:Open My Profile] [view:PRIVACY:View Privacy Policy]`,
    ES: `🛡️ **ELIMINAR CUENTA Y DATOS PERSONALES (RGPD)**

1. Abre tu **Perfil** con el botón inferior.
2. Selecciona **Eliminar Cuenta** (acción permanente e irreversible protegida por tu sesión).
3. Si aparece un error o código de referencia, cierra sesión, vuelve a entrar o envía el código a **mira.app@hotmail.com**.

[view:PROFILE:Abrir Mi Perfil] [view:PRIVACY:Ver Privacidad]`,
    FR: `🛡️ **SUPPRIMER LE COMPTE ET LES DONNÉES PERSONNELLES (RGPD)**

1. Ouvrez votre **Profil** via le bouton ci-dessous.
2. Choisissez **Supprimer le compte** (suppression définitive sécurisée par votre session).
3. En cas d'erreur ou de code de référence, reconnectez-vous ou envoyez le code à **mira.app@hotmail.com**.

[view:PROFILE:Ouvrir Mon Profil] [view:PRIVACY:Voir Confidentialité]`
  },

  TROUBLESHOOT_COMMUNITY_DM: {
    PT: `👥 **COMO USAR OU RESOLVER ERROS NA COMUNIDADE E MENSAGENS DIRETAS**

• **Publicar, comentar, dar gosto ou votar veracidade:** Exige conta iniciada (visitantes só podem ler). Se um gosto ou post não aparecer de imediato, recarrega a página — em quedas de rede o MIRA guarda localmente e sincroniza ao reconectar.
• **Fact-Checking Comunitário:** Vota se um relato/dica é **Verdadeiro** ou **Suspeito/Fake** para proteger outros imigrantes contra burlas; usa o botão de **Denunciar** em conteúdos abusivos ou ilegais.
• **Mensagens Diretas (Chat Privado):** Clica no nome/foto de um membro na Comunidade para abrir o perfil dele e iniciar uma conversa privada; todas as conversas ficam em **Mensagens**.

[view:COMMUNITY:Abrir Comunidade] [view:MESSAGES:Abrir Mensagens]`,
    EN: `👥 **COMMUNITY & DIRECT MESSAGES — GUIDE & TROUBLESHOOTING**

• **Posting, commenting, liking, or fact-checking:** Requires signing in (guests have read-only access). If an interaction doesn't update immediately, refresh once your connection stabilizes.
• **Community Fact-Checking:** Vote **Verified** or **Suspicious/Scam** to protect the community, and use **Report** for abusive or fraudulent posts.
• **Direct Messages:** Click any member's name/avatar to open their profile and start a private chat; view all chats in **Messages**.

[view:COMMUNITY:Open Community] [view:MESSAGES:Open Messages]`,
    ES: `👥 **COMUNIDAD Y MENSAJES DIRECTOS — GUÍA Y SOLUCIÓN DE ERRORES**

• **Publicar, comentar, dar like o votar:** Requiere iniciar sesión. Si una acción no se guarda por corte de red, recarga cuando vuelva la conexión.
• **Fact-Checking:** Vota si una publicación es verdadera o sospechosa/estafa y denuncia contenidos abusivos.
• **Mensajes Directos:** Pulsa en el perfil de un miembro en la Comunidad para iniciar un chat privado.

[view:COMMUNITY:Abrir Comunidad] [view:MESSAGES:Abrir Mensajes]`,
    FR: `👥 **COMMUNAUTÉ & MESSAGES DIRECTS — GUIDE ET DÉPANNAGE**

• **Publier, commenter, aimer ou voter :** Nécessite d'être connecté. Rechargez la page si votre connexion a été interrompue.
• **Fact-Checking :** Votez sur la véracité des témoignages et signalez les contenus frauduleux.
• **Messages Directs :** Cliquez sur le profil d'un membre dans la Communauté pour démarrer une discussion privée.

[view:COMMUNITY:Ouvrir Communauté] [view:MESSAGES:Ouvrir Messages]`
  },

  TROUBLESHOOT_GENERIC: {
    PT: `🛠️ **SUPORTE TÉCNICO MIRA — RESOLUÇÃO RÁPIDA DE ERROS**

Para resolver a maioria dos erros na plataforma, testa estes 4 passos rápidos:
1. **Recarregar sem cache:** \`Ctrl + Shift + R\` no computador, ou fecha e reabre a app no telemóvel.
2. **Confirmar sessão e internet:** Se vês erro de permissão ou carregamento, sai da conta e volta a entrar.
3. **Abrir fora de redes sociais:** Usa diretamente o **Chrome** ou **Safari** (evita o navegador interno do Instagram/WhatsApp).
4. **Repor filtros:** Em Empregos, Cursos ou Serviços Locais, muda todos os filtros para **"Todos"**.

Para eu te ajudar de forma exata agora, diz-me:
• Em **qual módulo** aconteceu (ex.: Login, Empregos, Cursos, Comunidade, PDF, Simuladores)?
• Qual a **mensagem de erro** que apareceu?

Se o problema persistir, podes também reportar à equipa pelo botão de **Sugestões** no Início ou por email para **mira.app@hotmail.com**.
[view:HOME:Ir para o Início]`,
    EN: `🛠️ **MIRA TECHNICAL SUPPORT — QUICK ERROR FIX**

Try these 4 quick checks:
1. **Hard refresh:** \`Ctrl + Shift + R\` on desktop, or close and reopen the tab/app on mobile.
2. **Check session & connection:** Sign out and sign back in if you see an auth or loading error.
3. **Use Chrome or Safari directly:** Avoid in-app browsers inside Instagram/WhatsApp.
4. **Reset filters:** On Jobs, Courses, or Local Services, reset all filters to **"All"**.

Tell me **which module** had the issue and the **exact error message** so I can help step by step, or report it via **mira.app@hotmail.com**.
[view:HOME:Go to Home]`,
    ES: `🛠️ **SOPORTE TÉCNICO MIRA — SOLUCIÓN RÁPIDA DE ERRORES**

Prueba estos 4 pasos rápidos:
1. **Recarga sin caché:** \`Ctrl + Shift + R\` en PC, o cierra y reabre la app en el móvil.
2. **Verifica sesión y conexión:** Cierra sesión y vuelve a entrar si aparece error de carga o permiso.
3. **Usa Chrome o Safari directamente:** Evita el navegador interno de Instagram/WhatsApp.
4. **Restablece filtros:** En Empleos, Cursos o Servicios, pon todos los filtros en **"Todos"**.

Dime en **qué módulo** ocurrió y el **mensaje de error** para ayudarte mejor, o escríbenos a **mira.app@hotmail.com**.
[view:HOME:Ir al Inicio]`,
    FR: `🛠️ **SUPPORT TECHNIQUE MIRA — RÉSOLUTION RAPIDE**

Essayez ces 4 étapes :
1. **Rechargement forcé :** \`Ctrl + Shift + R\` sur ordinateur, ou fermez et rouvrez sur mobile.
2. **Vérifiez la session :** Déconnectez-vous puis reconnectez-vous en cas d'erreur de chargement.
3. **Utilisez Chrome ou Safari :** Évitez le navigateur intégré d'Instagram/WhatsApp.
4. **Réinitialisez les filtres :** Remettez tous les filtres sur **« Tous »**.

Indiquez-moi **quel module** pose problème et le **message d'erreur**, ou écrivez à **mira.app@hotmail.com**.
[view:HOME:Aller à l'Accueil]`
  }
} as const;

/**
 * Matches user questions about how MIRA modules work or how to resolve platform errors.
 * Returns null if the query is not about MIRA app usage / troubleshooting (e.g. AIMA/visa law).
 */
export function matchMiraAppSupport(prompt: string, lang: Lang): string | null {
  const n = normalize(prompt);
  if (!n || n.length < 3) return null;

  const isImmigrationEntity = /\b(aima|sefs?|consulado|vfs|financas|seguranca social|sns|junta de freguesia|irn|passaporte)\b/.test(n);

  // 1. Account deletion / RGPD
  if (/(apagar|eliminar|excluir|deletar|delete|supprimer).*(conta|account|cuenta|compte|dados)/.test(n) ||
      /\b(auto-exclusao|autoexclusao|excluir minha conta|apagar minha conta)\b/.test(n)) {
    return RESPONSES.TROUBLESHOOT_GDPR_DELETE[lang];
  }

  // 2. PWA installation
  if (/(instalar|install|baixar|download).*(app|aplicativo|aplicacao|mira|pwa|telemovel|celular|iphone|android)/.test(n) ||
      /\b(pwa|ecra principal|tela inicial|home screen)\b/.test(n)) {
    return RESPONSES.TROUBLESHOOT_PWA_INSTALL[lang];
  }

  // 3. Login / password / session errors
  if (/(login|entrar na conta|nao consigo entrar|no puedo entrar|cannot login|cant log in|sessao expirada|session expired|palavra-passe|palavra passe|esqueci a senha|forgot password|recuperar senha|recuperar palavra|mot de passe)/.test(n)) {
    return RESPONSES.TROUBLESHOOT_LOGIN[lang];
  }

  // 4. Slow / freeze / blank screen / cache
  if (/(lento|lenta|travando|travou|trava|congelando|congelou|ecra em branco|tela branca|blank screen|white screen|freezing|freezes|slow|bloqueado|cache|nao carrega|nao abre|no carga|ne charge pas)/.test(n) && !isImmigrationEntity) {
    return RESPONSES.TROUBLESHOOT_SLOW_CRASH[lang];
  }

  // 5. Job alerts & notifications troubleshooting / guide
  if (/(alerta|alertas|notificac|notification).*(vaga|emprego|job|nao chega|nao recebo|como criar|criar|ativar|desativar|erro|funciona|not working|no llega|marche pas)/.test(n) ||
      /(como criar alerta|criar alerta de emprego|gerir alertas)/.test(n)) {
    return RESPONSES.TROUBLESHOOT_ALERTS_NOTIF[lang];
  }

  // 6. PDF download / generation errors
  if (/(pdf|minuta).*(erro|nao baixa|nao gera|nao abre|nao consigo|problema|error|fail|cant download|no descarga|marche pas)/.test(n) ||
      /(erro ao gerar|erro ao baixar|baixar pdf|download pdf)/.test(n)) {
    return RESPONSES.TROUBLESHOOT_PDF[lang];
  }

  // 7. Audio / voice / language / translation issues
  if (/(audio|voz|som|microfone|voice|sound|idioma|language|mudar idioma|trocar idioma|change language|traducao|translation).*(erro|nao funciona|nao toca|nao sai|mudo|mudar|trocar|como|not working|no funciona|marche pas)/.test(n) ||
      /(mudar idioma|trocar idioma|change language|cambiar idioma|changer de langue)/.test(n)) {
    return RESPONSES.TROUBLESHOOT_AUDIO_LANG[lang];
  }

  // 8. Community & Direct Messages guide / errors
  if (/(comunidade|community|comunidad|communaute|mensagem direta|mensagens diretas|chat privado|direct message|fact-checking|fact checking).*(como funciona|como usar|erro|nao consigo|problema|publicar|comentar|gosto|like|denunciar|enviar|help|error)/.test(n) ||
      /(nao consigo publicar|nao consigo comentar|como enviar mensagem privada)/.test(n)) {
    return RESPONSES.TROUBLESHOOT_COMMUNITY_DM[lang];
  }

  // 9. Courses / Jobs / Local services not showing / filters
  if (/(curso|cursos|vaga|vagas|emprego|servicos locais|mapa|courses|jobs).*(nao aparece|nao aparecem|sumiu|sumiram|vazio|sem resultados|nao encontra|not showing|no results|no aparecen|onde fica|onde ficam)/.test(n)) {
    return RESPONSES.TROUBLESHOOT_COURSES_JOBS_FILTERS[lang];
  }

  // 10. Full MIRA modules guide
  if (/(como funciona|funcionalidades|modulos|módulos|ferramentas|o que tem|o que faz|tutorial|manual|how does mira|mira modules|como usar o mira|como usar a plataforma|como usar o app|comment fonctionne mira|como funciona mira)/.test(n) &&
      /(mira|app|aplicacao|aplicativo|plataforma|modulo|funcionalidade|manual|tutorial|platform|tools|features)/.test(n)) {
    return RESPONSES.ALL_MODULES[lang];
  }

  // 11. Generic app error / bug / technical support
  if (/(erro no app|erro na plataforma|erro no site|erro no mira|bug|deu erro|esta com erro|nao funciona|no funciona|not working|ne fonctionne pas|suporte tecnico|ajuda tecnica|reportar erro|reportar bug)/.test(n) && !isImmigrationEntity) {
    return RESPONSES.TROUBLESHOOT_GENERIC[lang];
  }

  return null;
}

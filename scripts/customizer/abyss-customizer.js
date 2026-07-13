(function () {
  "use strict";

  /* Abyss companion customizer for JS Injector. */

  /* Refactored/optimized version: keeps the original behavior and includes the Hero Banner trailer guard. */

  /*
      Jellyfin web customizer

      Purpose:
      - Adds a compact floating navigation bar with a dynamic library menu.
      - Keeps selected native header controls hidden outside playback.
      - Restores the native back button while playback is active.
      - Applies detail-page layout fixes for seasons, media rows, trailers, and related sections.
      - Filters selected search result sections for a cleaner browsing experience.

      Notes:
      - Legacy cleanup identifiers are intentionally retained so older injected versions can be removed safely.
      - Localized UI labels are kept in multiple languages because the web client can render German or English text.
    */

  /**
   * @typedef {{ target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions }} RegisteredListener
   */

  /**
   * @typedef {{ id: string, name: string, type: string }} LibraryView
   */

  const CLEANUP_NAMES = [
    "__jfSeasonCustomizerCleanup",
    "__jfSeasonMenuPosterKillerCleanup",
    "__jfHideMediaBarAndHeaderButtonsCleanup",
    "__jfMoonfinStyleNavCleanup",
    "__jfLibraryNavigationRouteFixCleanup",
    "__jfFinalCustomizerCleanup",
    "__jfWhoWatchingProfileModalCleanup",
    "__jfStrictProfileOnlyCleanup",
    "__jfProfileAvatarGearFixCleanup",
    "__jfSearchEpisodesHideCleanup",
    "__jfSearchPeopleHideCleanup",
    "__jfPlayerBackButtonFixCleanup",
    "__jfTrailerButtonHideCleanup",
    "__jfShuffleButtonHideCleanup",
    "__jfWhoWatchingOnlinePrivacyCleanup",
  ];

  CLEANUP_NAMES.forEach((name) => {
    try {
      window[name]?.();
    } catch {}
  });

  const LEGACY_PLAYER_BACK_MIRROR_ID = "jfPlayerBackMirror";

  const ID = {
    nav: "jfCustomStyleNav",
    libraryMenu: "jfCustomLibraryMenu",
    profileMirror: "jfOriginalProfileMirror",
  };

  const CLASS = {
    playerActive: "jf-video-player-active",
    seasonSection: "jf-seasons-section",
    hasSeasons: "jf-has-seasons-section",
    seasonPage: "jf-season-detail-page",
    moreLike: "jf-more-like-this-section",
    moreLikeHidden: "jf-season-hide-more-like",
    moreLikeDuplicate: "jf-more-like-duplicate",
    episodeSection: "jf-episodes-section",
    seasonPosterHidden: "jf-season-poster-hide-hard",
    mediaRowHidden: "jf-media-row-hide-hard",
    searchPage: "jf-search-page",
    searchEpisodesHidden: "jf-search-episodes-hide-hard",
    searchPeopleHidden: "jf-search-people-hide-hard",
    playerBackVisible: "jf-player-back-visible",
    trailerButtonHidden: "jf-trailer-button-hide-hard",
    shuffleButtonHidden: "jf-shuffle-button-hide-hard",
    uiHidden: "jf-hide-ui-hard",
    originalTabsHidden: "jf-original-home-fav-tabs-hidden",
    originalSearchHidden: "jf-original-search-button-hidden",
    dropdown: "customSeasonDropdown",
  };

  const LABELS = {
    moreLike: ["more like this", "ähnliche titel", "ähnliches", "similar"],
    seasons: ["seasons", "staffeln", "series"],
    episodes: ["episodes", "episoden", "folgen"],
    people: [
      "people",
      "personen",
      "person",
      "actors",
      "schauspieler",
      "besetzung",
    ],
    mediaRows: ["video", "audio", "subtitles", "subtitle", "untertitel"],
  };

  const SELECTORS = {
    headings: "h1, h2, h3, .sectionTitle, .sectionTitleText",

    sectionCards:
      ".card, .cardBox, .overflowBackdropCard, .itemsContainer, .emby-scroller, .scrollSlider, .scrollFrame, .listItem, .listItemBody",

    headerSearch: [
      ".headerSearchButton",
      ".btnSearch",
      "button[title='Search']",
      "button[aria-label='Search']",
      "button[title='Suche']",
      "button[aria-label='Suche']",
      "button[title*='Search']",
      "button[aria-label*='Search']",
      "button[title*='Suche']",
      "button[aria-label*='Suche']",
    ].join(","),

    profileButton: [
      ".headerUserButton",
      ".userMenuButton",
      ".btnUser",
      ".headerProfileButton",
      ".userProfileButton",
      ".paper-icon-button-light.headerUserButton",
      "button[title='Profile']",
      "button[aria-label='Profile']",
      "button[title='Profil']",
      "button[aria-label='Profil']",
      "button[title*='Profile']",
      "button[aria-label*='Profile']",
      "button[title*='Profil']",
      "button[aria-label*='Profil']",
    ].join(","),

    nativeHeaderControls: [
      ":is(.skinHeader, header) .headerBackButton",
      ":is(.skinHeader, header) .btnHeaderBack",
      ":is(.skinHeader, header) .btnBack",
      ":is(.skinHeader, header) .btnBack",
      ":is(.skinHeader, header) .headerHomeButton",
      ":is(.skinHeader, header) .btnHome",
      ":is(.skinHeader, header) .mainDrawerButton",
      ":is(.skinHeader, header) .headerMenuButton",
      ":is(.skinHeader, header) .btnMainMenu",
      ":is(.skinHeader, header) .btnNavMenu",
      ":is(.skinHeader, header) .btnMenu",
      ":is(.skinHeader, header) button[title='Back']",
      ":is(.skinHeader, header) button[aria-label='Back']",
      ":is(.skinHeader, header) button[title='Zurück']",
      ":is(.skinHeader, header) button[aria-label='Zurück']",
      ":is(.skinHeader, header) button[title='Home']",
      ":is(.skinHeader, header) button[aria-label='Home']",
      ":is(.skinHeader, header) button[title='Startseite']",
      ":is(.skinHeader, header) button[aria-label='Startseite']",
      ":is(.skinHeader, header) button[title='Menu']",
      ":is(.skinHeader, header) button[aria-label='Menu']",
      ":is(.skinHeader, header) button[title='Menü']",
      ":is(.skinHeader, header) button[aria-label='Menü']",
    ].join(","),

    playerBackButton: [
      ".videoOsdHeader .headerBackButton",
      ".videoOsdHeader .btnHeaderBack",
      ".videoOsdHeader .btnBack",
      ".videoOsdHeader button[title='Back']",
      ".videoOsdHeader button[aria-label='Back']",
      ".videoOsdHeader button[title='Zurück']",
      ".videoOsdHeader button[aria-label='Zurück']",
      "#videoOsdPage .headerBackButton",
      "#videoOsdPage .btnHeaderBack",
      "#videoOsdPage .btnBack",
      "#videoOsdPage button[title='Back']",
      "#videoOsdPage button[aria-label='Back']",
      "#videoOsdPage button[title='Zurück']",
      "#videoOsdPage button[aria-label='Zurück']",
      ".videoOsdPage .headerBackButton",
      ".videoOsdPage .btnHeaderBack",
      ".videoOsdPage .btnBack",
      ".videoOsdPage button[title='Back']",
      ".videoOsdPage button[aria-label='Back']",
      ".videoOsdPage button[title='Zurück']",
      ".videoOsdPage button[aria-label='Zurück']",
      ".videoPlayerPage .headerBackButton",
      ".videoPlayerPage .btnHeaderBack",
      ".videoPlayerPage .btnBack",
      ".videoPlayerPage button[title='Back']",
      ".videoPlayerPage button[aria-label='Back']",
      ".videoPlayerPage button[title='Zurück']",
      ".videoPlayerPage button[aria-label='Zurück']",
      ":is(.skinHeader, header) .headerBackButton",
      ":is(.skinHeader, header) .btnHeaderBack",
      ":is(.skinHeader, header) .btnBack",
      ":is(.skinHeader, header) button[title='Back']",
      ":is(.skinHeader, header) button[aria-label='Back']",
      ":is(.skinHeader, header) button[title='Zurück']",
      ":is(.skinHeader, header) button[aria-label='Zurück']",
    ].join(","),

    detailTrailerButton: [
      ".btnPlayTrailer",
      ".btnTrailer",
      ".buttonTrailer",
      ".btnPlayExternalTrailer",
      "button[title='Trailer']",
      "button[aria-label='Trailer']",
      "button[title*='Trailer']",
      "button[aria-label*='Trailer']",
      "a[title='Trailer']",
      "a[aria-label='Trailer']",
      "a[title*='Trailer']",
      "a[aria-label*='Trailer']",
      "[data-action='trailer']",
      "[data-action*='trailer']",
      "[data-type='Trailer']",
      "[data-itemtype='Trailer']",
    ].join(","),

    detailShuffleButton: [
      ".btnShuffle",
      ".buttonShuffle",
      ".shuffleButton",
      "button[title='Shuffle']",
      "button[aria-label='Shuffle']",
      "button[title*='Shuffle']",
      "button[aria-label*='Shuffle']",
      "button[title*='Zufall']",
      "button[aria-label*='Zufall']",
      "button[title*='Zufallswiedergabe']",
      "button[aria-label*='Zufallswiedergabe']",
      "button[title*='Mischen']",
      "button[aria-label*='Mischen']",
      "a[title='Shuffle']",
      "a[aria-label='Shuffle']",
      "a[title*='Shuffle']",
      "a[aria-label*='Shuffle']",
      "a[title*='Zufall']",
      "a[aria-label*='Zufall']",
      "a[title*='Zufallswiedergabe']",
      "a[aria-label*='Zufallswiedergabe']",
      "a[title*='Mischen']",
      "a[aria-label*='Mischen']",
      "[data-action='shuffle']",
      "[data-action*='shuffle']",
      "[data-command='shuffle']",
      "[data-command*='shuffle']",
      "[data-testid*='shuffle']",
      "[class*='shuffle']",
    ].join(","),
    hiddenHeaderControls: [
      ".headerSyncButton",
      ".headerCastButton",
      "#slides-container .pause-button",
      "#slides-container .pauseButton",
      "#slides-container #pauseButton",
      ".pause-button",
      ".pauseButton",
      "#pauseButton",
      "[class*='pause-button']",
      "[class*='pauseButton']",
      "[class*='PauseButton']",
    ].join(","),

    loginPage: [
      ".manualLoginForm",
      ".loginPage",
      "#loginPage",
      ".loginDisclaimer",
      ".visualLoginForm",
      ".readOnlyContent form",
      "input[type='password']",
    ].join(","),

    detailRoot:
      ".detailSectionContent, .detailPageContent, .detailPagePrimaryContent, .itemDetailsGroup",

    seasonPosterContainers: [
      ".detailImageContainer",
      ".detailPageImageContainer",
      ".leftFixedDetailImageContainer",
      ".itemImageContainer",
      ".primaryImageContainer",
      ".detailImageCard",
      ".detailImageContainerCard",
      ".detailPoster",
      ".itemPoster",
      ".portraitDetailImageContainer",
      ".verticalDetailImageContainer",
      ".detailPagePrimaryContainer > .card",
      ".detailPagePrimaryContainer > .cardBox",
      ".detailPagePrimaryContainer > .overflowPortraitCard",
      ".detailPagePrimaryContainer > .portraitCard",
    ].join(","),

    posterVisuals: [
      "img",
      "picture",
      ".card",
      ".cardBox",
      ".cardImageContainer",
      ".cardImage",
      ".overflowPortraitCard",
      ".portraitCard",
      "[style*='background-image']",
    ].join(","),
  };

  const ICONS = {
    home: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.2a.5.5 0 0 1-.5-.5v-5.4H9.2v5.4a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5v-9.7Z"/>
            </svg>
        `,
    search: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10.7 4a6.7 6.7 0 0 1 5.3 10.8l4 4a1 1 0 0 1-1.4 1.4l-4-4A6.7 6.7 0 1 1 10.7 4Zm0 2a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Z"/>
            </svg>
        `,
    library: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
            </svg>
        `,
    movie: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
            </svg>
        `,
    series: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-7 4V7z"/>
            </svg>
        `,
    user: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12.5a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4Zm0 2c-4.6 0-8.2 2.4-8.2 5.4 0 .6.5 1.1 1.1 1.1h14.2c.6 0 1.1-.5 1.1-1.1 0-3-3.6-5.4-8.2-5.4Z"/>
            </svg>
        `,
    settings: `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.37-.31-.6-.22l-2.49 1a7.15 7.15 0 0 0-1.69-.98L14.5 2.42A.51.51 0 0 0 14 2h-4c-.25 0-.46.18-.5.42L9.12 5.07c-.61.24-1.18.56-1.69.98l-2.49-1a.51.51 0 0 0-.6.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.12.22.37.31.6.22l2.49-1c.51.4 1.08.73 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.61-.24 1.18-.56 1.69-.98l2.49 1c.23.08.48 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"></path>
            </svg>
        `,
    close: `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.42L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"></path>
            </svg>
        `,
  };

  const CONFIG = {
    nativeMenuOpenDelay: 80,
    onlyOnHomeScreen: false,
  };

  const PLAYER_SURFACE_SELECTOR = [
    "#videoOsdPage",
    ".videoOsdPage",
    ".videoPlayerContainer",
    ".videoPlayerPage",
    ".htmlVideoPlayer",
    ".videoOsdBottom",
    ".videoOsdHeader",
    ".osdControls",
    ".nowPlayingPage",
  ].join(",");

  const PLAYER_CONTAINER_SELECTOR = [
    "#videoOsdPage",
    ".videoOsdPage",
    ".videoPlayerPage",
    ".videoPlayerContainer",
    ".nowPlayingPage",
  ].join(",");

  const HERO_TRAILER_TERMS = [
    "hero",
    "banner",
    "slide",
    "slides",
    "mbe",
    "media-bar",
    "mediabar",
    "media bar",
    "trailer",
  ];

  const MEDIA_ROW_LABEL_SET = new Set(LABELS.mediaRows);

  const HARD_HIDE_STYLE = {
    display: "none",
    visibility: "hidden",
    opacity: "0",
    width: "0",
    "min-width": "0",
    "max-width": "0",
    height: "0",
    "min-height": "0",
    "max-height": "0",
    margin: "0",
    padding: "0",
    overflow: "hidden",
    "pointer-events": "none",
  };

  const HARD_HIDE_STYLE_PROPS = Object.keys(HARD_HIDE_STYLE);
  const PLAYER_BACK_VISIBLE_STYLE_PROPS = [...HARD_HIDE_STYLE_PROPS, "z-index"];

  const state = {
    lastUrl: location.href,
    currentItemType: null,
    lastItemId: null,
    lastIsSeason: false,
    libraries: null,
    librariesLoading: false,

    observer: null,
    runTimer: null,
    retryTimer: null,
    stabilizeTimer: null,
    recoveryTimer: null,
    interactionFrame: 0,
    stabilizeUntil: 0,
    lastVideoPlayerActive: false,
    isRunning: false,
    isInternalMove: false,
    listeners: [],

    profileMirrorAvatarUrl: "",
    profileMirrorLoading: false,
  };

  const originalPushState = window.__jfOriginalPushState || history.pushState;
  const originalReplaceState =
    window.__jfOriginalReplaceState || history.replaceState;

  window.__jfOriginalPushState = originalPushState;
  window.__jfOriginalReplaceState = originalReplaceState;

  /**
   * Registers an event listener and stores it for deterministic cleanup.
   * @param {EventTarget | null | undefined} target
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} handler
   * @param {boolean | AddEventListenerOptions=} options
   */
  function addListener(target, type, handler, options) {
    if (!target) return;

    target.addEventListener(type, handler, options);
    state.listeners.push({ target, type, handler, options });
  }

  /**
   * Normalizes user-facing text before localized label matching.
   * @param {unknown} value
   * @returns {string}
   */
  function normalizeText(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeLower(value) {
    return normalizeText(value).toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getHash() {
    return String(location.hash || "").toLowerCase();
  }

  function getApiClient() {
    if (window.ApiClient) return window.ApiClient;

    try {
      if (window.ConnectionManager?.currentApiClient) {
        return window.ConnectionManager.currentApiClient();
      }
    } catch {}

    return null;
  }

  function apiUrl(path) {
    const apiClient = getApiClient();
    const cleanPath = String(path || "").replace(/^\/+/, "");

    try {
      if (apiClient?.getUrl) {
        return apiClient.getUrl(cleanPath);
      }
    } catch {}

    return `${location.origin}/${cleanPath}`;
  }

  /**
   * Reads JSON from the active server using the web client API when available.
   * @param {string} path
   * @returns {Promise<any>}
   */
  async function apiGet(path) {
    const apiClient = getApiClient();
    const url = apiUrl(path);

    try {
      if (apiClient?.ajax) {
        return await apiClient.ajax({
          type: "GET",
          url,
          dataType: "json",
        });
      }

      if (apiClient?.getJSON) {
        return await apiClient.getJSON(url);
      }
    } catch (error) {
      throw error;
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  function getApiAccessToken() {
    const apiClient = getApiClient();

    try {
      return (
        apiClient?.accessToken?.() ||
        apiClient?._serverInfo?.AccessToken ||
        apiClient?._accessToken ||
        window.ApiClient?._serverInfo?.AccessToken ||
        ""
      );
    } catch {
      return "";
    }
  }
  function getCurrentUserId() {
    const apiClient = getApiClient();

    try {
      return (
        apiClient?.getCurrentUserId?.() ||
        apiClient?._serverInfo?.UserId ||
        apiClient?._currentUserId ||
        window.ApiClient?._serverInfo?.UserId ||
        null
      );
    } catch {
      return null;
    }
  }

  async function getCurrentUser() {
    const apiClient = getApiClient();

    try {
      if (apiClient?.getCurrentUser) {
        const user = await apiClient.getCurrentUser();
        if (user?.Id) return user;
      }
    } catch {}

    const userId = getCurrentUserId();

    if (!userId) return null;

    try {
      return await apiGet(`Users/${encodeURIComponent(userId)}`);
    } catch {
      return { Id: userId, Name: "Aktuelles Profil" };
    }
  }

  function isLoggedIn() {
    return Boolean(getCurrentUserId());
  }

  function isLoginPage() {
    const hash = getHash();
    const href = location.href.toLowerCase();

    if (
      hash.includes("login") ||
      hash.includes("forgotpassword") ||
      hash.includes("selectserver") ||
      hash.includes("startup") ||
      hash.includes("wizard") ||
      href.includes("login.html") ||
      href.includes("forgotpassword")
    ) {
      return true;
    }

    if (!isLoggedIn() && document.querySelector(SELECTORS.loginPage)) {
      return true;
    }

    if (!isLoggedIn()) {
      const text = normalizeLower(document.body?.innerText || "");

      return (
        text.includes("manuelle anmeldung") ||
        text.includes("passwort vergessen") ||
        text.includes("sign in") ||
        text.includes("log in") ||
        text.includes("forgot password")
      );
    }

    return false;
  }

  /**
   * Checks layout and computed style visibility without relying on a single CSS property.
   * @param {Element | null | undefined} element
   * @returns {boolean}
   */
  function isElementActuallyVisible(element) {
    if (!element?.getBoundingClientRect) return false;

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return Boolean(
      rect.width > 1 &&
      rect.height > 1 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      element.getAttribute("aria-hidden") !== "true",
    );
  }

  function isVisiblePlayerSurface(element) {
    if (!isElementActuallyVisible(element)) return false;

    const rect = element.getBoundingClientRect();

    return Boolean(
      (rect.width >= 220 && rect.height >= 120) ||
      (rect.width >= 320 && rect.height >= 36),
    );
  }

  function hasAncestorSignature(element, terms, maxDepth = 12) {
    let current = element;

    for (let depth = 0; depth < maxDepth && current; depth++) {
      const signature = normalizeLower(
        [
          current.id,
          current.className,
          current.getAttribute?.("data-testid"),
          current.getAttribute?.("data-type"),
          current.getAttribute?.("aria-label"),
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (terms.some((term) => signature.includes(term))) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  }

  function isHeroBannerTrailerVideo(video) {
    if (!video) return false;
    if (video.closest?.(PLAYER_CONTAINER_SELECTOR)) return false;

    return Boolean(
      video.closest?.("#slides-container") ||
      hasAncestorSignature(video, HERO_TRAILER_TERMS),
    );
  }

  function isLargeActiveVideo(video) {
    const rect = video?.getBoundingClientRect?.();

    return Boolean(
      video &&
      !video.paused &&
      !video.ended &&
      video.readyState >= 2 &&
      isElementActuallyVisible(video) &&
      rect &&
      rect.width >= window.innerWidth * 0.72 &&
      rect.height >= window.innerHeight * 0.55,
    );
  }

  function isVideoPlayerActive() {
    const hash = getHash();
    const href = String(location.href || "").toLowerCase();

    if (
      hash.includes("videoosd") ||
      hash.includes("video.html") ||
      hash.includes("livetvplayer") ||
      hash.includes("nowplaying") ||
      href.includes("videoosd") ||
      href.includes("video.html")
    ) {
      return true;
    }

    if (
      Array.from(document.querySelectorAll(PLAYER_SURFACE_SELECTOR)).some(
        isVisiblePlayerSurface,
      )
    ) {
      return true;
    }

    return Array.from(document.querySelectorAll("video")).some((video) => {
      return !isHeroBannerTrailerVideo(video) && isLargeActiveVideo(video);
    });
  }

  function syncVideoPlayerClass() {
    const active = isVideoPlayerActive();

    toggleDocumentClass(CLASS.playerActive, active);

    if (active) {
      restorePlayerBackButton();
    } else {
      removePlayerBackMirror();
      clearPlayerBackVisibleMarks();
    }

    return active;
  }

  function canShowNavigation() {
    const playerActive = syncVideoPlayerClass();

    return isLoggedIn() && !isLoginPage() && !playerActive;
  }
  function isLibraryRoute() {
    const hash = getHash();

    return (
      hash.includes("movies.html") ||
      hash.includes("tv.html") ||
      hash.includes("music.html") ||
      hash.includes("collections.html") ||
      hash.includes("boxsets.html") ||
      hash.includes("books.html") ||
      hash.includes("photos.html") ||
      hash.includes("list.html") ||
      hash.includes("items.html") ||
      hash.includes("topparentid=") ||
      hash.includes("parentid=")
    );
  }

  function requestStabilize(duration = 5000) {
    state.stabilizeUntil = Date.now() + duration;
  }

  /**
   * Queries a root element and includes the root itself when it matches.
   * @param {Document | Element | null | undefined} root
   * @param {string} selector
   * @returns {Element[]}
   */
  function queryAll(root, selector) {
    if (!root) return [];

    const result = [];

    if (root.nodeType === 1 && root.matches?.(selector)) {
      result.push(root);
    }

    if (root.querySelectorAll) {
      result.push(...root.querySelectorAll(selector));
    }

    return result;
  }

  function getClickable(element) {
    return (
      element?.closest?.("button") ||
      element?.closest?.("a") ||
      element?.closest?.("[role='button']") ||
      element?.closest?.(".emby-button") ||
      element
    );
  }

  function setImportantStyle(element, styles) {
    if (!element) return;

    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value, "important");
    });
  }

  function clearInlineStyles(element, properties) {
    if (!element) return;

    properties.forEach((property) => {
      element.style.removeProperty(property);
    });
  }

  function toggleDocumentClass(className, active) {
    document.documentElement.classList.toggle(className, active);
    document.body?.classList.toggle(className, active);
  }

  function hideHard(element) {
    if (!element || element.classList.contains(CLASS.uiHidden)) return;

    element.classList.add(CLASS.uiHidden);
    setImportantStyle(element, HARD_HIDE_STYLE);
  }

  function clearHiddenHard(element) {
    if (!element) return;

    element.classList.remove(CLASS.uiHidden);
    clearInlineStyles(element, HARD_HIDE_STYLE_PROPS);
  }

  function clearPlayerBackVisibleMarks() {
    document
      .querySelectorAll(`.${CLASS.playerBackVisible}`)
      .forEach((element) => {
        element.classList.remove(CLASS.playerBackVisible);
        clearInlineStyles(element, PLAYER_BACK_VISIBLE_STYLE_PROPS);
      });
  }

  function removePlayerBackMirror() {
    document.getElementById(LEGACY_PLAYER_BACK_MIRROR_ID)?.remove();
  }

  function isBlockedPlayerControlBarElement(element) {
    return Boolean(
      element?.closest?.(
        ".videoOsdBottom, .osdControls, .videoControls, .videoOsdControls, .nowPlayingBar, .transportControls, .sliderContainer, .osdBottom, .bottomControls, .playerControls, .videoControlButtons, .buttons, .playbackControls",
      ),
    );
  }

  function getPlayerBackSignal(element) {
    const text = normalizeLower(element?.textContent);
    const className = normalizeLower(element?.className);
    const title = normalizeLower(element?.getAttribute?.("title"));
    const aria = normalizeLower(element?.getAttribute?.("aria-label"));
    const id = normalizeLower(element?.id);
    const combined = `${text} ${className} ${title} ${aria} ${id}`;

    return {
      text,
      className,
      title,
      aria,
      id,
      combined,
      isExplicitBack: Boolean(
        title === "back" ||
        title === "zurück" ||
        title === "zurueck" ||
        aria === "back" ||
        aria === "zurück" ||
        aria === "zurueck" ||
        combined.includes("go back") ||
        combined.includes("previous page") ||
        className.includes("headerbackbutton") ||
        className.includes("btnheaderback") ||
        className.includes("btnback") ||
        id.includes("backbutton") ||
        id.includes("btnback"),
      ),
    };
  }

  function isPlayerHeaderOrSurface(element) {
    return Boolean(
      element?.closest?.(
        ".videoOsdHeader, #videoOsdPage, .videoOsdPage, .videoPlayerPage, .videoPlayerContainer, .nowPlayingPage, .skinHeader, header",
      ),
    );
  }

  function isLikelyPlayerBackButton(element, options = {}) {
    const allowHiddenExplicitBack = Boolean(options.allowHiddenExplicitBack);

    if (!element || element.id === LEGACY_PLAYER_BACK_MIRROR_ID) return false;
    if (
      element.closest?.(
        `#${ID.nav}, #${ID.libraryMenu}, #${ID.profileMirror}, #${LEGACY_PLAYER_BACK_MIRROR_ID}`,
      )
    )
      return false;
    if (isBlockedPlayerControlBarElement(element)) return false;
    if (!element.matches?.("button, a, [role='button'], .emby-button"))
      return false;
    if (!isPlayerHeaderOrSurface(element)) return false;

    const signal = getPlayerBackSignal(element);

    const isClearlyNotBack =
      signal.combined.includes("home") ||
      signal.combined.includes("startseite") ||
      signal.combined.includes("menu") ||
      signal.combined.includes("menü") ||
      signal.combined.includes("search") ||
      signal.combined.includes("suche") ||
      signal.combined.includes("profile") ||
      signal.combined.includes("profil") ||
      signal.combined.includes("cast") ||
      signal.combined.includes("sync") ||
      signal.combined.includes("volume") ||
      signal.combined.includes("lautstärke") ||
      signal.combined.includes("subtitle") ||
      signal.combined.includes("untertitel") ||
      signal.combined.includes("audio") ||
      signal.combined.includes("settings") ||
      signal.combined.includes("einstellungen") ||
      signal.combined.includes("fullscreen") ||
      signal.combined.includes("vollbild") ||
      signal.combined.includes("play") ||
      signal.combined.includes("pause") ||
      signal.combined.includes("rewind") ||
      signal.combined.includes("forward") ||
      signal.combined.includes("skip") ||
      signal.combined.includes("next") ||
      signal.combined.includes("previous chapter");

    if (isClearlyNotBack) return false;

    if (signal.isExplicitBack && allowHiddenExplicitBack) {
      return true;
    }

    const rect = element.getBoundingClientRect?.();
    const style = getComputedStyle(element);

    if (
      !rect ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.top < 0 ||
      rect.top > 128 ||
      rect.left < 0 ||
      rect.left > 220 ||
      style.display === "none" ||
      style.visibility === "hidden"
    ) {
      return false;
    }

    if (signal.isExplicitBack) return true;

    const hasIcon = Boolean(
      element.querySelector?.(
        "svg, i, .material-icons, .material-icons-round, .button-icon, .md-icon",
      ),
    );

    return Boolean(
      isVideoPlayerActive() &&
      rect.width >= 24 &&
      rect.width <= 88 &&
      rect.height >= 24 &&
      rect.height <= 72 &&
      rect.top <= 96 &&
      rect.left <= 120 &&
      (hasIcon || normalizeText(element.textContent).length <= 3),
    );
  }

  function getPlayerBackButtons(root = document) {
    const candidates = new Set();

    queryAll(root, SELECTORS.playerBackButton).forEach((element) => {
      const clickable = getClickable(element);

      if (
        clickable &&
        isLikelyPlayerBackButton(clickable, { allowHiddenExplicitBack: true })
      ) {
        candidates.add(clickable);
      }
    });

    const scanRoots = Array.from(
      document.querySelectorAll(
        ".videoOsdHeader, .skinHeader, header, #videoOsdPage, .videoOsdPage, .videoPlayerPage, .videoPlayerContainer, .nowPlayingPage",
      ),
    );

    scanRoots.forEach((scanRoot) => {
      Array.from(
        scanRoot.querySelectorAll("button, a, [role='button'], .emby-button"),
      ).forEach((element) => {
        if (isLikelyPlayerBackButton(element)) {
          candidates.add(getClickable(element));
        }
      });
    });

    return Array.from(candidates).filter(Boolean);
  }

  function restorePlayerBackElement(element) {
    if (!element || element.id === LEGACY_PLAYER_BACK_MIRROR_ID) return;

    element.classList.add(CLASS.playerBackVisible);
    element.removeAttribute?.("hidden");
    element.removeAttribute?.("aria-hidden");
    clearHiddenHard(element);

    setImportantStyle(element, {
      display: "inline-flex",
      visibility: "visible",
      opacity: "1",
      overflow: "visible",
      "pointer-events": "auto",
      "z-index": "2000001",
    });

    element
      .querySelectorAll?.(
        "svg, i, .material-icons, .material-icons-round, .button-icon, .md-icon",
      )
      .forEach((icon) => {
        icon.classList.remove(CLASS.uiHidden);
        icon.removeAttribute?.("hidden");
        icon.removeAttribute?.("aria-hidden");

        clearInlineStyles(icon, [
          "display",
          "visibility",
          "opacity",
          "width",
          "min-width",
          "max-width",
          "height",
          "min-height",
          "max-height",
          "margin",
          "padding",
          "overflow",
          "pointer-events",
        ]);

        setImportantStyle(icon, {
          display: "block",
          visibility: "visible",
          opacity: "1",
        });
      });
  }

  function restorePlayerBackButton(root = document) {
    removePlayerBackMirror();
    getPlayerBackButtons(root).forEach(restorePlayerBackElement);
  }

  function isStrictTopRightProfileArea(element) {
    if (!element?.getBoundingClientRect) return false;

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return Boolean(
      rect.width >= 16 &&
      rect.height >= 16 &&
      rect.width <= 90 &&
      rect.height <= 90 &&
      rect.top >= 0 &&
      rect.top <= 130 &&
      rect.left >= window.innerWidth - 240 &&
      rect.right <= window.innerWidth + 8 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0",
    );
  }

  function pointerIsInsideElement(event, element) {
    if (!event || !element?.getBoundingClientRect) return false;

    const x = Number(event.clientX);
    const y = Number(event.clientY);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;

    const rect = element.getBoundingClientRect();
    const padding = 4;

    return (
      x >= rect.left - padding &&
      x <= rect.right + padding &&
      y >= rect.top - padding &&
      y <= rect.bottom + padding
    );
  }

  function hasAvatarVisual(element) {
    if (!element) return false;

    if (element.querySelector?.("img")) return true;

    const nodes = [
      element,
      ...Array.from(element.querySelectorAll?.("*") || []),
    ];

    return nodes.some((node) => {
      try {
        const backgroundImage = getComputedStyle(node).backgroundImage;
        return (
          backgroundImage &&
          backgroundImage !== "none" &&
          backgroundImage.includes("url(")
        );
      } catch {
        return false;
      }
    });
  }

  function hasProfileSignal(element) {
    if (!element) return false;

    const className = normalizeLower(element.className);
    const title = normalizeLower(element.getAttribute("title"));
    const aria = normalizeLower(element.getAttribute("aria-label"));

    return (
      title.includes("profile") ||
      title.includes("profil") ||
      aria.includes("profile") ||
      aria.includes("profil") ||
      className.includes("headeruserbutton") ||
      className.includes("usermenubutton") ||
      className.includes("btnuser") ||
      className.includes("headerprofilebutton") ||
      className.includes("userprofilebutton") ||
      className.includes("user") ||
      hasAvatarVisual(element)
    );
  }

  function getAvatarInfo(source) {
    if (!source) return null;

    const image =
      source.querySelector?.("img") ||
      (source.matches?.("img") ? source : null);

    if (image?.src) {
      return { type: "img", value: image.src };
    }

    const nodes = [source, ...Array.from(source.querySelectorAll?.("*") || [])];

    for (const node of nodes) {
      const backgroundImage = getComputedStyle(node).backgroundImage;

      if (
        backgroundImage &&
        backgroundImage !== "none" &&
        backgroundImage.includes("url(")
      ) {
        return { type: "background", value: backgroundImage };
      }
    }

    return null;
  }

  function setProfileMirrorFallback(mirror) {
    if (!mirror) return;

    mirror.innerHTML = ICONS.user;
  }

  function setProfileMirrorImage(mirror, url) {
    if (!mirror || !url) {
      setProfileMirrorFallback(mirror);
      return;
    }

    if (state.profileMirrorAvatarUrl === url && mirror.querySelector("img")) {
      return;
    }

    state.profileMirrorAvatarUrl = url;
    mirror.replaceChildren();

    const image = document.createElement("img");
    image.src = url;
    image.alt = "";
    image.loading = "eager";

    image.onerror = () => {
      if (image.parentElement === mirror) {
        state.profileMirrorAvatarUrl = "";
        setProfileMirrorFallback(mirror);
      }
    };

    mirror.appendChild(image);
  }

  function applyProfileMirrorAvatarFromSource(mirror, source) {
    const avatar = getAvatarInfo(source);

    if (avatar?.type === "img") {
      setProfileMirrorImage(mirror, avatar.value);
      return true;
    }

    if (avatar?.type === "background") {
      if (
        state.profileMirrorAvatarUrl === avatar.value &&
        mirror.querySelector(".jfProfileMirrorBg")
      ) {
        return true;
      }

      state.profileMirrorAvatarUrl = avatar.value;
      mirror.replaceChildren();

      const span = document.createElement("span");
      span.className = "jfProfileMirrorBg";
      span.style.backgroundImage = avatar.value;

      mirror.appendChild(span);
      return true;
    }

    return false;
  }

  async function updateProfileMirrorAvatarFromApi(mirror) {
    if (!mirror || state.profileMirrorLoading) return;

    state.profileMirrorLoading = true;

    try {
      const user = await getCurrentUser();

      if (!user?.Id) {
        setProfileMirrorFallback(mirror);
        return;
      }

      const url = userImageUrl(user);

      if (!url) {
        setProfileMirrorFallback(mirror);
        return;
      }

      setProfileMirrorImage(mirror, url);
    } catch {
      setProfileMirrorFallback(mirror);
    } finally {
      state.profileMirrorLoading = false;
    }
  }
  function isIgnoredCustomNavigation(target) {
    return Boolean(
      target?.closest?.(`#${ID.nav}`) ||
      target?.closest?.(`#${ID.libraryMenu}`),
    );
  }

  function findOriginalProfileButton() {
    const direct = Array.from(
      document.querySelectorAll(SELECTORS.profileButton),
    ).find((element) => {
      return (
        !element.closest(`#${ID.profileMirror}`) &&
        !isIgnoredCustomNavigation(element) &&
        isStrictTopRightProfileArea(element) &&
        hasProfileSignal(element)
      );
    });

    if (direct) return direct;

    const header =
      document.querySelector(".skinHeader") || document.querySelector("header");

    if (!header) return null;

    return (
      Array.from(
        header.querySelectorAll("button, .emby-button, [role='button'], a"),
      ).find((element) => {
        if (element.closest(`#${ID.profileMirror}`)) return false;
        if (isIgnoredCustomNavigation(element)) return false;
        if (!isStrictTopRightProfileArea(element)) return false;

        const text = normalizeLower(element.textContent);
        const className = normalizeLower(element.className);
        const title = normalizeLower(element.getAttribute("title"));
        const aria = normalizeLower(element.getAttribute("aria-label"));

        if (text.includes("home") || text.includes("startseite")) return false;
        if (
          text.includes("favourites") ||
          text.includes("favorites") ||
          text.includes("favoriten")
        )
          return false;
        if (title.includes("search") || title.includes("suche")) return false;
        if (aria.includes("search") || aria.includes("suche")) return false;
        if (
          className.includes("search") ||
          className.includes("cast") ||
          className.includes("sync")
        )
          return false;

        return hasProfileSignal(element);
      }) || null
    );
  }

  function findNativeProfileButtonLoose() {
    const bySelector = Array.from(
      document.querySelectorAll(SELECTORS.profileButton),
    ).find((element) => {
      return (
        !element.closest(`#${ID.profileMirror}`) &&
        !element.closest(`#${ID.nav}`) &&
        !element.closest(`#${ID.libraryMenu}`) &&
        hasProfileSignal(element)
      );
    });

    if (bySelector) return bySelector;

    const header =
      document.querySelector(".skinHeader") ||
      document.querySelector("header") ||
      document.body;

    return (
      Array.from(
        header.querySelectorAll("button, .emby-button, [role='button'], a"),
      ).find((element) => {
        if (element.closest(`#${ID.profileMirror}`)) return false;
        if (element.closest(`#${ID.nav}`)) return false;
        if (element.closest(`#${ID.libraryMenu}`)) return false;

        const text = normalizeLower(element.textContent);
        const className = normalizeLower(element.className);
        const title = normalizeLower(element.getAttribute("title"));
        const aria = normalizeLower(element.getAttribute("aria-label"));

        if (text.includes("home") || text.includes("startseite")) return false;
        if (
          text.includes("favourites") ||
          text.includes("favorites") ||
          text.includes("favoriten")
        )
          return false;
        if (title.includes("search") || title.includes("suche")) return false;
        if (aria.includes("search") || aria.includes("suche")) return false;
        if (
          className.includes("search") ||
          className.includes("cast") ||
          className.includes("sync")
        )
          return false;

        return hasProfileSignal(element);
      }) || null
    );
  }

  function getAllowedProfileTargets() {
    const targets = [];
    const mirror = document.getElementById(ID.profileMirror);
    const original = findOriginalProfileButton();

    if (mirror && isStrictTopRightProfileArea(mirror)) {
      targets.push(mirror);
    }

    if (
      original &&
      isStrictTopRightProfileArea(original) &&
      !targets.includes(original)
    ) {
      targets.push(original);
    }

    return targets;
  }
  function restoreProfileButton() {
    const profile = findOriginalProfileButton();

    if (!profile) return null;

    profile.classList.remove(CLASS.originalSearchHidden, CLASS.uiHidden);

    clearInlineStyles(profile, [
      "display",
      "visibility",
      "opacity",
      "width",
      "min-width",
      "max-width",
      "height",
      "min-height",
      "max-height",
      "margin",
      "padding",
      "overflow",
      "pointer-events",
    ]);

    return profile;
  }

  function syncProfileMirror() {
    const source = restoreProfileButton();
    let mirror = document.getElementById(ID.profileMirror);

    if (source && isStrictTopRightProfileArea(source)) {
      if (mirror) {
        mirror.style.setProperty("display", "none", "important");
      }

      return;
    }

    if (!mirror) {
      mirror = document.createElement("button");
      mirror.id = ID.profileMirror;
      mirror.type = "button";
      mirror.title = "Profil";
      mirror.setAttribute("aria-label", "Profil");
      mirror.innerHTML = ICONS.user;

      mirror.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (pointerIsInsideElement(event, mirror)) {
          openNativeProfileMenu(event);
        }
      });

      document.body.appendChild(mirror);
    }

    mirror.style.removeProperty("display");

    const hasAvatarFromSource = applyProfileMirrorAvatarFromSource(
      mirror,
      source,
    );

    if (!hasAvatarFromSource) {
      updateProfileMirrorAvatarFromApi(mirror);
    }
  }

  function removeNavigation() {
    document.getElementById(ID.nav)?.remove();
    document.getElementById(ID.libraryMenu)?.remove();
    document.getElementById(ID.profileMirror)?.remove();

    document
      .querySelectorAll(`.${CLASS.originalTabsHidden}`)
      .forEach((element) => {
        element.classList.remove(CLASS.originalTabsHidden);
      });

    document
      .querySelectorAll(`.${CLASS.originalSearchHidden}`)
      .forEach((element) => {
        element.classList.remove(CLASS.originalSearchHidden);
      });
  }

  function getHeadings() {
    return Array.from(document.querySelectorAll(SELECTORS.headings));
  }

  function headingMatches(heading, labels) {
    return labels.includes(normalizeLower(heading.textContent));
  }

  function sectionHasContent(section) {
    return Boolean(section?.querySelector?.(SELECTORS.sectionCards));
  }

  function findSmallestSectionFromHeading(heading) {
    let current = heading;

    for (let depth = 0; depth < 14 && current; depth++) {
      const isKnownSection =
        current.id === "childrenCollapsible" ||
        current.classList?.contains("verticalSection") ||
        current.classList?.contains("childrenSection") ||
        current.classList?.contains("section") ||
        current.classList?.contains("detailSection") ||
        current.id?.toLowerCase().includes("collapsible");

      if (isKnownSection && sectionHasContent(current)) {
        return current;
      }

      current = current.parentElement;
    }

    return (
      heading.closest("#childrenCollapsible") ||
      heading.closest(".verticalSection") ||
      heading.closest(".childrenSection") ||
      heading.closest(".section") ||
      heading.closest(".detailSection") ||
      heading.parentElement?.parentElement ||
      heading.parentElement ||
      null
    );
  }

  function findSectionByHeading(labels) {
    const heading = getHeadings().find((item) => headingMatches(item, labels));

    if (!heading) return null;

    const section = findSmallestSectionFromHeading(heading);

    if (!section) return null;

    return { heading, section };
  }

  function findClickableByExactText(labels) {
    const allowedLabels = new Set(labels.map((label) => normalizeLower(label)));

    return (
      Array.from(
        document.querySelectorAll(
          "button, a, [role='button'], .emby-button, .sectionTabs button, .indexPageTabButton, .paper-button",
        ),
      ).find((element) => {
        if (
          element.closest(`#${ID.nav}`) ||
          element.closest(`#${ID.libraryMenu}`) ||
          element.closest(`#${ID.profileMirror}`)
        ) {
          return false;
        }

        return allowedLabels.has(normalizeLower(element.textContent));
      }) || null
    );
  }

  function findHeaderSearchButton() {
    return (
      Array.from(document.querySelectorAll(SELECTORS.headerSearch)).find(
        (element) => {
          return (
            !element.closest(`#${ID.nav}`) &&
            !element.closest(`#${ID.libraryMenu}`) &&
            !element.closest(`#${ID.profileMirror}`)
          );
        },
      ) || null
    );
  }

  function hideOriginalHomeFavouriteTabs() {
    const home = findClickableByExactText(["home", "startseite"]);
    const favourites = findClickableByExactText([
      "favourites",
      "favorites",
      "favoriten",
    ]);

    if (!home || !favourites) return;

    let parent = home;

    for (let depth = 0; depth < 8 && parent; depth++) {
      if (parent.contains(favourites)) {
        if (parent !== document.body && parent !== document.documentElement) {
          parent.classList.add(CLASS.originalTabsHidden);
        }

        return;
      }

      parent = parent.parentElement;
    }
  }

  function hideOriginalSearchButton() {
    findHeaderSearchButton()?.classList.add(CLASS.originalSearchHidden);
  }

  function makeNavButton(action, title, icon) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "jfCustomNavButton";
    button.dataset.action = action;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.innerHTML = icon;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      handleNavAction(action);
    });

    return button;
  }

  function createNavigation() {
    if (!canShowNavigation()) {
      removeNavigation();
      return null;
    }

    let nav = document.getElementById(ID.nav);

    if (nav) return nav;

    nav = document.createElement("div");
    nav.id = ID.nav;

    nav.append(
      makeNavButton("home", "Home", ICONS.home),
      makeNavButton("search", "Suche", ICONS.search),
      makeNavButton("library", "Bibliotheken", ICONS.library),
    );

    document.body.appendChild(nav);

    return nav;
  }

  function createLibraryMenu() {
    if (!canShowNavigation()) {
      removeNavigation();
      return null;
    }

    let menu = document.getElementById(ID.libraryMenu);

    if (menu) return menu;

    menu = document.createElement("div");
    menu.id = ID.libraryMenu;

    const loading = document.createElement("div");
    loading.className = "jfLibraryMenuLoading";
    loading.textContent = "Bibliotheken laden…";

    menu.appendChild(loading);
    document.body.appendChild(menu);

    return menu;
  }

  function closeLibraryMenu() {
    document.getElementById(ID.libraryMenu)?.classList.remove("is-open");
    document
      .querySelector(`#${ID.nav} [data-action="library"]`)
      ?.classList.remove("menu-open");
  }

  function positionLibraryMenu() {
    const menu = document.getElementById(ID.libraryMenu);
    const nav = document.getElementById(ID.nav);
    const button = document.querySelector(`#${ID.nav} [data-action="library"]`);

    if (!menu || (!nav && !button)) return;

    const anchorRect = (nav || button).getBoundingClientRect();
    const gap = 12;
    const edgePadding = 20;
    const menuWidth = menu.offsetWidth || 240;

    const wantedLeft = anchorRect.right + gap;
    const maxLeft = Math.max(
      edgePadding,
      window.innerWidth - menuWidth - edgePadding,
    );
    const left = Math.min(wantedLeft, maxLeft);
    const top = Math.max(12, anchorRect.top);

    menu.style.setProperty("--jf-library-menu-top", `${top}px`);
    menu.style.setProperty("--jf-library-menu-left", `${left}px`);
  }

  function toggleLibraryMenu() {
    if (!canShowNavigation()) {
      removeNavigation();
      return;
    }

    const menu = createLibraryMenu();

    if (!menu) return;

    const button = document.querySelector(`#${ID.nav} [data-action="library"]`);
    const shouldOpen = !menu.classList.contains("is-open");

    closeLibraryMenu();

    if (!shouldOpen) return;

    positionLibraryMenu();
    menu.classList.add("is-open");
    button?.classList.add("menu-open");

    renderLibraryMenu();
  }

  /**
   * Loads and caches library views for the active user.
   * @returns {Promise<LibraryView[]>}
   */
  async function getLibraries() {
    if (state.libraries) return state.libraries;
    if (state.librariesLoading) return [];

    state.librariesLoading = true;

    try {
      const userId = getCurrentUserId();
      const apiClient = getApiClient();

      const result =
        userId && apiClient?.getUserViews
          ? await apiClient.getUserViews(userId)
          : null;

      state.libraries = Array.isArray(result?.Items)
        ? result.Items.filter((item) => item?.Id && item?.Name).map((item) => ({
            id: item.Id,
            name: item.Name,
            type: item.CollectionType || item.Type || "",
          }))
        : [];

      return state.libraries;
    } catch {
      state.libraries = [];
      return state.libraries;
    } finally {
      state.librariesLoading = false;
    }
  }

  function getLibraryIcon(name, type) {
    const lowerName = normalizeLower(name);
    const lowerType = normalizeLower(type);

    if (
      lowerName.includes("anime filme") ||
      lowerName === "filme" ||
      lowerName.includes("filme") ||
      lowerType.includes("movies")
    ) {
      return ICONS.movie;
    }

    if (
      lowerName.includes("anime serien") ||
      lowerName === "serien" ||
      lowerName.includes("serien") ||
      lowerType.includes("tvshows") ||
      lowerType.includes("series")
    ) {
      return ICONS.series;
    }

    return ICONS.library;
  }

  async function renderLibraryMenu() {
    if (!canShowNavigation()) {
      removeNavigation();
      return;
    }

    const menu = createLibraryMenu();

    if (!menu) return;

    menu.replaceChildren();

    const loading = document.createElement("div");
    loading.className = "jfLibraryMenuLoading";
    loading.textContent = "Bibliotheken laden…";

    menu.appendChild(loading);

    const libraries = await getLibraries();

    menu.replaceChildren();

    if (!libraries.length) {
      const empty = document.createElement("div");
      empty.className = "jfLibraryMenuLoading";
      empty.textContent = "Keine Bibliotheken gefunden";
      menu.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    libraries.forEach((library) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "jfLibraryMenuItem";
      button.dataset.libraryId = library.id;
      button.dataset.libraryType = library.type || "";

      const icon = document.createElement("span");
      icon.className = "jfLibraryMenuItemIcon";
      icon.innerHTML = getLibraryIcon(library.name, library.type);

      const text = document.createElement("span");
      text.className = "jfLibraryMenuItemText";
      text.textContent = library.name;

      button.append(icon, text);

      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          closeLibraryMenu();
          openLibrary(library);
        },
        true,
      );

      fragment.appendChild(button);
    });

    menu.appendChild(fragment);
  }

  function getLibraryRoute(library) {
    const id = encodeURIComponent(library.id);
    const name = normalizeLower(library.name);
    const type = normalizeLower(library.type);

    if (
      type.includes("tvshows") ||
      type.includes("series") ||
      name.includes("anime serien") ||
      name.includes("serien") ||
      name.includes("series")
    ) {
      return `!/tv.html?topParentId=${id}`;
    }

    if (
      type.includes("movies") ||
      name.includes("anime filme") ||
      name.includes("filme") ||
      name.includes("movies")
    ) {
      return `!/movies.html?topParentId=${id}`;
    }

    if (
      type.includes("music") ||
      name.includes("musik") ||
      name.includes("music")
    ) {
      return `!/music.html?topParentId=${id}`;
    }

    if (
      type.includes("boxsets") ||
      name.includes("sammlungen") ||
      name.includes("collections")
    ) {
      return `!/collections.html?topParentId=${id}`;
    }

    if (
      type.includes("books") ||
      name.includes("bücher") ||
      name.includes("books")
    ) {
      return `!/books.html?topParentId=${id}`;
    }

    if (
      type.includes("photos") ||
      name.includes("fotos") ||
      name.includes("photos")
    ) {
      return `!/photos.html?topParentId=${id}`;
    }

    return `!/list.html?parentId=${id}`;
  }

  function openLibrary(library) {
    if (!library?.id || !canShowNavigation()) return;

    cleanupDetailOnlyMarks();

    const route = getLibraryRoute(library);
    const baseUrl = location.href.split("#")[0];
    const targetUrl = `${baseUrl}#${route}`;

    if (location.href === targetUrl) {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      window.dispatchEvent(new Event("resize"));
      return;
    }

    location.href = targetUrl;

    window.setTimeout(() => {
      cleanupDetailOnlyMarks();
      window.dispatchEvent(new Event("resize"));
    }, 250);
  }

  function handleNavAction(action) {
    if (!canShowNavigation()) {
      removeNavigation();
      return;
    }

    if (action === "home") {
      closeLibraryMenu();

      const home = findClickableByExactText(["home", "startseite"]);

      if (home) {
        getClickable(home).click();
        return;
      }

      location.hash = "#!/home.html";
      return;
    }

    if (action === "search") {
      closeLibraryMenu();

      const search = findHeaderSearchButton();

      if (search) {
        getClickable(search).click();
        return;
      }

      location.hash = "#!/search.html";
      return;
    }

    if (action === "library") {
      toggleLibraryMenu();
    }
  }

  function updateActiveNavButton() {
    const nav = document.getElementById(ID.nav);

    if (!nav) return;

    nav.querySelectorAll(".jfCustomNavButton").forEach((button) => {
      button.classList.remove("is-active");
    });

    const hash = getHash();

    if (isLibraryRoute()) {
      nav.querySelector('[data-action="library"]')?.classList.add("is-active");
      return;
    }

    if (hash.includes("search")) {
      nav.querySelector('[data-action="search"]')?.classList.add("is-active");
      return;
    }

    nav.querySelector('[data-action="home"]')?.classList.add("is-active");
  }

  function runNavigationFixes() {
    if (!canShowNavigation()) {
      removeNavigation();
      return;
    }

    createNavigation();
    createLibraryMenu();
    hideOriginalHomeFavouriteTabs();
    hideOriginalSearchButton();
    syncProfileMirror();
    updateActiveNavButton();
    positionLibraryMenu();
  }

  function hideHeaderAndPauseButtons(root = document) {
    if (!canShowNavigation()) return;

    queryAll(root, SELECTORS.hiddenHeaderControls).forEach(hideHard);
    queryAll(root, SELECTORS.nativeHeaderControls).forEach(hideHard);
  }

  function getItemIdFromUrl() {
    const match =
      location.href.match(/[?&]id=([a-f0-9]+)/i) ||
      location.href.match(/[?&]itemId=([a-f0-9]+)/i) ||
      location.href.match(/[?&]seasonId=([a-f0-9]+)/i);

    return match ? match[1] : null;
  }

  async function detectCurrentItemType() {
    if (isLibraryRoute()) {
      state.currentItemType = null;
      state.lastIsSeason = false;
      applySeasonPageClass();
      return null;
    }

    const itemId = getItemIdFromUrl();

    if (!itemId || !getApiClient()) {
      state.currentItemType = null;
      state.lastIsSeason = isSeasonPageByHeuristic();
      applySeasonPageClass();
      return null;
    }

    if (itemId === state.lastItemId && state.currentItemType) {
      state.lastIsSeason =
        state.currentItemType === "Season" || isSeasonPageByHeuristic();
      applySeasonPageClass();
      return state.currentItemType;
    }

    state.lastItemId = itemId;

    try {
      const apiClient = getApiClient();
      const item = await apiClient.getItem(getCurrentUserId(), itemId);

      state.currentItemType = item?.Type || null;
      state.lastIsSeason =
        state.currentItemType === "Season" || isSeasonPageByHeuristic();

      applySeasonPageClass();

      return state.currentItemType;
    } catch {
      state.currentItemType = null;
      state.lastIsSeason = isSeasonPageByHeuristic();

      applySeasonPageClass();

      return null;
    }
  }

  function isSeasonPageByHeuristic() {
    if (isLibraryRoute()) return false;

    if (location.href.toLowerCase().includes("seasonid=")) {
      return true;
    }

    const titleArea =
      document.querySelector(".detailPageTitleContainer") ||
      document.querySelector(".itemName") ||
      document.querySelector(".itemDetailsGroup") ||
      document.querySelector(".detailPageContent");

    const titleText = normalizeLower(titleArea?.textContent || "");
    const hasSeasonWord =
      titleText.includes("season ") || titleText.includes("staffel ");

    const hasEpisodes = Boolean(
      findSectionByHeading(LABELS.episodes) ||
      document.querySelector(
        "#childrenCollapsible .listItem, #childrenCollapsible .listItemBody, .listItemBody",
      ),
    );

    const hasSeasonList = Boolean(findSectionByHeading(LABELS.seasons));

    return hasSeasonWord && hasEpisodes && !hasSeasonList;
  }

  function isSeasonPage() {
    if (isLibraryRoute()) return false;

    return (
      document.body.classList.contains(CLASS.seasonPage) ||
      document.documentElement.classList.contains(CLASS.seasonPage) ||
      state.currentItemType === "Season" ||
      state.lastIsSeason ||
      isSeasonPageByHeuristic()
    );
  }

  function applySeasonPageClass() {
    const active = isSeasonPage();

    toggleDocumentClass(CLASS.seasonPage, active);

    return active;
  }

  function findSeasonSection() {
    if (isLibraryRoute()) return null;
    if (state.currentItemType && state.currentItemType !== "Series")
      return null;

    const found = findSectionByHeading(LABELS.seasons);

    if (found?.section) {
      found.section.classList.add(CLASS.seasonSection);
    }

    return found;
  }

  function findEpisodeSection() {
    if (!isSeasonPage()) return null;

    const byHeading = findSectionByHeading(LABELS.episodes);

    if (byHeading?.section) {
      byHeading.section.classList.add(CLASS.episodeSection);
      return byHeading;
    }

    const children = document.querySelector("#childrenCollapsible");

    if (
      children?.querySelector(
        ".listItem, .listItemBody, .itemsContainer, .card",
      )
    ) {
      children.classList.add(CLASS.episodeSection);
      return { heading: null, section: children };
    }

    const firstEpisode = document.querySelector(".listItem, .listItemBody");

    if (!firstEpisode) return null;

    const section =
      firstEpisode.closest("#childrenCollapsible") ||
      firstEpisode.closest(".verticalSection") ||
      firstEpisode.closest(".childrenSection") ||
      firstEpisode.closest(".section") ||
      firstEpisode.closest(".detailSection") ||
      firstEpisode.parentElement;

    if (section) {
      section.classList.add(CLASS.episodeSection);
      return { heading: null, section };
    }

    return null;
  }

  function getSeasonTitle(card, index) {
    const titleElement =
      card.querySelector(".cardText-first") ||
      card.querySelector(".cardText") ||
      card.querySelector(".cardName") ||
      card.querySelector(".innerCardFooter") ||
      card.querySelector(".cardText-secondary") ||
      card.querySelector("[title]");

    return (
      normalizeText(titleElement?.textContent) ||
      normalizeText(titleElement?.getAttribute?.("title")) ||
      normalizeText(card.getAttribute?.("title")) ||
      `Season ${index + 1}`
    );
  }

  function openSeason(card) {
    const link = card.querySelector("a[href]") || card.closest("a[href]");

    if (link?.href) {
      link.click();
      return;
    }

    const clickable = card.querySelector("button") || card;

    clickable.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
  }

  function createSeasonDropdown() {
    if (isLibraryRoute()) return false;

    const found = findSeasonSection();

    if (!found?.section) {
      document.body.classList.remove(CLASS.hasSeasons);
      return false;
    }

    const cards = Array.from(found.section.querySelectorAll(".card"));

    if (!cards.length) {
      document.body.classList.remove(CLASS.hasSeasons);
      return false;
    }

    document.body.classList.add(CLASS.hasSeasons);

    if (found.section.querySelector(`.${CLASS.dropdown}`)) {
      return true;
    }

    const seenTitles = new Set();
    const seasons = [];

    cards.forEach((card, index) => {
      const title = getSeasonTitle(card, index);

      if (!seenTitles.has(title)) {
        seenTitles.add(title);
        seasons.push({ title, card });
      }
    });

    if (!seasons.length) return false;

    const select = document.createElement("select");
    select.className = CLASS.dropdown;

    const placeholder = document.createElement("option");
    placeholder.textContent = "Staffel auswählen";
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;

    select.appendChild(placeholder);

    seasons.forEach((season, index) => {
      const option = document.createElement("option");
      option.textContent = season.title;
      option.value = String(index);
      select.appendChild(option);
    });

    select.addEventListener("change", function () {
      const selected = seasons[Number(this.value)];

      if (selected?.card) {
        openSeason(selected.card);
      }

      this.selectedIndex = 0;
    });

    found.heading.insertAdjacentElement("afterend", select);

    return true;
  }

  function isInsideEpisodes(element) {
    return Boolean(
      element.closest(
        `#childrenCollapsible, .${CLASS.episodeSection}, .listItem, .listItemBody, .listItem-content, .itemsContainer, .emby-scroller, .scrollFrame, .scrollSlider`,
      ),
    );
  }

  function isLogoOrBackdrop(element) {
    const className = normalizeLower(element.className);

    return (
      className.includes("logo") ||
      className.includes("backdrop") ||
      className.includes("fanart") ||
      className.includes("banner") ||
      Boolean(
        element.closest(
          ".detailLogo, .detailPageLogo, .itemLogo, .logoImageContainer, .detailLogoContainer",
        ),
      )
    );
  }

  function getBestPosterContainer(element) {
    return (
      element.closest(".detailImageContainer") ||
      element.closest(".detailPageImageContainer") ||
      element.closest(".leftFixedDetailImageContainer") ||
      element.closest(".itemImageContainer") ||
      element.closest(".primaryImageContainer") ||
      element.closest(".detailImageCard") ||
      element.closest(".detailImageContainerCard") ||
      element.closest(".portraitDetailImageContainer") ||
      element.closest(".verticalDetailImageContainer") ||
      element.closest(".overflowPortraitCard") ||
      element.closest(".portraitCard") ||
      element.closest(".cardBox") ||
      element.closest(".card") ||
      element.closest(".cardImageContainer") ||
      element
    );
  }

  function hideSeasonPoster(element) {
    if (!element || element.classList.contains(CLASS.seasonPosterHidden))
      return;

    element.classList.add(CLASS.seasonPosterHidden);

    setImportantStyle(element, {
      display: "none",
      visibility: "hidden",
      opacity: "0",
      width: "0",
      "min-width": "0",
      "max-width": "0",
      height: "0",
      "min-height": "0",
      "max-height": "0",
      margin: "0",
      padding: "0",
      overflow: "hidden",
      "pointer-events": "none",
    });

    const images = element.matches?.("img, source")
      ? [element]
      : Array.from(element.querySelectorAll?.("img, source") || []);

    images.forEach((image) => {
      const src = image.getAttribute("src");
      const srcset = image.getAttribute("srcset");

      if (src) {
        image.dataset.jfHiddenSrc = src;
        image.removeAttribute("src");
      }

      if (srcset) {
        image.dataset.jfHiddenSrcset = srcset;
        image.removeAttribute("srcset");
      }
    });

    if (!isLogoOrBackdrop(element)) {
      element.style.setProperty("background-image", "none", "important");
    }
  }

  function shouldHideSeasonVisual(element) {
    if (
      !isSeasonPage() ||
      !element ||
      isInsideEpisodes(element) ||
      isLogoOrBackdrop(element)
    ) {
      return false;
    }

    const rect = element.getBoundingClientRect?.();

    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const isLargeEnough = rect.width >= 80 && rect.height >= 110;
    const isPortrait = rect.height / Math.max(rect.width, 1) >= 1.05;
    const isNearPosterArea = rect.left < window.innerWidth * 0.48;
    const isNotBackdrop = rect.width < window.innerWidth * 0.68;

    return isLargeEnough && isPortrait && isNearPosterArea && isNotBackdrop;
  }

  function hideSeasonPosters(root = document) {
    if (!isSeasonPage()) return false;

    const candidates = new Set();

    queryAll(root, SELECTORS.seasonPosterContainers).forEach((element) => {
      if (!isInsideEpisodes(element) && !isLogoOrBackdrop(element)) {
        candidates.add(getBestPosterContainer(element));
      }
    });

    queryAll(root, SELECTORS.posterVisuals).forEach((element) => {
      if (shouldHideSeasonVisual(element)) {
        candidates.add(getBestPosterContainer(element));
      }
    });

    candidates.forEach((element) => {
      if (!isInsideEpisodes(element) && !isLogoOrBackdrop(element)) {
        hideSeasonPoster(element);
      }
    });

    return candidates.size > 0;
  }

  function hideSeasonPostersBurst(root = document) {
    hideSeasonPosters(root);

    requestAnimationFrame(() => hideSeasonPosters(root));

    [80, 220, 500].forEach((delay) => {
      window.setTimeout(() => hideSeasonPosters(root), delay);
    });
  }

  function clearSeasonPosterMarks() {
    document
      .querySelectorAll(`.${CLASS.seasonPosterHidden}`)
      .forEach((element) => {
        element.classList.remove(CLASS.seasonPosterHidden);

        clearInlineStyles(element, [
          "display",
          "visibility",
          "opacity",
          "width",
          "min-width",
          "max-width",
          "height",
          "min-height",
          "max-height",
          "margin",
          "padding",
          "overflow",
          "pointer-events",
          "background-image",
        ]);

        element
          .querySelectorAll?.("[data-jf-hidden-src], [data-jf-hidden-srcset]")
          .forEach((image) => {
            if (image.dataset.jfHiddenSrc) {
              image.setAttribute("src", image.dataset.jfHiddenSrc);
              delete image.dataset.jfHiddenSrc;
            }

            if (image.dataset.jfHiddenSrcset) {
              image.setAttribute("srcset", image.dataset.jfHiddenSrcset);
              delete image.dataset.jfHiddenSrcset;
            }
          });
      });
  }

  function getMoreLikeSections() {
    if (isLibraryRoute()) return [];

    const seen = new Set();
    const sections = [];

    getHeadings().forEach((heading) => {
      if (!headingMatches(heading, LABELS.moreLike)) return;

      const section = findSmallestSectionFromHeading(heading);

      if (section && !seen.has(section)) {
        seen.add(section);
        section.classList.add(CLASS.moreLike);
        sections.push({ heading, section });
      }
    });

    return sections;
  }

  function resetSectionVisibility(section) {
    if (!section) return;

    section.classList.remove(CLASS.moreLikeHidden, CLASS.moreLikeDuplicate);

    clearInlineStyles(section, [
      "display",
      "visibility",
      "opacity",
      "height",
      "max-height",
      "overflow",
      "margin",
      "padding",
      "transform",
    ]);
  }

  function hideSection(section) {
    if (!section) return;

    section.classList.add(CLASS.moreLikeHidden);

    setImportantStyle(section, {
      display: "none",
      visibility: "hidden",
      opacity: "0",
      height: "0",
      "max-height": "0",
      overflow: "hidden",
      margin: "0",
      padding: "0",
    });
  }

  function clearMoreLikeMarks() {
    document
      .querySelectorAll(`.${CLASS.moreLikeHidden}, .${CLASS.moreLikeDuplicate}`)
      .forEach(resetSectionVisibility);
  }

  function cleanupMoreLikeDuplicates(keepSection) {
    getMoreLikeSections().forEach(({ section }) => {
      if (keepSection && section === keepSection) {
        resetSectionVisibility(section);
        section.classList.add(CLASS.moreLike);
        return;
      }

      section.classList.add(CLASS.moreLikeDuplicate);
      hideSection(section);
    });
  }

  function hideMoreLikeOnSeasonPage() {
    if (!isSeasonPage()) {
      clearMoreLikeMarks();
      return false;
    }

    getMoreLikeSections().forEach(({ section }) => hideSection(section));
    return true;
  }

  function getDetailColumn() {
    return (
      document.querySelector(".detailPagePrimaryContent") ||
      document.querySelector(".detailPageContent") ||
      document.querySelector(".detailPagePrimaryContainer") ||
      document.querySelector(".itemDetailsGroup") ||
      null
    );
  }

  function getMetadataBlock() {
    const detailColumn = getDetailColumn();

    if (!detailColumn) return null;

    const studioLabel = Array.from(detailColumn.querySelectorAll("*")).find(
      (element) => {
        const text = normalizeLower(element.textContent);
        return text === "studio" || text === "studios";
      },
    );

    if (!studioLabel) {
      return detailColumn.querySelector(".itemDetailsGroup") || detailColumn;
    }

    return (
      studioLabel.closest(".itemDetailsGroup") ||
      studioLabel.closest(".detailsGroupItem") ||
      studioLabel.closest(".mediaInfoItem") ||
      studioLabel.closest("div") ||
      detailColumn
    );
  }

  function insertAfterOnce(element, referenceNode) {
    if (!element || !referenceNode?.parentElement) return false;
    if (referenceNode.nextElementSibling === element) return true;

    state.isInternalMove = true;

    try {
      referenceNode.insertAdjacentElement("afterend", element);
    } finally {
      window.setTimeout(() => {
        state.isInternalMove = false;
      }, 80);
    }

    return true;
  }

  function triggerLayoutRefresh(section) {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 500);

      const scroller =
        section?.querySelector(".emby-scroller") ||
        section?.querySelector(".scrollFrame") ||
        section?.querySelector(".itemsContainer");

      if (!scroller) return;

      try {
        const oldScrollLeft = scroller.scrollLeft;
        scroller.scrollLeft = oldScrollLeft + 1;
        scroller.scrollLeft = oldScrollLeft;
      } catch {}
    });
  }

  function positionMoreLikeThis() {
    if (isLibraryRoute()) {
      clearMoreLikeMarks();
      return true;
    }

    if (isSeasonPage()) {
      cleanupMoreLikeDuplicates(null);
      hideMoreLikeOnSeasonPage();
      return true;
    }

    clearMoreLikeMarks();

    const moreLike = getMoreLikeSections()[0];

    if (!moreLike?.section) return false;

    cleanupMoreLikeDuplicates(moreLike.section);

    const season = findSeasonSection();

    if (season?.section) {
      if (
        season.section.nextElementSibling === moreLike.section &&
        moreLike.section.classList.contains("jf-more-like-after-seasons")
      ) {
        document.body.classList.add(CLASS.hasSeasons);
        return true;
      }

      moreLike.section.classList.remove(
        "jf-more-like-after-studio",
        "jf-more-like-after-seasons",
      );

      const moved = insertAfterOnce(moreLike.section, season.section);

      moreLike.section.classList.add("jf-more-like-after-seasons");
      document.body.classList.add(CLASS.hasSeasons);

      if (moved) triggerLayoutRefresh(moreLike.section);

      return moved;
    }

    if (state.currentItemType === "Series") return false;
    if (state.currentItemType === null && getItemIdFromUrl() && getApiClient())
      return false;

    const metadataBlock = getMetadataBlock();

    if (!metadataBlock?.parentElement) return true;

    if (
      metadataBlock.nextElementSibling === moreLike.section &&
      moreLike.section.classList.contains("jf-more-like-after-studio")
    ) {
      return true;
    }

    moreLike.section.classList.remove(
      "jf-more-like-after-studio",
      "jf-more-like-after-seasons",
    );

    const moved = insertAfterOnce(moreLike.section, metadataBlock);

    moreLike.section.classList.add("jf-more-like-after-studio");

    if (moved) triggerLayoutRefresh(moreLike.section);

    return moved;
  }

  function isMovieDetailPage() {
    if (isLibraryRoute()) return false;
    if (state.currentItemType) return state.currentItemType === "Movie";
    if (isSeasonPage()) return false;
    if (findSectionByHeading(LABELS.seasons)) return false;
    if (findSectionByHeading(LABELS.episodes)) return false;

    return Boolean(
      document.querySelector(
        ".detailSectionContent select, .detailPageContent select, .itemDetailsGroup select",
      ),
    );
  }

  function getMediaRowFromElement(element) {
    let current = element;
    let best = null;

    for (let depth = 0; depth < 8 && current; depth++) {
      const rect = current.getBoundingClientRect?.();
      const text = normalizeText(current.textContent);

      if (
        rect &&
        rect.width >= 160 &&
        rect.height > 0 &&
        rect.height <= 95 &&
        text.length <= 260
      ) {
        best = current;
      }

      current = current.parentElement;
    }

    return (
      best ||
      element.closest(".selectContainer") ||
      element.closest(".inputContainer") ||
      element.closest(".detailsGroupItem") ||
      element.closest(".mediaInfoItem") ||
      element.parentElement
    );
  }

  function hideMediaRow(row) {
    if (!row || row.classList.contains(CLASS.mediaRowHidden)) return;

    row.classList.add(CLASS.mediaRowHidden);

    setImportantStyle(row, {
      display: "none",
      visibility: "hidden",
      opacity: "0",
      height: "0",
      "min-height": "0",
      "max-height": "0",
      margin: "0",
      padding: "0",
      overflow: "hidden",
      "pointer-events": "none",
    });
  }

  function clearMediaRowMarks() {
    document.querySelectorAll(`.${CLASS.mediaRowHidden}`).forEach((row) => {
      row.classList.remove(CLASS.mediaRowHidden);

      clearInlineStyles(row, [
        "display",
        "visibility",
        "opacity",
        "height",
        "min-height",
        "max-height",
        "margin",
        "padding",
        "overflow",
        "pointer-events",
      ]);
    });
  }

  function isShuffleButton(element) {
    if (!element?.matches?.("button, a, [role='button'], .emby-button"))
      return false;
    if (
      element.closest?.(`#${ID.nav}, #${ID.libraryMenu}, #${ID.profileMirror}`)
    )
      return false;
    if (isBlockedPlayerControlBarElement(element)) return false;

    const signature = normalizeLower(
      [
        element.className,
        element.id,
        element.getAttribute("title"),
        element.getAttribute("aria-label"),
        element.getAttribute("data-action"),
        element.getAttribute("data-command"),
        element.getAttribute("data-testid"),
        element.textContent,
      ]
        .filter(Boolean)
        .join(" "),
    );

    return (
      signature.includes("shuffle") ||
      signature.includes("zufall") ||
      signature.includes("zufallswiedergabe") ||
      signature.includes("mischen")
    );
  }

  function hideShuffleButton(button) {
    if (!button || button.classList.contains(CLASS.shuffleButtonHidden)) return;

    button.classList.add(CLASS.shuffleButtonHidden);
    hideHard(button);
  }

  function hideDetailShuffleButtons(root = document) {
    if (!canShowNavigation()) return false;
    if (isLibraryRoute() || isSearchRoute() || isVideoPlayerActive())
      return false;

    const roots = queryAll(root, SELECTORS.detailRoot);
    const scanRoots = roots.length ? roots : [root || document];
    let hidden = false;

    scanRoots.forEach((scanRoot) => {
      queryAll(scanRoot, SELECTORS.detailShuffleButton).forEach((button) => {
        if (isBlockedPlayerControlBarElement(button)) return;

        hideShuffleButton(button);
        hidden = true;
      });

      Array.from(
        scanRoot.querySelectorAll?.(
          "button, a, [role='button'], .emby-button",
        ) || [],
      ).forEach((button) => {
        if (!isShuffleButton(button)) return;

        hideShuffleButton(button);
        hidden = true;
      });
    });

    return hidden;
  }

  function isTrailerButton(element) {
    if (!element?.matches?.("button, a, [role='button'], .emby-button"))
      return false;
    if (
      element.closest?.(`#${ID.nav}, #${ID.libraryMenu}, #${ID.profileMirror}`)
    )
      return false;
    if (isBlockedPlayerControlBarElement(element)) return false;

    const signature = normalizeLower(
      [
        element.className,
        element.id,
        element.getAttribute("title"),
        element.getAttribute("aria-label"),
        element.getAttribute("data-action"),
        element.getAttribute("data-type"),
        element.getAttribute("data-itemtype"),
        element.textContent,
      ]
        .filter(Boolean)
        .join(" "),
    );

    return (
      signature.includes("trailer") ||
      signature.includes("playtrailer") ||
      signature.includes("externaltrailer")
    );
  }

  function hideTrailerButton(button) {
    if (!button || button.classList.contains(CLASS.trailerButtonHidden)) return;

    button.classList.add(CLASS.trailerButtonHidden);
    hideHard(button);
  }

  function hideDetailTrailerButtons(root = document) {
    if (!canShowNavigation()) return false;
    if (isLibraryRoute() || isSearchRoute() || isVideoPlayerActive())
      return false;

    const roots = queryAll(root, SELECTORS.detailRoot);
    const scanRoots = roots.length ? roots : [root || document];
    let hidden = false;

    scanRoots.forEach((scanRoot) => {
      queryAll(scanRoot, SELECTORS.detailTrailerButton).forEach((button) => {
        if (isBlockedPlayerControlBarElement(button)) return;

        hideTrailerButton(button);
        hidden = true;
      });

      Array.from(
        scanRoot.querySelectorAll?.(
          "button, a, [role='button'], .emby-button",
        ) || [],
      ).forEach((button) => {
        if (!isTrailerButton(button)) return;

        hideTrailerButton(button);
        hidden = true;
      });
    });

    return hidden;
  }

  function hideMovieMediaRows(root = document) {
    if (!isMovieDetailPage()) {
      clearMediaRowMarks();
      return false;
    }

    const roots = queryAll(root, SELECTORS.detailRoot);
    const scanRoots = roots.length ? roots : [root || document];
    let hidden = false;

    scanRoots.forEach((scanRoot) => {
      Array.from(scanRoot.querySelectorAll("*")).forEach((element) => {
        if (!MEDIA_ROW_LABEL_SET.has(normalizeLower(element.textContent)))
          return;

        const row = getMediaRowFromElement(element);

        if (row) {
          hideMediaRow(row);
          hidden = true;
        }
      });

      Array.from(scanRoot.querySelectorAll("select")).forEach((select) => {
        const label = [
          select.getAttribute("aria-label"),
          select.getAttribute("title"),
          select.name,
          select.id,
        ]
          .map(normalizeLower)
          .join(" ");

        if (
          label.includes("audio") ||
          label.includes("subtitle") ||
          label.includes("untertitel")
        ) {
          const row = getMediaRowFromElement(select);

          if (row) {
            hideMediaRow(row);
            hidden = true;
          }
        }
      });
    });

    return hidden;
  }

  function isSearchRoute() {
    const hash = getHash();
    const href = normalizeLower(location.href);

    return hash.includes("search") || href.includes("search.html");
  }

  function setSearchPageClass(active) {
    toggleDocumentClass(CLASS.searchPage, active);
  }

  function clearSearchEpisodeMarks() {
    document
      .querySelectorAll(
        `.${CLASS.searchEpisodesHidden}, .${CLASS.searchPeopleHidden}`,
      )
      .forEach((section) => {
        section.classList.remove(
          CLASS.searchEpisodesHidden,
          CLASS.searchPeopleHidden,
        );

        clearInlineStyles(section, [
          "display",
          "visibility",
          "opacity",
          "height",
          "min-height",
          "max-height",
          "margin",
          "padding",
          "overflow",
          "pointer-events",
        ]);
      });
  }

  function getSearchResultHideClassFromHeading(heading) {
    if (headingMatches(heading, LABELS.episodes))
      return CLASS.searchEpisodesHidden;
    if (headingMatches(heading, LABELS.people)) return CLASS.searchPeopleHidden;

    return "";
  }

  function getSearchHiddenResultSections(root = document) {
    if (!isSearchRoute()) return [];

    const seen = new Set();
    const sections = [];

    queryAll(root, SELECTORS.headings).forEach((heading) => {
      const hideClass = getSearchResultHideClassFromHeading(heading);

      if (!hideClass) return;

      const section = findSmallestSectionFromHeading(heading);

      if (!section || seen.has(section)) return;

      seen.add(section);
      sections.push({ section, hideClass });
    });

    return sections;
  }

  function hideSearchResultSection(section, hideClass) {
    if (!section || !hideClass || section.classList.contains(hideClass)) return;

    section.classList.add(hideClass);

    setImportantStyle(section, {
      display: "none",
      visibility: "hidden",
      opacity: "0",
      height: "0",
      "min-height": "0",
      "max-height": "0",
      margin: "0",
      padding: "0",
      overflow: "hidden",
      "pointer-events": "none",
    });
  }

  function hideSearchEpisodeSection(section) {
    hideSearchResultSection(section, CLASS.searchEpisodesHidden);
  }

  function hideSearchPeopleSection(section) {
    hideSearchResultSection(section, CLASS.searchPeopleHidden);
  }

  function hideSearchEpisodeResults(root = document) {
    if (!isSearchRoute()) {
      setSearchPageClass(false);
      clearSearchEpisodeMarks();
      return false;
    }

    setSearchPageClass(true);

    let hidden = false;

    getSearchHiddenResultSections(document).forEach(
      ({ section, hideClass }) => {
        hideSearchResultSection(section, hideClass);
        hidden = true;
      },
    );

    if (root !== document) {
      getSearchHiddenResultSections(root).forEach(({ section, hideClass }) => {
        hideSearchResultSection(section, hideClass);
        hidden = true;
      });
    }

    return hidden;
  }

  function cleanupDetailOnlyMarks() {
    document.body.classList.remove(
      CLASS.hasSeasons,
      CLASS.seasonPage,
      CLASS.searchPage,
    );
    document.documentElement.classList.remove(
      CLASS.seasonPage,
      CLASS.searchPage,
    );

    document.querySelectorAll(`.${CLASS.seasonSection}`).forEach((element) => {
      element.classList.remove(CLASS.seasonSection);
    });

    document.querySelectorAll(`.${CLASS.episodeSection}`).forEach((element) => {
      element.classList.remove(CLASS.episodeSection);
    });

    clearSeasonPosterMarks();
    clearMoreLikeMarks();
    clearMediaRowMarks();
    clearSearchEpisodeMarks();
  }

  function runSeasonPageFixes() {
    applySeasonPageClass();

    if (isLibraryRoute()) {
      cleanupDetailOnlyMarks();
      return;
    }

    if (!isSeasonPage()) {
      clearMoreLikeMarks();
      return;
    }

    findEpisodeSection();
    hideMoreLikeOnSeasonPage();
    hideSeasonPosters();
  }
  function userImageUrl(user) {
    if (!user?.Id) return "";

    const tag = user.PrimaryImageTag || user.ImageTags?.Primary || "";
    const params = new URLSearchParams();

    params.set("fillWidth", "260");
    params.set("fillHeight", "260");
    params.set("quality", "92");

    if (tag) params.set("tag", tag);

    return apiUrl(
      `Users/${encodeURIComponent(user.Id)}/Images/Primary?${params.toString()}`,
    );
  }
  function clickNativeProfileButton(button) {
    if (!button) return false;

    try {
      button.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
    } catch {}

    try {
      button.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
    } catch {}

    try {
      button.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
    } catch {}

    try {
      button.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
    } catch {}

    try {
      button.click?.();
    } catch {}

    return true;
  }

  function openNativeProfileMenu(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }

    window.setTimeout(() => {
      const nativeButton =
        findNativeProfileButtonLoose() || findOriginalProfileButton();

      clickNativeProfileButton(nativeButton);
    }, CONFIG.nativeMenuOpenDelay);
  }

  async function runFull() {
    if (state.isRunning) return;

    state.isRunning = true;

    try {
      if (!canShowNavigation()) {
        removeNavigation();
        cleanupDetailOnlyMarks();
        return;
      }

      await detectCurrentItemType();

      runNavigationFixes();
      hideHeaderAndPauseButtons();
      hideSearchEpisodeResults();

      if (isLibraryRoute()) {
        cleanupDetailOnlyMarks();
        return;
      }

      if (!isSeasonPage()) {
        createSeasonDropdown();
      }

      runSeasonPageFixes();
      positionMoreLikeThis();
      hideSeasonPostersBurst();
      hideMovieMediaRows();
      hideDetailShuffleButtons();
      hideDetailTrailerButtons();
      hideSearchEpisodeResults();
    } finally {
      state.isRunning = false;
    }
  }

  function runLight() {
    if (state.isRunning) return;

    state.isRunning = true;

    try {
      if (!canShowNavigation()) {
        removeNavigation();
        cleanupDetailOnlyMarks();
        return;
      }

      runNavigationFixes();
      hideHeaderAndPauseButtons();
      hideSearchEpisodeResults();

      if (isLibraryRoute()) {
        cleanupDetailOnlyMarks();
        return;
      }

      applySeasonPageClass();

      if (!isSeasonPage()) {
        createSeasonDropdown();
      }

      runSeasonPageFixes();
      positionMoreLikeThis();
      hideMovieMediaRows();
      hideDetailShuffleButtons();
      hideDetailTrailerButtons();
      hideSearchEpisodeResults();

      if (isVideoPlayerActive()) {
      } else {
      }
    } finally {
      state.isRunning = false;
    }
  }

  function runWithRetries() {
    window.clearTimeout(state.retryTimer);

    let attempts = 0;

    const attempt = async () => {
      attempts++;

      if (!canShowNavigation()) {
        removeNavigation();
        cleanupDetailOnlyMarks();
        return;
      }

      await detectCurrentItemType();

      runNavigationFixes();
      hideHeaderAndPauseButtons();
      hideSearchEpisodeResults();

      if (isLibraryRoute()) {
        cleanupDetailOnlyMarks();

        if (attempts < 8) {
          state.retryTimer = window.setTimeout(attempt, 450);
        }

        return;
      }

      const dropdownReady = isSeasonPage() || createSeasonDropdown();
      const episodeReady = !isSeasonPage() || Boolean(findEpisodeSection());
      const moreLikeReady = positionMoreLikeThis();

      runSeasonPageFixes();
      hideSeasonPosters();
      hideMovieMediaRows();
      hideDetailShuffleButtons();
      hideDetailTrailerButtons();
      hideSearchEpisodeResults();
      if ((!dropdownReady || !episodeReady || !moreLikeReady) && attempts < 6) {
        state.retryTimer = window.setTimeout(attempt, 450);
      }
    };

    attempt();
  }

  /**
   * Debounces DOM cleanup work after route changes, injected content, or user interaction.
   * @param {Document | Element} root
   */
  function scheduleRun(root = document) {
    if (state.isInternalMove) return;

    window.clearTimeout(state.runTimer);

    state.runTimer = window.setTimeout(() => {
      if (!canShowNavigation()) {
        removeNavigation();
        cleanupDetailOnlyMarks();
        return;
      }

      runLight();
      hideHeaderAndPauseButtons(root);

      if (isLibraryRoute()) {
        cleanupDetailOnlyMarks();
        return;
      }

      hideMovieMediaRows(root);
      hideDetailShuffleButtons(root);
      hideDetailTrailerButtons(root);
      hideSearchEpisodeResults(root);

      if (isSeasonPage()) {
        hideSeasonPosters(root);
      }
    }, 180);
  }

  function handleNavigation() {
    state.lastUrl = location.href;
    state.lastItemId = null;
    state.currentItemType = null;
    state.lastIsSeason = false;
    state.profileMirrorAvatarUrl = "";

    closeLibraryMenu();

    if (!canShowNavigation()) {
      removeNavigation();
      cleanupDetailOnlyMarks();
      requestStabilize(2500);
      return;
    }

    cleanupDetailOnlyMarks();
    requestStabilize(isLibraryRoute() ? 3500 : 5000);

    runWithRetries();

    window.setTimeout(runFull, 450);
    window.setTimeout(runFull, 1200);
    window.setTimeout(runFull, 2200);
  }

  function handleUserInteraction() {
    if (!canShowNavigation()) {
      removeNavigation();
      cleanupDetailOnlyMarks();
      return;
    }

    if (isLibraryRoute()) {
      cleanupDetailOnlyMarks();
    } else {
      if (isSeasonPage()) {
        hideSeasonPostersBurst();
      }

      hideMovieMediaRows();
      hideDetailShuffleButtons();
      hideDetailTrailerButtons();
      hideSearchEpisodeResults();
    }

    hideHeaderAndPauseButtons();
    runNavigationFixes();
    scheduleRun();
  }

  function scheduleUserInteraction() {
    if (state.interactionFrame) return;

    state.interactionFrame = window.requestAnimationFrame(() => {
      state.interactionFrame = 0;
      handleUserInteraction();
    });
  }

  function handleOutsideClick(event) {
    const menu = document.getElementById(ID.libraryMenu);
    const nav = document.getElementById(ID.nav);

    if (!menu?.classList.contains("is-open")) return;
    if (menu.contains(event.target)) return;
    if (nav?.contains(event.target)) return;

    closeLibraryMenu();
  }

  function hasVisibleNativeHeaderControls() {
    return Array.from(
      document.querySelectorAll(SELECTORS.nativeHeaderControls),
    ).some(isElementActuallyVisible);
  }

  function handleStabilizeTick() {
    if (location.href !== state.lastUrl) {
      handleNavigation();
      return;
    }

    if (!canShowNavigation()) {
      removeNavigation();
      cleanupDetailOnlyMarks();
      return;
    }

    if (Date.now() < state.stabilizeUntil) {
      runLight();
    }
  }

  function handleRecoveryTick() {
    const wasPlayerActive = state.lastVideoPlayerActive;
    const isPlayerActive = syncVideoPlayerClass();

    state.lastVideoPlayerActive = isPlayerActive;

    if (location.href !== state.lastUrl) {
      handleNavigation();
      return;
    }

    if (!isLoggedIn() || isLoginPage()) {
      removeNavigation();
      cleanupDetailOnlyMarks();
      return;
    }

    if (isPlayerActive) {
      closeLibraryMenu();
      return;
    }

    const navigationMissing = !document.getElementById(ID.nav);
    const nativeHeaderVisible = hasVisibleNativeHeaderControls();
    const isStillStabilizing = Date.now() < state.stabilizeUntil;

    if (
      !wasPlayerActive &&
      !navigationMissing &&
      !nativeHeaderVisible &&
      !isStillStabilizing
    ) {
      return;
    }

    if (wasPlayerActive) {
      requestStabilize(3500);
    }

    runLight();
    hideHeaderAndPauseButtons();

    if (!isLibraryRoute()) {
      hideMovieMediaRows();
      hideDetailShuffleButtons();
      hideDetailTrailerButtons();
      hideSearchEpisodeResults();

      if (isSeasonPage()) {
        hideSeasonPostersBurst();
      }
    }
  }

  function handleAddedNode(node) {
    if (node.nodeType !== 1) return;

    hideHeaderAndPauseButtons(node);
    hideSearchEpisodeResults(node);

    if (isLibraryRoute()) {
      cleanupDetailOnlyMarks();
      return;
    }

    if (isSeasonPage()) {
      hideSeasonPosters(node);
    }

    if (isMovieDetailPage()) {
      hideMovieMediaRows(node);
    }

    hideDetailShuffleButtons(node);

    if (isVideoPlayerActive()) {
      syncVideoPlayerClass();
      restorePlayerBackButton(node);
    }
  }

  function createObserver() {
    state.observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some((mutation) => {
        return mutation.type === "childList" && mutation.addedNodes.length > 0;
      });

      if (!hasAddedNodes) return;

      if (!canShowNavigation()) {
        removeNavigation();
        cleanupDetailOnlyMarks();
        return;
      }

      mutations.forEach((mutation) => {
        if (mutation.type !== "childList") return;
        mutation.addedNodes.forEach(handleAddedNode);
      });

      scheduleRun();
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function cleanup() {
    window.clearTimeout(state.runTimer);
    window.clearTimeout(state.retryTimer);
    window.clearInterval(state.stabilizeTimer);
    window.clearInterval(state.recoveryTimer);

    if (state.interactionFrame) {
      window.cancelAnimationFrame(state.interactionFrame);
      state.interactionFrame = 0;
    }

    try {
      state.observer?.disconnect();
    } catch {}

    state.listeners.forEach((item) => {
      try {
        item.target.removeEventListener(item.type, item.handler, item.options);
      } catch {}
    });

    state.listeners = [];

    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;

    removeNavigation();
    removePlayerBackMirror();
    clearPlayerBackVisibleMarks();

    document.documentElement.classList.remove(CLASS.playerActive);
    document.body?.classList.remove(CLASS.playerActive);

    document.querySelectorAll(`.${CLASS.uiHidden}`).forEach(clearHiddenHard);

    cleanupDetailOnlyMarks();
    state.lastVideoPlayerActive = false;
    state.profileMirrorAvatarUrl = "";
    state.profileMirrorLoading = false;
    window.removeEventListener("popstate", handleNavigation);
    window.removeEventListener("hashchange", handleNavigation);
    window.removeEventListener("pageshow", handleNavigation);
    window.removeEventListener("resize", runLight);

    document.removeEventListener("viewshow", handleNavigation);
    document.removeEventListener("pointerdown", scheduleUserInteraction, true);
    document.removeEventListener("click", scheduleUserInteraction, true);
    document.removeEventListener("click", handleOutsideClick, true);
  }

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    handleNavigation();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    handleNavigation();
  };

  window.addEventListener("popstate", handleNavigation);
  window.addEventListener("hashchange", handleNavigation);
  window.addEventListener("pageshow", handleNavigation);
  window.addEventListener("resize", runLight);

  document.addEventListener("viewshow", handleNavigation);
  document.addEventListener("pointerdown", scheduleUserInteraction, true);
  document.addEventListener("click", scheduleUserInteraction, true);
  document.addEventListener("click", handleOutsideClick, true);

  createObserver();
  state.stabilizeTimer = window.setInterval(handleStabilizeTick, 1400);
  state.recoveryTimer = window.setInterval(handleRecoveryTick, 850);

  window.__jfFinalCustomizerCleanup = cleanup;
  window.__jfSeasonCustomizerCleanup = cleanup;
  window.__jfSeasonMenuPosterKillerCleanup = cleanup;
  window.__jfHideMediaBarAndHeaderButtonsCleanup = cleanup;
  window.__jfCustomStyleNavCleanup = cleanup;
  window.__jfLibraryNavigationRouteFixCleanup = cleanup;
  window.__jfProfileAvatarGearFixCleanup = cleanup;
  window.__jfSearchEpisodesHideCleanup = cleanup;
  window.__jfSearchPeopleHideCleanup = cleanup;
  window.__jfPlayerBackButtonFixCleanup = cleanup;
  window.__jfTrailerButtonHideCleanup = cleanup;
  window.__jfShuffleButtonHideCleanup = cleanup;

  handleNavigation();
})();

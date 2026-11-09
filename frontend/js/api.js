// js/api.js
// Cliente central de comunicacao com a API. Toda chamada ao backend
// deve passar por aqui para manter o token e o tratamento de erro
// consistentes em todas as paginas.

const Api = (() => {
  const BASE_URL = '/api';

  // Etapa 39: a sessão vive num cookie HttpOnly (o JavaScript NÃO consegue ler o token, nem mesmo com XSS).
  // Aqui guardamos só dados de exibição do usuário (sem segredo) para saber se há uma sessão aberta.
  function getToken() { return null; }

  function setSession(_token, user) {
    localStorage.removeItem('ek_token'); // limpa o resquício de versões antigas
    localStorage.setItem('ek_user', JSON.stringify(user || { username: '' }));
  }

  function clearSession() {
    localStorage.removeItem('ek_token');
    localStorage.removeItem('ek_user');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('ek_user') || 'null');
    } catch {
      return null;
    }
  }

  async function request(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    let res;
    try {
      res = await fetch(BASE_URL + path, {
        method,
        headers,
        credentials: 'same-origin',
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      const err = new Error('Nao foi possivel falar com o servidor. Verifique sua conexao.');
      err.network = true;
      throw err;
    }

    let data = null;
    try { data = await res.json(); } catch { /* corpo vazio */ }

    if (!res.ok) {
      if (res.status === 401 && path !== '/auth/login') {
        clearSession();
      }
      const err = new Error((data && data.error) || 'Ocorreu um erro inesperado.');
      err.status = res.status; if (data && data.retryAfter) err.retryAfter = data.retryAfter;
      throw err;
    }

    return data;
  }

  return {
    getToken,
    getUser,
    setSession,
    clearSession,
    isLoggedIn: () => !!getUser(),

    register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
    login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
    me: () => request('/auth/me'),
    logout: (all) => request('/auth/logout', { method: 'POST', body: { all: !!all } }),
    changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),
    deleteAccount: (payload) => request('/auth/delete-account', { method: 'POST', body: payload }),
    getAuthActivity: () => request('/auth/activity'),

    getKingdom: () => request('/kingdom'),
    createKingdom: (payload) => request('/kingdom', { method: 'POST', body: payload }),
    updateKingdom: (payload) => request('/kingdom', { method: 'PUT', body: payload }),

    getMapOverlays: () => request('/map/overlays'),
    getMap: () => request('/map'),
    getTerritory: (id) => request(`/map/territory/${id}`),

    // Etapa 2 — Civilizacao
    getBuildingsCatalog: () => request('/buildings/catalog'),
    getBuildings: () => request('/buildings'),
    startConstruction: (buildingKey, lot) => request('/buildings', { method: 'POST', body: { buildingKey, lot } }),
    upgradeBuilding: (id) => request(`/buildings/${id}/upgrade`, { method: 'PUT' }),
    cancelBuilding: (id) => request(`/buildings/${id}`, { method: 'DELETE' }),
    assignWorkers: (id, workersAssigned) => request(`/buildings/${id}/workers`, { method: 'PUT', body: { workersAssigned } }),

    getPopulation: () => request('/population'),

    getEconomy: () => request('/economy'),
    setTaxRate: (taxRate) => request('/economy/tax', { method: 'PUT', body: { taxRate } }),

    getEvents: () => request('/events'),
    resolveEvent: (id, optionKey) => request(`/events/${id}/choice`, { method: 'POST', body: { optionKey } }),

    getNotifications: () => request('/notifications'),
    markNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

    getObjectives: () => request('/objectives'),
    claimObjective: (key) => request(`/objectives/${key}/claim`, { method: 'POST' }),
    claimAllObjectives: () => request('/objectives/claim-all', { method: 'POST' }),

    getTime: () => request('/time'),
    advanceTime: (days = 1) => request('/time/advance', { method: 'POST', body: { days } }),
    advanceUntil: (maxDays = 30, stopOn) => request('/time/advance-until', { method: 'POST', body: { maxDays, ...(stopOn ? { stopOn } : {}) } }),

    getCharacters: () => request('/characters'),
    getCharacter: (id) => request(`/characters/${id}`),

    getGovernments: () => request('/governments'),

    getTerritories: () => request('/territories'),
    getTerritoryDetail: (id) => request(`/territories/${id}`),
    claimTerritory: (id) => request(`/territories/${id}/claim`, { method: 'POST' }),
    negotiateTerritory: (id) => request(`/territories/${id}/negotiate`, { method: 'POST' }),

    getMilitary: () => request('/military'),
    recruitUnit: (unitKey, quantity) => request('/military/recruit', { method: 'POST', body: { unitKey, quantity } }),

    getSettlements: () => request('/settlements'),
    foundSettlement: (territoryId, name, type) => request('/settlements', { method: 'POST', body: { territoryId, name, type } }),
    getSettlementDetail: (id) => request(`/settlements/${id}`),
    getSettlementOverview: (id) => request(`/settlements/${id}/overview`),
    setCityPolicy: (id, b) => request(`/settlements/${id}/policy`, { method: 'POST', body: b }),
    appointGovernor: (id, characterId) => request(`/settlements/${id}/governor`, { method: 'POST', body: { characterId } }),
    cityFestival: (id) => request(`/settlements/${id}/festival`, { method: 'POST' }),
    cityColonists: (id, amount, direction) => request(`/settlements/${id}/colonists`, { method: 'POST', body: { amount, direction } }),
    cityRealloc: (id) => request(`/settlements/${id}/realloc`, { method: 'POST' }),
    resolveCityDecision: (id, did, choice) => request(`/settlements/${id}/decisions/${did}`, { method: 'POST', body: { choice } }),
    cityChoice: (id, cid, option) => request(`/settlements/${id}/choice/${cid}`, { method: 'POST', body: { option } }),
    cityDefense: (id, action, count) => request(`/settlements/${id}/defense`, { method: 'POST', body: { action, count } }),
    cityCharter: (id, grant) => request(`/settlements/${id}/charter`, { method: 'POST', body: { grant } }),
    cityRecover: (id, action) => request(`/settlements/${id}/recover`, { method: 'POST', body: { action } }),
    cityFreedom: (id) => request(`/settlements/${id}/freedom`, { method: 'POST', body: {} }),
    cityMoveCapital: (id) => request(`/settlements/${id}/move-capital`, { method: 'POST', body: {} }),
    getCityNetwork: () => request('/settlements/network'),
    getOrigins: () => request('/kingdom/origins'),
    territoryPreview: (territoryId) => request(`/kingdom/territory-preview?territoryId=${territoryId}`),
    foundPreview: (territoryId) => request(`/settlements/found-preview?territoryId=${territoryId}`),
    conspiracyAction: (id, kind, goal) => request(`/characters/conspiracies/${id}/action`, { method: 'POST', body: { kind, goal } }),
    networkAction: (id, kind, agentId) => request(`/characters/spy-networks/${id}/action`, { method: 'POST', body: { kind, agentId } }),
    characterAction: (id, kind, amount) => request(`/characters/${id}/action`, { method: 'POST', body: { kind, amount } }),
    transferToSettlement: (id, direction, resource, amount) => request(`/settlements/${id}/transfer`, { method: 'POST', body: { direction, resource, amount } }),
    startSettlementConstruction: (id, buildingKey, lot) => request(`/settlements/${id}/buildings`, { method: 'POST', body: { buildingKey, lot } }),
    moveCityBuilding: (id, buildingId, lot) => request(`/settlements/${id}/move`, { method: 'POST', body: { buildingId, lot } }),
    createTradeRoute: (b) => request('/settlements/trade/routes', { method: 'POST', body: b }),
    tradeRouteAction: (rid, action) => request(`/settlements/trade/routes/${rid}`, { method: 'POST', body: { action } }),
    upgradeSettlementBuilding: (id, buildingId) => request(`/settlements/${id}/buildings/${buildingId}/upgrade`, { method: 'PUT' }),
    assignSettlementWorkers: (id, buildingId, workersAssigned) => request(`/settlements/${id}/buildings/${buildingId}/workers`, { method: 'PUT', body: { workersAssigned } }),
    cancelSettlementConstruction: (id, buildingId) => request(`/settlements/${id}/buildings/${buildingId}`, { method: 'DELETE' }),

    getPolitics: () => request('/politics'),
    enactLaw: (lawKey, optionKey) => request('/politics/laws', { method: 'POST', body: { lawKey, optionKey } }),
    resolveDemand: (id, action) => request(`/politics/demands/${id}/resolve`, { method: 'POST', body: { action } }),
    startReform: (reformKey) => request('/politics/reforms', { method: 'POST', body: { reformKey } }),
    investigate: () => request('/politics/investigate', { method: 'POST' }),
    getExploration: () => request('/exploration'),
    getExpedition: (id) => request(`/exploration/expeditions/${id}`),
    launchExpedition: (body) => request('/exploration/expeditions', { method: 'POST', body }),
    decideExpedition: (id, option) => request(`/exploration/expeditions/${id}/decide`, { method: 'POST', body: { option } }),
    recallExpedition: (id) => request(`/exploration/expeditions/${id}/recall`, { method: 'POST' }),
    hireExplorer: (specialty) => request('/exploration/explorers', { method: 'POST', body: { specialty } }),
    createExpMap: (body) => request('/exploration/maps', { method: 'POST', body }),
    updateExpMap: (id, cartographerId) => request(`/exploration/maps/${id}/update`, { method: 'POST', body: { cartographerId } }),
    decideArtifact: (id, action) => request(`/exploration/artifacts/${id}`, { method: 'POST', body: { action } }),
    startExpProject: (key) => request('/exploration/projects', { method: 'POST', body: { key } }),
    reallocateWorkers: () => request('/buildings/reallocate-workers', { method: 'POST' }),
    getUpgradeBatchQuote: (ids) => request(`/buildings/upgrade-batch-quote?ids=${ids.join(',')}`),
    upgradeBatch: (buildingIds) => request('/buildings/upgrade-batch', { method: 'POST', body: { buildingIds } }),
    getBatchQuote: (buildingKey, quantity) => request(`/buildings/batch-quote?buildingKey=${encodeURIComponent(buildingKey)}&quantity=${quantity}`),
    startConstructionBatch: (buildingKey, quantity) => request('/buildings/batch', { method: 'POST', body: { buildingKey, quantity } }),
    getInfra: () => request('/infrastructure'),
    raw: (path, opts) => request(path, opts),
    getGovernment: () => request('/government'),
    govPost: (path, body) => request('/government' + path, { method: 'POST', body: body || {} }),
    getGovernmentCatalog: () => request('/government/catalog'),
    doDecree: (key, option) => request(`/government/decrees/${key}`, { method: 'POST', body: { option } }),
    resolveGovCrisis: (id, option) => request(`/government/crises/${id}/decision`, { method: 'POST', body: { option } }),
    changeRegime: (path, target) => request('/government/regime', { method: 'POST', body: { path, target } }),
    getCampaign: () => request('/campaign'),
    setDifficulty: (difficulty) => request('/campaign/difficulty', { method: 'POST', body: { difficulty } }),
    crisisDecision: (id, option) => request(`/campaign/crises/${id}/decision`, { method: 'POST', body: { option } }),
    buildProject: (key) => request(`/campaign/projects/${key}/build`, { method: 'POST' }),
    continueFree: () => request('/campaign/continue', { method: 'POST' }),
    enableIronman: () => request('/campaign/ironman', { method: 'POST', body: { confirm: true } }),
    buildSlots: () => request('/buildings/slots'),
    rentBuildSlots: (count) => request('/buildings/slots/rent', { method: 'POST', body: { count } }),
    lostTerritories: () => request('/war/lost'),
    ransomTerritory: (territoryId) => request('/war/ransom-territory', { method: 'POST', body: { territoryId } }),
    getInfraTile: (id) => request(`/infrastructure/tile/${id}`),
    buildAircraft: (facilityId, type, qty) => request('/infrastructure/aircraft', { method: 'POST', body: { facilityId, type, qty } }),
    airMission: (id, kind) => request(`/infrastructure/aircraft/${id}/mission`, { method: 'POST', body: { kind } }),
    repairAircraft: (id) => request(`/infrastructure/aircraft/${id}/repair`, { method: 'POST' }),
    foundTransportCompany: (kind, name, amount) => request('/infrastructure/companies', { method: 'POST', body: { kind, name, amount } }),
    investCompany: (id, amount) => request(`/infrastructure/companies/${id}/invest`, { method: 'POST', body: { amount } }),
    liquidateCompany: (id) => request(`/infrastructure/companies/${id}`, { method: 'DELETE' }),
    resolveRouteDispute: (id, choice) => request(`/infrastructure/disputes/${id}/resolve`, { method: 'POST', body: { choice } }),
    supplyConvoy: (armyId, vehicles, guards) => request('/infrastructure/supply', { method: 'POST', body: { armyId, vehicles, guards } }),
    blockadeRoutes: (aiId) => request('/infrastructure/blockade', { method: 'POST', body: { aiId } }),
    repairPort: (id) => request(`/infrastructure/ports/${id}/repair`, { method: 'POST' }),
    setCounterIntel: (level) => request('/infrastructure/counterintel', { method: 'POST', body: { level } }),
    spyInfra: (aiId, missionKey) => request('/infrastructure/spy', { method: 'POST', body: { aiId, missionKey } }),
    quoteRoute: (b) => request('/infrastructure/routes/quote', { method: 'POST', body: b }),
    buildRoute: (b) => request('/infrastructure/routes', { method: 'POST', body: b }),
    cancelInfraProject: (id) => request(`/infrastructure/projects/${id}`, { method: 'DELETE' }),
    repairRoute: (id) => request(`/infrastructure/routes/${id}/repair`, { method: 'POST' }),
    setInfraPolicy: (b) => request('/infrastructure/policy', { method: 'POST', body: b }),
    buildPort: (nodeId) => request('/infrastructure/ports', { method: 'POST', body: { nodeId } }),
    portSpecialty: (portId, specialty) => request('/infrastructure/ports/specialty', { method: 'POST', body: { portId, specialty } }),
    buildShips: (portId, type, qty) => request('/infrastructure/ships', { method: 'POST', body: { portId, type, qty } }),
    shipMission: (id, kind) => request(`/infrastructure/ships/${id}/mission`, { method: 'POST', body: { kind } }),
    repairShip: (id) => request(`/infrastructure/ships/${id}/repair`, { method: 'POST' }),
    buildFacility: (nodeId, kind) => request('/infrastructure/facilities', { method: 'POST', body: { nodeId, kind } }),
    quoteShipment: (b) => request('/infrastructure/shipments/quote', { method: 'POST', body: b }),
    createShipment: (b) => request('/infrastructure/shipments', { method: 'POST', body: b }),
    getReligion: () => request('/religion'),
    setStateReligion: (religionId) => request('/religion/state', { method: 'POST', body: { religionId } }),
    setReligionTolerance: (level) => request('/religion/tolerance', { method: 'POST', body: { level } }),
    createReligion: (o) => request('/religion/create', { method: 'POST', body: o }),
    setReligionDoctrine: (religionId, axis, option) => request('/religion/doctrines', { method: 'POST', body: { religionId, axis, option } }),
    setReligionPolicy: (tithePct, subsidy) => request('/religion/policy', { method: 'POST', body: { tithePct, subsidy } }),
    setReligionStatus: (religionId, status) => request('/religion/status', { method: 'POST', body: { religionId, status } }),
    foundReligiousOrder: (religionId, orderKey) => request('/religion/orders', { method: 'POST', body: { religionId, orderKey } }),
    growReligiousOrder: (id, qty) => request(`/religion/orders/${id}/grow`, { method: 'POST', body: { qty } }),
    dissolveReligiousOrder: (id) => request(`/religion/orders/${id}`, { method: 'DELETE' }),
    attemptMiracle: (priestId, miracleKey) => request('/religion/miracles', { method: 'POST', body: { priestId, miracleKey } }),
    searchRelic: (religionId) => request('/religion/relics/search', { method: 'POST', body: { religionId } }),
    relicAction: (id, action) => request(`/religion/relics/${id}/action`, { method: 'POST', body: { action } }),
    commissionSacredText: (religionId, kind) => request('/religion/texts', { method: 'POST', body: { religionId, kind } }),
    convertReligion: (religionId, qty) => request('/religion/conversions', { method: 'POST', body: { religionId, qty } }),
    reviveReligion: (religionId) => request('/religion/revive', { method: 'POST', body: { religionId } }),
    resolveReligionDecision: (id, choice) => request(`/religion/decisions/${id}/resolve`, { method: 'POST', body: { choice } }),
    getDynasty: () => request('/dynasty'),
    getDynastyGenealogy: (familyId) => request(`/dynasty/genealogy/${familyId}`),
    getDynastyMember: (id) => request(`/dynasty/members/${id}`),
    designateHeir: (memberId) => request('/dynasty/heirs/designate', { method: 'POST', body: { memberId } }),
    educateMember: (memberId, area) => request('/dynasty/education', { method: 'POST', body: { memberId, area } }),
    dynastyMarry: (memberId, partnerType, partnerId) => request('/dynasty/marriages', { method: 'POST', body: { memberId, partnerType, partnerId } }),
    grantTitle: (memberId, titleKey) => request('/dynasty/titles', { method: 'POST', body: { memberId, titleKey } }),
    foundFamily: (kind) => request('/dynasty/families', { method: 'POST', body: { kind } }),
    adoptChild: () => request('/dynasty/children/adopt', { method: 'POST' }),
    setWill: (memberId, heirId) => request('/dynasty/wills', { method: 'POST', body: { memberId, heirId } }),
    banishMember: (memberId, action) => request('/dynasty/banish', { method: 'POST', body: { memberId, action } }),
    resolveDynDecision: (id, choice) => request(`/dynasty/decisions/${id}/resolve`, { method: 'POST', body: { choice } }),
    getMagic: () => request('/magic'),
    hireMage: (school) => request('/magic/mages', { method: 'POST', body: { school } }),
    castSpell: (mageId, spellKey) => request('/magic/cast', { method: 'POST', body: { mageId, spellKey } }),
    discoverArtifact: (mageId) => request('/magic/ritual', { method: 'POST', body: { mageId } }),
    summonCreature: (mageId, creatureKey) => request('/magic/summon', { method: 'POST', body: { mageId, creatureKey } }),
    openPortal: (mageId) => request('/magic/portal', { method: 'POST', body: { mageId } }),
    foundMagicGuild: (name) => request('/magic/guild', { method: 'POST', body: { name } }),
    getSecurity: () => request('/security'),
    hireSecurityPersonnel: (role) => request('/security/personnel', { method: 'POST', body: { role } }),
    assignDetective: (caseId, detectiveId) => request(`/security/cases/${caseId}/assign`, { method: 'POST', body: { detectiveId } }),
    launchSecurityOperation: (kind, targetId) => request('/security/operations', { method: 'POST', body: { kind, targetId } }),
    interrogateSuspect: (caseId, suspectId) => request(`/security/cases/${caseId}/interrogate`, { method: 'POST', body: { suspectId } }),
    enrollRehab: (convictId, program) => request('/security/rehab', { method: 'POST', body: { convictId, program } }),
    setProtection: (level) => request('/security/protection', { method: 'POST', body: { level } }),
    recoverStolenGood: (itemId) => request('/security/stolen-goods/recover', { method: 'POST', body: { itemId } }),
    ignoreStolenGood: (itemId) => request('/security/stolen-goods/ignore', { method: 'POST', body: { itemId } }),
    requestExtradition: (wantedId) => request('/security/extradite', { method: 'POST', body: { wantedId } }),
    getWar: () => request('/war'),
    hireMercenary: (unitKey, quantity) => request('/war/mercenaries', { method: 'POST', body: { unitKey, quantity } }),
    setMobilization: (level) => request('/war/mobilization', { method: 'POST', body: { level } }),
    appointGeneral: (specialty) => request('/war/generals', { method: 'POST', body: { specialty } }),
    createArmy: (name, generalId, composition) => request('/war/armies', { method: 'POST', body: { name, generalId, composition } }),
    disbandArmy: (id) => request(`/war/armies/${id}`, { method: 'DELETE' }),
    attackTerritory: (armyId, territoryId, stance, command) => request('/war/attack', { method: 'POST', body: { armyId, territoryId, stance, command } }),
    assaultSiege: (id, stance, command) => request(`/war/sieges/${id}/assault`, { method: 'POST', body: { stance, command } }),
    abandonSiege: (id) => request(`/war/sieges/${id}/abandon`, { method: 'POST' }),
    ransomPrisoners: (amount) => request('/war/prisoners/ransom', { method: 'POST', body: { amount } }),
    laborPrisoners: (amount) => request('/war/prisoners/labor', { method: 'POST', body: { amount } }),
    releasePrisoners: (amount) => request('/war/prisoners/release', { method: 'POST', body: { amount } }),
    militarySpy: (aiKingdomId, missionKey) => request('/war/spy', { method: 'POST', body: { aiKingdomId, missionKey } }),
    getCulture: () => request('/culture'),
    foundReligion: (religionKey, deityName) => request('/culture/religion', { method: 'POST', body: { religionKey, deityName } }),
    setTolerance: (level) => request('/culture/tolerance', { method: 'POST', body: { level } }),
    hirePriest: () => request('/culture/priests', { method: 'POST' }),
    hireArtist: (specialty) => request('/culture/artists', { method: 'POST', body: { specialty } }),
    commissionArtwork: (artistId) => request('/culture/artworks', { method: 'POST', body: { artistId } }),
    enshrineRelic: (artifactId) => request('/culture/relics', { method: 'POST', body: { artifactId } }),
    holdFestival: (type) => request('/culture/festivals', { method: 'POST', body: { type } }),
    dedicateMonument: (eventKey) => request('/culture/monuments', { method: 'POST', body: { eventKey } }),
    sendMissionary: (priestId, aiKingdomId) => request('/culture/missionaries', { method: 'POST', body: { priestId, aiKingdomId } }),
    sendPilgrimage: () => request('/culture/pilgrimage', { method: 'POST' }),
    culturalSpy: (aiKingdomId, missionKey) => request('/culture/spy', { method: 'POST', body: { aiKingdomId, missionKey } }),
    getDiplomacy: () => request('/diplomacy'),
    hireDiplomat: (specialty) => request('/diplomacy/diplomats', { method: 'POST', body: { specialty } }),
    buildEmbassy: (aiKingdomId, diplomatId) => request('/diplomacy/embassies', { method: 'POST', body: { aiKingdomId, diplomatId } }),
    sendDiploGift: (aiKingdomId, kind, amount) => request('/diplomacy/gifts', { method: 'POST', body: { aiKingdomId, kind, amount } }),
    signTreaty: (aiKingdomId, type) => request('/diplomacy/treaties', { method: 'POST', body: { aiKingdomId, type } }),
    breakTreaty: (id) => request(`/diplomacy/treaties/${id}`, { method: 'DELETE' }),
    declareWar: (aiKingdomId) => request('/diplomacy/war', { method: 'POST', body: { aiKingdomId } }),
    negotiateDiplo: (aiKingdomId, kind) => request('/diplomacy/negotiate', { method: 'POST', body: { aiKingdomId, kind } }),
    resolveDiploDemand: (id, action) => request(`/diplomacy/demands/${id}/resolve`, { method: 'POST', body: { action } }),
    joinCouncil: () => request('/diplomacy/council/join', { method: 'POST' }),
    imposeSanction: (aiKingdomId, type) => request('/diplomacy/sanctions', { method: 'POST', body: { aiKingdomId, type } }),
    liftSanction: (id) => request(`/diplomacy/sanctions/${id}`, { method: 'DELETE' }),
    requestMarriage: (aiKingdomId) => request('/diplomacy/marriage', { method: 'POST', body: { aiKingdomId } }),
    requestDiploAid: (aiKingdomId, aidType, tier) => request('/diplomacy/aid/request', { method: 'POST', body: { aiKingdomId, aidType, tier } }),
    sendDiploAid: (aiKingdomId, aidType, tier) => request('/diplomacy/aid/send', { method: 'POST', body: { aiKingdomId, aidType, tier } }),
    diplomaticSpy: (aiKingdomId, missionKey) => request('/diplomacy/spy', { method: 'POST', body: { aiKingdomId, missionKey } }),
    resolveBorderDispute: (id, action) => request(`/diplomacy/border-disputes/${id}/resolve`, { method: 'POST', body: { action } }),
    joinOrganization: (orgKey) => request('/diplomacy/organizations/join', { method: 'POST', body: { orgKey } }),
    leaveOrganization: (orgKey) => request('/diplomacy/organizations/leave', { method: 'POST', body: { orgKey } }),
    proposeResolution: (orgKey, templateKey, targetAiId) => request('/diplomacy/resolutions', { method: 'POST', body: { orgKey, templateKey, targetAiId } }),
    voteResolution: (id, choice) => request(`/diplomacy/resolutions/${id}/vote`, { method: 'POST', body: { choice } }),
    respondToRefugees: (id, action) => request(`/diplomacy/refugees/${id}/respond`, { method: 'POST', body: { action } }),
    signCityPact: (settlementId, aiKingdomId) => request('/diplomacy/city-pacts', { method: 'POST', body: { settlementId, aiKingdomId } }),
    breakCityPact: (settlementId) => request('/diplomacy/city-pacts', { method: 'DELETE', body: { settlementId } }),
    getTradeIntl: () => request('/trade-intl'),
    proposeTradeRoute: (body) => request('/trade-intl/routes', { method: 'POST', body }),
    cancelTradeRoute: (id) => request(`/trade-intl/routes/${id}`, { method: 'DELETE' }),
    launchCaravan: (body) => request('/trade-intl/caravans', { method: 'POST', body }),
    decideCaravan: (id, option) => request(`/trade-intl/caravans/${id}/decide`, { method: 'POST', body: { option } }),
    hireTradeMerchant: (specialty) => request('/trade-intl/merchants', { method: 'POST', body: { specialty } }),
    foundCompany: (type, name) => request('/trade-intl/companies', { method: 'POST', body: { type, name } }),
    liquidateCompany: (id) => request(`/trade-intl/companies/${id}`, { method: 'DELETE' }),
    signTradeContract: (body) => request('/trade-intl/contracts', { method: 'POST', body }),
    breakTradeContract: (id) => request(`/trade-intl/contracts/${id}`, { method: 'DELETE' }),
    blackMarketTrade: (resource, action, quantity) => request('/trade-intl/black-market', { method: 'POST', body: { resource, action, quantity } }),
    getTech: () => request('/tech'),
    startResearch: (techKey, researcherId) => request('/tech/research', { method: 'POST', body: { techKey, researcherId } }),
    cancelResearch: (key) => request(`/tech/research/${key}`, { method: 'DELETE' }),
    setTechSettings: (body) => request('/tech/settings', { method: 'POST', body }),
    hireResearcher: (specialty) => request('/tech/researchers', { method: 'POST', body: { specialty } }),
    decideInvention: (id, action) => request(`/tech/inventions/${id}`, { method: 'POST', body: { action } }),
    spyOn: (aiKingdomId) => request('/tech/spy', { method: 'POST', body: { aiKingdomId: Number(aiKingdomId) } }),
    getMarket: () => request('/market'),
    getResourceDetail: (key) => request(`/market/${key}`),
    tradeMarket: (resource, action, quantity) => request('/market/trade', { method: 'POST', body: { resource, action, quantity } }),
  };
})();

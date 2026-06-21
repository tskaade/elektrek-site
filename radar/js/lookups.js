/* CRT-RADAR lookup tables
   Decodes callsign airline prefixes and ICAO aircraft type codes into
   readable names. Not exhaustive — covers common carriers/types, with
   emphasis on what flies over the GTA. Unknown codes fall back to the raw
   code. Extend freely. */
window.RADAR_LOOKUPS = {

  // ICAO 3-letter airline prefix -> name. Callsigns start with these
  // (e.g. "ACA123" -> Air Canada). Matched on the leading 3 letters.
  airlines: {
    // --- Canadian ---
    ACA:'Air Canada', JZA:'Air Canada Jazz', ROU:'Air Canada Rouge',
    WJA:'WestJet', WEN:'WestJet Encore', SWG:'Sunwing', TSC:'Air Transat',
    POE:'Porter', FLE:'Flair', JET:'Canada Jetlines',
    CJT:'Cargojet', NRL:'Nolinor', MAL:'Morningstar Air',
    // --- US majors ---
    AAL:'American', DAL:'Delta', UAL:'United', SWA:'Southwest',
    JBU:'JetBlue', ASA:'Alaska', NKS:'Spirit', FFT:'Frontier',
    HAL:'Hawaiian', SCX:'Sun Country', AAY:'Allegiant', VXP:'Avelo',
    BRZ:'Breeze', FDX:'FedEx', UPS:'UPS', GTI:'Atlas Air',
    ATN:'Air Transport Intl', ABX:'ABX Air', AMX:'Aeroméxico',
    // --- Europe ---
    BAW:'British Airways', VIR:'Virgin Atlantic', DLH:'Lufthansa',
    AFR:'Air France', KLM:'KLM', EIN:'Aer Lingus', RYR:'Ryanair',
    EZY:'easyJet', WZZ:'Wizz Air', SAS:'SAS', IBE:'Iberia',
    SWR:'Swiss', AUA:'Austrian', BEL:'Brussels', TAP:'TAP Portugal',
    ITY:'ITA Airways', FIN:'Finnair', LOT:'LOT Polish', THY:'Turkish',
    ICE:'Icelandair', NAX:'Norwegian', TUI:'TUI', CFG:'Condor',
    // --- Middle East / Asia / Oceania ---
    UAE:'Emirates', QTR:'Qatar Airways', ETD:'Etihad', SVA:'Saudia',
    ELY:'El Al', SIA:'Singapore', CPA:'Cathay Pacific', ANA:'All Nippon',
    JAL:'Japan Airlines', KAL:'Korean Air', AAR:'Asiana', CCA:'Air China',
    CES:'China Eastern', CSN:'China Southern', QFA:'Qantas', ANZ:'Air NZ',
    AIC:'Air India',
    // --- Latin America / Caribbean ---
    VOI:'Volaris', TAI:'TACA', AVA:'Avianca',
    CMP:'Copa', LAN:'LATAM', TAM:'LATAM Brasil', AZU:'Azul',
    GLO:'GOL', BWA:'Caribbean Airlines', CAY:'Cayman Airways',
    // --- Business / charter common ---
    NJE:'NetJets Europe', EJA:'NetJets', LXJ:'Flexjet',
  },

  // ICAO aircraft type designator -> readable model.
  types: {
    // Airbus
    A19N:'Airbus A319neo', A20N:'Airbus A320neo', A21N:'Airbus A321neo',
    A318:'Airbus A318', A319:'Airbus A319', A320:'Airbus A320',
    A321:'Airbus A321', A332:'Airbus A330-200', A333:'Airbus A330-300',
    A338:'Airbus A330-800neo', A339:'Airbus A330-900neo',
    A342:'Airbus A340-200', A343:'Airbus A340-300', A345:'Airbus A340-500',
    A346:'Airbus A340-600', A359:'Airbus A350-900', A35K:'Airbus A350-1000',
    A388:'Airbus A380-800',
    // Boeing
    B712:'Boeing 717', B721:'Boeing 727-100', B722:'Boeing 727-200',
    B732:'Boeing 737-200', B733:'Boeing 737-300', B734:'Boeing 737-400',
    B735:'Boeing 737-500', B736:'Boeing 737-600', B737:'Boeing 737-700',
    B738:'Boeing 737-800', B739:'Boeing 737-900',
    B37M:'Boeing 737 MAX 7', B38M:'Boeing 737 MAX 8',
    B39M:'Boeing 737 MAX 9', B3XM:'Boeing 737 MAX 10',
    B741:'Boeing 747-100', B742:'Boeing 747-200', B743:'Boeing 747-300',
    B744:'Boeing 747-400', B748:'Boeing 747-8', B752:'Boeing 757-200',
    B753:'Boeing 757-300', B762:'Boeing 767-200', B763:'Boeing 767-300',
    B764:'Boeing 767-400', B772:'Boeing 777-200', B773:'Boeing 777-300',
    B77L:'Boeing 777-200LR', B77W:'Boeing 777-300ER', B778:'Boeing 777-8',
    B779:'Boeing 777-9', B788:'Boeing 787-8', B789:'Boeing 787-9',
    B78X:'Boeing 787-10',
    // Embraer / Bombardier / regional
    E135:'Embraer ERJ-135', E145:'Embraer ERJ-145', E170:'Embraer 170',
    E75L:'Embraer 175', E75S:'Embraer 175', E190:'Embraer 190',
    E195:'Embraer 195', E290:'Embraer E190-E2', E295:'Embraer E195-E2',
    CRJ1:'Bombardier CRJ100', CRJ2:'Bombardier CRJ200',
    CRJ7:'Bombardier CRJ700', CRJ9:'Bombardier CRJ900',
    CRJX:'Bombardier CRJ1000', BCS1:'Airbus A220-100',
    BCS3:'Airbus A220-300', DH8A:'Dash 8-100', DH8B:'Dash 8-200',
    DH8C:'Dash 8-300', DH8D:'Dash 8-400 (Q400)', AT43:'ATR 42-300',
    AT45:'ATR 42-500', AT72:'ATR 72', AT75:'ATR 72-500', AT76:'ATR 72-600',
    SF34:'Saab 340', J328:'Dornier 328',
    // Business jets
    C25A:'Cessna CJ2', C25B:'Cessna CJ3', C25C:'Cessna CJ4',
    C500:'Cessna Citation', C510:'Citation Mustang', C525:'CitationJet',
    C550:'Citation II', C560:'Citation V', C56X:'Citation Excel',
    C650:'Citation III', C680:'Citation Sovereign', C68A:'Citation Latitude',
    C700:'Citation Longitude', GLF4:'Gulfstream IV', GLF5:'Gulfstream V',
    GLF6:'Gulfstream G650', GL5T:'Global 5000', GLEX:'Global Express',
    G280:'Gulfstream G280', CL30:'Challenger 300', CL35:'Challenger 350',
    CL60:'Challenger 600', E50P:'Phenom 100', E55P:'Phenom 300',
    LJ35:'Learjet 35', LJ45:'Learjet 45', LJ60:'Learjet 60',
    F2TH:'Falcon 2000', FA7X:'Falcon 7X', FA8X:'Falcon 8X', H25B:'Hawker 800',
    // GA / props / common light
    C172:'Cessna 172', C152:'Cessna 152', C182:'Cessna 182',
    C206:'Cessna 206', C208:'Cessna Caravan', C210:'Cessna 210',
    PA28:'Piper Cherokee', PA31:'Piper Navajo', PA34:'Piper Seneca',
    P28A:'Piper Cherokee', BE20:'King Air 200', BE36:'Bonanza',
    BE58:'Baron', B350:'King Air 350', PC12:'Pilatus PC-12',
    TBM9:'TBM 900', SR22:'Cirrus SR22', SR20:'Cirrus SR20',
    DA40:'Diamond DA40', DA42:'Diamond DA42', RV7:'Vans RV-7',
    // Helicopters
    EC35:'Airbus H135', EC45:'Airbus H145', EC30:'Airbus H130',
    A139:'AW139', A169:'AW169', B06:'Bell 206', B407:'Bell 407',
    B412:'Bell 412', B429:'Bell 429', R44:'Robinson R44', R66:'Robinson R66',
    S76:'Sikorsky S-76', H60:'Sikorsky Black Hawk',
    // Military / other common over Ontario
    C130:'C-130 Hercules', C30J:'C-130J Hercules', K35R:'KC-135',
    P8:'Boeing P-8', E3TF:'E-3 Sentry', F18:'F/A-18', F35:'F-35',
    BALL:'Balloon', GLID:'Glider', UAV:'Drone/UAV',
  }
};

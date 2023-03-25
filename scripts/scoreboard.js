/// <reference path="csgo.d.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="common/gamerules_constants.ts" />
/// <reference path="common/formattext.ts" />
var Scoreboard = (function () {
    const _m_cP = $.GetContextPanel();
    let _m_LocalPlayerID = '';
    function GetLocalPlayerId() {
        if (_m_LocalPlayerID === '')
            _m_LocalPlayerID = GameStateAPI.GetLocalPlayerXuid();
        return _m_LocalPlayerID;
    }
    class Team_t {
        m_CommendLeaderboards = {
            'leader': [],
            'teacher': [],
            'friendly': [],
        };
        m_teamName;
        constructor(teamName) {
            this.m_teamName = teamName;
        }
        CalculateAllCommends() {
            ['leader', 'teacher', 'friendly'].forEach(stat => {
                this._SortCommendLeaderboard(stat);
                this._ChangeCommendDisplay(_m_TopCommends[stat], stat, false);
                _m_TopCommends[stat] = this._GetCommendBestXuid(stat);
                this._ChangeCommendDisplay(_m_TopCommends[stat], stat, true);
            });
        }
        UpdateCommendForPlayer(xuid, stat, value) {
            if (value == 0)
                return;
            let playerCommend = this.m_CommendLeaderboards[stat].find(p => p.m_xuid === xuid);
            if (!playerCommend) {
                this.m_CommendLeaderboards[stat].push({ m_xuid: xuid, m_value: value });
            }
            else {
                playerCommend.m_value = value;
            }
        }
        DeletePlayerFromCommendsLeaderboards(xuid) {
            ['leader', 'teacher', 'friendly'].forEach(stat => {
                let index = this.m_CommendLeaderboards[stat].findIndex(p => p.m_xuid === xuid);
                if (index != -1) {
                    this.m_CommendLeaderboards[stat].splice(index, 1);
                }
            });
        }
        _ChangeCommendDisplay(xuid, stat, turnon) {
            let oPlayer = _m_oPlayers.GetPlayerByXuid(xuid);
            if (!oPlayer)
                return;
            let elPlayer = oPlayer.m_elPlayer;
            if (!elPlayer || !elPlayer.IsValid())
                return;
            let elCommendationImage = elPlayer.FindChildTraverse('id-sb-name__commendations__' + stat);
            if (!elCommendationImage || !elCommendationImage.IsValid())
                return;
            elCommendationImage.SetHasClass('hidden', !turnon);
        }
        _SortCommendLeaderboard(stat) {
            this.m_CommendLeaderboards[stat].sort(function (a, b) { return b.m_value - a.m_value; });
        }
        _GetCommendBestXuid(stat) {
            switch (stat) {
                case 'leader': return this._GetCommendTopLeaderXuid();
                case 'teacher': return this._GetCommendTopTeacherXuid();
                case 'friendly': return this._GetCommendTopFriendlyXuid();
                default: return "0";
            }
        }
        _GetCommendTopLeaderXuid() {
            let clb = this.m_CommendLeaderboards['leader'];
            return clb[0] ? clb[0].m_xuid : "0";
        }
        _GetCommendTopTeacherXuid() {
            let clb = this.m_CommendLeaderboards['teacher'];
            let teacher0 = clb[0] ? clb[0].m_xuid : "0";
            let teacher1 = clb[1] ? clb[1].m_xuid : "0";
            if (teacher0 != this._GetCommendTopLeaderXuid())
                return teacher0;
            else
                return teacher1;
        }
        _GetCommendTopFriendlyXuid() {
            let clb = this.m_CommendLeaderboards['friendly'];
            let friendly0 = clb[0] ? clb[0].m_xuid : "0";
            let friendly1 = clb[1] ? clb[1].m_xuid : "0";
            let friendly2 = clb[2] ? clb[2].m_xuid : "0";
            if (friendly0 != this._GetCommendTopLeaderXuid() && friendly0 != this._GetCommendTopTeacherXuid())
                return friendly0;
            else if (friendly1 != this._GetCommendTopLeaderXuid() && friendly1 != this._GetCommendTopTeacherXuid())
                return friendly1;
            else
                return friendly2;
        }
    }
    class Player_t {
        m_xuid;
        m_elPlayer = undefined;
        m_elTeam = undefined;
        m_oStats = {};
        m_oElStats = {};
        m_isMuted = false;
        m_oMatchStats = undefined;
        constructor(xuid) {
            this.m_xuid = xuid;
        }
        GetStatNum(stat, dflt = 0) {
            const val = this.m_oStats[stat];
            return typeof val === "number" && isFinite(val) ? val : dflt;
        }
        GetStatText(stat, dflt = "") {
            const val = this.m_oStats[stat];
            return typeof val === "string" ? val : val != null ? val.toString() : dflt;
        }
    }
    class AllPlayers_t {
        m_arrPlayers = [];
        AddPlayer(xuid) {
            let newPlayer = new Player_t(xuid);
            let teamName = GameStateAPI.GetPlayerTeamName(xuid);
            if (IsTeamASpecTeam(teamName))
                teamName = 'Spectator';
            let elTeam = _m_cP.FindChildInLayoutFile('players-table-' + teamName);
            if (!elTeam || !elTeam.IsValid()) {
                elTeam = _m_cP.FindChildInLayoutFile('players-table-ANY');
            }
            newPlayer.m_elTeam = elTeam;
            this.m_arrPlayers.push(newPlayer);
            return newPlayer;
        }
        GetPlayerByIndex(i) {
            return this.m_arrPlayers[i];
        }
        GetPlayerByXuid(xuid) {
            return this.m_arrPlayers.find(p => p.m_xuid === xuid);
        }
        GetPlayerIndexByPlayerSlot(slot) {
            let xuid = GameStateAPI.GetPlayerXuidStringFromPlayerSlot(slot);
            return this.GetPlayerIndexByXuid(xuid);
        }
        GetPlayerIndexByXuid(xuid) {
            return this.m_arrPlayers.findIndex(p => p.m_xuid === xuid);
        }
        GetCount() {
            return this.m_arrPlayers.length;
        }
        DeletePlayerByXuid(xuid) {
            let oPlayer = this.GetPlayerByXuid(xuid);
            const teamName = oPlayer?.m_oStats?.teamname;
            if (teamName && _m_oTeams[teamName]) {
                _m_oTeams[teamName].DeletePlayerFromCommendsLeaderboards(xuid);
            }
            let i = this.GetPlayerIndexByXuid(xuid);
            if (this.m_arrPlayers[i].m_elPlayer && this.m_arrPlayers[i].m_elPlayer.IsValid()) {
                this.m_arrPlayers[i].m_elPlayer.DeleteAsync(.0);
            }
            this.m_arrPlayers.splice(i, 1);
        }
        DeleteMissingPlayers(oPlayerList) {
            const players = Object.values(oPlayerList).flatMap(team => Object.values(team ?? {}));
            const sXuids = new Set(players.filter(xuid => !!xuid));
            for (const player of this.m_arrPlayers) {
                if (!sXuids.has(player.m_xuid)) {
                    this.DeletePlayerByXuid(player.m_xuid);
                }
            }
        }
    }
    let _m_bInit = false;
    let _m_oUpdateStatFns = {};
    let _m_updatePlayerIndex = 0;
    let _m_oTeams = {};
    let _m_arrSortingPausedRefGetCounter = 0;
    let _m_hDenyInputToGame = null;
    let _m_dataSetCurrent = 0;
    let _m_dataSetGetCount = 0;
    let _m_areTeamsSwapped = false;
    let _m_maxRounds = 0;
    let _m_oPlayers;
    let _m_RoundUpdated = {};
    let _m_TopCommends = {
        'leader': "0",
        'teacher': "0",
        'friendly': "0",
    };
    let _m_overtime = 0;
    let _m_sortOrder = undefined;
    let _m_updatePlayerHandler = null;
    let _m_haveViewers = false;
    _Reset();
    function _Reset() {
        _m_bInit = false;
        _m_oPlayers = new AllPlayers_t();
        _m_oUpdateStatFns = {};
        _m_updatePlayerIndex = 0;
        _m_oTeams = {};
        _m_arrSortingPausedRefGetCounter = 0;
        _m_hDenyInputToGame = null;
        _m_dataSetCurrent = 0;
        _m_dataSetGetCount = 0;
        _m_areTeamsSwapped = false;
        _m_maxRounds = 0;
        _m_sortOrder = undefined;
        _m_overtime = 0;
        _m_RoundUpdated = {};
        _m_TopCommends = {
            'leader': "0",
            'teacher': "0",
            'friendly': "0",
        };
        _m_cP.RemoveAndDeleteChildren();
        _m_cP.m_bSnippetLoaded = false;
    }
    function _Helper_LoadSnippet(element, snippet) {
        if (element && !element.m_bSnippetLoaded) {
            element.BLoadLayoutSnippet(snippet);
            element.m_bSnippetLoaded = true;
        }
    }
    function _PopulatePlayerList() {
        const playerData = GameStateAPI.GetPlayerDataJSO();
        const teamNames = Object.keys(playerData);
        if (teamNames.length === 0)
            return;
        _m_oPlayers.DeleteMissingPlayers(playerData);
        for (const teamName of teamNames) {
            if (!ShouldCreateTeamForMode(teamName))
                continue;
            CreateTeam(teamName);
            for (const xuid of Object.values(playerData[teamName])) {
                if (xuid == null || xuid === "0")
                    continue;
                const oPlayer = _m_oPlayers.GetPlayerByXuid(xuid);
                if (!oPlayer) {
                    _CreateNewPlayer(xuid);
                }
                else if (oPlayer.m_oStats['teamname'] != teamName) {
                    _ChangeTeams(oPlayer, teamName);
                }
            }
        }
        if (ShouldCreateTeamForMode('CT'))
            CreateTeam('CT');
        if (ShouldCreateTeamForMode('TERRORIST'))
            CreateTeam('TERRORIST');
        function CreateTeam(teamName) {
            if (!_m_oTeams[teamName])
                _m_oTeams[teamName] = new Team_t(teamName);
        }
        function ShouldCreateTeamForMode(team) {
            let mode = GameStateAPI.GetGameModeInternalName(false);
            if (mode == 'cooperative' || mode == 'coopmission') {
                return team.toUpperCase() === GameStateAPI.GetCooperativePlayerTeamName().toUpperCase();
            }
            return true;
        }
    }
    function _ChangeTeams(oPlayer, newTeam) {
        if (oPlayer.m_oStats['teamname'] == newTeam)
            return;
        let xuid = oPlayer.m_xuid;
        let oldTeam = oPlayer.m_oStats['teamname'];
        let elPlayer = oPlayer.m_elPlayer;
        oPlayer.m_oStats['teamname'] = newTeam;
        if (oldTeam in _m_oTeams) {
            _m_oTeams[oldTeam].DeletePlayerFromCommendsLeaderboards(xuid);
        }
        oPlayer.m_oStats['leader'] = -1;
        oPlayer.m_oStats['teacher'] = -1;
        oPlayer.m_oStats['friendly'] = -1;
        if (!elPlayer || !elPlayer.IsValid())
            return;
        if (oldTeam)
            elPlayer.RemoveClass('sb-team--' + oldTeam);
        elPlayer.AddClass('sb-team--' + newTeam);
        if (IsTeamASpecTeam(newTeam) && MatchStatsAPI.IsTournamentMatch()) {
            elPlayer.AddClass('hidden');
            return;
        }
        let elTeam = _m_cP.FindChildInLayoutFile('players-table-' + newTeam);
        if (!elTeam && !IsTeamASpecTeam(newTeam)) {
            elTeam = _m_cP.FindChildInLayoutFile('players-table-ANY');
        }
        if (elTeam && elTeam.IsValid()) {
            oPlayer.m_elTeam = elTeam;
            elPlayer.SetParent(elTeam);
            elPlayer.RemoveClass('hidden');
        }
        else {
            elPlayer.AddClass('hidden');
        }
        let idx = _m_oPlayers.GetPlayerIndexByXuid(xuid);
        _UpdateAllStatsForPlayer(idx, true);
        _SortPlayer(idx);
    }
    function _CreateNewPlayer(xuid) {
        let oPlayer = _m_oPlayers.AddPlayer(xuid);
        _NewPlayerPanel(oPlayer);
        let idx = _m_oPlayers.GetPlayerIndexByXuid(xuid);
        _UpdateAllStatsForPlayer(idx, true);
        _SortPlayer(idx);
        for (let s in _m_sortOrder) {
            _HighlightSortStatLabel(s);
            break;
        }
    }
    function _UpdateNextPlayer() {
        _m_oPlayers.DeleteMissingPlayers(GameStateAPI.GetPlayerDataJSO());
        if (_m_updatePlayerIndex >= _m_oPlayers.GetCount()) {
            _PopulatePlayerList();
            _m_updatePlayerIndex = 0;
        }
        _UpdatePlayer(_m_updatePlayerIndex);
        _m_updatePlayerIndex++;
    }
    function _UpdateAllPlayers_delayed(bSilent = false) {
        $.Schedule(0.01, () => _UpdateAllPlayers(bSilent));
    }
    function _UpdateAllPlayers(bSilent) {
        if (!_m_bInit)
            return;
        _PopulatePlayerList();
        _m_updatePlayerIndex = 0;
        for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
            let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
            if (elPlayer && elPlayer.IsValid())
                elPlayer.RemoveClass('sb-row--transition');
        }
        for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
            _UpdatePlayer(i, bSilent);
        }
        for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
            let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
            if (elPlayer && elPlayer.IsValid())
                elPlayer.AddClass('sb-row--transition');
        }
    }
    function _Pulse(el) {
        el.RemoveClass('sb-pulse-highlight');
        el.AddClass('sb-pulse-highlight');
    }
    function _UpdatePlayerByPlayerSlot(slot) {
        let index = _m_oPlayers.GetPlayerIndexByPlayerSlot(slot);
        _UpdatePlayer(index, true);
    }
    function _UpdatePlayerByPlayerSlot_delayed(slot) {
        $.Schedule(0.01, () => _UpdatePlayerByPlayerSlot(slot));
    }
    function _UpdatePlayer(idx, bSilent = false) {
        let oPlayer = _m_oPlayers.GetPlayerByIndex(idx);
        if (!oPlayer)
            return;
        bSilent = bSilent && _m_cP.visible;
        let xuid = oPlayer.m_xuid;
        oPlayer.m_oMatchStats = MatchStatsAPI.GetPlayerStatsJSO(xuid);
        _UpdateAllStatsForPlayer(idx, bSilent);
        _SortPlayer(idx);
    }
    function _UpdateSpectatorButtons() {
        let elButtonPanel = $('#spec-button-group');
        if (!elButtonPanel || !elButtonPanel.IsValid())
            return;
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        let bQ = (GameStateAPI.IsLocalPlayerHLTV() && nCameraMan > -1);
        if (bQ) {
            elButtonPanel.visible = true;
            UpdateCasterButtons();
        }
        else {
            elButtonPanel.visible = false;
        }
    }
    const sortOrder_default = {
        'dc': 0,
        'score': 0,
        'risc': 0,
        'mvps': 0,
        'kills': 0,
        'assists': 0,
        'deaths': -1,
        'leader': 0,
        'teacher': 0,
        'friendly': 0,
        'rank': 0,
        'idx': -1,
        'damage': 0,
        'avgrisc': 0,
        'money': 0,
        'hsp': 0,
        'kdr': 0,
        'adr': 0,
        'utilitydamage': 0,
        'enemiesflashed': 0,
    };
    const sortOrder_reverse = {
        'dc': 0,
        'score': -1,
        'risc': -1,
        'mvps': -1,
        'kills': -1,
        'assists': -1,
        'deaths': 0,
        'leader': -1,
        'teacher': -1,
        'friendly': -1,
        'rank': -1,
        'idx': 0,
        'damage': 0,
        'avgrisc': 0,
        'money': 0,
        'hsp': 0,
        'kdr': 0,
        'adr': 0,
        'utilitydamage': 0,
        'enemiesflashed': 0,
    };
    const sortOrder_dm = {
        'dc': 0,
        'score': 0,
        'idx': -1,
        'hsp': 0,
        'kdr': 0,
        'kills': 0,
        'assists': 0,
        'deaths': -1,
        'rank': 0,
    };
    const sortOrder_gg = {
        'dc': 0,
        'gglevel': 0,
        'ggleader': 0,
        'idx': -1,
        'hsp': 0,
        'kdr': 0,
        'score': 0,
        'kills': 0,
        'assists': 0,
        'deaths': -1,
    };
    const sortOrder_tmm = {
        'dc': 0,
        'damage': 0,
        'kills': 0,
        'risc': 0,
        'mvps': 0,
        'assists': 0,
        'deaths': -1,
        'leader': 0,
        'teacher': 0,
        'friendly': 0,
        'rank': 0,
        'idx': -1,
        'score': 0,
        'avgrisc': 0,
        'money': 0,
        'hsp': 0,
        'kdr': 0,
        'adr': 0,
        'utilitydamage': 0,
        'enemiesflashed': 0,
    };
    function _lessthan(x, y) {
        x = Number(x);
        y = Number(y);
        if (isNaN(x))
            return (!isNaN(y));
        if (isNaN(y))
            return false;
        return (x < y);
    }
    function _SortPlayer(idx) {
        if (_m_arrSortingPausedRefGetCounter != 0)
            return;
        let oPlayer = _m_oPlayers.GetPlayerByIndex(idx);
        let elTeam = oPlayer.m_elTeam;
        if (!elTeam || !elTeam.IsValid())
            return;
        let elPlayer = oPlayer.m_elPlayer;
        if (!elPlayer || !elPlayer.IsValid())
            return;
        let children = elTeam.Children();
        for (let i = 0; i < children.length; i++) {
            if (oPlayer.m_xuid === children[i].m_xuid)
                continue;
            let oCompareTargetPlayer = _m_oPlayers.GetPlayerByXuid(children[i].m_xuid);
            if (!oCompareTargetPlayer)
                continue;
            for (let stat in _m_sortOrder) {
                let p1stat = oPlayer.m_oStats[stat];
                let p2stat = oCompareTargetPlayer.m_oStats[stat];
                if (_m_sortOrder[stat] === -1) {
                    let tmp = p1stat;
                    p1stat = p2stat;
                    p2stat = tmp;
                }
                if (_lessthan(p2stat, p1stat)) {
                    if (children[i - 1] != elPlayer) {
                        elTeam.MoveChildBefore(elPlayer, children[i]);
                    }
                    return;
                }
                else if (_lessthan(p1stat, p2stat)) {
                    break;
                }
            }
        }
    }
    function IsTeamASpecTeam(teamname) {
        return (teamname === 'Spectator' ||
            teamname === 'Unassigned' ||
            teamname === 'Unknown' ||
            teamname === 'UNKNOWN TEAM' ||
            teamname === '');
    }
    function _UpdateAllStatsForPlayer(idx, bSilent = false) {
        let oPlayer = _m_oPlayers.GetPlayerByIndex(idx);
        for (let stat in _m_oUpdateStatFns) {
            if (typeof (_m_oUpdateStatFns[stat]) === 'function') {
                _m_oUpdateStatFns[stat](oPlayer, bSilent);
            }
        }
    }
    function _GenericUpdateStat(oPlayer, stat, fnGetStat, bSilent = false) {
        let elPanel = oPlayer.m_oElStats[stat];
        if (!elPanel || !elPanel.IsValid())
            return;
        let elLabel = elPanel.FindChildTraverse('label');
        let newStatValue = fnGetStat(oPlayer.m_xuid);
        if (newStatValue !== oPlayer.m_oStats[stat]) {
            if (!bSilent) {
                if (elLabel && elLabel.IsValid()) {
                    _Pulse(elLabel);
                }
            }
            oPlayer.m_oStats[stat] = newStatValue;
            if (elLabel && elLabel.IsValid()) {
                elLabel.text = newStatValue.toString();
            }
        }
    }
    function _GetMatchStatFn(stat) {
        function _fn(xuid) {
            let oPlayer = _m_oPlayers.GetPlayerByXuid(xuid);
            let allstats = oPlayer.m_oMatchStats;
            if (allstats)
                return (allstats[stat] == -1) ? '-' : allstats[stat];
            return '-';
        }
        return _fn;
    }
    function _CreateStatUpdateFn(stat) {
        let fn;
        switch (stat) {
            case 'musickit':
                fn = oPlayer => {
                    if (MockAdapter.IsFakePlayer(oPlayer.m_xuid))
                        return;
                    let ownerXuid = oPlayer.m_xuid;
                    let isLocalPlayer = oPlayer.m_xuid == GetLocalPlayerId();
                    let isBorrowed = false;
                    let borrowedXuid = "0";
                    let borrowedPlayerSlot = parseInt(GameInterfaceAPI.GetSettingString('cl_borrow_music_from_player_slot'));
                    if (borrowedPlayerSlot >= 0 && isLocalPlayer) {
                        borrowedXuid = GameStateAPI.GetPlayerXuidStringFromPlayerSlot(borrowedPlayerSlot);
                        if (MockAdapter.IsPlayerConnected(borrowedXuid)) {
                            ownerXuid = borrowedXuid;
                            isBorrowed = true;
                        }
                    }
                    let newStatValue = InventoryAPI.GetMusicIDForPlayer(ownerXuid);
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        if (isLocalPlayer) {
                            let elMusicKit = $('#id-sb-meta__musickit');
                            if (!elMusicKit || !elMusicKit.IsValid())
                                return;
                            let isValidMusicKit = newStatValue > 0;
                            elMusicKit.SetHasClass('hidden', !isValidMusicKit);
                            if (isValidMusicKit) {
                                _m_cP.FindChildTraverse('id-sb-meta__musickit-unborrow').SetHasClass('hidden', !isBorrowed);
                                let imagepath = 'file://{images}/' + InventoryAPI.GetItemInventoryImageFromMusicID(newStatValue) + '.png';
                                $('#id-sb-meta__musickit-image').SetImage(imagepath);
                                $('#id-sb-meta__musickit-name').text = $.Localize(InventoryAPI.GetMusicNameFromMusicID(newStatValue));
                            }
                        }
                    }
                    let elPlayer = oPlayer.m_elPlayer;
                    if (elPlayer && elPlayer.IsValid()) {
                        let elMusicKitIcon = elPlayer.FindChildTraverse('id-sb-name__musickit');
                        if (elMusicKitIcon && elMusicKitIcon.IsValid()) {
                            elMusicKitIcon.SetHasClass('hidden', newStatValue <= 1);
                        }
                    }
                };
                break;
            case 'teamname':
                fn = oPlayer => {
                    let newStatValue = MockAdapter.GetPlayerTeamName(oPlayer.m_xuid);
                    _ChangeTeams(oPlayer, newStatValue);
                };
                break;
            case 'ping':
                fn = oPlayer => {
                    let elPlayer = oPlayer.m_elPlayer;
                    if (!elPlayer || !elPlayer.IsValid())
                        return;
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    let elLabel = elPanel.FindChildTraverse('label');
                    if (!elLabel)
                        return;
                    let szCustomLabel = _GetCustomStatTextValue('ping', oPlayer.m_xuid);
                    elLabel.SetHasClass('sb-row__cell--ping__label--bot', !!szCustomLabel);
                    if (szCustomLabel) {
                        elLabel.text = $.Localize(szCustomLabel);
                        oPlayer.m_oStats[stat] = szCustomLabel;
                    }
                    else {
                        _GenericUpdateStat(oPlayer, stat, MockAdapter.GetPlayerPing, true);
                    }
                };
                break;
            case 'kills':
                fn = function (oPlayer, bSilent = false) {
                    _GenericUpdateStat(oPlayer, stat, MockAdapter.GetPlayerKills, bSilent);
                };
                break;
            case 'assists':
                fn = function (oPlayer, bSilent = false) {
                    _GenericUpdateStat(oPlayer, stat, MockAdapter.GetPlayerAssists, bSilent);
                };
                break;
            case 'deaths':
                fn = function (oPlayer, bSilent = false) {
                    _GenericUpdateStat(oPlayer, stat, MockAdapter.GetPlayerDeaths, bSilent);
                };
                break;
            case '3k':
            case '4k':
            case '5k':
            case 'adr':
            case 'hsp':
            case 'utilitydamage':
            case 'enemiesflashed':
            case 'damage':
                fn = function (oPlayer, bSilent = false) {
                    _GenericUpdateStat(oPlayer, stat, _GetMatchStatFn(stat), bSilent);
                };
                break;
            case 'kdr':
                fn = function (oPlayer, bSilent = false) {
                    let kdr;
                    if (_m_overtime == 0) {
                        let kdrFn = _GetMatchStatFn('kdr');
                        kdr = kdrFn(oPlayer.m_xuid);
                        if (typeof kdr == 'number' && kdr > 0) {
                            kdr = kdr / 100.0;
                        }
                    }
                    else {
                        let denom = oPlayer.GetStatNum('deaths') || 1;
                        kdr = oPlayer.GetStatNum('kills') / denom;
                    }
                    if (typeof kdr == 'number') {
                        kdr = kdr.toFixed(2);
                    }
                    _GenericUpdateStat(oPlayer, stat, () => { return kdr; }, bSilent);
                };
                break;
            case 'mvps':
                fn = function (oPlayer, bSilent = false) {
                    let newStatValue = MockAdapter.GetPlayerMVPs(oPlayer.m_xuid);
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        let elMVPPanel = oPlayer.m_oElStats[stat];
                        if (!elMVPPanel || !elMVPPanel.IsValid())
                            return;
                        let elMVPStarImage = elMVPPanel.FindChildTraverse('star-image');
                        if (!elMVPStarImage || !elMVPStarImage.IsValid())
                            return;
                        let elMVPStarNumberLabel = elMVPPanel.FindChildTraverse('star-count');
                        if (!elMVPStarNumberLabel || !elMVPStarNumberLabel.IsValid())
                            return;
                        oPlayer.m_oStats[stat] = newStatValue;
                        elMVPStarImage.SetHasClass('hidden', newStatValue == 0);
                        elMVPStarNumberLabel.SetHasClass('hidden', newStatValue == 0);
                        elMVPStarNumberLabel.text = newStatValue.toString();
                        if (!bSilent) {
                            _Pulse(elMVPStarImage);
                            _Pulse(elMVPStarNumberLabel);
                        }
                    }
                };
                break;
            case 'status':
                fn = oPlayer => {
                    let newStatValue = MockAdapter.GetPlayerStatus(oPlayer.m_xuid);
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPlayer = oPlayer.m_elPlayer;
                        if (!elPlayer || !elPlayer.IsValid())
                            return;
                        elPlayer.SetHasClass('sb-player-status-dead', newStatValue === 1);
                        elPlayer.SetHasClass('sb-player-status-disconnected', newStatValue === 15);
                        oPlayer.m_oStats['dc'] = newStatValue === 15 ? 0 : 1;
                        let elPanel = oPlayer.m_oElStats[stat];
                        if (!elPanel || !elPanel.IsValid())
                            return;
                        let elStatusImage = elPanel.FindChildTraverse('image');
                        if (!elStatusImage || !elStatusImage.IsValid())
                            return;
                        elStatusImage.SetImage(dictPlayerStatusImage[newStatValue]);
                    }
                };
                break;
            case 'score':
                fn = oPlayer => {
                    _GenericUpdateStat(oPlayer, stat, MockAdapter.GetPlayerScore);
                };
                break;
            case 'money':
                fn = oPlayer => {
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    let elLabel = elPanel.FindChildTraverse('label');
                    if (!elLabel || !elLabel.IsValid())
                        return;
                    let newStatValue = MockAdapter.GetPlayerMoney(oPlayer.m_xuid);
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        if (newStatValue >= 0) {
                            elLabel.SetHasClass('hidden', false);
                            elLabel.SetDialogVariableInt('stat_d_money', newStatValue);
                        }
                        else {
                            elLabel.SetHasClass('hidden', true);
                        }
                    }
                    oPlayer.m_oStats[stat] = newStatValue;
                };
                break;
            case 'name':
                fn = oPlayer => {
                    if (!oPlayer.m_elPlayer || !oPlayer.m_elPlayer.IsValid())
                        return;
                    oPlayer.m_elPlayer.SetHasClass('sb-row--localplayer', oPlayer.m_xuid === GetLocalPlayerId());
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    oPlayer.m_elPlayer.SetDialogVariableInt('player_slot', GameStateAPI.GetPlayerSlot(oPlayer.m_xuid));
                };
                break;
            case 'leader':
            case 'teacher':
            case 'friendly':
                fn = oPlayer => {
                    let newStatValue;
                    if (GameStateAPI.IsDemoOrHltv() || IsTeamASpecTeam(GameStateAPI.GetPlayerTeamName(GetLocalPlayerId())))
                        return;
                    if (!GameStateAPI.IsXuidValid(oPlayer.m_xuid)) {
                        return;
                    }
                    else {
                        switch (stat) {
                            case 'leader':
                                newStatValue = GameStateAPI.GetPlayerCommendsLeader(oPlayer.m_xuid);
                                break;
                            case 'teacher':
                                newStatValue = GameStateAPI.GetPlayerCommendsTeacher(oPlayer.m_xuid);
                                break;
                            case 'friendly':
                                newStatValue = GameStateAPI.GetPlayerCommendsFriendly(oPlayer.m_xuid);
                                break;
                        }
                    }
                    if (oPlayer.m_oStats[stat] != newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let oTeam = _m_oTeams[oPlayer.GetStatText('teamname')];
                        if (oTeam)
                            oTeam.UpdateCommendForPlayer(oPlayer.m_xuid, stat, newStatValue);
                    }
                };
                break;
            case 'flair':
                fn = oPlayer => {
                    if (GameStateAPI.IsLatched())
                        return;
                    let newStatValue = InventoryAPI.GetFlairItemId(oPlayer.m_xuid);
                    if (oPlayer.m_oStats[stat] !== newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPanel = oPlayer.m_oElStats[stat];
                        if (!elPanel || !elPanel.IsValid())
                            return;
                        let elFlairImage = elPanel.FindChildTraverse('image');
                        if (!elFlairImage || !elFlairImage.IsValid())
                            return;
                        let imagepath = InventoryAPI.GetFlairItemImage(oPlayer.m_xuid);
                        elFlairImage.SetImage('file://{images}' + imagepath + '_small.png');
                    }
                };
                break;
            case 'avatar':
                fn = oPlayer => {
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    let elAvatarImage = elPanel.FindChildTraverse('image');
                    if (!elAvatarImage || !elAvatarImage.IsValid())
                        return;
                    elAvatarImage.PopulateFromPlayerSlot(GameStateAPI.GetPlayerSlot(oPlayer.m_xuid));
                    let team = GameStateAPI.GetPlayerTeamName(oPlayer.m_xuid);
                    elAvatarImage.SwitchClass('teamstyle', 'team--' + team);
                    let elPlayerColor = elAvatarImage.FindChildTraverse('player-color');
                    if (elPlayerColor && elPlayerColor.IsValid()) {
                        let teamColor = GameStateAPI.GetPlayerColor(oPlayer.m_xuid);
                        if (teamColor !== '') {
                            elPlayerColor.style.washColor = teamColor;
                            elPlayerColor.RemoveClass('hidden');
                        }
                        else {
                            elPlayerColor.AddClass('hidden');
                        }
                    }
                    let isMuted = GameStateAPI.IsSelectedPlayerMuted(oPlayer.m_xuid);
                    oPlayer.m_isMuted = isMuted;
                    let isEnemyTeamMuted = GameInterfaceAPI.GetSettingString("cl_mute_enemy_team") == "1";
                    let isEnemy = GameStateAPI.ArePlayersEnemies(oPlayer.m_xuid, GetLocalPlayerId());
                    let hasComAbusePenalty = GameStateAPI.HasCommunicationAbuseMute(oPlayer.m_xuid);
                    let isLocalPlayer = oPlayer.m_xuid == GetLocalPlayerId();
                    oPlayer.m_elPlayer.SetHasClass('muted', isMuted || (isEnemy && isEnemyTeamMuted) || (isLocalPlayer && hasComAbusePenalty));
                };
                break;
            case 'skillgroup':
                fn = oPlayer => {
                    let newStatValue = GameStateAPI.GetPlayerCompetitiveRanking(oPlayer.m_xuid);
                    if (oPlayer.m_oStats[stat] !== newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPlayer = oPlayer.m_elPlayer;
                        if (elPlayer && elPlayer.IsValid()) {
                            let elSkillGroupImage = elPlayer.FindChildTraverse('id-sb-skillgroup-image');
                            if (elSkillGroupImage && elSkillGroupImage.IsValid()) {
                                let imagepath = '';
                                if (newStatValue > 0) {
                                    let mode = MockAdapter.GetGameModeInternalName(false);
                                    let imagePath = 'skillgroup';
                                    if (mode == 'scrimcomp2v2')
                                        imagePath = 'wingman';
                                    imagepath = 'file://{images}/icons/skillgroups/' + imagePath + newStatValue + '.svg';
                                    elSkillGroupImage.RemoveClass('hidden');
                                }
                                else {
                                    imagepath = '';
                                    elSkillGroupImage.AddClass('hidden');
                                }
                                elSkillGroupImage.SetImage(imagepath);
                            }
                        }
                    }
                };
                break;
            case 'rank':
                fn = oPlayer => {
                    let newStatValue = MockAdapter.GetPlayerXpLevel(oPlayer.m_xuid);
                    if (oPlayer.m_oStats[stat] !== newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPanel = oPlayer.m_oElStats[stat];
                        if (!elPanel || !elPanel.IsValid())
                            return;
                        let elRankImage = elPanel.FindChildTraverse('image');
                        if (!elRankImage || !elRankImage.IsValid())
                            return;
                        let imagepath = '';
                        if (newStatValue > 0) {
                            imagepath = 'file://{images}/icons/xp/level' + newStatValue + '.png';
                        }
                        else {
                            imagepath = '';
                        }
                        elRankImage.SetImage(imagepath);
                    }
                };
                break;
            case 'ggleader':
                fn = oPlayer => {
                    let isGGLeader = MockAdapter.GetTeamGungameLeaderXuid(oPlayer.GetStatText('teamname')) == oPlayer.m_xuid ? 1 : 0;
                    _GenericUpdateStat(oPlayer, stat, () => { return isGGLeader; });
                };
                break;
            case 'gglevel':
                fn = oPlayer => {
                    _GenericUpdateStat(oPlayer, stat, MockAdapter.GetPlayerGungameLevel);
                };
                break;
            default:
                return;
        }
        _m_oUpdateStatFns[stat] = fn;
    }
    function _GetPlayerRowForGameMode() {
        let mode = MockAdapter.GetGameModeInternalName(false);
        let skirmish = MockAdapter.GetGameModeInternalName(true);
        if (GameStateAPI.IsQueuedMatchmakingMode_Team()) {
            return 'snippet_scoreboard-classic__row--teammatchmaking';
        }
        switch (mode) {
            case 'scrimcomp2v2':
                return 'snippet_scoreboard-classic__row--wingman';
            case 'competitive':
                return 'snippet_scoreboard-classic__row--comp';
            case 'gungameprogressive':
                return 'snippet_scoreboard__row--armsrace';
            case 'training':
                return 'snippet_scoreboard__row--training';
            case 'deathmatch':
                return 'snippet_scoreboard__row--deathmatch';
            case 'gungametrbomb':
                return 'snippet_scoreboard__row--demolition';
            case 'coopmission':
            case 'cooperative':
                return 'snippet_scoreboard__row--cooperative';
            case 'casual':
                if (skirmish == 'flyingscoutsman')
                    return 'snippet_scoreboard__row--demolition';
                else
                    return 'snippet_scoreboard-classic__row--casual';
            default:
                return 'snippet_scoreboard-classic__row--casual';
        }
    }
    function _HighlightSortStatLabel(stat) {
        _m_cP.FindChildrenWithClassTraverse('sb-row__cell').forEach(function (el) {
            if (el && el.IsValid()) {
                if (el.BHasClass('sb-row__cell--' + stat)) {
                    el.AddClass('sortstat');
                }
                else {
                    el.RemoveClass('sortstat');
                }
            }
        });
    }
    function _CreateLabelForStat(stat, set, isHidden) {
        let elLabelRow = $('#id-sb-players-table__labels-row');
        if (!elLabelRow || !elLabelRow.IsValid())
            return;
        let elLabelRowOrSet = elLabelRow;
        if (set !== '') {
            let labelSetContainerId = 'id-sb-row__set-container';
            let elLabelSetContainer = $('#' + labelSetContainerId);
            if (!elLabelSetContainer || !elLabelSetContainer.IsValid()) {
                elLabelSetContainer = $.CreatePanel('Panel', elLabelRow, labelSetContainerId);
                elLabelSetContainer.BLoadLayoutSnippet('snippet_sb-label-set-container');
                if ($('#id-sb-row__set-container')) {
                    $('#id-sb-meta__cycle').RemoveClass('hidden');
                }
            }
            let elSetLabels = elLabelSetContainer.FindChildTraverse('id-sb-row__sets');
            let LabelSetId = 'id-sb-labels-set-' + set;
            let elLabelSet = elSetLabels.FindChildTraverse(LabelSetId);
            if (!elLabelSet || !elLabelSet.IsValid()) {
                _m_dataSetGetCount++;
                elLabelSet = $.CreatePanel('Panel', elSetLabels, LabelSetId);
                elLabelSet.AddClass('sb-row__set');
                elLabelSet.AddClass('no-hover');
            }
            elLabelRowOrSet = elLabelSet;
            if (set != _m_dataSetCurrent.toString()) {
                elLabelSet.AddClass('hidden');
            }
        }
        let elStatPanel = elLabelRowOrSet.FindChildInLayoutFile('id-sb-' + stat);
        if (!elStatPanel || !elStatPanel.IsValid()) {
            elStatPanel = $.CreatePanel('Button', elLabelRowOrSet, 'id-sb-' + stat);
            elStatPanel.AddClass('sb-row__cell');
            elStatPanel.AddClass('sb-row__cell--' + stat);
            elStatPanel.AddClass('sb-row__cell--label');
            let elStatLabel;
            if (stat === 'ping') {
                elStatLabel = $.CreatePanel('Image', elStatPanel, 'label-' + elStatPanel.id);
                elStatLabel.SetImage('file://{images}/icons/ui/ping_4.svg');
            }
            else {
                elStatLabel = $.CreatePanel('Label', elStatPanel, 'label-' + elStatPanel.id);
                if (isHidden == '1') {
                    elStatLabel.text = '';
                }
                else {
                    elStatLabel.text = $.Localize('#Scoreboard_' + stat);
                }
            }
            let toolTipString = $.Localize('#Scoreboard_' + stat + '_tooltip');
            if (toolTipString !== '') {
                elStatLabel.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elStatLabel.id, toolTipString));
                elStatLabel.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
            }
            let _SetNewSortStat = function (stat) {
                let newSortOrder = {};
                let modeDefaultSortOrder = _GetSortOrderForMode(MockAdapter.GetGameModeInternalName(false));
                if (stat in modeDefaultSortOrder)
                    newSortOrder[stat] = modeDefaultSortOrder[stat];
                else
                    return;
                _HighlightSortStatLabel(stat);
                for (let s in modeDefaultSortOrder) {
                    if (s == stat)
                        continue;
                    newSortOrder[s] = modeDefaultSortOrder[s];
                }
                _m_sortOrder = newSortOrder;
                for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                    _SortPlayer(i);
                }
            };
            elStatPanel.SetPanelEvent('onactivate', _SetNewSortStat.bind(undefined, stat));
        }
    }
    function _GetCustomStatTextValue(stat, xuid) {
        let szCustomLabel = null;
        if (stat === 'ping') {
            if (MockAdapter.GetPlayerStatus(xuid) == 15) {
                szCustomLabel = '#SFUI_scoreboard_lbl_dc';
            }
            else if (MockAdapter.IsFakePlayer(xuid)) {
                szCustomLabel = '#SFUI_scoreboard_lbl_bot';
            }
            else if (IsTeamASpecTeam(MockAdapter.GetPlayerTeamName(xuid))) {
                szCustomLabel = '#SFUI_scoreboard_lbl_spec';
            }
        }
        return szCustomLabel;
    }
    function _NewPlayerPanel(oPlayer) {
        if (!oPlayer.m_elTeam || !oPlayer.m_elTeam.IsValid())
            return;
        oPlayer.m_elPlayer = $.CreatePanel('Panel', oPlayer.m_elTeam, 'player-' + oPlayer.m_xuid);
        oPlayer.m_elPlayer.m_xuid = oPlayer.m_xuid;
        _Helper_LoadSnippet(oPlayer.m_elPlayer, _GetPlayerRowForGameMode());
        let idx = 0;
        function _InitStatCell(elStatCell, oPlayer) {
            if (!elStatCell || !elStatCell.IsValid())
                return;
            let stat = elStatCell.GetAttributeString('data-stat', '');
            let set = elStatCell.GetAttributeString('data-set', '');
            let isHidden = elStatCell.GetAttributeString('data-hidden', '');
            let children = elStatCell.Children();
            for (let i = 0; i < children.length; i++) {
                _InitStatCell(children[i], oPlayer);
            }
            if (stat === '') {
                return;
            }
            oPlayer.m_oElStats[stat] = elStatCell;
            elStatCell.AddClass('sb-row__cell');
            elStatCell.AddClass('sb-row__cell--' + stat);
            if (set !== '') {
                let SetContainerId = 'id-sb-row__set-container';
                let elSetContainer = oPlayer.m_elPlayer.FindChildTraverse(SetContainerId);
                if (!elSetContainer || !elSetContainer.IsValid()) {
                    elSetContainer = $.CreatePanel('Panel', oPlayer.m_elPlayer, SetContainerId);
                    oPlayer.m_elPlayer.MoveChildBefore(elSetContainer, elStatCell);
                }
                let setId = 'id-sb-set-' + set;
                let elSet = elSetContainer.FindChildTraverse(setId);
                if (!elSet || !elSet.IsValid) {
                    elSet = $.CreatePanel('Panel', elSetContainer, setId);
                    elSet.AddClass('sb-row__set');
                    elSet.AddClass('no-hover');
                    idx = 0;
                }
                elStatCell.SetParent(elSet);
                if (set != _m_dataSetCurrent.toString()) {
                    elSet.AddClass('hidden');
                }
            }
            if (idx++ % 2)
                elStatCell.AddClass('sb-row__cell--dark');
            if (!isHidden) {
                _CreateStatUpdateFn(stat);
            }
        }
        _CreateStatUpdateFn('teamname');
        _CreateStatUpdateFn('musickit');
        _CreateStatUpdateFn('status');
        _CreateStatUpdateFn('skillgroup');
        _CreateStatUpdateFn('leader');
        _CreateStatUpdateFn('teacher');
        _CreateStatUpdateFn('friendly');
        let elStatCells = oPlayer.m_elPlayer.Children();
        let cellCount = elStatCells.length;
        for (let i = 0; i < cellCount; i++) {
            _InitStatCell(elStatCells[i], oPlayer);
        }
        oPlayer.m_oStats = {};
        oPlayer.m_oStats['idx'] = GameStateAPI.GetPlayerSlot(oPlayer.m_xuid);
        oPlayer.m_elPlayer.SetPanelEvent('onmouseover', function () {
            _m_arrSortingPausedRefGetCounter++;
        });
        oPlayer.m_elPlayer.SetPanelEvent('onmouseout', function () {
            _m_arrSortingPausedRefGetCounter--;
        });
        if (MockAdapter.IsXuidValid(oPlayer.m_xuid)) {
            oPlayer.m_elPlayer.SetPanelEvent('onactivate', function () {
                _m_arrSortingPausedRefGetCounter++;
                let elPlayerCardContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + oPlayer.m_xuid, _OnPlayerCardDismiss.bind(undefined));
                elPlayerCardContextMenu.AddClass('ContextMenu_NoArrow');
                if (!_m_hDenyInputToGame) {
                    _m_hDenyInputToGame = UiToolkitAPI.AddDenyInputFlagsToGame(elPlayerCardContextMenu, 'ScoreboardPlayercard', 'CaptureMouse');
                }
            });
        }
        return oPlayer.m_elPlayer;
    }
    function _OnPlayerCardDismiss() {
        _m_arrSortingPausedRefGetCounter--;
        if (_m_hDenyInputToGame) {
            UiToolkitAPI.ReleaseDenyInputFlagsToGame(_m_hDenyInputToGame);
            _m_hDenyInputToGame = null;
        }
    }
    function _UpdateMatchInfo() {
        if (!_m_bInit)
            return;
        _m_cP.SetDialogVariable('server_name', _m_haveViewers ? '' : MockAdapter.GetServerName());
        _m_cP.SetDialogVariable('map_name', MockAdapter.GetMapName());
        _m_cP.SetDialogVariable('gamemode_name', MockAdapter.GetGameModeName(true));
        _m_cP.SetDialogVariable('tournament_stage', MockAdapter.GetTournamentEventStage());
        const elMapLabel = _m_cP.FindChildTraverse('id-sb-meta__labels__mode-map');
        if (elMapLabel && elMapLabel.IsValid() && elMapLabel.text == '') {
            if (MatchStatsAPI.IsTournamentMatch()) {
                elMapLabel.text = $.Localize('{s:tournament_stage} | {s:map_name}', _m_cP);
            }
            else {
                let strLocalizeScoreboardTitle = '{s:gamemode_name} | {s:map_name}';
                if ((GameStateAPI.GetGameModeInternalName(true) === 'competitive') &&
                    (GameTypesAPI.GetMapGroupAttribute('mg_' + GameStateAPI.GetMapBSPName(), 'competitivemod') === 'unranked')) {
                    strLocalizeScoreboardTitle = $.Localize('#SFUI_RankType_Modifier_Unranked', _m_cP) + ' | {s:map_name}';
                }
                else if (GameStateAPI.IsQueuedMatchmakingMode_Team()) {
                    let sMapName = '{s:map_name}';
                    if (GameStateAPI.GetMapBSPName() === 'lobby_mapveto')
                        sMapName = $.Localize('#matchdraft_arena_name', _m_cP);
                    strLocalizeScoreboardTitle = $.Localize('#SFUI_GameModeCompetitiveTeams', _m_cP) + ' | ' + sMapName;
                }
                elMapLabel.text = $.Localize(strLocalizeScoreboardTitle, _m_cP);
            }
        }
        if ($('#id-sb-meta__mode__image')) {
            if (GameStateAPI.IsQueuedMatchmakingMode_Team())
                $('#id-sb-meta__mode__image').SetImage('file://{images}/icons/ui/competitive_teams.svg');
            else
                $('#id-sb-meta__mode__image').SetImage(MockAdapter.GetGameModeImagePath());
        }
        if ($('#sb-meta__labels__map'))
            $('#sb-meta__labels__map').SetImage('file://{images}/map_icons/map_icon_' + MockAdapter.GetMapBSPName() + '.svg');
        let elCoopStats = $('#CoopStats');
        if (elCoopStats) {
            let questID = GameStateAPI.GetActiveQuestID();
            if (questID > 0) {
                elCoopStats.AddClass('show-mission-desc');
                MissionsAPI.ApplyQuestDialogVarsToPanelJS(questID, elCoopStats);
                let elLabel = elCoopStats.FindChildInLayoutFile('MissionDescriptionLabel');
                if (elLabel) {
                    let strMissionDescriptionToken = MissionsAPI.GetQuestDefinitionField(questID, 'loc_description');
                    elLabel.text = $.Localize(strMissionDescriptionToken, elCoopStats);
                }
            }
        }
        if (!MockAdapter.IsDemoOrHltv()) {
            const localTeamName = MockAdapter.GetPlayerTeamName(GetLocalPlayerId());
            if (_m_oTeams[localTeamName])
                _m_oTeams[localTeamName].CalculateAllCommends();
        }
        const elMouseBinding = _m_cP.FindChildInLayoutFile('id-sb-mouse-instructions');
        if (elMouseBinding && elMouseBinding.IsValid()) {
            let bind = GameInterfaceAPI.GetSettingString('cl_scoreboard_mouse_enable_binding');
            if (bind.charAt(0) == '+' || bind.charAt(0) == '-')
                bind = bind.substring(1);
            elMouseBinding.SetDialogVariable('scoreboard_mouse_enable_bind', $.Localize(`{s:bind_${bind}}`, elMouseBinding));
            elMouseBinding.text = $.Localize('#Scoreboard_Mouse_Enable_Instruction', elMouseBinding);
        }
        const elFooterWebsite = _m_cP.FindChildInLayoutFile('id-sb-footer-server-website');
        if (elFooterWebsite && elFooterWebsite.IsValid()) {
            const strWebsiteURL = MatchStatsAPI.GetServerWebsiteURL(false);
            if (strWebsiteURL) {
                elFooterWebsite.SetHasClass('hidden', false);
                elFooterWebsite.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip('id-sb-footer-server-website', strWebsiteURL));
                elFooterWebsite.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
            }
            else {
                elFooterWebsite.SetHasClass('hidden', true);
            }
        }
    }
    function _UpdateHLTVViewerNumber(nViewers) {
        _m_cP.SetDialogVariableInt('viewers', nViewers);
        _m_haveViewers = nViewers > 0;
        _m_cP.SetDialogVariable('hltv_viewers', _m_haveViewers ? $.Localize('#Scoreboard_Viewers', _m_cP) : '');
    }
    function _UpdateRound(rnd, oScoreData, jsoTime) {
        if (!_SupportsTimeline(jsoTime))
            return;
        if (!oScoreData)
            return;
        if (!jsoTime)
            return;
        if (!('teamdata' in oScoreData))
            return;
        let elTimeline = _m_cP.FindChildInLayoutFile('id-sb-timeline__segments');
        if (!elTimeline || !elTimeline.IsValid())
            return;
        let elRnd = elTimeline.FindChildTraverse(rnd.toString());
        if (!elRnd || !elRnd.IsValid())
            return;
        let elRndTop = elRnd.FindChildTraverse('id-sb-timeline__segment__round--top');
        let elRndBot = elRnd.FindChildTraverse('id-sb-timeline__segment__round--bot');
        elRndTop.FindChildTraverse('result').SetImage('');
        elRndBot.FindChildTraverse('result').SetImage('');
        elRndTop.SetDialogVariable('sb_clinch', '');
        elRndBot.SetDialogVariable('sb_clinch', '');
        let elTick = elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick');
        if (elTick && elTick.IsValid()) {
            elTick.SetHasClass('hilite', rnd <= jsoTime['rounds_played'] + 1);
        }
        if (rnd > jsoTime['rounds_played']) {
            let bCanClinch = jsoTime['can_clinch'];
            if (bCanClinch) {
                let numToClinch = jsoTime['num_wins_to_clinch'];
                let topClinchRound = jsoTime['rounds_played'] + numToClinch - m_topScore;
                let bThisRoundIsClinchTop = rnd == topClinchRound;
                let botClinchRound = jsoTime['rounds_played'] + numToClinch - m_botScore;
                let bThisRoundIsClinchBot = rnd == botClinchRound;
                let bShowClinchTop = (bThisRoundIsClinchTop && topClinchRound <= botClinchRound);
                let bShowClinchBot = (bThisRoundIsClinchBot && botClinchRound <= topClinchRound);
                let thisRoundIsClinchAndShowIt = false;
                if (bShowClinchTop) {
                    elRndTop.FindChildTraverse('result').SetImage(dictRoundResultImage['win']);
                    thisRoundIsClinchAndShowIt = true;
                }
                if (bShowClinchBot) {
                    elRndBot.FindChildTraverse('result').SetImage(dictRoundResultImage['win']);
                    thisRoundIsClinchAndShowIt = true;
                }
                let roundIsPastClinch = (rnd > topClinchRound || rnd > botClinchRound);
                elRnd.SetHasClass('past-clinch', roundIsPastClinch);
                elRnd.SetHasClass('clinch-round', thisRoundIsClinchAndShowIt);
            }
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick').RemoveClass('sb-team--CT');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label').RemoveClass('sb-team--CT');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick').RemoveClass('sb-team--TERRORIST');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label').RemoveClass('sb-team--TERRORIST');
            let _ClearCasualties = function (elRnd) {
                for (let i = 1; i <= 5; i++) {
                    let img = elRnd.FindChildTraverse('casualty-' + i);
                    if (!img)
                        break;
                    img.AddClass('hidden');
                }
            };
            _ClearCasualties(elRndTop);
            _ClearCasualties(elRndBot);
            return;
        }
        let bFlippedSides = false;
        if (MockAdapter.AreTeamsPlayingSwitchedSides() !== MockAdapter.AreTeamsPlayingSwitchedSidesInRound(rnd)) {
            bFlippedSides = true;
            let elTemp = elRndTop;
            elRndTop = elRndBot;
            elRndBot = elTemp;
        }
        elRndTop.AddClass('sb-team--CT');
        elRndBot.AddClass('sb-team--TERRORIST');
        let idx;
        if (MatchStatsAPI.DoesSupportOvertimeStats()) {
            idx = rnd - jsoTime['first_round_this_period'] + 1;
        }
        else {
            idx = rnd;
        }
        const roundData = oScoreData.rounddata[idx];
        if (typeof roundData !== 'object')
            return;
        let result = roundData['result'].replace(/^(ct_|t_)/, '');
        if (roundData['result'].charAt(0) === 'c') {
            bFlippedSides ? m_botScore++ : m_topScore++;
            elRndTop.FindChildTraverse('result').SetImage(dictRoundResultImage[result]);
            elRndTop.FindChildTraverse('result').AddClass('sb-timeline__segment__round--active');
            elRndBot.FindChildTraverse('result').SetImage('');
            elRndBot.FindChildTraverse('result').RemoveClass('sb-timeline__segment__round--active');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick').AddClass('sb-team--CT');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label').AddClass('sb-team--CT');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick').RemoveClass('sb-team--TERRORIST');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label').RemoveClass('sb-team--TERRORIST');
        }
        else if (roundData['result'].charAt(0) === 't') {
            bFlippedSides ? m_topScore++ : m_botScore++;
            elRndBot.FindChildTraverse('result').SetImage(dictRoundResultImage[result]);
            elRndBot.FindChildTraverse('result').AddClass('sb-timeline__segment__round--active');
            elRndTop.FindChildTraverse('result').SetImage('');
            elRndTop.FindChildTraverse('result').RemoveClass('sb-timeline__segment__round--active');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick').AddClass('sb-team--TERRORIST');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label').AddClass('sb-team--TERRORIST');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick').RemoveClass('sb-team--CT');
            elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label').RemoveClass('sb-team--CT');
        }
        let _UpdateCasualties = function (teamName, elRnd) {
            if (_m_oTeams[teamName]) {
                let livingCount = teamName === 'CT' ? roundData.players_alive_CT : roundData.players_alive_TERRORIST;
                let nPlayers = 5;
                if (MockAdapter.GetGameModeInternalName(false) == 'scrimcomp2v2')
                    nPlayers = 2;
                for (let i = 1; i <= nPlayers; i++) {
                    let img = elRnd.FindChildTraverse('casualty-' + i);
                    if (!img)
                        break;
                    img.RemoveClass('hidden');
                    if (i > livingCount) {
                        img.AddClass('dead-casualty');
                    }
                    else {
                        img.RemoveClass('dead-casualty');
                    }
                }
            }
        };
        _UpdateCasualties('CT', elRndTop);
        _UpdateCasualties('TERRORIST', elRndBot);
    }
    function _ShowSurvivors(hide = false) {
        let elTimeline = _m_cP.FindChildInLayoutFile('id-sb-timeline__segments');
        if (!elTimeline || !elTimeline.IsValid())
            return;
        let arrPanelsToToggleTransparency = [];
        function CollectPanelsToToggleTransparency(el) {
            if (!el || !el.IsValid())
                return;
            if (el.Children())
                el.Children().forEach(CollectPanelsToToggleTransparency);
            if (el.GetAttributeString('data-casualty-mouse-over-toggle-transparency', 'false') == 'true')
                arrPanelsToToggleTransparency.push(el);
        }
        elTimeline.Children().forEach(CollectPanelsToToggleTransparency);
        arrPanelsToToggleTransparency.forEach(el => el.SetHasClass('transparent', hide));
    }
    function _Casualties_OnMouseOver() {
        if (GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0')
            _ShowSurvivors();
        UiToolkitAPI.ShowCustomLayoutTooltipStyled('1', 'id-tooltip-sb-casualties', 'file://{resources}/layout/tooltips/tooltip_scoreboard_casualties.xml', 'Tooltip_NoArrow');
    }
    function _Casualties_OnMouseOut() {
        if (GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0')
            _ShowSurvivors(true);
        UiToolkitAPI.HideCustomLayoutTooltip('id-tooltip-sb-casualties');
    }
    function _RoundLossBonusMoneyForTeam(teamname) {
        let nLossAmount = MockAdapter.GetTeamNextRoundLossBonus(teamname);
        let nMaxLoss = parseInt(GameInterfaceAPI.GetSettingString('mp_consecutive_loss_max'));
        if (nLossAmount > nMaxLoss) {
            nLossAmount = nMaxLoss;
        }
        if (nLossAmount < 0) {
            nLossAmount = 0;
        }
        let nBaseAmount = parseInt(GameInterfaceAPI.GetSettingString('cash_team_loser_bonus'));
        let nConsecutiveBonus = parseInt(GameInterfaceAPI.GetSettingString('cash_team_loser_bonus_consecutive_rounds'));
        let nTotalAmount = nBaseAmount + (nLossAmount * nConsecutiveBonus);
        return nTotalAmount;
    }
    function _RoundLossBonusMoney_OnMouseOver_CT() {
        _m_cP.SetDialogVariable('round_loss_income_team', $.Localize('#counter-terrorists'));
        _m_cP.SetDialogVariableInt('round_loss_income_amount', _RoundLossBonusMoneyForTeam('CT'));
        let sTooltipText = $.Localize('#Scoreboard_lossmoneybonus_tooltip', _m_cP);
        UiToolkitAPI.ShowTextTooltip('id-sb-timeline__round-loss-bonus-money', sTooltipText);
    }
    function _RoundLossBonusMoney_OnMouseOut_CT() {
        UiToolkitAPI.HideTextTooltip();
    }
    function _RoundLossBonusMoney_OnMouseOver_TERRORIST() {
        _m_cP.SetDialogVariable('round_loss_income_team', $.Localize('#terrorists'));
        _m_cP.SetDialogVariableInt('round_loss_income_amount', _RoundLossBonusMoneyForTeam('TERRORIST'));
        let sTooltipText = $.Localize('#Scoreboard_lossmoneybonus_tooltip', _m_cP);
        UiToolkitAPI.ShowTextTooltip('id-sb-timeline__round-loss-bonus-money', sTooltipText);
    }
    function _RoundLossBonusMoney_OnMouseOut_TERRORIST() {
        UiToolkitAPI.HideTextTooltip();
    }
    function _UpdateTeamInfo(teamName) {
        let team = _m_oTeams[teamName];
        if (!team) {
            team = _m_oTeams[teamName] = new Team_t(teamName);
        }
        _m_cP.SetDialogVariable('sb_team_name--' + teamName, MockAdapter.GetTeamClanName(teamName));
        const teamLogoImagePath = MockAdapter.GetTeamLogoImagePath(teamName);
        if (teamLogoImagePath != '') {
            for (const elTeamLogoBackground of _m_cP.FindChildrenWithClassTraverse('sb-team-logo-background--' + teamName)) {
                elTeamLogoBackground.style.backgroundImage = `url("file://{images}${teamLogoImagePath}")`;
                elTeamLogoBackground.AddClass('sb-team-logo-bg');
            }
        }
        _m_cP.SetDialogVariableInt(teamName + '_alive', MockAdapter.GetTeamLivingPlayerCount(teamName));
        _m_cP.SetDialogVariableInt(teamName + '_total', MockAdapter.GetTeamTotalPlayerCount(teamName));
    }
    function _UpdateTeams() {
        let oScoreData = MockAdapter.GetScoreDataJSO();
        for (let team in _m_oTeams) {
            _UpdateTeamInfo(team);
            if (!oScoreData || !('teamdata' in oScoreData) || !(team in oScoreData['teamdata']))
                continue;
            const teamData = oScoreData.teamdata[team];
            _m_cP.SetDialogVariableInt('sb_team_score--' + team, teamData['score']);
            if ('score_1h' in teamData) {
                _m_cP.SetDialogVariableInt('sb_team_score_2--' + team, teamData['score_1h']);
            }
            if ('score_2h' in teamData) {
                _m_cP.SetDialogVariableInt('sb_team_score_3--' + team, teamData['score_2h']);
            }
            if ('score_ot' in teamData) {
                _m_cP.SetDialogVariableInt('sb_team_score_ot--' + team, teamData['score_ot']);
            }
            let elOTScore = _m_cP.FindChildTraverse('id-sb-timeline__score_ot');
            if (elOTScore && elOTScore.IsValid()) {
                elOTScore.SetHasClass('hidden', !('score_ot' in teamData));
                elOTScore.SetHasClass('fade', !('score_ot' in teamData));
            }
        }
    }
    function _InitClassicTeams() {
        _UpdateTeamInfo('TERRORIST');
        _UpdateTeamInfo('CT');
    }
    let m_topScore = 0;
    let m_botScore = 0;
    function _UpdateAllRounds() {
        let jsoTime = MockAdapter.GetTimeDataJSO();
        let oScoreData = MockAdapter.GetScoreDataJSO();
        if (!jsoTime)
            return;
        if (!oScoreData)
            return;
        if (!_SupportsTimeline(jsoTime))
            return;
        let lastRound;
        if (MatchStatsAPI.DoesSupportOvertimeStats()) {
            lastRound = jsoTime['last_round_this_period'];
        }
        else {
            lastRound = jsoTime['maxrounds'];
        }
        m_topScore = 0;
        m_botScore = 0;
        if (jsoTime['overtime'] > 0) {
            m_topScore = (jsoTime['maxrounds'] + (jsoTime['overtime'] - 1) * jsoTime['maxrounds_overtime']) / 2;
            m_botScore = (jsoTime['maxrounds'] + (jsoTime['overtime'] - 1) * jsoTime['maxrounds_overtime']) / 2;
        }
        for (let rnd = 1; rnd <= lastRound; rnd++) {
            _UpdateRound(rnd, oScoreData, jsoTime);
        }
    }
    function _UpdateScore_Classic() {
        if (Object.keys(_m_oTeams).length === 0) {
            _InitClassicTeams();
        }
        _UpdateTeams();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        if (!jsoTime)
            return;
        let currentRound = jsoTime['rounds_played'] + 1;
        _m_cP.SetDialogVariable('match_phase', $.Localize('#gamephase_' + jsoTime['gamephase']));
        _m_cP.SetDialogVariable('rounds_remaining', jsoTime['rounds_remaining'].toString());
        _m_cP.SetDialogVariableInt('scoreboard_ot', jsoTime['overtime']);
        _m_cP.SetHasClass('sb-tournament-match', MatchStatsAPI.IsTournamentMatch());
        let bResetTimeline = false;
        if (_m_maxRounds != jsoTime['maxrounds_this_period']) {
            bResetTimeline = true;
            _m_maxRounds = jsoTime['maxrounds_this_period'];
        }
        if (_m_areTeamsSwapped !== MockAdapter.AreTeamsPlayingSwitchedSides()) {
            bResetTimeline = true;
            _m_areTeamsSwapped = MockAdapter.AreTeamsPlayingSwitchedSides();
        }
        if (!_SupportsTimeline(jsoTime)) {
            bResetTimeline = true;
        }
        if (_m_overtime != jsoTime['overtime']) {
            _m_overtime = jsoTime['overtime'];
            bResetTimeline = true;
        }
        if (bResetTimeline || !(currentRound in _m_RoundUpdated)) {
            if (bResetTimeline) {
                _ResetTimeline();
            }
            _UpdateAllRounds();
            _m_RoundUpdated[currentRound] = true;
        }
        else {
            let oScoreData = MockAdapter.GetScoreDataJSO();
            if (oScoreData) {
                _UpdateRound(currentRound - 1, oScoreData, jsoTime);
            }
        }
        _UpdateRoundLossBonus();
    }
    function _InsertTimelineDivider() {
        let elTimeline = _m_cP.FindChildInLayoutFile('id-sb-timeline__segments');
        if (!elTimeline || !elTimeline.IsValid())
            return;
        let elDivider = $.CreatePanel('Panel', elTimeline, 'id-sb-timeline__divider');
        elDivider.AddClass('sb-timeline__divider');
    }
    function _InitTimelineSegment(startRound, endRound, phase) {
        let elTimeline = _m_cP.FindChildInLayoutFile('id-sb-timeline__segments');
        if (!elTimeline || !elTimeline.IsValid())
            return;
        elTimeline.AddClass('sb-team-tint');
        let id = 'id-sb-timeline__segment--' + phase;
        let elSegment = elTimeline.FindChildTraverse(id);
        if (!elSegment || !elSegment.IsValid()) {
            elSegment = $.CreatePanel('Panel', elTimeline, id);
            elSegment.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment');
        }
        let elRoundContainer = elSegment.FindChildTraverse('id-sb-timeline__round-container');
        if (elRoundContainer && elRoundContainer.IsValid()) {
            for (let rnd = startRound; rnd <= endRound; rnd++) {
                let elRnd = elSegment.FindChildTraverse(rnd.toString());
                if (!elRnd || !elRnd.IsValid()) {
                    elRnd = $.CreatePanel('Panel', elRoundContainer, rnd.toString());
                    elRnd.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment__round');
                    let elTop = elRnd.FindChildTraverse('id-sb-timeline__segment__round--top');
                    elTop.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment__round__data');
                    let elBot = elRnd.FindChildTraverse('id-sb-timeline__segment__round--bot');
                    elBot.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment__round__data');
                    if (rnd % 5 == 0) {
                        elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label').text = rnd.toString();
                    }
                }
            }
        }
        if (MockAdapter.AreTeamsPlayingSwitchedSides() !== MockAdapter.AreTeamsPlayingSwitchedSidesInRound(endRound)) {
            let elCTScore = elSegment.FindChildTraverse('id-sb-timeline__segment__score__ct');
            let elTScore = elSegment.FindChildTraverse('id-sb-timeline__segment__score__t');
            if (elCTScore && elCTScore.IsValid()) {
                elCTScore.RemoveClass('sb-color--CT');
                elCTScore.AddClass('sb-color--TERRORIST');
            }
            if (elTScore && elTScore.IsValid()) {
                elTScore.RemoveClass('sb-color--TERRORIST');
                elTScore.AddClass('sb-color--CT');
            }
        }
    }
    function _SupportsTimeline(jsoTime) {
        if (jsoTime == undefined)
            jsoTime = MockAdapter.GetTimeDataJSO();
        let roundCountToEvaluate;
        if (MatchStatsAPI.DoesSupportOvertimeStats()) {
            roundCountToEvaluate = jsoTime['maxrounds_this_period'];
        }
        else {
            roundCountToEvaluate = jsoTime['maxrounds'];
        }
        return (roundCountToEvaluate <= 30);
    }
    function _UpdateRoundLossBonus() {
        let elRoundLossBonusMoney = _m_cP.FindChildInLayoutFile('id-sb-timeline__round-loss-bonus-money');
        if (elRoundLossBonusMoney && elRoundLossBonusMoney.IsValid()) {
            elRoundLossBonusMoney.AddClass('hidden');
            if (parseInt(GameInterfaceAPI.GetSettingString('mp_consecutive_loss_max')) > 0 &&
                parseInt(GameInterfaceAPI.GetSettingString('cash_team_loser_bonus_consecutive_rounds')) > 0) {
                let nLossT = MockAdapter.GetTeamNextRoundLossBonus('TERRORIST');
                let nLossCT = MockAdapter.GetTeamNextRoundLossBonus('CT');
                if (nLossT >= 0 && nLossCT >= 0) {
                    elRoundLossBonusMoney.RemoveClass('hidden');
                    for (let nClassIdx = 1; nClassIdx <= 4; ++nClassIdx) {
                        elRoundLossBonusMoney.SetHasClass('sb-timeline__round-loss-bonus-money__TERRORIST' + nClassIdx, nLossT >= nClassIdx);
                    }
                    for (let nClassIdx = 1; nClassIdx <= 4; ++nClassIdx) {
                        elRoundLossBonusMoney.SetHasClass('sb-timeline__round-loss-bonus-money__CT' + nClassIdx, nLossCT >= nClassIdx);
                    }
                }
            }
        }
    }
    function _ResetTimeline() {
        _UpdateRoundLossBonus();
        let elTimeline = _m_cP.FindChildInLayoutFile('id-sb-timeline__segments');
        if (!elTimeline || !elTimeline.IsValid())
            return;
        elTimeline.RemoveAndDeleteChildren();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        if (!jsoTime)
            return;
        if (!_SupportsTimeline(jsoTime))
            return;
        let firstRound;
        let lastRound;
        let midRound;
        if (MatchStatsAPI.DoesSupportOvertimeStats()) {
            firstRound = jsoTime['first_round_this_period'];
            lastRound = jsoTime['last_round_this_period'];
            let elLabel = _m_cP.FindChildTraverse('id-sb-timeline__round-label');
            if (elLabel && elLabel.IsValid()) {
                elLabel.SetHasClass('hidden', jsoTime['overtime'] == 0);
            }
        }
        else {
            firstRound = 1;
            lastRound = jsoTime['maxrounds'];
        }
        midRound = firstRound + Math.ceil((lastRound - firstRound) / 2) - 1;
        if (MockAdapter.HasHalfTime()) {
            _InitTimelineSegment(firstRound, midRound, 'first-half');
            _InsertTimelineDivider();
            _InitTimelineSegment(midRound + 1, lastRound, 'second-half');
        }
        else {
            _InitTimelineSegment(firstRound, lastRound, 'no-halves');
        }
        _UpdateAllRounds();
        if (GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '1')
            _ShowSurvivors();
    }
    function _UnborrowMusicKit() {
        GameInterfaceAPI.SetSettingString('cl_borrow_music_from_player_index', '0');
        let oLocalPlayer = _m_oPlayers.GetPlayerByXuid(GetLocalPlayerId());
        _m_oUpdateStatFns['musickit'](oLocalPlayer, true);
    }
    function UpdateCasterButtons() {
        for (let i = 0; i < 4; i++) {
            let buttonName = '#spec-button' + (i + 1);
            let bActive = true;
            switch (i) {
                default:
                case 0:
                    bActive = !!GetCasterIsCameraman();
                    break;
                case 1:
                    bActive = !!GetCasterIsHeard();
                    break;
                case 2:
                    bActive = !!GetCasterControlsXray();
                    break;
                case 3:
                    bActive = !!GetCasterControlsUI();
                    break;
            }
            ToggleCasterButtonActive(buttonName, bActive);
        }
    }
    function ToggleCasterButtonActive(buttonName, bActive) {
        let button = $(buttonName);
        if (button == null)
            return;
        if (bActive == false && button.BHasClass('sb-spectator-control-button-notactive') == false) {
            button.AddClass('sb-spectator-control-button-notactive');
        }
        else if (bActive == true && button.BHasClass('sb-spectator-control-button-notactive') == true) {
            button.RemoveClass('sb-spectator-control-button-notactive');
        }
    }
    function _ToggleSetCasterIsCameraman() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterIsCameraman()) {
            GameStateAPI.SetCasterIsCameraman(0);
        }
        else {
            GameStateAPI.SetCasterIsCameraman(nCameraMan);
        }
        UpdateCasterButtons();
    }
    function _ToggleSetCasterIsHeard() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterIsHeard()) {
            GameStateAPI.SetCasterIsHeard(0);
        }
        else {
            GameStateAPI.SetCasterIsHeard(nCameraMan);
        }
        UpdateCasterButtons();
    }
    function _ToggleSetCasterControlsXray() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterControlsXray()) {
            GameStateAPI.SetCasterControlsXray(0);
            ToggleCasterButtonActive('#spec-button3', false);
        }
        else {
            GameStateAPI.SetCasterControlsXray(nCameraMan);
            ToggleCasterButtonActive('#spec-button3', true);
        }
    }
    function _ToggleSetCasterControlsUI() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterControlsUI()) {
            GameStateAPI.SetCasterControlsUI(0);
        }
        else {
            GameStateAPI.SetCasterControlsUI(nCameraMan);
        }
        UpdateCasterButtons();
    }
    function _CycleStats() {
        if (_m_dataSetGetCount === 0)
            return;
        {
            _m_dataSetCurrent++;
            if (_m_dataSetCurrent >= _m_dataSetGetCount)
                _m_dataSetCurrent = 0;
        }
        let elLabelSets = $('#id-sb-row__sets');
        for (let i = 0; i < elLabelSets.Children().length; i++) {
            let elChild = elLabelSets.Children()[i];
            if (elChild.id == 'id-sb-labels-set-' + _m_dataSetCurrent) {
                elChild.RemoveClass('hidden');
            }
            else {
                elChild.AddClass('hidden');
            }
        }
        for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
            let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
            if (elPlayer && elPlayer.IsValid()) {
                let elSetContainer = elPlayer.FindChildTraverse('id-sb-row__set-container');
                if (elSetContainer && elSetContainer.IsValid()) {
                    for (let j = 0; j < elSetContainer.Children().length; j++) {
                        let elChild = elSetContainer.Children()[j];
                        if (elChild.id == 'id-sb-set-' + _m_dataSetCurrent) {
                            elChild.RemoveClass('hidden');
                        }
                        else {
                            elChild.AddClass('hidden');
                        }
                    }
                }
            }
        }
        StoreAPI.RecordUIEvent('ScoreboardMoreStatsToggle');
    }
    function _MuteVoice() {
        GameInterfaceAPI.ConsoleCommand('voice_modenable_toggle');
        $.Schedule(0.1, _UpdateMuteVoiceState);
    }
    function _UpdateMuteVoiceState() {
        StoreAPI.RecordUIEvent('ScoreboardMuteVoiceToggle');
        let muteState = GameInterfaceAPI.GetSettingString('voice_modenable') === '1';
        let elMuteImage = _m_cP.FindChildInLayoutFile('id-sb-meta__mutevoice__image');
        if (!elMuteImage)
            return;
        if (muteState) {
            elMuteImage.SetImage('file://{images}/icons/ui/unmuted.svg');
        }
        else {
            elMuteImage.SetImage('file://{images}/icons/ui/muted.svg');
        }
    }
    function _BlockUgc() {
        StoreAPI.RecordUIEvent('ScoreboardBlockUgcToggle');
        let ugcBlockState = GameInterfaceAPI.GetSettingString('cl_hide_avatar_images') !== '0' ||
            GameInterfaceAPI.GetSettingString('cl_sanitize_player_names') !== '0';
        if (ugcBlockState) {
            GameInterfaceAPI.SetSettingString('cl_sanitize_player_names', '0');
            GameInterfaceAPI.SetSettingString('cl_hide_avatar_images', '0');
        }
        else {
            GameInterfaceAPI.SetSettingString('cl_sanitize_player_names', '1');
            GameInterfaceAPI.SetSettingString('cl_hide_avatar_images', '2');
        }
        $.Schedule(0.1, _UpdateUgcState);
    }
    function _UpdateUgcState() {
        let ugcBlockState = GameInterfaceAPI.GetSettingString('cl_hide_avatar_images') !== '0' ||
            GameInterfaceAPI.GetSettingString('cl_sanitize_player_names') !== '0';
        let elBlockUgcImage = _m_cP.FindChildInLayoutFile('id-sb-meta__blockugc__image');
        if (!elBlockUgcImage)
            return;
        if (ugcBlockState) {
            elBlockUgcImage.SetImage('file://{images}/icons/ui/votekick.svg');
        }
        else {
            elBlockUgcImage.SetImage('file://{images}/icons/ui/player.svg');
        }
    }
    function _CreateLabelsForRow(el) {
        if (!el || !el.IsValid())
            return;
        for (let i = 0; i < el.Children().length; i++) {
            _CreateLabelsForRow(el.Children()[i]);
        }
        let stat = el.GetAttributeString('data-stat', '');
        let set = el.GetAttributeString('data-set', '');
        let isHidden = el.GetAttributeString('data-hidden', '');
        if (stat != '')
            _CreateLabelForStat(stat, set, isHidden);
    }
    function _GetSortOrderForMode(mode) {
        if (GameStateAPI.IsQueuedMatchmakingMode_Team())
            return sortOrder_tmm;
        switch (mode) {
            case 'gungameprogressive':
                return sortOrder_gg;
            case 'deathmatch':
                if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                    return sortOrder_default;
                }
                return sortOrder_dm;
            case 'competitive':
                return sortOrder_tmm;
            default:
                return sortOrder_default;
        }
    }
    function _Initialize() {
        _Reset();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        if (!jsoTime)
            return;
        let scoreboardTemplate;
        let mode = MockAdapter.GetGameModeInternalName(false);
        let skirmish = MockAdapter.GetGameModeInternalName(true);
        if (mode == 'deathmatch') {
            if (GameInterfaceAPI.GetSettingString('mp_teammates_are_enemies') !== '0') {
                skirmish = 'ffadm';
            }
            else if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                skirmish = 'teamdm';
            }
        }
        if (mode === 'survival') {
            return;
        }
        switch (mode) {
            case 'competitive':
            case 'scrimcomp2v2':
                scoreboardTemplate = 'snippet_scoreboard-classic--with-timeline--half-times';
                break;
            case 'deathmatch':
                if (skirmish == 'teamdm') {
                    scoreboardTemplate = 'snippet_scoreboard-classic--no-timeline';
                }
                else {
                    scoreboardTemplate = 'snippet_scoreboard--no-teams';
                }
                break;
            case 'training':
            case 'gungameprogressive':
                scoreboardTemplate = 'snippet_scoreboard--no-teams';
                break;
            case 'cooperative':
                scoreboardTemplate = 'snippet_scoreboard--cooperative';
                break;
            case 'coopmission':
                scoreboardTemplate = 'snippet_scoreboard--coopmission';
                break;
            case 'casual':
                if (skirmish == 'flyingscoutsman') {
                    scoreboardTemplate = 'snippet_scoreboard-classic--with-timeline--no-half-times';
                }
                else {
                    scoreboardTemplate = 'snippet_scoreboard-classic--no-timeline';
                }
                break;
            default:
                scoreboardTemplate = 'snippet_scoreboard-classic--no-timeline';
                break;
        }
        _Helper_LoadSnippet(_m_cP, scoreboardTemplate);
        if (MockAdapter.IsDemoOrHltv())
            _m_cP.AddClass('IsDemoOrHltv');
        if (MatchStatsAPI.IsTournamentMatch())
            _m_cP.AddClass('IsTournamentMatch');
        _m_sortOrder = _GetSortOrderForMode(mode);
        let temp = $.CreatePanel('Panel', _m_cP, 'temp');
        _Helper_LoadSnippet(temp, _GetPlayerRowForGameMode());
        temp.visible = false;
        _CreateLabelsForRow(temp);
        temp.DeleteAsync(.0);
        _ResetTimeline();
        _m_bInit = true;
        _m_cP.SetDialogVariable('server_name', '');
        _UpdateHLTVViewerNumber(0);
        _UpdateMatchInfo();
    }
    function _RankRevealAll() {
        for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
            let oPlayer = _m_oPlayers.GetPlayerByIndex(i);
            if (typeof (_m_oUpdateStatFns['skillgroup']) === 'function')
                _m_oUpdateStatFns['skillgroup'](oPlayer, true);
        }
    }
    function _UpdateScore() {
        switch (MockAdapter.GetGameModeInternalName(false)) {
            case 'competitive':
                _UpdateScore_Classic();
                break;
            case 'deathmatch':
                if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                    _UpdateScore_Classic();
                }
                break;
            case 'gungameprogressive':
                break;
            default:
            case 'casual':
                _UpdateScore_Classic();
                break;
        }
    }
    function _UpdateJob() {
        _UpdateMatchInfo();
        _UpdateScore();
        _UpdateNextPlayer();
    }
    function _UpdateEverything() {
        if (!_m_bInit) {
            _Initialize();
        }
        _UpdateMuteVoiceState();
        _UpdateUgcState();
        _UpdateMatchInfo();
        _UpdateScore();
        _UpdateAllPlayers_delayed(true);
        _UpdateSpectatorButtons();
        _UpdateLeaderboard();
    }
    function _OnMouseActive() {
        let elButtonPanel = _m_cP.FindChildTraverse('id-sb-meta__button-panel');
        if (elButtonPanel && elButtonPanel.IsValid())
            elButtonPanel.RemoveClass('hidden');
        let elServerViewers = _m_cP.FindChildTraverse('id-sb-meta__labels__server-viewers');
        if (elServerViewers && elServerViewers.IsValid())
            elServerViewers.AddClass('hidden');
        let elMouseInstructions = _m_cP.FindChildTraverse('id-sb-mouse-instructions');
        if (elMouseInstructions && elMouseInstructions.IsValid())
            elMouseInstructions.AddClass('hidden');
    }
    function _OnMouseInactive() {
        let elButtonPanel = _m_cP.FindChildTraverse('id-sb-meta__button-panel');
        if (elButtonPanel && elButtonPanel.IsValid())
            elButtonPanel.AddClass('hidden');
        let elServerViewers = _m_cP.FindChildTraverse('id-sb-meta__labels__server-viewers');
        if (elServerViewers && elServerViewers.IsValid())
            elServerViewers.RemoveClass('hidden');
        let elMouseInstructions = _m_cP.FindChildTraverse('id-sb-mouse-instructions');
        if (elMouseInstructions && elMouseInstructions.IsValid())
            elMouseInstructions.RemoveClass('hidden');
    }
    function _CloseScoreboard() {
        if (_m_updatePlayerHandler) {
            $.UnregisterForUnhandledEvent('Scoreboard_UpdatePlayerByPlayerSlot', _m_updatePlayerHandler);
            _m_updatePlayerHandler = null;
        }
        _m_cP.FindChildrenWithClassTraverse('timer').forEach(el => el.active = false);
        $.DispatchEvent('DismissAllContextMenus');
        _OnMouseInactive();
    }
    function _OpenScoreboard() {
        _UpdateEverything();
        _m_cP.FindChildrenWithClassTraverse('timer').forEach(el => el.active = true);
        _ShowSurvivors((GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0'));
        if (!_m_updatePlayerHandler) {
            _m_updatePlayerHandler = $.RegisterForUnhandledEvent('Scoreboard_UpdatePlayerByPlayerSlot', Scoreboard.UpdatePlayerByPlayerSlot);
        }
    }
    function _OnEndOfMatch() {
        _OpenScoreboard();
    }
    function _GetFreeForAllTopThreePlayers() {
        _UpdateEverything();
        if (!$('#Scoreboard'))
            return [undefined, undefined, undefined];
        let elTeam = $('#Scoreboard').FindChildInLayoutFile('players-table-ANY');
        if (elTeam && elTeam.IsValid()) {
            const players = elTeam.Children();
            return [players[0]?.m_xuid || '0', players[1]?.m_xuid || '0', players[2]?.m_xuid || '0'];
        }
        return [undefined, undefined, undefined];
    }
    function _GetFreeForAllPlayerPosition(xuid) {
        _UpdateEverything();
        let elTeam = _m_cP.FindChildInLayoutFile('players-table-ANY');
        if (!elTeam || !elTeam.IsValid())
            return;
        let returnVal = 0;
        for (let i = 0; i < elTeam.Children().length; i++) {
            if (elTeam.Children()[i].m_xuid == xuid)
                returnVal = i + 1;
        }
        $.DispatchEvent('EndOfMatch_GetFreeForAllPlayerPosition_Response', returnVal);
    }
    function _UpdateLeaderboard(strLBname) {
        let mode = MockAdapter.GetGameModeInternalName(false);
        if (mode !== 'cooperative' && mode !== 'coopmission') {
            return;
        }
        let elLeaderboardStats = _m_cP.FindChildInLayoutFile('CoopStats');
        if (!elLeaderboardStats)
            return;
        elLeaderboardStats.RemoveClass('show-mission-stats');
        let hPrevDetails = LeaderboardsAPI.GetLeaderboardDetailsHandleForCoop();
        let activeQuestID = GameStateAPI.GetActiveQuestID();
        if (activeQuestID > 0 && LeaderboardsAPI.GetDetailsQuestID(hPrevDetails) === activeQuestID) {
            UpdateCoopScores(hPrevDetails);
            return;
        }
        if (strLBname === undefined) {
            if (activeQuestID === 0)
                return;
            strLBname = 'official_leaderboard_quest_' + activeQuestID;
        }
        let lbState = LeaderboardsAPI.GetState(strLBname);
        if (lbState === 'none') {
            LeaderboardsAPI.Refresh(strLBname);
        }
        else if (lbState === 'ready') {
            let cacheTimeMinutes = LeaderboardsAPI.HowManyMinutesAgoCached(strLBname);
            if (cacheTimeMinutes > 3) {
                LeaderboardsAPI.Refresh(strLBname);
            }
            else {
                let hDetails = LeaderboardsAPI.GetEntryDetailsHandleByXuid(strLBname, MyPersonaAPI.GetXuid());
                if (hDetails)
                    UpdateCoopScores(hDetails);
            }
        }
    }
    function _OnFinalCoopScore() {
        let hDetailHandle = LeaderboardsAPI.GetLeaderboardDetailsHandleForCoop();
        _m_cP.AddClass('coop-finalscore');
        UpdateCoopScores(hDetailHandle);
    }
    function UpdateCoopScores(hDetailHandle) {
        let elLeaderboardStats = _m_cP.FindChildInLayoutFile('CoopStats');
        if (!elLeaderboardStats)
            return;
        let mode = MockAdapter.GetGameModeInternalName(false);
        if (mode !== 'cooperative' && mode !== 'coopmission') {
            return;
        }
        elLeaderboardStats.AddClass('show-mission-stats');
        let nScoreCount = LeaderboardsAPI.GetDetailsMatchScoreboardStatsCount(hDetailHandle, 'score');
        for (let i = 0; i < nScoreCount; ++i) {
            let strNameToken = LeaderboardsAPI.GetDetailsMatchScoreboardStatNameByIndex(hDetailHandle, 'score', i);
            elLeaderboardStats.SetDialogVariable('statname' + i, $.Localize(strNameToken));
            FormatStatValueDialogVar();
            FormatStatScoreDialogVar();
            function FormatStatValueDialogVar() {
                let stat = LeaderboardsAPI.GetDetailsMatchScoreboardStatValueByIndex(hDetailHandle, 'score', i);
                let statKey = 'statval' + i;
                if (strNameToken === '#SFUI_Scoreboard_Coop_DmgToEnemyRatio') {
                    elLeaderboardStats.SetDialogVariable(statKey, (100 - stat / 100).toFixed(1));
                }
                else if (strNameToken === '#SFUI_Scoreboard_Coop_TeamAccuracy' || strNameToken === '#SFUI_Scoreboard_Coop_Headshots') {
                    elLeaderboardStats.SetDialogVariableInt(statKey, stat / 100);
                }
                else if (strNameToken === '#SFUI_Scoreboard_Coop_TimeLeft') {
                    elLeaderboardStats.SetDialogVariableTime(statKey, stat);
                }
                else {
                    elLeaderboardStats.SetDialogVariableInt(statKey, stat);
                }
            }
            ;
            function FormatStatScoreDialogVar() {
                let score = LeaderboardsAPI.GetDetailsMatchScoreboardStatScoreByIndex(hDetailHandle, 'score', i);
                if (strNameToken === '#SFUI_Scoreboard_Coop_DmgToEnemyRatio')
                    score = 10000 - score;
                elLeaderboardStats.SetDialogVariableInt('statscore' + i, score);
            }
            ;
        }
        let nBonusCount = LeaderboardsAPI.GetDetailsMatchScoreboardStatsCount(hDetailHandle, 'bonus');
        for (let i = 0; i < nBonusCount; ++i) {
            elLeaderboardStats.SetDialogVariable('bonusname' + i, $.Localize(LeaderboardsAPI.GetDetailsMatchScoreboardStatNameByIndex(hDetailHandle, 'bonus', i)));
            elLeaderboardStats.SetDialogVariableInt('bonusval' + i, LeaderboardsAPI.GetDetailsMatchScoreboardStatValueByIndex(hDetailHandle, 'bonus', i));
            elLeaderboardStats.SetDialogVariableInt('bonusscore' + i, LeaderboardsAPI.GetDetailsMatchScoreboardStatScoreByIndex(hDetailHandle, 'bonus', i));
        }
        let nBonus = LeaderboardsAPI.GetDetailsMatchScoreboardStatScoreTotal(hDetailHandle, 'bonus');
        elLeaderboardStats.SetDialogVariableInt('bonus_score', nBonus);
        let nScore = LeaderboardsAPI.GetDetailsMatchScoreboardStatScoreTotal(hDetailHandle, 'score');
        elLeaderboardStats.SetDialogVariableInt('score', nScore);
        let nTotalScore = LeaderboardsAPI.GetDetailsMatchScoreboardStatScoreTotal(hDetailHandle, 'all');
        elLeaderboardStats.SetDialogVariableInt('total_score', nTotalScore);
    }
    function GetCasterIsCameraman() {
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        let bQ = (MockAdapter.IsDemoOrHltv() && nCameraMan != 0 && MockAdapter.IsHLTVAutodirectorOn());
        return bQ;
    }
    function GetCasterIsHeard() {
        if (MockAdapter.IsDemoOrHltv()) {
            return !!parseInt(GameInterfaceAPI.GetSettingString('voice_caster_enable'));
        }
        return false;
    }
    function GetCasterControlsXray() {
        let bXRay = MockAdapter.IsDemoOrHltv() && parseInt(GameInterfaceAPI.GetSettingString('spec_cameraman_xray'));
        return bXRay;
    }
    function GetCasterControlsUI() {
        let bSpecCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_cameraman_ui'));
        let bQ = (MockAdapter.IsDemoOrHltv() && bSpecCameraMan);
        return bQ;
    }
    function _ApplyPlayerCrosshairCode(panel, xuid) {
        UiToolkitAPI.ShowGenericPopupYesNo($.Localize('#tooltip_copycrosshair'), $.Localize('#GameUI_Xhair_Copy_Code_Confirm'), '', function () { let code = GameStateAPI.GetCrosshairCode(xuid); MyPersonaAPI.BApplyCrosshairCode(code); }, function () { });
    }
    return {
        OpenScoreboard: _OpenScoreboard,
        CloseScoreboard: _CloseScoreboard,
        UpdateMatchInfo: _UpdateMatchInfo,
        UpdatePlayerByPlayerSlot: _UpdatePlayerByPlayerSlot_delayed,
        UpdateEverything: _UpdateEverything,
        ResetAndInit: _Initialize,
        Casualties_OnMouseOver: _Casualties_OnMouseOver,
        Casualties_OnMouseOut: _Casualties_OnMouseOut,
        RoundLossBonusMoney_OnMouseOver_CT: _RoundLossBonusMoney_OnMouseOver_CT,
        RoundLossBonusMoney_OnMouseOut_CT: _RoundLossBonusMoney_OnMouseOut_CT,
        RoundLossBonusMoney_OnMouseOver_TERRORIST: _RoundLossBonusMoney_OnMouseOver_TERRORIST,
        RoundLossBonusMoney_OnMouseOut_TERRORIST: _RoundLossBonusMoney_OnMouseOut_TERRORIST,
        UpdateJob: _UpdateJob,
        CycleStats: _CycleStats,
        OnMouseActive: _OnMouseActive,
        OnEndOfMatch: _OnEndOfMatch,
        GetFreeForAllTopThreePlayers: _GetFreeForAllTopThreePlayers,
        GetFreeForAllPlayerPosition: _GetFreeForAllPlayerPosition,
        UnborrowMusicKit: _UnborrowMusicKit,
        UpdateHLTVViewerNumber: _UpdateHLTVViewerNumber,
        ToggleSetCasterIsCameraman: _ToggleSetCasterIsCameraman,
        ToggleSetCasterIsHeard: _ToggleSetCasterIsHeard,
        ToggleSetCasterControlsXray: _ToggleSetCasterControlsXray,
        ToggleSetCasterControlsUI: _ToggleSetCasterControlsUI,
        MuteVoice: _MuteVoice,
        BlockUgc: _BlockUgc,
        RankRevealAll: _RankRevealAll,
        UpdateLeaderboard: _UpdateLeaderboard,
        OnFinalCoopScore: _OnFinalCoopScore,
        ApplyPlayerCrosshairCode: _ApplyPlayerCrosshairCode,
    };
})();
(function () {
    $.RegisterForUnhandledEvent('OnOpenScoreboard', Scoreboard.OpenScoreboard);
    $.RegisterForUnhandledEvent('OnCloseScoreboard', Scoreboard.CloseScoreboard);
    $.RegisterForUnhandledEvent('GameState_OnLevelLoad', Scoreboard.ResetAndInit);
    $.RegisterForUnhandledEvent('Scoreboard_ResetAndInit', Scoreboard.ResetAndInit);
    $.RegisterForUnhandledEvent('Scoreboard_UpdateEverything', Scoreboard.UpdateEverything);
    $.RegisterForUnhandledEvent('Scoreboard_UpdateJob', Scoreboard.UpdateJob);
    $.RegisterForUnhandledEvent('Scoreboard_CycleStats', Scoreboard.CycleStats);
    $.RegisterForUnhandledEvent('Scoreboard_OnMouseActive', Scoreboard.OnMouseActive);
    $.RegisterForUnhandledEvent('Scoreboard_OnEndOfMatch', Scoreboard.OnEndOfMatch);
    $.RegisterForUnhandledEvent('Scoreboard_UnborrowMusicKit', Scoreboard.UnborrowMusicKit);
    $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterIsCameraman', Scoreboard.ToggleSetCasterIsCameraman);
    $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterIsHeard', Scoreboard.ToggleSetCasterIsHeard);
    $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterControlsXray', Scoreboard.ToggleSetCasterControlsXray);
    $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterControlsUI', Scoreboard.ToggleSetCasterControlsUI);
    $.RegisterForUnhandledEvent('GameState_RankRevealAll', Scoreboard.RankRevealAll);
    $.RegisterForUnhandledEvent('Scoreboard_UpdateHLTVViewers', Scoreboard.UpdateHLTVViewerNumber);
    $.RegisterForUnhandledEvent('Scoreboard_Casualties_OnMouseOver', Scoreboard.Casualties_OnMouseOver);
    $.RegisterForUnhandledEvent('Scoreboard_Casualties_OnMouseOut', Scoreboard.Casualties_OnMouseOut);
    $.RegisterForUnhandledEvent('Scoreboard_RoundLossBonusMoney_OnMouseOver_CT', Scoreboard.RoundLossBonusMoney_OnMouseOver_CT);
    $.RegisterForUnhandledEvent('Scoreboard_RoundLossBonusMoney_OnMouseOut_CT', Scoreboard.RoundLossBonusMoney_OnMouseOut_CT);
    $.RegisterForUnhandledEvent('Scoreboard_RoundLossBonusMoney_OnMouseOver_TERRORIST', Scoreboard.RoundLossBonusMoney_OnMouseOver_TERRORIST);
    $.RegisterForUnhandledEvent('Scoreboard_RoundLossBonusMoney_OnMouseOut_TERRORIST', Scoreboard.RoundLossBonusMoney_OnMouseOut_TERRORIST);
    $.RegisterForUnhandledEvent('PanoramaComponent_Leaderboards_StateChange', Scoreboard.UpdateLeaderboard);
    $.RegisterForUnhandledEvent('CoopScoreReceived', Scoreboard.OnFinalCoopScore);
    $.RegisterForUnhandledEvent('GameState_OnMatchStart', function () {
        $.Schedule(0.1, Scoreboard.UpdateLeaderboard);
    });
    $.RegisterForUnhandledEvent('Scoreboard_MuteVoice', Scoreboard.MuteVoice);
    $.RegisterForUnhandledEvent('Scoreboard_BlockUgc', Scoreboard.BlockUgc);
    $.RegisterForUnhandledEvent('Scoreboard_ApplyPlayerCrosshairCode', Scoreboard.ApplyPlayerCrosshairCode);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcmVib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNjb3JlYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBQ2xDLHdDQUF3QztBQUN4QyxzREFBc0Q7QUFDdEQsNkNBQTZDO0FBcUI3QyxJQUFJLFVBQVUsR0FBRyxDQUFFO0lBa0JsQixNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFzQixDQUFDO0lBRXRELElBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0lBQzFCLFNBQVMsZ0JBQWdCO1FBRXhCLElBQUssZ0JBQWdCLEtBQUssRUFBRTtZQUMzQixnQkFBZ0IsR0FBRyxZQUFZLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUN0RCxPQUFPLGdCQUFnQixDQUFDO0lBQ3pCLENBQUM7SUFXRCxNQUFNLE1BQU07UUFFWCxxQkFBcUIsR0FBdUU7WUFDM0YsUUFBUSxFQUFFLEVBQUU7WUFDWixTQUFTLEVBQUUsRUFBRTtZQUNiLFVBQVUsRUFBRSxFQUFFO1NBQ2QsQ0FBQztRQUNGLFVBQVUsQ0FBUztRQUVuQixZQUFhLFFBQWdCO1lBRTVCLElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO1FBQzVCLENBQUM7UUFHRCxvQkFBb0I7WUFFakIsQ0FBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBdUIsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBSzFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBRSxJQUFJLENBQUUsQ0FBQztnQkFFckMsSUFBSSxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxJQUFJLENBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBRWxFLGNBQWMsQ0FBRSxJQUFJLENBQUUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQzFELElBQUksQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsSUFBSSxDQUFFLEVBQUUs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
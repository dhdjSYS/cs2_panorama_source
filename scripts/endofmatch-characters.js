/// <reference path="csgo.d.ts" />
/// <reference path="endofmatch.ts" />
/// <reference path="scoreboard.ts" />
/// <reference path="player_stats_card.ts" />
/// <reference path="mock_adapter.ts" />
var EOM_Characters = (function () {
    let _m_arrAllPlayersMatchDataJSO = [];
    let _m_localPlayer = null;
    let _m_teamToShow = null;
    const ACCOLADE_START_TIME = 1;
    const DELAY_PER_PLAYER = 0.5;
    let m_bNoGimmeAccolades = false;
    function _GetSnippetForMode(mode) {
        switch (mode) {
            case 'scrimcomp2v2':
                return 'snippet-eom-chars__layout--scrimcomp2v2';
            case 'competitive':
            case 'gungametrbomb':
            case 'cooperative':
            case 'casual':
            case 'teamdm':
                return 'snippet-eom-chars__layout--classic';
            case 'gungameprogressive':
            case 'training':
            case 'deathmatch':
            case 'ffadm':
                return 'snippet-eom-chars__layout--ffa';
            default:
                return 'snippet-eom-chars__layout--classic';
        }
    }
    function _SetTeamLogo(team) {
        let elRoot = $('#id-eom-characters-root');
        let teamLogoPath = 'file://{images}/icons/ui/' + (team == 'ct' ? 'ct_logo_1c.svg' : 't_logo_1c.svg');
        let elTeamLogo = elRoot.FindChildTraverse('id-eom-chars__layout__logo--' + team);
        if (elTeamLogo) {
            elTeamLogo.SetImage(teamLogoPath);
        }
    }
    function _SetupPanel(mode) {
        let elRoot = $('#id-eom-characters-root');
        let snippet = _GetSnippetForMode(mode);
        elRoot.RemoveAndDeleteChildren();
        elRoot.BLoadLayoutSnippet(snippet);
        _SetTeamLogo('t');
        _SetTeamLogo('ct');
    }
    function _CollectPlayersForMode(mode) {
        let arrPlayerList = [];
        switch (mode) {
            case 'deathmatch':
            case 'ffadm':
            case 'gungameprogressive':
                {
                    let arrPlayerXuids = Scoreboard.GetFreeForAllTopThreePlayers();
                    if (MockAdapter.GetMockData() != undefined) {
                        arrPlayerXuids = ['1', '2', '3'];
                    }
                    arrPlayerList[0] = _m_arrAllPlayersMatchDataJSO.filter(o => o['xuid'] == arrPlayerXuids[0])[0];
                    arrPlayerList[1] = _m_arrAllPlayersMatchDataJSO.filter(o => o['xuid'] == arrPlayerXuids[1])[0];
                    arrPlayerList[2] = _m_arrAllPlayersMatchDataJSO.filter(o => o['xuid'] == arrPlayerXuids[2])[0];
                    m_bNoGimmeAccolades = true;
                    break;
                }
            case 'training':
            case 'scrimcomp2v2':
                {
                    let listCT = _CollectPlayersOfTeam('CT').slice(0, 2);
                    let listT = _CollectPlayersOfTeam('TERRORIST').slice(0, 2);
                    arrPlayerList = listCT.concat(listT);
                    m_bNoGimmeAccolades = false;
                    break;
                }
            case 'competitive':
            case 'casual':
            case 'gungametrbomb':
            case 'cooperative':
            case 'teamdm':
            default:
                {
                    arrPlayerList = _CollectPlayersOfTeam(_m_teamToShow);
                    arrPlayerList = arrPlayerList.sort(_SortByScoreFn);
                    m_bNoGimmeAccolades = false;
                    if (_m_localPlayer) {
                        arrPlayerList = arrPlayerList.filter(player => player['xuid'] != _m_localPlayer['xuid']);
                        arrPlayerList.splice(0, 0, _m_localPlayer);
                    }
                    break;
                }
        }
        if (arrPlayerList)
            arrPlayerList = arrPlayerList.slice(0, _GetNumCharsToShowForMode(mode));
        return arrPlayerList;
    }
    function _CollectPlayersOfTeam(teamName) {
        let teamNum = 0;
        switch (teamName) {
            case 'TERRORIST':
                teamNum = 2;
                break;
            case 'CT':
                teamNum = 3;
                break;
        }
        return _m_arrAllPlayersMatchDataJSO.filter(o => o['teamnumber'] == teamNum);
    }
    function _GetNumCharsToShowForMode(mode) {
        switch (mode) {
            case 'scrimcomp2v2':
                return 4;
            case 'competitive':
                return 5;
            case 'casual':
            case 'gungametrbomb':
            case 'teamdm':
                return 5;
            case 'cooperative':
                return 2;
            case 'gungameprogressive':
            case 'deathmatch':
            case 'ffadm':
                return 3;
            case 'training':
                return 1;
            default:
                return 5;
        }
    }
    function _ShouldDisplayCommendsInMode(mode) {
        if (MyPersonaAPI.GetElevatedState() !== 'elevated') {
            return false;
        }
        switch (mode) {
            case 'scrimcomp2v2':
            case 'competitive':
            case 'casual':
            case 'gungametrbomb':
            case 'cooperative':
            case 'teamdm':
                return true;
            case 'gungameprogressive':
            case 'deathmatch':
            case 'ffadm':
            case 'training':
            default:
                return false;
        }
    }
    function _GetModeForEndOfMatchPurposes() {
        let mode = MockAdapter.GetGameModeInternalName(false);
        if (mode == 'deathmatch') {
            if (GameInterfaceAPI.GetSettingString('mp_teammates_are_enemies') !== '0') {
                mode = 'ffadm';
            }
            else if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                mode = 'teamdm';
            }
        }
        return mode;
    }
    function _ShowWinningTeam(mode) {
        return false;
    }
    let _DisplayMe = function () {
        let data = MockAdapter.GetAllPlayersMatchDataJSO();
        if (data && data.allplayerdata && data.allplayerdata.length > 0) {
            _m_arrAllPlayersMatchDataJSO = data.allplayerdata;
        }
        else {
            EndOfMatch.ToggleBetweenScoreboardAndCharacters();
            return false;
        }
        EndOfMatch.EnableToggleBetweenScoreboardAndCharacters();
        let localPlayerSet = _m_arrAllPlayersMatchDataJSO.filter(oPlayer => oPlayer['xuid'] == MockAdapter.GetLocalPlayerXuid());
        let localPlayer = (localPlayerSet.length > 0) ? localPlayerSet[0] : undefined;
        let teamNumToShow = 3;
        let mode = _GetModeForEndOfMatchPurposes();
        if (localPlayer && !_ShowWinningTeam(mode)) {
            _m_localPlayer = localPlayer;
            teamNumToShow = _m_localPlayer['teamnumber'];
        }
        else {
            let oMatchEndData = MockAdapter.GetMatchEndWinDataJSO();
            if (oMatchEndData)
                teamNumToShow = oMatchEndData['winning_team_number'];
            if (!teamNumToShow && localPlayer) {
                _m_localPlayer = localPlayer;
                teamNumToShow = _m_localPlayer['teamnumber'];
            }
        }
        if (teamNumToShow == 2) {
            _m_teamToShow = 'TERRORIST';
        }
        else {
            _m_teamToShow = 'CT';
        }
        _SetupPanel(mode);
        let arrPlayerList = _CollectPlayersForMode(mode);
        arrPlayerList = _SortPlayers(mode, arrPlayerList);
        let mapCheers = {};
        if (_m_localPlayer) {
            let arrLocalPlayer = _m_localPlayer.hasOwnProperty('items') ? _m_localPlayer.items.filter(oItem => ItemInfo.IsCharacter(oItem.itemid)) : [];
            let localPlayerModel = arrLocalPlayer[0];
            let localPlayerCheer = localPlayerModel ? ItemInfo.GetDefaultCheer(localPlayerModel['itemid']) : '';
            mapCheers[localPlayerCheer] = 1;
        }
        $.GetContextPanel().SetPlayerCount(arrPlayerList.length);
        arrPlayerList.forEach(function (oPlayer, index) {
            if (oPlayer) {
                let cheer = '';
                let playerModelItem = null;
                let sWeaponItemId = '';
                if ('items' in oPlayer) {
                    playerModelItem = oPlayer['items'].filter(oItem => ItemInfo.IsCharacter(oItem['itemid']))[0];
                    let playerWeaponItem = oPlayer['items'].filter(oItem => ItemInfo.IsWeapon(oItem['itemid']))[0];
                    if (playerWeaponItem) {
                        sWeaponItemId = playerWeaponItem['itemid'];
                    }
                }
                cheer = playerModelItem ? ItemInfo.GetDefaultCheer(playerModelItem['itemid']) : '';
                if (oPlayer != _m_localPlayer &&
                    mapCheers[cheer] == 1) {
                    cheer = '';
                }
                mapCheers[cheer] = 1;
                let label = oPlayer['xuid'];
                $.GetContextPanel().AddPlayer(index, label, sWeaponItemId, cheer);
            }
        });
        _CreatePlayerStatCards(arrPlayerList, m_bNoGimmeAccolades);
        return true;
    };
    function _DisplayPlayerStatsCard(elCardContainer, index, nPlayerCount) {
        let elEndOfMatch = $.GetContextPanel();
        let w = elEndOfMatch.actuallayoutwidth;
        let h = elEndOfMatch.actuallayoutheight;
        let xMin = 1080 * (w / h) * 0.5 - 720;
        let x = xMin + 1440 * ((index + 1) / (nPlayerCount + 1));
        let charPos = { x: x, y: 540 };
        if (elCardContainer && elCardContainer.IsValid()) {
            elCardContainer.style.x = charPos.x + 'px;';
            let elCard = elCardContainer.FindChildTraverse('card');
            elCardContainer.AddClass('reveal');
            $.Schedule(0.3, function () {
                playerStatsCard.RevealStats(elCard);
            });
        }
        if (!$.GetContextPanel().BAscendantHasClass('scoreboard-visible')) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.stats_reveal', 'MOUSE');
        }
    }
    function _CreatePlayerStatCards(arrPlayerList, bNoGimmes) {
        if (!arrPlayerList || arrPlayerList.length == 0)
            return;
        let arrBestStats = [
            { stat: 'adr', value: null, elCard: null },
            { stat: 'hsp', value: null, elCard: null },
            { stat: 'enemiesflashed', value: null, elCard: null },
            { stat: 'utilitydamage', value: null, elCard: null }
        ];
        let nPlayerCount = arrPlayerList.length;
        let elRoot = $('#id-eom-characters-root');
        arrPlayerList.forEach(function (oPlayer) {
            if (!oPlayer)
                return;
            let oTitle = oPlayer.nomination;
            let index = arrPlayerList.indexOf(oPlayer);
            if (oTitle != undefined) {
                let xuid = oPlayer.xuid;
                let elCardContainer = $.CreatePanel('Panel', elRoot, 'cardcontainer-' + xuid);
                elCardContainer.AddClass('player-stats-card-container');
                elCardContainer.style.zIndex = (index * 10).toString();
                let elCard = playerStatsCard.Init(elCardContainer, xuid, index);
                let accName = GameStateAPI.GetAccoladeLocalizationString(Number(oTitle.eaccolade));
                let showAccolade = !(bNoGimmes && accName.includes('gimme_'));
                if (showAccolade) {
                    let accValue = oTitle.value.toString();
                    let accPosition = oTitle.position.toString();
                    playerStatsCard.SetAccolade(elCard, accValue, accName, accPosition);
                }
                playerStatsCard.SetStats(elCard, xuid, arrBestStats);
                playerStatsCard.SetFlair(elCard, xuid);
                playerStatsCard.SetSkillGroup(elCard, xuid);
                playerStatsCard.SetAvatar(elCard, xuid);
                playerStatsCard.SetTeammateColor(elCard, xuid);
                $.Schedule(ACCOLADE_START_TIME + (index * DELAY_PER_PLAYER), _DisplayPlayerStatsCard.bind(undefined, elCardContainer, index, nPlayerCount));
            }
            else {
            }
        });
        arrBestStats.forEach(function (oBest) {
            if (oBest.elCard)
                playerStatsCard.HighlightStat(oBest.elCard, oBest.stat);
        });
    }
    function _SortByTeamFn(a, b) {
        let team_a = Number(a['teamnumber']);
        let team_b = Number(b['teamnumber']);
        let index_a = Number(a['slot']);
        let index_b = Number(b['slot']);
        if (team_a != team_b) {
            return team_b - team_a;
        }
        else {
            return index_a - index_b;
        }
    }
    function _SortByScoreFn(a, b) {
        let score_a = MockAdapter.GetPlayerScore(a['xuid']);
        let score_b = MockAdapter.GetPlayerScore(b['xuid']);
        let index_a = Number(a['slot']);
        let index_b = Number(b['slot']);
        if (score_a != score_b) {
            return score_b - score_a;
        }
        else {
            return index_a - index_b;
        }
    }
    function _SortPlayers(mode, arrPlayerList) {
        let midpoint;
        let localPlayerPosition;
        switch (mode) {
            case 'scrimcomp2v2':
                arrPlayerList.sort(_SortByTeamFn);
                break;
            case 'no longer used but force local player to the middle':
                if (_m_localPlayer &&
                    _m_localPlayer.hasOwnProperty('xuid') &&
                    (arrPlayerList.filter(p => p.xuid == _m_localPlayer.xuid).length > 0)) {
                    midpoint = Math.floor(arrPlayerList.length / 2);
                    arrPlayerList = arrPlayerList.filter(player => player['xuid'] != _m_localPlayer['xuid']);
                    arrPlayerList.splice(midpoint, 0, _m_localPlayer);
                }
                break;
            case 'no longer used but force player to have a spot':
                if (_m_localPlayer && arrPlayerList.includes(_m_localPlayer)) {
                    localPlayerPosition = Math.min(arrPlayerList.indexOf(_m_localPlayer), 7);
                    arrPlayerList = arrPlayerList.filter(player => player['xuid'] != _m_localPlayer['xuid']);
                    arrPlayerList.splice(localPlayerPosition, 0, _m_localPlayer);
                }
                break;
            case 'gungameprogressive':
            case 'deathmatch':
            case 'ffadm':
            case 'gungametrbomb':
            case 'casual':
            case 'teamdm':
            default:
                break;
        }
        return arrPlayerList;
    }
    function _RankRevealAll() {
        let mode = _GetModeForEndOfMatchPurposes();
        let arrPlayerList = _CollectPlayersForMode(mode);
        arrPlayerList.forEach(function (oPlayer) {
            if (!oPlayer)
                return;
            let xuid = oPlayer.xuid;
            let elCardContainer = $.GetContextPanel().FindChildTraverse('cardcontainer-' + xuid);
            if (elCardContainer) {
                let elCard = playerStatsCard.GetCard(elCardContainer);
                playerStatsCard.SetSkillGroup(elCard, xuid);
            }
        });
    }
    function _Start() {
        _DisplayMe();
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gameover_show', 'MOUSE');
    }
    function _Shutdown() {
        $('#id-eom-characters-root').FindChildrenWithClassTraverse('eom-chars__accolade').forEach(el => el.DeleteAsync(.0));
        $('#id-eom-characters-root').RemoveAndDeleteChildren();
    }
    return {
        Start: _Start,
        Shutdown: _Shutdown,
        GetModeForEndOfMatchPurposes: _GetModeForEndOfMatchPurposes,
        ShowWinningTeam: _ShowWinningTeam,
        RankRevealAll: _RankRevealAll,
    };
})();
(function () {
    $.RegisterForUnhandledEvent('GameState_RankRevealAll', EOM_Characters.RankRevealAll);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtDQUFrQztBQUNsQyxzQ0FBc0M7QUFDdEMsc0NBQXNDO0FBQ3RDLDZDQUE2QztBQUM3Qyx3Q0FBd0M7QUFHeEMsSUFBSSxjQUFjLEdBQUcsQ0FFcEI7SUFHQyxJQUFJLDRCQUE0QixHQUFvRCxFQUFFLENBQUM7SUFFdkYsSUFBSSxjQUFjLEdBQXlELElBQUksQ0FBQztJQUNoRixJQUFJLGFBQWEsR0FBOEIsSUFBSSxDQUFDO0lBRXBELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDO0lBRTdCLElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0lBRWhDLFNBQVMsa0JBQWtCLENBQUcsSUFBWTtRQUV6QyxRQUFTLElBQUksRUFDYjtZQUVDLEtBQUssY0FBYztnQkFDbEIsT0FBTyx5Q0FBeUMsQ0FBQztZQUdsRCxLQUFLLGFBQWEsQ0FBQztZQUNuQixLQUFLLGVBQWUsQ0FBQztZQUNyQixLQUFLLGFBQWEsQ0FBQztZQUNuQixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssUUFBUTtnQkFDWixPQUFPLG9DQUFvQyxDQUFDO1lBRzdDLEtBQUssb0JBQW9CLENBQUM7WUFDMUIsS0FBSyxVQUFVLENBQUM7WUFDaEIsS0FBSyxZQUFZLENBQUM7WUFDbEIsS0FBSyxPQUFPO2dCQUNYLE9BQU8sZ0NBQWdDLENBQUM7WUFFekM7Z0JBQ0MsT0FBTyxvQ0FBb0MsQ0FBQztTQUM3QztJQUNGLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBRyxJQUFnQjtRQUV2QyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUUseUJBQXlCLENBQUcsQ0FBQztRQUU3QyxJQUFJLFlBQVksR0FBRywyQkFBMkIsR0FBRyxDQUFFLElBQUksSUFBSSxJQUFJLENB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
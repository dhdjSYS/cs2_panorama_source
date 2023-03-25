/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />
var TeamIntroMenu = (function () {
    const MAX_PLAYERS = 64;
    async function _StartTeamIntro() {
        const elMenu = $.GetContextPanel();
        const sLocalXuid = GameStateAPI.GetLocalPlayerXuid();
        const nLocalTeam = GameStateAPI.GetPlayerTeamNumber(sLocalXuid);
        const endPromise = Async.UnhandledEvent("EndTeamIntro");
        elMenu.SetHasClass("active", true);
        _SetFaded(true, 0);
        elMenu.StartCamera();
        const modelRefs = _SetupModels(nLocalTeam);
        _SetTeam(nLocalTeam);
        _SetupHeader(nLocalTeam);
        const teamInfoAbort = new Async.AbortController();
        _SetupTeamInfos(nLocalTeam, modelRefs, teamInfoAbort.signal);
        await Async.Delay(0.5);
        _SetFaded(false, 0.5);
        await endPromise;
        _SetFaded(true, 0.5);
        await Async.Delay(0.5);
        teamInfoAbort.abort();
        $("#TeamIntroHeader").AddClass("hidden");
        $("#TeamIntroTeammateInfos").RemoveAndDeleteChildren();
        _ClearBackground();
        elMenu.StopCamera();
        elMenu.ClearModels();
        _SetFaded(false, 0.5);
        await Async.Delay(0.5);
        elMenu.SetHasClass("active", false);
    }
    function _SetTeam(nTeamNumber) {
        switch (nTeamNumber) {
            case 2:
                $.GetContextPanel().SwitchClass('team', "TERRORIST");
                break;
            case 3:
                $.GetContextPanel().SwitchClass('team', "CT");
                break;
        }
    }
    function _ClearBackground() {
        $.GetContextPanel().SwitchClass('team', "no-background");
    }
    function _SetupTeamInfos(nTeamNumber, modelRefs, abortSignal) {
        const elMenu = $.GetContextPanel();
        $("#TeamIntroTeammateInfos").RemoveAndDeleteChildren();
        const teammateInfos = new Map();
        Async.RunSequence(function* () {
            for (const ref of modelRefs.values()) {
                yield Async.Delay(1.0);
                const elInfo = _CreateTeammateInfo(ref.sXuid, ref.nOrdinal);
                teammateInfos.set(ref.nOrdinal, elInfo);
                elInfo.RemoveClass("hidden");
            }
        }, abortSignal);
        Async.RunSequence(function* () {
            while (true) {
                for (const [nOrdinal, elInfo] of teammateInfos) {
                    let { x, y } = elMenu.GetModelBonePosition(nTeamNumber, nOrdinal, "neck_0");
                    if (isFinite(x) && isFinite(y) && elInfo) {
                        y -= 10.0;
                        x -= elInfo.actuallayoutwidth / elInfo.actualuiscale_x * 0.5;
                        y -= elInfo.actuallayoutheight / elInfo.actualuiscale_y;
                        elInfo.style.transform = "translate3d( " + x + "px, " + y + "px, 0px )";
                    }
                }
                yield Async.NextFrame();
            }
        }, abortSignal);
    }
    function _CreateTeammateInfo(sXuid, nOrdinal) {
        const elInfos = $("#TeamIntroTeammateInfos");
        const elInfo = $.CreatePanel("Panel", elInfos, nOrdinal.toString());
        elInfo.BLoadLayoutSnippet("TeamIntroTeammateInfo");
        const elAvatarImage = elInfo.FindChildInLayoutFile("AvatarImage");
        elAvatarImage.PopulateFromPlayerSlot(GameStateAPI.GetPlayerSlot(sXuid));
        const elName = elInfo.FindChildInLayoutFile("Name");
        elName.text = GameStateAPI.GetPlayerName(sXuid);
        const teamColor = GameStateAPI.GetPlayerColor(sXuid);
        if (teamColor)
            elName.style.washColor = teamColor;
        return elInfo;
    }
    function _SetupModels(nLocalTeam) {
        const elMenu = $.GetContextPanel();
        elMenu.ClearModels();
        const modelRefs = [];
        for (let nOrdinal = 1;; ++nOrdinal) {
            const sXuid = elMenu.AddModel(nLocalTeam, nOrdinal);
            if (!sXuid)
                break;
            modelRefs.push({ sXuid, nOrdinal });
        }
        return modelRefs;
    }
    function _SetFaded(bVisible, transitionDuration) {
        const elFade = $("#TeamIntroFade");
        elFade.style.transitionDuration = `${transitionDuration}s`;
        elFade.SetHasClass("hidden", !bVisible);
    }
    function _SetupHeader(nTeamNumber) {
        const bFirstHalf = GameStateAPI.GetTimeDataJSO().gamephase === 2;
        $("#TeamIntroHeader").RemoveClass("hidden");
        $.DispatchEvent('CSGOPlaySoundEffect', 'TeamIntro', 'MOUSE');
        const elIcon = $("#TeamIntroIcon");
        const elHalfLabel = $("#TeamIntroHalfLabel");
        const elTeamLabel = $("#TeamIntroTeamLabel");
        elHalfLabel.text = $.Localize(bFirstHalf ? "#team-intro-1st-half" : "#team-intro-2nd-half");
        switch (nTeamNumber) {
            case 2:
                elIcon.SetImage("file://{images}/icons/t_logo.svg");
                elTeamLabel.text = $.Localize(bFirstHalf ? "#team-intro-starting-as-t" : "#team-intro-playing-as-t");
                break;
            case 3:
                elIcon.SetImage("file://{images}/icons/ct_logo.svg");
                elTeamLabel.text = $.Localize(bFirstHalf ? "#team-intro-starting-as-ct" : "#team-intro-playing-as-ct");
                break;
        }
    }
    return {
        StartTeamIntro: _StartTeamIntro
    };
})();
(function () {
    $.RegisterForUnhandledEvent("StartTeamIntro", TeamIntroMenu.StartTeamIntro);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbWludHJvbWVudS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlYW1pbnRyb21lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBQ2xDLHdDQUF3QztBQUV4QyxJQUFJLGFBQWEsR0FBRyxDQUFFO0lBaUJsQixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFFdkIsS0FBSyxVQUFVLGVBQWU7UUFFMUIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBeUIsQ0FBQztRQUMxRCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNyRCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsbUJBQW1CLENBQUUsVUFBVSxDQUFFLENBQUM7UUFFbEUsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUUxRCxNQUFNLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUNyQyxTQUFTLENBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNyQixNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUUsVUFBVSxDQUFFLENBQUM7UUFFN0MsUUFBUSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRXZCLFlBQVksQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUUzQixNQUFNLGFBQWEsR0FBRyxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNsRCxlQUFlLENBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxhQUFhLENBQUMsTUFBTSxDQUFFLENBQUM7UUFFL0QsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQ3pCLFNBQVMsQ0FBRSxLQUFLLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFFeEIsTUFBTSxVQUFVLENBQUM7UUFDakIsU0FBUyxDQUFFLElBQUksRUFBRSxH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
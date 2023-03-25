/// <reference path="csgo.d.ts" />
/// <reference path="common/teamcolor.ts" />
var CAvatar = class {
    Init(elAvatar, xuid, type) {
        const sXuid = xuid.toString();
        switch (type) {
            case 'playercard':
                this.SetImage(elAvatar, sXuid);
                this.SetFlair(elAvatar, sXuid);
                this.SetTeamColor(elAvatar, sXuid);
                this.SetLobbyLeader(elAvatar);
                break;
            case 'flair':
                this.SetImage(elAvatar, sXuid);
                this.SetFlair(elAvatar, sXuid);
                break;
            default:
                this.SetImage(elAvatar, sXuid);
                this.SetTeamColor(elAvatar, sXuid);
        }
    }
    UpdateTalkingState(elAvatar, xuid, bCalledFromScheduledFunction) {
        if (!elAvatar || !elAvatar.IsValid())
            return;
        const elSpeaking = elAvatar.FindChildTraverse('JsAvatarSpeaking');
        if (!elSpeaking)
            return;
        const bFriendIsTalking = PartyListAPI.GetFriendIsTalking(xuid);
        elSpeaking.SetHasClass('hidden', !bFriendIsTalking);
        if (bFriendIsTalking && (bCalledFromScheduledFunction || !elAvatar.GetAttributeString('updatetalkingstate', ''))) {
            const schfn = $.Schedule(.1, () => this.UpdateTalkingState(elAvatar, xuid, true));
            elAvatar.SetAttributeString('updatetalkingstate', '' + schfn);
        }
        if (!bFriendIsTalking) {
            elAvatar.SetAttributeString('updatetalkingstate', '');
        }
    }
    ;
    SetImage(elAvatar, xuid) {
        const elImage = elAvatar.FindChildTraverse('JsAvatarImage');
        if (xuid === '' || xuid === '0') {
            elImage.AddClass('hidden');
            return;
        }
        elImage.PopulateFromSteamID(xuid);
        elImage.RemoveClass('hidden');
    }
    ;
    SetFlair(elAvatar, xuid) {
        const elFlair = elAvatar.FindChildTraverse('JsAvatarFlair');
        if (xuid === '' || xuid === '0') {
            elFlair.AddClass('hidden');
            return;
        }
        elFlair.RemoveClass('hidden');
        let flairItemId = InventoryAPI.GetFlairItemId(xuid);
        if (flairItemId === "0" || !flairItemId) {
            const flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefFeatured(xuid);
            flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(flairDefIdx, 0);
            if (flairItemId === "0" || !flairItemId)
                return;
        }
        const imagePath = InventoryAPI.GetItemInventoryImage(flairItemId);
        elFlair.SetImage('file://{images}' + imagePath + '_small.png');
    }
    ;
    SetTeamColor(elAvatar, xuid) {
        const teamColor = PartyListAPI.GetPartyMemberSetting(xuid, 'game/teamcolor');
        const elTeamColor = elAvatar.FindChildTraverse('JsAvatarTeamColor');
        if (!teamColor) {
            if (elTeamColor)
                elTeamColor.AddClass('hidden');
            return;
        }
        if (typeof TeamColor !== 'undefined') {
            const rgbColor = TeamColor.GetTeamColor(Number(teamColor));
            elTeamColor.RemoveClass('hidden');
            elTeamColor.style.washColor = 'rgb(' + rgbColor + ')';
        }
    }
    ;
    SetLobbyLeader(elAvatar) {
        if (!elAvatar.hasOwnProperty("GetAttributeString"))
            return;
        const show = elAvatar.GetAttributeString('showleader', '');
        const elLeader = elAvatar.FindChildTraverse('JsAvatarLeader');
        if (elLeader) {
            if (show === 'show')
                elLeader.RemoveClass('hidden');
            else
                elLeader.AddClass('hidden');
        }
    }
    ;
};
var Avatar = Avatar ?? new CAvatar();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXZhdGFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXZhdGFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtDQUFrQztBQUNsQyw0Q0FBNEM7QUFFNUMsSUFBSSxPQUFPLEdBQUc7SUFFYixJQUFJLENBQUcsUUFBaUIsRUFBRSxJQUFxQixFQUFFLElBQTZCO1FBRzdFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QixRQUFTLElBQUksRUFDYjtZQUNDLEtBQUssWUFBWTtnQkFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxRQUFRLENBQUUsUUFBUSxFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsWUFBWSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxRQUFRLENBQUUsQ0FBQztnQkFDaEMsTUFBTTtZQUNQLEtBQUssT0FBTztnQkFDWCxJQUFJLENBQUMsUUFBUSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFFBQVEsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQ2pDLE1BQU07WUFDUDtnQkFDQyxJQUFJLENBQUMsUUFBUSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFlBQVksQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7U0FDdEM7SUFDRixDQUFDO0lBRUQsa0JBQWtCLENBQUcsUUFBaUIsRUFBRSxJQUFZLEVBQUUsNEJBQXNDO1FBRTNGLElBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO1lBQ3BDLE9BQU87UUFFUixNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUNw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
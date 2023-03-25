/// <reference path="../csgo.d.ts" />
var HudTeamCounter = (function () {
    function _ShowDamageReport(elTeamCounter, elAvatarPanel) {
        const bannerDelay = 0;
        const delayDelta = 0.1;
        const bFriendlyFire = 1 == elAvatarPanel.GetAttributeInt("friendlyfire", 0);
        const bDead = 1 == elAvatarPanel.GetAttributeInt("dead", 0);
        const healthRemoved = elAvatarPanel.GetAttributeInt("health_removed", 0);
        const numHits = elAvatarPanel.GetAttributeInt("num_hits", 0);
        const returnHealthRemoved = elAvatarPanel.GetAttributeInt("return_health_removed", 0);
        const returnNumHits = elAvatarPanel.GetAttributeInt("return_num_hits", 0);
        const orderIndex = elAvatarPanel.GetAttributeInt("order_index", 0);
        const elDamageReport = elAvatarPanel.FindChildTraverse('PostRoundDamageReport');
        elDamageReport.SetHasClass('given', numHits > 0);
        elDamageReport.SetHasClass('taken', returnNumHits > 0);
        elDamageReport.SetHasClass('friendlyfire', bFriendlyFire);
        elDamageReport.SetDialogVariableInt("health_removed", healthRemoved);
        elDamageReport.SetDialogVariableInt("num_hits", numHits);
        elDamageReport.SetDialogVariableInt("return_health_removed", returnHealthRemoved);
        elDamageReport.SetDialogVariableInt("return_num_hits", returnNumHits);
        elDamageReport.SwitchClass('advantage', healthRemoved > returnHealthRemoved ? 'won' : 'lost');
        function _reveal(elPanel) {
            elPanel.AddClass('show-prdr');
        }
        $.Schedule(bannerDelay + orderIndex * delayDelta, () => _reveal(elAvatarPanel));
    }
    function _HideDamageReport() {
        $.GetContextPanel().FindChildrenWithClassTraverse("show-prdr").forEach(el => el.RemoveClass('show-prdr'));
    }
    return {
        ShowDamageReport: _ShowDamageReport,
        HideDamageReport: _HideDamageReport
    };
})();
(function () {
    $.RegisterForUnhandledEvent('RevealPostRoundDamageReportPanel', HudTeamCounter.ShowDamageReport);
    $.RegisterForUnhandledEvent('ClearAllPostRoundDamageReportPanels', HudTeamCounter.HideDamageReport);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkdGVhbWNvdW50ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodWR0ZWFtY291bnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQ0FBcUM7QUFFckMsSUFBSSxjQUFjLEdBQUcsQ0FBRTtJQUd0QixTQUFTLGlCQUFpQixDQUFHLGFBQXNCLEVBQUUsYUFBc0I7UUFHMUUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUV2QixNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksYUFBYSxDQUFDLGVBQWUsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxlQUFlLENBQUUsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBRTlELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDM0UsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxVQUFVLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDL0QsTUFBTSxtQkFBbUIsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3hGLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFFNUUsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxhQUFhLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFJckUsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFFLHVCQUF1QixDQUFFLENBQUM7UUFFbEYsY0FBYyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBRSxDQUFDO1FBQ25ELGNBQWMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGFBQWEsR0FBRyxDQUFDLENBQUUsQ0FBQztRQUN6RCxjQUFjLENBQUMsV0FBVyxDQUFFLGNBQWMsRUFBRSxhQUFhLENBQUUsQ0FBQztRQUU1RCxjQUFjLENBQUMsb0JBQW9CLENBQUUsZ0JBQWdCLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFDdkUsY0FBYyxDQUFDLG9CQUFvQixDQUFFLFVBQVUsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUMzRCxjQUFjLENBQUMsb0JBQW9CLENBQUUsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUNwRixjQUFjLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFeEUsY0FBYyxDQUFDLFdBQVcsQ0FBRSxXQUFXLEVBQUUsYUFBYSxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBRWhHLFNBQVMsT0FBTyxDQUFHLE9BQWdCO1lBRWxDLE9BQU8sQ0FBQyxRQUFRLENBQUUsV0FBVyxDQUFFLENBQUM7UUFFakMsQ0FBQztRQUVELENBQUMsQ0FBQyxRQUFRLENBQUUsV0FBVyxHQUFHLFVBQVUsR0FBRyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7SUFDckYsQ0FBQztJQUVELFNBQVMsaUJBQWlCO1FBRXpCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBRSxXQUFXLENBQUUsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7SUFDakgsQ0FBQztJQUVELE9BQU87UUFFTixnQkFBZ0IsRUFBRSxpQkFBaUI7UUFDbkMsZ0JBQWdCLEVBQUUsaUJBQWlCO0tBQ25DLENBQUM7QUFFSCxDQUFDLENBQUUsRUFBRSxDQUFDO0FBS04sQ0FBRTtJQUlELENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxrQ0FBa0MsRUFBRSxjQUFjLENBQUMsZ0JBQWdCLENBQUUsQ0FBQztJQUNuRyxDQUFDLENBQUMseUJBQXlCLENBQUUscUNBQXFDLEVBQUUsY0FBYyxDQUFDLGdCQUFnQixDQUFFLENBQUM7QUFHdkcsQ0FBQyxDQUFFLEVBQUUsQ0FBQyJ9
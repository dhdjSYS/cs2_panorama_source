/// <reference path="csgo.d.ts" />
var SettingsMenuShared = (function () {
    var _ResetControlsRecursive = function (panel) {
        if (panel == null) {
            return;
        }
        if (panel.GetChildCount == undefined) {
            return;
        }
        if (panel.paneltype == 'CSGOSettingsSlider' || panel.paneltype == 'CSGOSettingsEnumDropDown') {
            panel.RestoreCVarDefault();
        }
        else if (panel.paneltype == 'CSGOConfigSlider' || panel.paneltype == 'CSGOConfigEnumDropDown') {
            panel.RestoreConfigDefault();
        }
        else if (panel.paneltype == 'CSGOSettingsKeyBinder') {
            panel.OnShow();
        }
        else {
            var nCount = panel.GetChildCount();
            for (var i = 0; i < nCount; i++) {
                var child = panel.GetChild(i);
                _ResetControlsRecursive(child);
            }
        }
    };
    var _ResetControls = function () {
        _ResetControlsRecursive($.GetContextPanel());
    };
    var _ResetKeybdMouseDefaults = function () {
        OptionsMenuAPI.RestoreKeybdMouseBindingDefaults();
        _ResetControls();
    };
    var _ResetAudioSettings = function () {
        $.DispatchEvent("CSGOAudioSettingsResetDefault");
        _ResetControls();
    };
    var _ResetVideoSettings = function () {
        $.DispatchEvent("CSGOVideoSettingsResetDefault");
        _ResetControls();
        _VideoSettingsOnUserInputSubmit();
    };
    var _ResetVideoSettingsAdvanced = function () {
        $.DispatchEvent("CSGOVideoSettingsResetDefaultAdvanced");
        _VideoSettingEnableDiscard;
    };
    var _RefreshControlsRecursive = function (panel) {
        if (panel == null) {
            return;
        }
        if ('OnShow' in panel) {
            panel.OnShow();
        }
        if (panel.GetChildCount == undefined) {
            return;
        }
        else {
            var nCount = panel.GetChildCount();
            for (var i = 0; i < nCount; i++) {
                var child = panel.GetChild(i);
                _RefreshControlsRecursive(child);
            }
        }
    };
    var _ShowConfirmReset = function (resetCall, locText) {
        UiToolkitAPI.ShowGenericPopupOneOptionCustomCancelBgStyle('#settings_reset_confirm_title', locText, '', '#settings_reset', function () {
            resetCall();
        }, '#settings_return', function () {
        }, 'dim');
    };
    var _ShowConfirmDiscard = function (discardCall) {
        UiToolkitAPI.ShowGenericPopupOneOptionCustomCancelBgStyle('#settings_discard_confirm_title', '#settings_discard_confirm_video_desc', '', '#settings_discard', function () {
            discardCall();
        }, '#settings_return', function () {
        }, 'dim');
    };
    var _ScrollToId = function (locationId) {
        var elLocationPanel = $.GetContextPanel().FindChildTraverse(locationId);
        if (elLocationPanel != null) {
            elLocationPanel.ScrollParentToMakePanelFit(1, false);
            elLocationPanel.TriggerClass('Highlight');
        }
    };
    var _SetVis = function (locationId, vis) {
        var panel = $.GetContextPanel().FindChildTraverse(locationId);
        if (panel != null) {
            panel.visible = vis;
        }
    };
    var gBtnApplyVideoSettingsButton = null;
    var gBtnDiscardVideoSettingChanges = null;
    var gBtnDiscardVideoSettingChanges2 = null;
    var _VideoSettingsOnUserInputSubmit = function () {
        if (gBtnApplyVideoSettingsButton != null) {
            gBtnApplyVideoSettingsButton.enabled = true;
        }
        if (gBtnDiscardVideoSettingChanges != null) {
            gBtnDiscardVideoSettingChanges.enabled = true;
        }
    };
    var _VideoSettingEnableDiscard = function () {
        if (gBtnDiscardVideoSettingChanges2 != null) {
            gBtnDiscardVideoSettingChanges2.enabled = true;
        }
    };
    var _VideoSettingsResetUserInput = function () {
        if (gBtnApplyVideoSettingsButton != null) {
            gBtnApplyVideoSettingsButton.enabled = false;
        }
        if (gBtnDiscardVideoSettingChanges != null) {
            gBtnDiscardVideoSettingChanges.enabled = false;
        }
        if (gBtnDiscardVideoSettingChanges2 != null) {
            gBtnDiscardVideoSettingChanges2.enabled = false;
        }
    };
    var _VideoSettingsDiscardChanges = function () {
        $.DispatchEvent("CSGOVideoSettingsInit");
        _VideoSettingsResetUserInput();
    };
    var _VideoSettingsDiscardAdvanced = function () {
        $.DispatchEvent("CSGOVideoSettingsDiscardAdvanced");
        _VideoSettingsResetUserInput();
    };
    var _VideoSettingsApplyChanges = function () {
        $.DispatchEvent("CSGOApplyVideoSettings");
        _VideoSettingsResetUserInput();
    };
    var _NewTabOpened = function (newTab) {
        var videoSettingsStr = 'VideoSettings';
        if (newTab == videoSettingsStr) {
            var videoSettingsPanel = $.GetContextPanel().FindChildInLayoutFile(videoSettingsStr);
            gBtnApplyVideoSettingsButton = videoSettingsPanel.FindChildInLayoutFile("BtnApplyVideoSettings");
            gBtnDiscardVideoSettingChanges = videoSettingsPanel.FindChildInLayoutFile("BtnDiscardVideoSettingChanges");
            gBtnDiscardVideoSettingChanges2 = videoSettingsPanel.FindChildInLayoutFile("BtnDiscardVideoSettingChanges2");
            gBtnApplyVideoSettingsButton.enabled = false;
            gBtnDiscardVideoSettingChanges.enabled = false;
            gBtnDiscardVideoSettingChanges2.enabled = false;
            $.DispatchEvent("CSGOVideoSettingsInit");
        }
        var newTabPanel = $.GetContextPanel().FindChildInLayoutFile(newTab);
        _RefreshControlsRecursive(newTabPanel);
        GameInterfaceAPI.ConsoleCommand("host_writeconfig");
    };
    var _ShowHudEdgePositions = function () {
        UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_hud_edge_positions.xml');
    };
    var _ChangeBackground = function (delta) {
        let elBkg = $("#XhairBkg");
        if (elBkg) {
            let nBkgIdx = elBkg.GetAttributeInt("bkg-id", 0);
            let arrBkgs = ["bkg-dust2", "bkg-aztec", "bkg-mirage", "bkg-office"];
            nBkgIdx = (arrBkgs.length + nBkgIdx + delta) % arrBkgs.length;
            elBkg.SwitchClass("bkg-style", arrBkgs[nBkgIdx]);
            elBkg.SetAttributeInt("bkg-id", nBkgIdx);
        }
    };
    return {
        ResetControlsRecursivepanel: _ResetControlsRecursive,
        ResetControls: _ResetControls,
        ResetKeybdMouseDefaults: _ResetKeybdMouseDefaults,
        ResetAudioSettings: _ResetAudioSettings,
        ResetVideoSettings: _ResetVideoSettings,
        ResetVideoSettingsAdvanced: _ResetVideoSettingsAdvanced,
        ScrollToId: _ScrollToId,
        SetVis: _SetVis,
        ShowConfirmReset: _ShowConfirmReset,
        ShowConfirmDiscard: _ShowConfirmDiscard,
        VideoSettingsEnableDiscard: _VideoSettingEnableDiscard,
        VideoSettingsOnUserInputSubmit: _VideoSettingsOnUserInputSubmit,
        VideoSettingsDiscardAdvanced: _VideoSettingsDiscardAdvanced,
        VideoSettingsDiscardChanges: _VideoSettingsDiscardChanges,
        VideoSettingsApplyChanges: _VideoSettingsApplyChanges,
        NewTabOpened: _NewTabOpened,
        ShowHudEdgePositions: _ShowHudEdgePositions,
        ChangeBackground: _ChangeBackground,
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3NoYXJlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNldHRpbmdzbWVudV9zaGFyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBRWxDLElBQUksa0JBQWtCLEdBQUcsQ0FBRTtJQUcxQixJQUFJLHVCQUF1QixHQUFHLFVBQVUsS0FBYztRQUVyRCxJQUFLLEtBQUssSUFBSSxJQUFJLEVBQ2xCO1lBQ0MsT0FBTztTQUNQO1FBRUQsSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLFNBQVMsRUFDcEM7WUFFQyxPQUFPO1NBQ1A7UUFFRCxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksb0JBQW9CLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSwwQkFBMEIsRUFDNUY7WUFDRSxLQUEyRCxDQUFDLGtCQUFrQixFQUFFLENBQUM7U0FDbEY7YUFDSSxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksa0JBQWtCLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSx3QkFBd0IsRUFDN0Y7WUFFSSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUNoQzthQUNJLElBQUssS0FBSyxDQUFDLFNBQVMsSUFBSSx1QkFBdUIsRUFDcEQ7WUFFRSxLQUFpQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQzVDO2FBRUQ7WUFDQyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDaEM7Z0JBQ0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDL0I7U0FDRDtJQUNGLENBQUMsQ0FBQztJQUVGLElBQUksY0FBYyxHQUFHO1FBR3BCLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUs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
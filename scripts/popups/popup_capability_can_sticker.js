/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../common/iteminfo.ts" />
var CapabilityCanSticker = (function () {
    let m_emptySlotList = null;
    let m_scheduleHandle = null;
    let m_isRemoveStickers = false;
    let m_SlotSelectedForScratch = null;
    let m_isSticker = false;
    let m_isPatch = false;
    const m_cP = $.GetContextPanel();
    let m_toolToken = null;
    let m_elPreviewPanel = m_cP.FindChildInLayoutFile('CanStickerItemModel');
    let m_prevCameraSlot = null;
    const _Init = function () {
        const strMsg = m_cP.GetAttributeString("sticker-and-itemtosticker", "(not found)");
        const idList = strMsg.split(',');
        m_isRemoveStickers = idList[0] === 'remove' ? true : false;
        const itemId = idList[1];
        const toolId = m_isRemoveStickers ? '' : idList[0];
        m_isSticker = ItemInfo.IsSticker(idList[0]) || ItemInfo.IsWeapon(idList[1]);
        m_isPatch = ItemInfo.IsPatch(idList[0]) || ItemInfo.IsCharacter(idList[1]);
        const elTop = m_cP.FindChildTraverse("id-popup-capability__top");
        const elInfoBlock = m_cP.FindChildTraverse("id-popup-capability__info-block");
        if (m_isSticker) {
            elTop.BLoadLayoutSnippet("snippet-top--sticker");
            elInfoBlock.BLoadLayoutSnippet("snippet-info-block--sticker");
        }
        else if (m_isPatch) {
            elTop.BLoadLayoutSnippet("snippet-top--patch");
            elInfoBlock.BLoadLayoutSnippet("snippet-info-block--patch");
        }
        if (m_isPatch) {
            m_elPreviewPanel.AddClass('characters');
        }
        if (!m_isRemoveStickers)
            m_emptySlotList = _GetEmptyStickerSlots(_GetSlotInfo(itemId));
        _SetToolName();
        _SetItemModel(toolId, itemId);
        _SetTitle();
        _SetDescText(itemId);
        _SetWarningText(toolId, itemId);
        _ShowStickerIconsToApplyOrRemove(toolId, itemId);
        _SetUpAsyncActionBar(toolId, itemId);
        _StickerBtnActions(toolId, itemId);
        $.DispatchEvent('CapabilityPopupIsOpen', true);
    };
    function _SetToolName() {
        if (m_isSticker) {
            m_toolToken = '_sticker';
        }
        else if (m_isPatch) {
            m_toolToken = '_patch';
        }
    }
    const _SetItemModel = function (toolId, itemId) {
        if (!InventoryAPI.IsItemInfoValid(itemId))
            return;
        InspectModelImage.Init(m_elPreviewPanel, itemId);
        m_elPreviewPanel.Data().id = itemId;
        if (!m_isRemoveStickers) {
            _PreviewStickerInSlot(toolId, _GetSelectedStickerSlot());
        }
    };
    const _SetTitle = function () {
        let title = '';
        if (m_isRemoveStickers) {
            title = $.Localize(m_isPatch ? '#SFUI_InvContextMenu_can_stick_Wear_full' + m_toolToken : '#SFUI_InvContextMenu_can_stick_Wear' + m_toolToken, m_cP);
        }
        else {
            title = $.Localize('#SFUI_InvContextMenu_stick_use' + m_toolToken, m_cP);
        }
        m_cP.SetDialogVariable("CanStickerTitle", title);
    };
    const _SetDescText = function (itemId) {
        const currentName = ItemInfo.GetName(itemId);
        m_cP.SetDialogVariable('tool_target_name', currentName);
        const elDescLabel = m_cP.FindChildInLayoutFile('CanStickerDesc');
        const desc = m_isRemoveStickers ?
            (m_isPatch ? '#popup_can_stick_scrape_full' + m_toolToken : '#popup_can_stick_scrape' + m_toolToken) :
            '#popup_can_stick_desc';
        elDescLabel.text = desc;
        elDescLabel.visible = !m_isRemoveStickers;
    };
    const _SetWarningText = function (toolId, itemId) {
        let warningText = _GetWarningTradeRestricted(toolId, itemId);
        if (m_isRemoveStickers) {
            warningText = (m_isPatch ? '#popup_can_stick_scrape_full' + m_toolToken : '#popup_can_stick_scrape' + m_toolToken);
        }
        else if (!m_isRemoveStickers) {
            if (!warningText) {
                warningText = ('#SFUI_InvUse_Warning_use_can_stick' + m_toolToken);
            }
        }
        const elWarningLabel = m_cP.FindChildInLayoutFile('CanStickerWarning');
        if (elWarningLabel)
            elWarningLabel.text = warningText;
    };
    const _GetWarningTradeRestricted = function (toolId, itemId) {
        let strSpecialWarning = '';
        let strSpecialParam = null;
        const bIsPerfectWorld = MyPersonaAPI.GetLauncherType() === "perfectworld" ? true : false;
        if (!bIsPerfectWorld) {
            if (InventoryAPI.IsMarketable(itemId)) {
                if (!InventoryAPI.IsPotentiallyMarketable(toolId)) {
                    strSpecialParam = InventoryAPI.GetItemAttributeValue(toolId, "tradable after date");
                    if (strSpecialParam != null) {
                        strSpecialWarning = _GetSpecialWarningString(strSpecialParam, "#popup_can_stick_warning_marketrestricted" + m_toolToken);
                    }
                }
                else {
                    strSpecialWarning = _GetStickerMarketDateGreater(toolId, itemId);
                }
            }
        }
        else {
            strSpecialWarning = _GetStickerMarketDateGreater(toolId, itemId);
        }
        return strSpecialWarning;
    };
    const _GetStickerMarketDateGreater = function (toolId, itemId) {
        const rtTradableAfterSticker = InventoryAPI.GetItemAttributeValue(toolId, "{uint32}tradable after date");
        const rtTradableAfterWeapon = InventoryAPI.GetItemAttributeValue(itemId, "{uint32}tradable after date");
        if (rtTradableAfterSticker != null && (rtTradableAfterWeapon == null || rtTradableAfterSticker > rtTradableAfterWeapon)) {
            let strSpecialParam = null;
            strSpecialParam = InventoryAPI.GetItemAttributeValue(toolId, "tradable after date");
            if (strSpecialParam != null) {
                return _GetSpecialWarningString(strSpecialParam, "#popup_can_stick_warning_traderestricted" + m_toolToken);
            }
        }
        return '';
    };
    const _GetSpecialWarningString = function (strSpecialParam, warningText) {
        const elLabel = m_cP.FindChildInLayoutFile('CanStickerWarning');
        elLabel.SetDialogVariable('date', strSpecialParam);
        return warningText;
    };
    const _ShowStickerIconsToApplyOrRemove = function (toolId, itemId) {
        const elStickerToApply = m_cP.FindChildInLayoutFile('StickerToAppy');
        elStickerToApply.SetHasClass('hidden', m_isRemoveStickers);
        const elStickersToRemove = m_cP.FindChildInLayoutFile('StickersToRemove');
        elStickersToRemove.SetHasClass('hidden', !m_isRemoveStickers);
        if (m_isRemoveStickers) {
            const slotCount = InventoryAPI.GetItemStickerSlotCount(itemId);
            for (let i = 0; i < slotCount; i++) {
                const imagePath = InventoryAPI.GetItemStickerImageBySlot(itemId, i);
                if (imagePath) {
                    if (!m_SlotSelectedForScratch)
                        m_SlotSelectedForScratch = i;
                    const elSticker = $.CreatePanel('Button', elStickersToRemove, imagePath);
                    elSticker.BLoadLayoutSnippet('ScrapeStickerBtn');
                    elSticker.FindChildInLayoutFile('ScrapeStickerImage').SetImage('file://{images}' + imagePath + '_large.png');
                    elSticker.SetPanelEvent('onactivate', _OnScratchSticker.bind(undefined, elSticker, itemId, i));
                    elSticker.SetPanelEvent('onmouseover', _HighlightStickerBySlot.bind(undefined, i));
                    elSticker.SetPanelEvent('onmouseout', _HighlightStickerBySlot.bind(undefined, -1));
                }
            }
        }
        else {
            elStickerToApply.itemid = parseInt(toolId);
        }
    };
    const _SetUpAsyncActionBar = function (toolId, itemId) {
        m_cP.SetAttributeString('toolid', toolId);
        const elAsyncActionBarPanel = m_cP.FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.Init(elAsyncActionBarPanel, itemId, _GetSettingCallback, _AsyncActionPerformedCallback);
    };
    const _GetSettingCallback = function (settingname, defaultvalue) {
        return m_cP.GetAttributeString(settingname, defaultvalue);
    };
    const _AsyncActionPerformedCallback = function () {
        m_cP.FindChildInLayoutFile('CanStickerContinue').enabled = false;
        m_cP.FindChildInLayoutFile('CanStickerNextPos').enabled = false;
    };
    const _StickerBtnActions = function (toolId, itemId) {
        const slotsCount = m_isRemoveStickers ? InventoryAPI.GetItemStickerSlotCount(itemId) : m_emptySlotList.length;
        const elAsyncActionBarPanel = m_cP.FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.EnableDisableOkBtn(elAsyncActionBarPanel, false);
        const elContinueBtn = m_cP.FindChildInLayoutFile('CanStickerContinue');
        const elNextSlotBtn = m_cP.FindChildInLayoutFile('CanStickerNextPos');
        if (elContinueBtn)
            elContinueBtn.SetHasClass('hidden', m_isRemoveStickers || slotsCount == 1);
        if (elNextSlotBtn)
            elNextSlotBtn.SetHasClass('hidden', m_isRemoveStickers || slotsCount == 1);
        if (!m_isRemoveStickers) {
            if (slotsCount > 1) {
                if (elContinueBtn)
                    elContinueBtn.SetPanelEvent('onactivate', _OnContinue.bind(undefined, elContinueBtn));
                if (elNextSlotBtn)
                    elNextSlotBtn.SetPanelEvent('onactivate', _NextSlot.bind(undefined, elContinueBtn, toolId));
                _CameraAnim(_GetSelectedStickerSlot(), false);
            }
            else {
                _NextSlot(elContinueBtn, toolId, true);
                _OnContinue(elContinueBtn);
            }
        }
        else {
            _CameraAnim(m_SlotSelectedForScratch, false);
        }
    };
    const _OnContinue = function (elContinueBtn) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        const elAsyncActionBarPanel = m_cP.FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.EnableDisableOkBtn(elAsyncActionBarPanel, true);
        m_cP.SetAttributeString('selectedstickerslot', _GetSelectedStickerSlot().toString());
        m_cP.FindChildInLayoutFile('StickerToAppy').RemoveClass('popup-cansticker-pickedslot--anim');
        m_cP.FindChildInLayoutFile('StickerToAppy').AddClass('popup-cansticker-pickedslot--anim');
    };
    const _NextSlot = function (elContinueBtn, toolId, bDontIncrement) {
        if (!bDontIncrement)
            _ActiveSlotIndex.IncrementIndex();
        const activeIndex = _GetSelectedStickerSlot();
        _PreviewStickerInSlot(toolId, activeIndex);
        if (elContinueBtn)
            elContinueBtn.enabled = true;
        const elAsyncActionBarPanel = m_cP.FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.EnableDisableOkBtn(elAsyncActionBarPanel, false);
        _CameraAnim(activeIndex, true);
    };
    const _OnScratchSticker = function (elSticker, itemId, slotIndex) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_scratchOff', 'MOUSE');
        if (m_isPatch) {
            UiToolkitAPI.ShowGenericPopupTwoOptions($.Localize('#SFUI_Patch_Remove'), $.Localize('#SFUI_Patch_Remove_Desc'), '', $.Localize('#SFUI_Patch_Remove'), function () { InventoryAPI.WearItemSticker(itemId, slotIndex); }, $.Localize('#UI_Cancel'), function () { });
        }
        else if (InventoryAPI.IsItemStickerAtExtremeWear(itemId, slotIndex)) {
            UiToolkitAPI.ShowGenericPopupTwoOptions($.Localize('#SFUI_Sticker_Remove'), $.Localize('#SFUI_Sticker_Remove_Desc'), '', $.Localize('#SFUI_Sticker_Remove'), function () { InventoryAPI.WearItemSticker(itemId, slotIndex); }, $.Localize('#UI_Cancel'), function () { });
        }
        else {
            elSticker.FindChildInLayoutFile('ScrapingSpinner').RemoveClass('hidden');
            if (m_SlotSelectedForScratch != slotIndex) {
                _CameraAnim(slotIndex, true);
            }
            m_SlotSelectedForScratch = slotIndex;
            _HighlightStickerBySlot(slotIndex);
            InventoryAPI.WearItemSticker(itemId, slotIndex);
            m_scheduleHandle = $.Schedule(5, _CancelWaitforCallBack);
            const panelsList = m_cP.FindChildInLayoutFile('StickersToRemove').Children();
            panelsList.forEach(element => element.enabled = false);
        }
    };
    const _HighlightStickerBySlot = function (slotIndex) {
        if (m_isPatch) {
            InventoryAPI.HighlightPatchBySlot(slotIndex);
            _CameraAnim(slotIndex, false);
        }
        else {
            InventoryAPI.HighlightStickerBySlot(slotIndex);
        }
    };
    const _PreviewStickerInSlot = function (stickerId, slot) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_nextPosition', 'MOUSE');
        const slotIndex = slot;
        if (m_isPatch) {
            InventoryAPI.HighlightPatchBySlot(slotIndex);
        }
    };
    const _ActiveSlotIndex = (function () {
        let slotIndex = 0;
        const _IncrementIndex = function () {
            slotIndex++;
        };
        const _GetIndex = function () {
            return slotIndex;
        };
        return {
            IncrementIndex: _IncrementIndex,
            GetIndex: _GetIndex
        };
    })();
    const m_cameraRules = [
        { weapontype: 'weapon_elite', slotsForSecondCamera: [2, 3], cameraPreset: 1 },
        { weapontype: 'weapon_revolver', slotsForSecondCamera: [4], cameraPreset: 1 },
        { weapontype: 'weapon_nova', slotsForSecondCamera: [1, 2, 3], cameraPreset: 1 },
        { weapontype: 'weapon_m249', slotsForSecondCamera: [3], cameraPreset: 1 }
    ];
    const _CameraAnim = function (activeIndex, bTransition) {
        if (m_prevCameraSlot == activeIndex || activeIndex == -1)
            return;
        if (!InventoryAPI.IsItemInfoValid(m_elPreviewPanel.Data().id))
            return;
        const defName = ItemInfo.GetItemDefinitionName(m_elPreviewPanel.Data().id);
        m_prevCameraSlot = activeIndex;
    };
    function _UpdatePreviewPanelSettingsForPatchPosition(charItemId, oSettings, activeIndex = 0) {
        const patchPosition = InventoryAPI.GetCharacterPatchPosition(charItemId, activeIndex.toString());
        let loadoutslot;
        switch (patchPosition) {
            case 'chest':
                loadoutslot = 'secondary1';
                break;
            case 'back':
            case 'rightarm':
            case 'leftarm':
            case 'rightleg':
            case 'leftleg':
            default:
                loadoutslot = 'rifle1';
                break;
        }
        oSettings.loadoutSlot = loadoutslot;
        oSettings.weaponItemId = LoadoutAPI.GetItemID(oSettings.team, oSettings.loadoutSlot);
    }
    function _UpdatePreviewPanelCameraAndLightingForPatch(elPanel, charItemId, activeIndex = 0) {
        const patchPosition = InventoryAPI.GetCharacterPatchPosition(charItemId, activeIndex.toString());
        let angle = 0;
        let lightpos = undefined;
        let lightang = undefined;
        const lightbrt = 0.5;
        const lightpos_torso = [51.10, -9.16, 72.78];
        const lightang_torso = [23.98, 166.50, 0.00];
        const campos_torso = [189.90, -28.08, 46.37];
        const camang_torso = [-2.06, 171.74, 0.00];
        const lightpos_mid = [50.15, -10.03, 70.19];
        const lightang_mid = [23.98, 166.50, 0.00];
        const campos_mid = [188.43, -25.44, 38.53];
        const camang_mid = [-2.06, 171.74, 0.00];
        const lightpos_legs = [50.15, -10.03, 50.19];
        const lightang_legs = [23.98, 166.50, 0.00];
        const campos_legs = [188.43, -25.44, 18.53];
        const camang_legs = [-2.06, 171.74, 0.00];
        let campos = [0, 0, 0];
        let camang = [0, 0, 0];
        switch (patchPosition) {
            case 'chest':
                angle = 0;
                lightpos = lightpos_torso;
                lightang = lightang_torso;
                campos = campos_torso;
                camang = camang_torso;
                break;
            case 'back':
                angle = 180;
                lightpos = lightpos_torso;
                lightang = lightang_torso;
                campos = campos_torso;
                camang = camang_torso;
                break;
            case 'rightarm':
                angle = 40;
                lightpos = lightpos_torso;
                lightang = lightang_torso;
                campos = campos_torso;
                camang = camang_torso;
                break;
            case 'leftarm':
                angle = 280;
                lightpos = lightpos_torso;
                lightang = lightang_torso;
                campos = campos_torso;
                camang = camang_torso;
                break;
            case 'rightleg':
                angle = 65;
                lightpos = lightpos_legs;
                lightang = lightang_legs;
                campos = campos_legs;
                camang = camang_legs;
                break;
            case 'leftleg':
                angle = -90;
                lightpos = lightpos_legs;
                lightang = lightang_legs;
                campos = campos_legs;
                camang = camang_legs;
                break;
            case 'rightside':
                angle = 110;
                lightpos = lightpos_mid;
                lightang = lightang_mid;
                campos = campos_mid;
                camang = camang_mid;
                break;
            case 'rightpocket':
                angle = 40;
                lightpos = lightpos_mid;
                lightang = lightang_mid;
                campos = campos_mid;
                camang = camang_mid;
                break;
            default:
                angle = 0;
        }
        elPanel.SetCameraPosition(campos[0], campos[1], campos[2]);
        elPanel.SetCameraAngles(camang[0], camang[1], camang[2]);
        if (lightang)
            elPanel.SetFlashlightAngle(lightang[0], lightang[1], lightang[2]);
        if (lightpos)
            elPanel.SetFlashlightPosition(lightpos[0], lightpos[1], lightpos[2]);
        if (lightbrt)
            elPanel.SetFlashlightAmount(lightbrt);
        elPanel.SetSceneAngles(0, angle, 0, true);
    }
    const _GetSlotInfo = function (itemId) {
        const slotsCount = InventoryAPI.GetItemStickerSlotCount(itemId);
        const slotInfoList = [];
        for (let i = 0; i < slotsCount; i++) {
            const StickerPath = InventoryAPI.GetItemStickerImageBySlot(itemId, i);
            slotInfoList.push({ index: i, path: !StickerPath ? 'empty' : StickerPath });
        }
        return slotInfoList;
    };
    const _GetEmptyStickerSlots = function (slotInfoList) {
        return slotInfoList.filter(function (slot) {
            if (slot.path === 'empty')
                return true;
        });
    };
    const _GetSelectedStickerSlot = function () {
        const emptySlotCount = m_emptySlotList.length;
        const activeIndex = (_ActiveSlotIndex.GetIndex() % emptySlotCount);
        return m_emptySlotList[activeIndex].index;
    };
    const _ClosePopUp = function () {
        _CancelHandleForTimeout();
        const elAsyncActionBarPanel = m_cP.FindChildInLayoutFile('PopUpInspectAsyncBar');
        if (!elAsyncActionBarPanel.BHasClass('hidden')) {
            InspectAsyncActionBar.OnEventToClose();
        }
    };
    const _CancelWaitforCallBack = function () {
        m_scheduleHandle = null;
        _ClosePopUp();
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', function () {
        });
    };
    const _OnFinishedScratch = function () {
        _CancelHandleForTimeout();
        if (!m_cP)
            return;
        const elStickersToRemove = m_cP.FindChildInLayoutFile('StickersToRemove');
        if (elStickersToRemove) {
            const panelsList = m_cP.FindChildInLayoutFile('StickersToRemove').Children();
            panelsList.forEach(element => {
                element.enabled = true;
                element.FindChildInLayoutFile('ScrapingSpinner').AddClass('hidden');
            });
            if (m_isPatch) {
            }
            else {
                InspectModelImage.Init(m_elPreviewPanel, m_elPreviewPanel.Data().id);
            }
            _CameraAnim(m_SlotSelectedForScratch, false);
        }
    };
    const _CancelHandleForTimeout = function () {
        if (m_scheduleHandle !== null) {
            $.CancelScheduled(m_scheduleHandle);
            m_scheduleHandle = null;
        }
    };
    return {
        Init: _Init,
        ClosePopUp: _ClosePopUp,
        NextSlot: _NextSlot,
        OnFinishedScratch: _OnFinishedScratch,
        UpdatePreviewPanelCameraAndLightingForPatch: _UpdatePreviewPanelCameraAndLightingForPatch,
        UpdatePreviewPanelSettingsForPatchPosition: _UpdatePreviewPanelSettingsForPatchPosition,
    };
})();
(function () {
    $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', CapabilityCanSticker.OnFinishedScratch);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9jYW5fc3RpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvcHVwX2NhcGFiaWxpdHlfY2FuX3N0aWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUNBQXFDO0FBQ3JDLHNDQUFzQztBQUN0Qyw4Q0FBOEM7QUFFOUMsSUFBSSxvQkFBb0IsR0FBRyxDQUFFO0lBUTVCLElBQUksZUFBZSxHQUF3QixJQUFJLENBQUM7SUFDaEQsSUFBSSxnQkFBZ0IsR0FBa0IsSUFBSSxDQUFDO0lBQzNDLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0lBQy9CLElBQUksd0JBQXdCLEdBQWtCLElBQUksQ0FBQztJQUNuRCxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDeEIsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNqQyxJQUFJLFdBQVcsR0FBa0IsSUFBSSxDQUFDO0lBQ3RDLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFFLENBQUM7SUFFM0UsSUFBSSxnQkFBZ0IsR0FBa0IsSUFBSSxDQUFDO0lBRTNDLE1BQU0sS0FBSyxHQUFHO1FBRWIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFFLDJCQUEyQixFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBR3JGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUUsR0FBRyxDQUFFLENBQUM7UUFDbkMsa0JBQWtCLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDN0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FB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
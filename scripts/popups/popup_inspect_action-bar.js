/// <reference path="../csgo.d.ts" />
/// <reference path="../common/item_context_entries.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../characterbuttons.ts" />
var InspectActionBar = (function () {
    let m_modelImagePanel = null;
    let m_itemId = '';
    let m_callbackHandle = -1;
    let m_showCert = true;
    let m_showEquip = true;
    let m_insideCasketID = '';
    let m_showMaketLink = false;
    let m_showCharSelect = true;
    let m_blurOperationPanel = false;
    let m_previewingMusic = false;
    let m_schfnMusicMvpPreviewEnd = null;
    const _Init = function (elPanel, itemId, funcGetSettingCallback, funcGetSettingCallbackInt, elItemModelImagePanel) {
        if (funcGetSettingCallback('inspectonly', 'false') === 'false')
            return;
        elPanel.RemoveClass('hidden');
        m_modelImagePanel = elItemModelImagePanel;
        m_itemId = itemId;
        m_callbackHandle = funcGetSettingCallbackInt('callback', -1);
        m_showCert = (funcGetSettingCallback('showitemcert', 'true') === 'false');
        m_showEquip = (funcGetSettingCallback('showequip', 'true') === 'false');
        m_insideCasketID = funcGetSettingCallback('insidecasketid', '');
        m_showMaketLink = (funcGetSettingCallback('showmarketlink', 'false') === 'true');
        m_showCharSelect = (funcGetSettingCallback('showcharselect', 'true') === 'true');
        m_blurOperationPanel = ($.GetContextPanel().GetAttributeString('bluroperationpanel', 'false') === 'true') ? true : false;
        _SetUpItemCertificate(elPanel, itemId);
        _SetupEquipItemBtns(elPanel, itemId);
        _ShowButtonsForWeaponInspect(elPanel, itemId);
        _ShowButtonsForCharacterInspect(elPanel, itemId);
        _SetCloseBtnAction(elPanel);
        _SetUpMarketLink(elPanel, itemId);
        const slot = ItemInfo.GetSlot(itemId);
        if (slot == "musickit") {
            InventoryAPI.PlayItemPreviewMusic(itemId, '');
            m_previewingMusic = true;
            const elMusicBtn = elPanel.FindChildInLayoutFile('InspectPlayMvpBtn');
            elMusicBtn.SetHasClass('hidden', (InventoryAPI.GetItemRarity(itemId) <= 0));
        }
    };
    const _SetUpItemCertificate = function (elPanel, id) {
        const elCert = elPanel.FindChildInLayoutFile('InspectItemCert');
        if (!elCert || !elCert.IsValid()) {
            return;
        }
        const certData = InventoryAPI.GetItemCertificateInfo(id);
        if (!certData || m_showCert) {
            elCert.visible = false;
            return;
        }
        const aCertData = certData.split("\n");
        let strLine = "";
        for (let i = 0; i < aCertData.length - 1; i++) {
            if (i % 2 == 0) {
                strLine = strLine + "<b>" + aCertData[i] + "</b>" + ": " + aCertData[i + 1] + "<br><br>";
            }
        }
        elCert.visible = true;
        elCert.SetPanelEvent('onmouseover', function () {
            UiToolkitAPI.ShowTextTooltip('InspectItemCert', strLine);
        });
        elCert.SetPanelEvent('onmouseout', function () {
            UiToolkitAPI.HideTextTooltip();
        });
    };
    const _SetUpMarketLink = function (elPanel, id) {
        const elMarketLinkBtn = elPanel.FindChildInLayoutFile('InspectMarketLink');
        elMarketLinkBtn.SetHasClass('hidden', !m_showMaketLink);
        if (!m_showMaketLink) {
            return;
        }
        elMarketLinkBtn.SetPanelEvent('onmouseover', function () {
            UiToolkitAPI.ShowTextTooltip('InspectMarketLink', '#SFUI_Store_Market_Link');
        });
        elMarketLinkBtn.SetPanelEvent('onmouseout', function () {
            UiToolkitAPI.HideTextTooltip();
        });
        elMarketLinkBtn.SetPanelEvent('onactivate', function () {
            SteamOverlayAPI.OpenURL(ItemInfo.GetMarketLinkForLootlistItem(id));
            StoreAPI.RecordUIEvent("ViewOnMarket");
        });
    };
    const _SetupEquipItemBtns = function (elPanel, id) {
        const elMoreActionsBtn = elPanel.FindChildInLayoutFile('InspectActionsButton');
        const elSingleActionBtn = elPanel.FindChildInLayoutFile('SingleAction');
        if (m_insideCasketID) {
            elMoreActionsBtn.AddClass('hidden');
            elSingleActionBtn.RemoveClass('hidden');
            elSingleActionBtn.text = '#popup_casket_action_remove';
            elSingleActionBtn.SetPanelEvent('onactivate', () => _OnMoveItemFromCasketToInventory(m_insideCasketID, id));
            return;
        }
        if (m_showEquip) {
            elMoreActionsBtn.AddClass('hidden');
            elSingleActionBtn.AddClass('hidden');
            return;
        }
        const isFanToken = ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_pass_');
        const isSticker = ItemInfo.ItemMatchDefName(id, 'sticker');
        const isPatch = ItemInfo.ItemMatchDefName(id, 'patch');
        const isSpraySealed = ItemInfo.IsSpraySealed(id);
        const isEquipped = (ItemInfo.IsEquippedForT(id) || ItemInfo.IsEquippedForCT(id) || ItemInfo.IsEquippedForNoTeam(id)) ? true : false;
        if (ItemInfo.IsEquippalbleButNotAWeapon(id) ||
            isSticker ||
            isSpraySealed ||
            isFanToken ||
            isPatch ||
            isEquipped) {
            elMoreActionsBtn.AddClass('hidden');
            if (!isEquipped) {
                _SetUpSingleActionBtn(elPanel, id, (isSticker || isSpraySealed || isFanToken || isPatch));
            }
            return;
        }
        else {
            elMoreActionsBtn.RemoveClass('hidden');
            elSingleActionBtn.AddClass('hidden');
        }
    };
    const _SetUpSingleActionBtn = function (elPanel, id, closeInspect) {
        const validEntries = ItemContextEntires.FilterEntries('inspect');
        const elSingleActionBtn = elPanel.FindChildInLayoutFile('SingleAction');
        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];
            if (entry.AvailableForItem(id)) {
                let displayName = '';
                if (entry.name instanceof Function) {
                    displayName = entry.name(id);
                }
                else {
                    displayName = entry.name;
                }
                elSingleActionBtn.text = '#inv_context_' + displayName;
                elSingleActionBtn.SetPanelEvent('onactivate', () => _OnSingleAction(entry, id, closeInspect));
                elSingleActionBtn.RemoveClass('hidden');
            }
        }
    };
    const _OnSingleAction = function (entry, id, closeInspect) {
        if (closeInspect) {
            _CloseBtnAction();
        }
        entry.OnSelected(id);
    };
    const _OnMoveItemFromCasketToInventory = function (idCasket, idSubjectItem) {
        _CloseBtnAction();
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=remove' +
            '&nextcapability=casketcontents' +
            '&spinner=1' +
            '&casket_item_id=' + idCasket +
            '&subject_item_id=' + idSubjectItem);
    };
    const _ShowButtonsForWeaponInspect = function (elPanel, id) {
        if (m_showCharSelect === false) {
            return;
        }
        const hasAnims = ItemInfo.IsCharacter(id) || ItemInfo.IsWeapon(id);
        if (hasAnims &&
            !ItemInfo.IsEquippalbleButNotAWeapon(id) &&
            !ItemInfo.ItemMatchDefName(id, 'sticker') &&
            !ItemInfo.IsSpraySealed(id) &&
            !ItemInfo.ItemDefinitionNameSubstrMatch(id, "tournament_journal_") &&
            !ItemInfo.ItemDefinitionNameSubstrMatch(id, "tournament_pass_")) {
            elPanel.FindChildInLayoutFile('InspectCharBtn').SetHasClass('hidden', !hasAnims);
            elPanel.FindChildInLayoutFile('InspectWeaponBtn').SetHasClass('hidden', !hasAnims);
            const list = CharacterAnims.GetValidCharacterModels(true).filter(function (entry) {
                return (ItemInfo.IsItemCt(id) && (entry.team === 'ct' || entry.team === 'any')) ||
                    (ItemInfo.IsItemT(id) && (entry.team === 't' || entry.team === 'any')) ||
                    ItemInfo.IsItemAnyTeam(id);
            });
            if (list && (list.length > 0))
                _SetDropdown(elPanel, list, id);
        }
    };
    function _ShowButtonsForCharacterInspect(elPanel, id) {
        const elPreviewPanel = InspectModelImage.GetModelPanel();
        if (!ItemInfo.IsCharacter(id))
            return;
        elPanel.FindChildInLayoutFile('id-character-button-container').SetHasClass('hidden', false);
        const inspectCameraPresets = {
            "AspectRatio4x3": [16, 17],
            "AspectRatio16x9": [26, 27],
            "AspectRatio21x9": [28, 29]
        };
        let arrCameraSetToUse = inspectCameraPresets.AspectRatio4x3;
        if ($.GetContextPanel().BAscendantHasClass("AspectRatio16x9") ||
            $.GetContextPanel().BAscendantHasClass("AspectRatio16x10")) {
            arrCameraSetToUse = inspectCameraPresets.AspectRatio16x9;
        }
        else if ($.GetContextPanel().BAscendantHasClass("AspectRatio21x9")) {
            arrCameraSetToUse = inspectCameraPresets.AspectRatio21x9;
        }
        const characterToolbarButtonSettings = {
            charItemId: id,
            cameraPresetUnzoomed: arrCameraSetToUse[0],
            cameraPresetZoomed: arrCameraSetToUse[1]
        };
        const elCharacterButtons = elPanel.FindChildInLayoutFile('id-character-buttons');
        CharacterButtons.InitCharacterButtons(elCharacterButtons, elPreviewPanel, characterToolbarButtonSettings);
    }
    const _SetDropdown = function (elPanel, vaildEntiresList, id) {
        const currentMainMenuVanitySettings = ItemInfo.GetOrUpdateVanityCharacterSettings(ItemInfo.IsItemAnyTeam(id) ? null
            : LoadoutAPI.GetItemID(ItemInfo.IsItemCt(id) ? 'ct' : 't', 'customplayer'));
        const elDropdown = elPanel.FindChildInLayoutFile('InspectDropdownCharModels');
        vaildEntiresList.forEach(function (entry) {
            const rarityColor = ItemInfo.GetRarityColor(entry.itemId);
            const newEntry = $.CreatePanelWithProperties('Label', elDropdown, entry.itemId, {
                'class': 'DropDownMenu',
                'html': 'true',
                'text': "<font color='" + rarityColor + "'>•</font> " + entry.label,
                'data-team': (entry.team === 'any') ? ((ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id)) ? 't' : 'ct') : entry.team
            });
            elDropdown.AddOption(newEntry);
        });
        elDropdown.SetPanelEvent('oninputsubmit', () => InspectActionBar.OnUpdateCharModel(false, elDropdown, id));
        elDropdown.SetSelected(currentMainMenuVanitySettings.charItemId);
        elDropdown.SetPanelEvent('oninputsubmit', () => InspectActionBar.OnUpdateCharModel(true, elDropdown, id));
    };
    const _OnUpdateCharModel = function (bPlaySound, elDropdown, weaponItemId) {
        const characterItemId = elDropdown.GetSelected().id;
        InspectModelImage.SetCharScene(m_modelImagePanel, characterItemId, weaponItemId);
    };
    const _NavigateModelPanel = function (type) {
        InspectModelImage.ShowHideItemPanel((type !== 'InspectModelChar'));
        InspectModelImage.ShowHideCharPanel((type === 'InspectModelChar'));
        $.GetContextPanel().FindChildTraverse('InspectCharModelsControls').SetHasClass('hidden', type !== 'InspectModelChar');
    };
    const _InspectPlayMusic = function (type) {
        if (!m_previewingMusic)
            return;
        if (type === 'mvp') {
            if (m_schfnMusicMvpPreviewEnd)
                return;
            InventoryAPI.StopItemPreviewMusic();
            InventoryAPI.PlayItemPreviewMusic(m_itemId, 'MVPPreview');
            m_schfnMusicMvpPreviewEnd = $.Schedule(6.8, InspectActionBar.InspectPlayMusic.bind(null, 'schfn'));
        }
        else if (type === 'schfn') {
            m_schfnMusicMvpPreviewEnd = null;
            InventoryAPI.StopItemPreviewMusic();
            InventoryAPI.PlayItemPreviewMusic(m_itemId, '');
        }
    };
    const _ShowContextMenu = function () {
        const elBtn = $.GetContextPanel().FindChildTraverse('InspectActionsButton');
        const id = m_itemId;
        const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(elBtn.id, '', 'file://{resources}/layout/context_menus/context_menu_inventory_item.xml', 'itemid=' + id + '&populatefiltertext=inspect', function () {
            $.DispatchEvent("CSGOPlaySoundEffect", "weapon_selectReplace", "MOUSE");
        });
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    };
    const _SetCloseBtnAction = function (elPanel) {
        const elBtn = elPanel.FindChildInLayoutFile('InspectCloseBtn');
        elBtn.SetPanelEvent('onactivate', _CloseBtnAction);
    };
    const _CloseBtnAction = function () {
        $.DispatchEvent("CSGOPlaySoundEffect", "inventory_inspect_close", "MOUSE");
        if (m_modelImagePanel && m_modelImagePanel.IsValid()) {
            InspectModelImage.CancelCharAnim(m_modelImagePanel);
        }
        $.DispatchEvent('UIPopupButtonClicked', '');
        const callbackFunc = m_callbackHandle;
        if (callbackFunc != -1) {
            UiToolkitAPI.InvokeJSCallback(callbackFunc);
        }
        if (m_blurOperationPanel) {
            $.DispatchEvent('UnblurOperationPanel');
        }
        if (m_previewingMusic) {
            InventoryAPI.StopItemPreviewMusic();
            m_previewingMusic = false;
            if (m_schfnMusicMvpPreviewEnd) {
                $.CancelScheduled(m_schfnMusicMvpPreviewEnd);
                m_schfnMusicMvpPreviewEnd = null;
            }
        }
    };
    return {
        Init: _Init,
        ShowContextMenu: _ShowContextMenu,
        CloseBtnAction: _CloseBtnAction,
        NavigateModelPanel: _NavigateModelPanel,
        InspectPlayMusic: _InspectPlayMusic,
        OnUpdateCharModel: _OnUpdateCharModel
    };
})();
(function () {
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9hY3Rpb24tYmFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9wdXBfaW5zcGVjdF9hY3Rpb24tYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFDQUFxQztBQUNyQywwREFBMEQ7QUFDMUQsc0NBQXNDO0FBQ3RDLCtDQUErQztBQUUvQyxJQUFJLGdCQUFnQixHQUFHLENBQUU7SUFHeEIsSUFBSSxpQkFBaUIsR0FBbUIsSUFBSSxDQUFDO0lBQzdDLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNsQixJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRzFCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQztJQUN0QixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDMUIsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO0lBQzVCLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0lBQzVCLElBQUksb0JBQW9CLEdBQUcsS0FBSyxDQUFDO0lBQ2pDLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO0lBQzlCLElBQUkseUJBQXlCLEdBQWtCLElBQUksQ0FBQztJQUVwRCxNQUFNLEtBQUssR0FBRyxVQUFXLE9BQWdCLEVBQUUsTUFBYyxFQUFFLHNCQUF3RSxFQUFFLHlCQUEyRSxFQUFFLHFCQUE4QjtRQUUvTyxJQUFLLHNCQUFzQixDQUFFLGFBQWEsRUFBRSxPQUFPLENBQUUsS0FBSyxPQUFPO1lBQ2hFLE9BQU87UUFFUixPQUFPLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRWhDLGlCQUFpQixHQUFHLHFCQUFxQixDQUFDO1FBQzFDLFFBQVEsR0FBRyxNQUFNLENBQUM7UUFDbEIsZ0JBQWdCLEdBQUcseUJBQXlCLENBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDL0QsVUFBVSxHQUFHLENBQUUsc0JBQXNCLENB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
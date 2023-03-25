/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="popup_capability_can_sticker.ts" />
var AcknowledgeItems = (function () {
    let m_isCapabliltyPopupOpen = false;
    const _OnLoad = function () {
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', AcknowledgeItems.Init);
        _Init();
    };
    const _Init = function () {
        const items = _GetItems();
        if (items.length < 1) {
            $.DispatchEvent('UIPopupButtonClicked', '');
            return;
        }
        const numItems = items.length;
        _AcknowledgeAllItems.SetItemsToSaveAsNew(items);
        const elParent = $.GetContextPanel().FindChildInLayoutFile('AcknowledgeItemsCarousel');
        elParent.RemoveAndDeleteChildren();
        for (let i = 0; i < items.length; i++) {
            const elDelayLoadPanel = $.CreatePanelWithProperties('CSGODelayLoadPanel', elParent, 'carousel_delay_load_' + i, { class: 'Offscreen' });
            elDelayLoadPanel.SetLoadFunction(_MakeItemPanel.bind(null, items[i], i, numItems));
            elDelayLoadPanel.ListenForClassRemoved('Offscreen');
        }
    };
    const _MakeItemPanel = function (item, index, numItems, elParent) {
        const elItemTile = $.CreatePanel('Panel', elParent, item.id);
        elItemTile.BLoadLayoutSnippet('Item');
        const modelPath = _ShowModelOrItem(elItemTile, item.id, item.type);
        _ResizeForVerticalItem(elItemTile, item.id);
        const rarityColor = ItemInfo.GetRarityColor(item.id);
        _SetTitle(elItemTile, item, rarityColor);
        _SetParticlesBg(elItemTile, rarityColor, modelPath, item.id);
        _ColorRarityBar(elItemTile, rarityColor);
        _SetItemName(elItemTile, item.id);
        _ShowGiftPanel(elItemTile, item.id);
        _ShowSetPanel(elItemTile, item.id);
        _ItemCount(elItemTile, index, numItems);
    };
    const _ShowModelOrItem = function (elItemTile, id, type = "") {
        var elItemModelImagePanel = elItemTile.FindChildInLayoutFile('PopUpInspectModelOrImage');
        elItemModelImagePanel.Data().useAcknowledge = !(ItemInfo.IsSprayPaint(id) || ItemInfo.IsSpraySealed(id));
        return InspectModelImage.Init(elItemModelImagePanel, id);
    };
    const _ResizeForVerticalItem = function (elItemTile, id) {
        if (ItemInfo.IsCharacter(id)) {
            var elPanel = elItemTile.FindChildInLayoutFile('AcknowledgeItemContainer');
            elPanel.AddClass('popup-acknowledge__item__model--vertical');
        }
    };
    const _SetItemName = function (elItemTile, id) {
        const elLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemLabel');
        elLabel.text = ItemInfo.GetName(id);
    };
    const _SetTitle = function (elItemTile, item, rarityColor) {
        const isOperationReward = item.pickuptype === 'quest_reward';
        const defName = InventoryAPI.GetItemDefinitionName(item.id);
        const elTitle = elItemTile.FindChildInLayoutFile('AcknowledgeItemTitle');
        const titleSuffex = isOperationReward ? 'quest_reward' : item.type;
        if (defName === 'casket' && item.type === 'nametag_add') {
            elTitle.text = $.Localize('#CSGO_Tool_Casket_Tag');
        }
        else {
            const idxOfExtraParams = titleSuffex.indexOf("[");
            const typeWithoutParams = (idxOfExtraParams > 0) ? titleSuffex.substring(0, idxOfExtraParams) : titleSuffex;
            elTitle.text = $.Localize('#popup_title_' + typeWithoutParams);
        }
        if (isOperationReward) {
            const tier = ItemInfo.GetRewardTier(item.id);
        }
        elTitle.style.washColor = rarityColor;
    };
    const _SetParticlesBg = function (elItemTile, rarityColor, modelPath, itemId) {
        const oColor = _HexColorToRgb(rarityColor);
        let elParticlePanel = elItemTile.FindChildInLayoutFile('popup-acknowledge__item__particle');
        elParticlePanel.visible = !modelPath;
        if (!modelPath) {
            elParticlePanel.SetParticleNameAndRefresh('particles/ui/ui_item_present_bokeh.vpcf');
            elParticlePanel.SetControlPoint(16, oColor.r, oColor.g, oColor.b);
            elParticlePanel.StartParticles();
            return;
        }
        elParticlePanel.StopParticlesImmediately(false);
    };
    const _HexColorToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    };
    const _ColorRarityBar = function (elItemTile, rarityColor) {
        const elBar = elItemTile.FindChildInLayoutFile('AcknowledgeBar');
        elBar.style.washColor = rarityColor;
    };
    const _ShowGiftPanel = function (elItemTile, id) {
        const elPanel = elItemTile.FindChildInLayoutFile('AcknowledgeItemGift');
        const gifterId = ItemInfo.GetGifter(id);
        elPanel.SetHasClass('hidden', gifterId === '');
        const elLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemGiftLabel');
        elLabel.SetDialogVariable('name', FriendsListAPI.GetFriendName(gifterId));
        elLabel.text = $.Localize('#acknowledge_gifter', elLabel);
    };
    const _ShowQuestPanel = function (elItemTile, id) {
        const elPanel = elItemTile.FindChildInLayoutFile('AcknowledgeItemQuest');
        elPanel.SetHasClass('hidden', 'quest_reward' !== ItemInfo.GetItemPickUpMethod(id));
        const nTierReward = ItemInfo.GetRewardTier(id);
        const bPremium = ItemInfo.BIsRewardPremium(id);
        elPanel.SetHasClass("tier-reward", nTierReward > 0);
        elPanel.SetHasClass("premium", bPremium);
        if (nTierReward > 0) {
            elPanel.SetDialogVariableInt("tier_num", nTierReward);
        }
    };
    const _ShowSetPanel = function (elItemTile, id) {
        const elPanel = elItemTile.FindChildInLayoutFile('AcknowledgeItemSet');
        const strSetName = InventoryAPI.GetTag(id, 'ItemSet');
        if (!strSetName || strSetName === '0') {
            elPanel.SetHasClass('hide', true);
            return;
        }
        const setName = InventoryAPI.GetTagString(strSetName);
        if (!setName) {
            elPanel.SetHasClass('hide', true);
            return;
        }
        const elLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemSetLabel');
        elLabel.text = setName;
        const elImage = elItemTile.FindChildInLayoutFile('AcknowledgeItemSetImage');
        elImage.SetImage('file://{images}/econ/set_icons/' + strSetName + '_small.png');
        elPanel.SetHasClass('hide', false);
    };
    const _ItemCount = function (elItemTile, index, numItems) {
        const elCountLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemCount');
        if (numItems < 2) {
            elCountLabel.visible = false;
            return;
        }
        elCountLabel.visible = true;
        elCountLabel.text = (index + 1) + ' / ' + numItems;
    };
    const _ShowEquipItem = function (elItemTile, id) {
        const subSlot = ItemInfo.GetSlotSubPosition(id);
        if (!subSlot || subSlot === '')
            return;
        const elEquipBtn = elItemTile.FindChildInLayoutFile('AcknowledgeEquipBtn');
        elEquipBtn.RemoveClass('hidden');
    };
    const _GetItems = function () {
        const newItems = [];
        const itemCount = InventoryAPI.GetUnacknowledgeItemsCount();
        for (let i = 0; i < itemCount; i++) {
            const itemId = InventoryAPI.GetUnacknowledgeItemByIndex(i);
            const pickUpType = ItemInfo.GetItemPickUpMethod(itemId);
            if (_ItemstoAcknowlegeRightAway(itemId))
                InventoryAPI.AcknowledgeNewItembyItemID(itemId);
            else
                newItems.unshift({ type: 'acknowledge', id: itemId, pickuptype: pickUpType });
        }
        const getUpdateItem = _GetUpdatedItem();
        if (getUpdateItem && newItems.filter(item => item.id === getUpdateItem.id).length < 1) {
            newItems.push(getUpdateItem);
        }
        const rewardItems = newItems.filter(item => item.pickuptype === "quest_reward");
        const otherItems = newItems.filter(item => item.pickuptype !== "quest_reward");
        return rewardItems.concat(otherItems);
    };
    const _GetItemsByType = function (afilters, bShouldAcknowledgeItems) {
        const aItems = _GetItems();
        const filterByDefNames = function (oItem) {
            return afilters.includes(ItemInfo.GetItemDefinitionName(oItem.id));
        };
        const alist = aItems.filter(filterByDefNames);
        if (bShouldAcknowledgeItems) {
            _AcknowledgeAllItems.SetItemsToSaveAsNew(alist);
            _AcknowledgeAllItems.AcknowledgeItems();
        }
        return alist.map(item => item.id);
    };
    const _GetUpdatedItem = function () {
        const itemidExplicitAcknowledge = $.GetContextPanel().GetAttributeString("ackitemid", '');
        if (itemidExplicitAcknowledge === '')
            return null;
        return {
            id: itemidExplicitAcknowledge,
            type: $.GetContextPanel().GetAttributeString("acktype", '')
        };
    };
    const _ItemstoAcknowlegeRightAway = function (id) {
        const itemType = InventoryAPI.GetItemTypeFromEnum(id);
        return itemType === 'quest' || itemType === 'coupon_crate' || itemType === 'campaign';
    };
    const _AcknowledgeAllItems = (function () {
        let itemsToSave = [];
        const _SetItemsToSaveAsNew = function (items) {
            itemsToSave = items;
        };
        const _AcknowledgeItems = function () {
            itemsToSave.forEach(function (item) {
                InventoryAPI.SetItemSessionPropertyValue(item.id, 'item_pickup_method', ItemInfo.GetItemPickUpMethod(item.id));
                if (item.type === 'acknowledge') {
                    InventoryAPI.SetItemSessionPropertyValue(item.id, 'recent', '1');
                    InventoryAPI.AcknowledgeNewItembyItemID(item.id);
                }
                else {
                    InventoryAPI.SetItemSessionPropertyValue(item.id, 'updated', '1');
                    $.DispatchEvent('RefreshActiveInventoryList');
                }
            });
        };
        const _OnActivate = function () {
            _AcknowledgeItems();
            InventoryAPI.AcknowledgeNewBaseItems();
            const callbackResetAcknowlegePopupHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
            if (callbackResetAcknowlegePopupHandle != -1) {
                UiToolkitAPI.InvokeJSCallback(callbackResetAcknowlegePopupHandle);
            }
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_new_item_accept', 'MOUSE');
        };
        return {
            SetItemsToSaveAsNew: _SetItemsToSaveAsNew,
            AcknowledgeItems: _AcknowledgeItems,
            OnActivate: _OnActivate
        };
    })();
    const _SetIsCapabilityPopUpOpen = function (isOpen) {
        m_isCapabliltyPopupOpen = isOpen;
    };
    return {
        Init: _Init,
        OnLoad: _OnLoad,
        GetItems: _GetItems,
        GetItemsByType: _GetItemsByType,
        AcknowledgeAllItems: _AcknowledgeAllItems,
        SetIsCapabilityPopUpOpen: _SetIsCapabilityPopUpOpen
    };
})();
(function () {
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWNrbm93bGVkZ2VfaXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvcHVwX2Fja25vd2xlZGdlX2l0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUM5Qyx3REFBd0Q7QUFFeEQsSUFBSSxnQkFBZ0IsR0FBRyxDQUFFO0lBU3hCLElBQUksdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0lBRXBDLE1BQU0sT0FBTyxHQUFHO1FBRWYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDhDQUE4QyxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBRSxDQUFDO1FBQ3JHLEtBQUssRUFBRSxDQUFDO0lBQ1QsQ0FBQyxDQUFDO0lBRUYsTUFBTSxLQUFLLEdBQUc7UUFFYixNQUFNLEtBQUssR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUUxQixJQUFLLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUNyQjtZQUNDLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDOUMsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUM5QixvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUdsRCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsMEJBQTBCLENBQUUsQ0FBQztRQUN6RixRQUFRLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUVuQyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDdEM7WUFDQyxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FDbkQsb0JBQW9CLEVBQ3BCLFFBQVEsRUFDUixzQkFBc0IsR0FBRyxDQUFDLEVBQzFCLEVBQUUsS0FBSyxFQUFFLFdBQVcs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
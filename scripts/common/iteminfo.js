/// <reference path="../csgo.d.ts" />
/// <reference path="formattext.ts" />
/// <reference path="characteranims.ts" />
var ItemInfo = (function () {
    const _GetRarityColor = function (id) {
        return InventoryAPI.GetItemRarityColor(id);
    };
    const _GetFormattedName = function (id) {
        const strName = _GetName(id);
        if (InventoryAPI.HasCustomName(id)) {
            return new CFormattedText('#CSGO_ItemName_Custom', { item_name: strName });
        }
        else {
            const splitLoc = strName.indexOf('|');
            if (splitLoc >= 0) {
                const strWeaponName = strName.substring(0, splitLoc).trim();
                const strPaintName = strName.substring(splitLoc + 1).trim();
                return new CFormattedText('#CSGO_ItemName_Painted', { item_name: strWeaponName, paintkit_name: strPaintName });
            }
            return new CFormattedText('#CSGO_ItemName_Base', { item_name: strName });
        }
    };
    const _AddItemToShuffle = function (id, team) {
        return LoadoutAPI.AddItemToShuffle(id, team);
    };
    const _RemoveItemFromShuffle = function (id, team) {
        return LoadoutAPI.RemoveItemFromShuffle(id, team);
    };
    const _IsItemInShuffleForTeam = function (id, team) {
        return LoadoutAPI.IsItemInShuffleForTeam(id, team);
    };
    const _ClearShuffle = function (id, team) {
        return LoadoutAPI.ClearShuffle(id, team);
    };
    const _SetShuffleEnabled = function (id, team, enable) {
        return LoadoutAPI.SetShuffleEnabled(id, team, enable);
    };
    const _IsShuffleEnabled = function (id, team) {
        return LoadoutAPI.IsShuffleEnabled(id, team);
    };
    const _IsShuffleAllowed = function (id) {
        return LoadoutAPI.IsShuffleAllowed(id);
    };
    const _CountItemsInInventoryForShuffleSlot = function (id, team) {
        return LoadoutAPI.CountItemsInInventoryForShuffleSlot(id, team);
    };
    const _EnsureShuffleItemEquipped = function (itemID, team) {
        const equippedItemID = ItemInfo.GetItemIdForItemEquippedInLoadoutSlot(itemID, team);
        if (!LoadoutAPI.IsItemInShuffleForTeam(equippedItemID, team)) {
            LoadoutAPI.ShuffleEquipmentInSlot(equippedItemID, team);
        }
    };
    const _GetName = function (id) {
        return InventoryAPI.GetItemName(id);
    };
    const _IsEquippedForCT = function (id) {
        return InventoryAPI.IsEquipped(id, 'ct');
    };
    const _IsEquippedForT = function (id) {
        return InventoryAPI.IsEquipped(id, 't');
    };
    const _IsEquippedForNoTeam = function (id) {
        return InventoryAPI.IsEquipped(id, "noteam");
    };
    const _IsEquipped = function (id, team) {
        return InventoryAPI.IsEquipped(id, team);
    };
    const _GetSlot = function (id) {
        return InventoryAPI.GetSlot(id);
    };
    const _GetSlotSubPosition = function (id) {
        return InventoryAPI.GetSlotSubPosition(id);
    };
    const _IsLoadoutSlotSubPositionAWeapon = function (slotSubPosition) {
        return InventoryAPI.IsLoadoutSlotSubPositionAWeapon(slotSubPosition);
    };
    const _GetTeam = function (id) {
        return InventoryAPI.GetItemTeam(id);
    };
    const _IsSpraySealed = function (id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'spray');
    };
    const _IsSprayPaint = function (id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'spraypaint');
    };
    const _IsTradeUpContract = function (id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'Recipe Trade Up');
    };
    const _GetSprayTintColor = function (id) {
        return InventoryAPI.GetSprayTintColorCode(id);
    };
    const _IsTool = function (id) {
        return InventoryAPI.IsTool(id);
    };
    const _GetCapabilitybyIndex = function (id, index) {
        return InventoryAPI.GetItemCapabilityByIndex(id, index);
    };
    const _GetCapabilityCount = function (id) {
        return InventoryAPI.GetItemCapabilitiesCount(id);
    };
    const _ItemHasCapability = function (id, capName) {
        const caps = [];
        const capCount = _GetCapabilityCount(id);
        for (let i = 0; i < capCount; i++) {
            caps.push(_GetCapabilitybyIndex(id, i));
        }
        return caps.includes(capName);
    };
    const _GetChosenActionItemsCount = function (id, capability) {
        return InventoryAPI.GetChosenActionItemsCount(id, capability);
    };
    const _GetChosenActionItemIDByIndex = function (id, capability, index) {
        return InventoryAPI.GetChosenActionItemIDByIndex(id, capability, index);
    };
    const _GetKeyForCaseInXray = function (caseId) {
        const numActionItems = _GetChosenActionItemsCount(caseId, 'decodable');
        if (numActionItems > 0) {
            const aKeyIds = [];
            for (let i = 0; i < numActionItems; i++) {
                aKeyIds.push(_GetChosenActionItemIDByIndex(caseId, 'decodable', i));
            }
            aKeyIds.sort();
            return aKeyIds[0];
        }
        return '';
    };
    const _GetItemsInXray = function () {
        InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'xraymachine', '', '');
        const count = InventoryAPI.GetInventoryCount();
        if (count === 0) {
            return {};
        }
        let xrayCaseId = '';
        let xrayRewardId = '';
        for (let i = 0; i < count; i++) {
            const id = InventoryAPI.GetInventoryItemIDByIndex(i);
            xrayRewardId = i === 0 ? id : xrayRewardId;
            xrayCaseId = i === 1 ? id : xrayCaseId;
        }
        return { case: xrayCaseId, reward: xrayRewardId };
    };
    const _GetLoadoutWeapons = function (team) {
        let teamName = CharacterAnims.NormalizeTeamName(team, true);
        const list = [];
        const slotStrings = LoadoutAPI.GetLoadoutSlotNames(false);
        const slots = JSON.parse(slotStrings);
        slots.forEach(slot => {
            const weaponItemId = LoadoutAPI.GetItemID(teamName, slot);
            const bIsWeapon = ItemInfo.IsWeapon(weaponItemId);
            if (bIsWeapon) {
                list.push(weaponItemId);
            }
        });
        return list;
    };
    const _DeepCopyVanityCharacterSettings = function (inVanityCharacterSettings) {
        const modelRenderSettingsOneOffTempCopy = JSON.parse(JSON.stringify(inVanityCharacterSettings));
        modelRenderSettingsOneOffTempCopy.panel = inVanityCharacterSettings.panel;
        return modelRenderSettingsOneOffTempCopy;
    };
    const _PrecacheVanityCharacterSettings = function (inVanityCharacterSettings) {
        if (inVanityCharacterSettings.weaponItemId)
            InventoryAPI.PrecacheCustomMaterials(inVanityCharacterSettings.weaponItemId);
        if (inVanityCharacterSettings.glovesItemId)
            InventoryAPI.PrecacheCustomMaterials(inVanityCharacterSettings.glovesItemId);
    };
    const _GetOrUpdateVanityCharacterSettings = function (optionalCharacterItemId, optionalState) {
        const oSettings = {
            panel: undefined,
            team: undefined,
            charItemId: undefined,
            loadoutSlot: undefined,
            weaponItemId: undefined,
            glovesItemId: undefined,
            cameraPreset: undefined
        };
        if (optionalCharacterItemId && InventoryAPI.IsValidItemID(optionalCharacterItemId)) {
            const charTeam = ItemInfo.GetTeam(optionalCharacterItemId);
            if (charTeam.search('Team_CT') !== -1)
                oSettings.team = 'ct';
            else if (charTeam.search('Team_T') !== -1)
                oSettings.team = 't';
            if (oSettings.team)
                oSettings.charItemId = optionalCharacterItemId;
        }
        if (!oSettings.team) {
            oSettings.team = GameInterfaceAPI.GetSettingString('ui_vanitysetting_team');
            if (oSettings.team !== 'ct' && oSettings.team !== 't') {
                oSettings.team = (Math.round(Math.random()) > 0) ? 'ct' : 't';
                GameInterfaceAPI.SetSettingString('ui_vanitysetting_team', oSettings.team);
            }
        }
        const _fnRollRandomLoadoutSlotAndWeapon = function (strTeam) {
            const myResult = {
                loadoutSlot: '',
                weaponItemId: ''
            };
            const slots = JSON.parse(LoadoutAPI.GetLoadoutSlotNames(false));
            while (slots.length > 0) {
                slots.splice(slots.indexOf('heavy3'), 1);
                slots.splice(slots.indexOf('heavy4'), 1);
                const nRandomSlotIndex = Math.floor(Math.random() * slots.length);
                myResult.loadoutSlot = slots.splice(nRandomSlotIndex, 1)[0];
                myResult.weaponItemId = LoadoutAPI.GetItemID(strTeam, myResult.loadoutSlot);
                if (ItemInfo.IsWeapon(myResult.weaponItemId))
                    break;
            }
            return myResult;
        };
        oSettings.loadoutSlot = GameInterfaceAPI.GetSettingString('ui_vanitysetting_loadoutslot_' + oSettings.team);
        oSettings.weaponItemId = LoadoutAPI.GetItemID(oSettings.team, oSettings.loadoutSlot);
        if (!ItemInfo.IsWeapon(oSettings.weaponItemId)) {
            const randomResult = _fnRollRandomLoadoutSlotAndWeapon(oSettings.team);
            oSettings.loadoutSlot = randomResult.loadoutSlot;
            oSettings.weaponItemId = randomResult.weaponItemId;
            GameInterfaceAPI.SetSettingString('ui_vanitysetting_loadoutslot_' + oSettings.team, oSettings.loadoutSlot);
        }
        oSettings.glovesItemId = LoadoutAPI.GetItemID(oSettings.team, 'clothing_hands');
        if (!oSettings.charItemId)
            oSettings.charItemId = LoadoutAPI.GetItemID(oSettings.team, 'customplayer');
        if (optionalState && optionalState === 'unowned') {
            const randomResult = _fnRollRandomLoadoutSlotAndWeapon(oSettings.team);
            oSettings.loadoutSlot = randomResult.loadoutSlot;
            oSettings.weaponItemId = LoadoutAPI.GetDefaultItem(oSettings.team, oSettings.loadoutSlot);
            oSettings.glovesItemId = LoadoutAPI.GetDefaultItem(oSettings.team, 'clothing_hands');
        }
        return oSettings;
    };
    const _GetStickerSlotCount = function (id) {
        return InventoryAPI.GetItemStickerSlotCount(id);
    };
    const _GetStickerCount = function (id) {
        return InventoryAPI.GetItemStickerCount(id);
    };
    const _GetitemStickerList = function (id) {
        const count = _GetStickerCount(id);
        const stickerList = [];
        for (let i = 0; i < count; i++) {
            const image = _GetStickerImageByIndex(id, i);
            const oStickerInfo = {
                image: _GetStickerImageByIndex(id, i),
                name: _GetStickerNameByIndex(id, i)
            };
            stickerList.push(oStickerInfo);
        }
        return stickerList;
    };
    const _GetStickerImageByIndex = function (id, index) {
        return InventoryAPI.GetItemStickerImageByIndex(id, index);
    };
    const _GetStickerNameByIndex = function (id, index) {
        return InventoryAPI.GetItemStickerNameByIndex(id, index);
    };
    const _GetItemPickUpMethod = function (id) {
        return InventoryAPI.GetItemPickupMethod(id);
    };
    const _GetLoadoutPrice = function (id, subposition) {
        const team = _IsEquippedForCT(id) ? 'ct' : 't';
        return LoadoutAPI.GetItemGamePrice(team, _GetSlotSubPosition(id).toString());
    };
    const _GetStoreOriginalPrice = function (id, count, rules) {
        return StoreAPI.GetStoreItemOriginalPrice(id, count, rules ? rules : '');
    };
    const _GetStoreSalePrice = function (id, count, rules) {
        return StoreAPI.GetStoreItemSalePrice(id, count, rules ? rules : '');
    };
    const _GetStoreSalePercentReduction = function (id) {
        return StoreAPI.GetStoreItemPercentReduction(id);
    };
    const _ItemPurchase = function (id) {
        StoreAPI.StoreItemPurchase(id);
    };
    const _IsStatTrak = function (id) {
        const numIsStatTrak = InventoryAPI.GetRawDefinitionKey(id, "will_produce_stattrak");
        return (Number(numIsStatTrak) === 1) ? true : false;
    };
    const _IsEquippalbleButNotAWeapon = function (id) {
        const subSlot = _GetSlotSubPosition(id);
        return (subSlot === "flair0" || subSlot === "musickit" || subSlot === "spray0" || subSlot === "customplayer" || subSlot === "pet");
    };
    const _IsEquippableThroughContextMenu = function (id) {
        const subSlot = _GetSlotSubPosition(id);
        return (subSlot === "flair0" || subSlot === "musickit" || subSlot === "spray0");
    };
    const _IsWeapon = function (id) {
        const schemaString = InventoryAPI.BuildItemSchemaDefJSON(id);
        if (!schemaString)
            return false;
        const itemSchemaDef = JSON.parse(schemaString);
        return (itemSchemaDef["craft_class"] === "weapon");
    };
    const _IsCase = function (id) {
        return ItemInfo.ItemHasCapability(id, 'decodable') &&
            InventoryAPI.GetAssociatedItemsCount(id) > 0 ?
            true :
            false;
    };
    const _IsCharacter = function (id) {
        return (_GetSlotSubPosition(id) === "customplayer");
    };
    const _IsPet = function (id) {
        return (_GetSlotSubPosition(id) === "pet");
    };
    const _IsItemCt = function (id) {
        return _GetTeam(id) === '#CSGO_Inventory_Team_CT';
    };
    const _IsItemT = function (id) {
        return _GetTeam(id) === '#CSGO_Inventory_Team_T';
    };
    const _IsItemAnyTeam = function (id) {
        return _GetTeam(id) === '#CSGO_Inventory_Team_Any';
    };
    const _GetItemDefinitionName = function (id) {
        return InventoryAPI.GetItemDefinitionName(id);
    };
    const _ItemMatchDefName = function (id, defName) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, defName);
    };
    const _ItemDefinitionNameSubstrMatch = function (id, defSubstr) {
        const itemDefName = InventoryAPI.GetItemDefinitionName(id);
        return (!!itemDefName && (itemDefName.indexOf(defSubstr) != -1));
    };
    const _GetFauxReplacementItemID = function (id, purpose) {
        if (purpose === 'graffiti') {
            if (_ItemDefinitionNameSubstrMatch(id, 'tournament_journal_')) {
                return _GetFauxItemIdForGraffiti(parseInt(InventoryAPI.GetItemAttributeValue(id, 'sticker slot 0 id')));
            }
        }
        return id;
    };
    const _GetFauxItemIdForGraffiti = function (stickestickerid_graffiti) {
        return InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1349, stickestickerid_graffiti);
    };
    const _GetItemIdForItemEquippedInLoadoutSlot = function (id, team) {
        return LoadoutAPI.GetItemID(team, _GetSlotSubPosition(id));
    };
    const _ItemsNeededToTradeUp = function (id) {
        return InventoryAPI.GetNumItemsNeededToTradeUp(id);
    };
    const _GetGifter = function (id) {
        const xuid = InventoryAPI.GetItemGifterXuid(id);
        return xuid !== undefined ? xuid : '';
    };
    const _GetSet = function (id) {
        const setName = InventoryAPI.GetSet(id);
        return setName !== undefined ? setName : '';
    };
    const _GetModelPath = function (id, itemSchemaDef) {
        const isMusicKit = _ItemMatchDefName(id, 'musickit');
        const issMusicKitDefault = _ItemMatchDefName(id, 'musickit_default');
        const isSpray = itemSchemaDef.name === 'spraypaint';
        const isSprayPaint = itemSchemaDef.name === 'spray';
        const isFanTokenOrShieldItem = itemSchemaDef.name && itemSchemaDef.name.indexOf('tournament_journal_') != -1;
        const isPet = itemSchemaDef.name === itemSchemaDef.name && itemSchemaDef.name.indexOf('pet_') != -1;
        if (isSpray || isSprayPaint || isFanTokenOrShieldItem)
            return 'vmt://spraypreview_' + id;
        else if (_IsSticker(id) || _IsPatch(id))
            return 'vmt://stickerpreview_' + id;
        else if (itemSchemaDef.hasOwnProperty("model_player") || isMusicKit || issMusicKitDefault || isPet)
            return 'img://inventory_' + id;
    };
    const _GetModelPlayer = function (id) {
        const schemaString = InventoryAPI.BuildItemSchemaDefJSON(id);
        if (!schemaString)
            return "";
        const itemSchemaDef = JSON.parse(schemaString);
        const modelPlayer = itemSchemaDef["model_player"];
        return modelPlayer;
    };
    function _IsSticker(itemId) {
        return _ItemMatchDefName(itemId, 'sticker');
    }
    function _IsDisplayItem(itemId) {
        return _GetSlotSubPosition(itemId) == 'flair0';
    }
    function _IsPatch(itemId) {
        return _ItemMatchDefName(itemId, 'patch');
    }
    const _GetDefaultCheer = function (id) {
        const schemaString = InventoryAPI.BuildItemSchemaDefJSON(id);
        const itemSchemaDef = JSON.parse(schemaString);
        if (itemSchemaDef["default_cheer"])
            return itemSchemaDef["default_cheer"];
        else
            return "";
    };
    const _GetVoPrefix = function (id) {
        const schemaString = InventoryAPI.BuildItemSchemaDefJSON(id);
        const itemSchemaDef = JSON.parse(schemaString);
        return itemSchemaDef["vo_prefix"];
    };
    const _GetModelPathFromJSONOrAPI = function (id) {
        if (id === '' || id === undefined || id === null) {
            return '';
        }
        let pedistalModel = '';
        const schemaString = InventoryAPI.BuildItemSchemaDefJSON(id);
        const itemSchemaDef = JSON.parse(schemaString);
        if (_GetSlotSubPosition(id) === "flair0") {
            pedistalModel = itemSchemaDef.hasOwnProperty('attributes') ? itemSchemaDef.attributes["pedestal display model"] : '';
        }
        else if (_ItemHasCapability(id, 'decodable')) {
            pedistalModel = itemSchemaDef.hasOwnProperty("model_player") ? itemSchemaDef.model_player : '';
        }
        return (pedistalModel === '') ? _GetModelPath(id, itemSchemaDef) : pedistalModel;
    };
    const _GetLootListCount = function (id) {
        return InventoryAPI.GetLootListItemsCount(id);
    };
    const _GetLootListItemByIndex = function (id, index) {
        return InventoryAPI.GetLootListItemIdByIndex(id, index);
    };
    const _GetMarketLinkForLootlistItem = function (id) {
        const appID = SteamOverlayAPI.GetAppID();
        const communityUrl = SteamOverlayAPI.GetSteamCommunityURL();
        const strName = _GetName(id);
        return communityUrl + "/market/search?appid=" + appID + "&lock_appid=" + appID + "&q=" + strName;
    };
    const _GetToolType = function (id) {
        return InventoryAPI.GetToolType(id);
    };
    function _FindAnyUserOwnedCharacterItemID() {
        InventoryAPI.SetInventorySortAndFilters('inv_sort_rarity', false, 'customplayer,not_base_item', '', '');
        const count = InventoryAPI.GetInventoryCount();
        return (count > 0) ? InventoryAPI.GetInventoryItemIDByIndex(0) : '';
    }
    function _IsDefaultCharacter(id) {
        const defaultTItem = LoadoutAPI.GetDefaultItem('t', 'customplayer');
        const defaultCTItem = LoadoutAPI.GetDefaultItem('ct', 'customplayer');
        return id == defaultTItem || id == defaultCTItem;
    }
    function _IsPreviewable(id) {
        return (!!ItemInfo.GetSlotSubPosition(id) || ItemInfo.ItemMatchDefName(id, 'sticker') || ItemInfo.ItemMatchDefName(id, 'patch') || ItemInfo.ItemMatchDefName(id, 'spray')) &&
            !_IsDefaultCharacter(id);
    }
    return {
        AddItemToShuffle: _AddItemToShuffle,
        BIsRewardPremium: function (id) { return InventoryAPI.BIsRewardPremium(id); },
        ClearShuffle: _ClearShuffle,
        CountItemsInInventoryForShuffleSlot: _CountItemsInInventoryForShuffleSlot,
        DeepCopyVanityCharacterSettings: _DeepCopyVanityCharacterSettings,
        EnsureShuffleItemEquipped: _EnsureShuffleItemEquipped,
        FindAnyUserOwnedCharacterItemID: _FindAnyUserOwnedCharacterItemID,
        GetCapabilitybyIndex: _GetCapabilitybyIndex,
        GetCapabilityCount: _GetCapabilityCount,
        GetChosenActionItemIDByIndex: _GetChosenActionItemIDByIndex,
        GetChosenActionItemsCount: _GetChosenActionItemsCount,
        GetDefaultCheer: _GetDefaultCheer,
        GetFauxItemIdForGraffiti: _GetFauxItemIdForGraffiti,
        GetFauxReplacementItemID: _GetFauxReplacementItemID,
        GetFormattedName: _GetFormattedName,
        GetGifter: _GetGifter,
        GetItemDefinitionName: _GetItemDefinitionName,
        GetItemIdForItemEquippedInLoadoutSlot: _GetItemIdForItemEquippedInLoadoutSlot,
        GetItemPickUpMethod: _GetItemPickUpMethod,
        GetItemsInXray: _GetItemsInXray,
        GetitemStickerList: _GetitemStickerList,
        GetKeyForCaseInXray: _GetKeyForCaseInXray,
        GetLoadoutPrice: _GetLoadoutPrice,
        GetLoadoutWeapons: _GetLoadoutWeapons,
        GetLootListCount: _GetLootListCount,
        GetLootListItemByIndex: _GetLootListItemByIndex,
        GetMarketLinkForLootlistItem: _GetMarketLinkForLootlistItem,
        GetModelPath: _GetModelPath,
        GetModelPathFromJSONOrAPI: _GetModelPathFromJSONOrAPI,
        GetModelPlayer: _GetModelPlayer,
        GetName: _GetName,
        GetOrUpdateVanityCharacterSettings: _GetOrUpdateVanityCharacterSettings,
        GetRarityColor: _GetRarityColor,
        GetRewardTier: function (id) { return InventoryAPI.GetRewardTier(id); },
        GetSet: _GetSet,
        GetSlot: _GetSlot,
        GetSlotSubPosition: _GetSlotSubPosition,
        GetSprayTintColor: _GetSprayTintColor,
        GetStickerCount: _GetStickerCount,
        GetStickerSlotCount: _GetStickerSlotCount,
        GetStoreOriginalPrice: _GetStoreOriginalPrice,
        GetStoreSalePercentReduction: _GetStoreSalePercentReduction,
        GetStoreSalePrice: _GetStoreSalePrice,
        GetTeam: _GetTeam,
        GetToolType: _GetToolType,
        GetVoPrefix: _GetVoPrefix,
        IsCase: _IsCase,
        IsCharacter: _IsCharacter,
        IsDefaultCharacter: _IsDefaultCharacter,
        IsDisplayItem: _IsDisplayItem,
        IsEquippableThroughContextMenu: _IsEquippableThroughContextMenu,
        IsEquippalbleButNotAWeapon: _IsEquippalbleButNotAWeapon,
        IsEquipped: _IsEquipped,
        IsEquippedForCT: _IsEquippedForCT,
        IsEquippedForNoTeam: _IsEquippedForNoTeam,
        IsEquippedForT: _IsEquippedForT,
        IsItemAnyTeam: _IsItemAnyTeam,
        IsItemCt: _IsItemCt,
        IsItemInShuffleForTeam: _IsItemInShuffleForTeam,
        IsItemT: _IsItemT,
        IsLoadoutSlotSubPositionAWeapon: _IsLoadoutSlotSubPositionAWeapon,
        IsPatch: _IsPatch,
        IsPet: _IsPet,
        IsPreviewable: _IsPreviewable,
        IsShuffleAllowed: _IsShuffleAllowed,
        IsShuffleEnabled: _IsShuffleEnabled,
        IsSprayPaint: _IsSprayPaint,
        IsSpraySealed: _IsSpraySealed,
        IsStatTrak: _IsStatTrak,
        IsSticker: _IsSticker,
        IsTool: _IsTool,
        IsTradeUpContract: _IsTradeUpContract,
        IsWeapon: _IsWeapon,
        ItemDefinitionNameSubstrMatch: _ItemDefinitionNameSubstrMatch,
        ItemHasCapability: _ItemHasCapability,
        ItemMatchDefName: _ItemMatchDefName,
        ItemPurchase: _ItemPurchase,
        ItemsNeededToTradeUp: _ItemsNeededToTradeUp,
        PrecacheVanityCharacterSettings: _PrecacheVanityCharacterSettings,
        RemoveItemFromShuffle: _RemoveItemFromShuffle,
        SetShuffleEnabled: _SetShuffleEnabled,
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbWluZm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpdGVtaW5mby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQ0FBcUM7QUFDckMsc0NBQXNDO0FBQ3RDLDBDQUEwQztBQWdCMUMsSUFBSSxRQUFRLEdBQUcsQ0FBRTtJQUVoQixNQUFNLGVBQWUsR0FBRyxVQUFXLEVBQVU7UUFFNUMsT0FBTyxZQUFZLENBQUMsa0JBQWtCLENBQUUsRUFBRSxDQUFFLENBQUM7SUFDOUMsQ0FBQyxDQUFDO0lBR0YsTUFBTSxpQkFBaUIsR0FBRyxVQUFXLEVBQVU7UUFFOUMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRS9CLElBQUssWUFBWSxDQUFDLGFBQWEsQ0FBRSxFQUFFLENBQUUsRUFDckM7WUFDQyxPQUFPLElBQUksY0FBYyxDQUFFLHVCQUF1QixFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFFLENBQUM7U0FDN0U7YUFFRDtZQUVDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUUsR0FBRyxDQUFFLENBQUM7WUFFeEMsSUFBSyxRQUFRLElBQUksQ0FBQyxFQUNsQjtnQkFDQyxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFFLENBQUMsRUFBRSxRQUFRLENBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDOUQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBRSxRQUFRLEdBQUcsQ0FBQyxDQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRTlELE9BQU8sSUFBSSxjQUFjLENBQUUsd0JBQXdCLEVBQUUsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsQ0FBRSxDQUFDO2FBQ2pIO1lBRUQsT0FBTyxJQUFJLGNBQWMsQ0FBRSxxQkFBcUIsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBRSxDQUFDO1NBQzNFO0lBQ0Ys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
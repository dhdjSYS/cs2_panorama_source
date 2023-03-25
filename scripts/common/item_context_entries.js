/// <reference path="../csgo.d.ts" />
/// <reference path="iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
var ItemContextEntires = (function () {
    const _FilterEntries = function (populateFilterText) {
        const bHasFilter = populateFilterText !== "(not found)";
        const sGameBetaType = MyPersonaAPI.GetBetaType();
        return _Entries.filter(function (entry) {
            if (entry.betatype && !entry.betatype.includes(sGameBetaType)) {
                return false;
            }
            if (entry.exclusiveFilter) {
                return entry.exclusiveFilter.includes(populateFilterText);
            }
            else if (bHasFilter && entry.populateFilter) {
                return entry.populateFilter.includes(populateFilterText);
            }
            return !bHasFilter;
        });
    };
    const _Entries = [
        {
            name: 'preview',
            populateFilter: ['lootlist', 'loadout', 'tradeup_items', 'tradeup_ingredients'],
            style: function (id) {
                const slotsub = ItemInfo.GetSlotSubPosition(id);
                return ((slotsub) && (slotsub.startsWith("equipment") || slotsub.startsWith("grenade"))) ? '' : 'BottomSeparator';
            },
            AvailableForItem: function (id) {
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket')
                    return InventoryAPI.GetItemAttributeValue(id, 'modification date') ? true : false;
                return ItemInfo.IsPreviewable(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') {
                    if (InventoryAPI.GetItemAttributeValue(id, 'items count')) {
                        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=loadcontents' +
                            '&nextcapability=casketcontents' +
                            '&spinner=1' +
                            '&casket_item_id=' + id +
                            '&subject_item_id=' + id);
                    }
                    else {
                        UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_casket_empty'), $.Localize('#popup_casket_message_error_casket_empty'), '', function () {
                        });
                    }
                    return;
                }
                $.DispatchEvent("InventoryItemPreview", id);
            }
        },
        {
            name: 'bulkretrieve',
            populateFilter: ['loadout'],
            AvailableForItem: function (id) {
                const defName = InventoryAPI.GetItemDefinitionName(id);
                return (defName === 'casket') && !!InventoryAPI.GetItemAttributeValue(id, 'modification date');
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') {
                    if (InventoryAPI.GetItemAttributeValue(id, 'items count')) {
                        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=loadcontents' +
                            '&nextcapability=casketretrieve' +
                            '&spinner=1' +
                            '&casket_item_id=' + id +
                            '&subject_item_id=' + id);
                    }
                    else {
                        UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_casket_empty'), $.Localize('#popup_casket_message_error_casket_empty'), '', function () {
                        });
                    }
                    return;
                }
            }
        },
        {
            name: 'bulkstore',
            populateFilter: ['loadout'],
            style: function (id) {
                return 'BottomSeparator';
            },
            AvailableForItem: function (id) {
                const defName = InventoryAPI.GetItemDefinitionName(id);
                return (defName === 'casket') && !!InventoryAPI.GetItemAttributeValue(id, 'modification date');
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') {
                    $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'casketstore', id, '');
                }
            }
        },
        {
            name: 'view_tournament_journal',
            populateFilter: ['inspect', 'loadout'],
            betatype: ['fullversion'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                return (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_journal_') &&
                    g_ActiveTournamentInfo.eventid == InventoryAPI.GetItemAttributeValue(id, "tournament event id"));
            },
            OnSelected: function (id) {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_tournament_journal.xml', 'journalid=' + id);
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'openloadout',
            AvailableForItem: function (id) {
                const slotsub = ItemInfo.GetSlotSubPosition(id);
                return (!!slotsub) &&
                    (slotsub !== 'c4') &&
                    !slotsub.startsWith("equipment") &&
                    ItemInfo.IsEquippalbleButNotAWeapon(id) &&
                    !slotsub.startsWith("grenade");
            },
            OnSelected: function (id) {
                const teamNum = (ItemInfo.GetTeam(id).search('Team_T') === -1) ? 3 : 2;
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowLoadoutForItem", ItemInfo.GetSlot(id), ItemInfo.GetSlotSubPosition(id), teamNum);
            }
        },
        {
            name: 'equip_both_teams',
            populateFilter: ['inspect', 'loadout'],
            AvailableForItem: function (id) {
                if (ItemInfo.IsItemAnyTeam(id) &&
                    (!ItemInfo.IsEquippedForCT(id) && !ItemInfo.IsEquippedForT(id) &&
                        !ItemInfo.IsShuffleEnabled(id, 't') && !ItemInfo.IsShuffleEnabled(id, 'ct'))) {
                    return _CanEquipItem(id);
                }
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['ct', 't']);
            }
        },
        {
            name: 'equip_ct',
            CustomName: function (id) {
                return _GetItemToReplaceName(id, 'ct');
            },
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                if (_DoesItemTeamMatchTeamRequired('ct', id) &&
                    _ItemIsNotEquippedAndNotInShuffle('ct', id) ||
                    _IsInShuffleButNotEquippedWeaponTypeForSlot('ct', id) &&
                        _DoesItemTeamMatchTeamRequired('ct', id)) {
                    return _CanEquipItem(id);
                }
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['ct']);
            }
        },
        {
            name: 'equip_t',
            CustomName: function (id) {
                return _GetItemToReplaceName(id, 't');
            },
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                if (_DoesItemTeamMatchTeamRequired('t', id) &&
                    _ItemIsNotEquippedAndNotInShuffle('t', id) ||
                    _IsInShuffleButNotEquippedWeaponTypeForSlot('t', id) &&
                        _DoesItemTeamMatchTeamRequired('t', id)) {
                    return _CanEquipItem(id);
                }
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['t']);
            }
        },
        {
            name: 'add_to_shuffle_t',
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                if ((ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id)) &&
                    ItemInfo.IsShuffleEnabled(id, 't') && !ItemInfo.IsItemInShuffleForTeam(id, 't') && !InventoryAPI.IsItemDefault(id)) {
                    return _CanEquipItem(id);
                }
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                ItemInfo.AddItemToShuffle(id, 't');
            }
        },
        {
            name: 'remove_from_shuffle_t',
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                if ((ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id)) &&
                    ItemInfo.IsShuffleEnabled(id, 't') && ItemInfo.IsItemInShuffleForTeam(id, 't')) {
                    return _CanEquipItem(id);
                }
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                ItemInfo.RemoveItemFromShuffle(id, 't');
                ItemInfo.EnsureShuffleItemEquipped(id, 't');
            }
        },
        {
            name: 'add_to_shuffle_ct',
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                if ((ItemInfo.IsItemCt(id) || ItemInfo.IsItemAnyTeam(id)) &&
                    ItemInfo.IsShuffleEnabled(id, 'ct') && !ItemInfo.IsItemInShuffleForTeam(id, 'ct') && !InventoryAPI.IsItemDefault(id)) {
                    return _CanEquipItem(id);
                }
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                ItemInfo.AddItemToShuffle(id, 'ct');
            }
        },
        {
            name: 'remove_from_shuffle_ct',
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                if ((ItemInfo.IsItemCt(id) || ItemInfo.IsItemAnyTeam(id)) &&
                    ItemInfo.IsShuffleEnabled(id, 'ct') && ItemInfo.IsItemInShuffleForTeam(id, 'ct')) {
                    return _CanEquipItem(id);
                }
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                ItemInfo.RemoveItemFromShuffle(id, 'ct');
                ItemInfo.EnsureShuffleItemEquipped(id, 'ct');
            }
        },
        {
            name: 'flair',
            populateFilter: ['inspect', 'loadout'],
            AvailableForItem: function (id) {
                return ItemInfo.GetSlotSubPosition(id) === 'flair0' && (!ItemInfo.IsEquippedForNoTeam(id) || (InventoryAPI.GetRawDefinitionKey(id, 'item_sub_position2') !== ''));
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['noteam']);
            }
        },
        {
            name: 'equip_spray',
            populateFilter: ['inspect', 'loadout'],
            AvailableForItem: function (id) {
                return (ItemInfo.ItemMatchDefName(id, 'spraypaint') && !ItemInfo.IsEquippedForNoTeam(id));
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['noteam'], 'spray0');
            }
        },
        {
            name: 'equip_tournament_spray',
            populateFilter: ['inspect', 'loadout'],
            AvailableForItem: function (id) {
                return (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_journal_') && (InventoryAPI.GetRawDefinitionKey(id, 'item_sub_position2') === 'spray0'));
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_tournament_select_spray.xml', 'journalid=' + id);
            }
        },
        {
            name: 'equip_musickit',
            CustomName: function (id) {
                return _GetItemToReplaceName(id, 'noteam');
            },
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                return ItemInfo.GetSlotSubPosition(id) === 'musickit' && !ItemInfo.IsEquippedForNoTeam(id) && !ItemInfo.IsShuffleEnabled(id, 'noteam');
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                const isMusicvolumeOn = InventoryAPI.TestMusicVolume();
                if (!isMusicvolumeOn) {
                    $.DispatchEvent('ShowResetMusicVolumePopup', '');
                }
                else {
                    $.DispatchEvent('CSGOPlaySoundEffect', 'equip_musickit', 'MOUSE');
                    EquipItem(id, ['noteam']);
                }
            }
        },
        {
            name: 'add_musickit_to_shuffle',
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                return ItemInfo.GetSlotSubPosition(id) === 'musickit' && ItemInfo.IsShuffleEnabled(id, 'noteam') && !ItemInfo.IsItemInShuffleForTeam(id, 'noteam') && !InventoryAPI.IsItemDefault(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                ItemInfo.AddItemToShuffle(id, 'noteam');
            }
        },
        {
            name: 'remove_musickit_from_shuffle',
            populateFilter: ['inspect', 'loadout'],
            style: function (id) {
                return '';
            },
            AvailableForItem: function (id) {
                return ItemInfo.GetSlotSubPosition(id) === 'musickit' && ItemInfo.IsShuffleEnabled(id, 'noteam') && ItemInfo.IsItemInShuffleForTeam(id, 'noteam');
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                ItemInfo.RemoveItemFromShuffle(id, 'noteam');
            }
        },
        {
            name: 'open_watch_panel_pickem',
            AvailableForItem: function (id) {
                if (GameStateAPI.GetMapBSPName())
                    return false;
                return (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_journal_') && (InventoryAPI.GetRawDefinitionKey(id, 'item_sub_position2') === 'spray0'));
            },
            OnSelected: function (id) {
                $.DispatchEvent('OpenWatchMenu');
                $.DispatchEvent('ShowActiveTournamentPage', '');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'getprestige',
            AvailableForItem: function (id) {
                return (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'xpgrant') &&
                    (FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid()) >= InventoryAPI.GetMaxLevel()));
            },
            OnSelected: function (id) {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'itemid=' + '0' +
                    '&' + 'asyncworkitemwarning=no' +
                    '&' + 'asyncworktype=prestigecheck');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'useitem',
            betatype: ['fullversion'],
            AvailableForItem: function (id) {
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_pass_'))
                    return true;
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'xpgrant')) {
                    return (FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid()) < InventoryAPI.GetMaxLevel());
                }
                if (!InventoryAPI.IsTool(id))
                    return false;
                const season = InventoryAPI.GetItemAttributeValue(id, 'season access');
                if (season != undefined)
                    return true;
                return false;
            },
            OnSelected: function (id) {
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_pass_')) {
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_decodable.xml', 'key-and-case=,' + id +
                        '&' + 'asyncworktype=decodeable');
                }
                else {
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'itemid=' + id +
                        '&' + 'asyncworktype=useitem');
                }
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'edit_shuffle_settings',
            AvailableForItem: function (id) {
                return ItemInfo.IsShuffleAllowed(id) && !InventoryAPI.IsItemDefault(id);
            },
            style: function (id) {
                return 'BottomSeparator';
            },
            OnSelected: function (id) {
                const teamNum = (ItemInfo.GetTeam(id).search('Team_T') === -1) ? 3 : 2;
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowLoadoutForItem", ItemInfo.GetSlot(id), ItemInfo.GetSlotSubPosition(id), teamNum);
            }
        },
        {
            name: 'usespray',
            populateFilter: ['inspect'],
            AvailableForItem: function (id) {
                return ItemInfo.ItemMatchDefName(id, 'spray');
            },
            OnSelected: function (id) {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_decodable.xml', 'key-and-case=,' + id +
                    '&' + 'asyncworktype=decodeable');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            betatype: ['fullversion'],
            name: function (id) {
                return InventoryAPI.GetDecodeableRestriction(id) === 'xray' && !ItemInfo.IsTool(id) ? 'look_inside' : _IsKeyForXrayItem(id) !== '' ? 'goto_xray' : 'open_package';
            },
            AvailableForItem: function (id) {
                return ItemInfo.ItemHasCapability(id, 'decodable');
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                if (ItemInfo.GetChosenActionItemsCount(id, 'decodable') === 0) {
                    if (ItemInfo.IsTool(id)) {
                        $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'decodable', id, '');
                    }
                    else {
                        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_decodable.xml', 'key-and-case=,' + id +
                            '&' + 'asyncworktype=decodeable');
                    }
                    $.DispatchEvent('ContextMenuEvent', '');
                    return;
                }
                if (ItemInfo.GetChosenActionItemsCount(id, 'decodable') > 0 && ItemInfo.IsTool(id) && InventoryAPI.GetDecodeableRestriction(id) === 'xray') {
                    const caseId = _IsKeyForXrayItem(id);
                    if (caseId) {
                        $.DispatchEvent("ShowXrayCasePopup", id, caseId, false);
                        $.DispatchEvent('ContextMenuEvent', '');
                        return;
                    }
                }
                if (!ItemInfo.IsTool(id) && InventoryAPI.GetDecodeableRestriction(id) === 'xray') {
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_decodable.xml', 'key-and-case=,' + id +
                        '&' + 'asyncworktype=decodeable');
                    return;
                }
                $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'decodable', id, '');
            }
        },
        {
            betatype: ['fullversion'],
            name: function (id) {
                const strActionName = 'nameable';
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') {
                    return InventoryAPI.GetItemAttributeValue(id, 'modification date') ? 'yourcasket' : 'newcasket';
                }
                return strActionName;
            },
            AvailableForItem: function (id) {
                return ItemInfo.ItemHasCapability(id, 'nameable');
            },
            OnSelected: function (id) {
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') {
                    const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0);
                    const noteText = InventoryAPI.GetItemAttributeValue(id, 'modification date') ? 'yourcasket' : 'newcasket';
                    $.DispatchEvent('ContextMenuEvent', '');
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_nameable.xml', 'nametag-and-itemtoname=' + fauxNameTag + ',' + id +
                        '&' + 'asyncworktype=nameable' +
                        '&' + 'asyncworkitemwarningtext=#popup_' + noteText + '_warning');
                }
                else if (_DoesNotHaveChosenActionItems(id, 'nameable')) {
                    const nameTagId = '', itemToNameId = id;
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_nameable.xml', 'nametag-and-itemtoname=' + nameTagId + ',' + itemToNameId +
                        '&' + 'asyncworktype=nameable');
                }
                else {
                    $.DispatchEvent('ContextMenuEvent', '');
                    $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'nameable', id, '');
                }
            }
        },
        {
            betatype: ['fullversion'],
            name: 'can_sticker',
            populateFilter: ['inspect', 'loadout'],
            AvailableForItem: function (id) {
                return ItemInfo.ItemMatchDefName(id, 'sticker') && ItemInfo.ItemHasCapability(id, 'can_sticker');
            },
            OnSelected: function (id) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'can_sticker', id, '');
            }
        },
        {
            betatype: ['fullversion'],
            name: 'can_sticker',
            AvailableForItem: function (id) {
                return ItemInfo.ItemHasCapability(id, 'can_sticker') &&
                    ItemInfo.GetStickerSlotCount(id) > ItemInfo.GetStickerCount(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'can_sticker', id, '');
            }
        },
        {
            betatype: ['fullversion'],
            name: 'remove_sticker',
            AvailableForItem: function (id) {
                return ItemInfo.ItemHasCapability(id, 'can_sticker') && ItemInfo.GetStickerCount(id) > 0;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_can_sticker.xml', 'sticker-and-itemtosticker=remove' + ',' + id +
                    '&' + 'asyncworktype=remove_sticker');
            }
        },
        {
            betatype: ['fullversion'],
            name: 'can_patch',
            populateFilter: ['inspect', 'loadout'],
            AvailableForItem: function (id) {
                return ItemInfo.ItemMatchDefName(id, 'patch') && ItemInfo.ItemHasCapability(id, 'can_patch');
            },
            OnSelected: function (id) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'can_patch', id, '');
            }
        },
        {
            betatype: ['fullversion'],
            name: 'can_patch',
            AvailableForItem: function (id) {
                return ItemInfo.ItemHasCapability(id, 'can_patch') &&
                    ItemInfo.GetStickerSlotCount(id) > ItemInfo.GetStickerCount(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'can_patch', id, '');
            }
        },
        {
            betatype: ['fullversion'],
            name: 'remove_patch',
            AvailableForItem: function (id) {
                return ItemInfo.ItemHasCapability(id, 'can_patch') && ItemInfo.GetStickerCount(id) > 0;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_can_patch.xml', 'characterid=' + id +
                    '&' + 'asyncworktype=remove_patch');
            }
        },
        {
            name: 'recipe',
            AvailableForItem: function (id) {
                return ItemInfo.ItemMatchDefName(id, 'recipe');
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            betatype: ['fullversion'],
            name: 'can_stattrack_swap',
            AvailableForItem: function (id) {
                return ItemInfo.ItemHasCapability(id, 'can_stattrack_swap') && InventoryAPI.IsTool(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'can_stattrack_swap', id, '');
            }
        },
        {
            name: 'journal',
            AvailableForItem: function (id) {
                return false;
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'tradeup_add',
            populateFilter: ['tradeup_items'],
            AvailableForItem: function (id) {
                const slot = ItemInfo.GetSlotSubPosition(id);
                return !!slot && slot !== "melee" && slot !== "c4" && slot !== "clothing_hands" && !ItemInfo.IsEquippalbleButNotAWeapon(id) &&
                    (InventoryAPI.CanTradeUp(id) || InventoryAPI.GetNumItemsNeededToTradeUp(id) > 0);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.AddCraftIngredient(id);
            }
        },
        {
            name: 'tradeup_remove',
            exclusiveFilter: ['tradeup_ingredients'],
            AvailableForItem: function (id) {
                const slot = ItemInfo.GetSlotSubPosition(id);
                return !!slot && slot !== "melee" && slot !== "c4" && slot !== "clothing_hands" && !ItemInfo.IsEquippalbleButNotAWeapon(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.RemoveCraftIngredient(id);
            }
        },
        {
            name: 'open_contract',
            AvailableForItem: function (id) {
                return ItemInfo.IsTradeUpContract(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ShowTradeUpPanel');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            betatype: ['fullversion'],
            name: 'usegift',
            AvailableForItem: function (id) {
                return ItemInfo.GetToolType(id) === 'gift';
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                const CapDisabledMessage = InventoryAPI.GetItemCapabilityDisabledMessageByIndex(id, 0);
                if (CapDisabledMessage === "") {
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'itemid=' + id +
                        '&' + 'asyncworkitemwarning=no' +
                        '&' + 'asyncworktype=usegift');
                }
                else {
                    const capDisabledMessage = InventoryAPI.GetItemCapabilityDisabledMessageByIndex(id, 0);
                    UiToolkitAPI.ShowGenericPopupOk($.Localize('#inv_context_usegift'), $.Localize(capDisabledMessage), '', function () {
                    });
                }
            }
        },
        {
            name: 'intocasket',
            style: function (id) {
                return 'TopSeparator';
            },
            AvailableForItem: function (id) {
                return InventoryAPI.IsPotentiallyMarketable(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                if (ItemInfo.GetChosenActionItemsCount(id, 'can_collect') > 0) {
                    $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'can_collect', id, '');
                }
                else {
                    const fauxCasket = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1201, 0);
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'itemid=' + fauxCasket
                        + '&' +
                        'inspectonly=false'
                        + '&' +
                        'asyncworkitemwarning=no'
                        + '&' +
                        'storeitemid=' + fauxCasket);
                }
            }
        },
        {
            name: 'sell',
            AvailableForItem: function (id) {
                return InventoryAPI.IsMarketable(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_sellOnMarket', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.SellItem(id);
            }
        },
        {
            name: 'delete',
            style: function (id) {
                return !InventoryAPI.IsMarketable(id) ? 'TopSeparator' : '';
            },
            AvailableForItem: function (id) {
                return InventoryAPI.IsDeletable(id);
            },
            OnSelected: function (id) {
                $.DispatchEvent('ContextMenuEvent', '');
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'itemid=' + id +
                    '&' + 'asyncworktype=delete' +
                    '&' + 'asyncworkbtnstyle=Negative');
            }
        }
    ];
    const _GetItemToReplaceName = function (id, team) {
        const currentEquippedItem = ItemInfo.GetItemIdForItemEquippedInLoadoutSlot(id, team);
        if (currentEquippedItem && currentEquippedItem !== '0') {
            $.GetContextPanel().SetDialogVariable("item_name", _GetNameWithRarity(currentEquippedItem));
            return $.Localize('#inv_context_equip', $.GetContextPanel());
        }
        return 'WRONG CONTEXT -_GetItemToReplaceName()' + id;
    };
    const _GetNameWithRarity = function (id) {
        const rarityColor = ItemInfo.GetRarityColor(id);
        return '<font color="' + rarityColor + '">' + ItemInfo.GetName(id) + '</font>';
    };
    const EquipItem = function (id, team, slot) {
        if (slot === null || slot === undefined || slot === '')
            slot = ItemInfo.GetSlotSubPosition(id);
        const teamShownOnMainMenu = GameInterfaceAPI.GetSettingString('ui_vanitysetting_team');
        team.forEach(element => LoadoutAPI.EquipItemInSlot(element, id, slot));
        let bNeedToRestartMainMenuVanity = false;
        if (ItemInfo.IsCharacter(id)) {
            const teamOfCharacter = (ItemInfo.GetTeam(id).search('Team_T') === -1) ? 'ct' : 't';
            if (teamOfCharacter !== teamShownOnMainMenu) {
                GameInterfaceAPI.SetSettingString('ui_vanitysetting_team', teamOfCharacter);
            }
            bNeedToRestartMainMenuVanity = true;
        }
        else {
            team.filter(function (e) { return e === teamShownOnMainMenu; });
            if (team.length > 0) {
                if ((slot === 'clothing_hands') ||
                    (slot === GameInterfaceAPI.GetSettingString('ui_vanitysetting_loadoutslot_' + teamShownOnMainMenu))) {
                    bNeedToRestartMainMenuVanity = true;
                }
            }
        }
        if (bNeedToRestartMainMenuVanity) {
            $.DispatchEvent('ForceRestartVanity');
        }
    };
    const _DoesNotHaveChosenActionItems = function (id, capability) {
        return (ItemInfo.GetChosenActionItemsCount(id, capability) === 0 && !ItemInfo.IsTool(id));
    };
    const _DoesItemTeamMatchTeamRequired = function (team, id) {
        if (team === 't') {
            return ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id);
        }
        if (team === 'ct') {
            return ItemInfo.IsItemCt(id) || ItemInfo.IsItemAnyTeam(id);
        }
        return false;
    };
    const _ItemIsNotEquippedAndNotInShuffle = function (team, id) {
        return !InventoryAPI.IsEquipped(id, team) && !ItemInfo.IsShuffleEnabled(id, team);
    };
    const _IsInShuffleButNotEquippedWeaponTypeForSlot = function (team, id) {
        const currentlyEquippedId = LoadoutAPI.GetItemID(team, ItemInfo.GetSlotSubPosition(id));
        const isSharedSlot = InventoryAPI.GetRawDefinitionKey(id, "item_shares_equip_slot");
        const IsNotEquippedInSLot = InventoryAPI.GetItemDefinitionName(currentlyEquippedId) === InventoryAPI.GetItemDefinitionName(id);
        return ItemInfo.IsShuffleEnabled(id, team) && !IsNotEquippedInSLot && isSharedSlot === '1';
    };
    const _CanEquipItem = function (itemID) {
        return !!ItemInfo.GetSlotSubPosition(itemID) && !ItemInfo.IsEquippableThroughContextMenu(itemID) && LoadoutAPI.IsLoadoutAllowed();
    };
    const _IsKeyForXrayItem = function (id) {
        const oData = ItemInfo.GetItemsInXray();
        if (oData.case && oData.reward) {
            const numActionItems = ItemInfo.GetChosenActionItemsCount(oData.case, 'decodable');
            if (numActionItems > 0) {
                for (let i = 0; i < numActionItems; i++) {
                    if (id === ItemInfo.GetChosenActionItemIDByIndex(oData.case, 'decodable', i)) {
                        return oData.case;
                    }
                }
            }
        }
        return '';
    };
    return {
        FilterEntries: _FilterEntries
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbV9jb250ZXh0X2VudHJpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpdGVtX2NvbnRleHRfZW50cmllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQ0FBcUM7QUFDckMsb0NBQW9DO0FBQ3BDLDhFQUE4RTtBQWM5RSxJQUFJLGtCQUFrQixHQUFHLENBQUU7SUFHMUIsTUFBTSxjQUFjLEdBQUcsVUFBVyxrQkFBMEI7UUFFM0QsTUFBTSxVQUFVLEdBQUcsa0JBQWtCLEtBQUssYUFBYSxDQUFDO1FBQ3hELE1BQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVqRCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUUsVUFBVyxLQUFLO1lBR3ZDLElBQUssS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFFLGFBQWEsQ0FBRSxFQUNoRTtnQkFDQyxPQUFPLEtBQUssQ0FBQzthQUNiO1lBR0QsSUFBSyxLQUFLLENBQUMsZUFBZSxFQUMxQjtnQkFDQyxPQUFPLEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFFLGtCQUFrQixDQUFFLENBQUM7YUFDNUQ7aUJBRUksSUFBSyxVQUFVLElBQUksS0FBSyxDQUFDLGNBQWMsRUFDNUM7Z0JBQ0MsT0FBTyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO2FBQzNEO1lBR0QsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUNwQixDQUFDLENBQUUsQ0FBQztJQUNMLENBQUMsQ0FBQztJQU9GLE1BQU0sUUFBUSxHQUF5QjtRQWtDdEM7WUFDQyxJQUFJLEVBQUUsU0FBUztZQUNmLGNBQWMsRUFBRSxDQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLHFCQUFxQixDQUFFO1lBQ2pGLEtBQUssRUFBRSxVQUFXLEVBQUU7Z0JBRW5CLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FB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
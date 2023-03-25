/// <reference path="csgo.d.ts" />
/// <reference path="common/characteranims.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/tint_spray_icon.ts" />
var InspectModelImage = (function () {
    let m_elPanel = null;
    let m_elContainer = null;
    let m_useAcknowledge = false;
    let m_rarityColor = '';
    const _Init = function (elContainer, itemId, funcGetSettingCallback) {
        const strViewFunc = funcGetSettingCallback ? funcGetSettingCallback('viewfunc', '') : '';
        if (ItemInfo.ItemDefinitionNameSubstrMatch(itemId, 'tournament_journal_'))
            itemId = (strViewFunc === 'primary') ? itemId : ItemInfo.GetFauxReplacementItemID(itemId, 'graffiti');
        if (!InventoryAPI.IsValidItemID(itemId)) {
            return '';
        }
        m_elContainer = elContainer;
        m_useAcknowledge = m_elContainer.Data().useAcknowledge ? m_elContainer.Data().useAcknowledge : false;
        m_rarityColor = ItemInfo.GetRarityColor(itemId);
        const model = ItemInfo.GetModelPathFromJSONOrAPI(itemId);
        if (ItemInfo.IsCharacter(itemId)) {
            m_elPanel = _InitCharScene('character', itemId);
        }
        else if (ItemInfo.GetSlot(itemId) == "melee") {
            m_elPanel = _InitMeleeScene('melee', itemId);
        }
        else if (ItemInfo.IsWeapon(itemId)) {
            m_elPanel = _InitWeaponScene('weapon', itemId);
        }
        else if (ItemInfo.IsDisplayItem(itemId)) {
            m_elPanel = _InitDisplayScene('flair', itemId);
        }
        else if (ItemInfo.GetSlot(itemId) == "musickit") {
            m_elPanel = _InitMusicKitScene('musickit', itemId);
        }
        else if (ItemInfo.IsCase(itemId)) {
            m_elPanel = _InitCaseScene('case', itemId);
        }
        else if (ItemInfo.IsSprayPaint(itemId) || ItemInfo.IsSpraySealed(itemId)) {
            m_elPanel = _InitSprayScene('spray', itemId);
        }
        else if (ItemInfo.ItemMatchDefName(itemId, 'name tag')) {
        }
        else if (ItemInfo.IsSticker(itemId) || ItemInfo.IsPatch(itemId)) {
            m_elPanel = _InitStickerScene('sticker', itemId);
        }
        else if (model) {
            if (ItemInfo.GetSlot(itemId) === 'clothing') {
                m_elPanel = _InitGlovesScene('gloves', itemId);
            }
            else {
            }
        }
        else if (!model) {
            m_elPanel = _SetImage(itemId);
        }
        return model;
    };
    const _InitCase = function (elContainer, itemId) {
        if (!InventoryAPI.IsValidItemID(itemId)) {
            return;
        }
        m_elContainer = elContainer;
        const model = ItemInfo.GetModelPathFromJSONOrAPI(itemId);
        if (model) {
            m_elPanel = _InitCaseScene('case', itemId);
        }
        else if (!model) {
            m_elPanel = _SetImage(itemId);
        }
    };
    const _InitSealedSpray = function (elContainer, itemId) {
        if (!InventoryAPI.IsValidItemID(itemId)) {
            return;
        }
        m_elContainer = elContainer;
        m_elPanel = _InitSprayScene('spray', itemId);
    };
    function _InitCharScene(name, itemId, bHide = false) {
        let elPanel = m_elContainer.FindChildTraverse('CharPreviewPanel');
        let active_item_idx = 5;
        if (!elPanel) {
            let mapName = _GetBackGroundMap();
            elPanel = $.CreatePanel('MapPlayerPreviewPanel', m_elContainer, 'CharPreviewPanel', {
                "require-composition-layer": "true",
                "pin-fov": "vertical",
                class: 'full-width full-height hidden',
                camera: 'cam_char_inspect_wide_intro',
                player: "true",
                map: mapName,
                initial_entity: 'item',
                mouse_rotate: false,
                playername: "vanity_character",
                animgraphcharactermode: "inventory-inspect",
                animgraphturns: "true"
            });
        }
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(itemId);
        elPanel.SetActiveCharacter(active_item_idx);
        settings.panel = elPanel;
        CharacterAnims.PlayAnimsOnPanel(settings);
        _AnimateIntroCamera(elPanel, 'char_inspect_wide', .5);
        if (!bHide) {
            elPanel.RemoveClass('hidden');
        }
        _HidePanelItemEntities(elPanel);
        _HidePanelCharEntities(elPanel, true);
        _SetParticlesBg(elPanel);
        return elPanel;
    }
    function _InitWeaponScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 0,
            camera: 'cam_default',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "360",
            rotation_limit_y: "90",
            auto_rotate_x: "35",
            auto_rotate_y: "10",
            auto_rotate_period_x: "15",
            auto_rotate_period_y: "25",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        _SetParticlesBg(panel);
        _SetItemCameraByWeaponType(itemId, panel);
        if (!m_useAcknowledge) {
            _InitCharScene(name, itemId, true);
        }
        return panel;
    }
    function _InitMeleeScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 8,
            camera: 'cam_melee_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "360",
            rotation_limit_y: "90",
            auto_rotate_x: "35",
            auto_rotate_y: "10",
            auto_rotate_period_x: "15",
            auto_rotate_period_y: "25",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        _SetParticlesBg(panel);
        _AnimateIntroCamera(panel, 'melee', .2);
        if (!m_useAcknowledge) {
            _InitCharScene(name, itemId, true);
        }
        return panel;
    }
    function _InitStickerScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 1,
            camera: 'cam_sticker_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "70",
            rotation_limit_y: "60",
            auto_rotate_x: "20",
            auto_rotate_y: "0",
            auto_rotate_period_x: "10",
            auto_rotate_period_y: "10",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        _SetParticlesBg(panel);
        _AnimateIntroCamera(panel, 'sticker_close', .2);
        return panel;
    }
    function _InitSprayScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 2,
            camera: 'camera_path_spray',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        panel.TransitionToCamera('camera_path_spray', 0);
        return panel;
    }
    function _InitDisplayScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 3,
            camera: 'cam_display_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "70",
            rotation_limit_y: "60",
            auto_rotate_x: "45",
            auto_rotate_y: "12",
            auto_rotate_period_x: "20",
            auto_rotate_period_y: "20",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        _SetParticlesBg(panel);
        _AnimateIntroCamera(panel, 'display_close', .2);
        return panel;
    }
    function _InitMusicKitScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 4,
            camera: 'cam_musickit_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "55",
            rotation_limit_y: "55",
            auto_rotate_x: "10",
            auto_rotate_y: "0",
            auto_rotate_period_x: "20",
            auto_rotate_period_y: "20",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        _SetParticlesBg(panel);
        _AnimateIntroCamera(panel, 'musickit_close', .2);
        return panel;
    }
    function _InitCaseScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 6,
            camera: 'cam_case_intro',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        _SetParticlesBg(panel);
        _AnimateIntroCamera(panel, 'case', .2);
        return panel;
    }
    function _InitGlovesScene(name, itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 7,
            camera: 'cam_gloves',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _HidePanelCharEntities(panel);
        _HideItemEntities(oSettings.active_item_idx, panel);
        _SetParticlesBg(panel);
        return panel;
    }
    function _GetBackGroundMap() {
        if (m_useAcknowledge) {
            return 'ui/acknowledge_item';
        }
        let backgroundMap = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie');
        backgroundMap = !backgroundMap ? backgroundMap : 'de_' + backgroundMap + '_vanity';
        return backgroundMap;
    }
    function _LoadInspectMap(itemId, oSettings) {
        let elPanel = m_elContainer.FindChildTraverse('ItemPreviewPanel') || null;
        if (elPanel) {
            elPanel.RemoveAndDeleteChildren();
        }
        if (!elPanel) {
            let mapName = _GetBackGroundMap();
            elPanel = $.CreatePanel(oSettings.panel_type, m_elContainer, 'ItemPreviewPanel', {
                "require-composition-layer": "true",
                'erase-background': 'true',
                'disable-depth-of-field': m_useAcknowledge ? 'true' : 'false',
                "pin-fov": "vertical",
                class: 'full-width full-height hidden',
                camera: oSettings.camera,
                player: "true",
                map: mapName,
                initial_entity: 'item',
                mouse_rotate: oSettings.mouse_rotate,
                rotation_limit_x: oSettings.rotation_limit_x,
                rotation_limit_y: oSettings.rotation_limit_y,
                auto_rotate_x: oSettings.auto_rotate_x,
                auto_rotate_y: oSettings.auto_rotate_y,
                auto_rotate_period_x: oSettings.auto_rotate_period_x,
                auto_rotate_period_y: oSettings.auto_rotate_period_y
            });
        }
        let modelPath = ItemInfo.GetModelPathFromJSONOrAPI(itemId);
        elPanel.SetActiveItem(oSettings.active_item_idx);
        elPanel.SetItemItemId(itemId);
        elPanel.RemoveClass('hidden');
        return elPanel;
    }
    function _SetItemCameraByWeaponType(itemId, elItemPanel) {
        const slot = InventoryAPI.GetSlot(itemId);
        const defName = InventoryAPI.GetItemDefinitionName(itemId);
        var strCamera = 'wide';
        switch (slot) {
            case 'secondary':
                strCamera = 'close';
                break;
            case 'smg':
                strCamera = 'mid_close';
                break;
        }
        switch (defName) {
            case 'weapon_awp':
                strCamera = 'far';
                break;
            case 'weapon_usp_silencer':
                strCamera = 'mid_close';
                break;
            case 'weapon_ssg08':
                strCamera = 'far';
                break;
            case 'weapon_galilar':
                strCamera = 'mid';
                break;
            case 'weapon_aug':
                strCamera = 'mid';
                break;
            case 'weapon_mp5sd':
                strCamera = 'mid';
                break;
            case 'weapon_m249':
                strCamera = 'far';
                break;
            case 'weapon_elite':
                strCamera = 'mid_close';
                break;
            case 'weapon_tec9':
                strCamera = 'mid_close';
                break;
            case 'weapon_ump45':
                strCamera = "mid";
                break;
            case 'weapon_bizon':
                strCamera = "mid";
                break;
            case 'weapon_mag7':
                strCamera = "mid";
                break;
            case 'weapon_c4':
                strCamera = "mid_close";
                break;
            case 'weapon_knife':
                strCamera = "mid_close";
                break;
        }
        _AnimateIntroCamera(elItemPanel, strCamera, .3);
    }
    ;
    function _AnimateIntroCamera(elPanel, strCamera, nDelay) {
        elPanel.TransitionToCamera('cam_' + strCamera + '_intro', 0);
        $.Schedule(nDelay, function () { elPanel.TransitionToCamera('cam_' + strCamera, 1.5); });
    }
    const _SetImage = function (itemId) {
        let elPanel = m_elContainer.FindChildTraverse('InspectItemImage');
        if (!elPanel) {
            elPanel = $.CreatePanel('Panel', m_elContainer, 'InspectItemImage');
            elPanel.BLoadLayoutSnippet("snippet-image");
        }
        const elImagePanel = elPanel.FindChildTraverse('ImagePreviewPanel');
        elImagePanel.itemid = Number(itemId);
        elImagePanel.RemoveClass('hidden');
        _TintSprayImage(itemId, elImagePanel);
        return elImagePanel;
    };
    const _TintSprayImage = function (id, elImage) {
        TintSprayIcon.CheckIsSprayAndTint(id, elImage);
    };
    const _SetCharScene = function (elPanel, characterItemId, weaponItemId) {
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(characterItemId);
        const elCharPanel = elPanel.FindChildTraverse('CharPreviewPanel');
        settings.panel = elCharPanel;
        settings.weaponItemId = weaponItemId;
        CharacterAnims.PlayAnimsOnPanel(settings);
    };
    const _CancelCharAnim = function (elContainer) {
    };
    const _ShowHideItemPanel = function (bshow) {
        if (!m_elContainer.IsValid())
            return;
        const elItemPanel = m_elContainer.FindChildTraverse('ItemPreviewPanel');
        elItemPanel.SetHasClass('hidden', !bshow);
        if (bshow)
            $.DispatchEvent("CSGOPlaySoundEffect", "weapon_showSolo", "MOUSE");
    };
    const _ShowHideCharPanel = function (bshow) {
        if (!m_elContainer.IsValid())
            return;
        const elCharPanel = m_elContainer.FindChildTraverse('CharPreviewPanel');
        elCharPanel.SetHasClass('hidden', !bshow);
        if (bshow)
            $.DispatchEvent("CSGOPlaySoundEffect", "weapon_showOnChar", "MOUSE");
    };
    const _GetModelPanel = function () {
        return m_elPanel;
    };
    const _GetImagePanel = function () {
        return m_elPanel;
    };
    const _HidePanelCharEntities = function (elPanel, bIsPlayerInspect = false) {
        elPanel.FireEntityInput('vanity_character', 'Alpha', '0');
        elPanel.FireEntityInput('vanity_character1', 'Alpha', '0');
        elPanel.FireEntityInput('vanity_character2', 'Alpha', '0');
        elPanel.FireEntityInput('vanity_character3', 'Alpha', '0');
        elPanel.FireEntityInput('vanity_character4', 'Alpha', '0');
        if (!bIsPlayerInspect) {
            elPanel.FireEntityInput('vanity_character5', 'Alpha', '0');
        }
    };
    const _HidePanelItemEntities = function (elPanel) {
        _HideItemEntities(-1, elPanel);
    };
    const _HideItemEntities = function (indexShow, elPanel) {
        let numItemEntitesInMap = 8;
        for (var i = 0; i <= numItemEntitesInMap; i++) {
            let itemIndexMod = i === 0 ? '' : i.toString();
            if (indexShow !== i) {
                elPanel.FireEntityInput('item' + itemIndexMod, 'Alpha', '0');
                elPanel.FireEntityInput('light_item' + itemIndexMod, 'Disable', '0');
                elPanel.FireEntityInput('light_item_new' + itemIndexMod, 'Disable', '0');
            }
            else {
                _SetRimLight(itemIndexMod, elPanel);
            }
        }
    };
    const _SetParticlesBg = function (elPanel) {
        if (!m_useAcknowledge) {
            return;
        }
        const oColor = _HexColorToRgb(m_rarityColor);
        elPanel.FireEntityInput('acknowledge_particle', 'SetControlPoint', '16: ' + oColor.r.toString() + ' ' + oColor.g.toString() + ' ' + oColor.b.toString());
    };
    const _SetRimLight = function (indexShow, elPanel) {
        if (m_useAcknowledge) {
            elPanel.FireEntityInput('light_item' + indexShow, 'Disable', '0');
            const oColor = _HexColorToRgb(m_rarityColor);
            let lightNameInMap = "light_item_new" + indexShow;
            elPanel.FireEntityInput(lightNameInMap, 'SetColor', oColor.r.toString() + ' ' + oColor.g.toString() + ' ' + oColor.b.toString());
        }
        else {
            elPanel.FireEntityInput('light_item_new' + indexShow, 'Disable', '0');
        }
    };
    const _HexColorToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    };
    return {
        Init: _Init,
        InitCase: _InitCase,
        InitSealedSpray: _InitSealedSpray,
        SetCharScene: _SetCharScene,
        CancelCharAnim: _CancelCharAnim,
        ShowHideItemPanel: _ShowHideItemPanel,
        ShowHideCharPanel: _ShowHideCharPanel,
        GetModelPanel: _GetModelPanel,
        GetImagePanel: _GetImagePanel,
        HidePanelItemEntities: _HidePanelItemEntities,
        HidePanelCharEntities: _HidePanelCharEntities
    };
})();
(function () {
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3BlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBQ2xDLGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFDM0Msa0RBQWtEO0FBRWxELElBQUksaUJBQWlCLEdBQUcsQ0FBRTtJQUV6QixJQUFJLFNBQVMsR0FBa0UsSUFBSyxDQUFDO0lBQ3JGLElBQUksYUFBYSxHQUFZLElBQUssQ0FBQztJQUNuQyxJQUFJLGdCQUFnQixHQUFZLEtBQUssQ0FBQztJQUN0QyxJQUFJLGFBQWEsR0FBVyxFQUFFLENBQUM7SUFpQi9CLE1BQU0sS0FBSyxHQUFHLFVBQVcsV0FBb0IsRUFBRSxNQUFjLEVBQUUsc0JBQTRFO1FBSTFJLE1BQU0sV0FBVyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBRSxVQUFVLEVBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUUzRixJQUFLLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBRSxNQUFNLEVBQUUscUJBQXFCLENBQUU7WUFDM0UsTUFBTSxHQUFHLENBQUUsV0FBVyxLQUFLLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxNQUFNLEVBQUUsVUFBVSxDQUFFLENBQUM7UUFFM0csSUFBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUUsTUFBTSxDQUFFLEVBQzFDO1lBQ0MsT0FBTyxFQUFFLENBQUM7U0FDVjtRQUVELGFBQWEsR0FBRyxXQUFXLENBQUM7UUFDNUIsZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ3JHLGFBQWEsR0FBSSxRQUFRLENBQUMsY0FBYyxDQUFFLE1BQU0sQ0FB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
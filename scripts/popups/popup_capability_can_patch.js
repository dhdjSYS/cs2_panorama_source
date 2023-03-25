'use-strict';

var CapabilityCanPatch = ( function()
{
	var m_scheduleHandle = null;
	var m_isRemovePatch = false;
	var m_cP = $.GetContextPanel();
	let m_elPreviewPanel = m_cP.FindChildInLayoutFile( 'CanApplyItemModel' );
	var m_prevCameraSlot = null;

	var _Init = function()
	{
		m_isRemovePatch = ( m_cP.GetAttributeString( "asyncworktype", "(not found)" ) === "remove_patch" );

		var characterId; 
		var patchId;
		
		if ( m_isRemovePatch )
		{
			var strCharId = m_cP.GetAttributeString( "characterid", "(not found)" );
			characterId = ItemInfo.IsCharacter( strCharId ) ? strCharId : '';

			if ( !characterId )
			{
				                       
				return
			}
		}
		else
		{
			var strMsg = m_cP.GetAttributeString( "patch-and-character", "(not found)" );
			var idList = strMsg.split( ',' );
			patchId = idList[ 0 ];
			characterId = idList[ 1 ];
		}

		var oSettings = {
			panel: $.GetContextPanel().FindChildInLayoutFile( 'PopUpCanApplyHeader' ),
			itemId: characterId,
			itemToApplyId: patchId,
			isPatch: true,
			isRemove: m_isRemovePatch,
			type: 'patch',
			funcOnConfirm: _OnConfirmPressed,
			funcOnNext: _OnNextPressed,
			funcOnRemove: _OnRemovePatch
		};

		CanApplyHeader.Init( oSettings );
		
		oSettings.panel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpCanApplyPickSlot' );
		CanApplySlotInfo.UpdateEmptySlotList( characterId );
		CanApplyPickSlot.Init( oSettings );

		m_elPreviewPanel.AddClass( 'characters' );
		_SetItemModel( patchId, characterId );
		_SetUpAsyncActionBar( characterId, patchId );
		_UpdateEnableDisaleOkBtn( false );

		$.Schedule( .1, _UpdatePreviewPanelSettingsForPatchPosition.bind( undefined, characterId, CanApplySlotInfo.GetSelectedSlot()));

		$.DispatchEvent( 'CapabilityPopupIsOpen', true );
	};

	                                                                                                    
	                                        
	                                                                                                    
	var _SetItemModel = function( toolId, itemId )
	{
		if ( !InventoryAPI.IsItemInfoValid( itemId ) )
			return;
		
		InspectModelImage.Init( m_elPreviewPanel, itemId );
		m_elPreviewPanel.Data().id = itemId;

		if ( !m_isRemovePatch )
		{
			_UpdateItemDisplayInSlot( toolId, CanApplySlotInfo.GetSelectedSlot() );
		}
	};

	var _SetUpAsyncActionBar = function( itemId, toolId )
	{
		m_cP.SetAttributeString( 'toolid', toolId );
		
		var elAsyncActionBarPanel = m_cP.FindChildInLayoutFile( 'PopUpInspectAsyncBar' );
		InspectAsyncActionBar.Init(
			elAsyncActionBarPanel,
			itemId,
			_GetSettingCallback,
			_AsyncActionPerformedCallback
		);
	};
	
	var _GetSettingCallback = function( settingname, defaultvalue )
	{
		return m_cP.GetAttributeString( settingname, defaultvalue );
	};

	var _AsyncActionPerformedCallback = function()
	{
		CanApplyPickSlot.DisableBtns( m_cP.FindChildInLayoutFile( 'PopUpCanApplyPickSlot' ));
	};

	                                                                                                    
	var _UpdateItemDisplayInSlot = function( toolId, activeIndex )
	{
		$.DispatchEvent( 'CSGOPlaySoundEffect', 'sticker_nextPosition', 'MOUSE' );

		let elCharPanel = m_elPreviewPanel.FindChildInLayoutFile( "CharPreviewPanel" );
		InventoryAPI.PreviewStickerInModelPanel( toolId, activeIndex, elCharPanel );
		_CameraAnim( activeIndex );
	};

	var _OnConfirmPressed = function()
	{
		$.DispatchEvent( 'CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE' );
		_SetSelectedSlot();
		_UpdateEnableDisaleOkBtn( true );
	}

	var _OnNextPressed = function( itemToApplyId, activeSlot )
	{
		_UpdateEnableDisaleOkBtn( false );
		_UpdateItemDisplayInSlot( itemToApplyId, activeSlot );
	}

	var _OnRemovePatch = function( slotIndex )
	{
		_CameraAnim( slotIndex );
		_SetSelectedSlot();
		_UpdateEnableDisaleOkBtn( true );
	}

	var _SetSelectedSlot = function()
	{
		m_cP.SetAttributeString( 'selectedItemToApplySlot', CanApplySlotInfo.GetSelectedSlot() );
	}

	var _UpdateEnableDisaleOkBtn = function( bEnable )
	{
		var elAsyncActionBarPanel = m_cP.FindChildInLayoutFile( 'PopUpInspectAsyncBar' );
		InspectAsyncActionBar.EnableDisableOkBtn( elAsyncActionBarPanel, bEnable );
	}
	                                                                                                    
	         
	                                                                                                    
	var m_cameraRules = [
		{ weapontype: 'weapon_elite', slotsForSecondCamera: [ 2, 3 ], cameraPreset: 1 },
		{ weapontype: 'weapon_revolver', slotsForSecondCamera: [ 4 ], cameraPreset: 1 },
		{ weapontype: 'weapon_nova', slotsForSecondCamera: [ 1, 2, 3 ], cameraPreset: 1 },
		{ weapontype: 'weapon_m249', slotsForSecondCamera: [ 3 ], cameraPreset: 1 }
	];

	var _CameraAnim = function( activeIndex )
	{
		if (( m_prevCameraSlot == activeIndex || activeIndex == -1 ) && m_prevCameraSlot !== null )
			return;
		
		if ( !InventoryAPI.IsItemInfoValid( m_elPreviewPanel.Data().id ) )
			return;

		InventoryAPI.HighlightPatchBySlot( activeIndex );
		_UpdatePreviewPanelSettingsForPatchPosition( m_elPreviewPanel.Data().id, activeIndex );
		m_prevCameraSlot = activeIndex;
	};


	function _UpdatePreviewPanelSettingsForPatchPosition ( charItemId, activeIndex = 0 )
	{
		var patchPosition = InventoryAPI.GetCharacterPatchPosition( charItemId, activeIndex );

		var loadoutslot;

		switch ( patchPosition )
		{
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

		                                           
		                                       

		const charTeam = ItemInfo.GetTeam( m_elPreviewPanel.Data().id );
		let setting_team = charTeam.search( 'Team_CT' ) !== -1 ? 'ct' : 't';
		InspectModelImage.SetCharScene( m_elPreviewPanel, m_elPreviewPanel.Data().id, LoadoutAPI.GetItemID( setting_team, loadoutslot ) );

		patchPosition = !patchPosition ? 'wide_intro' : patchPosition;
		m_elPreviewPanel.FindChildInLayoutFile( "CharPreviewPanel" ).TransitionToCamera( 'cam_char_inspect_'+ patchPosition, 0 );
	}

	function _UpdatePreviewPanelCameraAndLightingForPatch ( elPanel, charItemId, activeIndex = 0 )
	{
		var patchPosition = InventoryAPI.GetCharacterPatchPosition( charItemId, activeIndex );

		var angle = 0;
		var lightpos = undefined;
		var lightang = undefined;
		var lightbrt = 0.5;

		var lightpos_torso = [ 51.10, -9.16, 72.78 ];
		var lightang_torso = [ 23.98, 166.50, 0.00 ];
		var campos_torso = [ 189.90, -28.08, 46.37 ];
		var camang_torso = [ -2.06, 171.74, 0.00 ];
		
		var lightpos_mid = [ 50.15, -10.03, 70.19 ];
		var lightang_mid = [ 23.98, 166.50, 0.00 ];
		var campos_mid = [ 188.43, -25.44, 38.53 ];
		var camang_mid = [ -2.06, 171.74, 0.00 ];

		var lightpos_legs = [ 50.15, -10.03, 50.19 ];
		var lightang_legs = [ 23.98, 166.50, 0.00 ];
		var campos_legs = [ 188.43, -25.44, 18.53 ];
		var camang_legs = [ -2.06, 171.74, 0.00 ];

		switch ( patchPosition )
		{
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

	}

	                                                                                                    
	var _ClosePopUp = function()
	{
		_CancelHandleForTimeout();
		
		var elAsyncActionBarPanel = m_cP.FindChildInLayoutFile( 'PopUpInspectAsyncBar' );

		if( !elAsyncActionBarPanel.BHasClass( 'hidden' ))
		{
			InspectAsyncActionBar.OnEventToClose();
		}
	};

	var _CancelWaitforCallBack = function()
	{
		                                                                              
		                                                                                   
		                                                                                 
		                           
		m_scheduleHandle = null;
		_ClosePopUp();

		UiToolkitAPI.ShowGenericPopupOk(
			$.Localize( '#SFUI_SteamConnectionErrorTitle' ),
			$.Localize( '#SFUI_InvError_Item_Not_Given' ),
			'',
			function()
			{
			},
			function()
			{
			}
		);
	};

	var _OnPatchRemoveFinished = function( itemId )
	{
		_CancelHandleForTimeout();

		if ( !m_cP )
			return;

		                                                 
		InspectModelImage.Init( m_elPreviewPanel, m_elPreviewPanel.Data().id );
		CanApplyPickSlot.ShowItemIconsToRemove( {
			panel: $.GetContextPanel().FindChildInLayoutFile( 'PopUpCanApplyPickSlot' ),
			itemId: itemId,
			funcOnRemove: _OnRemovePatch
		} );

		_CameraAnim( CanApplySlotInfo.GetSelectedSlot() );
	};

	var _CancelHandleForTimeout = function()
	{
		if ( m_scheduleHandle !== null )
		{
			                                                                        
			$.CancelScheduled( m_scheduleHandle );
			m_scheduleHandle = null;
		}
	};
	
	return {
		Init: 											_Init,
		ClosePopUp: 									_ClosePopUp,
		OnPatchRemoveFinished:							_OnPatchRemoveFinished,
		UpdatePreviewPanelCameraAndLightingForPatch: 	_UpdatePreviewPanelCameraAndLightingForPatch,
		UpdatePreviewPanelSettingsForPatchPosition:		_UpdatePreviewPanelSettingsForPatchPosition,
	};
} )();

( function()
{
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_InventoryUpdated', CapabilityCanPatch.OnPatchRemoveFinished );
} )();
